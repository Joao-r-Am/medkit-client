export type SchedulingInviteStatus = "pending" | "used" | "expired" | "revoked";

export type SchedulingInviteListItem = {
  id: string;
  token: string;
  url: string;
  patient_id: string | null;
  professional_id: string | null;
  procedure_ids: string[] | null;
  exam_ids: string[] | null;
  expires_at: string | null;
  used_at: string | null;
  created_by: string;
  status: SchedulingInviteStatus;
};

export type SchedulingInvitePayload = {
  patient_id?: string;
  professional_id?: string;
  procedure_ids?: string[];
  exam_ids?: string[];
  expires_in_days?: number;
};

export type SchedulingInviteCreated = {
  id: string;
  token: string;
  url: string;
  expires_at: string;
};
