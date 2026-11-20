import httpClient from "./http";
import type {
  ICreateInvitation,
  IInvitationAcceptance,
  IPublicInvitation,
  ITeamInvitation,
  StoredInvitationStatus
} from "../interfaces/invitation";

export default {
  /** Convites da clínica ativa (GET /clinics/:id/invitations). */
  async list(
    clinicId: string,
    status?: StoredInvitationStatus
  ): Promise<ITeamInvitation[]> {
    const response = await httpClient.get(`/clinics/${clinicId}/invitations`, {
      params: status ? { status } : undefined
    });
    const { data } = response.data;
    return data;
  },

  /** Cria um convite (POST /clinics/:id/invitations). */
  async create(
    clinicId: string,
    payload: ICreateInvitation
  ): Promise<ITeamInvitation> {
    const response = await httpClient.post(
      `/clinics/${clinicId}/invitations`,
      payload
    );
    return response.data;
  },

  /** Reenvia o e-mail de um convite pendente. */
  async resend(
    clinicId: string,
    invitationId: string
  ): Promise<ITeamInvitation> {
    const response = await httpClient.post(
      `/clinics/${clinicId}/invitations/${invitationId}/resend`
    );
    return response.data;
  },

  /** Revoga um convite pendente (DELETE /clinics/:id/invitations/:invitationId). */
  async revoke(
    clinicId: string,
    invitationId: string
  ): Promise<ITeamInvitation> {
    const response = await httpClient.delete(
      `/clinics/${clinicId}/invitations/${invitationId}`
    );
    return response.data;
  },

  /** Prévia pública do convite pelo token do link. */
  async preview(token: string): Promise<IPublicInvitation> {
    const response = await httpClient.get(`/invitations/${token}`);
    return response.data;
  },

  /** Aceite do convite pelo usuário autenticado (sem clínica ativa). */
  async accept(token: string): Promise<IInvitationAcceptance> {
    const response = await httpClient.post(`/invitations/${token}/accept`);
    return response.data;
  }
};
