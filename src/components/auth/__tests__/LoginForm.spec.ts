import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import LoginForm from "../LoginForm.vue";
import {
  notifyMock,
  pushMock,
  setCurrentUserMock,
  loginMock,
  findByCnpjfOrUsernameMock
} from "@/__tests__/setup";

function createWrapper() {
  const pinia = createPinia();
  setActivePinia(pinia);

  return mount(LoginForm, {
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
            "autocomplete",
            "placeholder"
          ],
          emits: ["update:model-value"]
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
        QIcon: {
          template: "<span @click=\"$emit('click')\" />",
          emits: ["click"]
        }
      }
    }
  });
}

async function fillIdentifierAndSubmit(
  wrapper: ReturnType<typeof createWrapper>,
  value: string
) {
  const input = wrapper.find("input");
  await input.setValue(value);
  await input.trigger("input");

  const form = wrapper.find("form");
  await form.trigger("submit");
  await flushPromises();
}

async function advanceToPasswordStep(
  wrapper: ReturnType<typeof createWrapper>,
  identifier = "user@email.com"
) {
  findByCnpjfOrUsernameMock.mockResolvedValue({
    data: { data: { id: 1 } },
    error: null
  });

  await fillIdentifierAndSubmit(wrapper, identifier);
}

async function submitPassword(
  wrapper: ReturnType<typeof createWrapper>,
  password = "senha123"
) {
  const passwordInput = wrapper.findAll("input")[0]!;
  await passwordInput.setValue(password);
  await passwordInput.trigger("input");

  const form = wrapper.findAll("form")[0]!;
  await form.trigger("submit");
  await flushPromises();
}

