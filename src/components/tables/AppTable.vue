<template>
  <div class="app-table-swap">
    <!--
      Raiz única com v-show (não v-if): o q-table não remonta a cada troca de
      loading e preserva scroll/ordenação; a classe que as páginas passam
      (`col app-table-frame`) herda para o wrapper.
    -->
    <AppSkeletonTable v-show="loading" :columns="columns" :rows="6" />
    <q-table
      v-show="!loading"
      v-model:pagination="pagination"
      class="app-table"
      flat
      :rows="rows"
      :columns="columns"
      row-key="id"
      :rows-per-page-options="[10, 25, 50]"
      binary-state-sort
    >
      <template #header="cellProps">
        <q-tr :props="cellProps" class="app-table__header">
          <q-th
            v-for="col in cellProps.cols"
            :key="col.name"
            :props="cellProps"
          >
            {{ col.label }}
          </q-th>
        </q-tr>
      </template>

      <template v-for="(_, name) in $slots" :key="name" #[name]="slotProps">
        <slot :name="name" v-bind="slotProps ?? {}" />
      </template>
    </q-table>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import type { QTableColumn } from "quasar";
import AppSkeletonTable from "@/components/feedback/AppSkeletonTable.vue";

type TablePagination = {
  sortBy: string | null;
  descending: boolean;
  page: number;
  rowsPerPage: number;
};

defineOptions({ name: "AppTable" });

const props = withDefaults(
  defineProps<{
    rows: Record<string, unknown>[];
    columns: QTableColumn[];
    /** Mostra o skeleton no lugar da tabela enquanto o dado carrega. */
    loading?: boolean;
  }>(),
  { loading: false }
);

const pagination = ref<TablePagination>({
  sortBy: null,
  descending: false,
  page: 1,
  rowsPerPage: 10
});

watch(
  () => props.rows,
  () => {
    pagination.value = { ...pagination.value, page: 1 };
  }
);

defineExpose({
  pagination
});
</script>

<style scoped lang="scss">
// Wrapper herda `col app-table-frame` do elemento raiz (fallthrough) e empilha
// skeleton/tabela; `flex: 1` espelha o utilitário `.col` do Quasar.
.app-table-swap {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
}

.app-table {
  margin: 0 !important;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(42, 26, 26, 0.06);

  // Apenas o corpo da tabela rola; header e paginador ficam fixos
  :deep(.q-table__middle) {
    flex: 1;
    min-height: 0;
    overflow: auto;
  }

  :deep(thead th) {
    position: sticky;
    top: 0;
    z-index: 1;
  }

  :deep(.app-table__header) th {
    background: var(--app-dark);
    color: #fff;
    font-weight: 500;
    font-size: 0.8125rem;
    padding: 10px 12px;
  }

  :deep(tbody td) {
    padding: 10px 12px;
    font-size: 0.8125rem;
    color: #1f1f1f;
  }

  :deep(tbody tr) {
    background: #fff;
  }

  :deep(tbody tr:hover) {
    background: var(--app-soft);
  }

  // Paginador no padrão escuro do projeto
  :deep(.q-table__bottom) {
    background: linear-gradient(
      180deg,
      rgba(42, 26, 26, 0.85),
      rgba(55, 35, 35, 0.85)
    );
    color: rgba(255, 255, 255, 0.7);
    min-height: 40px;
    padding: 4px 8px;
    font-size: 0.75rem;

    .q-btn {
      color: rgba(255, 255, 255, 0.7);
      min-width: 28px;
      border-radius: 6px;

      &:hover,
      &.disabled {
        background: rgba(255, 255, 255, 0.12);
        color: #fff;
      }
    }

    .q-table__control {
      color: rgba(255, 255, 255, 0.7);
    }
  }
}
</style>
