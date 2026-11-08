import { mount, flushPromises, type VueWrapper } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { notifyMock, pushMock, currentRouteMock } from "@/__tests__/setup";

const {
  cleanCurrentUserMock,
  resetClinicStoreMock,
  navigateMock,
  clinicContextState
} = vi.hoisted(() => ({
  cleanCurrentUserMock: vi.fn(),
  resetClinicStoreMock: vi.fn(),
  navigateMock: vi.fn(),
  clinicContextState: {
    activeContext: null as null | { clinic: { name: string } }
  }
}));

vi.mock("@/stores/user", () => ({
  useUserStore: () => ({
    state: { currentUser: { name: "Ana Souza" } },
    cleanCurrentUser: cleanCurrentUserMock
  })
}));

vi.mock("@/stores/clinic", () => ({
  useClinicStore: () => ({
    state: clinicContextState,
    $reset: resetClinicStoreMock
  })
}));

vi.mock("@/utils/navigate", () => ({
  useNavigate: () => ({ navigate: navigateMock })
}));

async function mountLayout() {
  const { default: AppLayout } =
    await import("@/components/layout/AppLayout.vue");
  wrapper = mount(AppLayout, {
    props: { title: "Home" },
    global: {
      stubs: {
        QLayout: { template: "<div><slot /></div>" },
        QDrawer: {
          template: "<div><slot /></div>",
          props: ["modelValue", "dark"]
        },
        QHeader: { template: "<div><slot /></div>" },
        QToolbar: { template: "<div><slot /></div>" },
        QToolbarTitle: { template: "<div><slot /></div>" },
        QPageContainer: { template: "<div><slot /></div>" },
        QPage: { template: "<div><slot /></div>" },
        QBtnDropdown: {
          template:
            '<div data-test="user-menu"><slot name="label" /><slot /></div>',
          props: ["flat", "noCaps", "dense"]
        },
        QAvatar: {
          template: "<span><slot /></span>",
          props: ["size", "color", "textColor"]
        },
        QList: {
          template: "<div><slot /></div>",
          props: ["padding"]
        },
        QItem: {
          template: "<button @click=\"$emit('click')\"><slot /></button>",
          props: ["active", "clickable"],
          emits: ["click"]
        },
        QItemSection: {
          template: '<span class="q-item-section"><slot /></span>',
          props: ["avatar"]
        },
        QIcon: { template: "<span />", props: ["name", "size"] },
        QTooltip: { template: "<span><slot /></span>" },
        QBtn: {
          template:
            '<button :aria-label="ariaLabel" @click="$emit(\'click\')"><slot /></button>',
          props: ["flat", "dense", "round", "icon", "ariaLabel"],
          emits: ["click"]
        },
        QSeparator: { template: "<hr />" }
      }
    }
  });
  return wrapper;
}

let wrapper: VueWrapper | undefined;

function menuButton(text: string) {
  return wrapper!.findAll("button").find(node => node.text().trim() === text)!;
}

describe("components/layout/AppLayout — menu do usuário", () => {
  beforeEach(() => {
    localStorage.clear();
    currentRouteMock.value = { path: "/" };
    clinicContextState.activeContext = null;
    cleanCurrentUserMock.mockClear();
    resetClinicStoreMock.mockClear();
    navigateMock.mockClear();
    notifyMock.mockClear();
  });

  it("mostra avatar com iniciais, nome do usuário e clínica ativa", async () => {
    clinicContextState.activeContext = { clinic: { name: "Clínica Alpha" } };

    await mountLayout();
    await flushPromises();

    expect(wrapper!.text()).toContain("Ana Souza");
    expect(wrapper!.text()).toContain("Clínica Alpha");
    expect(wrapper!.text()).toContain("AS");
    expect(wrapper!.find('[data-test="user-menu"]').exists()).toBe(true);
    wrapper!.unmount();
  });

  it("sem clínica ativa mostra 'Nenhuma clínica ativa'", async () => {
    await mountLayout();
    await flushPromises();

    expect(wrapper!.text()).toContain("Nenhuma clínica ativa");
    wrapper!.unmount();
  });

  it("menu navega para perfil e clínicas", async () => {
    await mountLayout();
    await flushPromises();

    await menuButton("Perfil").trigger("click");
    expect(navigateMock).toHaveBeenCalledWith("/profile");

    await menuButton("Clínicas").trigger("click");
    expect(navigateMock).toHaveBeenCalledWith("/clinics");
    wrapper!.unmount();
  });

  it("menu sai da sessão (limpa usuário e clínica)", async () => {
    await mountLayout();
    await flushPromises();

    await menuButton("Sair").trigger("click");
    await flushPromises();

    expect(cleanCurrentUserMock).toHaveBeenCalled();
    expect(resetClinicStoreMock).toHaveBeenCalled();
    expect(pushMock).toHaveBeenCalledWith("/auth");
    expect(notifyMock).toHaveBeenCalledWith(
      expect.objectContaining({ type: "info", message: "Sessão encerrada" })
    );
    wrapper!.unmount();
  });
});
