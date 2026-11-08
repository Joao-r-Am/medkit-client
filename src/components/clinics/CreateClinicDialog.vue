<template>
  <q-dialog v-model="openModel" @before-hide="resetForm">
    <q-card style="width: 520px; max-width: 92vw">
      <q-card-section>
        <div class="text-h6 text-weight-bolder text-grey-8">
          {{ foundClinic ? "Já está aqui!" : "Criar clínica" }}
        </div>
        <p class="text-body2 text-grey-7 q-mt-xs q-mb-none">
          {{
            foundClinic
              ? "Esta clínica já está cadastrada no Medkit. Confirme abaixo para se vincular a ela."
              : "Comece pelo CNPJ: buscamos os dados da empresa para você conferir e completar."
          }}
        </p>
      </q-card-section>

      <q-form class="q-px-md" @submit.prevent="submitCreateClinic">
        <div class="row items-start q-col-gutter-sm">
          <q-input
            v-model="createForm.cnpjf"
            label="CNPJ *"
            outlined
            dense
            class="col-8"
            :readonly="lookingUp"
            :rules="[requiredField('Informe o CNPJ'), validCnpj]"
            data-test="create-clinic-cnpj"
            @update:model-value="onCnpjInput"
          />
          <div class="col-4 q-pt-sm">
            <q-btn
              no-caps
              color="primary"
              outline
              class="full-width"
              :label="lookingUp ? 'Buscando...' : 'Buscar dados'"
              icon="travel_explore"
              :disable="lookingUp || cnpjDigits.length !== 14"
              data-test="lookup-cnpj"
              @click="lookupCnpjData"
            />
          </div>
        </div>

        <p
          v-if="lookupError"
          class="text-caption text-negative q-mb-none"
          data-test="lookup-error"
        >
          {{ lookupError }}
        </p>

        <!-- Clínica local existe: painel de vínculo em vez do form de criação -->
        <q-banner
          v-if="foundClinic"
          rounded
          dense
          class="q-mt-sm"
          style="background-color: #fbf2e3"
          data-test="join-clinic-panel"
        >
          <template #avatar>
            <q-icon name="local_hospital" color="primary" />
          </template>
          <div class="text-body2">
            <span class="text-weight-medium">{{ foundClinic.name }}</span>
            <span class="text-grey-7">
              — CNPJ {{ foundClinic.cnpjf ?? "" }}
            </span>
          </div>
          <div class="text-caption text-grey-7">
            Já existe uma conta desta empresa aqui no Medkit.
          </div>
          <div class="row justify-end q-gutter-sm q-mt-sm">
            <q-btn flat no-caps label="Cancelar" @click="openModel = false" />
            <q-btn
              unelevated
              no-caps
              color="primary"
              label="Vincular-se"
              icon="link"
              :loading="linkingClinic"
              data-test="submit-link-clinic"
              @click="submitLinkClinic"
            />
          </div>
        </q-banner>

        <template v-if="!foundClinic">
          <q-input
            v-model="createForm.name"
            label="Nome da clínica *"
            outlined
            dense
            class="q-mt-sm"
            :rules="[requiredField('Informe o nome da clínica')]"
            data-test="create-clinic-name"
          />
          <q-input
            v-model="createForm.email"
            label="E-mail da empresa *"
            outlined
            dense
            class="q-mt-sm"
            :rules="[requiredField('Informe o e-mail da empresa'), validEmail]"
            data-test="create-clinic-email"
          />
          <q-input
            v-model="createForm.phone"
            label="Telefone"
            outlined
            dense
            class="q-mt-sm"
            @update:model-value="onPhoneInput"
          />

          <p class="text-caption text-grey-7 q-mt-md q-mb-none">
            Endereço da clínica:
          </p>
          <div class="row q-col-gutter-sm">
            <q-input
              v-model="createForm.address.street"
              label="Rua/Logradouro"
              outlined
              dense
              class="col-12"
            />
            <q-input
              v-model="createForm.address.number"
              label="Número"
              outlined
              dense
              class="col-3"
            />
            <q-input
              v-model="createForm.address.complement"
              label="Complemento"
              outlined
              dense
              class="col-9"
            />
            <q-input
              v-model="createForm.address.district"
              label="Bairro"
              outlined
              dense
              class="col-6"
            />
            <q-input
              v-model="createForm.address.city"
              label="Cidade"
              outlined
              dense
              class="col-6"
            />
            <q-input
              v-model="createForm.address.state"
              label="Estado (UF)"
              outlined
              dense
              class="col-4"
              maxlength="2"
            />
            <q-input
              v-model="createForm.address.zip"
              label="CEP"
              outlined
              dense
              class="col-8"
              @update:model-value="onZipInput"
            />
          </div>

          <q-card-actions align="right">
            <q-btn flat no-caps label="Cancelar" @click="openModel = false" />
            <q-btn
              unelevated
              no-caps
              color="primary"
              label="Criar clínica"
              type="submit"
              :loading="creatingClinic"
              data-test="submit-create-clinic"
            />
          </q-card-actions>
        </template>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import { useQuasar } from "quasar";
