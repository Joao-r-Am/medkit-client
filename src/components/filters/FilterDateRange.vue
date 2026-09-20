<template>
  <div
    class="filter-date-range row q-gutter-x-xs items-center"
    style="width: 25%; min-width: 280px"
  >
    <q-input
      :model-value="displayFrom"
      label="De"
      outlined
      dense
      readonly
      class="filter-date-range__input"
      style="width: 130px"
      @click="showFrom = true"
    >
      <template #append>
        <q-icon name="event" class="cursor-pointer" @click="showFrom = true">
          <q-popup-proxy cover transition-show="scale" transition-hide="scale">
            <q-date
              v-model="dateFrom"
              mask="YYYY-MM-DD"
              today-btn
              @update:model-value="onFromChange"
            />
          </q-popup-proxy>
        </q-icon>
      </template>
    </q-input>

    <q-input
      :model-value="displayTo"
      label="Até"
      outlined
      dense
      readonly
      class="filter-date-range__input"
      style="width: 130px"
      @click="showTo = true"
    >
      <template #append>
        <q-icon name="event" class="cursor-pointer" @click="showTo = true">
          <q-popup-proxy cover transition-show="scale" transition-hide="scale">
            <q-date
              v-model="dateTo"
              mask="YYYY-MM-DD"
              :options="optionsTo"
              today-btn
              @update:model-value="onToChange"
            />
          </q-popup-proxy>
        </q-icon>
      </template>
    </q-input>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";

defineOptions({ name: "FilterDateRange" });

interface DateRange {
  from: string | undefined;
  to: string | undefined;
}

const model = defineModel<DateRange>({
  default: () => ({ from: undefined, to: undefined })
});

const dateFrom = ref<string | undefined>(model.value.from);
const dateTo = ref<string | undefined>(model.value.to);
const showFrom = ref(false);
const showTo = ref(false);

watch(
  () => model.value.from,
  val => {
    dateFrom.value = val;
  }
);
watch(
  () => model.value.to,
  val => {
    dateTo.value = val;
  }
);

const displayFrom = computed(() => {
  if (!dateFrom.value) return "";
  const [y, m, d] = dateFrom.value.split("-");
  return `${d}/${m}/${y}`;
});

const displayTo = computed(() => {
  if (!dateTo.value) return "";
  const [y, m, d] = dateTo.value.split("-");
  return `${d}/${m}/${y}`;
});

function optionsTo(date: string): boolean {
  if (!dateFrom.value) return true;
  return date >= dateFrom.value;
}

function onFromChange(value: string | undefined) {
  dateFrom.value = value;
  showFrom.value = false;
  if (dateTo.value && value && dateTo.value < value) {
    dateTo.value = value;
  }
  model.value = { from: dateFrom.value, to: dateTo.value };
}

function onToChange(value: string | undefined) {
  dateTo.value = value;
  showTo.value = false;
  model.value = { from: dateFrom.value, to: dateTo.value };
}
</script>
