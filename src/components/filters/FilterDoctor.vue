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
    class="filter-doctor"
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
import { computed, ref } from "vue";

defineOptions({ name: "FilterDoctor" });

const props = defineProps<{
  professionals: { id: string; name?: string }[];
}>();

const model = defineModel<string[]>({ default: () => [] });

const needle = ref("");

// Precisa ser derivado: os profissionais chegam de forma assíncrona e um
// snapshot feito no setup deixaria o select permanentemente vazio.
const filteredOptions = computed(() => {
  const term = needle.value.toLowerCase();
  return props.professionals.filter(option =>
    (option.name ?? "").toLowerCase().includes(term)
  );
});

function onFilter(inputValue: string, update: (callback: () => void) => void) {
  update(() => {
    needle.value = inputValue;
  });
}
</script>
