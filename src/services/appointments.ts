import httpClient from "./http";
import type { IAppointment } from "../interfaces/models";

type AppointmentListParams = {
  page?: number;
  limit?: number;
  preload?: string;
};

export default {
  getAll: async ({
    page = 1,
    limit = 100,
    preload
  }: AppointmentListParams = {}) => {
    const response = await httpClient.get("/appointments", {
      params: { page, limit, preload }
    });
    const { data } = response.data;
    return data;
  },

  getList: async ({
    page = 1,
    limit = 20,
    preload
  }: AppointmentListParams = {}) => {
    const response = await httpClient.get("/appointments", {
      params: { page, limit, preload }
    });
    return response.data;
  },

  getOne: async (id: string) => {
    const response = await httpClient.get(`/appointments/${id}`);
    const { data } = response.data;
    return data;
  },

  getById: async (id: string) => {
    const response = await httpClient.get(`/appointments/${id}`, {
      params: { preload: "patient,professional,exam,procedure,scheduleSlot" }
    });
    return { data: response.data, error: null };
  },

  create: async (info: Partial<IAppointment>) => {
    const response = await httpClient.post("/appointments", info);
    const { data } = response.data;
    return data;
  },

  update: async (id: string, info: Partial<IAppointment>) => {
    const response = await httpClient.put(`/appointments/${id}`, info);
    const { data } = response.data;
    return data;
  },

  destroy: async (id: string) => {
    const response = await httpClient.delete(`/appointments/${id}`);
    const { data } = response.data;
    return data;
  }
};
