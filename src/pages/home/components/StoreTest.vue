<script lang="ts" setup>
import { nextTick, onMounted, reactive, ref } from "vue";
import Konva from "konva";
import { useClipboard } from "@vueuse/core";
import { logger } from "@kirklin/logger";
import { AppStage } from "./AppStage";
import { downloadPNGForCanvas } from "~/utils/canvas";

// const permissionRead = usePermission('clipboard-read')
// const permissionWrite = usePermission('clipboard-write')
// 为何注释 ? 请看components的readme.md
// import Toast from '~/components/Toast/index.vue';

const { isSupported, copy } = useClipboard();

type presetName = string;

const Stage = ref();
const PixelRect = ref();
const PixelRectGroup = ref();
const canvasContainerRef = ref();
const presetSelector = ref();
const toast = ref();

const copyPreset = ref<string>("");
const pastePreset = ref<string>("");
const showPasteTextarea = ref<boolean>(true);
// 是否是填充模式
const isFillMode = ref<boolean>(false);
// 导出时去除边框
const isClearBorder = ref<boolean>(false);
const mode = ref("basic");
const colorConfig = ref(["#000000", "#ffffff", "#1e80ff", "#f53f3f"]);
const selectColor = ref(colorConfig.value[0]);
let basicCellConfig = reactive({
  size: 5, // 单个格子宽高
  border: 1, // 边框宽度
  xCount: 12, // 横向有几个
  yCount: 12, // 纵向有几个
});

// 优秀的预设, 包含颜色配置, 尺寸大小
const awsomePreset = ref([
  {
    name: "基础预设",
    cellConfig: {
      size: 5,
      border: 1,
      xCount: 12,
      yCount: 12,
    },
    colors: ["#000000", "#ffffff", "#1e80ff", "#f53f3f"],
  },
  {
    name: "IKUN",
    cellConfig: {
      size: 5,
      border: 1,
      xCount: 15,
      yCount: 24,
    },
    colors: ["#564A54", "#DDDBED", "#1C1A25", "#DDB3C0", "#908B96", "#CC7A76", "#ffffff"],
  },
]);

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
function genRectPixelBox() {
  Stage.value.clearAllBaseShapes();
  isFillMode.value = false;
  basicCellConfig.xCount = isNaN(+basicCellConfig.xCount) ? 0 : +basicCellConfig.xCount;
  basicCellConfig.yCount = isNaN(+basicCellConfig.yCount) ? 0 : +basicCellConfig.yCount;
  PixelRectGroup.value = new Konva.Group({
    x: 500,
    y: 200,
    draggable: false,
  });
  logger.info(`basicCellConfig => ${JSON.stringify(basicCellConfig, null, 2)}`);
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
  PixelRect.value.cache();
  Stage.value.setScaleControler(PixelRectGroup.value);
  Stage.value.setDrawControler(PixelRectGroup.value);

  genPixelBoxCells();
}

