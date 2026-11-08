export enum MembershipStatus {
  ACTIVE = "active",
  SUSPENDED = "suspended",
  REMOVED = "removed"
}

/** Endereço genérico (tabelas address/address_bond do backend). */
export interface IAddress {
  street: string;
  number?: string | null;
  complement?: string | null;
  district?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  zip?: string | null;
}

/** Clínica conforme serializada pela API (camelCase). */
export interface IClinic {
  id: string;
  name: string;
  email?: string | null;
  cnpjf?: string | null;
  phone?: string | null;
  sitePage?: string | null;
  logo?: string | null;
  maxUsers?: number | null;
  subExpiresAt?: string | null;
}

export interface IRoleSummary {
  id: string;
  name: string;
}

/** Vínculo do usuário autenticado com uma clínica (GET /me/clinics). */
export interface IMyClinic {
  membership_id: string;
  status: MembershipStatus;
  clinic: IClinic | null;
  roles: IRoleSummary[];
}

/** Payload de criação da própria clínica (POST /clinics). */
export interface ICreateClinic {
  name: string;
  cnpjf: string;
  email: string;
  phone?: string | undefined;
  sitePage?: string | undefined;
  logo?: string | undefined;
  address?: IAddress;
}

/** Resultado do lookup de CNPJ (GET /clinics/cnpj/:cnpj — Receitaws). */
export interface ICnpjLookup {
  cnpjf: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: IAddress | null;
}

/** Retorna do POST /auth/select-clinic (token trocado + contexto). */
export interface IClinicSelection {
  token: string;
  membership_id: string;
  clinic_id: string;
  clinic: IClinic | null;
}

export interface IClinicMember {
  membership_id: string;
  status: MembershipStatus;
  user: {
    id: string;
    name: string;
    lastname?: string | null;
    email?: string | null;
    cnpjf?: string | null;
    especialtyArea?: string | null;
    accessType?: number | null;
  } | null;
  roles: IRoleSummary[];
}

export interface IPermission {
  id: string;
  code: string;
  description: string;
}

export interface IRole {
  id: string;
  clinic_id: string | null;
  name: string;
  is_system: boolean;
  permissions: IPermission[];
}
