import { useRouter } from "vue-router";
import { prefetchRoute } from "@/services/queries";

/*
 * Navegação imediata com prefetch em background.
 *
 * O clique troca a tela na hora — a página de destino monta com seu skeleton
 * e a barra do topo (src/stores/global.ts) acompanha o carregamento, já que o
 * prefetch dispara as requisições ANTES do `router.push` e o interceptor do
 * axios acende a barra no clique.
 *
 * O prefetch não é aguardado: ele só aquece o cache de `services/queries.ts`
 * (TTL 30s, dedupe de promises simultâneas). Quando a página monta e chama o
 * mesmo `loadX`, cai no cache compartilhado e não refaz a request. Se o
 * prefetch falhar, o erro é silenciado aqui e tratado pela própria página no
 * `onMounted` (que mostra o estado de erro com retry).
 */
export function useNavigate() {
  const router = useRouter();

  function navigate(path: string) {
    if (router.currentRoute.value.path === path) return;

    void prefetchRoute(path).catch(() => undefined);
    void router.push(path);
  }

  return { navigate };
}
