import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import CreateAccountForm from "../CreateAccountForm.vue";
import {
  notifyMock,
  pushMock,
  setCurrentUserMock,
  registerMock,
  loginMock
} from "@/__tests__/setup";

function createWrapper(props: Record<string, unknown> = {}) {
  const pinia = createPinia();
  setActivePinia(pinia);

  return mount(CreateAccountForm, {
    props: {
      cnpjf: "",
      ...props
    },
    global: {
      plugins: [pinia],
      stubs: {
        QForm: {
          template: "<form @submit.prevent><slot /></form>",
          props: ["greedy"]
        },
        QInput: {
          template:
            '<div><label v-if="label">{{ label }}</label><input :value="modelValue" @input="$emit(\'update:model-value\', $event.target.value)" /></div>',
          props: [
            "modelValue",
            "label",
            "outlined",
            "dense",
            "rules",
            "type",
            "mask",
            "unmaskedValue",
            "placeholder",
            "class"
          ],
          emits: ["update:model-value"]
        },
        QSelect: {
          template:
            '<div data-test="qselect"><label v-if="label">{{ label }}</label><input :value="modelValue" @input="$emit(\'update:model-value\', $event.target.value)" /></div>',
          props: [
            "modelValue",
            "options",
            "optionLabel",
            "optionValue",
            "emitValue",
            "mapOptions",
            "label",
            "useInput",
            "hideSelected",
            "fillInput",
            "inputDebounce",
            "rules",
            "placeholder"
          ],
          emits: ["update:model-value", "filter"]
        },
        QBtn: {
          template:
            '<button :disabled="loading" @click="$emit(\'click\')">{{ label }}</button>',
          props: [
            "type",
            "unelevated",
            "noCaps",
            "size",
            "label",
            "iconRight",
            "loading"
          ],
          emits: ["click"]
        },
        QItem: { template: "<div><slot /></div>" },
        QItemSection: { template: "<div><slot /></div>" }
      }
    }
  });
}

async function fillAllFields(
  wrapper: ReturnType<typeof createWrapper>,
  data: Record<string, string> = {}
) {
  const defaults = {
    name: "Maria",
    lastname: "Silva",
    email: "maria@email.com",
    password: "senha123",
    phone: "11999998888",
    cnpjf: "12345678900",
    especialty_area: "psychologist"
  };
  const fields = { ...defaults, ...data };

  const inputs = wrapper.findAll("input");
  const inputsArray = Array.from(inputs);

  await inputsArray[0]!.setValue(fields.name);
  await inputsArray[0]!.trigger("input");
  await inputsArray[1]!.setValue(fields.lastname);
  await inputsArray[1]!.trigger("input");
  await inputsArray[2]!.setValue(fields.email);
  await inputsArray[2]!.trigger("input");
  await inputsArray[3]!.setValue(fields.password);
  await inputsArray[3]!.trigger("input");
  await inputsArray[4]!.setValue(fields.phone);
  await inputsArray[4]!.trigger("input");
  await inputsArray[5]!.setValue(fields.cnpjf);
  await inputsArray[5]!.trigger("input");
  await inputsArray[6]!.setValue(fields.especialty_area);
  await inputsArray[6]!.trigger("input");
}

