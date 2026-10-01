import { describe, expect, it, vi } from "vitest";

type GlobalApi = typeof import("@/stores/global");

/*
 * Teste de integração do interceptor. `src/boot/axios.ts` é um boot file: o
 * Quasar o executa no startup, então aqui ele é inicializado na mão.
 *
 * Usa a instância real de `@/services/http`, porque é nela que o interceptor é
 * registrado — testar uma instância criada no teste provaria que o axios
 * funciona, não que o app está ligado. E o import precisa acontecer DEPOIS do
 * `vi.resetModules()`: como o módulo mantém estado em memória, importar antes
 * daria uma instância diferente daquela que o boot instrumentou.
 *
 * O que precisa ser provado é a ponte inteira: id por config, `reportBytes` no
 * `onDownloadProgress` e fechamento da mesma requisição. O store já tem suíte
 * própria, e um id trocado entre os dois interceptors passaria despercebido.
 */
type Progress = { loaded: number; total?: number };
type Config = {
  url?: string;
  headers?: Record<string, unknown>;
  onDownloadProgress?: (p: Progress) => void;
};

/**
 * O axios despacha interceptors e adapter em microtask: no mesmo instante em
 * que `get()` retorna, o request ainda não chegou ao adapter. Sem este tick os
 * bytes seriam injetados num mapa ainda vazio e o teste passaria a mentir.
 */
function tick() {
  return new Promise(resolve => setTimeout(resolve, 0));
}

async function boot() {
  vi.resetModules();

  const store = (await import("@/stores/global")) as GlobalApi;
  const { default: httpClient } = await import("@/services/http");
  const module = await import("@/boot/axios");
  const bootFn = module.default as (ctx: unknown) => void;
  bootFn({ router: { push: vi.fn() } });

  return { store, httpClient };
}

/**
 * Adapter que NÃO resolve sozinho: fica pendente até o teste chamar `finish`.
 * Sem isso a requisição terminaria antes de os bytes serem injetados, e o
 * `stopRequest` já teria zerado a transferência.
 */
function stubAdapter(httpClient: { defaults: Record<string, unknown> }) {
  const onProgress = new Map<string, (p: Progress) => void>();
  const finish = new Map<string, () => void>();
  const sentHeaders: Record<string, unknown>[] = [];

  httpClient.defaults.adapter = ((config: Config) => {
    const url = config.url ?? "";
    onProgress.set(url, config.onDownloadProgress as (p: Progress) => void);
    sentHeaders.push((config.headers ?? {}) as Record<string, unknown>);

    return new Promise(resolve => {
      finish.set(url, () =>
        resolve({
          data: {},
          status: 200,
          statusText: "OK",
          headers: {},
          config
        })
      );
    });
  }) as never;

  return { onProgress, finish, sentHeaders };
}

describe("boot/axios — ponte entre o axios e a barra global", () => {
  it("reporta os bytes e fecha a requisição pelo mesmo id", async () => {
    const { store, httpClient } = await boot();
    const { onProgress, finish } = stubAdapter(httpClient);
    const { progress } = store.useGlobalLoading();

    const request = httpClient.get("/qualquer");
    await tick();

    onProgress.get("/qualquer")?.({ loaded: 250, total: 1000 });
    // 990/1000 passaria de 95%: o teto evita anunciar 100% com dado faltando.
    onProgress.get("/qualquer")?.({ loaded: 990, total: 1000 });

    // O progresso real chegou ao store, limitado pelo teto.
    expect(progress.value).toBe(0.95);

    finish.get("/qualquer")?.();
    await request;

    // Fechar a requisição marca 100% e zera a fila (100% só é setado quando
    // `requests` chega a zero, então o progresso prova que nada vazou).
    expect(progress.value).toBe(1);
  });

  it("soma bytes de requisições concorrentes", async () => {
    const { store, httpClient } = await boot();
    const { onProgress, finish } = stubAdapter(httpClient);

    const a = httpClient.get("/a");
    const b = httpClient.get("/b");
    await tick();

    onProgress.get("/a")?.({ loaded: 100, total: 1000 });
    onProgress.get("/b")?.({ loaded: 900, total: 1000 });

    // 1000 de 2000 bytes = metade.
    expect(store.useGlobalLoading().progress.value).toBe(0.5);

    finish.get("/a")?.();
    finish.get("/b")?.();
    await Promise.all([a, b]);
    expect(store.useGlobalLoading().progress.value).toBe(1);
  });

  it("erro também fecha a requisição", async () => {
    const { store, httpClient } = await boot();
    httpClient.defaults.adapter = (() =>
      Promise.reject(new Error("rede"))) as never;

    await expect(httpClient.get("/falha")).rejects.toBeDefined();

    // Sem o `stopRequest` no ramo de erro, o contador ficaria preso e o
    // progresso nunca chegaria a 100% (só setado com a fila zerada).
    expect(store.useGlobalLoading().progress.value).toBe(1);
  });

  it("encadeia um onDownloadProgress já existente na chamada", async () => {
    const { store, httpClient } = await boot();
    const { onProgress, finish } = stubAdapter(httpClient);

    const doService = vi.fn();
    const request = httpClient.get("/x", { onDownloadProgress: doService });
    await tick();

    onProgress.get("/x")?.({ loaded: 500, total: 1000 });

    // O interceptor chama o handler do service em vez de tomar o lugar dele.
    expect(doService).toHaveBeenCalledTimes(1);
    expect(store.useGlobalLoading().progress.value).toBe(0.5);

    finish.get("/x")?.();
    await request;
  });

  it("não manda o id da transferência para a API", async () => {
    const { httpClient } = await boot();
    const { onProgress, finish, sentHeaders } = stubAdapter(httpClient);

    const request = httpClient.get("/sem-header");
    await tick();
    onProgress.get("/sem-header")?.({ loaded: 10, total: 100 });
    finish.get("/sem-header")?.();
    await request;

    // O id vive num WeakMap do config. Num header, estado interno da UI
    // vazaria para o backend à toa.
    expect(sentHeaders).toHaveLength(1);
    expect(
      Object.keys(sentHeaders[0] ?? {}).filter(chave =>
        chave.toLowerCase().includes("loading")
      )
    ).toHaveLength(0);
  });
});
