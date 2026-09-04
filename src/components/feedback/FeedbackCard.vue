<template>
  <q-card flat class="app-feedback-card cursor-pointer" @click="handleToggle">
    <q-card-section>
      <div class="row items-center justify-between q-mb-lg">
        <AppBadge :type="props.feedback.type" />
        <span class="text-grey-6">
          {{ getDiffTimeBetweenCurrentDate(props.feedback.createdAt) }}
        </span>
      </div>

      <div class="text-body1 text-grey-8">
        {{ props.feedback.text }}
      </div>

      <q-slide-transition>
        <div v-if="isOpen" class="row q-mt-lg">
          <div class="col-6 column">
            <span class="app-feedback-card__label">Página</span>
            <span class="text-weight-medium text-grey-7">
              {{ props.feedback.page }}
            </span>
          </div>
          <div class="col-6 column">
            <span class="app-feedback-card__label">Dispositivo</span>
            <span class="text-weight-medium text-grey-7">
              {{ props.feedback.device }}
            </span>
          </div>
        </div>
      </q-slide-transition>

      <div v-if="!isOpen" class="row justify-end q-mt-lg">
        <q-icon name="expand_more" size="24px" color="grey-5" />
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { ref } from "vue";
import AppBadge from "@/components/common/AppBadge.vue";
import { getDiffTimeBetweenCurrentDate } from "@/utils/date";

defineOptions({ name: "FeedbackCard" });

type Feedback = {
  type: string;
  text: string;
  page?: string;
  device?: string;
  fingerprint?: string;
  createdAt?: string;
};

const props = withDefaults(
  defineProps<{
    feedback: Feedback;
    isOpened?: boolean;
  }>(),
  {
    isOpened: false
  }
);

const isOpen = ref(props.isOpened);

async function handleToggle() {
  isOpen.value = !isOpen.value;
}
</script>

<style scoped lang="scss">
.app-feedback-card {
  background: var(--app-soft);
  border-radius: 4px;
}

.app-feedback-card__label {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  color: #9ca3af;
  user-select: none;
}
</style>
