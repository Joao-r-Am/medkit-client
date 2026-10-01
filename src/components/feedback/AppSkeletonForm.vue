<template>
  <div class="app-skeleton-form">
    <div v-for="n in fields" :key="n" class="app-skeleton-form__field">
      <q-skeleton type="text" :width="labelWidth(n)" height="10px" />
      <q-skeleton type="rect" height="40px" />
    </div>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: "AppSkeletonForm" });

withDefaults(
  defineProps<{
    /**
     * Quantidade de campos. Vale a contagem de LINHAS visíveis do form
     * (um `row` com dois inputs conta como uma linha).
     */
    fields?: number;
  }>(),
  { fields: 5 }
);

/*
 * Placeholder do corpo dos modais de edição. Enquanto o `getById` roda, o
 * `q-form` fica escondido atrás de `is_loading_data` e o card abriria VAZIO;
 * aqui a espera vira shimmer no mesmo formato do form real: um rótulo fino
 * em cima de um input de 40px (a altura do `q-input outlined dense`).
 *
 * As larguras do rótulo variam num ciclo porque os labels reais têm tamanhos
 * diferentes — repetição idêntica denuncia o placeholder.
 */
const LABELS = ["30%", "45%", "38%", "42%", "33%", "48%"];

function labelWidth(n: number) {
  return LABELS[(n - 1) % LABELS.length];
}
</script>

<style scoped lang="scss">
.app-skeleton-form {
  display: flex;
  flex-direction: column;
  // O mesmo espaçamento do `q-gutter-y-md` no `q-form` real, para que a
  // troca skeleton → form não pule de posição.
  gap: 16px;
}

.app-skeleton-form__field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
</style>
