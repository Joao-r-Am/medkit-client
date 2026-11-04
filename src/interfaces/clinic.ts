export enum MembershipStatus {
  ACTIVE = "active",
  SUSPENDED = "suspended",
  REMOVED = "removed"
}

/** Clínica conforme serializada pela API (camelCase). */
export interface IClinic {
  id: string;
  name: string;
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
