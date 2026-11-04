import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MembershipStatus } from "@/interfaces/clinic";

const { myClinicsMock } = vi.hoisted(() => ({
  myClinicsMock: vi.fn()
}));

vi.mock("@/services", () => ({
  default: { clinics: { myClinics: myClinicsMock } }
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
});
