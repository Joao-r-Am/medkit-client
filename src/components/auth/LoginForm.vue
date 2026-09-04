<template>
  <div>
    <h1 class="app-auth-form__title">Bem-vindo(a) de volta</h1>
    <p class="app-auth-form__subtitle">
      {{
        step === "identify"
          ? "Acesse o painel da sua clínica."
          : "Digite sua senha para continuar."
      }}
    </p>

    <q-form
      v-if="step === 'identify'"
      class="q-mt-lg"
      greedy
      @submit.prevent="handleIdentify"
    >
      <q-input
        :model-value="state.identifier.value"
        label="E-mail ou CPF/CNPJ"
        placeholder="joao.silva@gmail.com ou 000.000.000-00"
        outlined
        dense
        autofocus
        autocomplete="username"
        :rules="[validateEmailOrDocument]"
        class="app-auth-form__field"
        @update:model-value="onIdentifierInput"
      />

      <q-btn
        type="submit"
        unelevated
        no-caps
        size="lg"
        class="full-width q-mt-lg app-auth-form__submit"
        label="Continuar"
        icon-right="arrow_forward"
        :loading="identifying"
      />
    </q-form>

    <q-form v-else class="q-mt-lg" greedy @submit.prevent="handleSubmit">
      <div class="q-mb-sm q-pa-sm bg-grey-2 rounded-borders">
        <div class="text-caption text-grey-7">Acessando como</div>
        <div class="text-subtitle2">{{ state.identifier.value }}</div>
      </div>

      <q-btn
        flat
        dense
        no-caps
        padding="0"
        class="q-mb-md text-grey-7 app-auth-form__back"
        label="Não é você? Trocar conta"
        icon="chevron_left"
        @click="goBackToIdentify"
      />

      <q-input
        v-model="state.password.value"
        label="Senha"
        placeholder="*********"
        outlined
        dense
        autofocus
        autocomplete="current-password"
        :type="showPassword ? 'text' : 'password'"
        :rules="[validateEmptyAndLength3]"
        class="app-auth-form__field"
      >
        <template #append>
          <q-icon
            :name="showPassword ? 'visibility_off' : 'visibility'"
            class="cursor-pointer"
            @click="showPassword = !showPassword"
          />
        </template>
      </q-input>

      <q-btn
        type="submit"
        unelevated
        no-caps
        size="lg"
        class="full-width q-mt-lg app-auth-form__submit"
        label="Entrar"
        icon-right="login"
        :loading="submitting"
      />
    </q-form>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { useQuasar } from "quasar";
import {
  validateEmptyAndLength3,
  validateEmailOrDocument,
  formatDocument,
  stripDocumentFormatting
} from "@/utils/validators";
import services from "@/services";
import { useUserStore } from "@/stores/user";

defineOptions({ name: "LoginForm" });

const router = useRouter();
const $q = useQuasar();
const userStore = useUserStore();

type Step = "identify" | "password";

const step = ref<Step>("identify");
const showPassword = ref(false);
const identifying = ref(false);
const submitting = ref(false);

const emit = defineEmits<{ change_auth: [cnpjf: string] }>();

const state = reactive({
  identifier: { value: "" },
  password: { value: "" }
});

/** Aplica máscara de CPF/CNPJ quando o valor não é um e-mail. */
function onIdentifierInput(value: unknown) {
  const raw = String(value ?? "");
  state.identifier.value = raw.includes("@") ? raw : formatDocument(raw);
}

/** Documento vai sem máscara (formato salvo no banco); e-mail segue cru. */
function normalizedIdentifier(): string {
  const raw = state.identifier.value.trim();
  return raw.includes("@") ? raw : stripDocumentFormatting(raw);
}

function notifyWarning(message: string, caption?: string) {
  $q.notify({
    type: "warning",
    message,
    ...(caption ? { caption } : {}),
    timeout: 3000
  });
}

function notifyNegative(message: string, caption?: string) {
  $q.notify({
    type: "negative",
    message,
    ...(caption ? { caption } : {}),
    timeout: 3000
  });
}

function errorStatus(err: { status?: number; data?: { message?: string } }): {
  msg: string;
  status: number;
} {
  const { data, status } = err;
  return {
    msg: data?.message ?? (err as Error)?.message ?? "Erro desconhecido",
    status: status ?? 500
  };
}

/** Verifica se o usuário existe antes de pedir a senha. */
async function handleIdentify() {
  identifying.value = true;
  try {
    const { error } = await services.auth.findByCnpjfOrUsername(
      normalizedIdentifier()
    );
    if (!error) {
      step.value = "password";
      return;
    }

    notifyNegative("Erro ao fazer login", "Resposta inesperada do servidor");
  } catch (err: any) {
    const { status, msg } = errorStatus(err);

    const messages: Record<number, string> = {
      404: "Usuário não encontrado! Verifique o e-mail ou CPF/CNPJ informado.",
      429: "Muitas tentativas. Aguarde 1 minuto antes de tentar novamente."
    };

    if (msg == "User not found") {
      emit("change_auth", state.identifier.value);
      return;
    }

    if (messages[status]) {
      notifyWarning(
        messages[status] ?? "Ocorreu um erro ao verificar o usuário"
      );
    } else {
      notifyNegative(
        "Ocorreu um erro ao verificar o usuário",
        (err as Error)?.message ?? "Tente novamente mais tarde"
      );
    }
  } finally {
    identifying.value = false;
  }
}

function goBackToIdentify() {
  step.value = "identify";
  state.password.value = "";
}

/** Envia as credenciais, guarda o token e redireciona ao painel. */
async function handleSubmit() {
  submitting.value = true;
  try {
    const { data, error } = await services.auth.login({
      identificator: normalizedIdentifier(),
      password: state.password.value
    });

    if (!error) {
      const token = data.data?.token;
      if (!token) {
        notifyNegative(
          "Erro ao fazer login",
          "Resposta inesperada do servidor"
        );
        return;
      }

      window.localStorage.setItem("token", token);
      userStore.setCurrentUser(data.data);

      await router.push("/");
      $q.notify({
        type: "positive",
        message: "Login efetuado com sucesso!",
        caption: "Bem-vindo(a)!",
        timeout: 3000
      });
      return;
    }
  } catch (err: any) {
    const { status, msg } = errorStatus(err);

    const messages: Record<number, string> = {
      401: "E-mail/CPF-CNPJ ou senha inválidos",
      400: "Ocorreu um erro ao fazer login",
      500: "Ocorreu um erro ao fazer login"
    };

    if (messages[status]) {
      notifyWarning(messages[status] ?? "Ocorreu um erro ao fazer login");
    } else {
      notifyNegative(
        "Erro inesperado",
        (err as Error)?.message ?? "Tente novamente mais tarde"
      );
    }
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped lang="scss">
.app-auth-form__title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 900;
  color: #1f2937;
}

.app-auth-form__subtitle {
  margin: 4px 0 0;
  font-size: 0.875rem;
  color: var(--app-muted);
}

.app-auth-form__field {
  & + & {
    margin-top: 12px;
  }
}

.app-auth-form__submit {
  background: var(--app-green);
  color: #fff;

  &:hover {
    background: var(--app-dark);
  }

  &:before {
    box-shadow: none !important;
  }
}

.app-auth-form__back {
  align-self: flex-start;

  &:hover {
    color: #1f2937 !important;
  }
}
</style>
