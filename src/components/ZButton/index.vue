import { tap } from 'node:test/reporters';
<template>
  <div :class="[tooltip && 'tooltip tooltip-bottom']" :data-tip="tooltip ?? ''">
    <button
      class="btn h-6 btn-outline btn-sm"
      :class="[btnClass ?? '']"
      @click="handleBtnClick"
    >
      <img v-if="imgSrc" :src="imgSrc" alt="" class="w-6 h-6" />{{ btnText }}
    </button>
  </div>
</template>
<script lang="ts" setup>
defineProps({
  tooltip: {
    type: String,
    default: undefined,
  },
  imgSrc: {
    type: String,
    default: undefined,
  },
  btnText: {
    type: String,
    default: "按钮",
  },
  btnClass: {
    type: String,
    default: "btn-primary",
  },
});
const emit = defineEmits(["tap"]);

const handleBtnClick = () => {
  emit("tap");
};
</script>
<style lang="less" scoped></style>
