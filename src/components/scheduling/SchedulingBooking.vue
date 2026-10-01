<template>
  <div>
    <!-- Cabeçalho do passo -->
    <header
      v-if="step !== 'done' && step !== 'cancelled'"
      class="agendar-step-header q-mb-md"
    >
      <q-linear-progress
        :value="stepProgress"
        color="primary"
        track-color="grey-2"
        size="6px"
        class="q-mb-md"
      />
      <h1 class="text-h6 q-mb-none">{{ stepTitle }}</h1>
      <p class="agendar-muted q-mb-none">{{ stepSubtitle }}</p>
    </header>

    <!-- Passo: identificar -->
    <SchedulingIdentify
      v-if="step === 'identify'"
      :token="token"
      @identified="onIdentified"
    />

    <!-- Passo: profissional -->
    <div v-else-if="step === 'professional'">
      <div class="column q-gutter-sm">
        <button
          v-for="professional in professionals"
          :key="professional.id"
          type="button"
          class="agendar-option"
          :class="{
            'agendar-option--selected': professional.id === chosenProfessionalId
          }"
          @click="pickProfessional(professional.id)"
        >
          <i class="fa-solid fa-user-doctor text-grey-6" />
          <span class="agendar-option__text">
            <span class="text-weight-bold">{{ professional.name }}</span>
            <span
              v-if="professional.specialty"
              class="text-caption agendar-muted"
            >
              {{ professional.specialty }}
            </span>
          </span>
        </button>
      </div>
      <q-btn
        v-if="professionals.length > 0"
        unelevated
        no-caps
        class="app-btn-primary full-width q-mt-md"
        icon="fa-solid fa-arrow-right"
        label="Continuar"
        :disable="!chosenProfessionalId"
        @click="advanceFromProfessional"
      />
    </div>

    <!-- Passo: serviço -->
    <div v-else-if="step === 'service'">
      <template v-if="!loadingServices">
        <p
          v-if="services.procedures.length === 0 && services.exams.length === 0"
          class="agendar-muted q-mb-sm"
        >
          Nenhum serviço disponível para este profissional no momento.
        </p>
        <template v-else>
          <p
            class="text-weight-bold text-caption text-uppercase agendar-muted q-mb-xs"
          >
            Procedimentos
          </p>
          <template v-if="services.procedures.length === 0">
            <p class="text-caption agendar-muted q-mb-sm">
              Nenhum procedimento vinculado.
            </p>
          </template>
          <button
            v-for="procedure in services.procedures"
            :key="procedure.id"
            type="button"
            class="agendar-option"
            :class="{
              'agendar-option--selected': isServiceSelected(
                'procedure',
                procedure.id
              )
            }"
            @click="pickService('procedure', procedure)"
          >
            <i class="fa-solid fa-syringe text-grey-6" />
            <span class="agendar-option__text">
              <span class="text-weight-bold">{{ procedure.name }}</span>
              <span class="text-caption agendar-muted">{{
                procedure.description
              }}</span>
            </span>
            <span
              v-if="procedure.duration_minutes"
              class="text-caption agendar-muted"
            >
              {{ procedure.duration_minutes }} min
            </span>
          </button>

          <p
            class="text-weight-bold text-caption text-uppercase agendar-muted q-mt-md q-mb-xs"
          >
            Exames
          </p>
          <template v-if="services.exams.length === 0">
            <p class="text-caption agendar-muted q-mb-sm">
              Nenhum exame vinculado.
            </p>
          </template>
          <button
            v-for="exam in services.exams"
            :key="exam.id"
            type="button"
            class="agendar-option"
            :class="{
              'agendar-option--selected': isServiceSelected('exam', exam.id)
            }"
            @click="pickService('exam', exam)"
          >
            <i class="fa-solid fa-microscope text-grey-6" />
            <span class="agendar-option__text">
              <span class="text-weight-bold">{{ exam.name }}</span>
              <span class="text-caption agendar-muted">{{
                exam.description
              }}</span>
            </span>
          </button>

          <q-btn
            unelevated
            no-caps
            class="app-btn-primary full-width q-mt-md"
            icon="fa-solid fa-arrow-right"
            label="Continuar"
            :disable="!chosenService"
            @click="advanceFromService"
          />
        </template>
      </template>
    </div>

    <!-- Passo: horário -->
    <div v-else-if="step === 'slot'">
      <div class="row q-col-gutter-sm q-mb-md">
        <q-btn
          v-for="day in days"
          :key="day.date"
          unelevated
          no-caps
          :outline="activeDay?.date !== day.date"
          color="primary"
          class="col-4 text-center agendar-day-btn"
          :class="{ 'agendar-day-btn--active': activeDay?.date === day.date }"
          @click="selectDay(day.date)"
        >
          <!-- :outline="chosenSlot?.date !== slot.date" -->

          <span class="block text-caption">{{ dayLabel(day.date) }}</span>
          <span class="block text-weight-bold">{{ dayNumber(day.date) }}</span>
        </q-btn>
      </div>

      <template v-if="activeDay">
        <div class="row q-col-gutter-sm">
          <q-btn
            v-for="slot in activeDay.slots"
            :key="slot.schedule_slot_id"
            unelevated
            no-caps
            color="primary"
            :outline="chosenSlot?.schedule_slot_id !== slot.schedule_slot_id"
            class="col-6 text-center"
            :label="formatTime(slot.start_time)"
            @click="chosenSlot = slot"
          />
        </div>
        <p class="agendar-muted text-caption q-mt-md">
          O horário fica reservado até o fim da confirmação.
        </p>
        <q-btn
          unelevated
          no-caps
          class="app-btn-primary full-width q-mt-md"
          icon="fa-solid fa-arrow-right"
          label="Continuar"
          :disable="!chosenSlot"
          @click="advanceFromSlot"
        />
      </template>
      <p v-else-if="!loadingSlots" class="agendar-muted q-mt-sm">
        Nenhum horário disponível para este profissional nos próximos 30 dias.
      </p>
    </div>

    <!-- Passo: confirmação -->
    <div v-else-if="step === 'confirm'">
      <q-card flat bordered class="agendar-summary q-mb-md">
        <q-card-section class="column q-gutter-sm">
          <div class="row items-center">
            <i class="fa-solid fa-user-doctor text-primary q-mr-sm" />
            <span>{{ chosenProfessionalName }}</span>
          </div>
          <div class="row items-center">
            <i class="fa-solid fa-calendar-days text-primary q-mr-sm" />
            <span>{{ timeLabel }}</span>
          </div>
          <div v-if="chosenService" class="row items-center">
            <i class="fa-solid fa-syringe text-primary q-mr-sm" />
            <span>{{ chosenService.name }}</span>
          </div>
        </q-card-section>
      </q-card>

      <p v-if="bookError" class="text-negative text-caption q-mb-sm">
        {{ bookError }}
      </p>

      <q-btn
        unelevated
        no-caps
        class="app-btn-primary full-width"
        icon="fa-solid fa-check"
        label="Confirmar agendamento"
        :loading="booking"
        @click="book"
      />
      <p class="agendar-muted text-caption q-mt-sm">
        Ao confirmar, você recebe um comprovante e pode cancelar pelo link, se
        precisar.
      </p>
    </div>

    <!-- Passo: concluído -->
    <div v-else-if="step === 'done'" class="text-center">
      <i
        class="fa-solid fa-circle-check text-h3 text-primary"
        style="display: block"
      />
      <h2 class="text-h6 q-mt-sm q-mb-xs">Horário confirmado!</h2>
      <p class="agendar-muted q-mb-lg">{{ timeLabel }}</p>

      <div class="column q-gutter-sm q-mb-md">
        <q-btn
          unelevated
          no-caps
          icon="fa-solid fa-file-pdf"
          label="Baixar convite (PDF)"
          class="app-btn-primary"
          @click="downloadPdf"
        />
        <q-btn
          unelevated
          no-caps
          icon="fa-solid fa-download"
          label="Adicionar ao calendário (.ics)"
          class="app-btn-primary full-width"
          @click="downloadIcs"
        />
      </div>
      <q-btn
        outline
        no-caps
        color="negative"
        icon="fa-solid fa-xmark"
        label="Cancelar agendamento"
        :loading="canceling"
        class="full-width"
        @click="confirmCancel"
      />
      <p class="agendar-muted text-caption q-mt-md">
        Guarde este link para consultar ou cancelar seu horário: você pode
        reabri-lo a qualquer momento.
      </p>
      <p class="agendar-muted text-caption">{{ tokenHint }}</p>
    </div>

    <!-- Passo: cancelado -->
    <div v-else-if="step === 'cancelled'" class="text-center">
      <i
        class="fa-solid fa-calendar-xmark text-h3 text-grey-5"
        style="display: block"
      />
      <h2 class="text-h6 q-mt-sm q-mb-xs">Agendamento cancelado</h2>
      <p class="agendar-muted">
        Seu horário foi liberado. Para um novo agendamento, entre em contato com
        a clínica.
      </p>
    </div>

    <!-- Rodapé -->
    <div v-if="canGoBack" class="q-mt-lg">
      <q-btn
        flat
        no-caps
        color="grey-7"
        icon="fa-solid fa-arrow-left"
        label="Voltar"
        @click="goBack"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { Dialog } from "quasar";
