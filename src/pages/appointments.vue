<template>
  <AppLayout title="Agendamentos">
    <div class="app-page-content">
      <div class="row items-center justify-between q-mb-md q-gutter-y-sm">
        <div>
          <h1 class="app-page-content__title">Agendamentos</h1>
          <p class="app-page-content__subtitle">
            Gerencie os agendamentos da clínica
          </p>
        </div>
        <q-btn
          unelevated
          no-caps
          icon="fa-solid fa-plus"
          label="Novo Agendamento"
          class="app-btn-primary"
          @click="createAppointment()"
        />
      </div>

      <q-tabs
        v-model="activeTab"
        no-caps
        inline-label
        align="left"
        active-color="primary"
        indicator-color="primary"
        class="text-grey-6 q-mb-md"
      >
        <q-tab name="tabela" icon="fa-solid fa-list" label="Tabela" />
        <q-tab
          name="calendario"
          icon="fa-solid fa-calendar-days"
          label="Calendário"
        />
      </q-tabs>

      <div v-if="hasError" class="column items-center justify-center q-py-xl">
        <i class="fa-solid fa-triangle-exclamation text-h4 text-red-300"></i>
        <p class="text-caption text-grey-6 q-mt-sm">
          Erro ao carregar os agendamentos. Tente novamente.
        </p>
      </div>
      <q-tab-panels
        v-else
        v-model="activeTab"
        animated
        class="bg-transparent q-pa-none"
      >
        <q-tab-panel name="tabela" class="q-pa-none">
          <AppointmentsTable
            :appointments="appointments"
            :loading="isLoading"
            @edit="editAppointment"
            @remove="deleteAppointment"
          />
        </q-tab-panel>
        <q-tab-panel name="calendario" class="q-pa-none">
          <AppointmentCalendar
            :appointments="appointments"
            :slots="slots"
            :professionals="professionals"
            :loading="isLoading"
            @edit="editAppointment"
            @remove="deleteAppointment"
            @create-for-date="createForDate"
            @create-from-slot="createFromSlot"
          />
        </q-tab-panel>
      </q-tab-panels>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useQuasar } from "quasar";
import AppLayout from "@/components/layout/AppLayout.vue";
import AppointmentsTable from "@/components/tables/AppointmentsTable.vue";
import AppointmentCalendar, {
  type CalendarAppointment,
  type CalendarProfessional,
  type CalendarSlot
} from "@/components/calendar/AppointmentCalendar.vue";
import ModalAppointmentEdit from "@/components/modals/ModalAppointmentEdit.vue";
import { confirmDelete } from "@/utils/confirm";
import services from "@/services";
import toasty from "@/utils/toast";

defineOptions({ name: "AppointmentsPage" });

const $q = useQuasar();

const activeTab = ref<"tabela" | "calendario">("tabela");
const isLoading = ref(true);
const hasError = ref(false);
const appointments = ref<CalendarAppointment[]>([]);
const slots = ref<CalendarSlot[]>([]);
const professionals = ref<CalendarProfessional[]>([]);

function openAppointmentModal(props: Record<string, unknown>) {
  $q.dialog({
    component: ModalAppointmentEdit,
    componentProps: props
  }).onOk(() => {
    void fetchAppointments();
  });
}

function createAppointment() {
  openAppointmentModal({ title: "Novo Agendamento" });
}

function createForDate(date: Date) {
  openAppointmentModal({
    title: "Novo Agendamento",
    prefill: { date: date.toISOString() }
  });
}

function createFromSlot(slot: Record<string, unknown>) {
  openAppointmentModal({
    title: "Novo Agendamento",
    prefill: {
      date: slot.startTime as string,
      start_time: slot.startTime as string,
      end_time: slot.endTime as string,
      professional_id: slot.professionalId as string,
      schedule_slot_id: slot.id as string
    }
  });
}

function editAppointment(data: Record<string, unknown>) {
  openAppointmentModal({
    appointment_id: data.id as string,
    title: "Editar Agendamento"
  });
}

async function deleteAppointment(data: Record<string, unknown>) {
  const confirmed = await confirmDelete("Excluir este agendamento?");
  if (!confirmed) return;

  try {
    await services.appointments.destroy(String(data.id));
    toasty.successToasty({
      title: "Agendamento excluído com sucesso!",
      msg: "Sucesso"
    });
    await fetchAppointments();
  } catch (err) {
    toasty.errorToasty(
      { title: "Erro ao excluir agendamento", msg: "Erro" },
      err
    );
  }
}

async function fetchAppointments() {
  isLoading.value = true;
  hasError.value = false;
  try {
    const [appointmentsData, slotsData, professionalsData] = await Promise.all([
      services.appointments.getAll({
        preload: "patient,professional,exam,procedure",
        limit: 500
      }),
      services.scheduleSlots.getAll({ limit: 500 }),
      services.professionals.getAll({ limit: 200 })
    ]);
    appointments.value = appointmentsData ?? [];
    slots.value = slotsData ?? [];
    professionals.value = professionalsData ?? [];
  } catch {
    hasError.value = true;
  } finally {
    isLoading.value = false;
  }
}

onMounted(() => {
  void fetchAppointments();
});
</script>
