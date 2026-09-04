<template>
  <div class="app-login">
    <!-- Painel lateral escuro -->
    <aside class="app-login__aside">
      <span
        class="app-login__circle app-login__circle--green"
        aria-hidden="true"
      />
      <span
        class="app-login__circle app-login__circle--warm"
        aria-hidden="true"
      />

      <div class="app-login__brand">
        <div class="app-login__logo" style="width: 208px; max-width: 60%">
          <img
            :src="logoUrl"
            alt="MedKit"
            style="display: block; width: 100%; height: auto"
          />
        </div>
        <p class="app-login__tagline">
          Gestão para clínicas e profissionais da saúde
        </p>
      </div>
    </aside>

    <!-- Formulários -->
    <main class="app-login__main">
      <div class="app-login__card">
        <q-tabs
          v-model="tab"
          no-caps
          dense
          active-color="primary"
          indicator-color="transparent"
          class="app-login__tabs"
        >
          <q-tab name="login" label="Entrar" class="app-login__tab" />
          <q-tab name="create" label="Criar conta" class="app-login__tab" />
        </q-tabs>

        <q-tab-panels v-model="tab" keep-alive class="bg-transparent">
          <q-tab-panel name="login" class="q-pa-none">
            <LoginForm @change_auth="changeAuth" />
          </q-tab-panel>
          <q-tab-panel name="create" class="q-pa-none">
            <CreateAccountForm
              @created="tab = 'login'"
              :cnpjf="pending_cnpjf"
            />
          </q-tab-panel>
        </q-tab-panels>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import LoginForm from "@/components/auth/LoginForm.vue";
import CreateAccountForm from "@/components/auth/CreateAccountForm.vue";
import logoUrl from "@/assets/images/logo.svg";

defineOptions({ name: "LoginPage" });
const tab = ref("login");
const pending_cnpjf = ref("");

const changeAuth = (cnpjf: string) => {
  tab.value = "create";
  pending_cnpjf.value = cnpjf;
};
</script>

<style scoped lang="scss">
.app-login {
  display: grid;
  min-height: 100vh;
  grid-template-columns: 1fr;

  @media (min-width: 1024px) {
    grid-template-columns: 1fr 1fr;
  }
}

.app-login__aside {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: 40px;
  background: var(--app-dark);

  @media (min-width: 1024px) {
    padding: 64px;
  }

  // Em telas pequenas o painel visual fica oculto.
  display: none;

  @media (min-width: 1024px) {
    display: flex;
  }
}

.app-login__circle {
  position: absolute;
  border-radius: 9999px;
  pointer-events: none;

  &--green {
    top: 64px;
    left: -64px;
    width: 288px;
    height: 288px;
    background: rgba(78, 110, 93, 0.3);
  }

  &--warm {
    right: -40px;
    bottom: -80px;
    width: 320px;
    height: 320px;
    background: rgba(184, 148, 46, 0.25);
  }
}

.app-login__brand {
  position: relative;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
}

.app-login__logo {
  width: 208px;

  @media (min-width: 1024px) {
    width: 224px;
  }

  img {
    width: 100%;
  }
}

.app-login__tagline {
  margin: 0;
  font-size: 0.875rem;
  letter-spacing: 0.025em;
  color: var(--app-soft);
  opacity: 0.8;
}

.app-login__main {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: var(--app-soft);

  @media (min-width: 1024px) {
    padding: 48px;
  }
}

.app-login__card {
  width: 100%;
  max-width: 28rem;
  padding: 32px;
  text-align: left;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 20px 50px rgba(42, 26, 26, 0.08);
  outline: 1px solid var(--app-border);
}

.app-login__tabs {
  margin-bottom: 16px;
  padding: 4px;
  background: var(--app-soft);
  border-radius: 8px;

  .app-login__tab {
    flex: 1;
    font-weight: 700;
    font-size: 0.875rem;
    color: var(--app-muted);
    border-radius: 6px;

    &.q-tab--active {
      color: var(--app-green);
      background: #fff;
      box-shadow: 0 2px 8px rgba(42, 26, 26, 0.08);
    }
  }
}
</style>
