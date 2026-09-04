import httpClient from "./http";

type ListParams = {
  page?: number;
  limit?: number;
  preload?: string;
};

export default {
  getAll: async ({
    page = 1,
    limit = 100,
    preload = "appointments"
  }: ListParams = {}) => {
    const response = await httpClient.get("/schedule-slots", {
      params: { page, limit, preload }
    });
    const { data } = response.data;
    return data;
  }
};
