import AuthService from "./auth";
import UserService from "./users";
import PatientService from "./patients";
import AppointmentService from "./appointments";
import ProfessionalService from "./professionals";
import ExamService from "./exams";
import ProcedureService from "./procedures";
import ScheduleSlotService from "./schedule-slots";
import SchedulingInvitesService from "./scheduling-invites";
import ClinicsService from "./clinics";

export default {
  auth: AuthService,
  users: UserService,
  patients: PatientService,
  appointments: AppointmentService,
  professionals: ProfessionalService,
  exams: ExamService,
  procedures: ProcedureService,
  scheduleSlots: ScheduleSlotService,
  schedulingInvites: SchedulingInvitesService,
  clinics: ClinicsService
};
