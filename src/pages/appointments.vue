<template>
  <AppLayout title="Agendamentos">
    <div class="app-page-content col flex column">
      <div class="row items-center justify-between">
        <div>
          <h1 class="app-page-content__title">Agendamentos</h1>
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

      <FilterBar @apply="applyFilters" @reset="resetFilters">
        <FilterDoctor
          v-model="selectedProfessionalIds"
          :professionals="professionals"
        />
        <FilterDateRange v-model="dateRange" />
      </FilterBar>

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
        <q-tab name="semana" icon="fa-solid fa-table-columns" label="Semana" />
      </q-tabs>

      <div v-if="hasError" class="col column items-center justify-center">
        <i class="fa-solid fa-triangle-exclamation text-h4 text-red-300"></i>
        <p class="text-caption text-grey-6 q-mt-sm">
          Erro ao carregar os agendamentos. Tente novamente.
        </p>
      </div>
      <q-tab-panels
        v-else
        v-model="activeTab"
        animated
        class="bg-transparent q-pa-none col"
      >
        <q-tab-panel name="tabela" class="q-pa-none">
          <AppointmentsTable
            :appointments="tableAppointments"
            :loading="isLoading"
            @edit="editAppointment"
            @remove="deleteAppointment"
          />
        </q-tab-panel>
        <q-tab-panel name="calendario" class="q-pa-none">
          <AppointmentCalendar
            :appointments="calendarAppointments"
            :slots="filteredSlots"
            :professionals="professionals"
            :loading="isLoading"
            @edit="editAppointment"
            @remove="deleteAppointment"
            @create-for-date="createForDate"
            @create-from-slot="createFromSlot"
          />
        </q-tab-panel>
        <q-tab-panel name="semana" class="q-pa-none">
          <WeeklyAgenda
            :appointments="weeklyAppointments"
            :loading="isWeeklyLoading"
            @edit="editAppointmentFromWeek"
            @remove="deleteAppointmentFromWeek"
            @create="createForWeekDay"
            @week-change="onWeekChange"
          />
        </q-tab-panel>
      </q-tab-panels>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useQuasar } from "quasar";
import AppLayout from "@/components/layout/AppLayout.vue";
import AppointmentsTable from "@/components/tables/AppointmentsTable.vue";
import WeeklyAgenda from "@/components/weekly/WeeklyAgenda.vue";
import AppointmentCalendar, {
  type CalendarAppointment,
  type CalendarProfessional,
  type CalendarSlot
} from "@/components/calendar/AppointmentCalendar.vue";
import ModalAppointmentEdit from "@/components/modals/ModalAppointmentEdit.vue";
import FilterBar from "@/components/filters/FilterBar.vue";
import FilterDoctor from "@/components/filters/FilterDoctor.vue";
import FilterDateRange from "@/components/filters/FilterDateRange.vue";
import { confirmDelete } from "@/utils/confirm";
import services from "@/services";
import toasty from "@/utils/toast";

defineOptions({ name: "AppointmentsPage" });

const $q = useQuasar();

const activeTab = ref<"tabela" | "calendario" | "semana">("tabela");
const isLoading = ref(true);
const isWeeklyLoading = ref(false);
const hasError = ref(false);
const tableAppointments = ref<CalendarAppointment[]>([]);
const calendarAppointments = ref<CalendarAppointment[]>([]);
const weeklyAppointments = ref<CalendarAppointment[]>([]);
const weeklyRange = ref<{ from: Date; to: Date } | null>(null);
const slots = ref<CalendarSlot[]>([]);
const professionals = ref<CalendarProfessional[]>([]);
const selectedProfessionalIds = ref<string[]>([]);
const dateRange = ref<{ from: string | undefined; to: string | undefined }>({
  from: undefined,
  to: undefined
});

const filteredSlots = computed(() => {
  if (selectedProfessionalIds.value.length === 0) return slots.value;
  return slots.value.filter(slot =>
    selectedProfessionalIds.value.includes(slot.professionalId ?? "")
  );
});

