<script lang="ts" setup>
const props = defineProps({
  options: {
    type: Array,
    default: () => [],
  },
  title: {
    type: String,
  },
});

const emit = defineEmits(["change"]);

const curValue = ref("");

function changeOption(e: any) {
  const name = e.target.value;
  curValue.value = name;
  emit("change", name);
}

function setValue(value: string) {
  curValue.value = value;
}

function getValue() {
  return curValue.value;
}
onMounted(() => {
  console.log(`options`, props.options[0]);
  curValue.value = (props.options[0] as { name: string })?.name;
});

defineExpose({
  setValue,
  getValue,
});
</script>

<template>
  <div class="text-primary font-bold">
    {{ title }}
  </div>
  <select
    v-model="curValue"
    class="max-w-xs w-full select select-primary"
    @change="changeOption"
  >
    <option v-for="option in options">
      {{ (option as any).name }}
    </option>
  </select>
</template>

<style lang="less" scoped></style>
