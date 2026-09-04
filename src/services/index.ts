import AuthService from "./auth";
import UserService from "./users";
import PatientService from "./patients";
import AppointmentService from "./appointments";
import ProfessionalService from "./professionals";
import ExamService from "./exams";
import ProcedureService from "./procedures";
import ScheduleSlotService from "./schedule-slots";

export default {
  auth: AuthService,
  users: UserService,
  patients: PatientService,
  appointments: AppointmentService,
  professionals: ProfessionalService,
  exams: ExamService,
  procedures: ProcedureService,
  scheduleSlots: ScheduleSlotService
};
