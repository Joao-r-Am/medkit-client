<template>
  <div class="calendar">
    <div class="calendar__main flex column">
      <div class="row items-center justify-between q-mb-sm q-gutter-x-xs">
        <h3 class="calendar__month">{{ monthLabel }}</h3>
        <div class="row items-center q-gutter-x-xs">
          <q-btn flat no-caps dense size="sm" label="Hoje" @click="goToday" />
          <q-btn
            flat
            round
            dense
            size="sm"
            icon="fa-solid fa-chevron-left"
            aria-label="Mês anterior"
            @click="previousMonth"
          />
          <q-btn
            flat
            round
            dense
            size="sm"
            icon="fa-solid fa-chevron-right"
            aria-label="Próximo mês"
            @click="nextMonth"
          />
        </div>
      </div>

      <div class="calendar__grid-wrap col">
        <div class="calendar__grid">
          <div
            v-for="weekday in weekdays"
            :key="weekday"
            class="calendar__weekday"
          >
            {{ weekday }}
          </div>

          <div
            v-for="(day, index) in monthCells"
            :key="index"
            class="calendar__day"
            :class="{
              'calendar__day--outside': !day,
              'calendar__day--today': day && toDateKey(day) === todayKey,
              'calendar__day--selected': day && toDateKey(day) === selectedKey
            }"
            @click="day && selectDay(day)"
          >
            <template v-if="day">
              <div class="calendar__day-head">
                <span class="calendar__day-number">{{ day.getDate() }}</span>
              </div>

              <div class="calendar__chips">
                <button
                  v-for="appointment in visibleAppointments(day)"
                  :key="appointment.id"
                  type="button"
                  class="calendar__chip"
                  :class="{
                    'calendar__chip--cancelled': isCancelled(appointment)
                  }"
                  :style="chipStyle(appointment)"
                  :title="chipTitle(appointment)"
                  @click.stop="emit('edit', appointment)"
                >
                  <span class="calendar__chip-time">
                    {{ formatTime(appointment.startTime) }}
                  </span>
                  <span class="calendar__chip-label">
                    {{ appointment.patient?.name ?? serviceLabel(appointment) }}
                  </span>
                </button>

                <span
                  v-if="hiddenAppointmentsCount(day) > 0"
                  class="calendar__more"
                >
                  +{{ hiddenAppointmentsCount(day) }}
                </span>
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>

    <aside class="calendar__panel flex column">
      <div class="row items-center justify-between q-mb-md">
        <div>
          <p class="calendar__panel-caption">Agenda do dia</p>
          <h4 class="calendar__panel-date">{{ formatDate(selectedDate) }}</h4>
        </div>
        <q-btn
          flat
          no-caps
          dense
          size="sm"
          icon="fa-solid fa-plus"
          label="Novo"
          class="text-primary"
          data-test="create-for-day"
          @click="emit('createForDate', selectedDate)"
        />
      </div>

      <div class="col overflow-auto">
        <div v-if="loading" class="column items-center q-py-lg">
          <q-spinner-dots size="2rem" color="grey-5" />
        </div>

        <div
          v-else-if="
            selectedDayAppointments.length === 0 &&
            freeSlotsByProfessional.length === 0
          "
          class="column items-center q-py-lg"
        >
          <i class="fa-regular fa-calendar-xmark text-h5 text-grey-4"></i>
          <p class="text-caption text-grey-5 q-mt-sm">
            Sem agendamentos neste dia.
          </p>
        </div>

        <template v-else>
          <div class="calendar__cards">
            <div
              v-for="appointment in selectedDayAppointments"
              :key="appointment.id"
              class="calendar__card"
              :style="cardStyle(appointment)"
            >
              <div class="row items-center justify-between q-mb-xs">
                <span class="calendar__card-time">
                  {{ formatTime(appointment.startTime)
                  }}{{
                    appointment.endTime
                      ? ` – ${formatTime(appointment.endTime)}`
                      : ""
                  }}
                </span>
                <span
                  class="app-status"
                  :class="statusClass(appointment.status ?? '')"
                >
                  {{ statusLabel(appointment.status ?? "") }}
                </span>
              </div>
              <p class="calendar__card-patient">
                {{ appointment.patient?.name ?? "-" }}
              </p>
              <p class="calendar__card-meta">
                <span>{{ serviceLabel(appointment) }}</span>
                <span>·</span>
                <span
                  class="calendar__dot"
                  :style="{ backgroundColor: chipColor(appointment) }"
                ></span>
                <span class="ellipsis">
                  {{ appointment.professional?.name ?? "-" }}
                </span>
              </p>
              <div class="row justify-end q-gutter-x-xs q-mt-xs">
                <q-btn
                  flat
                  round
                  dense
                  size="sm"
                  icon="fa-regular fa-pen-to-square"
                  class="text-grey-6 app-action"
                  title="Editar"
                  @click="emit('edit', appointment)"
                />
                <q-btn
                  flat
                  round
                  dense
                  size="sm"
                  icon="fa-regular fa-trash-can"
                  class="text-grey-6 app-action app-action--danger"
                  title="Excluir"
                  @click="emit('remove', appointment)"
                />
              </div>
            </div>
          </div>

          <div
            v-if="freeSlotsByProfessional.length > 0"
            class="calendar__slots"
          >
            <p class="calendar__slots-title">Horários livres</p>
            <div
              v-for="group in freeSlotsByProfessional"
              :key="group.id"
              class="q-mb-sm"
            >
              <p class="calendar__slots-professional">{{ group.name }}</p>
              <div class="row q-gutter-xs">
                <button
                  v-for="slot in group.slots"
                  :key="slot.id"
                  type="button"
                  class="calendar__slot-chip"
                  :title="`Novo agendamento com ${group.name}`"
                  @click="emit('createFromSlot', slot)"
                >
                  {{ formatTime(slot.startTime) }}
                </button>
              </div>
            </div>
          </div>
        </template>
      </div>
    </aside>
  </div>
