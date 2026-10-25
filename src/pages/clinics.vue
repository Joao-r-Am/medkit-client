<template>
  <AppLayout title="Clínicas">
    <div class="app-clinics col overflow-auto">
      <div class="row items-center justify-between q-mb-md">
        <div>
          <h1 class="text-h5 text-weight-bolder text-grey-8"
            >Minhas clínicas</h1
          >
          <p class="text-body2 text-grey-7">
            Clínicas nas quais você tem vínculo ativo
          </p>
        </div>
        <q-btn
          v-if="!clinicStore.state.loading && !clinicStore.state.error"
          flat
          dense
          icon="refresh"
          color="grey-6"
          @click="reload"
        >
          <q-tooltip>Atualizar</q-tooltip>
        </q-btn>
      </div>

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
          Você ainda não faz parte de nenhuma clínica. Se alguém da equipe
          convidar você, a clínica aparecerá aqui após o aceite do convite.
        </p>
      </div>

      <div v-else class="column q-gutter-md">
        <q-card
          v-for="membership in clinicStore.state.memberships"
          :key="membership.membership_id"
          flat
          bordered
          class="q-pa-md"
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
            </div>
          </div>
        </q-card>

        <p class="text-caption text-grey-6">
          {{ membershipsCountLabel }}
        </p>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { computed, onMounted } from "vue";
import AppLayout from "@/components/layout/AppLayout.vue";
import { useClinicStore } from "@/stores/clinic";
import { MembershipStatus } from "@/interfaces/clinic";

const clinicStore = useClinicStore();

onMounted(() => {
  void clinicStore.fetchMyClinics();
});

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

const membershipsCountLabel = computed(() => {
  const count = clinicStore.state.memberships.length;
  return count === 1 ? "1 vínculo" : `${count} vínculos`;
});
</script>