import services from "@/services";
import { useClinicStore } from "@/stores/clinic";
import { formatDocument, stripDocumentFormatting } from "@/utils/validators";
import type { IAddress, IClinic, ICreateClinic } from "@/interfaces/clinic";

defineOptions({ name: "CreateClinicDialog" });

type ValidationRule = (value: unknown) => true | string;

const openModel = defineModel<boolean>({ required: true });

const emit = defineEmits<{ (e: "created"): void }>();

const $q = useQuasar();
const clinicStore = useClinicStore();

const lookingUp = ref(false);
const lookupError = ref<string | null>(null);
const creatingClinic = ref(false);
const linkingClinic = ref(false);
/** Clínica local encontrada pelo CNPJ (caminho "vincular-se a clínica"). */
const foundClinic = ref<IClinic | null>(null);

interface ICreateClinicFormAddress {
  street: string;
  number: string;
  complement: string;
  district: string;
  city: string;
  state: string;
  zip: string;
}

const createForm = reactive({
  cnpjf: "",
  name: "",
  email: "",
  phone: "",
  address: {
    street: "",
    number: "",
    complement: "",
    district: "",
    city: "",
    state: "",
    zip: ""
  } as ICreateClinicFormAddress & Partial<IAddress>
});

const cnpjDigits = computed(() => stripDocumentFormatting(createForm.cnpjf));

/** Aplica a máscara de CNPJ com até 14 dígitos e limpa erros de lookup. */
function onCnpjInput(value: unknown): void {
  createForm.cnpjf = formatDocument(String(value ?? ""));
  lookupError.value = null;
  foundClinic.value = null;
}

function onPhoneInput(value: unknown): void {
  createForm.phone = String(value ?? "")
    .replace(/\D/g, "")
    .slice(0, 11)
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{4,5})(\d{0,4})$/, "$1-$2");
}

function onZipInput(value: unknown): void {
  createForm.address.zip = String(value ?? "")
    .replace(/\D/g, "")
    .slice(0, 8)
    .replace(/^(\d{5})(\d{1,3})$/, "$1-$2");
}

function requiredField(message: string): ValidationRule {
  return value => (value && String(value).trim().length > 0 ? true : message);
}

function validCnpj(value: unknown): true | string {
  return stripDocumentFormatting(String(value ?? "")).length === 14
    ? true
    : "CNPJ deve ter 14 dígitos";
}

function validEmail(value: unknown): true | string {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value ?? "").trim())
    ? true
    : "E-mail inválido";
}

/**
 * Lookup CNPJ-first: primeiro consultamos o próprio Medkit — se a clínica
 * já existe, oferecemos o vínculo direto; se não, continuamos no fluxo de
 * criação preenchendo os dados pela Receitaws.
 */
