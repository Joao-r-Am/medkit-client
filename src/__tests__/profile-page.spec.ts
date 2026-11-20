import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { pushMock } from "@/__tests__/setup";
import { MembershipStatus } from "@/interfaces/clinic";

const { myClinicsMock } = vi.hoisted(() => ({
  myClinicsMock: vi.fn()
}));

vi.mock("@/services", () => ({
  default: {
    clinics: { myClinics: myClinicsMock },
    auth: { selectClinic: vi.fn() }
  }
}));

// O store real: o mock global do setup não tem `memberships`.
vi.mock("@/stores/clinic", async importOriginal => ({
  ...(await importOriginal())
}));

vi.mock("@/stores/user", async importOriginal => ({
  ...(await importOriginal())
}));

vi.mock("@/services/queries", () => ({
  prefetchRoute: vi.fn().mockResolvedValue(undefined)
}));

vi.mock("@/components/layout/AppLayout.vue", () => ({
  default: {
    template: "<div><slot /></div>",
    props: ["title"]
  }
}));

vi.mock("@/components/clinics/CreateClinicDialog.vue", () => ({
  default: {
    template: '<div data-testid="create-clinic-dialog" />',
    props: ["open"]
  }
}));

async function mountPage() {
  const { default: ProfilePage } = await import("@/pages/profile.vue");
  return mount(ProfilePage, {
    global: {
      stubs: {
        QCard: { template: "<div><slot /></div>", props: ["flat", "bordered"] },
        QTabs: {
          template: "<div><slot /></div>",
          props: ["noCaps", "align", "activeColor", "indicatorColor"]
        },
        QTab: {
          template:
            '<button :data-test="name" @click="$emit(\'click\')">{{ label }}</button>',
          props: ["name", "label"],
          emits: ["click"]
        },
        QTabPanels: { template: "<div><slot /></div>", props: ["animated"] },
        QTabPanel: { template: "<div><slot /></div>", props: ["name"] },
        QSeparator: { template: "<hr />" },
        QAvatar: {
          template: "<span><slot /></span>",
          props: ["size", "color", "textColor", "icon"]
        },
        QBtn: {
          template:
            "<button @click=\"$emit('click')\">{{ label }}<slot /></button>",
          props: ["label", "icon", "flat", "unelevated", "noCaps", "color"],
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
        }
      }
    }
  });
}

function membership(name: string, overrides: Record<string, unknown> = {}) {
  return {
    membership_id: `m-${name}`,
    status: MembershipStatus.ACTIVE,
    clinic: { id: `c-${name}`, name, cnpjf: "12345678000190" },
    roles: [{ id: "r1", name: "owner" }],
    ...overrides
  };
}

describe("pages/profile", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    myClinicsMock.mockReset();
    localStorage.clear();
    localStorage.setItem(
      "user",
      JSON.stringify({
        name: "Ana Souza",
        email: "ana@x.com",
        cnpjf: "12345678901"
      })
    );
  });

  it("aba perfil mostra os dados da conta e a clínica ativa (se houver)", async () => {
    myClinicsMock.mockResolvedValue([membership("Clínica Alpha")]);
    localStorage.setItem(
      "clinic",
      JSON.stringify({
        membership_id: "m-Clínica Alpha",
        clinic_id: "c-Clínica Alpha",
        clinic: { id: "c-Clínica Alpha", name: "Clínica Alpha" }
      })
    );

    const wrapper = await mountPage();

    expect(wrapper.text()).toContain("Ana Souza");
    expect(wrapper.text()).toContain("ana@x.com");
    expect(wrapper.text()).toContain("12345678901");
    expect(wrapper.text()).toContain("Clínica Alpha");
    wrapper.unmount();
  });

  it("aba clínicas lista os vínculos e abre o diálogo de criação", async () => {
    myClinicsMock.mockResolvedValue([membership("Clínica Alpha")]);

    const wrapper = await mountPage();
    await flushPromises();

    const clinicsTab = wrapper.find('[data-test="clinics"]');
    await clinicsTab.trigger("click");

    expect(wrapper.text()).toContain("Clínica Alpha");
    expect(wrapper.text()).toContain("Minhas clínicas");

    const createButton = wrapper
      .findAll("button")
      .find(button => button.text().includes("Criar clínica"))!;
    await createButton.trigger("click");
    await flushPromises();

    expect(wrapper.find('[data-testid="create-clinic-dialog"]').exists()).toBe(
      true
    );
    wrapper.unmount();
  });

  it("clínica ativa aparece como '—' quando o usuário não tem vínculo", async () => {
    myClinicsMock.mockResolvedValue([]);

    const wrapper = await mountPage();

    expect(wrapper.text()).toContain("Ana Souza");
    expect(wrapper.text()).toContain("—");
    wrapper.unmount();
  });

  it("não envia nada para navegação externa ao montar a aba perfil", async () => {
    myClinicsMock.mockResolvedValue([]);

    const wrapper = await mountPage();
    await flushPromises();

    expect(pushMock).not.toHaveBeenCalled();
    wrapper.unmount();
  });
});
