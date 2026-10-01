import { vi } from "vitest";

export const notifyMock = vi.fn();
export const pushMock = vi.fn().mockResolvedValue(undefined);
export const currentRouteMock = { value: { path: "/" } };
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
    push: pushMock,
    currentRoute: currentRouteMock
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

vi.mock("@/utils/validators", async importOriginal => {
  const actual = await importOriginal<typeof import("@/utils/validators")>();

  return {
    ...actual,
    formatDocument: vi.fn(actual.formatDocument)
  };
});