import SchedulingIdentify from "@/components/scheduling/SchedulingIdentify.vue";
import publicScheduling from "@/services/public-scheduling";

import { formatDate, formatTime, toDateKey } from "@/utils/date";
import toasty from "@/utils/toast";
import type {
  SchedulingContext,
  SchedulingDay,
  SchedulingProfessional,
  SchedulingService,
  SchedulingSlot
} from "@/interfaces/public-scheduling";

defineOptions({ name: "SchedulingBooking" });

const props = defineProps<{ token: string; context: SchedulingContext }>();

type Step =
  | "identify"
  | "professional"
  | "service"
  | "slot"
  | "confirm"
  | "done"
  | "cancelled";

const step = ref<Step>("identify");

const professionals = ref<SchedulingProfessional[]>([]);
const loadingProfessionals = ref(false);
const chosenProfessionalId = ref<string | undefined>();

const services = ref<{
  procedures: SchedulingService[];
  exams: SchedulingService[];
}>({
  procedures: [],
  exams: []
});
const loadingServices = ref(false);
const chosenService = ref<{
  type: "procedure" | "exam";
  id: string;
  name: string;
}>();

const days = ref<SchedulingDay[]>([]);
const loadingSlots = ref(false);
const activeDayDate = ref<string | undefined>();
const chosenSlot = ref<SchedulingSlot | undefined>();