</template>

<script lang="ts">
export type CalendarAppointment = {
  id: string;
  startTime?: string | Date;
  endTime?: string | Date;
  status?: string;
  patient?: { name?: string } | null;
  professional?: { id?: string; name?: string } | null;
  exam?: { name?: string } | null;
  procedure?: { name?: string } | null;
};

export type CalendarSlot = {
  id: string;
  professionalId?: string;
  startTime?: string | Date;
  endTime?: string | Date;
  status?: string;
  appointments?: { deletedAt?: string | null }[];
};

export type CalendarProfessional = { id: string; name?: string };
</script>

<script setup lang="ts">
import { computed, ref } from "vue";
import {
  isSlotTaken,
  professionalColor,
  readableTextColor,
  serviceLabel,
  statusClass,
  statusLabel
} from "@/utils/appointment-utils";
import { formatDate, formatTime, toDateKey } from "@/utils/date";

defineOptions({ name: "AppointmentCalendar" });

interface AppointmentCalendarProps {
  appointments: CalendarAppointment[];
  slots?: CalendarSlot[];
  professionals?: CalendarProfessional[];
  loading?: boolean;
}

const props = withDefaults(defineProps<AppointmentCalendarProps>(), {
  slots: () => [],
  professionals: () => [],
  loading: false
});

const emit = defineEmits<{
  edit: [appointment: CalendarAppointment];
  remove: [appointment: CalendarAppointment];
  createForDate: [date: Date];
  createFromSlot: [slot: CalendarSlot];
}>();

const weekdays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MAX_CHIPS_PER_CELL = 3;

const now = new Date();
const currentMonth = ref(new Date(now.getFullYear(), now.getMonth(), 1));
const selectedDate = ref(
  new Date(now.getFullYear(), now.getMonth(), now.getDate())
);

const todayKey = computed(() => toDateKey(new Date()));
const selectedKey = computed(() => toDateKey(selectedDate.value));

const monthLabel = computed(() => {
  const label = currentMonth.value.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric"
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
});

const monthCells = computed<(Date | null)[]>(() => {
  const year = currentMonth.value.getFullYear();
  const month = currentMonth.value.getMonth();
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < first.getDay(); i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
});

const appointmentsByDay = computed(() => {
  const map = new Map<string, CalendarAppointment[]>();
  for (const appointment of props.appointments) {
    if (!appointment.startTime) continue;
    const key = toDateKey(appointment.startTime);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(appointment);
  }
  return map;
});

