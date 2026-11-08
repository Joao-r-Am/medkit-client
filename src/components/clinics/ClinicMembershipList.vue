<template>
  <div class="column full-width">
    <q-banner
      v-if="selectionPending"
      class="q-mb-md rounded-borders"
      data-test="selection-pending"
    >
      <template #avatar>
        <q-icon name="swipe_right" color="primary" />
      </template>
      <p class="text-body2 q-my-none">
        Selecione uma das suas clínicas ativas para continuar.
      </p>
    </q-banner>

    <div v-if="clinicStore.state.loading" class="column q-gutter-md">
      <q-card v-for="n in 2" :key="n" flat bordered class="q-pa-md">
        <q-skeleton type="text" width="40%" height="24px" />
        <q-skeleton type="text" width="25%" height="16px" class="q-mt-sm" />
      </q-card>
    </div>

    <q-card v-else-if="clinicStore.state.error" flat bordered class="q-pa-xl">
      <div class="column items-center q-gutter-md">
        <q-icon name="error_outline" size="48px" color="negative" />
        <p class="text-body1 text-grey-8">
          {{ clinicStore.state.error }}
        </p>
        <q-btn
          unelevated
          no-caps
          color="primary"
          label="Tentar novamente"
          @click="reload"
        />
      </div>
    </q-card>

    <div
      v-else-if="clinicStore.state.memberships.length === 0"
      class="column items-center q-py-xl q-gutter-md"
    >
      <q-icon name="business" size="64px" color="grey-5" />
      <h2 class="text-h6 text-weight-bolder text-grey-8">
        Nenhuma clínica vinculada
      </h2>
      <p class="text-body1 text-grey-7 text-center" style="max-width: 420px">
        Você ainda não faz parte de nenhuma clínica. Crie a sua agora e convide
        a equipe depois — ou aguarde um convite da clínica em que você
        participa.
      </p>
      <q-btn
        unelevated
        no-caps
        color="primary"
        icon="add_business"
        label="Criar minha clínica"
        data-test="empty-create-clinic"
        @click="emit('create')"
      />
    </div>

    <div v-else class="column q-gutter-md">
      <q-card
        v-for="membership in clinicStore.state.memberships"
        :key="membership.membership_id"
        flat
        bordered
        class="q-pa-md"
        :data-test="`membership-${membership.membership_id}`"
      >
        <div class="row items-center justify-between q-gutter-sm">
          <div class="column">
            <span class="text-h6 text-weight-bolder text-grey-8">
              {{ membership.clinic?.name ?? "Clínica" }}
            </span>
            <span
              v-if="membership.clinic?.cnpjf"
              class="text-caption text-grey-7"
            >
              CNPJ {{ membership.clinic.cnpjf }}
            </span>
          </div>

          <div class="row items-center q-gutter-sm">
            <q-chip
              :color="statusColor(membership.status)"
              text-color="white"
              dense
              no-caps
            >
              {{ statusLabel(membership.status) }}
            </q-chip>
            <q-chip
              v-for="role in membership.roles"
              :key="role.id"
              outline
              color="primary"
              dense
              no-caps
            >
              {{ roleLabel(role.name) }}
            </q-chip>
            <q-btn
              v-if="membership.status === MembershipStatus.ACTIVE"
              :outline="!isActiveMember(membership)"
              unelevated
              no-caps
              :color="isActiveMember(membership) ? 'positive' : 'primary'"
              :icon="isActiveMember(membership) ? 'check_circle' : undefined"
              :label="isActiveMember(membership) ? 'Clínica ativa' : 'Entrar'"
              :disable="selectingMembership === membership.membership_id"
              @click="selectMembership(membership)"
            />
          </div>
        </div>
      </q-card>

      <p class="text-caption text-grey-6">
        {{ membershipsCountLabel }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useQuasar } from "quasar";
import { useRouter } from "vue-router";
import { useClinicStore } from "@/stores/clinic";
import { IMyClinic, MembershipStatus } from "@/interfaces/clinic";

defineOptions({ name: "ClinicMembershipList" });

const emit = defineEmits<{ (e: "create"): void }>();

const $q = useQuasar();
const router = useRouter();
const clinicStore = useClinicStore();

const selectingMembership = ref<string | null>(null);

onMounted(() => {
  void clinicStore.fetchMyClinics();
});

const selectionPending = computed(() => {
  if (clinicStore.state.loading || clinicStore.state.error) return false;
  const activeId = clinicStore.state.activeContext?.membership_id;
  return !activeId && clinicStore.activeMemberships().length > 1;
});

const membershipsCountLabel = computed(() => {
  const count = clinicStore.state.memberships.length;
  return count === 1 ? "1 vínculo" : `${count} vínculos`;
});

function isActiveMember(membership: IMyClinic): boolean {
  return (
    clinicStore.state.activeContext?.membership_id === membership.membership_id
  );
}

async function selectMembership(membership: IMyClinic): Promise<void> {
  selectingMembership.value = membership.membership_id;
  try {
    await clinicStore.selectMembership(membership.membership_id);
    $q.notify({
      type: "positive",
      message: `Clínica ${membership.clinic?.name ?? ""} selecionada`,
      timeout: 2000
    });
    await router.push("/");
  } catch {
    $q.notify({
      type: "negative",
      message: "Não foi possível selecionar a clínica.",
      timeout: 2500
    });
  } finally {
    selectingMembership.value = null;
  }
}

function reload(): void {
  void clinicStore.fetchMyClinics(true);
}

function statusLabel(status: MembershipStatus): string {
  if (status === MembershipStatus.ACTIVE) return "Ativo";
  if (status === MembershipStatus.SUSPENDED) return "Suspenso";
  return "Removido";
}

function statusColor(status: MembershipStatus): string {
  if (status === MembershipStatus.ACTIVE) return "positive";
  if (status === MembershipStatus.SUSPENDED) return "warning";
  return "negative";
}

function roleLabel(name: string): string {
  const labels: Record<string, string> = {
    owner: "Proprietário",
    admin: "Administrador",
    professional: "Profissional",
    operator: "Operador"
  };
  return labels[name] ?? name;
}
</script>
