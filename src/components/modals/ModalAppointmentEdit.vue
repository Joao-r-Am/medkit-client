<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="app-modal app-modal--wide">
      <div class="app-modal__accent" />

      <q-card-section
        class="row items-center justify-between app-modal__header"
      >
        <div class="app-modal__title">{{ props.title }}</div>
        <q-btn
          flat
          round
          dense
          icon="fa-solid fa-xmark"
          aria-label="Fechar"
          @click="onDialogCancel"
        />
      </q-card-section>

      <q-card-section class="scroll app-modal__body">
        <div v-if="state.isLoadingData" class="flex justify-center q-pa-lg">
          <q-spinner-dots size="2rem" color="grey-5" />
        </div>
        <q-form v-else ref="formRef" class="q-gutter-y-md" @submit.prevent>
          <div class="row q-col-gutter-md">
            <SelectField
              v-model="state.patient_id.value"
              label="Paciente *"
              :options="state.patients"
              option-label="name"
              option-value="id"
              placeholder="Selecione o paciente"
              class="col-12 col-md-6"
              :rules="[validateSelection]"
            />
            <SelectField
              v-model="state.professional_id.value"
              label="Profissional *"
              :options="state.professionals"
              option-label="name"
              option-value="id"
              placeholder="Selecione o profissional"
              class="col-12 col-md-6"
              :rules="[validateSelection]"
              @update:model-value="onProfessionalChange"
            />
            <SelectField
              v-model="state.exam_id.value"
              label="Exame (opcional)"
              :options="state.exams"
              option-label="name"
              option-value="id"
              placeholder="Selecione o exame"
              show-clear
              class="col-12 col-md-6"
            />
            <SelectField
              v-model="state.procedure_id.value"
              label="Procedimento (opcional)"
              :options="state.procedures"
              option-label="name"
              option-value="id"
              placeholder="Selecione o procedimento"
              show-clear
              class="col-12 col-md-6"
            />
            <DateField
              v-model="state.date.value"
              label="Data *"
              class="col-12 col-md-6"
              :options-fn="disablePastDates"
            />
            <SelectField
              v-model="state.status.value"
              label="Status *"
              :options="STATUS_OPTIONS"
              option-label="label"
              option-value="value"
              placeholder="Selecione o status"
              class="col-12 col-md-6"
              :rules="[validateSelection]"
            />
          </div>

          <!-- Horários disponíveis -->
          <div>
            <div class="text-subtitle2 text-weight-medium q-mb-xs">
              Horários disponíveis
            </div>
            <div
              v-if="!state.professional_id.value"
              class="text-caption text-grey-5"
            >
              Selecione um profissional para visualizar a agenda de horários.
            </div>
            <div
              v-else-if="daySlots.length === 0"
              class="text-caption text-grey-5"
            >
              Nenhum horário cadastrado para este profissional nesta data.
            </div>
            <div v-else class="row q-gutter-sm">
              <button
                v-for="slot in daySlots"
                :key="slot.id"
                type="button"
                :disabled="isSlotTaken(slot)"
                :class="slotClass(slot)"
                @click="selectSlot(slot)"
              >
                <span>
                  {{ formatTime(slot.startTime) }} –
                  {{ formatTime(slot.endTime) }}
                </span>
                <span v-if="isSlotTaken(slot)">ocupado</span>
              </button>
            </div>
          </div>

          <div class="row q-col-gutter-md">
            <TimeField
              v-model="state.start_time.value"
              label="Hora de início *"
              class="col-12 col-md-6"
              :rules="[validateTime]"
              @update:model-value="onManualTimeChange"
            />
            <TimeField
              v-model="state.end_time.value"
              label="Hora de fim *"
              class="col-12 col-md-6"
              :rules="[validateEndTimeRule]"
              @update:model-value="onManualTimeChange"
            />
          </div>

          <q-input
            v-model="state.notes.value"
            label="Observações"
            placeholder="Observações relevantes..."
            outlined
            dense
            type="textarea"
            autogrow
          />
        </q-form>
      </q-card-section>

      <q-card-actions align="right" class="app-modal__footer">
        <q-btn
          flat
          no-caps
          label="Cancelar"
          color="grey-7"
          @click="onDialogCancel"
        />
        <q-btn
          unelevated
          no-caps
          label="Salvar"
          color="primary"
          :loading="state.isLoading"
          @click="handleSubmit"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { useDialogPluginComponent } from "quasar";
