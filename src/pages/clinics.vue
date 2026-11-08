<template>
  <AppLayout title="Clínicas">
    <div class="app-clinics col overflow-auto">
      <div class="row items-center justify-between q-mb-md">
        <div>
          <h1 class="text-h5 text-weight-bolder text-grey-8"
            >Minhas clínicas</h1
          >
          <p class="text-body2 text-grey-7">
            Clínicas nas quais você tem vínculo ativo
          </p>
        </div>
        <q-btn
          unelevated
          no-caps
          color="primary"
          icon="add_business"
          label="Criar clínica"
          data-test="open-create-clinic"
          @click="createDialogOpen = true"
        />
      </div>

      <ClinicMembershipList @create="createDialogOpen = true" />

      <CreateClinicDialog
        v-model="createDialogOpen"
        @created="onClinicCreated"
      />
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import AppLayout from "@/components/layout/AppLayout.vue";
import ClinicMembershipList from "@/components/clinics/ClinicMembershipList.vue";
import CreateClinicDialog from "@/components/clinics/CreateClinicDialog.vue";
import { useClinicStore } from "@/stores/clinic";

defineOptions({ name: "ClinicsPage" });

const router = useRouter();
const clinicStore = useClinicStore();

const createDialogOpen = ref(false);

/** A store já seleciona a clínica recém-criada; vai direto para a Home. */
async function onClinicCreated(): Promise<void> {
  void clinicStore.fetchMyClinics(true);
  await router.push("/");
}
</script>