// 根据配置生成方格子
function genPixelBoxCells() {
  const { x, y, strokeWidth: border } = PixelRect.value?.getAttrs();
  const cells = [];
  logger.info(`当前数量 => ${basicCellConfig.xCount * basicCellConfig.yCount}`);
  if ((basicCellConfig.xCount * basicCellConfig.yCount) > 2000) {
    toast.value && toast.value.show({
      type: "error",
      msg: "数量过多时会有明显卡顿和掉帧, 请调整数量大小",
    });
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
  if (isClearBorder.value) {
    PixelRectGroup.value.getChildren((node: Konva.Rect) => {
      return node.getAttr("name").includes("fillnode");
    }).forEach((rect: Konva.Rect) => {
      rect.setAttr("strokeWidth", 0);
      Stage.value.batchDraw();
    });
  }
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

    if (isClearBorder.value) {
      PixelRectGroup.value.getChildren((node: Konva.Rect) => {
        return node.getAttr("name").includes("fillnode");
      }).forEach((rect: Konva.Rect) => {
        rect.setAttr("strokeWidth", basicCellConfig.border);
        Stage.value.batchDraw();
      });
    }
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

function setBorderVisibleForExport(e: any) {
    console.log(`e.target.checked`, e.target.checked)
  isClearBorder.value = e.target.checked;
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
function selectPreset(name: presetName) {
  console.log(`name`, name);
  applyAwsomePreset(name);
}

// 检查preset是否合法
function checkPreset(preset: any) {
  const checkKeys = ["name", "colors", "cellConfig"];
  if (checkKeys.every(key => preset.hasOwnProperty(key))) {
    if (typeof preset.name === "string" && Array.isArray(preset.colors) && preset.cellConfig instanceof Object) {
      return true;
    }
  }

  toast.value.show({
    msg: "预设不合法, 请检查后重试",
    type: "error",
  });
  return false;
}
function applyAwsomePreset(name: presetName) {
  logger.info(`切换预设 =>${name}`);
  const preset = awsomePreset.value.find(item => item.name === name);
  if (preset) {
    copyPreset.value = JSON.stringify(preset, null, 2);
    const { cellConfig, colors } = preset;
    const newConfig = Object.assign({}, basicCellConfig, cellConfig);
    basicCellConfig = newConfig;
    colorConfig.value = colors;
    // 根据预设生成
    // genRectPixelBox()
  } else {
    toast.value.show({
      msg: "不存在的预设",
      type: "error",
    });
  }
}

function exportPreset() {
  if (isSupported) {
    copy(copyPreset.value);
    toast.value.show({
      type: "success",
      msg: "已复制到剪切板!",
    });
  }
}
function filterNoRepeatPresets(presets: any[]) {
  const newPresets: any[] = [];
  presets.forEach((item: any) => {
    // 如果不存在, push
    if (newPresets.findIndex(preset => preset.name === item.name) === -1) {
      newPresets.push(item);
    }
  });
  return newPresets;
}
// 加载本地配置
function loadLocalPreset() {
  const localPresets = localStorage.getItem("ZZSTUDIO_PPP_PRESETS");
  if (localPresets) {
    try {
      const presets = JSON.parse(localPresets);
      // 检测合法性, 没问题的话, 直接应用
      if (presets.every((preset: any) => checkPreset(preset))) {
        // 去重, name一样会被去掉, 本地优先
        const newPresets = filterNoRepeatPresets(presets.concat(awsomePreset.value));
        awsomePreset.value = newPresets.concat();
      }
    } catch (err) {
      toast.value.show({
        msg: "本地预设加载失败",
        type: "error",
      });
      return false;
    }
  } else {
    logger.info("无本地预设");
  }
}

// 监听 -> 应用 -> 存本地
watch(pastePreset, (json) => {
  try {
    const preset = JSON.parse(json);
    // 检测合法性, 没问题的话, 直接应用
    if (checkPreset(preset)) {
      // 去重
      const newPresets = filterNoRepeatPresets(awsomePreset.value.concat(preset));
      awsomePreset.value = newPresets.concat();
      // 存本地
      localStorage.setItem("ZZSTUDIO_PPP_PRESETS", JSON.stringify(awsomePreset.value));
      // 选中
      selectPreset(preset.name);
      presetSelector.value.setValue(preset.name);
      toast.value.show({
        msg: `[${preset.name}]已导入!开始体验吧!`,
        type: "success",
      });
    }
  } catch (err) {
    toast.value.show({
      msg: "预设不合法, 请检查后重试",
      type: "error",
    });
    return false;
  }
});

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
  loadLocalPreset();
});
</script>

<template>
  <div ref="canvasContainerRef" class="flex-1" />

  <div class="fixed right-[30px] top-[130px] z-999 max-w-40 flex flex-col">
    <button class="mb-2 btn btn-md btn-primary" @click="genRectPixelBox">
      生成!(会清空)
    </button>
    <Select ref="presetSelector" title="优秀预设" :options="awsomePreset" @change="selectPreset" />
    <div class="mouse-mode mt-2 flex items-center justify-center">
      <span :class="[!isFillMode ? 'font-500 text-xl' : '']">标准</span><input type="checkbox" class="toggle" :checked="isFillMode" @change="changeMode"> <span :class="[isFillMode ? 'font-500 text-xl' : '']">填充</span>
    </div>
    <div class="setting mt-2">
      <span class="text-sm font-500">导出去边框</span><input type="checkbox" class="toggle" :checked="isClearBorder" @change="setBorderVisibleForExport">
    </div>
    <div class="color-picker mt-2 min-h-18 flex flex-wrap items-end border border-primary border-dashed p-1">
      <div
        v-for="color in colorConfig" class="mb-1 mr-1 h-4 w-4 border border-accent-content transition" :class="[selectColor === color ? 'w-8 h-8' : '']" :style="{ backgroundColor: color }" @click="changeColor(color)"
      />
    </div>
    <div class="countxy mt-2 flex items-center justify-center">
      <input v-model="basicCellConfig.xCount" type="text" placeholder="横" class="mr-2 max-w-xs w-12 text-4 text-primary font-bold input input-sm">
      <span> X </span>
      <input v-model="basicCellConfig.yCount" type="text" placeholder="纵" class="ml-2 max-w-xs w-12 text-4 text-primary font-bold input input-sm">
    </div>
    <div class="relative">
      <textarea v-show="false" v-model="copyPreset" class="absolute left--60 textarea textarea-primary textarea-md" placeholder="json" />
      <button class="mt-2 w-full btn btn-primary" @click="exportPreset">
        {{ isSupported ? '导出预设' : '不支持导出' }}
      </button>
    </div>

    <div class="relative mt-2">
      <!-- <textarea v-if="showPasteTextarea" v-model="pastePreset" class="absolute left--60 textarea textarea-md textarea-primary" placeholder="json"></textarea> -->
      <div class="tooltip-top w-full tooltip" data-tip="复制到输入框内会自动导入">
        <div class="w-full dropdown dropdown-left">
          <div tabindex="0" role="button" class="w-full btn btn-primary">
            导入预设
          </div>
          <div tabindex="0" class="dropdown-content z-[1] bg-base-100 p-2 shadow menu rounded-box">
            <textarea v-if="showPasteTextarea" v-model="pastePreset" class="textarea textarea-primary textarea-md" placeholder="json" />
          </div>
        </div>
      </div>
    </div>

    <button class="mb-2 mt-2 btn btn-primary" @click="exportImage">
      导出图片
    </button>
    <button class="btn btn-secondary" @click="resetCanvas">
      清空颜色
    </button>
  </div>

  <Toast ref="toast" />
</template>
