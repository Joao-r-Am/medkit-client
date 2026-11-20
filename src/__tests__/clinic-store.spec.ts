import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MembershipStatus } from "@/interfaces/clinic";
import { cached } from "@/services/queries";

const { myClinicsMock, selectClinicMock, createClinicMock, acceptMock } =
  vi.hoisted(() => ({
    myClinicsMock: vi.fn(),
    selectClinicMock: vi.fn(),
    createClinicMock: vi.fn(),
    acceptMock: vi.fn()
  }));

// O setup global mocka o store; aqui usamos o store real.
vi.mock("@/stores/clinic", async importOriginal => ({
  ...(await importOriginal())
}));

vi.mock("@/services", () => ({
  default: {
    clinics: { myClinics: myClinicsMock, createClinic: createClinicMock },
    auth: { selectClinic: selectClinicMock },
    invitations: { accept: acceptMock }
  }
}));

async function loadStore() {
  const { useClinicStore } = await import("@/stores/clinic");
  return useClinicStore();
}

function membership(overrides: Record<string, unknown> = {}) {
  return {
    membership_id: "m1",
    status: MembershipStatus.ACTIVE,
    clinic: { id: "c1", name: "Clínica X" },
    roles: [{ id: "r1", name: "owner" }],
    ...overrides
  };
}

