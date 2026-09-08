import { vi } from "vitest";

export const notifyMock = vi.fn();
export const pushMock = vi.fn().mockResolvedValue(undefined);
export const setCurrentUserMock = vi.fn();

export const loginMock = vi.fn();
export const registerMock = vi.fn();
export const findByCnpjfOrUsernameMock = vi.fn();

vi.mock("quasar", () => ({
  useQuasar: () => ({
    notify: notifyMock
  }),
  QInput: { name: "QInput", template: "<div><slot /></div>" },
  QBtn: { name: "QBtn", template: "<button><slot /></button>" },
  QForm: {
    name: "QForm",
    template: "<form><slot /></form>",
    props: ["greedy"]
  },
  QSelect: { name: "QSelect", template: "<div><slot /></div>" },
  QIcon: { name: "QIcon", template: "<span />" },
  QItem: { name: "QItem", template: "<div><slot /></div>" },
  QItemSection: {
    name: "QItemSection",
    template: "<div><slot /></div>"
  },
  Notify: { install: vi.fn() }
}));

vi.mock("vue-router", () => ({
  useRouter: () => ({
    push: pushMock
  })
}));

vi.mock("@/stores/user", () => ({
  useUserStore: () => ({
    setCurrentUser: setCurrentUserMock,
    state: { currentUser: {} },
    cleanCurrentUser: vi.fn(),
    setApiKey: vi.fn()
  })
}));

vi.mock("@/services", () => ({
  default: {
    auth: {
      login: loginMock,
      register: registerMock,
      findByCnpjfOrUsername: findByCnpjfOrUsernameMock
    }
  }
}));

vi.mock("@/utils/validators", () => ({
  validateEmptyAndLength3: vi.fn((v: string) => {
    if (!v) return "*Este campo é obrigatório";
    if (v.length < 3) return "*Mínimo 3 caracteres";
    return true;
  }),
  validateEmptyAndEmail: vi.fn((v: string) => {
    if (!v) return "*Este campo é obrigatório";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return "*E-mail inválido";
    return true;
  }),
  validateEmpty: vi.fn((v: string) => {
    if (!v) return "*Este campo é obrigatório";
    return true;
  }),
  validateEmailOrDocument: vi.fn((v: string) => {
    if (!v) return "*Informe e-mail ou documento";
    if (v.includes("@")) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return "*E-mail inválido";
    }
    return true;
  }),
  formatDocument: vi.fn((v: string) => v),
  stripDocumentFormatting: vi.fn((v: string) => v.replace(/\D/g, ""))
}));
