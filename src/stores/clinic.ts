import { defineStore } from "pinia";
import { reactive } from "vue";
import services from "../services";
import type { IMyClinic } from "../interfaces/clinic";
import { MembershipStatus } from "../interfaces/clinic";

export const useClinicStore = defineStore("clinic", () => {
  const state = reactive<{
    memberships: IMyClinic[];
    loading: boolean;
    loaded: boolean;
    error: string | null;
  }>({
    memberships: [],
    loading: false,
    loaded: false,
    error: null
  });

  /** Busca os vínculos do usuário. `force` ignora o cache em memória. */
  async function fetchMyClinics(force = false): Promise<void> {
    if (state.loaded && !force) return;

    state.loading = true;
    state.error = null;

    try {
      state.memberships = await services.clinics.myClinics();
      state.loaded = true;
    } catch {
      state.memberships = [];
      state.error = "Não foi possível carregar suas clínicas.";
    } finally {
      state.loading = false;
    }
  }

  /** Vínculos ativos (o único estado considerado "clínica disponível"). */
  function activeMemberships(): IMyClinic[] {
    return state.memberships.filter(
      membership => membership.status === MembershipStatus.ACTIVE
    );
  }

  /** Limpa o contexto de clínica (troca de sessão/logout). */
  function $reset(): void {
    state.memberships = [];
    state.loading = false;
    state.loaded = false;
    state.error = null;
  }

  return { state, fetchMyClinics, activeMemberships, $reset };
});
