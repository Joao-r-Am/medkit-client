<template>
  <div class="filter-bar q-pa-sm row items-center q-gutter-x-sm">
    <div class="filter-bar__filters row q-gutter-x-sm">
      <slot />
    </div>
    <div class="col" />
    <div class="filter-bar__actions row q-gutter-x-xs no-wrap">
      <q-btn
        unelevated
        no-caps
        color="primary"
        icon="fa-solid fa-magnifying-glass"
        label="Aplicar"
        size="sm"
        @click="$emit('apply')"
      />
      <q-btn
        outline
        no-caps
        color="grey-7"
        icon="fa-solid fa-rotate-left"
        label="Limpar"
        size="sm"
        @click="$emit('reset')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: "FilterBar" });

defineEmits<{
  apply: [];
  reset: [];
}>();
</script>

<style scoped>
.filter-bar {
  background: #f8f8f8;
  border-radius: 8px;
}
.filter-bar__actions {
  flex-shrink: 0;
}
</style>