describe("stores/clinic", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    myClinicsMock.mockReset();
    selectClinicMock.mockReset();
    createClinicMock.mockReset();
    localStorage.clear();
  });

  it("carrega os vínculos e marca como carregado", async () => {
    myClinicsMock.mockResolvedValue([membership()]);

    const store = await loadStore();
    await store.fetchMyClinics();

    expect(store.state.memberships).toHaveLength(1);
    expect(store.state.loaded).toBe(true);
    expect(store.state.loading).toBe(false);
    expect(store.state.error).toBeNull();
  });

  it("usa cache em memória e não repete a chamada", async () => {
    myClinicsMock.mockResolvedValue([membership()]);

    const store = await loadStore();
    await store.fetchMyClinics();
    await store.fetchMyClinics();

    expect(myClinicsMock).toHaveBeenCalledTimes(1);
  });

  it("force refaz a chamada mesmo já carregado", async () => {
    myClinicsMock.mockResolvedValue([membership()]);

    const store = await loadStore();
    await store.fetchMyClinics();
    await store.fetchMyClinics(true);

    expect(myClinicsMock).toHaveBeenCalledTimes(2);
  });

  it("erro zera a lista e expõe mensagem", async () => {
    myClinicsMock.mockRejectedValue(new Error("boom"));

    const store = await loadStore();
    await store.fetchMyClinics();

    expect(store.state.memberships).toEqual([]);
    expect(store.state.error).toBe("Não foi possível carregar suas clínicas.");
    expect(store.state.loading).toBe(false);
  });

  it("activeMemberships mantém só vínculos ativos", async () => {
    myClinicsMock.mockResolvedValue([
      membership(),
      membership({ membership_id: "m2", status: MembershipStatus.SUSPENDED }),
      membership({ membership_id: "m3", status: MembershipStatus.REMOVED })
    ]);

    const store = await loadStore();
    await store.fetchMyClinics();

    const active = store.activeMemberships();
    expect(active).toHaveLength(1);
    expect(active[0]?.membership_id).toBe("m1");
  });

  it("$reset limpa o contexto de clínica", async () => {
    myClinicsMock.mockResolvedValue([membership()]);

    const store = await loadStore();
    await store.fetchMyClinics();
    store.$reset();

    expect(store.state.memberships).toEqual([]);
    expect(store.state.loaded).toBe(false);
    expect(store.state.error).toBeNull();
  });

  describe("selectMembership", () => {
    it("troca o token, persiste o contexto e encerra a seleção pendente", async () => {
      myClinicsMock.mockResolvedValue([membership()]);
      selectClinicMock.mockResolvedValue({
        data: {
          data: {
            token: "tenant-token",
            membership_id: "m1",
            clinic_id: "c1",
            clinic: { id: "c1", name: "Clínica X" }
          }
        },
        error: null
      });

      const store = await loadStore();
      await store.fetchMyClinics();
      await store.selectMembership("m1");

      expect(selectClinicMock).toHaveBeenCalledWith({ membership_id: "m1" });
      expect(store.state.activeContext).toEqual({
        membership_id: "m1",
        clinic_id: "c1",
        clinic: { id: "c1", name: "Clínica X" }
      });
      expect(store.state.selecting).toBe(false);
      expect(localStorage.getItem("token")).toBe("tenant-token");
      expect(JSON.parse(localStorage.getItem("clinic")!)).toEqual(
        store.state.activeContext
      );
    });

    it("erro da API não altera o contexto ativo", async () => {
      myClinicsMock.mockResolvedValue([membership()]);
      selectClinicMock.mockResolvedValue({
        data: {},
        error: { status: 403, statusText: "Forbidden" }
      });

      const store = await loadStore();
      await store.fetchMyClinics();

      await expect(store.selectMembership("m1")).rejects.toThrow(
        "Não foi possível selecionar a clínica."
      );
      expect(store.state.activeContext).toBeNull();
    });

    it("vínculo inexistente lança erro sem chamar a API", async () => {
      const store = await loadStore();
      await expect(store.selectMembership("m-west")).rejects.toThrow(
        "Vínculo não encontrado."
      );
      expect(selectClinicMock).not.toHaveBeenCalled();
    });
  });

  describe("resolveClinicRoute", () => {
    it("contexto previamente ativo e ainda válido entra direto", async () => {
      myClinicsMock.mockResolvedValue([membership()]);
      localStorage.setItem(
        "clinic",
        JSON.stringify({
          membership_id: "m1",
          clinic_id: "c1",
          clinic: { id: "c1" }
        })
      );

      const store = await loadStore();
      await expect(store.resolveClinicRoute()).resolves.toBe("/");
      expect(selectClinicMock).not.toHaveBeenCalled();
    });

    it("contexto stale (o vínculo não existe mais) é descartado e vai para /profile", async () => {
      myClinicsMock.mockResolvedValue([]);
      localStorage.setItem(
        "clinic",
        JSON.stringify({
          membership_id: "m9",
          clinic_id: "c9",
          clinic: null
        })
      );

      const store = await loadStore();
      await expect(store.resolveClinicRoute()).resolves.toBe("/profile");
      expect(store.state.activeContext).toBeNull();
      expect(localStorage.getItem("clinic")).toBeNull();
    });

    it("um único vínculo auto-seleciona e entra direto", async () => {
      myClinicsMock.mockResolvedValue([membership()]);
      selectClinicMock.mockResolvedValue({
        data: {
          data: {
            token: "t2",
            membership_id: "m1",
            clinic_id: "c1",
            clinic: { id: "c1" }
          }
        },
        error: null
      });

      const store = await loadStore();
      await expect(store.resolveClinicRoute()).resolves.toBe("/");
      expect(store.state.activeContext?.membership_id).toBe("m1");
      expect(selectClinicMock).toHaveBeenCalledTimes(1);
    });

    it("mais de um vínculo vai para seleção e marca a pendência", async () => {
      myClinicsMock.mockResolvedValue([
        membership(),
        membership({
          membership_id: "m2",
          clinic: { id: "c2", name: "Clínica Y" }
        })
      ]);

      const store = await loadStore();
      await expect(store.resolveClinicRoute()).resolves.toBe("/clinics");
      expect(store.state.selecting).toBe(true);
      expect(store.state.activeContext).toBeNull();
      expect(selectClinicMock).not.toHaveBeenCalled();
    });

    it("nenhum vínculo vai para /profile (perfil com aba de clínicas)", async () => {
      myClinicsMock.mockResolvedValue([]);
      selectClinicMock.mockResolvedValue({
        data: {
          data: {
            token: "t3",
            membership_id: "mn",
            clinic_id: "cn",
            clinic: { id: "cn" }
          }
        },
        error: null
      });

      const store = await loadStore();
      await expect(store.resolveClinicRoute()).resolves.toBe("/profile");
      expect(store.state.selecting).toBe(false);
    });

    it("auto-seleção falhando cai em /profile", async () => {
      myClinicsMock.mockResolvedValue([membership()]);
      selectClinicMock.mockRejectedValue(new Error("boom"));

      const store = await loadStore();
      await expect(store.resolveClinicRoute()).resolves.toBe("/profile");
      expect(store.state.activeContext).toBeNull();
    });
  });

  describe("createClinic", () => {
    it("cria a clínica, recarrega os vínculos e entra nela", async () => {
      createClinicMock.mockResolvedValue({
        clinic: { id: "c9", name: "Clínica Nova" },
        membership: { id: "m9", status: "active" },
        roles: [{ id: "r9", name: "owner" }]
      });
      myClinicsMock.mockResolvedValue([
        membership({
          membership_id: "m9",
          clinic: { id: "c9", name: "Clínica Nova" }
        })
      ]);
      selectClinicMock.mockResolvedValue({
        data: {
          data: {
            token: "t9",
            membership_id: "m9",
            clinic_id: "c9",
            clinic: { id: "c9", name: "Clínica Nova" }
          }
        },
        error: null
      });

      const store = await loadStore();
      await store.createClinic({
        name: "Clínica Nova",
        cnpjf: "12345678000195",
        email: "contato@clinic.com"
      });

      expect(createClinicMock).toHaveBeenCalledWith({
        name: "Clínica Nova",
        cnpjf: "12345678000195",
        email: "contato@clinic.com"
      });
      expect(selectClinicMock).toHaveBeenCalledWith({ membership_id: "m9" });
      expect(store.state.activeContext?.clinic_id).toBe("c9");
    });
  });

  describe("acceptInvitation", () => {
    beforeEach(() => {
      acceptMock.mockReset();
      localStorage.setItem("pending-invite-token", "tok");
    });

    it("aceita o convite, limpa o token pendente e entra na clínica", async () => {
      acceptMock.mockResolvedValue({
        clinic: { id: "c1", name: "Clínica X" },
        membership: { id: "m1", status: "active" },
        roles: [{ id: "r1", name: "professional" }]
      });
      myClinicsMock.mockResolvedValue([membership()]);
      selectClinicMock.mockResolvedValue({
        data: {
          data: {
            token: "tenant",
            membership_id: "m1",
            clinic_id: "c1",
            clinic: { id: "c1", name: "Clínica X" }
          }
        },
        error: null
      });

      const store = await loadStore();
      const target = await store.acceptInvitation("tok");

      expect(acceptMock).toHaveBeenCalledWith("tok");
      expect(target).toBe("/");
      expect(localStorage.getItem("pending-invite-token")).toBeNull();
      expect(store.state.activeContext?.clinic_id).toBe("c1");
      expect(localStorage.getItem("token")).toBe("tenant");
    });

    it("mantém o convite pendente quando o aceite falha", async () => {
      acceptMock.mockRejectedValue(new Error("boom"));

      const store = await loadStore();

      await expect(store.acceptInvitation("tok")).rejects.toThrow("boom");
      expect(localStorage.getItem("pending-invite-token")).toBe("tok");
    });

    it("volta para /clinics quando não consegue selecionar o vínculo", async () => {
      acceptMock.mockResolvedValue({
        clinic: { id: "c1", name: "Clínica X" },
        membership: { id: "m1", status: "active" },
        roles: []
      });
      myClinicsMock.mockResolvedValue([membership()]);
      selectClinicMock.mockResolvedValue({ data: null, error: new Error("x") });

      const store = await loadStore();
      const target = await store.acceptInvitation("tok");

      expect(target).toBe("/clinics");
    });
  });

  describe("cache de consultas", () => {
    it("limpa o cache ao selecionar uma clínica", async () => {
      myClinicsMock.mockResolvedValue([membership()]);
      selectClinicMock.mockResolvedValue({
        data: {
          data: {
            token: "tenant",
            membership_id: "m1",
            clinic_id: "c1",
            clinic: { id: "c1", name: "Clínica X" }
          }
        },
        error: null
      });

      const fetcher = vi.fn().mockResolvedValue("dado");
      await cached("cache:select-membership", fetcher);

      const store = await loadStore();
      await store.fetchMyClinics();
      await store.selectMembership("m1");

      await cached("cache:select-membership", fetcher);
      expect(fetcher).toHaveBeenCalledTimes(2);
    });

    it("limpa o cache no reset (logout)", async () => {
      const fetcher = vi.fn().mockResolvedValue("dado");
      await cached("cache:reset-store", fetcher);

      const store = await loadStore();
      store.$reset();

      await cached("cache:reset-store", fetcher);
      expect(fetcher).toHaveBeenCalledTimes(2);
    });
  });
});