import type { QForm } from "quasar";
import DateField from "@/components/fields/DateField.vue";
import TimeField from "@/components/fields/TimeField.vue";
import SelectField from "@/components/fields/SelectField.vue";
import { validateSelection, validateTime } from "@/utils/validators";
import { formatTime, toDateKey } from "@/utils/date";
import services from "@/services";
import toasty from "@/utils/toast";

defineOptions({ name: "ModalAppointmentEdit" });

const props = defineProps<{
  title: string;
  appointment_id?: string;
  prefill?: {
    date?: string;
    start_time?: string;
    end_time?: string;
    professional_id?: string;
    schedule_slot_id?: string;
  };
}>();

const emit = defineEmits([...useDialogPluginComponent.emits]);

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();

const formRef = ref<QForm | null>(null);

type Option = Record<string, unknown>;
type Slot = {
  id: string;
  professionalId: string;
  startTime: string;
  endTime: string;
  status: string;
  appointments?: { deletedAt?: string | null }[];
};

const STATUS_OPTIONS = [
  { label: "Agendado", value: "SCHEDULED" },
  { label: "Confirmado", value: "CONFIRMED" },
  { label: "Concluído", value: "COMPLETED" },
  { label: "Cancelado", value: "CANCELLED" }
];

function disablePastDates(dateKey: string) {
  return dateKey >= toDateKey(new Date());
}

function validateEndTimeRule() {
  if (!state.end_time.value) return "Informe o horário de fim";
  if (
    state.start_time.value &&
    state.end_time.value.getTime() <= state.start_time.value.getTime()
  ) {
    return "O horário de fim deve ser após o início";
  }
  return true;
}

const state = reactive({
  isLoading: false,
  isLoadingData: false,
  patients: [] as Option[],
  professionals: [] as Option[],
  exams: [] as Option[],
  procedures: [] as Option[],
  slots: [] as Slot[],
  schedule_slot_id: null as string | null,
  patient_id: { value: "" },
  professional_id: { value: "" },
  exam_id: { value: "" },
  procedure_id: { value: "" },
  date: { value: undefined as Date | undefined },
  start_time: { value: undefined as Date | undefined },
  end_time: { value: undefined as Date | undefined },
  status: { value: "" },
  notes: { value: "" }
});

const selectedDateKey = computed(() =>
  state.date.value ? toDateKey(state.date.value) : null
);

