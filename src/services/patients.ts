import httpClient from "./http";
import { buildError } from "./utils";

type PatientsListParams = {
  limit?: number;
  offset?: number;
  type?: string | null;
};

const defaultPagination: PatientsListParams = {
  limit: 5,
  offset: 0
};

export default {
  getAll: async ({
    type,
    limit,
    offset
  }: PatientsListParams = defaultPagination) => {
    const query: Record<string, unknown> = { limit, offset };
    if (type) {
      query.type = type;
    }
    const response = await httpClient.get("/patients", {
      params: query
    });
    const { data } = response.data;
    return data;
  },

  getSummary: async () => {
    const response = await httpClient.get("/patients/");
    const { data } = response.data;
    return data;
  },

  create: async (payload: Record<string, unknown>) => {
    const response = await httpClient.post("/patients", payload);
    return { data: response, error: buildError(response) };
  },

  getById: async (id: string) => {
    const response = await httpClient.get(`/patients/${id}`);
    return { data: response.data, error: buildError(response) };
  },

  destroy: async (id: string) => {
    const response = await httpClient.delete(`/patients/${id}`);
    return { data: response.data, error: buildError(response) };
  },

  update: async (id: string, payload: Record<string, unknown>) => {
    const response = await httpClient.put(`/patients/${id}`, payload);
    return { data: response, error: buildError(response) };
  }
};