describe("CreateAccountForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    pushMock.mockResolvedValue(undefined);
    notifyMock.mockClear();
  });

  describe("Renderização", () => {
    it("renderiza o título principal", () => {
      const wrapper = createWrapper();
      expect(wrapper.find("h1").text()).toBe("Crie uma conta");
    });

    it("renderiza o subtítulo", () => {
      const wrapper = createWrapper();
      expect(wrapper.find("p").text()).toBe(
        "Comece a organizar sua clínica hoje."
      );
    });

    it("renderiza todos os campos do formulário", () => {
      const wrapper = createWrapper();
      expect(wrapper.text()).toContain("Nome");
      expect(wrapper.text()).toContain("Sobrenome");
      expect(wrapper.text()).toContain("E-mail");
      expect(wrapper.text()).toContain("Senha");
      expect(wrapper.text()).toContain("Telefone");
      expect(wrapper.text()).toContain("CPF/CNPJ");
      expect(wrapper.text()).toContain("Área de especialidade");
    });

    it("renderiza botão de criar conta", () => {
      const wrapper = createWrapper();
      expect(wrapper.text()).toContain("Criar conta");
    });

    it("renderiza 7 campos de input (6 QInput + 1 QSelect)", () => {
      const wrapper = createWrapper();
      const inputs = wrapper.findAll("input");
      expect(inputs.length).toBe(7);
    });
  });

  describe("Prop cnpjf", () => {
    it("popula o campo CPF/CNPJ quando prop é fornecida", () => {
      const wrapper = createWrapper({ cnpjf: "12345678900" });
      const inputs = wrapper.findAll("input");
      const cnpjfInput = inputs[5];
      expect(cnpjfInput!.element.value).toBe("12345678900");
    });

    it("campo CPF/CNPJ fica vazio quando prop não é fornecida", () => {
      const wrapper = createWrapper();
      const inputs = wrapper.findAll("input");
      const cnpjfInput = inputs[5];
      expect(cnpjfInput!.element.value).toBe("");
    });
  });

  describe("Cadastro - Sucesso", () => {
    it("realiza cadastro com sucesso", async () => {
      registerMock.mockResolvedValue({
        data: { data: { token: "new-token", name: "Maria" } },
        error: null
      });

      const wrapper = createWrapper();
      await fillAllFields(wrapper);

      const form = wrapper.find("form");
      await form.trigger("submit");
      await flushPromises();

      expect(registerMock).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Maria",
          lastname: "Silva",
          email: "maria@email.com",
          access_type: 3
        })
      );
    });

    it("salva token no localStorage após cadastro", async () => {
      registerMock.mockResolvedValue({
        data: { data: { token: "new-token" } },
        error: null
      });

      const wrapper = createWrapper();
      await fillAllFields(wrapper);

      const form = wrapper.find("form");
      await form.trigger("submit");
      await flushPromises();

      expect(localStorage.getItem("token")).toBe("new-token");
    });

    it("chama setCurrentUser com dados do usuário", async () => {
      const userData = { token: "tok", name: "Maria" };
      registerMock.mockResolvedValue({
        data: { data: userData },
        error: null
      });

      const wrapper = createWrapper();
      await fillAllFields(wrapper);

      const form = wrapper.find("form");
      await form.trigger("submit");
      await flushPromises();

      expect(setCurrentUserMock).toHaveBeenCalledWith(userData);
    });

    it("navega para / após cadastro", async () => {
      registerMock.mockResolvedValue({
        data: { data: { token: "tok" } },
        error: null
      });

      const wrapper = createWrapper();
      await fillAllFields(wrapper);

      const form = wrapper.find("form");
      await form.trigger("submit");
      await flushPromises();

      expect(pushMock).toHaveBeenCalledWith("/");
    });

    it("emite 'created' após cadastro", async () => {
      registerMock.mockResolvedValue({
        data: { data: { token: "tok" } },
        error: null
      });

      const wrapper = createWrapper();
      await fillAllFields(wrapper);

      const form = wrapper.find("form");
      await form.trigger("submit");
      await flushPromises();

      expect(wrapper.emitted("created")).toBeTruthy();
    });

    it("notifica sucesso após cadastro", async () => {
      registerMock.mockResolvedValue({
        data: { data: { token: "tok" } },
        error: null
      });

      const wrapper = createWrapper();
      await fillAllFields(wrapper);

      const form = wrapper.find("form");
      await form.trigger("submit");
      await flushPromises();

      expect(notifyMock).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "positive",
          message: "Conta criada!"
        })
      );
    });

    it("remove formatação do cnpjf antes de enviar", async () => {
      registerMock.mockResolvedValue({
        data: { data: { token: "tok" } },
        error: null
      });

      const wrapper = createWrapper();
      await fillAllFields(wrapper, { cnpjf: "123.456.789-00" });

      const form = wrapper.find("form");
      await form.trigger("submit");
      await flushPromises();

      expect(registerMock).toHaveBeenCalledWith(
        expect.objectContaining({
          cnpjf: expect.not.stringContaining(".")
        })
      );
    });
  });

  describe("Cadastro - Erros", () => {
    it("notifica warning quando há erro na API (response error)", async () => {
      registerMock.mockResolvedValue({
        data: { data: {} },
        error: { status: 400, statusText: "Bad Request" }
      });

      const wrapper = createWrapper();
      await fillAllFields(wrapper);

      const form = wrapper.find("form");
      await form.trigger("submit");
      await flushPromises();

      expect(notifyMock).toHaveBeenCalledWith(
        expect.objectContaining({ type: "warning" })
      );
    });

    it("notifica negativa quando exceção é lançada", async () => {
      registerMock.mockRejectedValue(new Error("Network error"));

      const wrapper = createWrapper();
      await fillAllFields(wrapper);

      const form = wrapper.find("form");
      await form.trigger("submit");
      await flushPromises();

      expect(notifyMock).toHaveBeenCalledWith(
        expect.objectContaining({ type: "negative" })
      );
    });

    it("exibe mensagem do erro como caption na notificação negativa", async () => {
      registerMock.mockRejectedValue(new Error("Falha na conexão"));

      const wrapper = createWrapper();
      await fillAllFields(wrapper);

      const form = wrapper.find("form");
      await form.trigger("submit");
      await flushPromises();

      expect(notifyMock).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "negative",
          caption: "Falha na conexão"
        })
      );
    });
  });

  describe("Login automático", () => {
    it("não dispara login automático no handleSubmit (apenas register)", async () => {
      registerMock.mockResolvedValue({
        data: { data: { token: "reg-token", name: "João" } },
        error: null
      });

      const wrapper = createWrapper();
      await fillAllFields(wrapper, { email: "joao@email.com" });

      const form = wrapper.find("form");
      await form.trigger("submit");
      await flushPromises();

      expect(registerMock).toHaveBeenCalled();
      expect(loginMock).not.toHaveBeenCalled();
    });

    it("navega para / após cadastro (não /patients)", async () => {
      registerMock.mockResolvedValue({
        data: { data: { token: "reg-token" } },
        error: null
      });

      const wrapper = createWrapper();
      await fillAllFields(wrapper);

      const form = wrapper.find("form");
      await form.trigger("submit");
      await flushPromises();

      expect(pushMock).toHaveBeenCalledWith("/");
      expect(pushMock).not.toHaveBeenCalledWith("/patients");
    });

    it("salva token do cadastro no localStorage", async () => {
      registerMock.mockResolvedValue({
        data: { data: { token: "reg-token" } },
        error: null
      });

      const wrapper = createWrapper();
      await fillAllFields(wrapper);

      const form = wrapper.find("form");
      await form.trigger("submit");
      await flushPromises();

      expect(localStorage.getItem("token")).toBe("reg-token");
    });

    it("mesmo com erro da API, handleSubmit continua e navega para /", async () => {
      registerMock.mockResolvedValue({
        data: { data: { token: "reg-token" } },
        error: { status: 400, statusText: "Bad Request" }
      });

      const wrapper = createWrapper();
      await fillAllFields(wrapper);

      const form = wrapper.find("form");
      await form.trigger("submit");
      await flushPromises();

      expect(notifyMock).toHaveBeenCalledWith(
        expect.objectContaining({ type: "warning" })
      );
      expect(pushMock).toHaveBeenCalledWith("/");
      expect(wrapper.emitted("created")).toBeTruthy();
    });

    it("não navega quando exceção é lançada no register", async () => {
      registerMock.mockRejectedValue(new Error("Network error"));

      const wrapper = createWrapper();
      await fillAllFields(wrapper);

      const form = wrapper.find("form");
      await form.trigger("submit");
      await flushPromises();

      expect(pushMock).not.toHaveBeenCalled();
      expect(wrapper.emitted("created")).toBeFalsy();
    });
  });

  describe("Formatação de documento", () => {
    it("chama formatDocument ao digitar no campo CPF/CNPJ", async () => {
      const { formatDocument } = await import("@/utils/validators");
      const wrapper = createWrapper();

      const inputs = wrapper.findAll("input");
      const cnpjfInput = inputs[5];

      await cnpjfInput!.setValue("12345678900");
      await cnpjfInput!.trigger("input");

      expect(formatDocument).toHaveBeenCalled();
    });
  });

  describe("Filtro de especialidade", () => {
    it("renderiza QSelect com opções de especialidade", () => {
      const wrapper = createWrapper();
      const qSelect = wrapper.find('[data-test="qselect"]');
      expect(qSelect.exists()).toBe(true);
    });
  });
});
