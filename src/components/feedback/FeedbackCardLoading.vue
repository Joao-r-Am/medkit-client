<template>
  <q-card flat class="app-feedback-skeleton" style="width: 100%">
    <q-card-section class="column q-gutter-y-md">
      <q-skeleton height="90px" width="90%" animation-duration="2s" />
      <q-skeleton height="90px" width="90%" animation-duration="2.3s" />
      <q-skeleton height="90px" width="90%" animation-duration="2.5s" />
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
defineOptions({ name: "FeedbackCardLoading" });
</script>

<style scoped lang="scss">
.app-feedback-skeleton {
  background: #f6f7f8;
}
</style>
