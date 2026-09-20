<template>
  <AppLayout title="Pacientes">
    <div class="app-page-content col flex column">
      <div class="row items-center justify-between q-mb-md q-gutter-y-sm">
        <div>
          <h1 class="app-page-content__title">Pacientes</h1>
          <p class="app-page-content__subtitle">
            Gerencie os pacientes cadastrados no sistema
          </p>
        </div>
        <q-btn
          unelevated
          no-caps
          icon="fa-solid fa-plus"
          label="Criar Paciente"
          class="app-btn-primary"
          @click="createUser()"
        />
      </div>

      <AppTable
        class="col"
        :rows="state.patients"
        :columns="patientColumns"
        :loading="state.isLoading"
        :pagination="{
          sortBy: null,
          descending: false,
          page: 1,
          rowsPerPage: 20
        }"
      >
        <template #body-cell-birthDate="cellProps">
          <q-td :props="cellProps">
            {{ formatDate(cellProps.row.birthDate) }}
          </q-td>
        </template>

        <template #body-cell-observations="cellProps">
          <q-td :props="cellProps">
            {{
              cellProps.row.observations &&
              cellProps.row.observations.length > 40
                ? `${cellProps.row.observations.slice(0, 40)}...`
                : (cellProps.row.observations ?? "-")
            }}
          </q-td>
        </template>

        <template #body-cell-actions="cellProps">
          <q-td :props="cellProps" class="text-right">
            <q-btn
              flat
              round
              dense
              size="sm"
              icon="fa-solid fa-eye"
              class="text-grey-6 app-action"
              @click="viewPatient(cellProps.row)"
            />
            <q-btn
              flat
              round
              dense
              size="sm"
              icon="fa-solid fa-trash"
              color="negative"
              @click="deletePatient(cellProps.row)"
            />
          </q-td>
        </template>
      </AppTable>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { onMounted, reactive } from "vue";
import { useQuasar } from "quasar";
import type { QTableColumn } from "quasar";
import AppLayout from "@/components/layout/AppLayout.vue";
import AppTable from "@/components/tables/AppTable.vue";
import ModalUserEdit from "@/components/modals/ModalUserEdit.vue";
import { confirmDelete } from "@/utils/confirm";
import { formatDate } from "@/utils/date";
import services from "@/services";
import toasty from "@/utils/toast";

defineOptions({ name: "PatientsPage" });

const $q = useQuasar();

const state = reactive({
  isLoading: true,
  patients: [] as Record<string, unknown>[]
});

const patientColumns: QTableColumn[] = [
  { name: "name", label: "Nome", field: "name", align: "left" },
  { name: "email", label: "Email", field: "email", align: "left" },
  { name: "document", label: "CPF/CNPJ", field: "document", align: "left" },
  { name: "phone", label: "Phone", field: "phone", align: "left" },
  { name: "birthDate", label: "Nascimento", field: "birthDate", align: "left" },
  { name: "actions", label: "", field: "actions", align: "right" }
];

function openPatientModal(props: Record<string, unknown>) {
  $q.dialog({
    component: ModalUserEdit,
    componentProps: props
  }).onOk(() => {
    void fetchPatients();
  });
}

function createUser() {
  openPatientModal({ title: "Cadastro de Clientes" });
}

function viewPatient(data: Record<string, unknown>) {
  openPatientModal({
    patient_id: data.id as string,
    title: "Editar Paciente"
  });
}

async function deletePatient(data: Record<string, unknown>) {
  const confirmed = await confirmDelete(
    `Excluir o paciente "${String(data.name ?? "")}"?`
  );
  if (!confirmed) return;

  try {
    await services.patients.destroy(String(data.id));
    toasty.successToasty({
      title: "Paciente excluído com sucesso!",
      msg: "Sucesso"
    });
    await fetchPatients();
  } catch (err) {
    toasty.errorToasty({ title: "Erro ao excluir paciente", msg: "Erro" }, err);
  }
}

async function fetchPatients() {
  try {
    state.isLoading = true;
    state.patients = await services.patients.getAll({ limit: 20, offset: 0 });
  } finally {
    state.isLoading = false;
  }
}

onMounted(() => {
  void fetchPatients();
});
</script>
