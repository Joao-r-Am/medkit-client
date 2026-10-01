<template>
  <div class="calendar">
    <div class="calendar__main flex column">
      <!--
        col ellipsis: o mês encolhe com reticências em telas estreitas enquanto
        o grupo de navegação mantém a largura de conteúdo (no-wrap).
      -->
      <div class="row items-center justify-between q-mb-sm">
        <h3 class="calendar__month col ellipsis">{{ monthLabel }}</h3>
        <div class="row items-center q-gutter-x-xs no-wrap">
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
        <!-- compact: classe ligada pelo $q.screen abaixo de 600px (sm) -->
        <div
          class="calendar__grid"
          :class="{ 'calendar__grid--compact': isCompact }"
        >
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
                  <!-- gt-xs: horário some abaixo de 600px, sobrando espaço p/ nome -->
                  <span class="calendar__chip-time gt-xs">
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

    <!-- Desktop: painel lateral fixo com a agenda do dia -->
    <aside v-if="!isMobile" class="calendar__panel flex column">
      <CalendarDayAgenda
        :date="selectedDate"
        :appointments="selectedDayAppointments"
        :free-slots="freeSlotsByProfessional"
        @edit="emit('edit', $event)"
        @remove="emit('remove', $event)"
        @create-for-date="emit('createForDate', $event)"
        @create-from-slot="emit('createFromSlot', $event)"
      />
    </aside>

    <!--
      Mobile (<1024px): a agenda do dia sobe como sheet inferior (~80vh),
      estilo Samsung — o calendário do mês fica inteiro visível atrás e o
      dia selecionado continua destacado na grade.
    -->
    <q-dialog v-else v-model="dayAgendaOpen" position="bottom" full-width>
      <div class="calendar__panel calendar__panel--sheet">
        <CalendarDayAgenda
          closable
          :date="selectedDate"
          :appointments="selectedDayAppointments"
          :free-slots="freeSlotsByProfessional"
          @edit="emit('edit', $event)"
          @remove="emit('remove', $event)"
          @create-for-date="emit('createForDate', $event)"
          @create-from-slot="emit('createFromSlot', $event)"
          @close="dayAgendaOpen = false"
        />
      </div>
    </q-dialog>
  </div>
</template>

<script lang="ts">
// Re-exporta os tipos: a página importa tudo de um lugar só.
export type {
  CalendarAppointment,
  CalendarProfessional,
  CalendarSlot
} from "./calendar.types";
</script>

<script setup lang="ts">
import { computed, onDeactivated, ref, watch } from "vue";
import { useQuasar } from "quasar";
import CalendarDayAgenda from "./CalendarDayAgenda.vue";
import type {
  CalendarAppointment,
  CalendarProfessional,
  CalendarSlot
} from "./calendar.types";
import {
  isSlotTaken,
  professionalColor,
  readableTextColor,
  serviceLabel
} from "@/utils/appointment-utils";
import { formatTime, toDateKey } from "@/utils/date";

defineOptions({ name: "AppointmentCalendar" });

const $q = useQuasar();

// Corte único md (1024px): abaixo dele a agenda do dia abre em sheet
// inferior no lugar do painel lateral.
const isMobile = computed(() => $q.screen.lt.md);
const dayAgendaOpen = ref(false);

// Se a janela crescer para o desktop, o sheet não pode ficar pendurado.
watch(isMobile, mobile => {
  if (!mobile) dayAgendaOpen.value = false;
});

// O painel fica em keep-alive: sem isto o sheet continuaria aberto por cima
// das outras abas ao trocar de visualização.
onDeactivated(() => {
  dayAgendaOpen.value = false;
});

// Abaixo de 600px (corte sm do Quasar) a célula encolhe: linhas mais baixas
// e menos chips por dia, para o mês inteiro caber sem scroll vertical.
const isCompact = computed(() => $q.screen.lt.sm);
const maxChipsPerCell = computed(() => (isCompact.value ? 2 : 3));

interface AppointmentCalendarProps {
  appointments: CalendarAppointment[];
  slots?: CalendarSlot[];
  professionals?: CalendarProfessional[];
}

const props = withDefaults(defineProps<AppointmentCalendarProps>(), {
  slots: () => [],
  professionals: () => []
});

const emit = defineEmits<{
  edit: [appointment: CalendarAppointment];
  remove: [appointment: CalendarAppointment];
  createForDate: [date: Date];
  createFromSlot: [slot: CalendarSlot];
}>();

const weekdays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

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
  return sortByStartTime(dayAppointments(day)).slice(0, maxChipsPerCell.value);
}

function hiddenAppointmentsCount(day: Date): number {
  return Math.max(0, dayAppointments(day).length - maxChipsPerCell.value);
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
  // Mobile: tocar no dia abre a agenda (sheet), como no calendário da
  // Samsung — o mês continua visível atrás e o dia fica destacado.
  if (isMobile.value) dayAgendaOpen.value = true;
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

  // 1023.98px = mesmo corte do breakpoint md (1024px) do Quasar: abaixo dele
  // a grade ocupa a tela inteira (flex column) e a agenda do dia sobe como
  // sheet (q-dialog) — nunca empilhada e nunca com scroll horizontal.
  @media (max-width: 1023.98px) {
    display: flex;
    flex-direction: column;
    gap: 12px;

    .calendar__main {
      // Crescente para a grade usar toda a altura; o scroll fica no
      // grid-wrap (overflow: auto) e nada é cortado pelo tab-panel.
      flex: 1;
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
  height: 100%;
}

// Só no desktop: largura mínima evita que as 7 colunas espremam os chips.
// Abaixo de 1024px a grade ocupa 100% — sem min-width não existe scroll
// horizontal (a causa do calendário "jogado para a direita").
@media (min-width: 1024px) {
  .calendar__grid {
    min-width: 560px;
  }
}

// Celular (<600px): células mais baixas deixam a grade mais respirável.
// Geometria de grid não tem utilitário no Quasar — é a única regra própria.
.calendar__grid--compact {
  grid-auto-rows: minmax(64px, 1fr);
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

// Sheet mobile: altura fixa de 80vh com o conteúdo rolando dentro; o radius
// do topo arredonda o card que sobe de baixo (o Quasar zera o de baixo).
// Largura full-width vem da prop `full-width` do q-dialog.
.calendar__panel--sheet {
  display: flex;
  flex-direction: column;
  height: 80vh;
  border-radius: 16px 16px 0 0;
}
</style>
