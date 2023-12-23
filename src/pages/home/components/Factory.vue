<script lang="ts" setup>
import { nextTick, onMounted, reactive, ref } from "vue";
import { useClipboard } from "@vueuse/core";
import { logger } from "@kirklin/logger";
import { downloadPNGForCanvas } from "~/utils/canvas";
import { Rect, Canvas, UI, Frame, Box, PointerEvent } from "leafer-ui";
import { LeaferController, MouseMode } from "./LeaferController";
// const permissionRead = usePermission('clipboard-read')
// const permissionWrite = usePermission('clipboard-write')
// 为何注释 ? 请看components的readme.md
// import Toast from '~/components/Toast/index.vue';

const { isSupported, copy } = useClipboard();

type presetName = string;

const Stage = ref();
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
  border: 0.5, // 边框宽度
  xCount: 10, // 横向有几个
  yCount: 10, // 纵向有几个
});

// 优秀的预设, 包含颜色配置, 尺寸大小
const awsomePreset = ref([
  {
    name: "基础预设",
    cellConfig: {
      size: 5,
      border: 0.5,
      xCount: 12,
      yCount: 12,
    },
    colors: ["#000000", "#ffffff", "#1e80ff", "#f53f3f"],
  },
  {
    name: "IKUN",
    cellConfig: {
      size: 5,
      border: 0.5,
      xCount: 15,
      yCount: 24,
    },
    colors: [
      "#564A54",
      "#DDDBED",
      "#1C1A25",
      "#DDB3C0",
      "#908B96",
      "#CC7A76",
      "#ffffff",
    ],
  },
]);

// 清空画布
const resetStage = () => {
  isFillMode.value = false;
  mode.value = MouseMode.BASIC;
  Stage.value.getStage() && Stage.value.getStage().removeAll();
};
// 画板, 画板是可交互区域
const genPixelCanvasFrame = () => {
  resetStage();
  let width = Stage.value.getApp().width;
  let height = Stage.value.getApp().height;

  // 边框算在宽高之内，类似 border-box
  PixelRectGroup.value = new Frame({
    x: width / 2,
    y: height / 2 - 100,
    width: basicCellConfig.xCount * basicCellConfig.size,
    height: basicCellConfig.yCount * basicCellConfig.size,
    // stroke: "#000",
    // strokeWidth: 0.5,
    shadow: {
      x: 0,
      y: 0,
      blur: 4,
      color: "#FF0000AA",
    },
    fill: "transparent",
    draggable: false,
  });

  genPixelCells();
};

// 根据配置生成方格子
const genPixelCells = () => {
  const cells = [];
  //   const { width, height, strokeWidth: border } = PixelRectGroup.value;
  for (let xIndex = 0; xIndex < basicCellConfig.xCount; xIndex++) {
    for (let yIndex = 0; yIndex < basicCellConfig.yCount; yIndex++) {
      const attrs = {
        x: basicCellConfig.size * xIndex,
        y: basicCellConfig.size * yIndex,
        width: basicCellConfig.size,
        height: basicCellConfig.size,
        fill: "white",
        draggable: false,
      };
      const rect = new Rect(attrs);
      //   stage.addRect(rect, PixelRectGroup.value);

      cells.push(rect);
    }
  }

  Stage.value.addRects(cells, PixelRectGroup.value);
};

// 更改鼠标模式
const changeMode = (e: any) => {
  const checked = e.target.checked;
  isFillMode.value = checked;
  mode.value = checked ? MouseMode.FILL : MouseMode.BASIC;
  Stage.value.setMouseMode(mode.value, PixelRectGroup.value);
};

// 更改当前颜色
const changeColor = (color: string) => {
  selectColor.value = color;
  // let colors = colorConfig.value.filter(item => item !== color)
  // colorConfig.value = [color, ...colors];

  Stage.value.setFillConfig("color", selectColor.value);
};

const selectPreset = (name: presetName) => {
  console.log(`name`, name);
  applyAwsomePreset(name);
};

// 检查preset是否合法
const checkPreset = (preset: any) => {
  const checkKeys = ["name", "colors", "cellConfig"];
  if (checkKeys.every((key) => preset.hasOwnProperty(key))) {
    if (
      typeof preset.name === "string" &&
      Array.isArray(preset.colors) &&
      preset.cellConfig instanceof Object
    ) {
      return true;
    }
  }

  toast.value.show({
    msg: "预设不合法, 请检查后重试",
    type: "error",
  });
  return false;
};

const applyAwsomePreset = (name: presetName) => {
  logger.info(`切换预设 =>${name}`);
  const preset = awsomePreset.value.find((item) => item.name === name);
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
};

const exportPreset = () => {
  if (isSupported) {
    copy(copyPreset.value);
    toast.value.show({
      type: "success",
      msg: "已复制到剪切板!",
    });
  }
};

const filterNoRepeatPresets = (presets: any[]) => {
  const newPresets: any[] = [];
  presets.forEach((item: any) => {
    // 如果不存在, push
    if (newPresets.findIndex((preset) => preset.name === item.name) === -1) {
      newPresets.push(item);
    }
  });
  return newPresets;
};

