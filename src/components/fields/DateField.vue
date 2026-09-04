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
      <q-icon name="event" class="cursor-pointer">
        <q-popup-proxy cover transition-show="scale" transition-hide="scale">
          <q-date
            :model-value="dateValue"
            mask="YYYY-MM-DD"
            today-btn
            :options="optionsFn"
            @update:model-value="onDateChange"
          />
        </q-popup-proxy>
      </q-icon>
    </template>
  </q-input>
</template>

<script setup lang="ts">
import { computed } from "vue";

defineOptions({ name: "DateField", inheritAttrs: false });

const props = defineProps<{
  label?: string;
  error?: string;
  optionsFn?: (date: string) => boolean;
}>();

const model = defineModel<Date | undefined>();

function toDateKeyString(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

const dateValue = computed(() =>
  model.value ? toDateKeyString(model.value) : ""
);

const displayValue = computed(() => {
  if (!model.value) return "";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(model.value);
});

function onDateChange(value: string | null) {
  model.value = value ? new Date(`${value}T00:00:00`) : undefined;
}
</script>
