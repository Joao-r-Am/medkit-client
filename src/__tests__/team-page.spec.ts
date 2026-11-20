import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { notifyMock } from "@/__tests__/setup";

const { listMock, resendMock, revokeMock, rolesMock, createInvitationMock } =
  vi.hoisted(() => ({
    listMock: vi.fn(),
    resendMock: vi.fn(),
    revokeMock: vi.fn(),
    rolesMock: vi.fn(),
    createInvitationMock: vi.fn()
  }));

// O setup global mocka o store; a página usa o store real (clinic_id via
// contexto persistido no localStorage).
vi.mock("@/stores/clinic", async importOriginal => ({
  ...(await importOriginal())
}));

vi.mock("@/services", () => ({
  default: {
    invitations: {
      list: listMock,
      resend: resendMock,
      revoke: revokeMock,
      create: createInvitationMock
    },
    clinics: { roles: rolesMock }
  }
}));

vi.mock("@/components/layout/AppLayout.vue", () => ({
  default: { template: "<div><slot /></div>", props: ["title"] }
}));

const stubs = {
  QCard: { template: "<div><slot /></div>" },
  QBtn: {
    template:
      '<button v-bind="$attrs" @click="$emit(\'click\')">{{ label }}<slot /></button>',
    props: [
      "label",
      "icon",
      "flat",
      "dense",
      "outline",
      "unelevated",
      "noCaps",
      "color",
      "loading"
    ],
    emits: ["click"]
  },
  QIcon: { template: "<span />", props: ["name", "size", "color"] },
  QChip: {
    template: "<span><slot /></span>",
    props: ["color", "textColor", "dense", "noCaps", "outline"]
  },
  QSkeleton: {
    template: '<div data-testid="skeleton" />',
    props: ["type", "width", "height"]
  },
  QSelect: {
    props: ["modelValue", "options", "optionLabel", "optionValue", "label"],
    emits: ["update:modelValue"],
    template:
      '<div><button v-for="o in options" :key="o.value" @click="$emit(\'update:modelValue\', o.value)">{{ o.label }}</button></div>'
  },
  QDialog: {
    props: ["modelValue"],
    template: "<div><slot /></div>"
  }
};

async function mountPage() {
  const { default: TeamPage } = await import("@/pages/team.vue");
  return mount(TeamPage, {
    global: { stubs }
  });
}

function invitation(overrides: Record<string, unknown> = {}) {
  return {
    id: "i1",
    clinic_id: "c1",
    email: "membro@medkit.com",
    status: "pending",
    expires_at: new Date(Date.now() + 86_400_000).toISOString(),
    accepted_at: null,
    role: { id: "r1", name: "professional" },
    invited_by: { id: "u1", name: "Ana" },
    ...overrides
  };
}

