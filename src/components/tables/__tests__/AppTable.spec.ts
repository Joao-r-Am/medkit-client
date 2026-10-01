import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import type { QTableColumn } from "quasar";
import AppTable from "@/components/tables/AppTable.vue";

/*
 * O `q-table`/`q-skeleton` não resolvem neste ambiente (o setup mocka o
 * módulo `quasar`), então viram elementos nativos. O que se testa aqui é a
 * alternância skeleton ↔ tabela e a herança da classe da página para a raiz.
 */
const columns: QTableColumn[] = [
  { name: "name", label: "Nome", field: "name", align: "left" },
  { name: "actions", label: "", field: "actions", align: "right" }
];

function mountTable(loading: boolean) {
  return mount(AppTable, {
    attrs: { class: "col app-table-frame" },
    props: { rows: [], columns, loading }
  });
}

describe("AppTable — skeleton de carregamento", () => {
  it("com loading mostra o skeleton no lugar da tabela", () => {
    const wrapper = mountTable(true);

    const skeleton = wrapper.find(".app-skeleton-table");
    expect(skeleton.exists()).toBe(true);
    expect(skeleton.attributes("style") ?? "").not.toContain("display: none");
    // 6 linhas padrão, uma por coluna no header — espelha a AppTable real.
    expect(wrapper.findAll(".app-skeleton-table__row")).toHaveLength(6);
    expect(
      wrapper.findAll(".app-skeleton-table__header .app-skeleton-table__cell")
    ).toHaveLength(2);

    const table = wrapper.find("q-table");
    expect(table.exists()).toBe(true);
    expect(table.attributes("style")).toContain("display: none");

    wrapper.unmount();
  });

  it("sem loading revela a tabela e esconde o skeleton", () => {
    const wrapper = mountTable(false);

    expect(wrapper.find(".app-skeleton-table").attributes("style")).toContain(
      "display: none"
    );
    expect(wrapper.find("q-table").attributes("style") ?? "").not.toContain(
      "display: none"
    );

    wrapper.unmount();
  });

  it("a classe da página (col app-table-frame) chega na raiz", () => {
    const wrapper = mountTable(true);

    expect(wrapper.classes()).toContain("app-table-swap");
    expect(wrapper.classes()).toContain("col");
    expect(wrapper.classes()).toContain("app-table-frame");

    wrapper.unmount();
  });
});
