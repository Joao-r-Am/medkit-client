import { defineStore } from "pinia";
import { reactive } from "vue";
import services from "../services";
import type { ICreateClinic, IClinic, IMyClinic } from "../interfaces/clinic";
import { MembershipStatus } from "../interfaces/clinic";

const ACTIVE_CLINIC_KEY = "clinic";

/** Contexto de clínica ativa persistido entre reloads. */
export interface IActiveClinicContext {
  membership_id: string;
  clinic_id: string;
  clinic: IClinic | null;
}

function readStoredContext(): IActiveClinicContext | null {
  try {
    const raw = window.localStorage.getItem(ACTIVE_CLINIC_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as IActiveClinicContext;
    return parsed && parsed.membership_id && parsed.clinic_id ? parsed : null;
  } catch {
    return null;
  }
}

export const useClinicStore = defineStore("clinic", () => {
  const state = reactive<{
    memberships: IMyClinic[];
    loading: boolean;
    loaded: boolean;
    error: string | null;
    /** Clínica ativa da sessão (token com contexto já em uso). */
    activeContext: IActiveClinicContext | null;
    /** Indica que há seleção pendente (mais de um vínculo). */
    selecting: boolean;
  }>({
    memberships: [],
    loading: false,
    loaded: false,
    error: null,
    activeContext: readStoredContext(),
    selecting: false
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

  /** Persiste/baixa o contexto atual (troca de sessão/logout ou troca manual). */
  function clearSelection(): void {
    state.activeContext = null;
    window.localStorage.removeItem(ACTIVE_CLINIC_KEY);
  }

  /**
   * Troca o token da conta pelo token com contexto de clínica (POST
   * /auth/select-clinic) e persiste o contexto ativo.
   */
  async function selectMembership(membershipId: string): Promise<IMyClinic> {
    const membership = state.memberships.find(
      candidate => candidate.membership_id === membershipId
    );
    if (!membership) {
      throw new Error("Vínculo não encontrado.");
    }

    const { data, error } = await services.auth.selectClinic({
      membership_id: membershipId
    });
    if (error || !data?.data) {
      throw new Error("Não foi possível selecionar a clínica.");
    }

    const selection = data.data;
    state.activeContext = {
      membership_id: membershipId,
      clinic_id: selection.clinic_id,
      clinic: selection.clinic
    };
    window.localStorage.setItem(
      ACTIVE_CLINIC_KEY,
      JSON.stringify(state.activeContext)
    );
    window.localStorage.setItem("token", selection.token);
    state.selecting = false;
    return membership;
  }

  /**
   * Fluxo pós-autenticação (0/1/n vínculos): busca os vínculos atualizados e
   * resolve a rota de destino. Com 1 vínculo ativo já entra direto na clínica;
   * com 0 vai ao perfil (aba de clínicas para criar/aguardar convite) e com
   * n vai à lista para escolher qual entrar.
   */
  async function resolveClinicRoute(): Promise<string> {
    await fetchMyClinics(true);

    const actives = activeMemberships();

    if (state.activeContext) {
      const stillActive = actives.some(
        candidate =>
          candidate.membership_id === state.activeContext!.membership_id
      );
      if (stillActive) return "/";
      clearSelection();
    }

    if (actives.length === 1) {
      try {
        await selectMembership(actives[0]!.membership_id);
        return "/";
      } catch {
        return "/profile";
      }
    }

    state.selecting = actives.length > 1;
    return actives.length === 0 ? "/profile" : "/clinics";
  }

  /** Cria a clínica do usuário (owner) e já entra nela. */
  async function createClinic(payload: ICreateClinic): Promise<void> {
    const created = await services.clinics.createClinic(payload);
    clearSelection();
    await fetchMyClinics(true);
    await selectMembership(created.membership.id);
  }

  /** Vincula o usuário a uma clínica local existente e já entra nela. */
  async function linkToClinic(clinicId: string): Promise<void> {
    const linked = await services.clinics.linkToClinic(clinicId);
    clearSelection();
    await fetchMyClinics(true);
    await selectMembership(linked.membership.id);
  }

  /** Limpa o contexto de clínica (troca de sessão/logout). */
  function $reset(): void {
    state.memberships = [];
    state.loading = false;
    state.loaded = false;
    state.error = null;
    state.activeContext = readStoredContext();
    state.selecting = false;
  }

  return {
    state,
    fetchMyClinics,
    activeMemberships,
    selectMembership,
    clearSelection,
    resolveClinicRoute,
    createClinic,
    linkToClinic,
    $reset
  };
});
