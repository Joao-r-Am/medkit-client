<template>
  <div>
    <div v-if="mode === 'welcome'">
      <div class="row items-center q-gutter-sm q-mb-md">
        <div class="agendar-avatar">
          <i class="fa-solid fa-user text-white" />
        </div>
        <div>
          <p class="text-weight-bold q-mb-none">{{ maskedName }}</p>
          <p class="agendar-muted text-caption q-mb-none"
            >Bem-vindo(a) de volta!</p
          >
        </div>
        <q-btn
          unelevated
          no-caps
          class="app-btn-primary full-width"
          icon="fa-solid fa-arrow-right"
          label="Continuar"
          @click="proceed"
        />
        <button type="button" class="agendar-link q-mt-sm" @click="reset">
          Usar outro CPF
        </button>
      </div>
    </div>

    <template v-else>
      <h1 class="text-h6 q-mb-xs">{{
        mode === "register" ? "Faça seu pré-cadastro" : "Identifique-se"
      }}</h1>
      <p class="agendar-muted q-mb-lg">
        {{
          mode === "register"
            ? "Preencha seus dados para agendar seu horário."
            : "Informe seu CPF para começarmos."
        }}
      </p>

      <q-form
        v-if="mode === 'cpf'"
        class="column q-gutter-md"
        @submit.prevent="onIdentify"
      >
        <q-input
          v-model="cpf"
          label="CPF"
          hint="Apenas números"
          :maxlength="14"
          autocomplete="off"
          :error="!!cpfError"
          :error-message="cpfError"
          @update:model-value="cpf = formatDocument(cpf)"
        />
        <q-btn
          unelevated
          no-caps
          type="submit"
          class="app-btn-primary full-width"
          icon="fa-solid fa-arrow-right"
          label="Continuar"
          :loading="identifying"
        />
      </q-form>

      <q-form v-else class="column q-gutter-sm" @submit.prevent="onRegister">
        <q-input
          v-model="form.name"
          label="Nome completo"
          :error="!!errors.name"
          :error-message="errors.name"
        />
        <q-input
          v-model="form.birth_date"
          label="Data de nascimento"
          type="date"
          :error="!!errors.birth_date"
          :error-message="errors.birth_date"
        />
        <q-input
          v-model="form.phone"
          label="Telefone / WhatsApp"
          :error="!!errors.phone"
          :error-message="errors.phone"
        />
        <q-input
          v-model="form.email"
          label="E-mail"
          type="email"
          :error="!!errors.email"
          :error-message="errors.email"
        />
        <q-btn
          unelevated
          no-caps
          type="submit"
          class="app-btn-primary q-mt-sm full-width"
          icon="fa-solid fa-arrow-right"
          label="Criar e continuar"
          :loading="registering"
        />
        <button type="button" class="agendar-link" @click="reset"
          >Voltar</button
        >
      </q-form>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import publicScheduling from "@/services/public-scheduling";
import toasty from "@/utils/toast";
import { formatDocument, validateDocument } from "@/utils/validators";
import type { SchedulingIdentifyResult } from "@/interfaces/public-scheduling";

defineOptions({ name: "SchedulingIdentify" });

const props = defineProps<{ token: string }>();
const emit = defineEmits<{ (e: "identified", patientId: string): void }>();

type Mode = "cpf" | "register" | "welcome";

const mode = ref<Mode>("cpf");
const cpf = ref("");
const cpfError = ref("");
const identifying = ref(false);

const patient = ref<
  Extract<SchedulingIdentifyResult, { exists: true }>["patient"] | null
>(null);

const maskedName = computed(() => patient.value?.name_masked ?? "");

const form = reactive({ name: "", birth_date: "", phone: "", email: "" });
const errors = reactive<Record<string, string>>({});
const registering = ref(false);

function reset() {
  mode.value = "cpf";
  cpfError.value = "";
  patient.value = null;
}

function proceed() {
  if (patient.value) {
    emit("identified", patient.value.id);
  }
}

async function onIdentify() {
  cpfError.value = "";
  const clean = cpf.value.replace(/\D/g, "");
  const validation = validateDocument(clean);
  if (validation !== true) {
    cpfError.value = validation;
    return;
  }

  identifying.value = true;
  try {
    const result = await publicScheduling.identify(props.token, clean);
    if (result.exists) {
      patient.value = result.patient;
      mode.value = "welcome";
    } else {
      mode.value = "register";
    }
  } catch (err) {
    toasty.errorToasty(
      { title: "Não foi possível identificar o CPF", msg: "Tente novamente" },
      err
    );
  } finally {
    identifying.value = false;
  }
}

function validateForm(): boolean {
  Object.keys(errors).forEach(key => delete errors[key]);

  if (form.name.trim().length < 2) errors.name = "*Informe seu nome completo";
  if (!form.birth_date) errors.birth_date = "*Informe a data de nascimento";
  if (!form.email.trim().includes("@"))
    errors.email = "*Informe um e-mail válido";
  if (form.phone.replace(/\D/g, "").length < 8) {
    errors.phone = "*Informe um telefone válido";
  }

  return Object.keys(errors).length === 0;
}

async function onRegister() {
  if (!validateForm()) return;

  registering.value = true;
  try {
    const result = await publicScheduling.register(props.token, {
      cpf: cpf.value.replace(/\D/g, ""),
      name: form.name.trim(),
      birth_date: form.birth_date,
      phone: form.phone,
      email: form.email.trim()
    });
    emit("identified", result.patient_id);
  } catch (err) {
    const message = (err as { response?: { data?: { message?: string } } })
      .response?.data?.message;
    toasty.errorToasty(
      {
        title: "Não foi possível criar o pré-cadastro",
        msg: message ?? "Verifique os dados"
      },
      err
    );
  } finally {
    registering.value = false;
  }
}
</script>

<style scoped lang="scss">
.agendar-muted {
  color: var(--app-muted);
  font-size: 0.875rem;
}

.agendar-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  background: var(--app-green);
  border-radius: 9999px;
}

.agendar-link {
  padding: 0;
  border: none;
  background: none;
  color: var(--app-green);
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
}
</style>
