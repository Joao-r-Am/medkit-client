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
          <div class="row q-col-gutter-md">
            <q-input
              v-model="state.code.value"
              label="Código"
              placeholder="Ex.: ECO"
              outlined
              dense
              class="col-12 col-md-6"
            />
            <q-input
              v-model="state.name.value"
              label="Nome *"
              placeholder="Nome do exame"
              outlined
              dense
              class="col-12 col-md-6"
              :rules="[validateEmptyAndLength3]"
            />
            <q-input
              v-model="state.type.value"
              label="Tipo"
              placeholder="Ex.: Imagem, Laboratorial"
              outlined
              dense
              class="col-12 col-md-6"
            />
            <q-input
              v-model="state.specialty.value"
              label="Especialidade"
              placeholder="Ex.: Cardiologia"
              outlined
              dense
              class="col-12 col-md-6"
            />
            <q-input
              v-model.number="state.duration_minutes.value"
              type="number"
              min="1"
              label="Duração (minutos)"
              placeholder="Ex.: 30"
              outlined
              dense
              class="col-12 col-md-6"
              :rules="[validateDurationMinutesRule]"
            />
            <q-select
              v-model="state.tags.value"
              :options="tagOptions"
              multiple
              use-input
              use-chips
              hide-dropdown-icon
              new-value-mode="add-unique"
              label="Tags"
              placeholder="Pressione Enter para adicionar"
              outlined
              dense
              class="col-12 col-md-6"
            />
          </div>

          <q-input
            v-model="state.description.value"
            label="Descrição"
            placeholder="Descrição do exame..."
            outlined
            dense
            type="textarea"
            autogrow
          />

          <q-input
            v-model="state.preparation_instructions.value"
            label="Instruções de Preparo"
            placeholder="Instruções de preparo do exame..."
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

defineOptions({ name: "ModalExamEdit" });

const props = defineProps<{
  title: string;
  exam_id?: string;
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

const tagOptions: string[] = [];

const state = reactive({
  is_loading: false,
  is_loading_data: false,
  code: { value: "" },
  name: { value: "" },
  type: { value: "" },
  specialty: { value: "" },
  description: { value: "" },
  preparation_instructions: { value: "" },
  duration_minutes: { value: "" as string | number },
  tags: { value: [] as string[] }
});

onMounted(async () => {
  if (!props.exam_id) return;

  state.is_loading_data = true;

  try {
    const { data, error } = await services.exams.getById(props.exam_id);

    if (error || !data) {
      toasty.errorToasty(
        { title: "Erro ao carregar exame", msg: "Erro" },
        error
      );
      return;
    }

    state.code.value = data.code ?? "";
    state.name.value = data.name;
    state.type.value = data.type ?? "";
    state.specialty.value = data.specialty ?? "";
    state.description.value = data.description ?? "";
    state.preparation_instructions.value =
      data.preparationInstructions ?? data.preparation_instructions ?? "";

    const rawDuration = data.duration_minutes ?? data.durationMinutes;
    state.duration_minutes.value = rawDuration ? String(rawDuration) : "";

    state.tags.value = Array.isArray(data.tags) ? [...data.tags] : [];
  } catch (err) {
    toasty.errorToasty(
      { title: "Erro inesperado ao carregar exame", msg: "Erro" },
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
      code: state.code.value || undefined,
      name: state.name.value,
      type: state.type.value || undefined,
      specialty: state.specialty.value || undefined,
      description: state.description.value || undefined,
      preparation_instructions:
        state.preparation_instructions.value || undefined
    };

    if (state.duration_minutes.value) {
      payload.duration_minutes = Number(state.duration_minutes.value);
    }

    if (Array.isArray(state.tags.value) && state.tags.value.length > 0) {
      payload.tags = state.tags.value;
    }

    const { error } = props.exam_id
      ? await services.exams.update(props.exam_id, payload)
      : await services.exams.create(payload);

    if (!error) {
      toasty.successToasty({
        title: `${
          props.exam_id
            ? "Exame atualizado com sucesso!"
            : "Exame cadastrado com sucesso!"
        }`,
        msg: "Sucesso"
      });

      onDialogOK();
      return;
    }

    toasty.errorToasty({ title: "Erro ao salvar exame", msg: "Erro" }, error);
  } catch (error) {
    toasty.errorToasty(
      { title: "Erro inesperado ao salvar exame", msg: "Erro" },
      error
    );
  } finally {
    state.is_loading = false;
  }
}
</script>
