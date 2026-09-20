<template>
  <div class="weekly-agenda">
    <div class="weekly-agenda__header">
      <div class="row items-center q-gutter-x-sm">
        <q-btn
          outline
          no-caps
          color="primary"
          icon="fa-solid fa-calendar-day"
          label="Hoje"
          class="weekly-agenda__nav-btn"
          @click="goToday"
        />
        <q-btn
          outline
          round
          color="grey-7"
          icon="fa-solid fa-chevron-left"
          aria-label="Semana anterior"
          class="weekly-agenda__nav-btn"
          @click="previousWeek"
        />
        <q-btn
          outline
          round
          color="grey-7"
          icon="fa-solid fa-chevron-right"
          aria-label="Próxima semana"
          class="weekly-agenda__nav-btn"
          @click="nextWeek"
        />
      </div>
      <h3 class="weekly-agenda__title">{{ weekLabel }}</h3>
    </div>

    <q-linear-progress
      v-if="loading"
      indeterminate
      color="primary"
      size="2px"
    />

    <div class="weekly-agenda__scroll">
      <div class="weekly-agenda__grid">
        <div class="weekly-agenda__corner" />

        <div
          v-for="(day, dayIndex) in weekDays"
          :key="`header-${dayIndex}`"
          class="weekly-agenda__day-header"
          :class="{
            'weekly-agenda__day-header--today': day.isToday
          }"
        >
          <span class="weekly-agenda__day-name">{{ day.name }}</span>
          <span
            class="weekly-agenda__day-number"
            :class="{ 'weekly-agenda__day-number--today': day.isToday }"
          >
            {{ day.number }}
          </span>
        </div>

        <div class="weekly-agenda__time-column">
          <div
            v-for="hour in hours"
            :key="hour"
            class="weekly-agenda__time-label"
            :style="{ top: hourToPixel(hour - startHour) + 'px' }"
          >
            {{ String(hour).padStart(2, "0") }}:00
          </div>
        </div>

        <div
          v-for="(day, dayIndex) in weekDays"
          :key="`col-${dayIndex}`"
          class="weekly-agenda__day-column"
          :class="{ 'weekly-agenda__day-column--today': day.isToday }"
          @click="onGridClick($event, day)"
        >
          <div
            v-for="hour in hours"
            :key="`line-${hour}`"
            class="weekly-agenda__hour-line"
            :style="{ top: hourToPixel(hour - startHour) + 'px' }"
          />
          <div
            v-for="hour in hours"
            :key="`half-${hour}`"
            class="weekly-agenda__half-hour-line"
            :style="{
              top: hourToPixel(hour - startHour) + hourHeight / 2 + 'px'
            }"
          />

          <div
            v-for="appt in dayAppointments(day.date)"
            :key="appt.id"
            class="weekly-agenda__event"
            :class="{
              'weekly-agenda__event--cancelled': isCancelled(appt)
            }"
            :style="eventStyle(appt)"
            @click.stop="onEventClick(appt)"
          >
            <span class="weekly-agenda__event-time">
              {{ formatTime(appt.startTime) }} – {{ formatTime(appt.endTime) }}
            </span>
            <span class="weekly-agenda__event-label">
              {{ appt.patient?.name ?? serviceLabel(appt) }}
            </span>
            <q-tooltip
              anchor="top middle"
              self="bottom middle"
              :offset="[0, 8]"
              class="weekly-agenda__tooltip"
            >
              <div class="weekly-agenda__tooltip-title">
                {{ appt.patient?.name ?? "-" }}
              </div>
              <div>{{ serviceLabel(appt) }}</div>
              <div v-if="appt.professional?.name">
                {{ appt.professional.name }}
              </div>
              <div>{{ statusLabel(appt.status ?? "") }}</div>
            </q-tooltip>
          </div>

          <div
            v-if="showNowLine(day.isToday)"
            class="weekly-agenda__now-line"
            :style="{ top: nowLineTop + 'px' }"
          >
            <div class="weekly-agenda__now-dot" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted, onBeforeUnmount } from "vue";
import {
  professionalColor,
  readableTextColor,
  serviceLabel,
  statusLabel
} from "@/utils/appointment-utils";
import { formatTime } from "@/utils/date";

defineOptions({ name: "WeeklyAgenda" });

interface WeeklyAppointment {
  id: string;
  startTime?: string | Date;
  endTime?: string | Date;
  status?: string;
  patient?: { name?: string } | null;
  professional?: { id?: string; name?: string } | null;
  exam?: { name?: string } | null;
  procedure?: { name?: string } | null;
}

interface WeekDay {
  date: Date;
  name: string;
  number: number;
  isToday: boolean;
}

const props = defineProps<{
  appointments: WeeklyAppointment[];
  loading?: boolean;
}>();

