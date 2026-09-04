import { defineStore } from "pinia";
import { reactive } from "vue";

export type CurrentUser = {
  name?: string;
  apiKey?: string;
  [key: string]: unknown;
};

function readStoredUser(): CurrentUser {
  try {
    const raw = window.localStorage.getItem("user");
    return raw ? (JSON.parse(raw) as CurrentUser) : {};
  } catch {
    return {};
  }
}

export const useUserStore = defineStore("user", () => {
  const state = reactive<{ currentUser: CurrentUser }>({
    currentUser: readStoredUser()
  });

  const cleanCurrentUser = () => {
    state.currentUser = {};
    window.localStorage.removeItem("token");
    window.localStorage.removeItem("user");
  };

  const setCurrentUser = (user: CurrentUser) => {
    state.currentUser = user;
    window.localStorage.setItem("user", JSON.stringify(user));
  };

  const setApiKey = (apiKey: string) => {
    const currentUser = { ...state.currentUser, apiKey };
    state.currentUser = currentUser;
    window.localStorage.setItem("user", JSON.stringify(currentUser));
  };

  return { state, cleanCurrentUser, setCurrentUser, setApiKey };
});
