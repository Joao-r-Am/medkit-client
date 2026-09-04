<template>
  <q-input
    :model-value="displayValue"
    :label="label"
    outlined
    dense
    readonly
    :error="!!error"
    :error-message="error"
    v-bind="$attrs"
  >
    <template #append>
      <q-icon name="schedule" class="cursor-pointer">
        <q-popup-proxy cover transition-show="scale" transition-hide="scale">
          <q-time
            :model-value="timeValue"
            mask="HH:mm"
            format24h
            now-btn
            @update:model-value="onTimeChange"
          />
        </q-popup-proxy>
      </q-icon>
    </template>
  </q-input>
</template>

<script setup lang="ts">
import { computed } from "vue";

defineOptions({ name: "TimeField", inheritAttrs: false });

const props = defineProps<{
  label?: string;
  error?: string;
}>();

const model = defineModel<Date | undefined>();

const timeValue = computed(() => {
  if (!model.value) return "";
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  })
    .format(model.value)
    .replace(/^24:/, "00:");
});

const displayValue = computed(() => (model.value ? `${timeValue.value}` : ""));

function onTimeChange(value: string | null) {
  if (!value) {
    model.value = undefined;
    return;
  }
  const [hours, minutes] = value.split(":").map(Number);
  const base = model.value ? new Date(model.value) : new Date();
  base.setHours(hours ?? 0, minutes ?? 0, 0, 0);
  model.value = base;
}
</script>
