<template>
  <q-select
    v-model="model"
    :options="filteredOptions"
    multiple
    use-chips
    use-input
    input-debounce="0"
    option-label="name"
    option-value="id"
    emit-value
    map-options
    outlined
    dense
    clearable
    label="Médico"
    placeholder="Selecione os médicos"
    class="filter-doctor q-mr-sm"
    style="width: 30%; min-width: 280px"
    @filter="onFilter"
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

defineOptions({ name: "FilterDoctor" });

const props = defineProps<{
  professionals: { id: string; name?: string }[];
}>();

const model = defineModel<string[]>({ default: () => [] });

const filteredOptions = ref<{ id: string; name?: string }[]>([
  ...props.professionals
]);

function onFilter(inputValue: string, update: (callback: () => void) => void) {
  update(() => {
    const needle = inputValue.toLowerCase();
    filteredOptions.value = props.professionals.filter(option => {
      return (option.name ?? "").toLowerCase().includes(needle);
    });
  });
}
</script>
