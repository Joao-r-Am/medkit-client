<template>
  <q-layout view="lHh Lpr lFf">
    <!--
      Navegação do sistema (desktop e mobile).

      Acima de MOBILE_BREAKPOINT o drawer fica sempre aberto ocupando espaço
      na tela; abaixo dele o QDrawer entra em modo overlay (backdrop, trava o
      scroll do body) e é aberto pelo botão do header. O QDrawer já fecha
      sozinho ao trocar de rota, então o item clicado dispensa qualquer
      tratamento extra.
    -->
    <q-drawer
      v-model="sidebarOpen"
      side="left"
      :width="232"
      :breakpoint="MOBILE_BREAKPOINT"
      dark
      class="app-drawer"
    >
      <div class="column full-height">
        <div class="flex flex-center q-py-lg">
          <img
            :src="logoUrl"
            alt="logo"
            class="app-drawer__logo rounded"
            style="height: 30px; width: auto"
          />
        </div>

        <q-list padding class="app-drawer__list col column q-gutter-y-xs">
          <q-item
            clickable
            :active="isCurrent('/')"
            active-class="app-drawer__item--active"
            class="app-drawer__item text-white"
            @click="navigate('/')"
          >
            <q-item-section avatar>
              <q-icon name="fas fa-house" size="1.1rem" />
            </q-item-section>
            <q-item-section>Home</q-item-section>
          </q-item>

          <q-item
            clickable
            :active="isCurrent('/appointments')"
            active-class="app-drawer__item--active"
            class="app-drawer__item text-white"
            @click="navigate('/appointments')"
          >
            <q-item-section avatar>
              <q-icon name="fa-solid fa-book-medical" size="1.1rem" />
            </q-item-section>
            <q-item-section>Agendamentos</q-item-section>
          </q-item>

          <q-item
            clickable
            :active="isCurrent('/patients')"
            active-class="app-drawer__item--active"
            class="app-drawer__item text-white"
            @click="navigate('/patients')"
          >
            <q-item-section avatar>
              <q-icon name="fa-solid fa-person-circle-plus" size="1.1rem" />
            </q-item-section>
            <q-item-section>Pacientes</q-item-section>
          </q-item>

          <q-expansion-item
            icon="fa-regular fa-address-card"
            label="Cadastros"
            :default-opened="route.path.startsWith('/registrations')"
            active-class="app-drawer__item--active"
            class="app-drawer__item text-white"
            header-class="text-white"
          >
            <q-list class="q-pl-md">
              <q-item
                v-for="item in registrationItems"
                :key="item.to"
                clickable
                :active="isCurrent(item.to)"
                active-class="app-drawer__child--active"
                class="app-drawer__item app-drawer__child text-white"
                @click="navigate(item.to)"
              >
                <q-item-section avatar>
                  <q-icon :name="item.icon" size="0.95rem" />
                </q-item-section>
                <q-item-section>{{ item.label }}</q-item-section>
              </q-item>
            </q-list>
          </q-expansion-item>

          <q-item
            clickable
            :active="isCurrent('/credentials')"
            active-class="app-drawer__item--active"
            class="app-drawer__item text-white"
            @click="navigate('/credentials')"
          >
            <q-item-section avatar>
              <q-icon name="fas fa-cog" size="1.1rem" />
            </q-item-section>
            <q-item-section>Configurações</q-item-section>
          </q-item>
        </q-list>

        <q-separator dark inset />

        <div class="q-pa-sm">
          <q-item
            clickable
            class="app-drawer__item text-white rounded-borders"
            @click="handleLogout"
          >
            <q-item-section avatar>
              <q-icon name="fas fa-sign-out-alt" size="1.1rem" />
            </q-item-section>
            <q-item-section>Sair</q-item-section>
            <q-tooltip
              v-if="!isMobile"
              anchor="top middle"
              self="bottom middle"
            >
              Sair ({{ userName }})
            </q-tooltip>
          </q-item>
        </div>
      </div>
    </q-drawer>

    <!-- Header com breadcrumb -->
    <q-header class="app-header" style="background-color: #e7e5e4">
      <q-toolbar>
        <q-btn
          v-if="isMobile"
          flat
          dense
          round
          icon="fas fa-bars"
          aria-label="Abrir menu de navegação"
          class="app-header__menu-btn"
          @click="sidebarOpen = !sidebarOpen"
        />
        <nav class="row items-center text-left" aria-label="breadcrumb">
          <template v-for="(item, i) in breadcrumbItems" :key="i">
            <span v-if="i > 0" class="app-breadcrumb__separator">&gt;</span>
            <a
              v-if="item.to"
              href="#"
              class="app-breadcrumb__link"
              @click.prevent="navigate(item.to)"
            >
              {{ item.label }}
            </a>
            <span v-else class="app-breadcrumb__current">{{ item.label }}</span>
          </template>
        </nav>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <q-page
        padding
        class="flex column overflow-hidden"
        :style-fn="pageStyleFn"
      >
        <slot />
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useQuasar } from "quasar";
import { useUserStore } from "@/stores/user";
import { useNavigate } from "@/utils/navigate";
import logoUrl from "@/assets/images/logo-small.png";

