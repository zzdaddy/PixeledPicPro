<template>
  <slot name="default"></slot>
  <dialog :id="props.modalId" class="modal" ref="myDialog">
    <div class="modal-box w-11/12 max-w-5xl">
      <div class="modal-action">
        <form method="dialog">
          <button
            class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
          >
            ✕
          </button>
        </form>
      </div>
      <slot name="content"></slot>
    </div>
  </dialog>
</template>
<script lang="ts" setup>
const props = defineProps({
  modalId: {
    type: String,
    default: "zz_modal_7",
  },
  title: {
    type: String,
  },
});

const myDialog = ref();
const openModal = () => {
  myDialog.value.showModal();
};
const closeModal = () => {
  myDialog.value.close();
};
// 抛出给外部使用
defineExpose({
  openModal,
  closeModal,
});
</script>
<style lang="less" scoped></style>