describe("pages/team", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    listMock.mockReset();
    resendMock.mockReset();
    revokeMock.mockReset();
    rolesMock.mockReset();
    createInvitationMock.mockReset();
    notifyMock.mockReset();
    localStorage.clear();
    localStorage.setItem(
      "clinic",
      JSON.stringify({
        membership_id: "m1",
        clinic_id: "c1",
        clinic: { id: "c1", name: "Clínica X", max_users: 5 }
      })
    );
  });

  it("mostra skeletons enquanto carrega", async () => {
    listMock.mockReturnValue(new Promise(() => {}));

    const wrapper = await mountPage();

    expect(wrapper.find('[data-testid="skeleton"]').exists()).toBe(true);
    wrapper.unmount();
  });

  it("mostra estado vazio com ação de convidar", async () => {
    listMock.mockResolvedValue([]);

    const wrapper = await mountPage();
    await flushPromises();

    expect(wrapper.text()).toContain("Nenhum convite ainda");
    expect(wrapper.find('[data-test="empty-invite"]').exists()).toBe(true);
    wrapper.unmount();
  });

  it("lista convites com papel, convidante e status derivado", async () => {
    listMock.mockResolvedValue([
      invitation(),
      invitation({
        id: "i2",
        email: "velho@medkit.com",
        expires_at: "2020-01-01T00:00:00.000Z"
      }),
      invitation({ id: "i3", status: "accepted", email: "ok@medkit.com" })
    ]);

    const wrapper = await mountPage();
    await flushPromises();

    expect(wrapper.text()).toContain("membro@medkit.com");
    expect(wrapper.text()).toContain("Profissional");
    expect(wrapper.text()).toContain("Convidado por Ana");
    expect(wrapper.text()).toContain("Pendente");
    expect(wrapper.text()).toContain("Expirado");
    expect(wrapper.text()).toContain("Aceito");
    expect(wrapper.find('[data-test="resend-i3"]').exists()).toBe(false);
    wrapper.unmount();
  });

  it("filtra por status", async () => {
    listMock.mockResolvedValue([
      invitation(),
      invitation({ id: "i2", status: "accepted", email: "aceito@medkit.com" })
    ]);

    const wrapper = await mountPage();
    await flushPromises();

    const acceptedFilter = wrapper
      .findAll("button")
      .find(button => button.text() === "Aceitos")!;
    await acceptedFilter.trigger("click");

    expect(wrapper.text()).toContain("aceito@medkit.com");
    expect(wrapper.text()).not.toContain("membro@medkit.com");
    wrapper.unmount();
  });

  it("reenvia o convite e recarrega a lista", async () => {
    listMock.mockResolvedValue([invitation()]);
    resendMock.mockResolvedValue(invitation());

    const wrapper = await mountPage();
    await flushPromises();

    await wrapper.find('[data-test="resend-i1"]').trigger("click");
    await flushPromises();

    expect(resendMock).toHaveBeenCalledWith("c1", "i1");
    expect(listMock).toHaveBeenCalledTimes(2);
    expect(notifyMock).toHaveBeenCalledWith(
      expect.objectContaining({ type: "positive" })
    );
    wrapper.unmount();
  });

  it("revoga após confirmação e recarrega a lista", async () => {
    listMock.mockResolvedValue([invitation()]);
    revokeMock.mockResolvedValue(invitation({ status: "revoked" }));

    const wrapper = await mountPage();
    await flushPromises();

    await wrapper.find('[data-test="revoke-i1"]').trigger("click");
    await wrapper.find('[data-test="confirm-revoke"]').trigger("click");
    await flushPromises();

    expect(revokeMock).toHaveBeenCalledWith("c1", "i1");
    expect(listMock).toHaveBeenCalledTimes(2);
    wrapper.unmount();
  });

  it("exibe o limite de usuários da clínica ativa", async () => {
    listMock.mockResolvedValue([]);

    const wrapper = await mountPage();
    await flushPromises();

    expect(wrapper.find('[data-test="team-limit"]').text()).toContain(
      "Limite da clínica: 5 usuários"
    );
    wrapper.unmount();
  });

  it("não exibe limite quando a clínica não define max_users", async () => {
    localStorage.setItem(
      "clinic",
      JSON.stringify({
        membership_id: "m1",
        clinic_id: "c1",
        clinic: { id: "c1", name: "Clínica X" }
      })
    );
    listMock.mockResolvedValue([]);

    const wrapper = await mountPage();
    await flushPromises();

    expect(wrapper.find('[data-test="team-limit"]').exists()).toBe(false);
    wrapper.unmount();
  });

  it("mostra erro com opção de tentar novamente", async () => {
    listMock.mockRejectedValue(new Error("boom"));

    const wrapper = await mountPage();
    await flushPromises();

    expect(wrapper.text()).toContain("Não foi possível carregar os convites.");
    listMock.mockResolvedValue([invitation()]);
    await wrapper
      .findAll("button")
      .find(button => button.text().includes("Tentar novamente"))!
      .trigger("click");
    await flushPromises();

    expect(wrapper.text()).toContain("membro@medkit.com");
    wrapper.unmount();
  });
});
