<template>
  <div>
    <template v-if="cancelled">
      <i
        class="fa-solid fa-calendar-xmark text-h3 text-grey-5"
        style="display: block"
      />
      <h2 class="text-h6 q-mt-sm q-mb-xs">Agendamento cancelado</h2>
      <p class="agendar-muted q-mb-md">
        Seu horário foi liberado. Caso precise de um novo agendamento, entre em
        contato
        {{ phoneContact }}.
      </p>
    </template>

    <template v-else>
      <i
        class="fa-solid fa-calendar-check text-h3 text-primary"
        style="display: block"
      />
      <h2 class="text-h6 q-mt-sm q-mb-xs">Você tem um horário confirmado</h2>
      <p class="agendar-muted q-mb-lg">
        Este link já foi utilizado para agendar. Gerencie seu horário abaixo.
      </p>

      <q-card flat bordered class="agendar-summary q-mb-lg">
        <q-card-section>
          <div class="row items-center no-wrap">
            <div class="agendar-summary__date">
              <span class="agendar-summary__day">{{ dayLabel }}</span>
              <span class="agendar-summary__month">{{ monthLabel }}</span>
            </div>
            <div class="agendar-summary__info">
              <p class="text-subtitle1 text-weight-bold q-mb-none">{{
                timeLabel
              }}</p>
              <p class="agendar-muted q-mb-none">{{ clinic.name }}</p>
            </div>
          </div>
          <q-chip
            dense
            outline
            color="primary"
            class="q-mt-sm"
            :label="statusLabel"
            :icon="statusIcon"
          />
        </q-card-section>
      </q-card>

      <div class="column q-gutter-sm">
        <q-btn
          unelevated
          no-caps
          icon="fa-solid fa-file-pdf"
          label="Baixar convite (PDF)"
          class="app-btn-primary"
          @click="downloadPdf"
        />
        <q-btn
          outline
          no-caps
          icon="fa-solid fa-calendar-plus"
          label="Baixar convite (.ics)"
          @click="downloadIcs"
        />
        <q-btn
          outline
          no-caps
          color="negative"
          icon="fa-solid fa-xmark"
          label="Cancelar agendamento"
          :loading="canceling"
          @click="confirmCancel"
        />
      </div>
      <p class="agendar-muted text-caption q-mt-md">
        O PDF reúne os dados do horário e um QR Code para reabrir esta tela.
        Para adicionar ao calendário do seu celular, baixe o arquivo .ics e
        abra-o no seu app de calendário.
      </p>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { Dialog } from "quasar";
import publicScheduling from "@/services/public-scheduling";
import { formatDate, formatTime } from "@/utils/date";
import toasty from "@/utils/toast";
import type {
  SchedulingClinic,
  SchedulingContextAppointment
} from "@/interfaces/public-scheduling";

defineOptions({ name: "SchedulingManage" });

const props = defineProps<{
  token: string;
  appointment: SchedulingContextAppointment;
  clinic: SchedulingClinic;
}>();

const cancelled = ref(false);
const canceling = ref(false);

const start = computed(() => props.appointment.start_time);

const dayLabel = computed(() => {
  if (!start.value) return "-";
  return String(new Date(start.value).getDate()).padStart(2, "0");
});

const monthLabel = computed(() => {
  if (!start.value) return "";
  return new Intl.DateTimeFormat("pt-BR", { month: "short" }).format(
    new Date(start.value)
  );
});

const timeLabel = computed(
  () => `${formatDate(start.value)} às ${formatTime(start.value)}`
);

const statusLabel = computed(() => {
  const status = props.appointment.status ?? "";
  if (status.toUpperCase() === "CONFIRMED") return "Confirmado";
  if (status.toUpperCase() === "SCHEDULED") return "Agendado";
  return status;
});

const statusIcon = computed(() => "fa-solid fa-circle-check");

const phoneContact = computed(() =>
  props.clinic.phone ? `pelo ${props.clinic.phone}` : "com a clínica"
);

function downloadIcs() {
  window.open(
    publicScheduling.icsUrl(props.token, props.appointment.id),
    "_blank",
    "noopener"
  );
}

function downloadPdf() {
  window.open(
    publicScheduling.pdfUrl(props.token, props.appointment.id),
    "_blank",
    "noopener"
  );
}

function confirmCancel() {
  const dateLabel = formatDate(start.value);
  Dialog.create({
    title: "Cancelar agendamento",
    message: `Tem certeza que deseja cancelar o horário de ${dateLabel}? Esta ação não pode ser desfeita.`,
    ok: {
      label: "Cancelar horário",
      color: "negative",
      unelevated: true,
      noCaps: true
    },
    cancel: { label: "Voltar", flat: true, noCaps: true },
    persistent: true
  })
    .onOk(() => void doCancel())
    .onCancel(() => undefined)
    .onDismiss(() => undefined);
}

async function doCancel() {
  canceling.value = true;
  try {
    await publicScheduling.cancel(props.token, props.appointment.id);
    cancelled.value = true;
  } catch (err) {
    toasty.errorToasty(
      { title: "Não foi possível cancelar o agendamento", msg: "Erro" },
      err
    );
  } finally {
    canceling.value = false;
  }
}
</script>

<style scoped lang="scss">
.agendar-muted {
  color: var(--app-muted);
  font-size: 0.875rem;
}

.agendar-summary {
  border-radius: 10px;

  .agendar-summary__date {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 56px;
    height: 56px;
    margin-right: 16px;
    background: var(--app-soft);
    border-radius: 10px;

    .agendar-summary__day {
      font-size: 1.25rem;
      font-weight: 700;
      line-height: 1;
      color: var(--app-dark);
    }

    .agendar-summary__month {
      margin-top: 2px;
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
      color: var(--app-muted);
    }
  }
}
</style>
