<script lang="ts" setup>
// 维护一个 toast list , 提示消息统一管理
import { ref } from "vue";
import { logger } from "@kirklin/logger";

const visible = ref<boolean>(false);
const msg = ref<string>("");
const type = ref<string>("info");
const typeClass = reactive({
  info: "alert-info",
  success: "alert-success",
  error: "alert-error",
  warning: "alert-warning",
});

const timer = ref<number | null>(null);
const defineProps = {
  // 第一形态 传msg进来,  但其实用方法调用的情况最常见
  msg: {
    type: String,
    default: "",
  },
};

function show(option = {}) {
  if (timer.value) {
    clearTimeout(timer.value);
  }
  const defaultOption = { title: "", msg: "测试消息", type: "info", duration: 2500 };
  const _option = Object.assign({}, defaultOption, option);
  visible.value = true;
  msg.value = _option.msg;
  type.value = _option.type;
  logger.info(`toast =>${_option.msg}`);
  timer.value = setTimeout(() => {
    visible.value = false;
  }, _option.duration);
}

defineExpose({
  show,
});
</script>

<template>
  <div v-if="visible" class="toast-top toast-end top-12 toast">
    <div class="alert" :class="[typeClass[type]]">
      <span>{{ msg }}</span>
    </div>
  <!-- <div class="alert alert-success">
    <span>Message sent successfully.</span>
  </div> -->
  </div>
</template>

<style lang="less" scoped>
</style>
