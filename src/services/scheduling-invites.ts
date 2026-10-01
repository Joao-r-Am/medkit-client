import httpClient from "./http";
import type {
  SchedulingInviteCreated,
  SchedulingInviteListItem,
  SchedulingInvitePayload
} from "../interfaces/scheduling-invite";

export default {
  async create(
    payload: SchedulingInvitePayload = {}
  ): Promise<SchedulingInviteCreated> {
    const response = await httpClient.post("/scheduling-invites", payload);
    return response.data;
  },

  async getAll(): Promise<SchedulingInviteListItem[]> {
    const response = await httpClient.get("/scheduling-invites");
    const { data } = response.data;
    return data;
  },

  async revoke(id: string): Promise<{ revoked: boolean }> {
    const response = await httpClient.delete(`/scheduling-invites/${id}`);
    return response.data;
  }
};