const daySlots = computed(() => {
  const professional = state.professional_id.value;
  if (!professional || !selectedDateKey.value) return [];
  return state.slots
    .filter(
      slot =>
        slot.professionalId === professional &&
        slot.status === "AVAILABLE" &&
        toDateKey(slot.startTime) === selectedDateKey.value
    )
    .sort(
      (a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );
});

function isSlotTaken(slot: Slot) {
  return (
    slot.appointments?.some(appointment => !appointment.deletedAt) ?? false
  );
}

function slotClass(slot: Slot) {
  const selected = state.schedule_slot_id === slot.id;
  if (isSlotTaken(slot)) return "app-slot";
  if (selected) return "app-slot app-slot--selected";
  return "app-slot app-slot--free";
}

function selectSlot(slot: Slot) {
  state.schedule_slot_id = slot.id;
  state.date.value = new Date(slot.startTime);
  state.start_time.value = new Date(slot.startTime);
  state.end_time.value = new Date(slot.endTime);
}

function onProfessionalChange() {
  state.schedule_slot_id = null;
}

function onManualTimeChange() {
  state.schedule_slot_id = null;
}

function combineDateTime(date?: Date, time?: Date): string | undefined {
  if (!date || !time) return undefined;
  const combined = new Date(date);
  combined.setHours(time.getHours(), time.getMinutes(), 0, 0);
  return combined.toISOString();
}

function applyPrefill() {
  if (!props.prefill) return;
  if (props.prefill.professional_id) {
    state.professional_id.value = props.prefill.professional_id;
  }
  if (props.prefill.date) {
    state.date.value = new Date(props.prefill.date);
  }
  if (props.prefill.start_time) {
    state.start_time.value = new Date(props.prefill.start_time);
  }
  if (props.prefill.end_time) {
    state.end_time.value = new Date(props.prefill.end_time);
  }
  if (props.prefill.schedule_slot_id) {
    state.schedule_slot_id = props.prefill.schedule_slot_id;
  }
}

async function loadAppointment(id: string) {
  const { data, error } = await services.appointments.getById(id);

  if (error || !data) {
    toasty.errorToasty(
      { title: "Erro ao carregar agendamento", msg: "Erro" },
      error
    );
    return;
  }

  state.patient_id.value = data.patientId ?? "";
  state.professional_id.value = data.professionalId ?? "";
  state.exam_id.value = data.examId ?? "";
  state.procedure_id.value = data.procedureId ?? "";
  state.status.value = data.status ?? "";
  state.notes.value = data.notes ?? "";
  state.schedule_slot_id = data.scheduleSlotId ?? null;
  if (data.startTime) {
    state.date.value = new Date(data.startTime);
    state.start_time.value = new Date(data.startTime);
  }
  if (data.endTime) {
    state.end_time.value = new Date(data.endTime);
  }
}

async function handleSubmit() {
  try {
    toasty.removeAll();

    const valid = await formRef.value?.validate();
    if (
      !valid ||
      !state.date.value ||
      !state.start_time.value ||
      !state.end_time.value
    ) {
      toasty.warnToasty({
        title: "Verifique os campos do formulário",
        msg: "Atenção"
      });
      return;
    }

    state.isLoading = true;

    const start = combineDateTime(state.date.value, state.start_time.value);
    const end = combineDateTime(state.date.value, state.end_time.value);

    if (!start || !end) {
      toasty.warnToasty({
        title: "Preencha a data e os horários",
        msg: "Atenção"
      });
      return;
    }

    const payload: Record<string, unknown> = {
      patient_id: state.patient_id.value,
      professional_id: state.professional_id.value,
      exam_id: state.exam_id.value || undefined,
      procedure_id: state.procedure_id.value || undefined,
      schedule_slot_id: state.schedule_slot_id || undefined,
      start_time: start,
      end_time: end,
      status: state.status.value,
      notes: state.notes.value || undefined
    };

    if (props.appointment_id) {
      await services.appointments.update(props.appointment_id, payload);
      toasty.successToasty({
        title: "Agendamento atualizado com sucesso!",
        msg: "Sucesso"
      });
    } else {
      await services.appointments.create(payload);
      toasty.successToasty({
        title: "Agendamento cadastrado com sucesso!",
        msg: "Sucesso"
      });
    }

    onDialogOK();
  } catch (error) {
    toasty.errorToasty(
      { title: "Erro ao salvar agendamento", msg: "Erro" },
      error
    );
  } finally {
    state.isLoading = false;
  }
}

onMounted(async () => {
  state.isLoadingData = true;

  try {
    const [patients, professionals, exams, procedures, slots] =
      await Promise.all([
        services.patients.getAll({ limit: 200 }),
        services.professionals.getAll({ limit: 200 }),
        services.exams.getAll({ limit: 200 }),
        services.procedures.getAll({ limit: 200 }),
        services.scheduleSlots.getAll({ limit: 200 })
      ]);

    state.patients = patients;
    state.professionals = professionals;
    state.exams = exams;
    state.procedures = procedures;
    state.slots = slots;

    if (props.appointment_id) {
      await loadAppointment(props.appointment_id);
    } else {
      state.status.value = "SCHEDULED";
      state.date.value = new Date();
      applyPrefill();
    }
  } catch (error) {
    toasty.errorToasty(
      { title: "Erro ao carregar dados do agendamento", msg: "Erro" },
      error
    );
  } finally {
    state.isLoadingData = false;
  }
});
</script>

<style scoped lang="scss">
.app-slot {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 0.8125rem;
  cursor: pointer;
  transition:
    background-color 0.15s,
    color 0.15s;

  &:disabled {
    background: #f3f4f6;
    color: #9ca3af;
    cursor: not-allowed;
    border: 1px solid transparent;
  }

  &--selected {
    background: var(--app-green);
    color: #fff;
    font-weight: 500;
    border: 1px solid transparent;
  }

  &--free {
    background: #fff;
    color: var(--app-green);
    border: 1px solid var(--app-green);

    &:hover {
      background: var(--app-soft);
    }
  }
}
</style>