defineOptions({ name: "AppLayout" });

// Fonte única de verdade do layout: abaixo disso a navegação vive no drawer
// em modo overlay; acima, o drawer fica permanentemente aberto.
const MOBILE_BREAKPOINT = 768;

const props = withDefaults(
  defineProps<{
    title?: string;
  }>(),
  { title: "" }
);

const route = useRoute();
const router = useRouter();
const $q = useQuasar();
const userStore = useUserStore();
const { navigate } = useNavigate();

const isMobile = computed(() => $q.screen.width < MOBILE_BREAKPOINT);

// O `v-model` do QDrawer começa `true` e sobrepõe o breakpoint, fazendo a
// sidebar abrir como overlay no mobile (só a prop `breakpoint` não esconde
// nada). Controlar o estado aqui evita depender desse comportamento interno.
const sidebarOpen = ref(false);
watch(
  isMobile,
  mobile => {
    sidebarOpen.value = !mobile;
  },
  { immediate: true }
);

// Trava a altura da página na área visível (mesma fórmula do default do
// Quasar, mas com height em vez de minHeight): o scroll nunca é da janela,
// cada página/componente gerencia seu próprio scroll interno.
function pageStyleFn(offset: number, height: number) {
  return { height: `${height - offset}px` };
}

const userName = computed(() => userStore.state.currentUser.name || "...");

const registrationItems = [
  {
    to: "/registrations/professionals",
    icon: "fa-solid fa-user-doctor",
    label: "Médicos / Profissionais"
  },
  {
    to: "/registrations/procedures",
    icon: "fa-solid fa-syringe",
    label: "Procedimentos"
  },
  {
    to: "/registrations/exams",
    icon: "fa-solid fa-microscope",
    label: "Exames"
  }
];

const breadcrumbItems = computed(() => {
  const items: { label: string; to?: string }[] = [];
  if (route.path !== "/") {
    items.push({ label: "Home", to: "/" });
  }
  const title =
    props.title || (route.path.startsWith("/registrations") ? "Cadastros" : "");
  if (title) {
    items.push({ label: title });
  }
  return items;
});

function handleLogout() {
  userStore.cleanCurrentUser();
  $q.notify({
    type: "info",
    message: "Sessão encerrada",
    timeout: 2000
  });
  void router.push("/auth");
}

// Itens do drawer usam `navigate` (com prefetch em background) em vez de `to`:
// a rota troca na hora e o destaque acompanha `route.path`.
function isCurrent(path: string) {
  return route.path === path;
}
</script>

<!--
  Estilos do layout são GLOBAIS (css/app.scss): componentes do Quasar como
  QDrawer/QHeader aplicam seus próprios fundos e, com <style scoped>,
  os seletores podem não vencer o CSS nativo do Quasar.
-->
