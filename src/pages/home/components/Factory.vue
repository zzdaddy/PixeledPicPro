<script lang="ts" setup>
import { onMounted, ref } from "vue";
import { useClipboard } from "@vueuse/core";
import { logger } from "@kirklin/logger";
import { downloadPNGForCanvas, getPixelColor } from "~/utils/canvas";
import { Rect, Canvas, Frame } from "leafer-ui";
import { LeaferController, MouseMode } from "./LeaferController";
import BtnClear from "~/assets/btn-clear.png";
import BtnDownload from "~/assets/btn-download.png";
import BtnSetting from "~/assets/btn-setting.png";
import BtnStart from "~/assets/btn-start.png";
// const permissionRead = usePermission('clipboard-read')
// const permissionWrite = usePermission('clipboard-write')
// 为何注释 ? 请看components的readme.md
// import Toast from '~/components/Toast/index.vue';
declare module "leafer-ui" {
  interface Rect {
    rectName?: string;
  }
}
const { isSupported, copy } = useClipboard();

type presetName = string;
enum Direction {
  TOP = "top",
  BOTTOM = "bottom",
  LEFT = "left",
  RIGHT = "right",
}
const Stage = ref();
const PixelRectFrame = ref();
const canvasContainerRef = ref();
const presetSelector = ref();
const fileInput = ref();
const toast = ref();
const GroundCanvas = ref(); // 背景的canvas图, 用来获取元素
const presetModal = ref();

const copyPreset = ref<string>("");
const pastePreset = ref<string>("");
const showPasteTextarea = ref<boolean>(true);
// 是否是填充模式
const isFillMode = ref<boolean>(false);
// 是否已经动态变更

const mode = ref("basic");
const colorConfig = ref(["#000000", "#ffffff", "#1e80ff", "#f53f3f"]);
const selectColor = ref(colorConfig.value[0]);
const baseRectSize = ref<number>(15);
const shapeTableRow = ref<number>(20); // xcount
const shapeTableCol = ref<number>(20); // ycount

// 图片像素化处理列表
const imgPixeledList = ref<any[]>([]);
const isLoadingImg = ref(false);

// 当前行/列/单元格大小是否已经发生了改变, 用于去更新本地预设
const isDynamicUpdate = computed(() => {
  let presetName = presetSelector?.value?.getValue() || "基础预设";
  let preset = awsomePreset.value.find((item) => item.name === presetName);
  return (
    shapeTableRow.value != preset?.cellConfig.yCount ||
    shapeTableCol.value != preset?.cellConfig.xCount ||
    baseRectSize.value != preset?.cellConfig.size
  );
});

