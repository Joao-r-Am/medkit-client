// Tipos compartilhados entre AppointmentCalendar e CalendarDayAgenda.
// Vivem fora dos componentes para evitar import circular entre eles.

export type CalendarAppointment = {
  id: string;
  startTime?: string | Date;
  endTime?: string | Date;
  status?: string;
  patient?: { name?: string } | null;
  professional?: { id?: string; name?: string } | null;
  exam?: { name?: string } | null;
  procedure?: { name?: string } | null;
};

export type CalendarSlot = {
  id: string;
  professionalId?: string;
  startTime?: string | Date;
  endTime?: string | Date;
  status?: string;
  appointments?: { deletedAt?: string | null }[];
};

export type CalendarProfessional = { id: string; name?: string };

// Horários livres agrupados por profissional (painel "Agenda do dia")
export type DayFreeSlotGroup = {
  id: string;
  name: string;
  slots: CalendarSlot[];
};
