<template>
  <AppLayout title="Cadastros">
    <RegistrationsList
      ref="registrationsList"
      title="Médicos / Profissionais"
      icon="fa-solid fa-user-doctor"
      :columns="columns"
      empty-message="Nenhum profissional cadastrado."
      :fetch-data="services.professionals.getAll"
    >
      <template #header-actions>
        <q-btn
          unelevated
          no-caps
          icon="fa-solid fa-plus"
          label="Novo Profissional"
          class="app-btn-primary"
          @click="createProfessional()"
        />
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
            @click="editProfessional(cellProps.row)"
          />
          <q-btn
            flat
            round
            dense
            size="sm"
            icon="fa-solid fa-trash"
            color="negative"
            @click="deleteProfessional(cellProps.row)"
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
import ModalProfessionalEdit from "@/components/modals/ModalProfessionalEdit.vue";
import { confirmDelete } from "@/utils/confirm";
import services from "@/services";
import toasty from "@/utils/toast";

defineOptions({ name: "RegistrationsProfessionalsPage" });

const $q = useQuasar();

const registrationsList = ref<InstanceType<typeof RegistrationsList> | null>(
  null
);

const columns: QTableColumn[] = [
  { name: "name", label: "Nome", field: "name", align: "left" },
  { name: "document", label: "Documento", field: "document", align: "left" },
  {
    name: "specialty",
    label: "Especialidade",
    field: "specialty",
    align: "left"
  },
  { name: "phone", label: "Telefone", field: "phone", align: "left" },
  { name: "email", label: "E-mail", field: "email", align: "left" },
  { name: "actions", label: "", field: "actions", align: "right" }
];

function refresh() {
  void registrationsList.value?.reload();
}

function openModal(props: Record<string, unknown>) {
  $q.dialog({
    component: ModalProfessionalEdit,
    componentProps: props
  }).onOk(refresh);
}

function createProfessional() {
  openModal({ title: "Novo Profissional" });
}

function editProfessional(data: Record<string, unknown>) {
  openModal({
    title: "Editar Profissional",
    professional_id: data.id as string
  });
}

async function deleteProfessional(data: Record<string, unknown>) {
  const confirmed = await confirmDelete(
    `Excluir o profissional "${String(data.name ?? "")}"?`
  );
  if (!confirmed) return;

  try {
    await services.professionals.destroy(String(data.id));
    toasty.successToasty({
      title: "Profissional excluído com sucesso!",
      msg: "Sucesso"
    });
    refresh();
  } catch (err) {
    toasty.errorToasty(
      { title: "Erro ao excluir profissional", msg: "Erro" },
      err
    );
  }
}
</script>