// 优秀的预设, 包含颜色配置, 尺寸大小
const awsomePreset = ref([
  {
    name: "基础预设",
    cellConfig: {
      size: 10,
      border: 0.5,
      xCount: 10,
      yCount: 10,
    },
    colors: ["#000000", "#ffffff", "#1e80ff", "#f53f3f"],
  },
  {
    name: "IKUN",
    cellConfig: {
      size: 5,
      border: 0.5,
      xCount: 20,
      yCount: 20,
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
  Stage.value.removeStage();
  PixelRectFrame.value = null;
};

const resetGround = () => {
  imgPixeledList.value = [];
  fileInput.value.value = "";
  Stage.value.getGround() && Stage.value.getGround().removeAll();
  GroundCanvas.value = null;
};
const resetAndRebuildStage = () => {
  resetStage();
  resetGround();
  genPixelCanvasFrame();
};
// 画板, 画板是可交互区域
const genPixelCanvasFrame = () => {
  let width = Stage.value.getApp().width;
  let height = Stage.value.getApp().height;
  console.log(`生成Frame`);
  // 边框算在宽高之内，类似 border-box
  if (!PixelRectFrame.value) {
    PixelRectFrame.value = new Frame({
      x: width / 2,
      y: height / 2 - 100,
      width: shapeTableRow.value * baseRectSize.value,
      height: shapeTableCol.value * baseRectSize.value,
      overflow: "hide",
      // stroke: "#000",
      // strokeWidth: 0.5,
      shadow: {
        x: 0,
        y: 0,
        blur: 4,
        color: "rgba(0,0,0,0.5)",
      },
      fill: "transparent",
      draggable: false,
    });
  }
  genPixelCells();
};

// 根据配置生成方格子
const genPixelCells = () => {
  const cells = [];
  //   const { width, height, strokeWidth: border } = PixelRectFrame.value;
  for (let xIndex = 0; xIndex < shapeTableRow.value; xIndex++) {
    for (let yIndex = 0; yIndex < shapeTableCol.value; yIndex++) {
      const attrs = {
        x: baseRectSize.value * xIndex,
        y: baseRectSize.value * yIndex,
        width: baseRectSize.value,
        height: baseRectSize.value,
        fill: "rgba(255,255,255,0.75)",
        draggable: false,
        rectName: `${xIndex}-${yIndex}-pixel`,
      };
      const rect = new Rect(attrs);
      //   stage.addRect(rect, PixelRectFrame.value);

      cells.push(rect);
    }
  }

  Stage.value.addRects(cells, PixelRectFrame.value);
};

const getDynamicRectPostion = (
  direction: Direction,
  xIndex: number,
  yIndex: number
): { x: number; y: number } => {
  if (direction === Direction.TOP) {
    return {
      x: baseRectSize.value * xIndex,
      y: -(baseRectSize.value * (yIndex + 1)),
    };
  }
  if (direction === Direction.BOTTOM) {
    return {
      x: baseRectSize.value * xIndex,
      y: baseRectSize.value * (shapeTableCol.value + yIndex),
    };
  }

  if (direction === Direction.LEFT) {
    return {
      x: -(baseRectSize.value * (xIndex + 1)),
      y: baseRectSize.value * yIndex,
    };
  }

  if (direction === Direction.RIGHT) {
    return {
      x: baseRectSize.value * (shapeTableRow.value + xIndex),
      y: baseRectSize.value * yIndex,
    };
  }
  return {
    x: 0,
    y: 0,
  };
};

// 添加动态的 rect 或删除多余的rect
const setDynamicRects = (direction: Direction, count: number = 1) => {
  if (count < 0) {
    // 多余的rect
    let extraRects = [];
    switch (direction) {
      case Direction.TOP:
        extraRects = PixelRectFrame.value.children.filter((rect: Rect) => {
          let name = rect.rectName;
          let y = +name!.split("-")[1];
          return y < Math.abs(count);
        });
        break;
      case Direction.BOTTOM:
        extraRects = PixelRectFrame.value.children.filter((rect: Rect) => {
          let name = rect.rectName;
          let y = +name!.split("-")[1];
          return y >= shapeTableCol.value - Math.abs(count);
        });
        break;
      case Direction.LEFT:
        extraRects = PixelRectFrame.value.children.filter((rect: Rect) => {
          let name = rect.rectName;
          let x = +name!.split("-")[0];
          return x < Math.abs(count);
        });
        break;
      case Direction.RIGHT:
        extraRects = PixelRectFrame.value.children.filter((rect: Rect) => {
          let name = rect.rectName;
          let x = +name!.split("-")[0];
          return x >= shapeTableRow.value - Math.abs(count);
        });
        break;
    }
    // console.log(`extraRects`, extraRects);
    extraRects.forEach((rect: Rect) => {
      PixelRectFrame.value.remove(rect, true);
    });

    return;
  }
  let rects = [];
  let isYAxisUpdate =
    direction === Direction.TOP || direction === Direction.BOTTOM;
  let oneStripCellCount = isYAxisUpdate
    ? shapeTableRow.value
    : shapeTableCol.value;
  for (let i = 0; i < count; i++) {
    for (let j = 0; j < oneStripCellCount; j++) {
      let { x, y } = getDynamicRectPostion(
        direction,
        isYAxisUpdate ? j : i,
        isYAxisUpdate ? i : j
      );
      let attrs = {
        x,
        y,
        width: baseRectSize.value,
        height: baseRectSize.value,
        fill: "rgba(255,255,255,0.75)",
        draggable: false,
      };
      const rect = new Rect(attrs);
      rects.push(rect);
    }
  }

  Stage.value.addRects(rects, PixelRectFrame.value);
};
// 动态更新矩形块数量
// const dynamicUpdateRectTable = (direction: Direction, count: number = 1) => {
//   setDynamicRects(direction, count);
// };
// 增加宽高时，默认坐标轴方向增加
// 传入增加的方向和数量
// 容器内的矩形块，始终在左上角
const updatePixelAreaSize = (direction: Direction, count: number = 1) => {
  switch (direction) {
    case Direction.TOP:
      PixelRectFrame.value.height += baseRectSize.value * count;
      setDynamicRects(direction, count);
      shapeTableCol.value += count;
      // 子元素往下挪一个
      PixelRectFrame.value.children.forEach((rect: Rect) => {
        rect.y += baseRectSize.value * count;
      });

      break;
    case Direction.BOTTOM:
      // 容器高度++
      PixelRectFrame.value.height += baseRectSize.value * count;
      setDynamicRects(direction, count);
      shapeTableCol.value += count;
      // 子元素不必挪， 因为增加容器高度默认就是往下加
      break;
    case Direction.LEFT: // 容器高度++
      PixelRectFrame.value.width += baseRectSize.value * count;
      setDynamicRects(direction, count);
      // 子元素往下挪一个
      PixelRectFrame.value.children.forEach((rect: Rect) => {
        rect.x += baseRectSize.value * count;
      });

      shapeTableRow.value += count;
      break;
    case Direction.RIGHT:
      PixelRectFrame.value.width += baseRectSize.value * count;
      setDynamicRects(direction, count);
      shapeTableRow.value += count;
  }
  resetRectNames();
  PixelRectFrame.value.forceUpdate();
  console.log(`PixelRectFrame.value.height`, PixelRectFrame.value.height);
};

const resetRectNames = () => {
  // 每次变更后, 更新每个rect的name
  PixelRectFrame.value.children.forEach((rect: Rect, index: number) => {
    // 当前是第几列
    let x = Math.floor(rect.x / baseRectSize.value);
    // 当前是第几行
    let y = Math.floor(rect.y / baseRectSize.value);

    let rectName = `${x}-${y}-pixel`;
    // console.log(`rectName`, rectName);
    rect.rectName = rectName;
  });
};
// 更改鼠标模式
const changeMode = (e: any) => {
  const checked = e.target.checked;
  isFillMode.value = checked;
  mode.value = checked ? MouseMode.FILL : MouseMode.BASIC;
  Stage.value.setMouseMode(mode.value, PixelRectFrame.value);
};

// 更改当前颜色
const changeColor = (color: string) => {
  PixelRectFrame.value.cursor = "auto";
  console.log(`设置颜色`, color);
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
    // 设置当前配置
    baseRectSize.value = cellConfig.size;
    shapeTableCol.value = cellConfig.yCount;
    shapeTableRow.value = cellConfig.xCount;
    colorConfig.value = colors;
    resetAndRebuildStage();
    closePresetSetting();
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

// 加载本地配置 并加载基础预设
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
        applyAwsomePreset("基础预设");
      }
    } catch (err) {
      toast.value.show({
        msg: "本地预设加载失败",
        type: "error",
      });
      applyAwsomePreset("基础预设");
      return false;
    }
  } else {
    logger.info("无本地预设");
    applyAwsomePreset("基础预设");
  }
};

