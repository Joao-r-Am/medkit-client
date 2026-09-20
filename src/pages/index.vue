<template>
  <AppLayout title="Home">
    <div class="app-dashboard col overflow-auto">
      <div class="q-mb-lg">
        <h1 class="text-h6 text-weight-bolder text-grey-9">Home</h1>
        <p class="text-caption text-grey-6"> Bem-vindo, {{ userName }} </p>
      </div>

      <div class="row q-col-gutter-md">
        <div class="col-12 col-sm-6">
          <q-card
            flat
            class="app-dashboard__card cursor-pointer"
            @click="go('/appointments')"
          >
            <i class="fa-solid fa-book-medical app-dashboard__icon"></i>
            <div class="column">
              <span class="app-dashboard__value">{{
                appointments.length
              }}</span>
              <span class="app-dashboard__label">Agendamentos</span>
            </div>
          </q-card>
        </div>

        <div class="col-12 col-sm-6">
          <q-card
            flat
            class="app-dashboard__card cursor-pointer"
            @click="go('/appointments')"
          >
            <i class="fa-solid fa-calendar-check app-dashboard__icon"></i>
            <div class="column">
              <template v-if="lastAppointment">
                <span class="app-dashboard__value--sm">
                  {{ lastAppointment.patient?.name ?? "—" }}
                </span>
                <small class="text-caption text-grey-5">
                  {{
                    lastAppointment.patient?.phone ??
                    lastAppointment.patient?.email ??
                    ""
                  }}
                </small>
              </template>
              <span v-else class="app-dashboard__value--sm">
                Nenhum agendamento cadastrado
              </span>
              <span class="app-dashboard__label">Último Agendamento</span>
            </div>
          </q-card>
        </div>

        <div class="col-12 col-sm-6">
          <q-card
            flat
            class="app-dashboard__card cursor-pointer"
            @click="go('/patients')"
          >
            <i class="fa-solid fa-person-circle-plus app-dashboard__icon"></i>
            <div class="column">
              <span class="app-dashboard__value">{{ patients.length }}</span>
              <span class="app-dashboard__label">Pacientes Cadastrados</span>
            </div>
          </q-card>
        </div>

        <div class="col-12 col-sm-6">
          <q-card
            flat
            class="app-dashboard__card cursor-pointer"
            @click="go('/patients')"
          >
            <i class="fa-regular fa-face-smile app-dashboard__icon"></i>
            <div class="column">
              <template v-if="lastPatient">
                <span class="app-dashboard__value--sm">{{
                  lastPatient.name
                }}</span>
                <small class="text-caption text-grey-5">
                  {{ lastPatient.phone ?? lastPatient.email ?? "" }}
                </small>
              </template>
              <span v-else class="app-dashboard__value--sm">
                Nenhum paciente cadastrado
              </span>
              <span class="app-dashboard__label">Cliente mais recente</span>
            </div>
          </q-card>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import AppLayout from "@/components/layout/AppLayout.vue";
import type { IAppointment, IPatient } from "@/interfaces/models";
import services from "@/services";
import toasty from "@/utils/toast";

defineOptions({ name: "HomePage" });

const router = useRouter();
const patients = ref<IPatient[]>([]);
const appointments = ref<IAppointment[]>([]);

const lastAppointment = computed(
  () => appointments.value[0] as IAppointment | undefined
);
const lastPatient = computed(() => patients.value[0] as IPatient | undefined);

const userName = computed(() => {
  const raw = window.localStorage.getItem("user");
  try {
    return (
      (raw ? (JSON.parse(raw) as { name?: string }) : {})?.name ?? "Usuário"
    );
  } catch {
    return "Usuário";
  }
});

function go(to: string) {
  void router.push(to);
}

async function loadData() {
  try {
    const [pData, aData] = await Promise.all([
      services.patients.getAll(),
      services.appointments.getAll()
    ]);
    patients.value = pData;
    appointments.value = aData;
  } catch (error) {
    toasty.errorToasty({ msg: "", title: "Erro ao carregar dados" }, error);
  }
}

onMounted(() => {
  void loadData();
});
</script>

<style scoped lang="scss">
.app-dashboard {
  padding: 16px;
}

.app-dashboard__card {
  display: flex;
  align-items: center;
  gap: 16px;
  min-height: 100px;
  margin: 4px;
  padding: 24px;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.app-dashboard__icon {
  font-size: 1.875rem;
  color: var(--app-green);
}

.app-dashboard__value {
  font-size: 1.5rem;
  font-weight: 800;
  color: #2d3748;
}

.app-dashboard__value--sm {
  font-weight: 700;
  color: #2d3748;
}

.app-dashboard__label {
  font-size: 0.875rem;
  color: #718096;
}
</style>