const emit = defineEmits<{
  edit: [appointment: WeeklyAppointment];
  remove: [appointment: WeeklyAppointment];
  create: [data: { date: Date; hour?: number; minute?: number }];
  weekChange: [range: { from: Date; to: Date }];
}>();

const startHour = 6;
const endHour = 22;
const hourHeight = 64;
const totalHeight = (endHour - startHour + 1) * hourHeight;
const snapMinutes = 30;
const hours = Array.from(
  { length: endHour - startHour + 1 },
  (_, i) => startHour + i
);

const dayNames = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

const weekStart = ref(getWeekStart(new Date()));

const weekDays = computed<WeekDay[]>(() => {
  const days: WeekDay[] = [];
  const today = new Date();
  const todayKey = toDateKey(today);

  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStart.value);
    date.setDate(date.getDate() + i);
    const dateKey = toDateKey(date);

    days.push({
      date,
      name: dayNames[i]!,
      number: date.getDate(),
      isToday: dateKey === todayKey
    });
  }

  return days;
});

const weekLabel = computed(() => {
  const start = weekDays.value[0]!.date;
  const end = weekDays.value[6]!.date;
  const options: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "short"
  };
  const startStr = start.toLocaleDateString("pt-BR", options);
  const endStr = end.toLocaleDateString("pt-BR", options);
  return `${startStr} – ${endStr}`;
});

const now = ref(new Date());

const nowLineTop = computed(() => {
  const hour = now.value.getHours();
  const minute = now.value.getMinutes();
  if (hour < startHour || hour > endHour) return -10;
  return hourToPixel(hour - startHour) + (minute / 60) * hourHeight;
});

watch(
  weekStart,
  start => {
    const to = new Date(start);
    to.setDate(to.getDate() + 6);
    to.setHours(23, 59, 59, 999);
    emit("weekChange", { from: new Date(start), to });
  },
  { immediate: true }
);

const appointmentsByDay = computed(() => {
  const map = new Map<string, WeeklyAppointment[]>();
  for (const appt of props.appointments) {
    if (!appt.startTime) continue;
    const key = toDateKey(appt.startTime);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(appt);
  }
  return map;
});

function dayAppointments(date: Date) {
  const key = toDateKey(date);
  return (appointmentsByDay.value.get(key) ?? [])
    .filter(appt => appt.startTime && appt.endTime)
    .sort((a, b) => {
      return (
        new Date(a.startTime!).getTime() - new Date(b.startTime!).getTime()
      );
    });
}

function getWeekStart(date: Date) {
  const day = date.getDay();
  const offset = day === 0 ? -6 : 1 - day;
  const start = new Date(date);
  start.setDate(date.getDate() + offset);
  start.setHours(0, 0, 0, 0);
  return start;
}

function toDateKey(value: string | Date): string {
  const date = new Date(value);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function hourToPixel(hourOffset: number) {
  return hourOffset * hourHeight;
}

function isCancelled(appt: WeeklyAppointment) {
  return appt.status === "CANCELLED";
}

function eventStyle(appt: WeeklyAppointment) {
  if (!appt.startTime || !appt.endTime) return { display: "none" };

  const start = new Date(appt.startTime);
  const end = new Date(appt.endTime);
  const startHourVal = start.getHours() + start.getMinutes() / 60;
  const endHourVal = end.getHours() + end.getMinutes() / 60;

  const visibleStart = Math.max(startHourVal, startHour);
  const visibleEnd = Math.min(endHourVal, endHour + 1);
  if (visibleEnd <= visibleStart) return { display: "none" };

  const top = (visibleStart - startHour) * hourHeight + 1;
  const height = Math.max((visibleEnd - visibleStart) * hourHeight - 2, 28);

  const color = professionalColor(appt.professional?.id);
  const text = readableTextColor(color);

  return {
    top: top + "px",
    height: height + "px",
    background: color,
    color: text,
    borderLeft: `3px solid ${darkenColor(color)}`
  };
}

function darkenColor(hex: string) {
  if (!hex.startsWith("#") || hex.length < 7) return hex;
  let r = parseInt(hex.slice(1, 3), 16);
  let g = parseInt(hex.slice(3, 5), 16);
  let b = parseInt(hex.slice(5, 7), 16);
  r = Math.max(0, r - 30);
  g = Math.max(0, g - 30);
  b = Math.max(0, b - 30);
  return `#${[r, g, b].map(c => c.toString(16).padStart(2, "0")).join("")}`;
}

function showNowLine(isToday: boolean) {
  if (!isToday) return false;
  return now.value.getHours() >= startHour && now.value.getHours() <= endHour;
}

function onGridClick(event: MouseEvent, day: WeekDay) {
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
  const y = Math.min(Math.max(event.clientY - rect.top, 0), totalHeight - 1);
  const totalMinutes =
    Math.floor(((y / hourHeight) * 60) / snapMinutes) * snapMinutes;
  const hour = startHour + Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;
  const clampedHour = Math.max(startHour, Math.min(endHour, hour));

  emit("create", { date: day.date, hour: clampedHour, minute });
}

function onEventClick(appt: WeeklyAppointment) {
  emit("edit", appt);
}

function previousWeek() {
  const newStart = new Date(weekStart.value);
  newStart.setDate(newStart.getDate() - 7);
  weekStart.value = newStart;
}

function nextWeek() {
  const newStart = new Date(weekStart.value);
  newStart.setDate(newStart.getDate() + 7);
  weekStart.value = newStart;
}

function goToday() {
  weekStart.value = getWeekStart(new Date());
}

let nowInterval: ReturnType<typeof setInterval> | null = null;

onMounted(() => {
  nowInterval = setInterval(() => {
    now.value = new Date();
  }, 60000);
});

onBeforeUnmount(() => {
  if (nowInterval) clearInterval(nowInterval);
});
</script>

<style scoped lang="scss">
.weekly-agenda {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
  min-height: 0;
  background: #fff;
  border-radius: 12px;
  border: 1px solid var(--app-border);
  padding: 16px;
}

.weekly-agenda__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
}

