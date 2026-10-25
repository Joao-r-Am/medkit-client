import httpClient from "./http";
import type {
  IClinic,
  IClinicMember,
  IMyClinic,
  IPermission,
  IRole
} from "../interfaces/clinic";

export default {
  /** Clínicas/vínculos do usuário autenticado (rota de conta, sem clínica ativa). */
  async myClinics(): Promise<IMyClinic[]> {
    const response = await httpClient.get("/me/clinics");
    const { data } = response.data;
    return data;
  },

  /** Detalhe de uma clínica (exige vínculo ativo — 403 sem ele). */
  async getClinic(id: string): Promise<IClinic & { membership: unknown }> {
    const response = await httpClient.get(`/clinics/${id}`);
    return response.data;
  },

  async members(id: string): Promise<IClinicMember[]> {
    const response = await httpClient.get(`/clinics/${id}/members`);
    const { data } = response.data;
    return data;
  },

  /** Papéis da clínica (sistema + customizados) com permissões. */
  async roles(id: string): Promise<IRole[]> {
    const response = await httpClient.get(`/clinics/${id}/roles`);
    const { data } = response.data;
    return data;
  },

  /** Catálogo de permissões definido pelo backend. */
  async permissions(): Promise<IPermission[]> {
    const response = await httpClient.get("/permissions");
    const { data } = response.data;
    return data;
  }
};
