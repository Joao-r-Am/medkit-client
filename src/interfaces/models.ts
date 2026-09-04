export interface IExam {
  id: string;
  code?: string;
  name: string;
  type?: string;
  specialty?: string;
  description?: string;
  preparation_instructions?: string;
  duration_minutes?: number;
  tags?: string[];
  created_at?: string | Date;
  updated_at?: string | Date;
  deleted_at?: string | Date;
}

export interface IPatient {
  id: string;
  name: string;
  document: string;
  birth_date?: string | Date;
  phone?: string;
  email?: string;
  observations?: string;
  created_at?: string | Date;
  updated_at?: string | Date;
  deleted_at?: string | Date;
}

export interface IProcedure {
  id: string;
  name: string;
  description?: string;
  duration_minutes?: number;
  created_at?: string | Date;
  updated_at?: string | Date;
  deleted_at?: string | Date;
}

export interface IProfessional {
  id: string;
  name: string;
  document: string;
  birth_date?: string | Date;
  specialty?: string;
  registration_number?: string;
  phone?: string;
  email?: string;
  created_at?: string | Date;
  updated_at?: string | Date;
  deleted_at?: string | Date;
}

export interface IScheduleSlot {
  id: string;
  professional_id: string;
  start_time: string | Date;
  end_time: string | Date;
  status: string;
  notes?: string;
  appointments?: { deletedAt?: string | null }[];
  created_at?: string | Date;
  updated_at?: string | Date;
}

export type AppointmentStatus =
  | "SCHEDULED"
  | "CONFIRMED"
  | "COMPLETED"
  | "CANCELLED";

export interface IAppointment {
  id: string;
  patient_id: string;
  professional_id: string;
  exam_id?: string | null;
  procedure_id?: string | null;
  schedule_slot_id?: string | null;
  start_time: string | Date;
  end_time: string | Date;
  status: AppointmentStatus;
  notes?: string | null;
  is_blocked?: boolean;
  patient?: IPatient;
  professional?: IProfessional;
  exam?: IExam;
  procedure?: IProcedure;
  scheduleSlot?: IScheduleSlot;
  created_at?: string | Date;
  updated_at?: string | Date | null;
  deleted_at?: string | Date | null;
  closed_at?: string | Date | null;
}
