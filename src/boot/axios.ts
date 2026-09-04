import { defineBoot } from "#q-app";
import httpClient from "@/services/http";
import { setGlobalLoading } from "@/stores/global";
import { useUserStore } from "@/stores/user";

let isRedirecting = false;

export default defineBoot(({ router }) => {
  httpClient.interceptors.request.use(config => {
    setGlobalLoading(true);
    const token = window.localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  });

  httpClient.interceptors.response.use(
    response => {
      setGlobalLoading(false);

      return response;
    },
    error => {
      const status = error?.response?.status ?? error?.request?.status;

      if (status === 0 || status === 500) {
        setGlobalLoading(false);
        return Promise.reject(new Error(error.message));
      }

      if (status === 401) {
        setGlobalLoading(false);
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

      setGlobalLoading(false);

      return Promise.reject(error);
    }
  );
});