const booking = ref(false);
const bookError = ref("");
const canceling = ref(false);

const rangeTo = ref(toDateKey(new Date(Date.now() + 30 * 86400000)));
const rangeFrom = ref(toDateKey(new Date()));

const stepTitles: Record<Step, string> = {
  identify: "Vamos agendar seu horário",
  professional: "Escolha o profissional",
  service: "O que você precisa?",
  slot: "Escolha o melhor horário",
  confirm: "Confirme seu agendamento",
  done: "",
  cancelled: ""
};

const stepSubtitles: Record<Step, string> = {
  identify: "Em poucos passos, seu horário está garantido.",
  professional: "Selecione quem irá atender você.",
  service: "Selecione o procedimento ou exame desejado.",
  slot: "Os horários disponíveis aparecem conforme o dia.",
  confirm: "Revise as informações antes de confirmar.",
  done: "",
  cancelled: ""
};

const stepProgress = computed(() => {
  const order: Step[] = [
    "identify",
    "professional",
    "service",
    "slot",
    "confirm",
    "done"
  ];
  const index = order.indexOf(step.value);
  if (index < 0) return 1;
  return index / (order.length - 1);
});

const stepTitle = computed(() => stepTitles[step.value]);
const stepSubtitle = computed(() => stepSubtitles[step.value]);