function sortByStartTime<T extends { startTime?: string | Date }>(
  items: T[]
): T[] {
  return items
    .slice()
    .sort(
      (a, b) =>
        new Date(a.startTime ?? 0).getTime() -
        new Date(b.startTime ?? 0).getTime()
    );
}

const selectedDayAppointments = computed(() =>
  sortByStartTime(appointmentsByDay.value.get(selectedKey.value) ?? [])
);

const freeSlotsByProfessional = computed(() => {
  const names = new Map(
    props.professionals.map(professional => [professional.id, professional])
  );
  const groups = new Map<
    string,
    { id: string; name: string; slots: CalendarSlot[] }
  >();

  for (const slot of props.slots) {
    if (
      slot.status !== "AVAILABLE" ||
      !slot.startTime ||
      toDateKey(slot.startTime) !== selectedKey.value ||
      isSlotTaken(slot)
    ) {
      continue;
    }
    const id = slot.professionalId ?? "-";
    if (!groups.has(id)) {
      groups.set(id, {
        id,
        name: names.get(id)?.name ?? "Profissional",
        slots: []
      });
    }
    groups.get(id)!.slots.push(slot);
  }

  return [...groups.values()].map(group => ({
    ...group,
    slots: sortByStartTime(group.slots)
  }));
});

function dayAppointments(day: Date): CalendarAppointment[] {
  return appointmentsByDay.value.get(toDateKey(day)) ?? [];
}

function visibleAppointments(day: Date): CalendarAppointment[] {
  return sortByStartTime(dayAppointments(day)).slice(0, MAX_CHIPS_PER_CELL);
}

function hiddenAppointmentsCount(day: Date): number {
  return Math.max(0, dayAppointments(day).length - MAX_CHIPS_PER_CELL);
}

function isCancelled(appointment: CalendarAppointment): boolean {
  return appointment.status === "CANCELLED";
}

function chipColor(appointment: CalendarAppointment): string {
  return professionalColor(appointment.professional?.id);
}

function chipStyle(appointment: CalendarAppointment) {
  const color = chipColor(appointment);
  return { backgroundColor: color, color: readableTextColor(color) };
}

function cardStyle(appointment: CalendarAppointment) {
  const color = chipColor(appointment);
  return { borderLeftColor: color };
}

function chipTitle(appointment: CalendarAppointment): string {
  return [
    formatTime(appointment.startTime),
    appointment.patient?.name,
    appointment.professional?.name
  ]
    .filter(Boolean)
    .join(" · ");
}

function selectDay(day: Date) {
  selectedDate.value = day;
}

function previousMonth() {
  currentMonth.value = new Date(
    currentMonth.value.getFullYear(),
    currentMonth.value.getMonth() - 1,
    1
  );
}

function nextMonth() {
  currentMonth.value = new Date(
    currentMonth.value.getFullYear(),
    currentMonth.value.getMonth() + 1,
    1
  );
}

function goToday() {
  const today = new Date();
  currentMonth.value = new Date(today.getFullYear(), today.getMonth(), 1);
  selectedDate.value = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );
}
</script>

<style scoped lang="scss">
.calendar {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  // Trava a linha na altura disponível; sem isso o conteúdo estoura e o
  // tab-panel (overflow: hidden) corta as últimas semanas do mês.
  grid-template-rows: minmax(0, 1fr);
  gap: 20px;
  height: 100%;
  min-height: 0;

  @media (max-width: 1023px) {
    grid-template-columns: 1fr;
    grid-template-rows: none;
    overflow-y: auto;

    .calendar__grid-wrap {
      flex: none;
    }

    .calendar__panel {
      height: auto;
    }
  }
}

.calendar__month {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--app-dark);
}

// Grid item: precisa de min-height: 0 para encolher dentro da linha travada
.calendar__main {
  min-height: 0;
}

// Flex item (.col): min-height: 0 faz o overflow: auto engatar e o scroll
// ficar dentro da grade
.calendar__grid-wrap {
  min-height: 0;
  overflow: auto;
  padding: 12px;
  background: #fff;
  border: 1px solid var(--app-border);
  border-radius: 12px;
}

.calendar__grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  // 1ª linha (weekdays) automática; as semanas se distribuem pela altura
  grid-template-rows: auto;
  grid-auto-rows: minmax(88px, 1fr);
  gap: 4px;
  min-width: 560px;
  height: 100%;
}