async function lookupCnpjData(): Promise<void> {
  if (cnpjDigits.value.length !== 14) {
    lookupError.value = "Informe os 14 dígitos do CNPJ.";
    return;
  }

  lookingUp.value = true;
  lookupError.value = null;
  foundClinic.value = null;

  try {
    foundClinic.value = await services.clinics.findClinicByCnpj(
      cnpjDigits.value
    );
    return;
  } catch (error) {
    // Clínica desconhecida no Medkit: segue para a Receitaws (criação).
    const code = errorCodeOf(error);
    if (code !== "CLINIC_NOT_FOUND") {
      lookupError.value = lookupErrorMessage(error);
      return;
    }
  }

  try {
    const data = await services.clinics.lookupCnpj(cnpjDigits.value);

    if (data.name) createForm.name = data.name;
    if (data.email) createForm.email = data.email;
    if (data.phone) createForm.phone = data.phone;
    if (data.address) {
      createForm.address.street = data.address.street ?? "";
      createForm.address.number = data.address.number ?? "";
      createForm.address.complement = data.address.complement ?? "";
      createForm.address.district = data.address.district ?? "";
      createForm.address.city = data.address.city ?? "";
      createForm.address.state = data.address.state ?? "";
      createForm.address.zip = data.address.zip ?? "";
    }

    $q.notify({
      type: "info",
      message: "Dados da empresa carregados. Confirme e complete o que faltar.",
      timeout: 2500
    });
  } catch (error) {
    lookupError.value = lookupErrorMessage(error);
  } finally {
    lookingUp.value = false;
  }
}

function errorCodeOf(error: unknown): string {
  return (
    (error as { response?: { data?: { code?: string } } }).response?.data
      ?.code ?? ""
  );
}

function lookupErrorMessage(error: unknown): string {
  const code = errorCodeOf(error);
  if (code === "CNPJ_NOT_FOUND")
    return "CNPJ não encontrado na base da Receitaws.";
  if (code === "CNPJ_LOOKUP_RATE_LIMITED")
    return "Muitas consultas em sequência. Aguarde um instante e tente novamente.";
  if (code === "CNPJ_INVALID") return "Informe os 14 dígitos do CNPJ.";
  return "Não foi possível consultar o CNPJ agora. Tente novamente ou preencha manualmente.";
}

/** Vínculo direto à clínica local encontrada (membership ativa + entrar). */
async function submitLinkClinic(): Promise<void> {
  if (!foundClinic.value) return;
  linkingClinic.value = true;
  try {
    await clinicStore.linkToClinic(foundClinic.value.id);
    openModel.value = false;
    emit("created");
  } catch (error) {
    $q.notify({
      type: "negative",
      message:
        errorCodeOf(error) === "MEMBER_ALREADY_LINKED"
          ? "Você já está vinculado a esta clínica."
          : "Não foi possível vincular a esta clínica agora.",
      timeout: 3000
    });
  } finally {
    linkingClinic.value = false;
  }
}

function resetForm(): void {
  createForm.cnpjf = "";
  createForm.name = "";
  createForm.email = "";
  createForm.phone = "";
  createForm.address = {
    street: "",
    number: "",
    complement: "",
    district: "",
    city: "",
    state: "",
    zip: ""
  } as ICreateClinicFormAddress & Partial<IAddress>;
  lookupError.value = null;
  creatingClinic.value = false;
  linkingClinic.value = false;
  foundClinic.value = null;
}

async function submitCreateClinic(): Promise<void> {
  creatingClinic.value = true;
  try {
    const payload: ICreateClinic = {
      name: createForm.name.trim(),
      cnpjf: cnpjDigits.value,
      email: createForm.email.trim()
    };

    const digits = createForm.phone.replace(/\D/g, "");
    if (digits) payload.phone = digits;

    if (createForm.address.street) {
      payload.address = {
        street: createForm.address.street.trim(),
        number: createForm.address.number.trim() || null,
        complement: createForm.address.complement.trim() || null,
        district: createForm.address.district.trim() || null,
        city: createForm.address.city.trim() || null,
        state: createForm.address.state.trim().toUpperCase() || null,
        zip: createForm.address.zip.replace(/\D/g, "") || null
      };
    }

    await clinicStore.createClinic(payload);
    openModel.value = false;
    emit("created");
  } catch {
    $q.notify({
      type: "negative",
      message: "Ocorreu um erro ao criar a clínica.",
      timeout: 3000
    });
  } finally {
    creatingClinic.value = false;
  }
}
</script>
