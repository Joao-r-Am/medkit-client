<template>
  <q-select
    v-model="model"
    :options="filteredOptions"
    :option-label="optionLabel"
    :option-value="optionValue"
    emit-value
    map-options
    use-input
    hide-selected
    fill-input
    input-debounce="0"
    outlined
    dense
    :clearable="showClear"
    :label="label"
    :placeholder="placeholder"
    :error="!!error"
    :error-message="error"
    @filter="onFilter"
    @clear="onClear"
  >
    <template #no-option>
      <q-item>
        <q-item-section class="text-grey">
          Nenhum resultado encontrado
        </q-item-section>
      </q-item>
    </template>
  </q-select>
</template>

<script setup lang="ts">
import { ref } from "vue";

defineOptions({ name: "SelectField", inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    options: Record<string, unknown>[];
    optionLabel?: string;
    optionValue?: string;
    label?: string;
    placeholder?: string;
    error?: string;
    showClear?: boolean;
  }>(),
  {
    optionLabel: "name",
    optionValue: "id",
    placeholder: "",
    error: "",
    showClear: false
  }
);

const model = defineModel<unknown>();

const filteredOptions = ref<Record<string, unknown>[]>([...props.options]);

function onFilter(inputValue: string, update: (callback: () => void) => void) {
  update(() => {
    const needle = inputValue.toLowerCase();
    filteredOptions.value = props.options.filter(option => {
      const raw = option[props.optionLabel];
      return String(raw ?? "")
        .toLowerCase()
        .includes(needle);
    });
  });
}

function onClear() {
  model.value = undefined;
}
</script>