.calendar__weekday {
  padding: 6px 0;
  font-size: 0.6875rem;
  font-weight: 600;
  color: #9ca3af;
  text-align: center;
}

.calendar__day {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 4px 6px;
  cursor: pointer;
  text-align: left;
  background: #fff;
  border: 1px solid transparent;
  border-radius: 10px;
  transition:
    border-color 0.15s,
    box-shadow 0.15s,
    background-color 0.15s;

  &:hover {
    border-color: rgba(78, 110, 93, 0.55);
    box-shadow: 0 2px 8px rgba(42, 26, 26, 0.08);
  }

  &--outside {
    visibility: hidden;
    pointer-events: none;
  }

  &--today {
    background: rgba(78, 110, 93, 0.06);
    border-color: rgba(78, 110, 93, 0.7);

    .calendar__day-number {
      background: var(--app-green);
      color: #fff;
    }
  }

  &--selected {
    background: var(--app-soft);
    border-color: transparent;
    box-shadow: inset 0 0 0 2px var(--app-green);
  }
}

.calendar__day-head {
  display: flex;
  justify-content: flex-end;
}

.calendar__day-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 22px;
  height: 22px;
  padding: 0 4px;
  font-size: 0.75rem;
  font-weight: 600;
  color: #4b5563;
  border-radius: 999px;
}

.calendar__chips {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 2px;
  width: 100%;
  overflow: hidden;
}

.calendar__chip {
  display: flex;
  align-items: center;
  gap: 4px;
  width: 100%;
  padding: 1px 5px;
  font-size: 11px;
  line-height: 1.35;
  text-align: left;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: filter 0.15s;

  &:hover {
    filter: brightness(0.88);
  }

  &--cancelled {
    opacity: 0.6;
    text-decoration: line-through;
  }
}

.calendar__chip-time {
  flex-shrink: 0;
  font-weight: 700;
}

.calendar__chip-label {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.calendar__more {
  font-size: 10px;
  font-weight: 500;
  color: #6b7280;
}

.calendar__panel {
  height: 100%;
  min-height: 0;
  overflow: hidden;
  padding: 16px;
  background: #fff;
  border: 1px solid var(--app-border);
  border-radius: 12px;
}

.calendar__panel-caption {
  margin: 0;
  font-size: 0.8125rem;
  color: #9ca3af;
}

.calendar__panel-date {
  margin: 2px 0 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--app-dark);
}

.calendar__cards {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.calendar__card {
  padding: 10px 12px;
  background: #fff;
  border-left: 4px solid var(--app-border);
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(42, 26, 26, 0.07);
}

.calendar__card-time {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #374151;
}

.calendar__card-patient {
  margin: 0;
  font-size: 0.8125rem;
  font-weight: 500;
  color: #1f2937;
}

.calendar__card-meta {
  display: flex;
  align-items: center;
  gap: 4px;
  margin: 2px 0 0;
  font-size: 0.75rem;
  color: #9ca3af;
}

.calendar__dot {
  display: inline-block;
  flex-shrink: 0;
  width: 8px;
  height: 8px;
  border-radius: 999px;
}

.app-status {
  display: inline-block;
  padding: 2px 8px;
  font-size: 0.6875rem;
  font-weight: 500;
  white-space: nowrap;
  border-radius: 999px;
}

.app-action:hover {
  color: var(--app-green) !important;

  &--danger:hover,
  &.app-action--danger:hover {
    color: #dc2626 !important;
  }
}

.calendar__slots {
  padding-top: 14px;
  margin-top: 14px;
  border-top: 1px solid var(--app-border);
}

.calendar__slots-title {
  margin: 0 0 8px;
  font-size: 0.75rem;
  font-weight: 600;
  color: #6b7280;
}

.calendar__slots-professional {
  margin: 0 0 4px;
  font-size: 0.75rem;
  color: #9ca3af;
}

.calendar__slot-chip {
  padding: 3px 12px;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--app-green);
  cursor: pointer;
  background: #fff;
  border: 1px solid rgba(78, 110, 93, 0.6);
  border-radius: 999px;
  transition:
    background-color 0.15s,
    color 0.15s;

  &:hover {
    background: var(--app-green);
    color: #fff;
  }
}
</style>