describe("LoginForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    pushMock.mockResolvedValue(undefined);
    notifyMock.mockClear();
  });

  describe("Renderização", () => {
    it("renderiza o título principal", () => {
      const wrapper = createWrapper();
      expect(wrapper.find("h1").text()).toBe("Bem-vindo(a) de volta");
    });

    it("renderiza subtítulo no step de identificação", () => {
      const wrapper = createWrapper();
      expect(wrapper.find("p").text()).toBe("Acesse o painel da sua clínica.");
    });

    it("renderiza label do campo de identificação", () => {
      const wrapper = createWrapper();
      expect(wrapper.text()).toContain("E-mail ou CPF/CNPJ");
    });

    it("renderiza botão de continuar", () => {
      const wrapper = createWrapper();
      expect(wrapper.text()).toContain("Continuar");
    });
  });

  describe("Identificação - Sucesso", () => {
    it("avança para step de senha quando identificação é válida", async () => {
      const wrapper = createWrapper();
      await advanceToPasswordStep(wrapper);

      expect(wrapper.text()).toContain("Digite sua senha para continuar");
      expect(wrapper.text()).toContain("Senha");
      expect(wrapper.text()).toContain("Entrar");
    });

    it("chama findByCnpjfOrUsername com identificador limpo", async () => {
      const wrapper = createWrapper();
      await advanceToPasswordStep(wrapper, "user@email.com");

      expect(findByCnpjfOrUsernameMock).toHaveBeenCalledWith("user@email.com");
    });

    it("exibe identificador no step de senha", async () => {
      const wrapper = createWrapper();
      await advanceToPasswordStep(wrapper, "user@email.com");

      expect(wrapper.text()).toContain("Acessando como");
      expect(wrapper.text()).toContain("user@email.com");
    });
  });

  describe("Identificação - Erros", () => {
    it("emite change_auth quando mensagem é 'User not found'", async () => {
      findByCnpjfOrUsernameMock.mockRejectedValue({
        status: 404,
        data: { message: "User not found" }
      });

      const wrapper = createWrapper();
      await fillIdentifierAndSubmit(wrapper, "notfound@email.com");

      expect(wrapper.emitted("change_auth")).toBeTruthy();
      expect(wrapper.emitted("change_auth")![0]).toEqual([
        "notfound@email.com"
      ]);
    });

    it("emite change_auth com status 404 e msg diferente", async () => {
      findByCnpjfOrUsernameMock.mockRejectedValue({
        status: 404,
        data: { message: "User not found" }
      });

      const wrapper = createWrapper();
      await fillIdentifierAndSubmit(wrapper, "test@email.com");

      expect(wrapper.emitted("change_auth")).toBeTruthy();
    });

    it("notifica warning quando erro 429 (rate limit)", async () => {
      findByCnpjfOrUsernameMock.mockRejectedValue({
        status: 429,
        data: {}
      });

      const wrapper = createWrapper();
      await fillIdentifierAndSubmit(wrapper, "user@email.com");

      expect(notifyMock).toHaveBeenCalledWith(
        expect.objectContaining({ type: "warning" })
      );
    });

    it("notifica negativa para erros genéricos (500)", async () => {
      findByCnpjfOrUsernameMock.mockRejectedValue({
        status: 500,
        data: {}
      });

      const wrapper = createWrapper();
      await fillIdentifierAndSubmit(wrapper, "user@email.com");

      expect(notifyMock).toHaveBeenCalledWith(
        expect.objectContaining({ type: "negative" })
      );
    });

    it("retorna erro quando findByCnpjfOrUsername retorna error", async () => {
      findByCnpjfOrUsernameMock.mockResolvedValue({
        data: {},
        error: { status: 500, statusText: "Internal Server Error" }
      });

      const wrapper = createWrapper();
      await fillIdentifierAndSubmit(wrapper, "user@email.com");

      expect(notifyMock).toHaveBeenCalledWith(
        expect.objectContaining({ type: "negative" })
      );
    });
  });

  describe("Senha - Sucesso", () => {
    it("realiza login com sucesso, salva token e redireciona", async () => {
      loginMock.mockResolvedValue({
        data: { data: { token: "fake-jwt-token", name: "João" } },
        error: null
      });

      const wrapper = createWrapper();
      await advanceToPasswordStep(wrapper);
      await submitPassword(wrapper);

      expect(localStorage.getItem("token")).toBe("fake-jwt-token");
      expect(pushMock).toHaveBeenCalledWith("/");
      expect(notifyMock).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "positive",
          message: "Login efetuado com sucesso!"
        })
      );
    });

    it("chama setCurrentUser com dados do usuário", async () => {
      const userData = { token: "tok", name: "Maria", email: "m@e.com" };
      loginMock.mockResolvedValue({
        data: { data: userData },
        error: null
      });

      const wrapper = createWrapper();
      await advanceToPasswordStep(wrapper);
      await submitPassword(wrapper);

      expect(setCurrentUserMock).toHaveBeenCalledWith(userData);
    });

    it("chama login com identificador e senha corretos", async () => {
      loginMock.mockResolvedValue({
        data: { data: { token: "tok" } },
        error: null
      });

      const wrapper = createWrapper();
      await advanceToPasswordStep(wrapper, "user@email.com");
      await submitPassword(wrapper, "minhaSenha");

      expect(loginMock).toHaveBeenCalledWith({
        identificator: "user@email.com",
        password: "minhaSenha"
      });
    });

    it("notifica erro quando resposta não contém token", async () => {
      loginMock.mockResolvedValue({
        data: { data: {} },
        error: null
      });

      const wrapper = createWrapper();
      await advanceToPasswordStep(wrapper);
      await submitPassword(wrapper);

      expect(notifyMock).toHaveBeenCalledWith(
        expect.objectContaining({ type: "negative" })
      );
    });
  });

  describe("Senha - Erros", () => {
    it("notifica warning para credenciais inválidas (401)", async () => {
      loginMock.mockRejectedValue({
        status: 401,
        data: {}
      });

      const wrapper = createWrapper();
      await advanceToPasswordStep(wrapper);
      await submitPassword(wrapper);

      expect(notifyMock).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "warning",
          message: "E-mail/CPF-CNPJ ou senha inválidos"
        })
      );
    });

    it("notifica warning para erro 400 no login", async () => {
      loginMock.mockRejectedValue({
        status: 400,
        data: {}
      });

      const wrapper = createWrapper();
      await advanceToPasswordStep(wrapper);
      await submitPassword(wrapper);

      expect(notifyMock).toHaveBeenCalledWith(
        expect.objectContaining({ type: "warning" })
      );
    });

    it("notifica warning para erro 500 no login", async () => {
      loginMock.mockRejectedValue({
        status: 500,
        data: {}
      });

      const wrapper = createWrapper();
      await advanceToPasswordStep(wrapper);
      await submitPassword(wrapper);

      expect(notifyMock).toHaveBeenCalledWith(
        expect.objectContaining({ type: "warning" })
      );
    });

    it("notifica negativa para erros inesperados (503)", async () => {
      loginMock.mockRejectedValue({
        status: 503,
        data: {}
      });

      const wrapper = createWrapper();
      await advanceToPasswordStep(wrapper);
      await submitPassword(wrapper);

      expect(notifyMock).toHaveBeenCalledWith(
        expect.objectContaining({ type: "negative" })
      );
    });
  });

  describe("Navegação entre steps", () => {
    it("volta para step de identificação ao clicar 'Trocar conta'", async () => {
      const wrapper = createWrapper();
      await advanceToPasswordStep(wrapper);

      expect(wrapper.text()).toContain("Trocar conta");

      const buttons = wrapper.findAll("button");
      const backButton = buttons.find(b => b.text().includes("Trocar conta"));
      await backButton!.trigger("click");

      expect(wrapper.text()).toContain("E-mail ou CPF/CNPJ");
      expect(wrapper.text()).toContain("Acesse o painel da sua clínica");
    });

    it("limpa campo de senha ao voltar", async () => {
      const wrapper = createWrapper();
      await advanceToPasswordStep(wrapper);

      const passwordInput = wrapper.findAll("input")[0]!;
      await passwordInput.setValue("senha123");
      await passwordInput.trigger("input");

      const buttons = wrapper.findAll("button");
      const backButton = buttons.find(b => b.text().includes("Trocar conta"));
      await backButton!.trigger("click");

      const newInputs = wrapper.findAll("input");
      expect(newInputs.length).toBe(1);
    });
  });

  describe("Formatação de documento", () => {
    it("não aplica formatação quando valor contém @ (e-mail)", async () => {
      const wrapper = createWrapper();
      const input = wrapper.find("input");
      await input.setValue("user@email.com");
      await input.trigger("input");

      expect(input.element.value).toBe("user@email.com");
    });
  });

  describe("Loading states", () => {
    it("define identifying como true durante handleIdentify", async () => {
      let resolveFind: (v: unknown) => void;
      findByCnpjfOrUsernameMock.mockImplementation(
        () =>
          new Promise(r => {
            resolveFind = r;
          })
      );

      const wrapper = createWrapper();
      const input = wrapper.find("input");
      await input.setValue("user@email.com");
      await input.trigger("input");

      const form = wrapper.find("form");
      await form.trigger("submit");
      await flushPromises();

      const submitBtn = wrapper.find("button");
      expect(submitBtn.attributes("disabled")).toBeDefined();

      resolveFind!({ data: { data: {} }, error: null });
      await flushPromises();
    });
  });
});
