<template>
  <!--
    Barra de filtros com flex gap (não os gutters do Quasar, que usam margem
    negativa + padding e acabavam deformando/colando os botões):
    - gap garante espaço REAL entre campos e ações;
    - abaixo de 1024px as ações caem para a linha de baixo em largura cheia;
    - margin-left: auto empurra as ações para a direita no desktop.
  -->
  <div class="filter-bar" :class="{ 'filter-bar--embedded': embedded }">
    <div class="filter-bar__fields">
      <slot />
    </div>
    <div class="filter-bar__actions">
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

withDefaults(
  defineProps<{
    // true = dentro do menu mobile (sem o "chrome" cinza da barra solta)
    embedded?: boolean;
  }>(),
  { embedded: false }
);

defineEmits<{
  apply: [];
  reset: [];
}>();
</script>

<style scoped lang="scss">
/* Chrome da barra (fundo/borda) + layout via flex gap — previsível e sem
   margem negativa */
.filter-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px;
  padding: 12px;
  background: #f8f8f8;
  border-radius: 8px;
}

/* Dentro do menu ⋮ o menu já dá o fundo e o padding */
.filter-bar--embedded {
  padding: 0;
  background: transparent;
}

/* Campos (Médico + período): empilham no mobile, dividem no desktop */
.filter-bar__fields {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  flex: 1 1 auto;
  min-width: 0;
}

.filter-bar__fields > * {
  width: 100%; /* mobile: cada campo em sua linha */
  min-width: 0;
}

.filter-bar__actions {
  display: flex;
  gap: 8px;
  margin-left: auto; /* desktop: encostadas à direita */
}

@media (min-width: 1024px) {
  .filter-bar__fields > * {
    width: auto;
    flex: 1 1 45%; /* lado a lado, sobrando ~10% antes das ações */
  }
}

@media (max-width: 1023.98px) {
  .filter-bar__actions {
    width: 100%;
    margin-left: 0;
  }

  /* celular: Aplicar/Limpar dividem a linha com alvos grandes */
  .filter-bar__actions .q-btn {
    flex: 1;
  }
}
</style>
