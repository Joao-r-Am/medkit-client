import httpClient from "./http";

type AuthError = {
  status: number;
  statusText: string;
} | null;

type RegisterPayload = {
  name: string;
  lastname: string;
  especialty_area: string;
  email: string;
  access_type: number;
  password: string;
  phone: string;
  cnpjf: string;
};

type LoginPayload = {
  identificator: string;
  password: string;
};

// TODO: tratar para quando o token expirar
export default {
  register: async ({
    name,
    lastname,
    especialty_area,
    email,
    access_type,
    password,
    phone,
    cnpjf
  }: RegisterPayload) => {
    const response = await httpClient.post("/auth/register", {
      name,
      lastname,
      especialty_area,
      email,
      access_type,
      password,
      phone,
      cnpjf
    });
    let error: AuthError = null;
    console.log(response.data);
    if (!response.data) {
      error = {
        status: response.request.status,
        statusText: response.request.statusText
      };
    }
    return {
      data: response,
      error
    };
  },

  login: async ({ identificator, password }: LoginPayload) => {
    const response = await httpClient.post("/auth/login", {
      identificator,
      password
    });
    let error: AuthError = null;

    if (!response.data) {
      error = {
        status: response.request.status,
        statusText: response.request.statusText
      };
    }
    return {
      data: response,
      error
    };
  },

  findByCnpjfOrUsername: async (payload: string) => {
    const response = await httpClient.post("/auth/find-by-cnjpf-username", {
      payload
    });
    let error: AuthError = null;

    if (!response.data) {
      error = {
        status: response.request.status,
        statusText: response.request.statusText
      };
    }
    return {
      data: response,
      error
    };
  }
};
