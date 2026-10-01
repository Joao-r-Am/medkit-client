<template>
  <div class="app-skeleton-table">
    <div class="app-skeleton-table__header">
      <div
        v-for="col in columns"
        :key="col.name"
        class="app-skeleton-table__cell"
      >
        <q-skeleton dark type="text" width="70%" height="11px" />
      </div>
    </div>

    <div class="app-skeleton-table__body">
      <div v-for="row in rows" :key="row" class="app-skeleton-table__row">
        <div
          v-for="(col, i) in columns"
          :key="col.name"
          class="app-skeleton-table__cell"
        >
          <q-skeleton type="text" :width="cellWidth(row, i)" height="12px" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { QTableColumn } from "quasar";

defineOptions({ name: "AppSkeletonTable" });

withDefaults(
  defineProps<{
    columns: QTableColumn[];
    rows?: number;
  }>(),
  { rows: 6 }
);

/*
 * Espelha o visual da AppTable: header escuro (var(--app-dark)) + linhas na
 * moldura branca, com as mesmas constantes de raio/sombra. As larguras das
 * células vêm de um ciclo fixo — nada de aleatoriedade, para o mesmo estado
 * montar sempre igual entre renders.
 */
const WIDTHS = ["72%", "55%", "80%", "48%", "64%", "36%"];

function cellWidth(row: number, column: number) {
  return WIDTHS[(row + column) % WIDTHS.length];
}
</script>

<style scoped lang="scss">
.app-skeleton-table {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(42, 26, 26, 0.06);
}

.app-skeleton-table__header {
  display: flex;
  gap: 12px;
  padding: 10px 12px;
  background: var(--app-dark);
}

.app-skeleton-table__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.app-skeleton-table__row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-bottom: 1px solid #f5f5f5;
}

.app-skeleton-table__cell {
  flex: 1;
  min-width: 0;
}
</style>
