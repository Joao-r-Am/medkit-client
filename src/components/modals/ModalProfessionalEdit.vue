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
              v-model="state.name.value"
              label="Nome *"
              placeholder="Nome completo"
              outlined
              dense
              class="col-12 col-md-6"
              :rules="[validateEmptyAndLength3]"
            />
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
              v-model="state.specialty.value"
              label="Especialidade"
              placeholder="Ex.: Cardiologia"
              outlined
              dense
              class="col-12 col-md-6"
            />
            <q-input
              v-model="state.registration_number.value"
              label="Nº de Registro"
              placeholder="Ex.: CRM 12345"
              outlined
              dense
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
          </div>

          <q-input
            v-model="state.email.value"
            label="E-mail"
            placeholder="profissional@exemplo.com"
            outlined
            dense
            :rules="[validateOptionalEmail]"
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
  validateOptionalEmail,
  validateDocument,
  formatDocument
} from "@/utils/validators";
import services from "@/services";
import toasty from "@/utils/toast";

defineOptions({ name: "ModalProfessionalEdit" });

const props = defineProps<{
  title: string;
  professional_id?: string;
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
  specialty: { value: "" },
  registration_number: { value: "" },
  phone: { value: "" },
  email: { value: "" }
});

onMounted(async () => {
  if (!props.professional_id) return;

  state.is_loading_data = true;

  try {
    const { data, error } = await services.professionals.getById(
      props.professional_id
    );

    if (error || !data) {
      toasty.errorToasty(
        { title: "Erro ao carregar profissional", msg: "Erro" },
        error
      );
      return;
    }

    state.name.value = data.name;
    state.document.value = formatDocument(data.document ?? "");
    state.specialty.value = data.specialty ?? "";
    state.registration_number.value = data.registrationNumber ?? "";
    state.phone.value = data.phone ?? "";
    state.email.value = data.email ?? "";

    const rawDate = data.birth_date ?? data.birthDate;
    if (rawDate) {
      state.birth_date.value = new Date(rawDate);
    }
  } catch (err) {
    toasty.errorToasty(
      { title: "Erro inesperado ao carregar profissional", msg: "Erro" },
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
      specialty: state.specialty.value || undefined,
      registration_number: state.registration_number.value || undefined,
      phone: state.phone.value || undefined,
      email: state.email.value || undefined
    };

    if (state.birth_date.value) {
      payload.birth_date = state.birth_date.value.toISOString();
    }

    const { error } = props.professional_id
      ? await services.professionals.update(props.professional_id, payload)
      : await services.professionals.create(payload);

    if (!error) {
      toasty.successToasty({
        title: `${
          props.professional_id
            ? "Profissional atualizado com sucesso!"
            : "Profissional cadastrado com sucesso!"
        }`,
        msg: "Sucesso"
      });

      onDialogOK();
      return;
    }

    toasty.errorToasty(
      { title: "Erro ao salvar profissional", msg: "Erro" },
      error
    );
  } catch (error) {
    toasty.errorToasty(
      { title: "Erro inesperado ao salvar profissional", msg: "Erro" },
      error
    );
  } finally {
    state.is_loading = false;
  }
}
</script>
