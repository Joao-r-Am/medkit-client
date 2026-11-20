<template>
  <AppLayout title="Equipe">
    <div class="app-page-content col flex column">
      <div class="row items-center justify-between q-mb-md q-gutter-y-sm">
        <div>
          <h1 class="text-h5 text-weight-bolder text-grey-8 q-my-none">
            Equipe
          </h1>
          <p class="text-body2 text-grey-7 q-mb-none">
            Convites de novos membros para esta clínica
          </p>
        </div>
        <q-btn
          unelevated
          no-caps
          color="primary"
          icon="person_add"
          label="Convidar"
          data-test="open-invite"
          @click="inviteDialogOpen = true"
        />
      </div>

      <div class="row items-center justify-between q-mb-md q-gutter-sm">
        <q-select
          v-model="statusFilter"
          :options="filterOptions"
          option-label="label"
          option-value="value"
          emit-value
          map-options
          outlined
          dense
          label="Filtrar por status"
          style="min-width: 220px"
          data-test="status-filter"
        />
        <span
          v-if="teamLimit"
          class="text-caption text-grey-7"
          data-test="team-limit"
        >
          Limite da clínica: {{ teamLimit }} usuários
        </span>
      </div>

      <div v-if="loading" class="column q-gutter-md">
        <q-card v-for="n in 3" :key="n" flat bordered class="q-pa-md">
          <q-skeleton type="text" width="40%" height="20px" />
          <q-skeleton type="text" width="25%" height="14px" class="q-mt-sm" />
        </q-card>
      </div>

      <q-card v-else-if="error" flat bordered class="q-pa-xl">
        <div class="column items-center q-gutter-md">
          <q-icon name="error_outline" size="48px" color="negative" />
          <p class="text-body1 text-grey-8 q-my-none">{{ error }}</p>
          <q-btn
            unelevated
            no-caps
            color="primary"
            label="Tentar novamente"
            @click="loadInvitations"
          />
        </div>
      </q-card>

      <div
        v-else-if="visibleInvitations.length === 0"
        class="column items-center q-py-xl q-gutter-md"
      >
        <q-icon name="group_add" size="64px" color="grey-5" />
        <h2 class="text-h6 text-weight-bolder text-grey-8 q-my-none">
          {{ emptyTitle }}
        </h2>
        <p class="text-body1 text-grey-7 text-center" style="max-width: 420px">
          Convide profissionais e operadores por e-mail. O convite expira em 7
          dias e pode ser revogado a qualquer momento antes do aceite.
        </p>
        <q-btn
          v-if="statusFilter === 'all'"
          unelevated
          no-caps
          color="primary"
          icon="person_add"
          label="Convidar membro"
          data-test="empty-invite"
          @click="inviteDialogOpen = true"
        />
      </div>

      <div v-else class="column q-gutter-md">
        <q-card
          v-for="invitation in visibleInvitations"
          :key="invitation.id"
          flat
          bordered
          class="q-pa-md"
          :data-test="`invitation-${invitation.id}`"
        >
          <div class="row items-center justify-between q-gutter-sm">
            <div class="column">
              <span class="text-body1 text-weight-medium text-grey-9">
                {{ invitation.email }}
              </span>
              <span class="text-caption text-grey-7">
                {{ detailsLabel(invitation) }}
              </span>
            </div>

            <div class="row items-center q-gutter-sm">
              <q-chip
                v-if="invitation.role"
                outline
                color="primary"
                dense
                no-caps
              >
                {{ roleLabel(invitation.role.name) }}
              </q-chip>
              <q-chip
                :color="statusColor(invitation)"
                text-color="white"
                dense
                no-caps
              >
                {{ statusLabel(invitation) }}
              </q-chip>
              <q-btn
                v-if="isPending(invitation)"
                flat
                dense
                no-caps
                color="primary"
                icon="forward_to_inbox"
                label="Reenviar"
                :loading="resendingId === invitation.id"
                :data-test="`resend-${invitation.id}`"
                @click="resend(invitation)"
              />
              <q-btn
                v-if="isPending(invitation)"
                flat
                dense
                no-caps
                color="negative"
                icon="block"
                label="Revogar"
                :data-test="`revoke-${invitation.id}`"
                @click="openRevoke(invitation)"
              />
            </div>
          </div>
        </q-card>
      </div>

      <InviteDialog v-model="inviteDialogOpen" @created="loadInvitations" />

      <q-dialog v-model="revokeDialogOpen">
        <q-card style="width: 420px; max-width: 92vw">
          <q-card-section>
            <div class="text-h6 text-weight-bolder text-grey-8">
              Revogar convite
            </div>
            <p class="text-body2 text-grey-7 q-mt-xs q-mb-none">
              O link de {{ revokeTarget?.email }} deixará de funcionar. Deseja
              continuar?
            </p>
          </q-card-section>
          <q-card-actions align="right">
            <q-btn flat no-caps label="Cancelar" @click="closeRevoke" />
            <q-btn
              unelevated
              no-caps
              color="negative"
              label="Revogar"
              :loading="revoking"
              data-test="confirm-revoke"
              @click="revoke"
            />
          </q-card-actions>
        </q-card>
      </q-dialog>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useQuasar } from "quasar";
import AppLayout from "@/components/layout/AppLayout.vue";
import InviteDialog from "@/components/team/InviteDialog.vue";
import services from "@/services";
import { useClinicStore } from "@/stores/clinic";
import { errorCodeOf, errorStatusOf } from "@/utils/api-error";
import { formatDate } from "@/utils/date";
import { roleLabel } from "@/utils/roles";
import type { ITeamInvitation } from "@/interfaces/invitation";

