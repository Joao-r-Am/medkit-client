<template>
  <q-linear-progress
    v-if="isLoading"
    :value="progress"
    :indeterminate="indeterminate"
    color="primary"
    track-color="transparent"
    size="3px"
    class="app-progress-bar"
  />
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useGlobalLoading } from "@/stores/global";

defineOptions({ name: "AppProgressBar" });

const { isLoading, progress } = useGlobalLoading();

/*
 * Dois modos, na sequência em que a rede realmente acontece:
 *
 *  - INDETERMINATE enquanto nenhum byte chegou (`progress === 0`): até os
 *    primeiros bytes existe uma varredura animada desde o primeiro frame —
 *    sem isso a barra determinada com `value 0` tem largura zero e fica
 *    INVISÍVEL no TTFB, e o usuário só enxergava o flash do final (a
 *    reclamação de que ela "só piscava");
 *
 *  - DETERMINADA a partir do primeiro `onDownloadProgress`: daí em diante ela
 *    cresce com os bytes reais de todas as requisições em voo, no padrão do
 *    topo do YouTube. A suavização da troca é a transição de `width` em CSS
 *    (css/app.scss), que só incide no modelo determinado — a varredura usa a
 *    animação própria do Quasar.
 *
 * No fim, `stopRequest` leva `progress` a 1 (100% verdadeiro) e o store
 * esconde a barra depois do tempo mínimo.
 */
const indeterminate = computed(() => isLoading.value && progress.value === 0);
</script>
