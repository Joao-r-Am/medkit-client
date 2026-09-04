<template>
  <AppLayout title="Cadastros">
    <RegistrationsList
      ref="registrationsList"
      title="Exames"
      icon="fa-solid fa-microscope"
      :columns="columns"
      empty-message="Nenhum exame cadastrado."
      :fetch-data="services.exams.getAll"
    >
      <template #header-actions>
        <q-btn
          unelevated
          no-caps
          icon="fa-solid fa-plus"
          label="Novo Exame"
          class="app-btn-primary"
          @click="createExam()"
        />
      </template>

      <template #body-cell-tags="cellProps">
        <q-td :props="cellProps">
          <q-badge
            v-for="tag in cellProps.row.tags ?? []"
            :key="tag"
            :label="tag"
            outline
            color="grey-7"
            class="q-mr-xs"
          />
          {{
            Array.isArray(cellProps.row.tags) && cellProps.row.tags.length
              ? ""
              : "-"
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
            icon="fa-solid fa-pen"
            class="text-grey-6"
            @click="editExam(cellProps.row)"
          />
          <q-btn
            flat
            round
            dense
            size="sm"
            icon="fa-solid fa-trash"
            color="negative"
            @click="deleteExam(cellProps.row)"
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
import ModalExamEdit from "@/components/modals/ModalExamEdit.vue";
import { confirmDelete } from "@/utils/confirm";
import services from "@/services";
import toasty from "@/utils/toast";

defineOptions({ name: "RegistrationsExamsPage" });

const $q = useQuasar();

const registrationsList = ref<InstanceType<typeof RegistrationsList> | null>(
  null
);

const columns: QTableColumn[] = [
  {
    name: "code",
    label: "Código",
    field: row => row.code ?? "-",
    align: "left"
  },
  { name: "name", label: "Nome", field: "name", align: "left" },
  {
    name: "type",
    label: "Tipo",
    field: row => row.type ?? "-",
    align: "left"
  },
  {
    name: "specialty",
    label: "Especialidade",
    field: row => row.specialty ?? "-",
    align: "left"
  },
  {
    name: "duration_minutes",
    label: "Duração (min)",
    field: row => row.duration_minutes ?? "-",
    align: "left"
  },
  { name: "tags", label: "Tags", field: "tags", align: "left" },
  { name: "actions", label: "", field: "actions", align: "right" }
];

function refresh() {
  void registrationsList.value?.reload();
}

function openModal(props: Record<string, unknown>) {
  $q.dialog({
    component: ModalExamEdit,
    componentProps: props
  }).onOk(refresh);
}

function createExam() {
  openModal({ title: "Novo Exame" });
}

function editExam(data: Record<string, unknown>) {
  openModal({ title: "Editar Exame", exam_id: data.id as string });
}

async function deleteExam(data: Record<string, unknown>) {
  const confirmed = await confirmDelete(
    `Excluir o exame "${String(data.name ?? "")}"?`
  );
  if (!confirmed) return;

  try {
    await services.exams.destroy(String(data.id));
    toasty.successToasty({
      title: "Exame excluído com sucesso!",
      msg: "Sucesso"
    });
    refresh();
  } catch (err) {
    toasty.errorToasty({ title: "Erro ao excluir exame", msg: "Erro" }, err);
  }
}
</script>