.weekly-agenda__nav-btn {
  min-width: 40px;
  min-height: 40px;
}

.weekly-agenda__title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--app-dark);
}

.weekly-agenda__scroll {
  flex: 1;
  min-height: 0;
  overflow-x: auto;
  overflow-y: auto;
  border: 1px solid var(--app-border);
  border-radius: 8px;
}

.weekly-agenda__grid {
  display: grid;
  grid-template-columns: 64px repeat(7, minmax(132px, 1fr));
  min-width: 1024px;
  position: relative;
}

.weekly-agenda__corner {
  position: sticky;
  top: 0;
  z-index: 6;
  background: #fff;
  border-bottom: 1px solid var(--app-border);
}

.weekly-agenda__day-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 10px 0;
  position: sticky;
  top: 0;
  background: #fff;
  z-index: 5;
  border-bottom: 1px solid var(--app-border);
  border-left: 1px solid var(--app-border);

  &--today {
    background: rgba(78, 110, 93, 0.06);
  }
}

.weekly-agenda__day-name {
  font-size: 0.6875rem;
  font-weight: 600;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.weekly-agenda__day-number {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--app-dark);
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;

  &--today {
    background: var(--app-green);
    color: #fff;
  }
}

.weekly-agenda__time-column {
  position: relative;
  height: #{(22 - 6 + 1) * 64}px;
}

.weekly-agenda__time-label {
  position: absolute;
  right: 8px;
  font-size: 0.6875rem;
  color: #9ca3af;
  font-weight: 500;
  transform: translateY(-50%);
}

.weekly-agenda__day-column {
  position: relative;
  height: #{(22 - 6 + 1) * 64}px;
  border-left: 1px solid var(--app-border);
  cursor: cell;
  transition: background-color 0.15s;

  &:hover {
    background: rgba(0, 0, 0, 0.02);
  }

  &--today {
    background: rgba(78, 110, 93, 0.04);

    &:hover {
      background: rgba(78, 110, 93, 0.08);
    }
  }
}

.weekly-agenda__hour-line {
  position: absolute;
  left: 0;
  right: 0;
  border-top: 1px solid var(--app-border);
  pointer-events: none;
}

.weekly-agenda__half-hour-line {
  position: absolute;
  left: 0;
  right: 0;
  border-top: 1px dashed #f0ebe3;
  pointer-events: none;
}

.weekly-agenda__event {
  position: absolute;
  left: 4px;
  right: 4px;
  padding: 4px 8px;
  border-radius: 8px;
  font-size: 0.75rem;
  cursor: pointer;
  overflow: hidden;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
  transition:
    filter 0.15s,
    box-shadow 0.15s,
    transform 0.15s;
  z-index: 2;

  &:hover {
    filter: brightness(0.94);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.18);
    transform: translateY(-1px);
    z-index: 4;
  }

  &--cancelled {
    opacity: 0.6;
    text-decoration: line-through;
  }
}

.weekly-agenda__event-time {
  font-weight: 700;
  display: block;
  font-size: 0.6875rem;
}

.weekly-agenda__event-label {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.75rem;
  margin-top: 2px;
}

.weekly-agenda__tooltip {
  font-size: 0.75rem;
  line-height: 1.5;
}

.weekly-agenda__tooltip-title {
  font-weight: 700;
}

.weekly-agenda__now-line {
  position: absolute;
  left: 0;
  right: 0;
  height: 2px;
  background: #ef4444;
  z-index: 3;
  pointer-events: none;
}

.weekly-agenda__now-dot {
  position: absolute;
  left: -5px;
  top: -4px;
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: #ef4444;
}
</style>
