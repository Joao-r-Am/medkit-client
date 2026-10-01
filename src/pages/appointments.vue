<template>
  <AppLayout title="Agendamentos">
    <div
      class="app-page-content app-page-content--wide col flex column remove-margin"
    >
      <!--
        Título + ações com flex gap (não os gutters do Quasar: gap cria espaço
        real, sem margem negativa nem padding dentro do q-btn).
        Desktop (≥1024px): 2 botões sempre visíveis + barra de filtros no
        fluxo. Mobile (<1024px): tudo num menu só (⋮) — devolve ~150px de
        altura para o calendário e a agenda semanal ocuparem a tela.
      -->
      <div class="page-header">
        <h1 class="app-page-content__title">Agendamentos</h1>

        <div v-if="!isMobile" class="page-header__actions">
          <q-btn
            unelevated
            no-caps
            icon="fa-solid fa-plus"
            label="Novo Agendamento"
            class="app-btn-primary"
            @click="createAppointment()"
          />
          <q-btn
            unelevated
            no-caps
            outline
            color="dark"
            icon="fa-solid fa-link"
            label="Enviar Convite"
            @click="openInviteModal()"
          />
        </div>

        <q-btn-dropdown
          v-else
          ref="actionsMenuRef"
          flat
          round
          dense
          icon="fa-solid fa-ellipsis-vertical"
          toggle-aria-label="Ações e filtros"
          content-class="app-appointments-menu"
        >
          <q-list>
            <q-item v-close-popup clickable @click="createAppointment()">
              <q-item-section avatar>
                <q-icon name="fa-solid fa-plus" size="sm" />
              </q-item-section>
              <q-item-section>Novo Agendamento</q-item-section>
            </q-item>
            <q-item v-close-popup clickable @click="openInviteModal()">
              <q-item-section avatar>
                <q-icon name="fa-solid fa-link" size="sm" />
              </q-item-section>
              <q-item-section>Enviar Convite</q-item-section>
            </q-item>
          </q-list>

          <q-separator />

          <div class="q-pa-md">
            <FilterBar
              embedded
              @apply="menuApplyFilters"
              @reset="menuResetFilters"
            >
              <FilterDoctor
                v-model="selectedProfessionalIds"
                :professionals="professionals"
              />
              <FilterDateRange v-model="dateRange" />
            </FilterBar>
          </div>
        </q-btn-dropdown>
      </div>

      <FilterBar v-if="!isMobile" @apply="applyFilters" @reset="resetFilters">
        <FilterDoctor
          v-model="selectedProfessionalIds"
          :professionals="professionals"
        />
        <FilterDateRange v-model="dateRange" />
      </FilterBar>

      <q-tabs
        :model-value="activeTab"
        no-caps
        inline-label
        align="left"
        active-color="primary"
        indicator-color="primary"
        class="text-grey-6 q-mb-md"
        @update:model-value="switchTab"
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
        keep-alive
        class="bg-transparent q-pa-none col"
      >
        <q-tab-panel name="tabela" class="q-pa-none">
          <AppointmentsTable
            :loading="loadingTabs.tabela"
            :appointments="tableAppointments"
            @edit="editAppointment"
            @remove="deleteAppointment"
          />
        </q-tab-panel>
        <q-tab-panel name="calendario" class="q-pa-none">
          <!--
            v-show e não v-if: o painel fica em keep-alive e o componente tem
            estado interno (data selecionada); remontar a cada troca de aba
            perderia a posição do usuário.
          -->
          <AppointmentCalendar
            v-show="!loadingTabs.calendario"
            :appointments="calendarAppointments"
            :slots="filteredSlots"
            :professionals="professionals"
            @edit="editAppointment"
            @remove="deleteAppointment"
            @create-for-date="createForDate"
            @create-from-slot="createFromSlot"
          />
          <AppSkeletonPanel v-if="loadingTabs.calendario" />
        </q-tab-panel>
        <q-tab-panel name="semana" class="q-pa-none w-100">
          <WeeklyAgenda
            v-show="!loadingTabs.semana"
            :appointments="weeklyAppointments"
            @edit="editAppointmentFromWeek"
            @remove="deleteAppointmentFromWeek"
            @create="createForWeekDay"
            @week-change="onWeekChange"
          />
          <AppSkeletonPanel v-if="loadingTabs.semana" />
        </q-tab-panel>
      </q-tab-panels>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
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
import ModalInviteCreate from "@/components/modals/ModalInviteCreate.vue";
import FilterBar from "@/components/filters/FilterBar.vue";
import FilterDoctor from "@/components/filters/FilterDoctor.vue";
import FilterDateRange from "@/components/filters/FilterDateRange.vue";
import AppSkeletonPanel from "@/components/feedback/AppSkeletonPanel.vue";
import { confirmDelete } from "@/utils/confirm";
import { getWeekRange } from "@/utils/date";
import type { WeekRange } from "@/utils/date";
import services from "@/services";
import {
  defaultAppointmentFilters,
  invalidate,
  loadAppointmentsPage,
  loadCalendarData,
  loadProfessionalOptions,
  loadScheduleSlots,
  loadTableData,
  loadWeeklyData
} from "@/services/queries";
import toasty from "@/utils/toast";

