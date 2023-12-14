<script lang="ts" setup>
import { nextTick, onMounted, reactive, ref } from "vue";
import Konva from "konva";
import { AppStage } from "./AppStage";
import { downloadPNGForCanvas } from "~/utils/canvas";
import Toast from '~/components/Toast/index.vue';
import { logger } from "@kirklin/logger";

const Stage = ref();
const PixelRect = ref();
const PixelRectGroup = ref();
const canvasContainerRef = ref();
const toast = ref()
// 是否是填充模式
const isFillMode = ref<boolean>(false);
const mode = ref("basic");
const colorConfig = ref(["#000000", "#ffffff", "#1e80ff", "#f53f3f"]);
const selectColor = ref(colorConfig.value[0]);
const basicCellConfig = reactive({
  size: 5, // 单个格子宽高
  border: 1, // 边框宽度
  xCount: 12, // 横向有几个
  yCount: 12, // 纵向有几个
});

// 初始化画布
async function initStage() {
  Stage.value = new AppStage(canvasContainerRef, {
    isInitTransformer: false,
    isAllowMouseSelectShapes: false,
    scale: true,
  });

  Stage.value.setFillConfig({
    color: selectColor.value,
  });
}

// 生成矩形框+方格子
const genRectPixelBox = () => {
Stage.value.clearAllBaseShapes()
basicCellConfig.xCount = isNaN(+basicCellConfig.xCount) ? 0 : +basicCellConfig.xCount
basicCellConfig.yCount = isNaN(+basicCellConfig.yCount) ? 0 : +basicCellConfig.yCount
  PixelRectGroup.value = new Konva.Group({
    x: 500,
    y: 200,
    draggable: false,
  });
  logger.info(`basicCellConfig => ` + JSON.stringify(basicCellConfig, null, 2))
  // 矩形的x.y是相对于group的
  PixelRect.value = new Konva.Rect({
    x: 0,
    y: 0,
    width: basicCellConfig.xCount * basicCellConfig.size,
    height: basicCellConfig.yCount * basicCellConfig.size,
    id: "pixel-container",
    fill: "white",
    stroke: "black",
    strokeWidth: 0,
    draggable: false,
  });
  Stage.value.createShapesByGroup(PixelRectGroup.value, PixelRect.value);
  // 增加缓存
  PixelRect.value.cache()
  Stage.value.setScaleControler(PixelRectGroup.value);
  Stage.value.setDrawControler(PixelRectGroup.value);

  genPixelBoxCells();
}

// 根据配置生成方格子
function genPixelBoxCells() {
  const { x, y, strokeWidth: border } = PixelRect.value?.getAttrs();
  const cells = [];
  logger.info(`当前数量 => ` + basicCellConfig.xCount * basicCellConfig.yCount)
  if ( (basicCellConfig.xCount * basicCellConfig.yCount) > 2000) {
    toast.value && toast.value.show({
        type: 'error',
        msg: '数量过多时会有明显卡顿和掉帧, 请调整数量大小'
    })
  } 
  for (let xIndex = 0; xIndex < basicCellConfig.xCount; xIndex++) {
    for (let yIndex = 0; yIndex < basicCellConfig.yCount; yIndex++) {
      const attrs = {
        x: x + border + basicCellConfig.size * xIndex,
        y: y + border + basicCellConfig.size * yIndex,
        width: basicCellConfig.size,
        height: basicCellConfig.size,
        strokeWidth: basicCellConfig.border,
        stroke: "black",
        fill: "white",
        name: `fillnode-${xIndex}-${yIndex}`,
        draggable: false,
      };
      const rect = new Konva.Rect(attrs);
      cells.push(rect);
    }
  }
  Stage.value.createShapesByGroup(PixelRectGroup.value, cells);
}

// 清空画布
function resetCanvas() {
  Stage.value.clearFilledRects();
}
// 导出图片
function exportImage() {
  // 缩放回原始大小
  PixelRectGroup.value.scaleX(1);
  PixelRectGroup.value.scaleY(1);
  Stage.value.batchDraw();
  nextTick(() => {
    // 获取位置
    const { x, y } = PixelRectGroup.value.absolutePosition();
    const { width, height } = PixelRect.value.getAttrs();
    const dataURL = Stage.value.toDataURL({
      x,
      y,
      width,
      height,
      pixelRatio: window.devicePixelRatio,
    });
    downloadPNGForCanvas(dataURL, "测试");
  });
}

// 更改鼠标模式
function changeMode(e: any) {
  const checked = e.target.checked;
  isFillMode.value = checked;
  mode.value = checked ? "fill" : "basic";
  Stage.value.switchMouseMode(mode.value);
  // 监听填充动作
  Stage.value.listenAndAssignTask();
}

// 更改当前颜色
function changeColor(color: string) {
  selectColor.value = color;
  // let colors = colorConfig.value.filter(item => item !== color)
  // colorConfig.value = [color, ...colors];

  Stage.value.setFillConfig({
    color: selectColor.value,
  });
}

// 绑定键盘事件
function bindKeyboardEvent() {
  window.addEventListener("keydown", (e) => {
    if (e.code === "Space") {
      let index = colorConfig.value.findIndex(color => color === selectColor.value);
      index = index >= colorConfig.value.length - 1 ? 0 : index + 1;
      changeColor(colorConfig.value[index]);
    }
  });
}

onMounted(() => {
  initStage();
  bindKeyboardEvent();
  genRectPixelBox();
});
</script>

<template>
  <div ref="canvasContainerRef" class="flex-1" />

  <div class="fixed right-[30px] top-[200px] flex flex-col z-999">
    <div class="mouse-mode flex items-center justify-center">
      <span :class="[!isFillMode ? 'font-500 text-xl' : '']">标准</span><input type="checkbox" class="toggle" :checked="isFillMode" @change="changeMode"> <span :class="[isFillMode ? 'font-500 text-xl' : '']">填充</span>
    </div>
    <div class="color-picker mt-2 flex flex-wrap items-end">
      <div
        v-for="color in colorConfig" class="mr-1 h-4 w-4 border border-accent-content transition" :class="[selectColor === color ? 'w-8 h-8' : '']" :style="{ backgroundColor: color }" @click="changeColor(color)"
      />
    </div>
    <div class="countxy flex items-center justify-center mt-2">
        <input v-model="basicCellConfig.xCount" type="text" placeholder="横" class="input input-sm w-12 max-w-xs font-500 mr-2" />
        <span> X </span>
        <input v-model="basicCellConfig.yCount" type="text" placeholder="纵" class="input input-sm w-12 max-w-xs font-500 ml-2" />


    </div>  
    <button @click="genRectPixelBox" class="btn btn-primary mt-2">生成格子</button>
    <button class="mb-2 mt-2 btn btn-primary" @click="exportImage">
      导出图片
    </button>
    <button class="btn btn-secondary" @click="resetCanvas">
      清空颜色
    </button>
  </div>

  <Toast ref="toast"></Toast>
</template>
