export type SchedulingClinic = {
  id: string;
  name: string;
  phone?: string;
  site_page?: string;
  logo?: string;
};

export type SchedulingContextAppointment = {
  id: string;
  professional_id: string | null;
  exam_id: string | null;
  procedure_id: string | null;
  schedule_slot_id: string | null;
  start_time: string | null;
  end_time: string | null;
  status: string | null;
  notes: string | null;
  ics_url: string;
  cancel_url: string;
};

export type SchedulingContextPatient = {
  id: string;
  name_masked: string;
};

export type SchedulingContext = {
  clinic: SchedulingClinic;
  expires_at: string;
  allowed_professionals: string[] | null;
  allowed_procedures: string[] | null;
  allowed_exams: string[] | null;
  patient: SchedulingContextPatient | null;
  appointment: SchedulingContextAppointment | null;
};

export type SchedulingProfessional = {
  id: string;
  name: string;
  specialty?: string;
  registration_number?: string;
};

export type SchedulingService = {
  id: string;
  name: string;
  description?: string;
  type?: string;
  specialty?: string;
  duration_minutes?: number;
};

export type SchedulingServices = {
  procedures: SchedulingService[];
  exams: SchedulingService[];
};

export type SchedulingSlot = {
  schedule_slot_id: string;
  start_time: string;
  end_time: string;
};

export type SchedulingDay = {
  date: string;
  slots: SchedulingSlot[];
};

export type SchedulingIdentifyResult =
  | { exists: false }
  | {
      exists: true;
      patient: {
        id: string;
        name_masked: string;
        birth_date_masked: string | null;
      };
    };

export type SchedulingRegisterResult = { patient_id: string };

export type SchedulingNewPatientPayload = {
  cpf: string;
  name: string;
  email: string;
  phone: string;
  birth_date: string;
};

export type SchedulingNewAppointmentPayload = {
  professional_id: string;
  procedure_id?: string;
  exam_id?: string;
  schedule_slot_id: string;
  start_time: string;
  end_time: string;
  notes?: string;
};

export type SchedulingAppointment = {
  id: string;
  patient_id: string | null;
  professional_id: string | null;
  exam_id: string | null;
  procedure_id: string | null;
  schedule_slot_id: string | null;
  start_time: string | null;
  end_time: string | null;
  status: string | null;
  notes: string | null;
};

export type SchedulingBooking = {
  appointment: SchedulingAppointment;
  ics_url: string;
  cancel_url: string;
};
