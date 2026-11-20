<template>
  <div class="app-accept-invite">
    <main class="app-accept-invite__main">
      <div class="app-accept-invite__card">
        <div v-if="loading" class="column items-center q-gutter-md q-py-lg">
          <q-spinner color="primary" size="32px" />
          <p class="text-body2 text-grey-7 q-my-none">Carregando convite...</p>
        </div>

        <template v-else-if="previewError">
          <div
            class="column items-center q-gutter-md q-py-lg"
            data-test="preview-error"
          >
            <q-icon name="error_outline" size="48px" color="negative" />
            <h1 class="text-h6 text-weight-bolder text-grey-8 q-my-none">
              Convite indisponível
            </h1>
            <p class="text-body2 text-grey-7 text-center q-mb-none">
              {{ previewError }}
            </p>
            <q-btn
              outline
              no-caps
              color="primary"
              label="Ir para o Medkit"
              @click="goToAuth"
            />
          </div>
        </template>

        <template v-else-if="preview">
          <div class="column q-gutter-sm">
            <q-icon name="mark_email_read" size="40px" color="primary" />
            <h1 class="text-h6 text-weight-bolder text-grey-8 q-my-none">
              Convite para {{ preview.clinic.name }}
            </h1>
            <p class="text-body2 text-grey-7 q-my-none">
              <span v-if="preview.role">
                Papel: {{ roleLabel(preview.role.name) }} ·
              </span>
              Convite para <strong>{{ preview.email }}</strong>
            </p>
            <p
              v-if="preview.invited_by"
              class="text-caption text-grey-6 q-my-none"
            >
              Enviado por {{ preview.invited_by }}
            </p>
            <p class="text-caption text-grey-6 q-my-none">
              Expira em {{ formatDate(preview.expires_at) }}
            </p>
          </div>

          <q-banner
            v-if="!hasSession"
            rounded
            dense
            class="q-mt-md"
            style="background-color: #fbf2e3"
            data-test="login-required"
          >
            <p class="text-body2 q-my-none">
              Entre ou crie sua conta com o e-mail
              <strong>{{ preview.email }}</strong> para aceitar o convite.
            </p>
          </q-banner>

          <div class="column q-gutter-sm q-mt-lg">
            <q-btn
              v-if="hasSession"
              unelevated
              no-caps
              color="primary"
              icon="check_circle"
              label="Aceitar convite"
              :loading="accepting"
              data-test="accept-invite"
              @click="accept"
            />
            <q-btn
              v-else
              unelevated
              no-caps
              color="primary"
              icon="login"
              label="Entrar ou criar conta"
              data-test="go-to-auth"
              @click="goToAuthWithInvite"
            />
            <q-btn
              v-if="hasSession"
              flat
              no-caps
              color="primary"
              label="Usar outra conta"
              data-test="switch-account"
              @click="logoutAndGoToAuth"
            />
          </div>
        </template>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useQuasar } from "quasar";
import { useRoute, useRouter } from "vue-router";
import services from "@/services";
import { useClinicStore } from "@/stores/clinic";
import { useUserStore } from "@/stores/user";
import { errorCodeOf, errorStatusOf } from "@/utils/api-error";
import { formatDate } from "@/utils/date";
import {
  clearPendingInviteToken,
  storePendingInviteToken
} from "@/utils/pending-invite";
import { roleLabel } from "@/utils/roles";
import type { IPublicInvitation } from "@/interfaces/invitation";

defineOptions({ name: "AcceptInvitePage" });

const $q = useQuasar();
const route = useRoute();
const router = useRouter();
const clinicStore = useClinicStore();
const userStore = useUserStore();

const token = computed(() => {
  const raw = (route.params as Record<string, unknown>).token;
  return Array.isArray(raw) ? String(raw[0] ?? "") : String(raw ?? "");
});

const preview = ref<IPublicInvitation | null>(null);
const loading = ref(true);
const previewError = ref<string | null>(null);
const accepting = ref(false);
const hasSession = computed(() => !!window.localStorage.getItem("token"));

onMounted(() => {
  void loadPreview();
});

async function loadPreview(): Promise<void> {
  loading.value = true;
  previewError.value = null;
  try {
    preview.value = await services.invitations.preview(token.value);
  } catch (error) {
    preview.value = null;
    previewError.value = previewErrorMessage(error);
  } finally {
    loading.value = false;
  }
}

function previewErrorMessage(error: unknown): string {
  if (errorStatusOf(error) === 410) {
    return "Este convite expirou. Peça um novo convite ao administrador da clínica.";
  }
  if (errorStatusOf(error) === 404) {
    return "Convite não encontrado ou já utilizado.";
  }
  return "Não foi possível carregar o convite agora. Tente novamente mais tarde.";
}

function goToAuth(): void {
  void router.push("/auth");
}

function goToAuthWithInvite(): void {
  storePendingInviteToken(token.value);
  void router.push("/auth");
}

/** Troca de conta: encerra a sessão atual e mantém o convite pendente. */
function logoutAndGoToAuth(): void {
  storePendingInviteToken(token.value);
  userStore.cleanCurrentUser();
  clinicStore.$reset();
  window.localStorage.removeItem("token");
  void router.push("/auth");
}

async function accept(): Promise<void> {
  accepting.value = true;
  try {
    const target = await clinicStore.acceptInvitation(token.value);
    $q.notify({
      type: "positive",
      message: "Convite aceito!",
      caption: "Bem-vindo(a) à equipe.",
      timeout: 3000
    });
    await router.push(target);
  } catch (error) {
    await handleAcceptError(error);
  } finally {
    accepting.value = false;
  }
}

async function handleAcceptError(error: unknown): Promise<void> {
  const code = errorCodeOf(error);

  if (code === "MEMBER_ALREADY_LINKED") {
    clearPendingInviteToken();
    $q.notify({
      type: "info",
      message: "Você já faz parte desta clínica.",
      timeout: 3000
    });
    await router.push(await clinicStore.resolveClinicRoute());
    return;
  }

  const messages: Record<string, string> = {
    INVITATION_EMAIL_MISMATCH: `Este convite foi emitido para ${preview.value?.email ?? "outro e-mail"}. Entre com a conta correta para aceitar.`,
    INVITATION_EXPIRED: "Este convite expirou. Peça um novo ao administrador.",
    INVITATION_NOT_FOUND: "Convite não encontrado ou já utilizado.",
    MEMBERSHIP_SUSPENDED:
      "Seu vínculo com esta clínica está suspenso. Fale com o administrador.",
    ROLE_NOT_INVITABLE: "O papel deste convite não é mais válido."
  };

  $q.notify({
    type: "negative",
    message: messages[code] ?? "Não foi possível aceitar o convite.",
    timeout: 4000
  });
}
</script>

<style scoped>
.app-accept-invite {
  display: flex;
  min-height: 100vh;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: #fbf2e3;
}

.app-accept-invite__main {
  width: 100%;
  max-width: 28rem;
}

.app-accept-invite__card {
  padding: 32px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 20px 50px rgba(42, 26, 26, 0.08);
  outline: 1px solid rgba(42, 26, 26, 0.08);
}
</style>