const canGoBack = computed(() =>
  ["professional", "service", "slot", "confirm"].includes(step.value)
);

const chosenProfessionalName = computed(
  () =>
    professionals.value.find(p => p.id === chosenProfessionalId.value)?.name ??
    "Profissional selecionado"
);

const timeLabel = computed(() => {
  if (!chosenSlot.value) return "";
  return `${formatDate(chosenSlot.value.start_time)} às ${formatTime(chosenSlot.value.start_time)}`;
});

const activeDay = computed(
  () =>
    days.value.find(day => day.date === activeDayDate.value) ?? days.value[0]
);

const tokenHint = computed(
  () =>
    `${window.location.origin}${window.location.pathname}#/to-schedule/${props.token}`
);

function onIdentified(_patientId: string) {
  step.value = props.context.allowed_professionals ? "service" : "professional";
  void loadProfessionals();
}

async function loadProfessionals() {
  loadingProfessionals.value = true;
  try {
    professionals.value = await publicScheduling.professionals(props.token);

    if (props.context.allowed_professionals?.length) {
      chosenProfessionalId.value = props.context.allowed_professionals[0];
    }

    if (professionals.value.length === 1) {
      const single = professionals.value[0];
      if (single) {
        chosenProfessionalId.value = single.id;
        advanceFromProfessional();
      }
    }
  } catch (err) {
    toasty.errorToasty(
      { title: "Não foi possível carregar os profissionais", msg: "Erro" },
      err
    );
  } finally {
    loadingProfessionals.value = false;
  }
}

function downloadPdf() {
  window.open(
    publicScheduling.pdfUrl(props.token, lastAppointmentId.value),
    "_blank",
    "noopener"
  );
}

function pickProfessional(id: string) {
  chosenProfessionalId.value = id;
}

function advanceFromProfessional() {
  if (!chosenProfessionalId.value) return;
  chosenService.value = undefined;
  step.value = "service";
  void loadServices();
}

async function loadServices() {
  if (!chosenProfessionalId.value) return;
  loadingServices.value = true;
  try {
    const result = await publicScheduling.procedures(
      props.token,
      chosenProfessionalId.value
    );
    services.value = result;

    const total = result.procedures.length + result.exams.length;
    if (total === 1) {
      const single = result.procedures[0] ?? result.exams[0];
      if (single) {
        pickService(result.procedures.length ? "procedure" : "exam", single);
        advanceFromService();
      }
    }
  } catch (err) {
    toasty.errorToasty(
      { title: "Não foi possível carregar os serviços", msg: "Erro" },
      err
    );
  } finally {
    loadingServices.value = false;
  }
}

function isServiceSelected(type: "procedure" | "exam", id: string) {
  return chosenService.value?.type === type && chosenService.value.id === id;
}

function pickService(type: "procedure" | "exam", service: SchedulingService) {
  chosenService.value = { type, id: service.id, name: service.name };
}

function advanceFromService() {
  if (!chosenService.value) return;
  chosenSlot.value = undefined;
  activeDayDate.value = undefined;
  step.value = "slot";
  void loadSlots();
}

async function loadSlots() {
  if (!chosenProfessionalId.value) return;
  loadingSlots.value = true;
  try {
    const params: {
      professional_id: string;
      procedure_id?: string;
      exam_id?: string;
      from: string;
      to: string;
    } = {
      professional_id: chosenProfessionalId.value,
      from: rangeFrom.value,
      to: rangeTo.value
    };
    if (chosenService.value?.type === "procedure")
      params.procedure_id = chosenService.value.id;
    if (chosenService.value?.type === "exam")
      params.exam_id = chosenService.value.id;

    days.value = await publicScheduling.availability(props.token, params);
    activeDayDate.value = days.value[0]?.date;
  } catch (err) {
    toasty.errorToasty(
      { title: "Não foi possível carregar os horários", msg: "Erro" },
      err
    );
  } finally {
    loadingSlots.value = false;
  }
}

function selectDay(date: string) {
  activeDayDate.value = date;
  chosenSlot.value = undefined;
}

