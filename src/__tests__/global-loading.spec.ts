import { beforeEach, describe, expect, it, vi } from "vitest";

type GlobalApi = typeof import("@/stores/global");

async function loadStore() {
  vi.resetModules();

  return (await import("@/stores/global")) as GlobalApi;
}

/*
 * Aqui é testada a LÓGICA da barra: contagem e tempos. O progresso por bytes
 * tem suíte própria em global-progress.spec.ts.
 */
describe("stores/global — contagem e tempos", () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  it("acende na hora: não há delay de exibição", async () => {
    const store = await loadStore();
    const { isLoading } = store.useGlobalLoading();

    const id = store.startRequest();
    expect(isLoading.value).toBe(true);

    store.stopRequest(id);
  });

  it("mantém a barra visível enquanto houver requisição concorrente", async () => {
    const store = await loadStore();
    const { isLoading } = store.useGlobalLoading();

    const a = store.startRequest();
    const b = store.startRequest();
    const c = store.startRequest();

    store.stopRequest(a);
    // as duas restantes continuam em voo
    expect(isLoading.value).toBe(true);

    store.stopRequest(b);
    store.stopRequest(c);
    expect(isLoading.value).toBe(true); // ainda dentro do tempo mínimo
  });

  it("segura a barra pelo tempo mínimo depois de aparecer", async () => {
    vi.useFakeTimers();
    const store = await loadStore();
    const { isLoading } = store.useGlobalLoading();

    const id = store.startRequest();
    store.stopRequest(id);
    expect(isLoading.value).toBe(true);

    vi.advanceTimersByTime(100);
    expect(isLoading.value).toBe(true);

    vi.advanceTimersByTime(store.MIN_DISPLAY_MS);
    expect(isLoading.value).toBe(false);
  });

  it("uma requisição que chega durante o tempo mínimo estende a exibição", async () => {
    vi.useFakeTimers();
    const store = await loadStore();
    const { isLoading } = store.useGlobalLoading();

    const primeira = store.startRequest();
    store.stopRequest(primeira);

    // Nova requisição antes de o hide da anterior completar.
    const segunda = store.startRequest();
    vi.advanceTimersByTime(100);
    expect(isLoading.value).toBe(true);

    store.stopRequest(segunda);
    vi.advanceTimersByTime(store.MIN_DISPLAY_MS);
    expect(isLoading.value).toBe(false);
  });

  it("id desconhecido descarta a requisição mais antiga em vez de vazar", async () => {
    vi.useFakeTimers();
    const store = await loadStore();
    const { isLoading } = store.useGlobalLoading();

    // Fica em voo sem bytes; a mais antiga é a primeira da fila.
    store.startRequest();
    const recente = store.startRequest();

    // Sem transferência com esse id, o store descarta a mais antiga em voo.
    store.stopRequest(999);
    store.stopRequest(recente);

    // Se o id desconhecido não tivesse descartado a antiga, ainda haveria
    // requisição na fila, o hide nunca seria agendado e a barra continuaria
    // visível depois do tempo mínimo.
    vi.advanceTimersByTime(store.MIN_DISPLAY_MS);
    expect(isLoading.value).toBe(false);
  });
});
