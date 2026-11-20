import { flushPromises, mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { notifyMock } from "@/__tests__/setup";

const { rolesMock, createMock } = vi.hoisted(() => ({
  rolesMock: vi.fn(),
  createMock: vi.fn()
}));

vi.mock("@/stores/clinic", () => ({
  useClinicStore: () => ({
    state: { activeContext: { membership_id: "m1", clinic_id: "c1" } }
  })
}));

vi.mock("@/services", () => ({
  default: {
    clinics: { roles: rolesMock },
    invitations: { create: createMock }
  }
}));

const stubs = {
  QDialog: { template: "<div><slot /></div>" },
  QCard: { template: "<div><slot /></div>" },
  QCardSection: { template: "<div><slot /></div>" },
  QCardActions: { template: "<div><slot /></div>" },
  QForm: {
    template:
      "<form @submit.prevent=\"$emit('submit', $event)\"><slot /></form>",
    emits: ["submit"]
  },
  QInput: {
    props: ["modelValue", "label", "type", "rules"],
    emits: ["update:modelValue"],
    template:
      '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />'
  },
  QSelect: {
    props: ["modelValue", "options", "label", "rules"],
    emits: ["update:modelValue"],
    template:
      '<div><button type="button" v-for="o in options" :key="o.value" @click="$emit(\'update:modelValue\', o.value)">{{ o.label }}</button></div>'
  },
  QBtn: {
    template:
      "<button :type=\"type || 'button'\" @click=\"$emit('click')\">{{ label }}</button>",
    props: ["label", "icon", "flat", "type", "loading"],
    emits: ["click"]
  }
};

async function mountDialog() {
  const { default: InviteDialog } =
    await import("@/components/team/InviteDialog.vue");
  return mount(InviteDialog, {
    props: { modelValue: true },
    global: { stubs }
  });
}

describe("components/team/InviteDialog", () => {
  beforeEach(() => {
    rolesMock.mockReset();
    createMock.mockReset();
    notifyMock.mockReset();
    rolesMock.mockResolvedValue([
      { id: "r-owner", name: "owner", is_system: true },
      { id: "r-admin", name: "admin", is_system: true },
      { id: "r-prof", name: "professional", is_system: true },
      { id: "r-custom", name: "custom", is_system: false }
    ]);
  });

  it("oferece só papéis de sistema convidáveis (sem owner)", async () => {
    const wrapper = await mountDialog();
    await flushPromises();

    const buttons = wrapper.findAll("button").map(button => button.text());
    expect(buttons).toContain("Administrador");
    expect(buttons).toContain("Profissional");
    expect(buttons).not.toContain("Proprietário");
    expect(buttons).not.toContain("custom");
    wrapper.unmount();
  });

  it("envia e-mail normalizado e papel selecionado", async () => {
    createMock.mockResolvedValue({ id: "i1" });

    const wrapper = await mountDialog();
    await flushPromises();

    await wrapper
      .find('[data-test="invite-email"]')
      .setValue("  Novo@MedKit.com ");
    await wrapper
      .findAll("button")
      .find(button => button.text() === "Profissional")!
      .trigger("click");
    await wrapper.find("form").trigger("submit");
    await flushPromises();

    expect(createMock).toHaveBeenCalledWith("c1", {
      email: "novo@medkit.com",
      role_id: "r-prof"
    });
    expect(notifyMock).toHaveBeenCalledWith(
      expect.objectContaining({ type: "positive" })
    );
    wrapper.unmount();
  });

  it("traduz convite pendente duplicado", async () => {
    createMock.mockRejectedValue({
      response: { status: 409, data: { code: "INVITATION_PENDING" } }
    });

    const wrapper = await mountDialog();
    await flushPromises();

    await wrapper.find('[data-test="invite-email"]').setValue("a@b.com");
    await wrapper
      .findAll("button")
      .find(
        button =>
          button.text() === "Operador" || button.text() === "Profissional"
      )!
      .trigger("click");
    await wrapper.find("form").trigger("submit");
    await flushPromises();

    expect(notifyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "negative",
        message: "Já existe um convite pendente para este e-mail."
      })
    );
    wrapper.unmount();
  });

  it("exibe o limite da clínica quando a API rejeita por TEAM_LIMIT_REACHED", async () => {
    createMock.mockRejectedValue({
      response: {
        status: 403,
        data: { code: "TEAM_LIMIT_REACHED", details: { max_users: 2 } }
      }
    });

    const wrapper = await mountDialog();
    await flushPromises();

    await wrapper.find('[data-test="invite-email"]').setValue("a@b.com");
    await wrapper
      .findAll("button")
      .find(
        button =>
          button.text() === "Operador" || button.text() === "Profissional"
      )!
      .trigger("click");
    await wrapper.find("form").trigger("submit");
    await flushPromises();

    expect(notifyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "negative",
        message: "Limite de 2 usuários da clínica atingido."
      })
    );
    wrapper.unmount();
  });

  it("prioriza o código específico do erro sobre o 403 genérico", async () => {
    createMock.mockRejectedValue({
      response: {
        status: 403,
        data: { code: "ROLE_NOT_ADMINISTRABLE" }
      }
    });

    const wrapper = await mountDialog();
    await flushPromises();

    await wrapper.find('[data-test="invite-email"]').setValue("a@b.com");
    await wrapper
      .findAll("button")
      .find(
        button =>
          button.text() === "Operador" || button.text() === "Profissional"
      )!
      .trigger("click");
    await wrapper.find("form").trigger("submit");
    await flushPromises();

    expect(notifyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "negative",
        message: "Você não pode conceder permissões que excedem as suas."
      })
    );
    wrapper.unmount();
  });
});
