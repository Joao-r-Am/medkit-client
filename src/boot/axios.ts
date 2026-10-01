import { defineBoot } from "#q-app";
import type { InternalAxiosRequestConfig } from "axios";
import httpClient from "@/services/http";
import { reportBytes, startRequest, stopRequest } from "@/stores/global";
import { useUserStore } from "@/stores/user";

/*
 * O id da transferência precisa sobreviver do interceptor de request ao de
 * response para fechar a mesma requisição. Um WeakMap no objeto `config` faz
 * isso sem vazar nada para a API (um header customizado acabaria indo para o
 * servidor) e sem segurar memória: a entrada some junto com o config.
 */
const loadIds = new WeakMap<InternalAxiosRequestConfig, number>();

function loadIdOf(config: InternalAxiosRequestConfig | undefined) {
  return config ? loadIds.get(config) : undefined;
}

let isRedirecting = false;

export default defineBoot(({ router }) => {
  httpClient.interceptors.request.use(config => {
    const id = startRequest();
    loadIds.set(config, id);

    // A barra de progresso anda com os bytes reais, não com um temporizador: o
    // `total` chega `undefined` quando a resposta não é lengthComputable (sem
    // `Content-Length`), e nesse caso a transferência só pesa ao terminar.
    const previous = config.onDownloadProgress;
    config.onDownloadProgress = event => {
      reportBytes(id, event.loaded, event.total);
      previous?.(event);
    };

    const token = window.localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  });

  httpClient.interceptors.response.use(
    response => {
      // Uma unica vez por request: o contador seria desalinhado com um
      // decremento extra em cada ramo do tratamento de erro. O id pode vir
      // `undefined` se o erro não carregou o `config`; o store sabe se
      // recovering de qualquer forma.
      stopRequest(loadIdOf(response.config));

      return response;
    },
    error => {
      stopRequest(loadIdOf(error.config));

      const status = error?.response?.status ?? error?.request?.status;

      if (status === 0 || status === 500) {
        return Promise.reject(new Error(error.message));
      }

      if (status === 401) {
        window.localStorage.removeItem("token");
        window.localStorage.removeItem("user");
        const userStore = useUserStore();
        userStore.cleanCurrentUser();
        if (!isRedirecting) {
          isRedirecting = true;
          void router.push("/auth").finally(() => {
            isRedirecting = false;
          });
        }
      }

      return Promise.reject(error);
    }
  );
});
