<template>
  <AppLayout title="Configurações">
    <div class="app-credentials col overflow-auto">
      <div class="column items-center q-py-xl">
        <h1 class="text-h4 text-weight-bolder text-grey-8">Credenciais</h1>
        <p class="text-body1 text-grey-8">
          Guia de instalação e geração de suas credenciais
        </p>
      </div>

      <div class="app-credentials__content">
        <h2 class="text-h5 text-weight-bolder app-credentials__section-title">
          Instalação e configuração
        </h2>

        <p class="q-mt-lg text-body1 text-grey-9">
          Este aqui é a sua chave de api
        </p>

        <q-skeleton
          v-if="state.isLoading"
          width="600px"
          height="50px"
          class="q-mt-sm"
        />
        <div
          v-else
          class="row items-center justify-between app-credentials__box"
        >
          <span v-if="state.hasErrors" class="text-negative">
            Erro ao carregar a api key
          </span>
          <span v-else id="apikey">{{ apiKey }}</span>
          <div v-if="!state.hasErrors" class="row items-center q-gutter-x-sm">
            <q-icon
              name="content_copy"
              size="24px"
              color="grey-5"
              class="cursor-pointer"
              title="Copiar chave"
              @click="handleCopy"
            >
              <q-tooltip>Copiar</q-tooltip>
            </q-icon>
            <q-btn
              id="generate-apikey"
              flat
              round
              dense
              size="sm"
              icon="sync"
              color="grey-6"
              :loading="state.isLoading"
              @click="handleGenerateApiKey"
            >
              <q-tooltip>Gerar nova chave</q-tooltip>
            </q-btn>
          </div>
        </div>

        <p class="q-mt-md text-body1 text-grey-9">
          Coloque o script abaixo no seu site para começar a receber feedbacks
        </p>

        <q-skeleton
          v-if="state.isLoading"
          width="600px"
          height="50px"
          class="q-mt-sm"
        />
        <div v-else class="app-credentials__box overflow-auto">
          <span v-if="state.hasErrors" class="text-negative">
            Erro ao carregar o script
          </span>
          <pre v-else class="app-credentials__script">
&lt;script src="https://Joao-r-Am-feedbacker-widget.netlify.app?apiKey={{
              apiKey
            }}"&gt;&lt;/script&gt;</pre>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { computed, reactive, watch } from "vue";
import { useQuasar } from "quasar";
import AppLayout from "@/components/layout/AppLayout.vue";
import services from "@/services";
import { useUserStore } from "@/stores/user";

defineOptions({ name: "CredentialsPage" });

const $q = useQuasar();
const userStore = useUserStore();

const state = reactive({ isLoading: false, hasErrors: false });

const apiKey = computed(
  () => (userStore.state.currentUser.apiKey as string | undefined) ?? ""
);

watch(
  () => userStore.state.currentUser,
  currentUser => {
    if (!currentUser.apiKey) {
      state.hasErrors = true;
    }
  }
);

async function handleGenerateApiKey() {
  try {
    state.isLoading = true;
    const { data } = await services.users.generateApiKey();
    userStore.setApiKey(data.apiKey);
  } catch {
    state.hasErrors = true;
  } finally {
    state.isLoading = false;
  }
}

async function handleCopy() {
  try {
    await navigator.clipboard.writeText(apiKey.value);
    $q.notify({ type: "positive", message: "Copiado!", timeout: 2000 });
  } catch {
    state.hasErrors = true;
  }
}
</script>

<style scoped lang="scss">
.app-credentials__content {
  width: 100%;
  max-width: 72rem;
  margin: 0 auto;
}

.app-credentials__section-title {
  color: var(--app-muted);
}

.app-credentials__box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  max-width: 50%;
  min-width: min(600px, 100%);
  margin-top: 8px;
  padding: 12px 20px;
  background: var(--app-soft);
  border-radius: 4px;

  @media (max-width: 768px) {
    max-width: 100%;
  }
}

.app-credentials__script {
  margin: 0;
  font-family: monospace;
  white-space: pre-wrap;
}
</style>
