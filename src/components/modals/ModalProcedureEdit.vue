<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="app-modal">
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
        <div v-if="state.is_loading_data" class="flex justify-center q-pa-lg">
          <q-spinner-dots size="2rem" color="grey-5" />
        </div>
        <q-form v-else ref="formRef" class="q-gutter-y-md" @submit.prevent>
          <q-input
            v-model="state.name.value"
            label="Nome *"
            placeholder="Nome do procedimento"
            outlined
            dense
            :rules="[validateEmptyAndLength3]"
          />

          <q-input
            v-model="state.description.value"
            label="Descrição"
            placeholder="Descrição do procedimento..."
            outlined
            dense
            type="textarea"
            autogrow
          />

          <q-input
            v-model.number="state.duration_minutes.value"
            type="number"
            min="1"
            label="Duração (minutos)"
            placeholder="Ex.: 45"
            outlined
            dense
            :rules="[validateDurationMinutesRule]"
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
          :loading="state.is_loading"
          @click="handleSubmit"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { useDialogPluginComponent } from "quasar";
import type { QForm } from "quasar";
import { validateEmptyAndLength3 } from "@/utils/validators";
import services from "@/services";
import toasty from "@/utils/toast";

defineOptions({ name: "ModalProcedureEdit" });

const props = defineProps<{
  title: string;
  procedure_id?: string;
}>();

const emit = defineEmits([...useDialogPluginComponent.emits]);

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();

const formRef = ref<QForm | null>(null);

function validateDurationMinutesRule(value: string | number | null) {
  if (!value) return true;
  const duration = Number(value);
  if (isNaN(duration) || duration <= 0) {
    return "Informe um número maior que zero";
  }
  return true;
}

const state = reactive({
  is_loading: false,
  is_loading_data: false,
  name: { value: "" },
  description: { value: "" },
  duration_minutes: { value: "" as string | number }
});

onMounted(async () => {
  if (!props.procedure_id) return;

  state.is_loading_data = true;

  try {
    const { data, error } = await services.procedures.getById(
      props.procedure_id
    );

    if (error || !data) {
      toasty.errorToasty(
        { title: "Erro ao carregar procedimento", msg: "Erro" },
        error
      );
      return;
    }

    state.name.value = data.name;
    state.description.value = data.description ?? "";

    const rawDuration = data.duration_minutes ?? data.durationMinutes;
    state.duration_minutes.value = rawDuration ? String(rawDuration) : "";
  } catch (err) {
    toasty.errorToasty(
      { title: "Erro inesperado ao carregar procedimento", msg: "Erro" },
      err
    );
  } finally {
    state.is_loading_data = false;
  }
});

async function handleSubmit() {
  try {
    toasty.removeAll();

    const valid = await formRef.value?.validate();
    if (!valid) {
      toasty.warnToasty({
        title: "Verifique os campos do formulário",
        msg: "Atenção"
      });
      return;
    }

    state.is_loading = true;

    const payload: Record<string, unknown> = {
      name: state.name.value,
      description: state.description.value || undefined
    };

    if (state.duration_minutes.value) {
      payload.duration_minutes = Number(state.duration_minutes.value);
    }

    const { error } = props.procedure_id
      ? await services.procedures.update(props.procedure_id, payload)
      : await services.procedures.create(payload);

    if (!error) {
      toasty.successToasty({
        title: `${
          props.procedure_id
            ? "Procedimento atualizado com sucesso!"
            : "Procedimento cadastrado com sucesso!"
        }`,
        msg: "Sucesso"
      });

      onDialogOK();
      return;
    }

    toasty.errorToasty(
      { title: "Erro ao salvar procedimento", msg: "Erro" },
      error
    );
  } catch (error) {
    toasty.errorToasty(
      { title: "Erro inesperado ao salvar procedimento", msg: "Erro" },
      error
    );
  } finally {
    state.is_loading = false;
  }
}
</script>
