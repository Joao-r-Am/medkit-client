<template>
  <AppLayout title="Cadastros">
    <RegistrationsList
      ref="registrationsList"
      title="Procedimentos"
      icon="fa-solid fa-syringe"
      :columns="columns"
      empty-message="Nenhum procedimento cadastrado."
      :fetch-data="services.procedures.getAll"
    >
      <template #header-actions>
        <q-btn
          unelevated
          no-caps
          icon="fa-solid fa-plus"
          label="Novo Procedimento"
          class="app-btn-primary"
          @click="createProcedure()"
        />
      </template>

      <template #body-cell-duration_minutes="cellProps">
        <q-td :props="cellProps">
          {{ cellProps.row.duration_minutes ?? "-" }}
        </q-td>
      </template>

      <template #body-cell-actions="cellProps">
        <q-td :props="cellProps" class="text-right">
          <q-btn
            flat
            round
            dense
            size="sm"
            icon="fa-solid fa-pen"
            class="text-grey-6"
            @click="editProcedure(cellProps.row)"
          />
          <q-btn
            flat
            round
            dense
            size="sm"
            icon="fa-solid fa-trash"
            color="negative"
            @click="deleteProcedure(cellProps.row)"
          />
        </q-td>
      </template>
    </RegistrationsList>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useQuasar } from "quasar";
import type { QTableColumn } from "quasar";
import AppLayout from "@/components/layout/AppLayout.vue";
import RegistrationsList from "@/components/registrations/RegistrationsList.vue";
import ModalProcedureEdit from "@/components/modals/ModalProcedureEdit.vue";
import { confirmDelete } from "@/utils/confirm";
import services from "@/services";
import toasty from "@/utils/toast";

defineOptions({ name: "RegistrationsProceduresPage" });

const $q = useQuasar();

const registrationsList = ref<InstanceType<typeof RegistrationsList> | null>(
  null
);

const columns: QTableColumn[] = [
  { name: "name", label: "Nome", field: "name", align: "left" },
  {
    name: "description",
    label: "Descrição",
    field: row => row.description ?? "-",
    align: "left"
  },
  {
    name: "duration_minutes",
    label: "Duração (min)",
    field: "duration_minutes",
    align: "left"
  },
  { name: "actions", label: "", field: "actions", align: "right" }
];

function refresh() {
  void registrationsList.value?.reload();
}

function openModal(props: Record<string, unknown>) {
  $q.dialog({
    component: ModalProcedureEdit,
    componentProps: props
  }).onOk(refresh);
}

function createProcedure() {
  openModal({ title: "Novo Procedimento" });
}

function editProcedure(data: Record<string, unknown>) {
  openModal({
    title: "Editar Procedimento",
    procedure_id: data.id as string
  });
}

async function deleteProcedure(data: Record<string, unknown>) {
  const confirmed = await confirmDelete(
    `Excluir o procedimento "${String(data.name ?? "")}"?`
  );
  if (!confirmed) return;

  try {
    await services.procedures.destroy(String(data.id));
    toasty.successToasty({
      title: "Procedimento excluído com sucesso!",
      msg: "Sucesso"
    });
    refresh();
  } catch (err) {
    toasty.errorToasty(
      { title: "Erro ao excluir procedimento", msg: "Erro" },
      err
    );
  }
}
</script>
