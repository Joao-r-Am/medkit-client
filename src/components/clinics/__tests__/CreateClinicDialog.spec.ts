import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { createPinia, setActivePinia, type Pinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { notifyMock } from "@/__tests__/setup";
import CreateClinicDialog from "@/components/clinics/CreateClinicDialog.vue";

const {
  lookupCnpjMock,
  findClinicByCnpjMock,
  createClinicMock,
  linkToClinicMock
} = vi.hoisted(() => ({
  lookupCnpjMock: vi.fn(),
  findClinicByCnpjMock: vi.fn(),
  createClinicMock: vi.fn(),
  linkToClinicMock: vi.fn()
}));

vi.mock("@/services", () => ({
  default: {
    clinics: {
      lookupCnpj: lookupCnpjMock,
      findClinicByCnpj: findClinicByCnpjMock,
      createClinic: createClinicMock,
      linkToClinic: linkToClinicMock
    }
  }
}));

vi.mock("@/stores/clinic", () => ({
  useClinicStore: () => ({
    createClinic: createClinicMock,
    linkToClinic: linkToClinicMock,
    selectMembership: vi.fn(async () => undefined)
  })
}));

let wrapper: VueWrapper | undefined;

function createWrapper(pinia: Pinia) {
  setActivePinia(pinia);

  return mount(CreateClinicDialog, {
    props: {
      modelValue: true,
      "onUpdate:modelValue": (value: boolean) =>
        wrapper?.setProps({ modelValue: value })
    },
    global: {
      plugins: [pinia],
      stubs: {
        QDialog: { template: "<div><slot /></div>", props: ["modelValue"] },
        QCard: { template: "<div><slot /></div>", props: ["flat"] },
        QCardSection: { template: "<div><slot /></div>" },
        QCardActions: { template: "<div><slot /></div>", props: ["align"] },
        QForm: {
          template: "<form @submit.prevent><slot /></form>",
          props: ["class"]
        },
        QInput: {
          template:
            '<div :data-test="label"><label v-if="label">{{ label }}</label><input :value="modelValue" @input="$emit(\'update:model-value\', $event.target.value)" /></div>',
          props: [
            "modelValue",
            "label",
            "outlined",
            "dense",
            "rules",
            "class",
            "readonly",
            "maxlength"
          ],
          emits: ["update:model-value"]
        },
        QBtn: {
          template:
            '<button :disabled="disabled" :data-test="label" @click="$emit(\'click\')">{{ label }}</button>',
          props: [
            "label",
            "icon",
            "type",
            "noCaps",
            "unelevated",
            "flat",
            "color",
            "loading",
            "disabled"
          ],
          emits: ["click"]
        },
        QBanner: { template: "<div><slot /></div>" },
        QSeparator: { template: "<hr />" }
      }
    }
  });
}

beforeEach(() => {
  localStorage.clear();
  lookupCnpjMock.mockReset();
  findClinicByCnpjMock.mockReset();
  createClinicMock.mockReset();
  linkToClinicMock.mockReset();
  createClinicMock.mockResolvedValue(undefined);
  // CNPJ desconhecido no Medkit: segue para a Receitaws por padrão.
  findClinicByCnpjMock.mockRejectedValue({
    response: { data: { code: "CLINIC_NOT_FOUND" } }
  });
});

function findLabeled(node: VueWrapper, label: string) {
  return node
    .findAll("[data-test]")
    .find(element => (element.attributes()["data-test"] ?? "") === label)!;
}

function findButton(node: VueWrapper, text: string) {
  return node.findAll("button").find(button => button.text().includes(text))!;
}

describe("components/clinics/CreateClinicDialog", () => {
  it("abre com o CNPJ como campo inicial e hint sobre a Receitaws", async () => {
    wrapper = createWrapper(createPinia());
    await flushPromises();

    // CNPJ é o primeiro campo do form de criação
    const allDataTests = wrapper
      .findAll("[data-test]")
      .map(node => node.attributes()["data-test"]);
    expect(allDataTests.filter(Boolean)[0]).toBe("create-clinic-cnpj");
    expect(wrapper.text()).toContain("buscamos os dados da empresa");
    wrapper.unmount();
  });

  it("lookup preenche nome, e-mail, telefone e endereço da Receitaws", async () => {
    lookupCnpjMock.mockResolvedValue({
      cnpjf: "12345678000195",
      name: "Clínica Receita LTDA",
      email: "contato@receita.com.br",
      phone: "51999999999",
      address: {
        street: "Rua das Clínicas",
        number: "123",
        complement: "Sala 2",
        district: "Centro",
        city: "Porto Alegre",
        state: "RS",
        country: "Brasil",
        zip: "90010000"
      }
    });

    wrapper = createWrapper(createPinia());
    await flushPromises();

    await findLabeled(wrapper, "create-clinic-cnpj")
      .find("input")!
      .setValue("12.345.678/0001-95");
    await findButton(wrapper, "Buscar dados").trigger("click");
    await flushPromises();

    expect(lookupCnpjMock).toHaveBeenCalledWith("12345678000195");
    expect(notifyMock).toHaveBeenCalledWith(
      expect.objectContaining({ type: "info" })
    );

    const nameInput = findLabeled(wrapper, "create-clinic-name").find("input")!;
    const emailInput = findLabeled(wrapper, "create-clinic-email").find(
      "input"
    )!;
    const streetInput = findLabeled(wrapper, "Rua/Logradouro").find("input")!;
    expect((nameInput.element as HTMLInputElement).value).toBe(
      "Clínica Receita LTDA"
    );
    expect((emailInput.element as HTMLInputElement).value).toBe(
      "contato@receita.com.br"
    );
    expect((streetInput.element as HTMLInputElement).value).toBe(
      "Rua das Clínicas"
    );
    wrapper.unmount();
  });

  it("erro CNPJ_NOT_FOUND aparece de forma amigável sem notify de sucesso", async () => {
    lookupCnpjMock.mockRejectedValue({
      response: { data: { code: "CNPJ_NOT_FOUND" } }
    });

    wrapper = createWrapper(createPinia());
    await flushPromises();

    await findLabeled(wrapper, "create-clinic-cnpj")
      .find("input")!
      .setValue("12345678000195");
    await findButton(wrapper, "Buscar dados").trigger("click");
    await flushPromises();

    expect(wrapper.text()).toContain(
      "CNPJ não encontrado na base da Receitaws."
    );
    expect(notifyMock).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: "info" })
    );
    wrapper.unmount();
  });

  it("clínica local existente mostra painel de vínculo em vez do form de criação", async () => {
    findClinicByCnpjMock.mockResolvedValue({
      id: "clinic-1",
      name: "Clínica Existente",
      cnpjf: "12345678000195"
    });

    wrapper = createWrapper(createPinia());
    await flushPromises();

    await findLabeled(wrapper, "create-clinic-cnpj")
      .find("input")!
      .setValue("12.345.678/0001-95");
    await findButton(wrapper, "Buscar dados").trigger("click");
    await flushPromises();

    expect(findClinicByCnpjMock).toHaveBeenCalledWith("12345678000195");
    expect(lookupCnpjMock).not.toHaveBeenCalled();
    expect(findLabeled(wrapper, "join-clinic-panel")).toBeTruthy();
    expect(wrapper.text()).toContain("Clínica Existente");
    expect(wrapper.text()).toContain("Vincular-se");
    // Form de criação escondido no caminho de vínculo
    expect(findLabeled(wrapper, "create-clinic-name")).toBeUndefined();
    wrapper.unmount();
  });

  it("vincula-se à clínica local e emite created", async () => {
    findClinicByCnpjMock.mockResolvedValue({
      id: "clinic-1",
      name: "Clínica Existente",
      cnpjf: "12345678000195"
    });
    linkToClinicMock.mockResolvedValue(undefined);

    wrapper = createWrapper(createPinia());
    await flushPromises();

    await findLabeled(wrapper, "create-clinic-cnpj")
      .find("input")!
      .setValue("12.345.678/0001-95");
    await findButton(wrapper, "Buscar dados").trigger("click");
    await flushPromises();

    await findButton(wrapper, "Vincular-se").trigger("click");
    await flushPromises();

    expect(linkToClinicMock).toHaveBeenCalledWith("clinic-1");
    expect(wrapper.emitted("created")).toBeTruthy();
    expect(notifyMock).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: "negative" })
    );
    wrapper.unmount();
  });

  it("erro de vínculo inválido mostra notify de erro", async () => {
    findClinicByCnpjMock.mockResolvedValue({
      id: "clinic-1",
      name: "Clínica Existente",
      cnpjf: "12345678000195"
    });
    linkToClinicMock.mockRejectedValue({
      response: { data: { code: "MEMBER_ALREADY_LINKED" } }
    });

    wrapper = createWrapper(createPinia());
    await flushPromises();

    await findLabeled(wrapper, "create-clinic-cnpj")
      .find("input")!
      .setValue("12.345.678/0001-95");
    await findButton(wrapper, "Buscar dados").trigger("click");
    await flushPromises();

    await findButton(wrapper, "Vincular-se").trigger("click");
    await flushPromises();

    expect(notifyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "negative",
        message: expect.stringContaining("já está vinculado")
      })
    );
    wrapper.unmount();
  });
});