defineOptions({ name: "TeamPage" });

type StatusFilter = "all" | "pending" | "accepted" | "revoked";
type EffectiveStatus = "pending" | "accepted" | "revoked" | "expired";

const $q = useQuasar();
const clinicStore = useClinicStore();

const invitations = ref<ITeamInvitation[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);
const statusFilter = ref<StatusFilter>("all");
const inviteDialogOpen = ref(false);
const resendingId = ref<string | null>(null);
const revokeTarget = ref<ITeamInvitation | null>(null);
const revokeDialogOpen = ref(false);
const revoking = ref(false);

const filterOptions = [
  { label: "Todos", value: "all" },
  { label: "Pendentes", value: "pending" },
  { label: "Aceitos", value: "accepted" },
  { label: "Revogados", value: "revoked" }
];

const teamLimit = computed(
  () => clinicStore.state.activeContext?.clinic?.max_users ?? null
);

const visibleInvitations = computed(() =>
  invitations.value.filter(
    invitation =>
      statusFilter.value === "all" ||
      effectiveStatus(invitation) === statusFilter.value
  )
);

const emptyTitle = computed(() =>
  statusFilter.value === "all"
    ? "Nenhum convite ainda"
    : "Nenhum convite neste status"
);

onMounted(() => {
  void loadInvitations();
});

async function loadInvitations(): Promise<void> {
  const clinicId = clinicStore.state.activeContext?.clinic_id;
  if (!clinicId) {
    loading.value = false;
    error.value = "Selecione uma clínica para gerenciar a equipe.";
    return;
  }

  loading.value = true;
  error.value = null;
  try {
    invitations.value = await services.invitations.list(clinicId);
  } catch (err) {
    invitations.value = [];
    error.value =
      errorStatusOf(err) === 403
        ? "Você não tem permissão para ver a equipe desta clínica."
        : "Não foi possível carregar os convites.";
  } finally {
    loading.value = false;
  }
}

/** "Expirado" é derivado no cliente: a API guarda só pending/accepted/revoked. */
function effectiveStatus(invitation: ITeamInvitation): EffectiveStatus {
  if (invitation.status !== "pending") return invitation.status;
  return new Date(invitation.expires_at).getTime() < Date.now()
    ? "expired"
    : "pending";
}

function isPending(invitation: ITeamInvitation): boolean {
  return invitation.status === "pending";
}

function statusLabel(invitation: ITeamInvitation): string {
  const labels: Record<EffectiveStatus, string> = {
    pending: "Pendente",
    accepted: "Aceito",
    revoked: "Revogado",
    expired: "Expirado"
  };
  return labels[effectiveStatus(invitation)];
}

function statusColor(invitation: ITeamInvitation): string {
  const colors: Record<EffectiveStatus, string> = {
    pending: "warning",
    accepted: "positive",
    revoked: "grey-6",
    expired: "grey-6"
  };
  return colors[effectiveStatus(invitation)];
}

function detailsLabel(invitation: ITeamInvitation): string {
  const parts: string[] = [];
  if (invitation.invited_by)
    parts.push(`Convidado por ${invitation.invited_by.name}`);
  if (invitation.status === "accepted" && invitation.accepted_at) {
    parts.push(`Aceito em ${formatDate(invitation.accepted_at)}`);
  } else if (effectiveStatus(invitation) === "expired") {
    parts.push(`Expirou em ${formatDate(invitation.expires_at)}`);
  } else if (effectiveStatus(invitation) === "pending") {
    parts.push(`Expira em ${formatDate(invitation.expires_at)}`);
  }
  return parts.join(" · ");
}

async function resend(invitation: ITeamInvitation): Promise<void> {
  const clinicId = clinicStore.state.activeContext?.clinic_id;
  if (!clinicId) return;

  resendingId.value = invitation.id;
  try {
    await services.invitations.resend(clinicId, invitation.id);
    $q.notify({
      type: "positive",
      message: "Convite reenviado!",
      caption: "O convite foi renovado por mais 7 dias.",
      timeout: 3000
    });
    await loadInvitations();
  } catch (err) {
    $q.notify({
      type: "negative",
      message:
        errorCodeOf(err) === "INVITATION_NOT_PENDING"
          ? "Este convite não está mais pendente."
          : "Não foi possível reenviar o convite.",
      timeout: 3000
    });
  } finally {
    resendingId.value = null;
  }
}

function openRevoke(invitation: ITeamInvitation): void {
  revokeTarget.value = invitation;
  revokeDialogOpen.value = true;
}

function closeRevoke(): void {
  revokeDialogOpen.value = false;
  revokeTarget.value = null;
}

async function revoke(): Promise<void> {
  const clinicId = clinicStore.state.activeContext?.clinic_id;
  const target = revokeTarget.value;
  if (!clinicId || !target) return;

  revoking.value = true;
  try {
    await services.invitations.revoke(clinicId, target.id);
    closeRevoke();
    $q.notify({
      type: "info",
      message: "Convite revogado.",
      timeout: 2500
    });
    await loadInvitations();
  } catch (err) {
    $q.notify({
      type: "negative",
      message:
        errorCodeOf(err) === "INVITATION_ALREADY_ACCEPTED"
          ? "Este convite já foi aceito e não pode ser revogado."
          : "Não foi possível revogar o convite.",
      timeout: 3000
    });
  } finally {
    revoking.value = false;
  }
}
</script>
