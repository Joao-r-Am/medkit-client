import { vi } from "vitest";

export const notifyMock = vi.fn();
export const pushMock = vi.fn().mockResolvedValue(undefined);
export const currentRouteMock = { value: { path: "/" } };
export const setCurrentUserMock = vi.fn();

export const loginMock = vi.fn();
export const registerMock = vi.fn();
export const findByCnpjfOrUsernameMock = vi.fn();
export const selectClinicMock = vi.fn();
export const myClinicsMock = vi.fn();
export const createClinicMock = vi.fn();
export const resolveClinicRouteMock = vi.fn().mockResolvedValue("/");

vi.mock("quasar", () => ({
  useQuasar: () => ({
    notify: notifyMock,
    screen: { width: 1200 }
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
  QLayout: { name: "QLayout", template: "<div><slot /></div>" },
  QHeader: { name: "QHeader", template: "<div><slot /></div>" },
  QToolbar: { name: "QToolbar", template: "<div><slot /></div>" },
  QToolbarTitle: { name: "QToolbarTitle", template: "<div><slot /></div>" },
  QDrawer: { name: "QDrawer", template: "<div><slot /></div>" },
  QPageContainer: { name: "QPageContainer", template: "<div><slot /></div>" },
  QPage: { name: "QPage", template: "<div><slot /></div>" },
  QAvatar: {
    name: "QAvatar",
    template: "<span><slot /></span>",
    props: ["size", "color", "textColor"]
  },
  QBtnDropdown: {
    name: "QBtnDropdown",
    template: '<div data-test="user-menu"><slot name="label" /><slot /></div>',
    props: ["flat", "noCaps", "dense"]
  },
  QList: { name: "QList", template: "<div><slot /></div>", props: ["padding"] },
  QSeparator: { name: "QSeparator", template: "<hr />" },
  QTooltip: { name: "QTooltip", template: "<span><slot /></span>" },
  Notify: { install: vi.fn() }
}));

vi.mock("vue-router", () => ({
  useRouter: () => ({
    push: pushMock,
    currentRoute: currentRouteMock
  }),
  useRoute: () => currentRouteMock.value
}));

vi.mock("@/stores/user", () => ({
  useUserStore: () => ({
    setCurrentUser: setCurrentUserMock,
    state: { currentUser: {} },
    cleanCurrentUser: vi.fn(),
    setApiKey: vi.fn()
  })
}));

vi.mock("@/stores/clinic", () => ({
  useClinicStore: () => ({
    state: { activeContext: null, selecting: false },
    resolveClinicRoute: resolveClinicRouteMock,
    selectMembership: vi.fn().mockResolvedValue(undefined),
    createClinic: vi.fn().mockResolvedValue(undefined),
    fetchMyClinics: vi.fn().mockResolvedValue(undefined),
    activeMemberships: vi.fn().mockReturnValue([]),
    $reset: vi.fn()
  })
}));

vi.mock("@/services", () => ({
  default: {
    auth: {
      login: loginMock,
      register: registerMock,
      findByCnpjfOrUsername: findByCnpjfOrUsernameMock,
      selectClinic: selectClinicMock
    },
    clinics: {
      myClinics: myClinicsMock,
      createClinic: createClinicMock
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
