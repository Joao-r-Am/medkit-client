<template>
  <!--
    Conteúdo da "Agenda do dia": mesma view no desktop (painel lateral) e no
    mobile (sheet inferior) — só o container (aside vs q-dialog) muda.
    Layout interno com flex gap; `closable` habilita o ✕ do sheet mobile.
  -->
  <div class="day-agenda">
    <div class="day-agenda__header">
      <div>
        <p class="day-agenda__caption">Agenda do dia</p>
        <h4 class="day-agenda__date">{{ formatDate(date) }}</h4>
      </div>
      <div class="row items-center no-wrap q-gutter-x-xs">
        <q-btn
          flat
          no-caps
          dense
          size="sm"
          icon="fa-solid fa-plus"
          label="Novo"
          class="text-primary"
          data-test="create-for-day"
          @click="emit('createForDate', date)"
        />
        <q-btn
          v-if="closable"
          flat
          round
          dense
          size="sm"
          icon="fa-solid fa-xmark"
          aria-label="Fechar agenda do dia"
          data-test="close-day-agenda"
          @click="emit('close')"
        />
      </div>
    </div>

    <div class="day-agenda__scroll">
      <div
        v-if="appointments.length === 0 && freeSlots.length === 0"
        class="column items-center q-py-lg"
      >
        <i class="fa-regular fa-calendar-xmark text-h5 text-grey-4"></i>
        <p class="text-caption text-grey-5 q-mt-sm">
          Sem agendamentos neste dia.
        </p>
      </div>

      <template v-else>
        <div class="day-agenda__cards">
          <div
            v-for="appointment in appointments"
            :key="appointment.id"
            class="day-agenda__card"
            :style="cardStyle(appointment)"
          >
            <div class="row items-center justify-between q-mb-xs">
              <span class="day-agenda__card-time">
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
            <p class="day-agenda__card-patient">
              {{ appointment.patient?.name ?? "-" }}
            </p>
            <div class="row items-center no-wrap q-gutter-xs">
              <span
                class="day-agenda__dot"
                :style="{ backgroundColor: chipColor(appointment) }"
              ></span>
              <span class="ellipsis">
                {{ appointment.professional?.name ?? "-" }}
              </span>
            </div>
            <p class="day-agenda__card-meta">
              <span class="ellipsis">{{ serviceLabel(appointment) }}</span>
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

        <div v-if="freeSlots.length > 0" class="day-agenda__slots">
          <p class="day-agenda__slots-title">Horários livres</p>
          <div v-for="group in freeSlots" :key="group.id" class="q-mb-sm">
            <p class="day-agenda__slots-professional">{{ group.name }}</p>
            <div class="row q-gutter-xs">
              <button
                v-for="slot in group.slots"
                :key="slot.id"
                type="button"
                class="day-agenda__slot-chip"
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
  </div>
</template>

<script setup lang="ts">
import {
  professionalColor,
  readableTextColor,
  serviceLabel,
  statusClass,
  statusLabel
} from "@/utils/appointment-utils";
import { formatDate, formatTime } from "@/utils/date";
import type {
  CalendarAppointment,
  CalendarSlot,
  DayFreeSlotGroup
} from "./calendar.types";

defineOptions({ name: "CalendarDayAgenda" });

withDefaults(
  defineProps<{
    // Dia exibido; agendamentos e horários livres já vêm filtrados do pai.
    date: Date;
    appointments?: CalendarAppointment[];
    freeSlots?: DayFreeSlotGroup[];
    // true = dentro do sheet mobile (mostra o botão fechar)
    closable?: boolean;
  }>(),
  {
    appointments: () => [],
    freeSlots: () => [],
    closable: false
  }
);

const emit = defineEmits<{
  edit: [appointment: CalendarAppointment];
  remove: [appointment: CalendarAppointment];
  createForDate: [date: Date];
  createFromSlot: [slot: CalendarSlot];
  close: [];
}>();

function chipColor(appointment: CalendarAppointment): string {
  return professionalColor(appointment.professional?.id);
}

function cardStyle(appointment: CalendarAppointment) {
  return { borderLeftColor: chipColor(appointment) };
}
</script>

<style scoped lang="scss">
// O container (aside ou sheet) cuida da moldura; aqui é só o conteúdo.
.day-agenda {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
}

.day-agenda__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 16px;
}

.day-agenda__scroll {
  flex: 1;
  min-height: 0;
  overflow: auto;
}

.day-agenda__caption {
  margin: 0;
  font-size: 0.8125rem;
  color: #9ca3af;
}

.day-agenda__date {
  margin: 2px 0 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--app-dark);
}

.day-agenda__cards {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.day-agenda__card {
  min-width: 0;
  padding: 10px 12px;
  background: #fff;
  border-left: 4px solid var(--app-border);
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(42, 26, 26, 0.07);
}

.day-agenda__card-time {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #374151;
}

.day-agenda__card-patient {
  overflow: hidden;
  margin: 0;
  font-size: 0.8125rem;
  font-weight: 500;
  color: #1f2937;
  overflow-wrap: anywhere;
}

.day-agenda__card-meta {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
  margin: 2px 0 0;
  font-size: 0.75rem;
  color: #9ca3af;
}

.day-agenda__dot {
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

  &.app-action--danger:hover {
    color: #dc2626 !important;
  }
}

.day-agenda__slots {
  padding-top: 14px;
  margin-top: 14px;
  border-top: 1px solid var(--app-border);
}

.day-agenda__slots-title {
  margin: 0 0 8px;
  font-size: 0.75rem;
  font-weight: 600;
  color: #6b7280;
}

.day-agenda__slots-professional {
  margin: 0 0 4px;
  font-size: 0.75rem;
  color: #9ca3af;
}

.day-agenda__slot-chip {
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
