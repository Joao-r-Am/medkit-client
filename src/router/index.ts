import { defineRouter } from "#q-app";
import { routes, handleHotUpdate } from "vue-router/auto-routes";
import {
  createMemoryHistory,
  createRouter,
  createWebHashHistory,
  createWebHistory
} from "vue-router";
import { resolveNavigationGuard } from "./guards";
import { notifyClinicContextRequired } from "./clinic-context-notify";

/*
 * If not building with SSR mode, you can
 * directly export the Router instantiation;
 *
 * The function below can be async too; either use
 * async/await or return a Promise which resolves
 * with the Router instance.
 */

export default defineRouter((/* { store, ssrContext } */) => {
  const createHistory = import.meta.env.QUASAR_SERVER
    ? createMemoryHistory
    : import.meta.env.QUASAR_VUE_ROUTER_MODE === "history"
      ? createWebHistory
      : createWebHashHistory;

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,

    // Leave this as is and make changes in quasar.conf.js instead!
    // quasar.conf.js -> build -> vueRouterMode
    // quasar.conf.js -> build -> publicPath
    history: createHistory(import.meta.env.QUASAR_VUE_ROUTER_BASE)
  });

  // Guarda de autenticação + contexto de clínica (ver src/router/guards.ts).
  Router.beforeEach(to => {
    const redirectPath = resolveNavigationGuard({
      path: to.path,
      hasToken: Boolean(window.localStorage.getItem("token")),
      hasClinicContext: Boolean(window.localStorage.getItem("clinic"))
    });

    if (redirectPath === "/profile" && to.path !== "/profile") {
      // Tela que exige clínica ativa: avisa antes de levar ao perfil.
      notifyClinicContextRequired();
    }

    return redirectPath;
  });

  // enable HMR for it
  if (import.meta.hot) {
    handleHotUpdate(Router);
  }

  return Router;
});