// 存本地
const saveLocalPreset = (newPresets: any[]) => {
  awsomePreset.value = newPresets.concat();
  // 存本地
  localStorage.setItem(
    "ZZSTUDIO_PPP_PRESETS",
    JSON.stringify(awsomePreset.value)
  );
};

// 把当前动态属性更新到预设上
const upodatePresetFromDynamicAttr = () => {
  let presetName = presetSelector?.value?.getValue() || "基础预设";
  let index = awsomePreset.value.findIndex((item) => item.name === presetName);
  if (index !== -1) {
    let config = awsomePreset.value[index].cellConfig;
    awsomePreset.value[index].cellConfig = {
      ...config,
      size: baseRectSize.value,
      yCount: shapeTableCol.value,
      xCount: shapeTableRow.value,
    };

    saveLocalPreset(awsomePreset.value);
    toast.value.show({
      type: "success",
      msg: "预设已更新到本地!",
    });
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
      saveLocalPreset(newPresets);
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

// 打开文件选择器
const openFileSelect = () => {
  fileInput.value.click();
};
const exportImage2 = () => {
  const { x, y, width, height } = PixelRectFrame.value;
  const canvas: Canvas = new Canvas({
    x,
    y,
    width,
    height,
  });
  // 导出时, 清除背景
  PixelRectFrame.value.children.forEach((rect: Rect) => {
    if (rect.fill === "rgba(255,255,255,0.75)") {
      rect.fill = "rgba(0,0,0,0)";
    }
  });
  // 只画, 不在页面呈现
  canvas.draw(PixelRectFrame.value);

  downloadPNGForCanvas(canvas.canvas.toDataURL() as string, "test.png");
  canvas.destroy();
};

const uploadFile = (e: any) => {
  isLoadingImg.value = true;
  let file = e.target.files[0];
  console.log(`正在绘图`, file);
  console.time();
  const img = new Image();

  const ratio = window.devicePixelRatio;
  const fileReader = new FileReader();
  fileReader.readAsDataURL(file);

  fileReader.onload = (readerEvent) => {
    img.src = readerEvent.target?.result as string;
    img.onload = () => {
      resetGround();
      const canvas: Canvas = new Canvas({
        x: 100,
        y: 100,
        width: img.width,
        height: img.height,
        stroke: "black",
        strokeWidth: 1,
      });
      GroundCanvas.value = canvas;
      const { context } = canvas;
      console.log(`img`, img.width, img.height);
      context.drawImage(img, 0, 0, img.width * ratio, img.height * ratio);

      Stage.value.getGround().add(canvas);

      imgPixeledList.value.push({
        // 已经绘制好图片的canvas对象
        canvas: canvas,
        // 目标像素容器
        targetFrame: PixelRectFrame.value,
      });

      isLoadingImg.value = false;

      startAutoPixeledImg();
      console.log(`绘图完成`);
      console.timeEnd();
      e.target.files = null;
    };
  };
};

// rectName = 0-0-pixel size 5 size 为 图片的size
// 获取一个正方形格子的中心点坐标值
const getRectCenterPoint = (rectName: string, size: number) => {
  const [row, col] = rectName.split("-");
  const ratio = window.devicePixelRatio;
  const x = (Number(row) + 0.5) * size * ratio;
  const y = (Number(col) + 0.5) * size * ratio;
  return { x, y };
};

// 根据图片大小和size, 重置行和列数
const resetFrameByImage = (canvas: Canvas) => {
  return {
    col: Math.ceil(canvas.height / baseRectSize.value),
    row: Math.ceil(canvas.width / baseRectSize.value),
  };
};
// 获取位置
const getPointPositions = (canvas: Canvas) => {
  const pointsConfig = [];
  // TODO 确保整个图片都被采集到, 用长边除方格
  // const size = canvas.width
  // 取色个数为 x轴 就是 图片宽 / 像素x数  y轴个数 图片高 / 像素y数  然后再取中间点
  for (let x = 0; x < shapeTableRow.value; x++) {
    for (let y = 0; y < shapeTableCol.value; y++) {
      // 对应的recName, 取点的位置, 取后色值
      let rectName = `${x}-${y}-pixel`;
      let pointConfig = {
        rectName,
        pointPosition: getRectCenterPoint(rectName, baseRectSize.value),
        color: "",
      };
      pointsConfig.push(pointConfig);
    }
  }

  return pointsConfig;
};

const getPixelColorByPoint = (
  canvas: Canvas,
  position: { x: number; y: number }
) => {
  try {
    let colors = getPixelColor(canvas, position.x, position.y);
    return colors.rgba;
  } catch (err) {
    return "#000000";
  }
};
// 取点逻辑, 每个格子先取一个点, 测试
// 先根据图片, 自动把像素格调整为对应大小
// 组装图片的取色点和像素格之间的映射关系
const startAutoPixeledImg = async () => {
  imgPixeledList.value.forEach((config) => {
    // let parsePoints = [];
    // const { canvas, targetFrame, shapeTableConfig } = config;
    const { col, row } = resetFrameByImage(config.canvas);
    console.log(`根据图片大小, 调整行x列为 => ${row} x ${col}`);
    shapeTableCol.value = col;
    shapeTableRow.value = row;
    resetStage();
    genPixelCanvasFrame();
    // resetAndRebuildStage();

    const pointsConfig = getPointPositions(config.canvas);
    const rectColorMap: any = {};
    pointsConfig.forEach((item) => {
      item.color = getPixelColorByPoint(config.canvas, item.pointPosition);
      rectColorMap[item.rectName] = item.color;
    });
    // 优化 先转map 再用children直接填色   1800ms => 80ms
    PixelRectFrame.value.children.forEach((rect: Rect) => {
      rect.fill = rectColorMap[rect.rectName as string];
    });
    // console.log(PixelRectFrame.value.children);
    // const rect = Stage.value.getStage().findOne((rect: Rect) => {
    //     return rect.rectName === item.rectName ? 1 : 0;
    //   });
    //   rect && (rect.fill = item.color);
    // console.log("pointsConfig", pointsConfig);
  });
};
const showPresetSetting = () => {
  presetModal.value.openModal();
};
const closePresetSetting = () => {
  presetModal.value.closeModal();
};

// 橡皮擦, 即设置成一个特殊的颜色, 导出时清除即可
const setClearFillConfig = () => {
  // 自定义svg鼠标样式时, 16x16比较符合原始鼠标图标尺寸
  if (PixelRectFrame.value.cursor === "cell") {
    changeColor(colorConfig.value[0]);
  } else {
    PixelRectFrame.value.cursor = "cell";
    Stage.value.setFillConfig("color", "rgba(255,255,255,0.75)");
  }
};

// 重新生成
const rerunAutoPixeled = () => {
  console.time();
  resetStage();
  genPixelCanvasFrame();
  startAutoPixeledImg();
  console.timeEnd();
};
onMounted(() => {
  initByLeafer();
  bindKeyboardEvent();
  loadLocalPreset();
  genPixelCanvasFrame();
});
</script>

<template>
  <div ref="canvasContainerRef" id="canvasContainerRef" class="flex-1" />

  <div class="top-action-bar flex flex-nowrap fixed top-17 right-8 w-180 h-8">
    <ZButton
      tooltip="导入图片自动生成"
      :imgSrc="BtnSetting"
      btnText="图片"
      @tap="openFileSelect"
      btnClass="btn-primary mr-2"
    />
    <ZButton
      tooltip="会根据图片和单元格大小重新构造"
      :imgSrc="BtnSetting"
      btnText="重构"
      @tap="rerunAutoPixeled"
      btnClass="btn-primary mr-2"
    />
    <div class="divider divider-horizontal"></div>

    <ZModal ref="presetModal">
      <ZButton
        tooltip="打开预设面板"
        :imgSrc="BtnSetting"
        btnText="预设"
        btnClass="btn-primary mr-2"
        @tap="showPresetSetting"
      />
      <template #content>
        <!-- <h3 class="font-bold text-lg">全部预设</h3> -->
        <div class="overscroll-y-auto flex flex-wrap gap-2">
          <div
            class="tooltip-top w-full tooltip"
            data-tip="复制到输入框内会自动导入"
          >
            <div class="w-30 dropdown dropdown-left">
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
          <template v-for="config in awsomePreset">
            <div class="card w-1/4 bg-base-100 shadow-xl">
              <figure>
                <div class="colors flex w-auto h-20 overflow-hidden">
                  <div
                    class="w-10 h-10"
                    v-for="color in config.colors"
                    :style="{ backgroundColor: color }"
                  ></div>
                </div>
              </figure>
              <div class="card-body">
                <h2 class="card-title">
                  {{ config.name }}
                  <div class="badge badge-secondary">NEW</div>
                </h2>
                <p>
                  单元格(方格)
                  <span class="text-primary font-bold text-xl">{{
                    `${config.cellConfig.size} x ${config.cellConfig.size}`
                  }}</span>
                  px
                </p>
                <p>
                  单元格数量
                  <span class="text-primary font-bold text-xl">{{
                    `${config.cellConfig.xCount} x ${config.cellConfig.yCount}`
                  }}</span>
                  个
                </p>
                <div class="card-actions justify-end">
                  <button class="btn btn-sm btn-accent" @click="exportPreset">
                    {{ isSupported ? "复制" : "不支持复制" }}
                  </button>
                  <button
                    class="btn btn-sm btn-primary"
                    @click="() => applyAwsomePreset(config.name)"
                  >
                    使用
                  </button>
                </div>
              </div>
            </div>
          </template>
        </div>
      </template>
    </ZModal>
    <ZButton
      tooltip="按设置生成画板(会清空颜色)"
      :imgSrc="BtnStart"
      btnText="生成"
      @tap="resetAndRebuildStage"
      btnClass="btn-primary mr-2"
    />
    <ZButton
      tooltip="下载无背景png图片"
      :imgSrc="BtnDownload"
      btnText="下载"
      @tap="exportImage2"
      btnClass="btn-primary mr-2"
    />
    <ZButton
      tooltip="清空所有填色"
      :imgSrc="BtnClear"
      btnText="清除"
      @tap="resetAndRebuildStage"
      btnClass="btn-secondary"
    >
    </ZButton>
  </div>
  <div
    class="right-action-bar fixed right-[30px] top-[130px] z-999 max-w-40 flex flex-col"
  >
    <!-- <ZSelect
      ref="presetSelector"
      title="优秀预设"
      :options="awsomePreset"
      @change="selectPreset"
    /> -->
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
    <div>
      <input
        v-model="baseRectSize"
        type="number"
        placeholder="尺寸"
        class="mr-2 max-w-xs w-16 text-4 text-primary font-bold input input-sm"
      />
      <span class="text-sm">(正方格-px)</span>
    </div>
    <div class="countxy mt-2 flex items-center justify-center">
      <input
        v-model="shapeTableRow"
        type="number"
        placeholder="横"
        class="mr-2 max-w-xs w-16 text-4 text-primary font-bold input input-sm"
      />
      <span> X </span>
      <input
        v-model="shapeTableCol"
        type="number"
        placeholder="纵"
        class="ml-2 max-w-xs w-16 text-4 text-primary font-bold input input-sm"
      />
    </div>
    <div class="flex justify-center w-full tooltip" data-tip="增减顶部的行">
      <kbd class="kbd" @click="updatePixelAreaSize(Direction.TOP, 1)">▲</kbd>
      <kbd class="kbd" @click="updatePixelAreaSize(Direction.TOP, -1)">▼</kbd>
    </div>
    <div class="flex justify-center gap-20 w-full">
      <div class="tooltip" data-tip="增减左侧的列">
        <kbd class="kbd" @click="updatePixelAreaSize(Direction.LEFT, 1)"
          >◀︎</kbd
        >
        <kbd class="kbd" @click="updatePixelAreaSize(Direction.LEFT, -1)"
          >▶︎</kbd
        >
      </div>
      <div class="tooltip" data-tip="增减右侧的列">
        <kbd class="kbd" @click="updatePixelAreaSize(Direction.RIGHT, -1)"
          >◀︎</kbd
        >
        <kbd class="kbd" @click="updatePixelAreaSize(Direction.RIGHT, 1)"
          >▶︎</kbd
        >
      </div>
    </div>
    <div class="flex justify-center w-full tooltip" data-tip="增减底部的行">
      <kbd class="kbd" @click="updatePixelAreaSize(Direction.BOTTOM, -1)"
        >▲</kbd
      >
      <kbd class="kbd" @click="updatePixelAreaSize(Direction.BOTTOM, 1)">▼</kbd>
    </div>
    <button class="btn btn-accent btn-sm" @click="setClearFillConfig">
      橡皮擦
    </button>
    <input
      type="file"
      ref="fileInput"
      class="file-input file-input-bordered file-input-sm file-input-primary h-0"
      @change="uploadFile"
    />
    <textarea
      v-show="false"
      v-model="copyPreset"
      class="absolute left--60 textarea textarea-primary textarea-md"
      placeholder="json"
    />
    <!-- <div class="relative">
      <textarea
        v-show="false"
        v-model="copyPreset"
        class="absolute left--60 textarea textarea-primary textarea-md"
        placeholder="json"
      />
      <button class="mt-2 w-full btn btn-primary" @click="exportPreset">
        {{ isSupported ? "导出预设" : "不支持导出" }}
      </button>
    </div> -->

    <div class="relative mt-2">
      <!-- <textarea v-if="showPasteTextarea" v-model="pastePreset" class="absolute left--60 textarea textarea-md textarea-primary" placeholder="json"></textarea> -->
    </div>

    <!-- <button class="flex bg-transparent" @click="exportImage2"></button> -->
    <!-- <button class="flex bg-transparent" @click="resetAndRebuildStage"></button> -->

    <!-- <button class="mb-2 mt-2 btn btn-primary" @click="importImage">
      导入图片
    </button> -->

    <!-- <button
      class="btn btn-secondary"
      @click="updatePixelAreaSize(Direction.TOP)"
    >
      TOP++
    </button>
    <button
      class="btn btn-secondary"
      @click="updatePixelAreaSize(Direction.BOTTOM)"
    >
      Bottom++
    </button>
    <button
      class="btn btn-secondary"
      @click="updatePixelAreaSize(Direction.LEFT)"
    >
      left++
    </button>
    <button
      class="btn btn-secondary"
      @click="updatePixelAreaSize(Direction.RIGHT)"
    >
      right++
    </button> -->
    <!-- <button class="btn btn-secondary btn-xs" @click="rerunAutoPixeled">
      重新生成
    </button> -->
    <button
      v-if="isDynamicUpdate"
      class="btn btn-secondary"
      @click="upodatePresetFromDynamicAttr"
    >
      保存预设
    </button>
  </div>

  <ZToast ref="toast" />
</template>
