<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="app-modal" style="max-width: 520px">
      <div class="app-modal__accent" />

      <q-card-section
        class="row items-center justify-between app-modal__header"
      >
        <div class="app-modal__title">Enviar convite de agendamento</div>
        <q-btn
          flat
          round
          dense
          icon="fa-solid fa-xmark"
          aria-label="Fechar"
          @click="onDialogCancel"
        />
      </q-card-section>

      <q-card-section class="scroll app-modal__body">
        <AppSkeletonForm v-if="state.is_loading" :fields="4" />
        <template v-else>
          <template v-if="invite">
            <div class="flex column items-center q-pa-sm">
              <i class="fa-solid fa-link text-primary text-h4 q-mb-sm" />
              <p class="text-weight-bold q-mb-xs">Link gerado com sucesso!</p>
              <p class="text-caption q-mb-md q-mt-none text-weight-regular">
                Envie para o paciente. Ele agendará sozinho, sem precisar do
                app.
              </p>
            </div>

            <div class="invite-link-box">
              <span class="invite-link-box__url">{{ invite.url }}</span>
            </div>

            <div class="row q-col-gutter-sm q-mt-md">
              <q-btn
                unelevated
                no-caps
                class="app-btn-primary col-6"
                icon="fa-solid fa-copy"
                label="Copiar link"
                @click="copyLink"
              />
              <q-btn
                unelevated
                no-caps
                color="dark"
                class="col-6"
                icon="fa-solid fa-arrow-up-right-from-square"
                label="Abrir link"
                @click="openLink"
              />
            </div>

            <div class="row items-center justify-between q-mt-sm">
              <span class="text-caption text-grey-6">
                Válido até {{ expiresLabel }}
              </span>
              <q-btn
                flat
                dense
                no-caps
                color="negative"
                icon="fa-solid fa-ban"
                label="Desativar link"
                :loading="revoking"
                @click="confirmRevoke"
              />
            </div>
          </template>

          <template v-else>
            <div class="flex column items-center q-pa-md text-center">
              <i
                class="fa-solid fa-circle-check text-primary text-h4 q-mb-sm"
              />
              <p class="text-weight-bold q-mb-xs">Link desativado</p>
              <p class="text-caption q-mb-md q-mt-none">
                Este link não pode mais ser usado. Gere um novo se precisar.
              </p>
              <q-btn
                unelevated
                no-caps
                class="app-btn-primary"
                icon="fa-solid fa-rotate"
                label="Gerar novo link"
                @click="generate"
              />
            </div>
          </template>

          <q-separator class="q-my-md" />

          <q-expansion-item
            v-model="advancedOpen"
            icon="fa-solid fa-sliders"
            label="Opções do link"
            caption="Restringir profissional, serviços e validade"
            dense
            class="q-mx-sm"
          >
            <q-card flat>
              <q-card-section class="q-gutter-y-sm">
                <q-select
                  v-model="options.professional_id"
                  :options="professionalOptions"
                  label="Profissional"
                  outlined
                  dense
                  clearable
                  option-value="value"
                  option-label="label"
                  @update:model-value="onOptionsChange"
                />
                <q-select
                  v-model="options.procedure_ids"
                  :options="procedureOptions"
                  label="Procedimentos"
                  outlined
                  dense
                  multiple
                  clearable
                  option-value="value"
                  option-label="label"
                  @update:model-value="onOptionsChange"
                />
                <q-select
                  v-model="options.exam_ids"
                  :options="examOptions"
                  label="Exames"
                  outlined
                  dense
                  multiple
                  clearable
                  option-value="value"
                  option-label="label"
                  @update:model-value="onOptionsChange"
                />
                <q-input
                  v-model.number="options.expires_in_days"
                  label="Validade (dias)"
                  type="number"
                  min="1"
                  max="30"
                  outlined
                  dense
                  @update:model-value="onOptionsChange"
                />

                <div class="row justify-end">
                  <q-btn
                    v-if="invite"
                    unelevated
                    no-caps
                    color="secondary"
                    icon="fa-solid fa-rotate"
                    label="Atualizar link"
                    :disable="!advancedTouched"
                    :loading="regenerating"
                    @click="regenerate"
                  />
                </div>
              </q-card-section>
            </q-card>
          </q-expansion-item>
        </template>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { copyToClipboard, useDialogPluginComponent, Dialog } from "quasar";
import AppSkeletonForm from "@/components/feedback/AppSkeletonForm.vue";
import services from "@/services";
import toasty from "@/utils/toast";
import { formatDate } from "@/utils/date";
import type {
  SchedulingInviteCreated,
  SchedulingInvitePayload
} from "@/interfaces/scheduling-invite";