function dayLabel(date: string) {
  const parsed = new Date(`${date}T12:00:00`);
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "short",
    month: "short"
  }).format(parsed);
}

function dayNumber(date: string) {
  return String(new Date(`${date}T12:00:00`).getDate()).padStart(2, "0");
}

function advanceFromSlot() {
  if (!chosenSlot.value) return;
  bookError.value = "";
  step.value = "confirm";
}

async function book() {
  if (!chosenProfessionalId.value || !chosenSlot.value) return;
  booking.value = true;
  bookError.value = "";
  try {
    const payload = {
      professional_id: chosenProfessionalId.value,
      schedule_slot_id: chosenSlot.value.schedule_slot_id,
      start_time: chosenSlot.value.start_time,
      end_time: chosenSlot.value.end_time
    } as {
      professional_id: string;
      schedule_slot_id: string;
      start_time: string;
      end_time: string;
      procedure_id?: string;
      exam_id?: string;
    };

    if (chosenService.value?.type === "procedure")
      payload.procedure_id = chosenService.value.id;
    if (chosenService.value?.type === "exam")
      payload.exam_id = chosenService.value.id;

    const key = crypto.randomUUID();
    const result = await publicScheduling.createAppointment(
      props.token,
      key,
      payload
    );
    lastBookingUrl.value = result.ics_url;
    lastAppointmentId.value = result.appointment.id;
    step.value = "done";
  } catch (err) {
    const status = (err as { response?: { status?: number } }).response?.status;
    const code = (err as { response?: { data?: { code?: string } } }).response
      ?.data?.code;

    if (code === "SLOT_TAKEN" || status === 409) {
      bookError.value = "Esse horário acabou de ser ocupado. Escolha outro.";
      step.value = "slot";
      chosenSlot.value = undefined;
      void loadSlots();
    } else {
      bookError.value =
        (err as { response?: { data?: { message?: string } } }).response?.data
          ?.message ??
        "Não foi possível concluir o agendamento. Tente novamente.";
    }
  } finally {
    booking.value = false;
  }
}

const lastBookingUrl = ref<string>("");
const lastAppointmentId = ref<string>("");

function downloadIcs() {
  window.open(lastBookingUrl.value, "_blank", "noopener");
}

function confirmCancel() {
  Dialog.create({
    title: "Cancelar agendamento",
    message: `Tem certeza que deseja cancelar o horário de ${timeLabel.value}? Esta ação não pode ser desfeita.`,
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
    await publicScheduling.cancel(props.token, lastAppointmentId.value);
    step.value = "cancelled";
  } catch (err) {
    toasty.errorToasty(
      { title: "Não foi possível cancelar o agendamento", msg: "Erro" },
      err
    );
  } finally {
    canceling.value = false;
  }
}

function goBack() {
  bookError.value = "";
  if (step.value === "confirm") {
    step.value = "slot";
  } else if (step.value === "slot") {
    chosenSlot.value = undefined;
    step.value = "service";
  } else if (step.value === "service") {
    chosenService.value = undefined;
    step.value = props.context.allowed_professionals
      ? "identify"
      : "professional";
  } else if (step.value === "professional") {
    chosenProfessionalId.value = undefined;
    step.value = "identify";
  }
}
</script>

<style scoped lang="scss">
.agendar-muted {
  color: var(--app-muted);
  font-size: 0.875rem;
}

.agendar-option {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px 14px;
  border: 1px solid var(--app-border);
  border-radius: 10px;
  background: #fff;
  text-align: left;
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;

  &:hover {
    border-color: var(--app-green);
  }

  &--selected {
    border-color: var(--app-green);
    box-shadow: 0 0 0 1px var(--app-green) inset;
  }

  .agendar-option__text {
    display: flex;
    flex-direction: column;
    flex: 1;
  }
}

.agendar-day-btn {
  border-radius: 8px;

  &--active {
    background: var(--app-green);
    color: #fff;
  }
}

.agendar-summary {
  border-radius: 10px;

  i {
    width: 22px;
    text-align: center;
  }
}
</style>
