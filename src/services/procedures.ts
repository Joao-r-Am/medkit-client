import httpClient from "./http";
import { buildError } from "./utils";

export default {
  getAll: async ({
    page = 1,
    limit = 100
  }: { page?: number; limit?: number } = {}) => {
    const response = await httpClient.get("/procedures", {
      params: { page, limit }
    });
    const { data } = response.data;
    return data;
  },

  getById: async (id: string) => {
    const response = await httpClient.get(`/procedures/${id}`);
    return { data: response.data, error: buildError(response) };
  },

  create: async (payload: Record<string, unknown>) => {
    const response = await httpClient.post("/procedures", payload);
    return { data: response, error: buildError(response) };
  },

  update: async (id: string, payload: Record<string, unknown>) => {
    const response = await httpClient.put(`/procedures/${id}`, payload);
    return { data: response, error: buildError(response) };
  },

  destroy: async (id: string) => {
    const response = await httpClient.delete(`/procedures/${id}`);
    return { data: response.data, error: buildError(response) };
  }
};
