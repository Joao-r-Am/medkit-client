<template>
  <q-layout view="lHh Lpr lFf">
    <!-- Sidebar (desktop) -->
    <q-drawer
      v-model="sidebarOpen"
      side="left"
      :width="232"
      :breakpoint="768"
      dark
      class="app-drawer"
    >
      <div class="column full-height">
        <div class="flex flex-center q-py-lg">
          <img
            :src="logoUrl"
            alt="logo"
            class="app-drawer__logo"
            style="height: 30px; width: auto"
          />
        </div>

        <q-list padding class="col column q-gutter-y-xs">
          <q-item
            clickable
            to="/"
            exact
            active-class="app-drawer__item--active"
            class="app-drawer__item text-white"
          >
            <q-item-section avatar>
              <q-icon name="fas fa-house" size="1.1rem" />
            </q-item-section>
            <q-item-section>Home</q-item-section>
          </q-item>

          <q-item
            clickable
            to="/appointments"
            active-class="app-drawer__item--active"
            class="app-drawer__item text-white"
          >
            <q-item-section avatar>
              <q-icon name="fa-solid fa-book-medical" size="1.1rem" />
            </q-item-section>
            <q-item-section>Agendamentos</q-item-section>
          </q-item>

          <q-item
            clickable
            to="/patients"
            active-class="app-drawer__item--active"
            class="app-drawer__item text-white"
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
                :to="item.to"
                active-class="app-drawer__child--active"
                class="app-drawer__item app-drawer__child text-white"
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
            to="/credentials"
            active-class="app-drawer__item--active"
            class="app-drawer__item text-white"
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
            <q-tooltip anchor="top middle" self="bottom middle">
              Sair ({{ userName }})
            </q-tooltip>
          </q-item>
        </div>
      </div>
    </q-drawer>

    <!-- Header com breadcrumb -->
    <q-header class="app-header" style="background-color: #e7e5e4">
      <q-toolbar>
        <nav class="row items-center text-left" aria-label="breadcrumb">
          <template v-for="(item, i) in breadcrumbItems" :key="i">
            <span v-if="i > 0" class="app-breadcrumb__separator">&gt;</span>
            <router-link
              v-if="item.to"
              :to="item.to"
              class="app-breadcrumb__link"
            >
              {{ item.label }}
            </router-link>
            <span v-else class="app-breadcrumb__current">{{ item.label }}</span>
          </template>
        </nav>
      </q-toolbar>
    </q-header>

    <!-- Navegação inferior (mobile) -->
    <q-footer v-if="$q.screen.lt.md" class="app-footer">
      <div class="row justify-around items-center no-wrap full-width q-py-xs">
        <q-btn
          v-for="item in mobileItems"
          :key="item.to"
          flat
          dense
          stack
          no-caps
          :icon="item.icon"
          :label="item.label"
          :class="{ 'app-footer__btn--active': isActive(item.to) }"
          class="app-footer__btn col"
          @click="go(item.to)"
        />
        <q-btn-dropdown
          flat
          dense
          stack
          no-caps
          icon="fa-regular fa-address-card"
          label="Cadastros"
          :class="{ 'app-footer__btn--active': isActive('/registrations') }"
          class="app-footer__btn col"
        >
          <q-list>
            <q-item
              v-for="item in registrationItems"
              :key="item.to"
              clickable
              v-close-popup
              :to="item.to"
            >
              <q-item-section avatar>
                <q-icon :name="item.icon" size="0.95rem" />
              </q-item-section>
              <q-item-section>{{ item.label }}</q-item-section>
            </q-item>
          </q-list>
        </q-btn-dropdown>
        <q-btn
          flat
          dense
          stack
          no-caps
          icon="fas fa-sign-out-alt"
          label="Sair"
          class="app-footer__btn col"
          @click="handleLogout"
        />
      </div>
    </q-footer>

    <q-page-container>
      <q-page padding class="app-page">
        <slot />
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useQuasar } from "quasar";
import { useUserStore } from "@/stores/user";
import logoUrl from "@/assets/images/logo-small.png";

defineOptions({ name: "AppLayout" });

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

const sidebarOpen = ref(true);

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

const mobileItems = [
  { to: "/", icon: "fas fa-house", label: "Home" },
  { to: "/appointments", icon: "fa-solid fa-book-medical", label: "Agenda" },
  {
    to: "/patients",
    icon: "fa-solid fa-person-circle-plus",
    label: "Pacientes"
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

function isActive(path: string) {
  if (path === "/") return route.path === "/";
  return route.path.startsWith(path);
}

function go(to: string) {
  void router.push(to);
}

function handleLogout() {
  userStore.cleanCurrentUser();
  $q.notify({
    type: "info",
    message: "Sessão encerrada",
    timeout: 2000
  });
  void router.push("/auth");
}
</script>

<!--
  Estilos do layout são GLOBAIS (css/app.scss): componentes do Quasar como
  QDrawer/QFooter aplicam seus próprios fundos e, com <style scoped>,
  os seletores podem não vencer o CSS nativo do Quasar.
-->