const $q = useQuasar();

// Corte único md (1024px): abaixo dele ações + filtros moram no menu ⋮.
const isMobile = computed(() => $q.screen.lt.md);

// Ref do menu ⋮ (só existe no mobile) para fechar após Aplicar/Limpar.
const actionsMenuRef = ref<{ hide: () => void } | null>(null);

type Tab = "tabela" | "calendario" | "semana";

// `activeTab` é a aba visível e troca no clique; `loadingTabs` mostra o
// skeleton do painel enquanto os dados daquela aba chegam.
const activeTab = ref<Tab>("tabela");
const loadingTabs = reactive<Record<Tab, boolean>>({
  tabela: true,
  calendario: true,
  semana: true
});
const hasError = ref(false);
const tableAppointments = ref<CalendarAppointment[]>([]);
const calendarAppointments = ref<CalendarAppointment[]>([]);
const weeklyAppointments = ref<CalendarAppointment[]>([]);
const weeklyRange = ref<WeekRange>(getWeekRange());
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

function currentFilters() {
  const defaults = defaultAppointmentFilters();

  return {
    professionalIds: selectedProfessionalIds.value,
    dateFrom: dateRange.value.from ?? defaults.dateFrom,
    dateTo: dateRange.value.to ?? defaults.dateTo
  };
}

const TAB_ERROR = { title: "Não foi possível carregar a aba" };
const WEEK_ERROR = { title: "Não foi possível carregar a semana" };

function openAppointmentModal(props: Record<string, unknown>) {
  $q.dialog({
    component: ModalAppointmentEdit,
    componentProps: props
  }).onOk(() => {
    refetchAll();
  });
}

function createAppointment() {
  openAppointmentModal({ title: "Novo Agendamento" });
}

function openInviteModal() {
  $q.dialog({
    component: ModalInviteCreate,
    componentProps: { title: "Enviar convite de agendamento" }
  }).onOk(() => undefined);
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
    refetchAll();
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
    refetchAll();
  } catch (err) {
    toasty.errorToasty(
      { title: "Erro ao excluir agendamento", msg: "Erro" },
      err
    );
  }
}

// Os fetchers propagam erro; quem trata é o chamador (tela inteira na carga
// inicial, aviso pontual numa troca de aba).

async function fetchCalendarData() {
  calendarAppointments.value = (await loadCalendarData(currentFilters())) ?? [];
}

/*
 * Navegação de semana: o WeeklyAgenda emite `weekChange` também no mount, então
 * este handler NÃO pode mexer em `loadingTabs.semana` — trocar o flag desmonta
 * o componente (v-if), que ao remontar emite de novo, em loop infinito. O dado
 * antigo permanece na tela e a barra do topo acompanha o download.
 */