defineOptions({ name: "ModalInviteCreate" });

const emit = defineEmits([...useDialogPluginComponent.emits]);
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();

const invite = ref<SchedulingInviteCreated | null>(null);
const advancedOpen = ref(false);
const advancedTouched = ref(false);
const revoking = ref(false);
const regenerating = ref(false);

const state = reactive({ is_loading: true });

const options = reactive<{
  professional_id: string | null;
  procedure_ids: string[];
  exam_ids: string[];
  expires_in_days: number;
}>({
  professional_id: null,
  procedure_ids: [],
  exam_ids: [],
  expires_in_days: 7
});

const professionalOptions = ref<{ label: string; value: string }[]>([]);
const procedureOptions = ref<{ label: string; value: string }[]>([]);
const examOptions = ref<{ label: string; value: string }[]>([]);

const expiresLabel = computed(() =>
  invite.value?.expires_at ? formatDate(invite.value.expires_at) : "-"
);

onMounted(async () => {
  await Promise.all([loadOptions(), generate()]);
  state.is_loading = false;
});

async function loadOptions() {
  type OptionItem = { id: string; name?: string };

  const [professionals, procedures, exams] = await Promise.all([
    services.professionals.getAll().catch(() => [] as OptionItem[]),
    services.procedures.getAll().catch(() => [] as OptionItem[]),
    services.exams.getAll().catch(() => [] as OptionItem[])
  ]);

  professionalOptions.value = (professionals ?? []).map((item: OptionItem) => ({
    label: String(item.name ?? item.id),
    value: String(item.id)
  }));
  procedureOptions.value = (procedures ?? []).map((item: OptionItem) => ({
    label: String(item.name ?? item.id),
    value: String(item.id)
  }));
  examOptions.value = (exams ?? []).map((item: OptionItem) => ({
    label: String(item.name ?? item.id),
    value: String(item.id)
  }));
}

function buildPayload(): SchedulingInvitePayload {
  const payload: SchedulingInvitePayload = {
    expires_in_days: options.expires_in_days || 7
  };

  if (options.professional_id)
    payload.professional_id = options.professional_id;
  if (options.procedure_ids.length)
    payload.procedure_ids = [...options.procedure_ids];
  if (options.exam_ids.length) payload.exam_ids = [...options.exam_ids];

  return payload;
}

async function generate() {
  try {
    invite.value = await services.schedulingInvites.create(buildPayload());
    advancedTouched.value = false;
  } catch (err) {
    toasty.errorToasty(
      { title: "Não foi possível gerar o link", msg: "Tente novamente" },
      err
    );
  }
}

function onOptionsChange() {
  advancedTouched.value = true;
}

async function regenerate() {
  if (!invite.value) {
    await generate();
    return;
  }

  regenerating.value = true;
  try {
    await services.schedulingInvites.revoke(invite.value.id);
  } catch {
    // Segue com a geração mesmo se a revogação falhar (link novos substituem).
  } finally {
    regenerating.value = false;
  }

  await generate();
}

function copyLink() {
  if (!invite.value) return;
  void copyToClipboard(invite.value.url).then(() => {
    toasty.successToasty({
      title: "Link copiado!",
      msg: "Cole no WhatsApp ou e-mail"
    });
  });
}

function openLink() {
  if (!invite.value) return;
  window.open(invite.value.url, "_blank", "noopener");
}

function confirmRevoke() {
  Dialog.create({
    title: "Desativar link",
    message: "O link deixará de funcionar imediatamente. Deseja continuar?",
    ok: {
      label: "Desativar",
      color: "negative",
      unelevated: true,
      noCaps: true
    },
    cancel: { label: "Voltar", flat: true, noCaps: true },
    persistent: true
  })
    .onOk(() => void revoke())
    .onCancel(() => undefined)
    .onDismiss(() => undefined);
}

async function revoke() {
  if (!invite.value) return;
  revoking.value = true;
  try {
    await services.schedulingInvites.revoke(invite.value.id);
    invite.value = null;
    toasty.successToasty({
      title: "Link desativado",
      msg: "Não pode mais ser usado para agendar"
    });
  } catch (err) {
    toasty.errorToasty(
      { title: "Não foi possível desativar o link", msg: "Erro" },
      err
    );
  } finally {
    revoking.value = false;
  }
}
</script>

<style scoped lang="scss">
.invite-link-box {
  padding: 10px 14px;
  font-size: 0.8rem;
  word-break: break-all;
  color: var(--app-dark);
  background: var(--app-soft);
  border: 1px dashed var(--app-border);
  border-radius: 8px;
}
</style>
