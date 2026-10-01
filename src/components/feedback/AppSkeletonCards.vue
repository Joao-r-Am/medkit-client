<template>
  <div class="row q-col-gutter-md">
    <div v-for="n in 4" :key="n" class="col-12 col-sm-6">
      <div class="app-skeleton-card">
        <q-skeleton type="circle" size="48px" />
        <div class="app-skeleton-card__texts">
          <q-skeleton type="text" :width="valueWidth(n)" height="26px" />
          <q-skeleton type="text" :width="labelWidth(n)" height="13px" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: "AppSkeletonCards" });

/*
 * Espelha o grid do dashboard (src/pages/index.vue): 4 cards `col-12 col-sm-6`
 * com ícone circular + valor + rótulo, nas mesmas medidas do
 * `.app-dashboard__card`.
 */
const VALUES = ["40%", "58%", "34%", "52%"];
const LABELS = ["70%", "62%", "76%", "66%"];

function valueWidth(n: number) {
  return VALUES[(n - 1) % VALUES.length];
}

function labelWidth(n: number) {
  return LABELS[(n - 1) % LABELS.length];
}
</script>

<style scoped lang="scss">
.app-skeleton-card {
  display: flex;
  align-items: center;
  gap: 16px;
  min-height: 100px;
  margin: 4px;
  padding: 24px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.app-skeleton-card__texts {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}
</style>