// 加载本地配置
const loadLocalPreset = () => {
  const localPresets = localStorage.getItem("ZZSTUDIO_PPP_PRESETS");
  if (localPresets) {
    try {
      const presets = JSON.parse(localPresets);
      // 检测合法性, 没问题的话, 直接应用
      if (presets.every((preset: any) => checkPreset(preset))) {
        // 去重, name一样会被去掉, 本地优先
        const newPresets = filterNoRepeatPresets(
          presets.concat(awsomePreset.value)
        );
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
};

// 监听 -> 应用 -> 存本地
watch(pastePreset, (json) => {
  try {
    const preset = JSON.parse(json);
    // 检测合法性, 没问题的话, 直接应用
    if (checkPreset(preset)) {
      // 去重
      const newPresets = filterNoRepeatPresets(
        awsomePreset.value.concat(preset)
      );
      awsomePreset.value = newPresets.concat();
      // 存本地
      localStorage.setItem(
        "ZZSTUDIO_PPP_PRESETS",
        JSON.stringify(awsomePreset.value)
      );
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
const bindKeyboardEvent = () => {
  window.addEventListener("keydown", (e) => {
    if (e.code === "Backquote") {
      let index = colorConfig.value.findIndex(
        (color) => color === selectColor.value
      );
      index = index >= colorConfig.value.length - 1 ? 0 : index + 1;
      changeColor(colorConfig.value[index]);
    }
  });
};

const initByLeafer = () => {
  Stage.value = new LeaferController(canvasContainerRef);
};

const exportImage2 = () => {
  const { x, y, width, height } = PixelRectGroup.value;
  const canvas: Canvas = new Canvas({
    x,
    y,
    width,
    height,
  });
  // 只画, 不在页面呈现
  canvas.draw(PixelRectGroup.value);
  downloadPNGForCanvas(canvas.canvas.toDataURL() as string, "test.png");
  canvas.destroy();
};
onMounted(() => {
  initByLeafer();
  genPixelCanvasFrame();
  //   initStage();
  bindKeyboardEvent();
  //   genRectPixelBox();
  loadLocalPreset();
});
</script>

<template>
  <div ref="canvasContainerRef" id="canvasContainerRef" class="flex-1" />

  <div class="fixed right-[30px] top-[130px] z-999 max-w-40 flex flex-col">
    <button class="mb-2 btn btn-primary btn-md" @click="genPixelCanvasFrame">
      生成!(会清空)
    </button>
    <Select
      ref="presetSelector"
      title="优秀预设"
      :options="awsomePreset"
      @change="selectPreset"
    />
    <div class="mouse-mode mt-2 flex items-center justify-center">
      <span :class="[!isFillMode ? 'font-500 text-xl' : '']">标准</span
      ><input
        type="checkbox"
        class="toggle"
        :checked="isFillMode"
        @change="changeMode"
      />
      <span :class="[isFillMode ? 'font-500 text-xl' : '']">填充</span>
    </div>
    <!-- <div class="setting mt-2">
      <span class="text-sm font-500">导出去边框</span
      ><input
        type="checkbox"
        class="toggle"
        :checked="isClearBorder"
        @change="setBorderVisibleForExport"
      />
    </div> -->
    <div
      class="color-picker mt-2 min-h-18 flex flex-wrap items-end border border-primary border-dashed p-1"
    >
      <div
        v-for="color in colorConfig"
        class="mb-1 mr-1 h-4 w-4 border border-accent-content transition"
        :class="[selectColor === color ? 'w-8 h-8' : '']"
        :style="{ backgroundColor: color }"
        @click="changeColor(color)"
      />
    </div>
    <div class="countxy mt-2 flex items-center justify-center">
      <input
        v-model="basicCellConfig.xCount"
        type="text"
        placeholder="横"
        class="mr-2 max-w-xs w-12 text-4 text-primary font-bold input input-sm"
      />
      <span> X </span>
      <input
        v-model="basicCellConfig.yCount"
        type="text"
        placeholder="纵"
        class="ml-2 max-w-xs w-12 text-4 text-primary font-bold input input-sm"
      />
    </div>
    <div class="relative">
      <textarea
        v-show="false"
        v-model="copyPreset"
        class="absolute left--60 textarea textarea-primary textarea-md"
        placeholder="json"
      />
      <button class="mt-2 w-full btn btn-primary" @click="exportPreset">
        {{ isSupported ? "导出预设" : "不支持导出" }}
      </button>
    </div>

    <div class="relative mt-2">
      <!-- <textarea v-if="showPasteTextarea" v-model="pastePreset" class="absolute left--60 textarea textarea-md textarea-primary" placeholder="json"></textarea> -->
      <div
        class="tooltip-top w-full tooltip"
        data-tip="复制到输入框内会自动导入"
      >
        <div class="w-full dropdown dropdown-left">
          <div tabindex="0" role="button" class="w-full btn btn-primary">
            导入预设
          </div>
          <div
            tabindex="0"
            class="dropdown-content z-[1] bg-base-100 p-2 shadow menu rounded-box"
          >
            <textarea
              v-if="showPasteTextarea"
              v-model="pastePreset"
              class="textarea textarea-primary textarea-md"
              placeholder="json"
            />
          </div>
        </div>
      </div>
    </div>

    <button class="mb-2 mt-2 btn btn-primary" @click="exportImage2">
      导出图片
    </button>
    <button class="btn btn-secondary" @click="genPixelCanvasFrame">
      清空颜色
    </button>
  </div>

  <Toast ref="toast" />
</template>
