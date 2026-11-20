<template>
  <q-dialog v-model="openModel" @before-hide="resetForm">
    <q-card style="width: 460px; max-width: 92vw">
      <q-card-section>
        <div class="text-h6 text-weight-bolder text-grey-8">
          Convidar para a equipe
        </div>
        <p class="text-body2 text-grey-7 q-mt-xs q-mb-none">
          Enviamos um convite por e-mail. O convite expira em 7 dias.
        </p>
      </q-card-section>

      <q-form class="q-px-md" @submit.prevent="submit">
        <q-input
          v-model="form.email"
          label="E-mail *"
          type="email"
          outlined
          dense
          :rules="[requiredField('Informe o e-mail'), validEmail]"
          data-test="invite-email"
        />
        <q-select
          v-model="form.role_id"
          :options="roleOptions"
          option-label="label"
          option-value="value"
          emit-value
          map-options
          outlined
          dense
          label="Papel *"
          class="q-mt-sm"
          :loading="loadingRoles"
          :rules="[requiredField('Selecione o papel')]"
          data-test="invite-role"
        />

        <p
          v-if="rolesError"
          class="text-caption text-negative q-mb-none"
          data-test="roles-error"
        >
          {{ rolesError }}
        </p>

        <q-card-actions align="right">
          <q-btn flat no-caps label="Cancelar" @click="openModel = false" />
          <q-btn
            unelevated
            no-caps
            color="primary"
            label="Enviar convite"
            type="submit"
            icon="send"
            :loading="submitting"
            data-test="submit-invite"
          />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useQuasar } from "quasar";
import services from "@/services";
import { useClinicStore } from "@/stores/clinic";
import { errorCodeOf, errorStatusOf } from "@/utils/api-error";
import { roleLabel } from "@/utils/roles";

defineOptions({ name: "InviteDialog" });

type ValidationRule = (value: unknown) => true | string;

const openModel = defineModel<boolean>({ required: true });

const emit = defineEmits<{ (e: "created"): void }>();

const $q = useQuasar();
const clinicStore = useClinicStore();

const form = ref({ email: "", role_id: "" });
const submitting = ref(false);
const loadingRoles = ref(false);
const rolesError = ref<string | null>(null);
const roles = ref<{ id: string; name: string }[]>([]);

/**
 * Só papéis de sistema são convidáveis, e o owner nunca é concedido por
 * convite (a API também valida — aqui evitamos oferecer a opção).
 */
const roleOptions = computed(() =>
  roles.value
    .filter(role => role.name !== "owner")
    .map(role => ({ label: roleLabel(role.name), value: role.id }))
);

watch(
  openModel,
  open => {
    if (open) void loadRoles();
  },
  { immediate: true }
);

async function loadRoles(): Promise<void> {
  const clinicId = clinicStore.state.activeContext?.clinic_id;
  if (!clinicId) {
    rolesError.value = "Selecione uma clínica para convidar a equipe.";
    return;
  }

  loadingRoles.value = true;
  rolesError.value = null;
  try {
    const all = await services.clinics.roles(clinicId);
    roles.value = all
      .filter(role => role.is_system)
      .map(role => ({
        id: role.id,
        name: role.name
      }));
  } catch (error) {
    rolesError.value =
      errorStatusOf(error) === 403
        ? "Você não tem permissão para convidar membros."
        : "Não foi possível carregar os papéis agora.";
  } finally {
    loadingRoles.value = false;
  }
}

function requiredField(message: string): ValidationRule {
  return value => (value && String(value).trim().length > 0 ? true : message);
}

function validEmail(value: unknown): true | string {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value ?? "").trim())
    ? true
    : "E-mail inválido";
}

function createErrorMessage(error: unknown): string {
  const code = errorCodeOf(error);

  if (code === "TEAM_LIMIT_REACHED") {
    const details = (
      error as {
        response?: { data?: { details?: { max_users?: number } } };
      }
    ).response?.data?.details;
    const limit = details?.max_users;
    return limit
      ? `Limite de ${limit} usuários da clínica atingido.`
      : "Limite de usuários da clínica atingido.";
  }

  const messages: Record<string, string> = {
    INVITATION_PENDING: "Já existe um convite pendente para este e-mail.",
    MEMBER_ALREADY_LINKED: "Este e-mail já é membro da clínica.",
    MEMBER_SUSPENDED: "Este e-mail tem vínculo suspenso nesta clínica.",
    ROLE_NOT_ADMINISTRABLE:
      "Você não pode conceder permissões que excedem as suas.",
    ROLE_NOT_INVITABLE: "Este papel não pode ser concedido por convite.",
    ROLE_NOT_FOUND: "Papel não encontrado. Recarregue a lista."
  };

  const message = messages[code];
  if (message) {
    return message;
  }

  if (errorStatusOf(error) === 403) {
    return "Você não tem permissão para convidar membros.";
  }

  return "Não foi possível enviar o convite.";
}

async function submit(): Promise<void> {
  const clinicId = clinicStore.state.activeContext?.clinic_id;
  if (!clinicId) return;

  submitting.value = true;
  try {
    await services.invitations.create(clinicId, {
      email: form.value.email.trim().toLowerCase(),
      role_id: form.value.role_id
    });
    openModel.value = false;
    $q.notify({
      type: "positive",
      message: "Convite enviado!",
      caption: "O destinatário receberá o link por e-mail.",
      timeout: 3000
    });
    emit("created");
  } catch (error) {
    $q.notify({
      type: "negative",
      message: createErrorMessage(error),
      timeout: 3500
    });
  } finally {
    submitting.value = false;
  }
}

function resetForm(): void {
  form.value = { email: "", role_id: "" };
  submitting.value = false;
  rolesError.value = null;
}
</script>
