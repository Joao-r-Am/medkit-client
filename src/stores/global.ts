import { ref } from "vue";

const isLoading = ref(false);

export function useGlobalLoading() {
  return { isLoading };
}

export function setGlobalLoading(status: boolean) {
  isLoading.value = status;
}
