import services from "./index";
import { getWeekRange, toDateKey } from "@/utils/date";
import type { WeekRange } from "@/utils/date";

/*
 * Queries com cache curto.
 *
 * A navegação adiada (src/utils/navigate.ts) precisa carregar o dado da página
 * de destino ANTES de trocar a tela, senão o usuário vê a página nova vazia. Como
 * o estado das páginas vive em `ref` local — que morre na navegação — esse
 * cache é o que faz a antecipação servir para alguma coisa: quando a página
 * monta, o `onMounted` acerta o cache e não refaz a request.
 *
 * Como a promise é guardada antes do `await`, requisições simultâneas
 * idênticas (as 4 de appointments.vue, os 3 pontos de uma agenda) compartilham
 * uma única ida à API.
 *
 * TTL curto de propósito: o dado é revalidado a cada 30s e qualquer
 * create/update/delete chama `invalidate`, então o usuário nunca vê dado velho
 * por muito tempo.
 */
const TTL = 30_000;

type CacheEntry = { at: number; promise: Promise<unknown> };

const cache = new Map<string, CacheEntry>();

export function cached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = TTL
): Promise<T> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < ttl) return hit.promise as Promise<T>;

  const promise = fetcher();
  cache.set(key, { at: Date.now(), promise });

  // Erro nunca fica em cache: a próxima navegação precisa tentar de novo.
  promise.catch(() => {
    if (cache.get(key)?.promise === promise) cache.delete(key);
  });

  return promise;
}

/** Descarta a chave e todas as derivadas (`prefixo:*`). */
export function invalidate(prefix: string) {
  // Remover durante a iteração de um Map é seguro: o iterador segue a ordem de
  // inserção e não volta a chaves já visitadas.
  for (const key of cache.keys()) {
    if (key === prefix || key.startsWith(`${prefix}:`)) cache.delete(key);
  }
}

const APPOINTMENT_PRELOAD = "patient,professional,exam,procedure";

type AppointmentFilters = {
  professionalIds: string[];
  dateFrom?: string | undefined;
  dateTo?: string | undefined;
};

function appointmentKey(variant: string, filters: AppointmentFilters): string {
  const ids = [...filters.professionalIds].sort().join(",");

  return `appointments:${variant}:${ids}:${filters.dateFrom ?? ""}:${filters.dateTo ?? ""}`;
}

function listRequest(filters: AppointmentFilters) {
  return services.appointments.getAll({
    preload: APPOINTMENT_PRELOAD,
    limit: 500,
    ...(filters.professionalIds.length > 0
      ? { professionalIds: filters.professionalIds }
      : {}),
    ...(filters.dateFrom ? { dateFrom: filters.dateFrom } : {}),
    ...(filters.dateTo ? { dateTo: filters.dateTo } : {})
  });
}

/**
 * Estado inicial dos filtros de /appointments. Serve tanto como default do
 * prefetch quanto como valor inicial da página, para que a antecipação da
 * primeira navegação e o `onMounted` caiam na MESMA chave de cache.
 */
export function defaultAppointmentFilters(): AppointmentFilters {
  const { from, to } = getWeekRange();

  return {
    professionalIds: [],
    dateFrom: toDateKey(from),
    dateTo: toDateKey(to)
  };
}

function weeklyRequest(professionalIds: string[], range: WeekRange) {
  return services.appointments.getAll({
    preload: APPOINTMENT_PRELOAD,
    limit: 500,
    dateFrom: range.from.toISOString(),
    dateTo: range.to.toISOString(),
    ...(professionalIds.length > 0 ? { professionalIds } : {})
  });
}

export function loadCalendarData(filters: AppointmentFilters) {
  return cached(appointmentKey("calendario", filters), () =>
    listRequest(filters)
  );
}

export function loadTableData(filters: AppointmentFilters) {
  return cached(appointmentKey("tabela", filters), () => listRequest(filters));
}

export function loadWeeklyData(professionalIds: string[], range: WeekRange) {
  const key = `appointments:semana:${[...professionalIds].sort().join(",")}:${range.from.getTime()}:${range.to.getTime()}`;

  return cached(key, () => weeklyRequest(professionalIds, range));
}

export function loadScheduleSlots() {
  return cached("scheduleSlots", () =>
    services.scheduleSlots.getAll({ limit: 500 })
  );
}

export function loadProfessionalOptions() {
  return cached("professionals:options", () =>
    services.professionals.getAll({ limit: 200 })
  );
}

export function loadAppointmentsPage(
  filters: AppointmentFilters,
  range: WeekRange
) {
  return Promise.all([
    loadCalendarData(filters),
    loadTableData(filters),
    loadWeeklyData(filters.professionalIds, range),
    loadScheduleSlots(),
    loadProfessionalOptions()
  ]);
}

export function loadDashboard() {
  return cached("dashboard", async () => {
    const [patients, appointments] = await Promise.all([
      services.patients.getAll(),
      services.appointments.getAll()
    ]);

    return { patients: patients ?? [], appointments: appointments ?? [] };
  });
}

export function loadPatients() {
  return cached("patients", () =>
    services.patients.getAll({ limit: 20, offset: 0 })
  );
}

export function loadProfessionals() {
  return cached("registrations:professionals", () =>
    services.professionals.getAll({ page: 1, limit: 100 })
  );
}

export function loadProcedures() {
  return cached("registrations:procedures", () =>
    services.procedures.getAll({ page: 1, limit: 100 })
  );
}

export function loadExams() {
  return cached("registrations:exams", () =>
    services.exams.getAll({ page: 1, limit: 100 })
  );
}

// ============================================================
// Prefetch por rota
//
// Usado pela navegação adiada (src/utils/navigate.ts) antes do `router.push`.
// O estado inicial dos filtros de /appointments é o mesmo usado pela página,
// então a antecipação da primeira navegação e o `onMounted` caem na mesma chave
// de cache — a página abre populada, sem nenhuma request extra.
// ============================================================

const ROUTE_PREFETCH: Record<string, () => Promise<unknown>> = {
  "/": loadDashboard,
  "/appointments": () =>
    loadAppointmentsPage(defaultAppointmentFilters(), getWeekRange()),
  "/patients": loadPatients,
  "/registrations/professionals": loadProfessionals,
  "/registrations/procedures": loadProcedures,
  "/registrations/exams": loadExams
};

export function prefetchRoute(path: string): Promise<unknown> {
  const load = ROUTE_PREFETCH[path];

  return load ? load() : Promise.resolve();
}
