import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { notifyMock, pushMock, selectClinicMock } from "@/__tests__/setup";
import { MembershipStatus } from "@/interfaces/clinic";

const { myClinicsMock } = vi.hoisted(() => ({
  myClinicsMock: vi.fn()
}));

// O setup global mocka o store; a página usa o store real.
vi.mock("@/stores/clinic", async importOriginal => ({
  ...(await importOriginal())
}));

vi.mock("@/services", () => ({
  default: {
    clinics: { myClinics: myClinicsMock },
    auth: { selectClinic: selectClinicMock }
  }
}));

vi.mock("@/components/layout/AppLayout.vue", () => ({
  default: {
    template: "<div><slot /></div>",
    props: ["title"]
  }
}));

async function mountPage() {
  const { default: ClinicsPage } = await import("@/pages/clinics.vue");
  return mount(ClinicsPage, {
    global: {
      stubs: {
        QCard: { template: "<div><slot /></div>" },
        QBtn: {
          template:
            "<button @click=\"$emit('click')\">{{ label }}<slot /></button>",
          props: [
            "label",
            "icon",
            "flat",
            "dense",
            "unelevated",
            "noCaps",
            "color"
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
        QTooltip: { template: "<span><slot /></span>" }
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

describe("pages/clinics", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    myClinicsMock.mockReset();
    selectClinicMock.mockReset();
    localStorage.clear();
  });

  it("mostra skeletons enquanto carrega", async () => {
    myClinicsMock.mockReturnValue(new Promise(() => {}));

    const wrapper = await mountPage();

    expect(wrapper.find('[data-testid="skeleton"]').exists()).toBe(true);
    expect(wrapper.text()).not.toContain("Nenhuma clínica vinculada");
    wrapper.unmount();
  });

  it("mostra estado vazio quando não há vínculos", async () => {
    myClinicsMock.mockResolvedValue([]);

    const wrapper = await mountPage();
    await flushPromises();

    expect(wrapper.text()).toContain("Nenhuma clínica vinculada");
    expect(wrapper.text()).toContain("convite");
    wrapper.unmount();
  });

  it("lista as clínicas com status e papéis", async () => {
    myClinicsMock.mockResolvedValue([
      membership("Clínica Alpha"),
      membership("Clínica Beta", { status: MembershipStatus.SUSPENDED })
    ]);

    const wrapper = await mountPage();
    await flushPromises();

    expect(wrapper.text()).toContain("Clínica Alpha");
    expect(wrapper.text()).toContain("Clínica Beta");
    expect(wrapper.text()).toContain("Ativo");
    expect(wrapper.text()).toContain("Suspenso");
    expect(wrapper.text()).toContain("Proprietário");
    expect(wrapper.text()).toContain("2 vínculos");
    wrapper.unmount();
  });

  it("mostra erro com opção de tentar novamente", async () => {
    myClinicsMock.mockRejectedValue(new Error("boom"));

    const wrapper = await mountPage();
    await flushPromises();

    expect(wrapper.text()).toContain(
      "Não foi possível carregar suas clínicas."
    );
    expect(wrapper.text()).toContain("Tentar novamente");

    myClinicsMock.mockResolvedValue([membership("Clínica Alpha")]);
    await wrapper
      .findAll("button")
      .find(button => button.text().includes("Tentar novamente"))!
      .trigger("click");
    await flushPromises();

    expect(wrapper.text()).toContain("Clínica Alpha");
    wrapper.unmount();
  });

  it("só busca as clínicas uma vez por montagem", async () => {
    myClinicsMock.mockResolvedValue([]);

    const wrapper = await mountPage();
    await flushPromises();

    expect(myClinicsMock).toHaveBeenCalledTimes(1);
    wrapper.unmount();
  });

  it("mostra o banner de seleção com mais de um vínculo ativo", async () => {
    myClinicsMock.mockResolvedValue([
      membership("Clínica Alpha"),
      membership("Clínica Beta")
    ]);

    const wrapper = await mountPage();
    await flushPromises();

    expect(wrapper.text()).toContain("Selecione uma das suas clínicas ativas");
    wrapper.unmount();
  });

  it("sem pendência (um vínculo) não mostra o banner", async () => {
    myClinicsMock.mockResolvedValue([membership("Clínica Alpha")]);

    const wrapper = await mountPage();
    await flushPromises();

    expect(wrapper.text()).not.toContain(
      "Selecione uma das suas clínicas ativas"
    );
    expect(wrapper.text()).toContain("Entrar");
    wrapper.unmount();
  });

  it("botão Entrar seleciona o vínculo e navega para /", async () => {
    myClinicsMock.mockResolvedValue([membership("Clínica Alpha")]);
    selectClinicMock.mockResolvedValue({
      data: {
        data: {
          token: "tenant",
          membership_id: "m-Clínica Alpha",
          clinic_id: "c-Clínica Alpha",
          clinic: { id: "c-Clínica Alpha" }
        }
      },
      error: null
    });

    const wrapper = await mountPage();
    await flushPromises();

    const enterButton = wrapper
      .findAll("button")
      .find(button => button.text().includes("Entrar"))!;
    await enterButton.trigger("click");
    await flushPromises();

    expect(selectClinicMock).toHaveBeenCalledWith({
      membership_id: "m-Clínica Alpha"
    });
    expect(localStorage.getItem("token")).toBe("tenant");
    expect(pushMock).toHaveBeenCalledWith("/");
    expect(notifyMock).toHaveBeenCalledWith(
      expect.objectContaining({ type: "positive" })
    );
    wrapper.unmount();
  });
});
