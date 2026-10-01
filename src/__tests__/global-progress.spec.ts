import { beforeEach, describe, expect, it, vi } from "vitest";

type GlobalApi = typeof import("@/stores/global");

async function loadStore() {
  vi.resetModules();

  return (await import("@/stores/global")) as GlobalApi;
}

const KB = 1024;

describe("stores/global — progresso por bytes", () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  it("conta os bytes de uma requisição isolada", async () => {
    const store = await loadStore();
    const { progress } = store.useGlobalLoading();

    const id = store.startRequest();
    expect(progress.value).toBe(0);

    store.reportBytes(id, 250, 1000);
    expect(progress.value).toBe(0.25);

    store.reportBytes(id, 1000, 1000);
    expect(progress.value).toBe(0.95);

    store.stopRequest(id);
    // 100% só é verdade quando não sobrou requisição nenhuma
    expect(progress.value).toBe(1);
  });

  it("soma requisições concorrentes ponderadas pelo total de cada uma", async () => {
    const store = await loadStore();
    const { progress } = store.useGlobalLoading();

    // 90KB e 10KB: a de 10KB concluída sozinha move a barra só 10%.
    const grande = store.startRequest();
    const pequeno = store.startRequest();

    store.reportBytes(grande, 0, 90 * KB);
    store.reportBytes(pequeno, 10 * KB, 10 * KB);
    store.stopRequest(pequeno);
    expect(progress.value).toBeCloseTo(0.1);

    store.reportBytes(grande, 45 * KB, 90 * KB);
    expect(progress.value).toBeCloseTo(0.55);

    store.reportBytes(grande, 90 * KB, 90 * KB);
    store.stopRequest(grande);
    expect(progress.value).toBe(1);
  });

  it("a barra não anda para trás quando uma requisição entra no meio", async () => {
    const store = await loadStore();
    const { progress } = store.useGlobalLoading();

    // Uma requisição grande já com quase tudo recebido: 90%.
    const primeira = store.startRequest();
    store.reportBytes(primeira, 900, 1000);
    expect(progress.value).toBeCloseTo(0.9);

    // Agora entra outra, de 1MB. O denominador vai de 1000 para 1001000, então
    // a razão crua despenca para ~0.1%: sem o piso monotônico a barra voltaria
    // para o começo, que é o bug clássico deste padrão.
    const tardia = store.startRequest();
    store.reportBytes(tardia, 0, 1000 * KB);
    expect(progress.value).toBeCloseTo(0.9);

    // O piso segura a barra até a razão real alcançar o nível em que ela está.
    // Esse é o trade-off conhecido do padrão: uma requisição grande que chega
    // tarde deixa a barra parada até cobrir o que já tinha sido prometido.
    store.reportBytes(tardia, 500 * KB, 1000 * KB);
    expect(progress.value).toBeCloseTo(0.9);

    store.reportBytes(tardia, 900 * KB, 1000 * KB);
    expect(progress.value).toBeCloseTo(0.9);

    store.stopRequest(tardia);
    store.stopRequest(primeira);
    expect(progress.value).toBe(1);
  });

  it("nunca afirma 100% enquanto houver requisição em voo", async () => {
    const store = await loadStore();
    const { progress } = store.useGlobalLoading();

    const id = store.startRequest();
    store.reportBytes(id, 1000, 1000);
    expect(progress.value).toBeLessThan(1);

    // so com outra requisição pendente
    store.stopRequest(id);
    expect(progress.value).toBe(1);
  });

  it("total desconhecido não inventa denominador e pesa ao terminar", async () => {
    const store = await loadStore();
    const { progress } = store.useGlobalLoading();

    // Resposta sem Content-Length: `total` chega undefined.
    const semHeader = store.startRequest();
    store.reportBytes(semHeader, 4000, undefined);
    // Sem total conhecido não há como calcular fração: barra não se move.
    expect(progress.value).toBe(0);

    // Uma requisição com total conhecido segue independentemente.
    const comHeader = store.startRequest();
    store.reportBytes(comHeader, 500, 1000);
    expect(progress.value).toBeCloseTo(0.5);

    // A que não tinha header termina: agora sim, 100%.
    store.stopRequest(semHeader);
    store.stopRequest(comHeader);
    expect(progress.value).toBe(1);
  });

  it("recupera de um id perdido em vez de vazar o contador", async () => {
    vi.useFakeTimers();
    const store = await loadStore();
    const { isLoading, progress } = store.useGlobalLoading();

    const id = store.startRequest();
    store.reportBytes(id, 500, 1000);

    // Erro que chegou sem `config` utilizável: o id não pôde ser recuperado.
    // Se o store não se virar, `requests` fica em 1 para sempre e a barra
    // não volta mais a sumir.
    store.stopRequest(undefined);
    expect(progress.value).toBe(1);

    vi.advanceTimersByTime(store.MIN_DISPLAY_MS);
    expect(isLoading.value).toBe(false);
  });

  it("não vaza com um id que nunca foi registrado", async () => {
    const store = await loadStore();
    const { progress } = store.useGlobalLoading();

    const id = store.startRequest();
    // Nenhum transfer com esse id: o descarte recai na requisição em voo.
    store.stopRequest(999);

    // O que importa é que a fila chega a zero (100% é setado só nesse
    // momento) e a requisição real não destraça o contador.
    store.stopRequest(id);
    expect(progress.value).toBe(1);
  });

  it("mantém no registro os bytes de uma requisição que terminou cedo", async () => {
    const store = await loadStore();
    const { progress } = store.useGlobalLoading();

    const primeira = store.startRequest();
    const segunda = store.startRequest();

    // Os dois `total` chegam com os headers, antes de qualquer corpo: é o que
    // acontece com XHRs paralelos de verdade, e é o que permite conhecer a
    // fração da operação inteira.
    store.reportBytes(primeira, 0, 10 * KB);
    store.reportBytes(segunda, 0, 90 * KB);

    // A menor termina primeiro. Se os 10KB dela sumissem do total, 45/90
    // pareceria 50% em vez de 55%.
    store.reportBytes(primeira, 10 * KB, 10 * KB);
    store.stopRequest(primeira);
    expect(progress.value).toBeCloseTo(0.1);

    store.reportBytes(segunda, 45 * KB, 90 * KB);
    expect(progress.value).toBeCloseTo(0.55);

    store.stopRequest(segunda);
    expect(progress.value).toBe(1);
  });

  it("ignora bytes de requisições já encerradas", async () => {
    const store = await loadStore();
    const { progress } = store.useGlobalLoading();

    const id = store.startRequest();
    store.reportBytes(id, 500, 1000);
    expect(progress.value).toBeCloseTo(0.5);

    store.stopRequest(id);
    store.reportBytes(id, 999, 1000);
    // Não deve recontar para uma transferência que já saiu da fila.
    expect(progress.value).toBe(1);
  });

  it("a barra reinicia em 0 a cada novo carregamento", async () => {
    const store = await loadStore();
    const { progress, isLoading } = store.useGlobalLoading();
    vi.useFakeTimers();

    const primeira = store.startRequest();
    store.reportBytes(primeira, 1000, 1000);
    store.stopRequest(primeira);
    expect(progress.value).toBe(1);

    vi.advanceTimersByTime(store.MIN_DISPLAY_MS);
    expect(isLoading.value).toBe(false);

    const segunda = store.startRequest();
    expect(progress.value).toBe(0);

    store.reportBytes(segunda, 100, 1000);
    expect(progress.value).toBeCloseTo(0.1);

    store.stopRequest(segunda);
  });

  it("o tempo mínimo de exibição continua valendo com progresso", async () => {
    const store = await loadStore();
    const { isLoading, progress } = store.useGlobalLoading();
    vi.useFakeTimers();

    const id = store.startRequest();
    store.reportBytes(id, 1000, 1000);
    store.stopRequest(id);
    expect(progress.value).toBe(1);
    expect(isLoading.value).toBe(true);

    // Ainda visível logo depois de completar (o tempo mínimo do store).
    vi.advanceTimersByTime(100);
    expect(isLoading.value).toBe(true);

    vi.advanceTimersByTime(store.MIN_DISPLAY_MS);
    expect(isLoading.value).toBe(false);
  });
});
