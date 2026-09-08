<template>
  <div>
    <h1 class="app-auth-form__title">Crie uma conta</h1>
    <p class="app-auth-form__subtitle">Comece a organizar sua clínica hoje.</p>

    <q-form class="q-mt-lg" greedy @submit.prevent="handleSubmit">
      <div class="row q-col-gutter-sm">
        <q-input
          v-model="state.name.value"
          label="Nome"
          placeholder="Maria"
          outlined
          dense
          class="col-12 col-sm-6"
          :rules="[validateEmptyAndLength3]"
        />
        <q-input
          v-model="state.lastname.value"
          label="Sobrenome"
          placeholder="Silva"
          outlined
          dense
          class="col-12 col-sm-6"
          :rules="[validateEmptyAndLength3]"
        />
      </div>

      <q-input
        v-model="state.email.value"
        label="E-mail"
        placeholder="maria.silva@gmail.com"
        outlined
        dense
        type="email"
        :rules="[validateEmptyAndEmail]"
        class="app-auth-form__field q-mt-sm"
      />

      <q-input
        v-model="state.password.value"
        label="Senha"
        placeholder="*********"
        outlined
        dense
        type="password"
        :rules="[validateEmptyAndLength3]"
        class="q-mt-sm"
      />

      <q-input
        v-model="state.phone.value"
        label="Telefone"
        placeholder="(11) 99999-9999"
        outlined
        dense
        mask="(##) #####-####"
        unmasked-value
        :rules="[validateEmpty]"
        class="q-mt-sm"
      />

      <q-input
        :model-value="state.cnpjf.value"
        label="CPF/CNPJ"
        placeholder="000.000.000-00"
        outlined
        dense
        :rules="[validateEmpty]"
        class="q-mt-sm"
        @update:model-value="onDocumentInput"
      />

      <q-select
        v-model="state.especialty_area.value"
        :options="EspecialtyAreaList"
        option-label="name"
        option-value="value"
        emit-value
        map-options
        label="Área de especialidade"
        placeholder="Psicólogo"
        outlined
        dense
        use-input
        hide-selected
        fill-input
        input-debounce="0"
        :rules="[validateEmptyAndLength3]"
        class="q-mt-sm"
        @filter="onFilterArea"
      >
        <template #no-option>
          <q-item>
            <q-item-section class="text-grey">
              Nenhum resultado encontrado
            </q-item-section>
          </q-item>
        </template>
      </q-select>

      <q-btn
        type="submit"
        unelevated
        no-caps
        size="lg"
        class="full-width q-mt-lg app-auth-form__submit"
        label="Criar conta"
      />
    </q-form>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { useQuasar } from "quasar";
import { formatDocument } from "@/utils/validators";
import {
  validateEmptyAndLength3,
  validateEmptyAndEmail,
  validateEmpty
} from "@/utils/validators";
import services from "@/services";
import { EspecialtyAreaList } from "@/interfaces/users";
import { useUserStore } from "@/stores/user";

defineOptions({ name: "CreateAccountForm" });

const props = defineProps<{ cnpjf: string }>();

const emit = defineEmits<{
  created: [];
}>();

const $q = useQuasar();
const router = useRouter();
const userStore = useUserStore();

const areaOptions = ref([...EspecialtyAreaList]);

function onFilterArea(
  inputValue: string,
  update: (callback: () => void) => void
) {
  update(() => {
    const needle = inputValue.toLowerCase();
    areaOptions.value = EspecialtyAreaList.filter(option =>
      option.name.toLowerCase().includes(needle)
    );
  });
}

const state = reactive({
  name: { value: "" },
  lastname: { value: "" },
  email: { value: "" },
  password: { value: "" },
  phone: { value: "" },
  cnpjf: { value: props.cnpjf ?? "" },
  especialty_area: { value: "" }
});

// const cnpjf = ref(props.cnpjf ?? state.cnpjf.value);
watch(
  () => props.cnpjf,
  (newVal: string | null) => {
    if (newVal) state.cnpjf.value = newVal;
  }
);

function onDocumentInput(value: string | number | null) {
  state.cnpjf.value = formatDocument(String(value ?? ""));
}

/** Faz login automático logo após o cadastro. */
async function login({ email, password }: { email: string; password: string }) {
  const { data, error } = await services.auth.login({
    identificator: email,
    password
  });

  if (!error) {
    window.localStorage.setItem("token", data.data.token);
    $q.notify({
      type: "positive",
      message: "Conta criada!",
      caption: "Bem-vindo(a) ao MedKit!",
      timeout: 3000
    });
    await router.push("/patients");
    emit("created");
    return true;
  }
  return false;
}

/** Cadastra o usuário e, se der certo, entra automaticamente. */
async function handleSubmit() {
  try {
    const { data, error } = await services.auth.register({
      name: state.name.value,
      lastname: state.lastname.value,
      especialty_area: String(state.especialty_area.value),
      email: state.email.value,
      access_type: 3,
      password: state.password.value,
      phone: state.phone.value,
      cnpjf: state.cnpjf.value.replace(/\D/g, "")
    });

    if (error) {
      $q.notify({
        type: "warning",
        message: "Ocorreu um erro ao criar a conta",
        timeout: 3000
      });
    }

    window.localStorage.setItem("token", data.data.token);
    userStore.setCurrentUser(data.data);

    $q.notify({
      type: "positive",
      message: "Conta criada!",
      caption: "Bem-vindo(a) ao MedKit!",
      timeout: 3000
    });
    await router.push("/");
    emit("created");
    return true;
  } catch (err) {
    $q.notify({
      type: "negative",
      message: "Ocorreu um erro ao criar a conta",
      caption: (err as Error)?.message,
      timeout: 3000
    });
  }
}
</script>

<style scoped lang="scss">
.app-auth-form__title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 900;
  color: #1f2937;
}

.app-auth-form__subtitle {
  margin: 4px 0 0;
  font-size: 0.875rem;
  color: var(--app-muted);
}

.app-auth-form__submit {
  background: var(--app-green);
  color: #fff;

  &:hover {
    background: var(--app-dark);
  }

  &:before {
    box-shadow: none !important;
  }
}
</style>
