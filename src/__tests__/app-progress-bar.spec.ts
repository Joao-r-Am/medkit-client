import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import { nextTick } from "vue";

/*
 * Dois detalhes deste arquivo:
 *
 * 1. O `q-linear-progress` não é resolvido neste ambiente (o setup mocka o
 *    módulo `quasar` e não registra componentes), então ele vira um elemento
 *    nativo e a classe que o Quasar adicionaria não existe no HTML. O seletor
 *    aqui é sempre `.app-progress-bar`, classe que o próprio componente define.
 *
 * 2. O store é um módulo com estado de nível de arquivo (ref + timers), então
 *    `vi.resetModules()` é obrigatório: sem ele, uma requisição aberta por um
 *    teste anterior continua segurando a barra no teste seguinte. O componente
 *    também é importado depois do reset, senão ficaria ligado à instância
 *    antiga do store.
 */
async function mountBar() {
  vi.resetModules();

  const store = await import("@/stores/global");
  const { default: AppProgressBar } =
    await import("@/components/feedback/AppProgressBar.vue");
  const wrapper = mount(AppProgressBar, { attachTo: document.body });

  return { store, wrapper };
}

const flush = () => nextTick();

describe("AppProgressBar — render e progresso", () => {
  it("não renderiza nada enquanto isLoading é false", async () => {
    const { wrapper } = await mountBar();

    expect(wrapper.find(".app-progress-bar").exists()).toBe(false);

    wrapper.unmount();
  });

  it("é determinada: sem indeterminate e com value vindo do store", async () => {
    const { store, wrapper } = await mountBar();

    const id = store.startRequest();
    store.reportBytes(id, 300, 1000);
    await flush();

    const bar = wrapper.find(".app-progress-bar");
    expect(bar.exists()).toBe(true);
    // Com bytes em voo o modo é determinado: o sweep (indeterminate) só vale
    // enquanto `progress === 0`, antes do primeiro byte — ver o teste abaixo.
    // O valor é a string "false" porque o elemento não resolvido recebe a
    // prop booleana como atributo literal (detalhe 1 do cabeçalho do arquivo).
    expect(bar.attributes("indeterminate")).toBe("false");
    // `value` é a prop 0..1 do modo determinado. Como o componente real do
    // Quasar não resolve neste ambiente, é o atributo que prova que o store
    // chegou até ele (o `width` do modelo é gerado dentro do Quasar).
    expect(bar.attributes("value")).toBe("0.3");

    wrapper.unmount();
  });

  it("mantém os 3px, a cor da marca e o track transparente", async () => {
    const { store, wrapper } = await mountBar();

    const id = store.startRequest();
    await flush();

    const bar = wrapper.find(".app-progress-bar");
    expect(bar.attributes("size")).toBe("3px");
    expect(bar.attributes("color")).toBe("primary");
    expect(bar.attributes("track-color")).toBe("transparent");

    store.stopRequest(id);
    wrapper.unmount();
  });

  it("cresce conforme chegam os bytes e completa em 100%", async () => {
    const { store, wrapper } = await mountBar();

    const id = store.startRequest();

    const esperadoEm: [number, string][] = [
      [0, "0"],
      [250, "0.25"],
      [500, "0.5"],
      [900, "0.9"]
    ];

    for (const [loaded, esperado] of esperadoEm) {
      store.reportBytes(id, loaded, 1000);
      await flush();
      expect(wrapper.find(".app-progress-bar").attributes("value")).toBe(
        esperado
      );
    }

    store.stopRequest(id);
    await flush();
    expect(wrapper.find(".app-progress-bar").attributes("value")).toBe("1");

    wrapper.unmount();
  });

  it("acende sem bytes recebidos e some depois do tempo mínimo", async () => {
    vi.useFakeTimers();
    const { store, wrapper } = await mountBar();

    // Requisição que responde sem corpo (cache local): nenhum byte é
    // reportado, a barra ainda assim acende de imediato — e como nenhum
    // byte chegou, em modo indeterminate (sweep) para não ficar invisível
    // com `value 0` de largura zero.
    const id = store.startRequest();
    await flush();
    expect(wrapper.find(".app-progress-bar").exists()).toBe(true);
    expect(wrapper.find(".app-progress-bar").attributes("value")).toBe("0");
    expect(wrapper.find(".app-progress-bar").attributes("indeterminate")).toBe(
      "true"
    );

    store.stopRequest(id);
    vi.advanceTimersByTime(store.MIN_DISPLAY_MS);
    await flush();
    expect(wrapper.find(".app-progress-bar").exists()).toBe(false);

    wrapper.unmount();
  });

  it("a barra some quando o carregamento termina", async () => {
    vi.useFakeTimers();
    const { store, wrapper } = await mountBar();

    const id = store.startRequest();
    store.reportBytes(id, 1000, 1000);
    store.stopRequest(id);

    await flush();
    expect(wrapper.find(".app-progress-bar").exists()).toBe(true);

    vi.advanceTimersByTime(store.MIN_DISPLAY_MS);
    await flush();
    expect(wrapper.find(".app-progress-bar").exists()).toBe(false);

    wrapper.unmount();
  });
});
