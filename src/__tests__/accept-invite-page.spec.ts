import { flushPromises, mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  acceptInvitationMock,
  currentRouteMock,
  invitationPreviewMock,
  notifyMock,
  pushMock
} from "@/__tests__/setup";

vi.mock("@/components/layout/AppLayout.vue", () => ({
  default: { template: "<div><slot /></div>", props: ["title"] }
}));

const stubs = {
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
  QSpinner: {
    template: '<div data-testid="spinner" />',
    props: ["color", "size"]
  },
  QBanner: { template: "<div><slot /></div>" }
};

const previewPayload = {
  clinic: { name: "Clínica X" },
  role: { name: "professional" },
  invited_by: "Ana",
  email: "novo@medkit.com",
  expires_at: "2026-12-01T00:00:00.000Z"
};

async function mountPage() {
  const { default: AcceptInvitePage } =
    await import("@/pages/accept-invite/[token].vue");
  return mount(AcceptInvitePage, {
    global: { stubs }
  });
}

describe("pages/accept-invite", () => {
  beforeEach(() => {
    currentRouteMock.value = {
      path: "/accept-invite/tok-123",
      params: { token: "tok-123" }
    } as never;
    localStorage.clear();
    invitationPreviewMock.mockReset();
    acceptInvitationMock.mockReset();
    notifyMock.mockReset();
    pushMock.mockReset();
  });

  it("mostra carregamento antes da prévia", async () => {
    invitationPreviewMock.mockReturnValue(new Promise(() => {}));

    const wrapper = await mountPage();

    expect(wrapper.find('[data-testid="spinner"]').exists()).toBe(true);
    wrapper.unmount();
  });

  it("explica convite expirado (410)", async () => {
    invitationPreviewMock.mockRejectedValue({ response: { status: 410 } });

    const wrapper = await mountPage();
    await flushPromises();

    expect(wrapper.text()).toContain("Este convite expirou");
    wrapper.unmount();
  });

  it("explica convite não encontrado (404)", async () => {
    invitationPreviewMock.mockRejectedValue({ response: { status: 404 } });

    const wrapper = await mountPage();
    await flushPromises();

    expect(wrapper.text()).toContain("Convite não encontrado");
    wrapper.unmount();
  });

  it("sem sessão, pede login e guarda o token para o pós-login", async () => {
    invitationPreviewMock.mockResolvedValue(previewPayload);

    const wrapper = await mountPage();
    await flushPromises();

    expect(wrapper.text()).toContain("Clínica X");
    expect(wrapper.text()).toContain("novo@medkit.com");
    expect(wrapper.text()).toContain("Profissional");
    expect(wrapper.find('[data-test="login-required"]').exists()).toBe(true);

    await wrapper.find('[data-test="go-to-auth"]').trigger("click");

    expect(localStorage.getItem("pending-invite-token")).toBe("tok-123");
    expect(pushMock).toHaveBeenCalledWith("/auth");
    wrapper.unmount();
  });

  it("com sessão aceita o convite e navega para a clínica", async () => {
    localStorage.setItem("token", "jwt");
    invitationPreviewMock.mockResolvedValue(previewPayload);
    acceptInvitationMock.mockResolvedValue("/");

    const wrapper = await mountPage();
    await flushPromises();

    await wrapper.find('[data-test="accept-invite"]').trigger("click");
    await flushPromises();

    expect(acceptInvitationMock).toHaveBeenCalledWith("tok-123");
    expect(pushMock).toHaveBeenCalledWith("/");
    expect(notifyMock).toHaveBeenCalledWith(
      expect.objectContaining({ type: "positive" })
    );
    wrapper.unmount();
  });

  it("explica e-mail divergente no aceite", async () => {
    localStorage.setItem("token", "jwt");
    invitationPreviewMock.mockResolvedValue(previewPayload);
    acceptInvitationMock.mockRejectedValue({
      response: { status: 403, data: { code: "INVITATION_EMAIL_MISMATCH" } }
    });

    const wrapper = await mountPage();
    await flushPromises();

    await wrapper.find('[data-test="accept-invite"]').trigger("click");
    await flushPromises();

    expect(notifyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "negative",
        message: expect.stringContaining("emitido para novo@medkit.com")
      })
    );
    wrapper.unmount();
  });
});
