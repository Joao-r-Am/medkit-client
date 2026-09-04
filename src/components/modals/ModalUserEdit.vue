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
            placeholder="Nome completo"
            outlined
            dense
            :rules="[validateEmptyAndLength3]"
          />

          <div class="row q-col-gutter-md">
            <q-input
              :model-value="state.document.value"
              label="Documento *"
              placeholder="CPF ou CNPJ"
              outlined
              dense
              class="col-12 col-md-6"
              :rules="[validateDocument]"
              @update:model-value="onDocumentInput"
            />
            <DateField
              v-model="state.birth_date.value"
              label="Data de Nascimento"
              class="col-12 col-md-6"
            />
            <q-input
              v-model="state.phone.value"
              label="Telefone"
              placeholder="(11) 99999-9999"
              outlined
              dense
              mask="(##) #####-####"
              unmasked-value
              class="col-12 col-md-6"
            />
            <q-input
              v-model="state.email.value"
              label="E-mail *"
              placeholder="paciente@exemplo.com"
              outlined
              dense
              class="col-12 col-md-6"
              :rules="[validateEmptyAndEmail]"
            />
          </div>

          <q-input
            v-model="state.observations.value"
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
import DateField from "@/components/fields/DateField.vue";
import {
  validateEmptyAndLength3,
  validateEmptyAndEmail,
  validateDocument,
  formatDocument
} from "@/utils/validators";
import services from "@/services";
import toasty from "@/utils/toast";

defineOptions({ name: "ModalUserEdit" });

const props = defineProps<{
  title: string;
  patient_id?: string;
}>();

const emit = defineEmits([...useDialogPluginComponent.emits]);

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();

const formRef = ref<QForm | null>(null);

const state = reactive({
  is_loading: false,
  is_loading_data: false,
  name: { value: "" },
  document: { value: "" },
  birth_date: { value: undefined as Date | undefined },
  phone: { value: "" },
  email: { value: "" },
  observations: { value: "" }
});

onMounted(async () => {
  if (!props.patient_id) return;

  state.is_loading_data = true;

  try {
    const { data, error } = await services.patients.getById(props.patient_id);

    if (error || !data) {
      toasty.errorToasty(
        { title: "Erro ao carregar paciente", msg: "Erro" },
        error
      );
      return;
    }

    state.name.value = data.name;
    state.document.value = formatDocument(data.document ?? "");
    state.phone.value = data.phone ?? "";
    state.email.value = data.email ?? "";
    state.observations.value = data.observations ?? "";

    const rawDate = data.birth_date ?? data.birthDate;
    if (rawDate) {
      state.birth_date.value = new Date(rawDate);
    }
  } catch (err) {
    toasty.errorToasty(
      { title: "Erro inesperado ao carregar paciente", msg: "Erro" },
      err
    );
  } finally {
    state.is_loading_data = false;
  }
});

function onDocumentInput(value: string | number | null) {
  const raw = String(value ?? "").replace(/\D/g, "");
  state.document.value = formatDocument(raw);
}

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
      document: state.document.value.replace(/\D/g, ""),
      phone: state.phone.value || undefined,
      email: state.email.value || undefined,
      observations: state.observations.value || undefined
    };

    if (state.birth_date.value) {
      payload.birth_date = state.birth_date.value.toISOString();
    }

    const { error } = props.patient_id
      ? await services.patients.update(props.patient_id, payload)
      : await services.patients.create(payload);

    if (!error) {
      toasty.successToasty({
        title: `${
          props.patient_id
            ? "Paciente atualizado com sucesso!"
            : "Paciente cadastrado com sucesso!"
        }`,
        msg: "Sucesso"
      });

      onDialogOK();
      return;
    }

    toasty.errorToasty(
      { title: "Erro ao salvar paciente", msg: "Erro" },
      error
    );
  } catch (error) {
    toasty.errorToasty(
      { title: "Erro inesperado ao salvar paciente", msg: "Erro" },
      error
    );
  } finally {
    state.is_loading = false;
  }
}
</script>
