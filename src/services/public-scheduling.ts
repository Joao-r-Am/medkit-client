import httpClient from "./http";
import type {
  SchedulingBooking,
  SchedulingContext,
  SchedulingDay,
  SchedulingIdentifyResult,
  SchedulingNewAppointmentPayload,
  SchedulingNewPatientPayload,
  SchedulingProfessional,
  SchedulingRegisterResult,
  SchedulingServices
} from "../interfaces/public-scheduling";

/** Base relativa usada pelas URLs devolvidas pela API (ics_url, cancel_url). */
const API_BASE = import.meta.env.QCLI_API_BASE_URL ?? "/api/v1";

/**
 * Cliente dos endpoints públicos de auto-agendamento.
 * Não requer autenticação (as chamadas seguem o token no path).
 */
export default {
  base: `${API_BASE}/public/scheduling`,

  async context(token: string): Promise<SchedulingContext> {
    const response = await httpClient.get(`/public/scheduling/${token}`);
    return response.data;
  },

  async professionals(token: string): Promise<SchedulingProfessional[]> {
    const response = await httpClient.get(
      `/public/scheduling/${token}/professionals`
    );

    const { data } = response.data;
    return data;
  },

  async procedures(
    token: string,
    professionalId: string
  ): Promise<SchedulingServices> {
    const response = await httpClient.get(
      `/public/scheduling/${token}/procedures`,
      {
        params: { professional_id: professionalId }
      }
    );
    return response.data;
  },

  async availability(
    token: string,
    params: {
      professional_id: string;
      procedure_id?: string;
      exam_id?: string;
      from: string;
      to: string;
    }
  ): Promise<SchedulingDay[]> {
    const response = await httpClient.get(
      `/public/scheduling/${token}/availability`,
      {
        params
      }
    );
    const { days } = response.data;
    return days;
  },

  async identify(
    token: string,
    cpf: string
  ): Promise<SchedulingIdentifyResult> {
    const response = await httpClient.post(
      `/public/scheduling/${token}/identify`,
      {
        cpf
      }
    );
    return response.data;
  },

  async register(
    token: string,
    payload: SchedulingNewPatientPayload
  ): Promise<SchedulingRegisterResult> {
    const response = await httpClient.post(
      `/public/scheduling/${token}/register`,
      payload
    );
    return response.data;
  },

  async createAppointment(
    token: string,
    idempotencyKey: string,
    payload: SchedulingNewAppointmentPayload
  ): Promise<SchedulingBooking> {
    const response = await httpClient.post(
      `/public/scheduling/${token}/appointments`,
      payload,
      {
        headers: { "Idempotency-Key": idempotencyKey }
      }
    );
    return response.data;
  },

  async cancel(
    token: string,
    appointmentId: string
  ): Promise<{ cancelled: boolean }> {
    const response = await httpClient.post(
      `/public/scheduling/${token}/appointments/${appointmentId}/cancel`
    );
    return response.data;
  },

  icsUrl(token: string, appointmentId: string): string {
    return `${API_BASE}/public/scheduling/${token}/appointments/${appointmentId}/ics`;
  },

  /**
   * URL do convite em PDF. A API gera o documento sob demanda (HTML + Chrome
   * headless), então o link é direto e pode ir em `href`/`window.open`.
   */
  pdfUrl(token: string, appointmentId: string): string {
    return `${API_BASE}/public/scheduling/${token}/appointments/${appointmentId}/pdf`;
  }
};
