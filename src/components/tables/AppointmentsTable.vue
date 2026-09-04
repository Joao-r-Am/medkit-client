<template>
  <div>
    <AppTable
      ref="tableRef"
      :rows="appointments"
      :columns="columns"
      :loading="loading"
    >
      <template #body-cell-patient="cellProps">
        <q-td :props="cellProps">
          <p class="app-cell__primary">
            {{ cellProps.row.patient?.name ?? "-" }}
          </p>
          <p class="app-cell__secondary">{{
            cellProps.row.patient?.phone ?? ""
          }}</p>
        </q-td>
      </template>

      <template #body-cell-startTime="cellProps">
        <q-td :props="cellProps" class="text-grey-7">
          {{ formatDate(cellProps.row.startTime) }}
        </q-td>
      </template>

      <template #body-cell-time="cellProps">
        <q-td :props="cellProps" class="text-grey-7">
          {{ formatTime(cellProps.row.startTime)
          }}{{
            cellProps.row.endTime
              ? ` – ${formatTime(cellProps.row.endTime)}`
              : ""
          }}
        </q-td>
      </template>

      <template #body-cell-service="cellProps">
        <q-td :props="cellProps" class="text-grey-7">
          {{ serviceLabel(cellProps.row) }}
        </q-td>
      </template>

      <template #body-cell-status="cellProps">
        <q-td :props="cellProps">
          <span class="app-status" :class="statusClass(cellProps.row.status)">
            {{ statusLabel(cellProps.row.status) }}
          </span>
        </q-td>
      </template>

      <template #body-cell-actions="cellProps">
        <q-td :props="cellProps" class="text-right">
          <q-btn
            flat
            round
            dense
            size="sm"
            icon="fa-regular fa-pen-to-square"
            class="text-grey-6 app-action"
            title="Editar"
            @click="emit('edit', cellProps.row)"
          />
          <q-btn
            flat
            round
            dense
            size="sm"
            icon="fa-regular fa-trash-can"
            class="text-grey-6 app-action app-action--danger"
            title="Excluir"
            @click="emit('remove', cellProps.row)"
          />
        </q-td>
      </template>
    </AppTable>

    <p v-if="!loading" class="text-caption text-grey-5 q-mt-sm">
      Exibindo {{ shownRangeLabel }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import type { QTableColumn } from "quasar";
import AppTable from "@/components/tables/AppTable.vue";
import {
  serviceLabel,
  statusClass,
  statusLabel
} from "@/utils/appointment-utils";
import { formatDate, formatTime } from "@/utils/date";

defineOptions({ name: "AppointmentsTable" });

interface AppointmentsTableProps {
  appointments: Record<string, unknown>[];
  loading?: boolean;
}

const props = withDefaults(defineProps<AppointmentsTableProps>(), {
  loading: false
});

const emit = defineEmits<{
  edit: [appointment: Record<string, unknown>];
  remove: [appointment: Record<string, unknown>];
}>();

const tableRef = ref<InstanceType<typeof AppTable> | null>(null);

const columns: QTableColumn[] = [
  { name: "patient", label: "Paciente", field: "patient", align: "left" },
  {
    name: "professional",
    label: "Profissional",
    field: row => row.professional?.name ?? "-",
    align: "left"
  },
  { name: "startTime", label: "Data", field: "startTime", align: "left" },
  { name: "time", label: "Horário", field: "time", align: "left" },
  {
    name: "service",
    label: "Exame / Procedimento",
    field: "service",
    align: "left"
  },
  { name: "status", label: "Status", field: "status", align: "left" },
  { name: "actions", label: "", field: "actions", align: "right" }
];

const shownRangeLabel = computed(() => {
  const total = props.appointments.length;
  if (total === 0) return "0 agendamentos";

  const pagination = tableRef.value?.pagination;
  const rowsPerPage = pagination?.rowsPerPage ?? 10;
  const page = pagination?.page ?? 1;

  const first = (page - 1) * rowsPerPage;
  const to = Math.min(first + rowsPerPage, total);
  return `${first + 1}–${to} de ${total}`;
});
</script>

<style scoped lang="scss">
.app-cell__primary {
  margin: 0;
  font-weight: 500;
  color: #1f2937;
}

.app-cell__secondary {
  margin: 0;
  font-size: 0.75rem;
  color: #9ca3af;
}

.app-status {
  display: inline-block;
  border-radius: 999px;
  padding: 2px 8px;
  font-size: 0.75rem;
  font-weight: 500;
  white-space: nowrap;
}

.app-action:hover {
  color: var(--app-green) !important;

  &--danger:hover,
  &.app-action--danger:hover {
    color: #dc2626 !important;
  }
}
</style>
