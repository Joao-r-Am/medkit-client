import type { IClinic, IRoleSummary } from "./clinic";

/** Status persistido do convite (o "expirado" é derivado de `expires_at`). */
export type StoredInvitationStatus = "pending" | "accepted" | "revoked";

/** Convite de equipe listado para a clínica ativa. */
export interface ITeamInvitation {
  id: string;
  clinic_id: string;
  email: string;
  status: StoredInvitationStatus;
  expires_at: string;
  accepted_at: string | null;
  role: IRoleSummary | null;
  invited_by: { id: string; name: string } | null;
}

/** Payload de criação do convite (POST /clinics/:id/invitations). */
export interface ICreateInvitation {
  email: string;
  role_id: string;
}

/** Prévia pública do convite (GET /invitations/:token). */
export interface IPublicInvitation {
  clinic: { name: string };
  role: { name: string } | null;
  invited_by: string | null;
  email: string;
  expires_at: string;
}

/** Retorno do aceite (POST /invitations/:token/accept). */
export interface IInvitationAcceptance {
  clinic: IClinic;
  membership: { id: string; status: string };
  roles: IRoleSummary[];
}
