<template>
  <div class="agendar">
    <!-- Painel lateral escuro -->
    <aside class="agendar__aside">
      <span class="agendar__circle agendar__circle--green" aria-hidden="true" />
      <span class="agendar__circle agendar__circle--warm" aria-hidden="true" />

      <div class="agendar__brand">
        <div class="agendar__logo">
          <img
            :src="logoUrl"
            alt="MedKit"
            style="display: block; width: 100%; height: auto"
          />
        </div>
        <p class="agendar__clinic">{{
          context?.clinic.name ?? "Agendamento online"
        }}</p>
        <p class="agendar__tagline">
          Agende seu horário em poucos passos, sem necessidade de aplicativo.
        </p>
      </div>
    </aside>

    <!-- Conteúdo -->
    <main class="agendar__main">
      <div class="agendar__card">
        <AppSkeletonPanel v-if="loading" :lines="4" title />
        <template v-else>
          <div v-if="fatal" class="agendar__fatal">
            <i class="fa-solid fa-link-slash text-h3 text-grey-5" />
            <p class="text-h6 q-mt-sm q-mb-xs">Link indisponível</p>
            <p class="agendar__fatal-msg">{{ fatalMessage }}</p>
            <q-btn
              unelevated
              no-caps
              class="app-btn-primary"
              label="Voltar ao início"
              @click="goHome"
            />
          </div>

          <SchedulingManage
            v-else-if="appointment"
            :token="token"
            :appointment="appointment"
            :clinic="context!.clinic"
          />

          <SchedulingBooking
            v-else-if="context"
            :token="token"
            :context="context"
          />
        </template>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import SchedulingManage from "@/components/scheduling/SchedulingManage.vue";
import SchedulingBooking from "@/components/scheduling/SchedulingBooking.vue";
import AppSkeletonPanel from "@/components/feedback/AppSkeletonPanel.vue";
import publicScheduling from "@/services/public-scheduling";
import type {
  SchedulingContext,
  SchedulingContextAppointment
} from "@/interfaces/public-scheduling";
import logoUrl from "@/assets/images/logo.svg";

defineOptions({ name: "AgendarPage" });

const route = useRoute();
const router = useRouter();

const token = computed(() => (route.params as { token?: string }).token ?? "");

const loading = ref(true);
const fatal = ref(false);
const fatalMessage = ref("");
const context = ref<SchedulingContext | null>(null);

const appointment = computed<SchedulingContextAppointment | null>(
  () => context.value?.appointment ?? null
);

onMounted(async () => {
  if (!token.value) {
    fatal.value = true;
    fatalMessage.value = "Este link é inválido ou não foi encontrado.";
    loading.value = false;
    return;
  }

  try {
    context.value = await publicScheduling.context(token.value);
  } catch (err) {
    fatal.value = true;
    fatalMessage.value =
      readApiMessage(err) ?? "Não foi possível carregar o agendamento.";
  } finally {
    loading.value = false;
  }
});

function readApiMessage(err: unknown): string | null {
  if (!err || typeof err !== "object") {
    return null;
  }

  const data = (err as { response?: { data?: Record<string, unknown> } })
    .response?.data;
  const code = data?.code as string | undefined;
  const status = (err as { response?: { status?: number } }).response?.status;
  const message = data?.message as string | undefined;

  if (code === "TOKEN_INVALID" || status === 404)
    return "Este link é inválido ou não foi encontrado.";
  if (code === "TOKEN_EXPIRED" || code === "TOKEN_USED" || status === 410)
    return "Este link expirou ou já foi utilizado.";
  return message ?? null;
}

function goHome() {
  void router.push("/");
}
</script>

<style scoped lang="scss">
.agendar {
  display: grid;
  min-height: 100vh;
  grid-template-columns: 1fr;

  @media (min-width: 1024px) {
    grid-template-columns: 5fr 6fr;
  }
}

.agendar__aside {
  position: relative;
  display: none;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: 40px;
  background: linear-gradient(
    180deg,
    rgba(42, 26, 26, 0.96),
    rgba(55, 35, 35, 0.96)
  );

  @media (min-width: 1024px) {
    display: flex;
  }
}

.agendar__circle {
  position: absolute;
  border-radius: 9999px;
  pointer-events: none;

  &--green {
    top: 64px;
    left: -64px;
    width: 288px;
    height: 288px;
    background: rgba(78, 110, 93, 0.35);
  }

  &--warm {
    right: -40px;
    bottom: -80px;
    width: 320px;
    height: 320px;
    background: rgba(184, 148, 46, 0.25);
  }
}

.agendar__brand {
  position: relative;
  z-index: 10;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.agendar__logo {
  width: 208px;
  max-width: 60%;
  margin-bottom: 16px;
}

.agendar__clinic {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: #fff;
}

.agendar__tagline {
  margin: 0;
  max-width: 300px;
  font-size: 0.875rem;
  line-height: 1.5;
  letter-spacing: 0.015em;
  color: var(--app-soft);
  opacity: 0.8;
}

.agendar__main {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(251, 242, 227, 0.55);

  @media (min-width: 1024px) {
    padding: 48px;
  }
}

.agendar__card {
  position: relative;
  width: 100%;
  max-width: 30rem;
  min-height: 420px;
  padding: 32px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 20px 50px rgba(42, 26, 26, 0.08);
  outline: 1px solid var(--app-border);

  @media (min-width: 1024px) {
    max-width: 32rem;
  }
}

.agendar__fatal {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32px 0;
  text-align: center;

  .agendar__fatal-msg {
    margin: 0 0 24px;
    max-width: 320px;
    color: var(--app-muted);
    font-size: 0.875rem;
  }
}
</style>