function openAppointmentModal(props: Record<string, unknown>) {
  $q.dialog({
    component: ModalAppointmentEdit,
    componentProps: props
  }).onOk(() => {
    void fetchCalendarData();
    void fetchTableData();
    if (weeklyRange.value) {
      void fetchWeeklyData(weeklyRange.value);
    }
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

function createForWeekDay(data: {
  date: Date;
  hour?: number;
  minute?: number;
}) {
  const date = new Date(data.date);
  if (data.hour !== undefined) {
    date.setHours(data.hour, data.minute ?? 0, 0, 0);
  }
  const end = new Date(date.getTime() + 30 * 60000);
  openAppointmentModal({
    title: "Novo Agendamento",
    prefill: {
      date: date.toISOString(),
      start_time: date.toISOString(),
      end_time: end.toISOString()
    }
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

function editAppointmentFromWeek(appt: CalendarAppointment) {
  openAppointmentModal({
    appointment_id: appt.id,
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
    await fetchCalendarData();
    await fetchTableData();
  } catch (err) {
    toasty.errorToasty(
      { title: "Erro ao excluir agendamento", msg: "Erro" },
      err
    );
  }
}

async function deleteAppointmentFromWeek(appt: CalendarAppointment) {
  const confirmed = await confirmDelete("Excluir este agendamento?");
  if (!confirmed) return;

  try {
    await services.appointments.destroy(appt.id);
    toasty.successToasty({
      title: "Agendamento excluído com sucesso!",
      msg: "Sucesso"
    });
    await fetchCalendarData();
    await fetchTableData();
    if (weeklyRange.value) {
      await fetchWeeklyData(weeklyRange.value);
    }
  } catch (err) {
    toasty.errorToasty(
      { title: "Erro ao excluir agendamento", msg: "Erro" },
      err
    );
  }
}

function getCurrentWeekDates() {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    from: monday.toISOString().split("T")[0]!,
    to: sunday.toISOString().split("T")[0]!
  };
}

async function fetchCalendarData() {
  try {
    const appointmentsData = await services.appointments.getAll({
      preload: "patient,professional,exam,procedure",
      limit: 500,
      ...(selectedProfessionalIds.value.length > 0
        ? { professionalIds: selectedProfessionalIds.value }
        : {})
    });
    calendarAppointments.value = appointmentsData ?? [];
  } catch {
    hasError.value = true;
  }
}

function onWeekChange(range: { from: Date; to: Date }) {
  weeklyRange.value = range;
  void fetchWeeklyData(range);
}

async function fetchWeeklyData(range: { from: Date; to: Date }) {
  isWeeklyLoading.value = true;
  try {
    const appointmentsData = await services.appointments.getAll({
      preload: "patient,professional,exam,procedure",
      limit: 500,
      dateFrom: range.from.toISOString(),
      dateTo: range.to.toISOString(),
      ...(selectedProfessionalIds.value.length > 0
        ? { professionalIds: selectedProfessionalIds.value }
        : {})
    });
    if (weeklyRange.value?.from.getTime() === range.from.getTime()) {
      weeklyAppointments.value = appointmentsData ?? [];
    }
  } catch {
    hasError.value = true;
  } finally {
    isWeeklyLoading.value = false;
  }
}

async function fetchTableData() {
  const params: Record<string, unknown> = {
    preload: "patient,professional,exam,procedure",
    limit: 500
  };

  if (selectedProfessionalIds.value.length) {
    params.professionalIds = selectedProfessionalIds.value;
  }

  if (dateRange.value.from) {
    params.dateFrom = dateRange.value.from;
  }

  if (dateRange.value.to) {
    params.dateTo = dateRange.value.to;
  }

  try {
    const appointmentsData = await services.appointments.getAll(params);
    tableAppointments.value = appointmentsData ?? [];
  } catch {
    hasError.value = true;
  }
}

async function fetchAppointments() {
  isLoading.value = true;
  hasError.value = false;
  try {
    await Promise.all([
      fetchCalendarData(),
      fetchTableData(),
      services.scheduleSlots.getAll({ limit: 500 }),
      services.professionals.getAll({ limit: 200 }).then(data => {
        professionals.value = data ?? [];
      })
    ]);
  } catch {
    hasError.value = true;
  } finally {
    isLoading.value = false;
  }
}

function refetchAll() {
  void fetchCalendarData();
  void fetchTableData();
  if (weeklyRange.value) {
    void fetchWeeklyData(weeklyRange.value);
  }
}

function applyFilters() {
  refetchAll();
}

function resetFilters() {
  selectedProfessionalIds.value = [];
  const weekDates = getCurrentWeekDates();
  dateRange.value = {
    from: weekDates.from as string,
    to: weekDates.to as string
  };
  refetchAll();
}

onMounted(() => {
  const weekDates = getCurrentWeekDates();
  dateRange.value = {
    from: weekDates.from as string,
    to: weekDates.to as string
  };
  void fetchAppointments();
});
</script>

<style scoped lang="scss">
// O painel ativo preenche a área restante; o scroll fica dentro de cada
// componente (tabela, calendário, agenda), nunca na página.
:deep(.q-tab-panels) {
  display: flex;
  flex-direction: column;
}

:deep(.q-tab-panel) {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}
</style>
