<template>
  <div class="app-skeleton-panel">
    <q-skeleton v-if="title" type="text" width="35%" height="24px" />

    <div class="app-skeleton-panel__rows">
      <div v-for="n in lines" :key="n" class="app-skeleton-panel__row">
        <q-skeleton type="circle" size="40px" />
        <div class="app-skeleton-panel__texts">
          <q-skeleton type="text" :width="primaryWidth(n)" height="14px" />
          <q-skeleton type="text" :width="secondaryWidth(n)" height="12px" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: "AppSkeletonPanel" });

withDefaults(
  defineProps<{
    /** Linhas de conteúdo (cada uma: avatar + duas linhas de texto). */
    lines?: number;
    /** Mostra a linha de título no topo (útil em cards/páginas). */
    title?: boolean;
  }>(),
  { lines: 5, title: false }
);

/*
 * Placeholder neutro para áreas de conteúdo sem tabela própria (painéis do
 * calendário/semana, página pública de agendamento). As linhas se distribuem
 * pelo espaço disponível, então funciona tanto num painel alto quanto num
 * card de altura automática.
 */
const PRIMARY = ["62%", "48%", "70%", "55%", "66%", "52%"];
const SECONDARY = ["38%", "30%", "45%", "33%", "40%", "36%"];

function primaryWidth(n: number) {
  return PRIMARY[(n - 1) % PRIMARY.length];
}

function secondaryWidth(n: number) {
  return SECONDARY[(n - 1) % SECONDARY.length];
}
</script>

<style scoped lang="scss">
.app-skeleton-panel {
  display: flex;
  flex: 1;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 0;
}

.app-skeleton-panel__rows {
  display: flex;
  flex: 1;
  flex-direction: column;
  justify-content: space-evenly;
  gap: 16px;
  min-height: 0;
}

.app-skeleton-panel__row {
  display: flex;
  align-items: center;
  gap: 16px;
}

.app-skeleton-panel__texts {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}
</style>
