<template>
  <AppProgressBar />
  <router-view />
</template>

<script setup lang="ts">
import AppProgressBar from "@/components/feedback/AppProgressBar.vue";

defineOptions({ name: "AppRoot" });
</script>
