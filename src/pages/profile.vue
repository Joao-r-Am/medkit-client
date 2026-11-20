<template>
  <AppLayout title="Perfil">
    <div class="app-profile col overflow-auto">
      <div class="q-mb-md">
        <h1 class="text-h5 text-weight-bolder text-grey-8 q-my-none">
          Meu perfil
        </h1>
        <p class="text-body2 text-grey-7"> Sua conta e suas clínicas </p>
      </div>

      <q-card flat bordered class="q-pa-md">
        <q-tabs
          v-model="activeTab"
          no-caps
          align="left"
          active-color="primary"
          indicator-color="primary"
          class="text-grey-8"
          data-test="profile-tabs"
        >
          <q-tab name="account" label="Perfil" />
          <q-tab name="clinics" label="Clínicas" />
        </q-tabs>

        <q-separator />

        <q-tab-panels
          v-model="activeTab"
          animated
          class="bg-transparent q-pt-md"
        >
          <q-tab-panel name="account" class="q-pa-sm">
            <div class="column q-gutter-sm">
              <div class="row items-center q-gutter-md">
                <q-avatar
                  size="56px"
                  color="primary"
                  text-color="white"
                  icon="person"
                />
                <div class="column">
                  <span class="text-h6 text-weight-bolder text-grey-8">
                    {{ userName }}
                  </span>
                  <span v-if="userEmail" class="text-body2 text-grey-7">
                    {{ userEmail }}
                  </span>
                </div>
              </div>

              <q-separator class="q-my-sm" />

              <div
                v-for="field in accountFields"
                :key="field.label"
                class="row justify-between items-center"
              >
                <span class="text-body2 text-grey-7">{{ field.label }}</span>
                <span class="text-body2 text-grey-8 text-weight-medium">
                  {{ field.value || "—" }}
                </span>
              </div>
            </div>
          </q-tab-panel>

          <q-tab-panel name="clinics" class="q-pa-sm">
            <div class="row items-center justify-between q-mb-md">
              <div>
                <h2 class="text-body1 text-weight-bolder text-grey-8 q-my-none">
                  Minhas clínicas
                </h2>
                <p class="text-caption text-grey-7 q-mb-none">
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

            <ClinicMembershipList
              ref="membershipList"
              @create="createDialogOpen = true"
            />
          </q-tab-panel>
        </q-tab-panels>
      </q-card>

      <CreateClinicDialog v-model="createDialogOpen" @created="refreshList" />
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import AppLayout from "@/components/layout/AppLayout.vue";
import ClinicMembershipList from "@/components/clinics/ClinicMembershipList.vue";
import CreateClinicDialog from "@/components/clinics/CreateClinicDialog.vue";
import { useUserStore } from "@/stores/user";
import { useClinicStore } from "@/stores/clinic";

defineOptions({ name: "ProfilePage" });

const userStore = useUserStore();
const clinicStore = useClinicStore();
const router = useRouter();

const activeTab = ref<"account" | "clinics">("account");
const createDialogOpen = ref(false);
const membershipList = ref<InstanceType<typeof ClinicMembershipList> | null>(
  null
);

const userName = computed(() => userStore.state.currentUser.name || "...");
const userEmail = computed(
  () => (userStore.state.currentUser.email as string | undefined) ?? ""
);

const accountFields = computed(() => [
  { label: "Nome", value: (userStore.state.currentUser.name as string) || "" },
  { label: "E-mail", value: userEmail.value },
  {
    label: "CPF/CNPJ",
    value: (userStore.state.currentUser.cnpjf as string) || ""
  },
  {
    label: "Clínica ativa",
    value: clinicStore.state.activeContext?.clinic?.name ?? ""
  }
]);

/** Pós-criação: a store já entra na clínica criada — atualiza a lista e vai para a Home. */
function refreshList(): void {
  void clinicStore.fetchMyClinics(true);
  void router.push("/");
}
</script>
