<template>
  <div class="app-registrations">
    <div class="row items-center justify-between q-mb-md q-gutter-y-sm">
      <div>
        <h1 class="app-registrations__title">{{ title }}</h1>
        <p class="app-registrations__subtitle">Cadastros da clínica</p>
      </div>
      <slot name="header-actions" />
    </div>

    <div class="app-registrations__panel">
      <div v-if="hasError" class="column items-center justify-center q-py-xl">
        <i class="fa-solid fa-triangle-exclamation text-h4 text-red-300"></i>
        <p class="text-caption text-grey-6 q-mt-sm">
          Erro ao carregar os dados. Tente novamente.
        </p>
      </div>
      <div
        v-else-if="items.length === 0 && !isLoading"
        class="column items-center justify-center q-py-xl"
      >
        <i
          :class="icon ?? 'fa-regular fa-folder-open'"
          class="text-h4 text-grey-4"
        ></i>
        <p class="text-caption text-grey-6 q-mt-sm">
          {{ emptyMessage ?? "Nenhum registro encontrado." }}
        </p>
      </div>
      <AppTable
        v-else
        ref="tableRef"
        :rows="items"
        :columns="columns"
        :loading="isLoading"
      >
        <template v-for="(_, name) in $slots" :key="name" #[name]="slotProps">
          <slot :name="name" v-bind="slotProps ?? {}" />
        </template>
      </AppTable>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import type { QTableColumn } from "quasar";
import AppTable from "@/components/tables/AppTable.vue";

defineOptions({ name: "RegistrationsList" });

const props = defineProps<{
  title: string;
  icon?: string;
  columns: QTableColumn[];
  emptyMessage?: string;
  fetchData: (params: {
    page: number;
    limit: number;
  }) => Promise<Record<string, unknown>[]>;
}>();

const tableRef = ref<InstanceType<typeof AppTable> | null>(null);
const isLoading = ref(true);
const hasError = ref(false);
const items = ref<Record<string, unknown>[]>([]);

async function reload() {
  isLoading.value = true;
  hasError.value = false;
  try {
    const data = await props.fetchData({ page: 1, limit: 100 });
    items.value = data ?? [];
  } catch {
    hasError.value = true;
  } finally {
    isLoading.value = false;
  }
}

onMounted(() => {
  void reload();
});

defineExpose({ reload });
</script>

<style scoped lang="scss">
.app-registrations {
  max-width: 80rem;
  margin: 0 auto;
}

.app-registrations__title {
  margin: 0;
  font-size: clamp(1.5rem, 3vw, 2rem);
  font-weight: 700;
  letter-spacing: -0.025em;
  color: #111827;
}

.app-registrations__subtitle {
  margin: 4px 0 0;
  font-size: 0.875rem;
  color: #6b7280;
}

.app-registrations__panel {
  padding: 8px;
  background: #fff;
  border-radius: 12px;
  outline: 1px solid #f3f4f6;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);

  @media (min-width: 640px) {
    padding: 16px;
  }
}
</style>