function onWeekChange(range: WeekRange) {
  weeklyRange.value = range;
  void fetchWeeklyData(range).catch(() => toasty.errorToasty(WEEK_ERROR));
}

async function fetchWeeklyData(range: WeekRange) {
  const appointmentsData = await loadWeeklyData(
    selectedProfessionalIds.value,
    range
  );

  // Descarta a resposta de uma semana que o usuário já navegou para trás.
  if (weeklyRange.value.from.getTime() === range.from.getTime()) {
    weeklyAppointments.value = appointmentsData ?? [];
  }
}

async function fetchTableData() {
  tableAppointments.value = (await loadTableData(currentFilters())) ?? [];
}

async function loadSupportData() {
  const [slotsData, professionalsData] = await Promise.all([
    loadScheduleSlots(),
    loadProfessionalOptions()
  ]);

  slots.value = slotsData ?? [];
  professionals.value = professionalsData ?? [];
}

async function fetchAppointments() {
  hasError.value = false;

  try {
    // Dispara as 5 queries de uma vez; as chamadas abaixo só leem o cache
    // e distribuem o resultado nos refs de cada aba.
    await loadAppointmentsPage(currentFilters(), weeklyRange.value);

    await Promise.all([
      fetchCalendarData(),
      fetchTableData(),
      fetchWeeklyData(weeklyRange.value),
      loadSupportData()
    ]);
  } catch {
    hasError.value = true;
  } finally {
    loadingTabs.tabela = false;
    loadingTabs.calendario = false;
    loadingTabs.semana = false;
  }
}

function refetchAll() {
  invalidate("appointments");

  // allSettled: uma falha isolada não pode derrubar as outras três abas, e o
  // erro da aba Semanal tem tratamento próprio em fetchWeeklyData.
  void Promise.allSettled([
    fetchCalendarData(),
    fetchTableData(),
    fetchWeeklyData(weeklyRange.value)
  ]);
}

function applyFilters() {
  refetchAll();
}

function resetFilters() {
  selectedProfessionalIds.value = [];
  const { dateFrom, dateTo } = defaultAppointmentFilters();
  dateRange.value = { from: dateFrom, to: dateTo };
  refetchAll();
}

// Aplicar/Limpar dentro do menu mobile: mesma ação da barra, mas fecha o
// menu em seguida para o usuário ver o resultado na agenda.
function menuApplyFilters() {
  applyFilters();
  actionsMenuRef.value?.hide();
}

function menuResetFilters() {
  resetFilters();
  actionsMenuRef.value?.hide();
}

/*
 * Carregadores por aba: buscam E distribuem o resultado nos refs da página,
 * para que a troca imediata mostre o dado fresco assim que o skeleton some.
 */
const TAB_LOADERS: Record<Tab, () => Promise<unknown>> = {
  tabela: fetchTableData,
  calendario: () => Promise.all([fetchCalendarData(), loadSupportData()]),
  semana: () => fetchWeeklyData(weeklyRange.value)
};

/*
 * Troca de aba imediata: o painel novo aparece na hora com o skeleton e a
 * barra do topo acompanha o download — mesmo padrão da navegação entre
 * páginas (src/utils/navigate.ts). Falha mostra o aviso e revela o painel
 * com o dado que houver.
 */
async function switchTab(next: Tab) {
  if (next === activeTab.value) return;

  activeTab.value = next;
  loadingTabs[next] = true;

  try {
    await TAB_LOADERS[next]();
  } catch (error) {
    toasty.errorToasty(TAB_ERROR, error);
  } finally {
    loadingTabs[next] = false;
  }
}

onMounted(() => {
  const { dateFrom, dateTo } = defaultAppointmentFilters();
  dateRange.value = { from: dateFrom, to: dateTo };

  void fetchAppointments();
});
</script>

<style scoped lang="scss">
// Título + ações: flex com gap (espaço real, sem margem negativa de gutter)
.page-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.page-header__actions {
  display: flex;
  gap: 8px;
}

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

.remove-margin {
  margin: 0 !important;
}
</style>
