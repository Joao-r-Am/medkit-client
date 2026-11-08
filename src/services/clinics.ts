import httpClient from "./http";
import type {
  IClinic,
  ICreateClinic,
  IClinicMember,
  ICnpjLookup,
  IMyClinic,
  IPermission,
  IRole,
  IRoleSummary
} from "../interfaces/clinic";
import { stripDocumentFormatting } from "../utils/validators";

export default {
  /** Clínicas/vínculos do usuário autenticado (rota de conta, sem clínica ativa). */
  async myClinics(): Promise<IMyClinic[]> {
    const response = await httpClient.get("/me/clinics");
    const { data } = response.data;
    return data;
  },

  /**
   * Consulta o CNPJ na Receitaws (via API) para preencher o form de
   * criação da clínica. Erros normalizados: CNPJ_INVALID, CNPJ_NOT_FOUND,
   * CNPJ_LOOKUP_RATE_LIMITED, CNPJ_LOOKUP_FAILED.
   */
  async lookupCnpj(cnpjf: string): Promise<ICnpjLookup> {
    const response = await httpClient.get(
      `/clinics/cnpj/${stripDocumentFormatting(cnpjf)}`
    );
    return response.data;
  },

  /**
   * Busca a clínica no banco local pelo CNPJ (GET /clinics/by-cnpj/:cnpj).
   * 404 (CLINIC_NOT_FOUND) quando nenhuma clínica do Medkit usa o CNPJ.
   */
  async findClinicByCnpj(cnpjf: string): Promise<IClinic> {
    const response = await httpClient.get(
      `/clinics/by-cnpj/${stripDocumentFormatting(cnpjf)}`
    );
    return response.data;
  },

  /**
   * Vincula o usuário autenticado a uma clínica existente
   * (POST /clinics/:id/link — membership ativa + papel operator).
   */
  async linkToClinic(clinicId: string): Promise<{
    clinic: IClinic;
    membership: { id: string; status: string };
    roles: IRoleSummary[];
  }> {
    const response = await httpClient.post(`/clinics/${clinicId}/link`);
    return response.data;
  },

  /** Cria a clínica do usuário autenticado (ele passa a ser owner). */
  async createClinic(payload: ICreateClinic): Promise<{
    clinic: IClinic & Record<string, unknown>;
    membership: { id: string; status: string };
    roles: IRoleSummary[];
  }> {
    const response = await httpClient.post("/clinics", payload);
    return response.data;
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
