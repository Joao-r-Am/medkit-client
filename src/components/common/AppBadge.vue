<template>
  <q-badge :class="badgeClass" class="app-badge" :label="label" />
</template>

<script setup lang="ts">
import { computed } from "vue";

defineOptions({ name: "AppBadge" });

const props = defineProps<{
  type: string;
}>();

const label = computed(() => {
  if (props.type === "ISSUE") return "problema";
  if (props.type === "IDEA") return "ideia";
  return "outros";
});

const badgeClass = computed(() => {
  if (props.type === "ISSUE") return "app-badge--brown";
  if (props.type === "IDEA") return "app-badge--warm";
  return "app-badge--muted";
});
</script>

<style scoped lang="scss">
.app-badge {
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 0.6875rem;
  font-weight: 900;
  text-transform: uppercase;

  &--brown {
    background: var(--app-brown);
    color: #fff;
  }

  &--warm {
    background: var(--app-warm);
    color: #fff;
  }

  &--muted {
    background: var(--app-muted);
    color: #fff;
  }
}
</style>
