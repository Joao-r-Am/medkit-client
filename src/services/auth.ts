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
  password: string;
  phone: string;
  cnpjf: string;
};

type LoginPayload = {
  identificator: string;
  password: string;
};

type SelectClinicPayload = {
  membership_id: string;
};

// TODO: tratar para quando o token expirar
export default {
  register: async ({
    name,
    lastname,
    especialty_area,
    email,
    password,
    phone,
    cnpjf
  }: RegisterPayload) => {
    const response = await httpClient.post("/auth/register", {
      name,
      lastname,
      especialty_area,
      email,
      password,
      phone,
      cnpjf
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
  },

  /** Emite um novo token já com o contexto da clínica escolhida. */
  selectClinic: async ({ membership_id }: SelectClinicPayload) => {
    const response = await httpClient.post("/auth/select-clinic", {
      membership_id
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
