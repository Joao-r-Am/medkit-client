<template>
  <div class="q-pa-lg">
    <p>Página não encontrada. Redirecionando...</p>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { useRouter } from "vue-router";

defineOptions({ name: "NotFoundPage" });

const router = useRouter();

onMounted(() => {
  void router.replace("/login");
});
</script>
