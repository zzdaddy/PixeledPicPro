<template>
  <div class="flex-1" ref="canvasContainerRef">
  </div>

  <div class="fixed flex flex-col right-[30px] top-[200px]">
    <div class="mouse-mode flex justify-center items-center">
        <span :class="[!isFillMode ? 'font-500 text-xl' : '']">标准</span><input type="checkbox" class="toggle" :checked="isFillMode" @change="changeMode"/> <span :class="[isFillMode ? 'font-500 text-xl' : '']">填充</span>
    </div>
    <div class="color-picker flex flex-wrap items-end mt-2">
        <div v-for="color in colorConfig" class="border border-accent-content
 w-4 h-4 mr-1 transition" :class="[selectColor === color ? 'w-8 h-8' : '']" :style="{backgroundColor: color}" @click="changeColor(color)">
        </div>
    </div>
    <button @click="exportImage" class="btn btn-primary mt-2 mb-2">导出图片</button>
    <!-- <button @click="exportImage" class="btn btn-primary mb-2">生成格子</button> -->
    <button @click="resetCanvas" class="btn btn-secondary">清空颜色</button>
  </div>
</template>
<script lang="ts" setup>
import { onMounted, reactive, nextTick, ref } from 'vue'
import Konva from 'konva'
import { downloadPNGForCanvas } from '~/utils/canvas'
import { AppStage } from './AppStage'
const Stage = ref()
const PixelRect = ref()
const PixelRectGroup = ref()
const canvasContainerRef = ref()
// 是否是填充模式
const isFillMode = ref<boolean>(false)
const mode = ref('basic')
const colorConfig = ref(['#000000', '#ffffff', '#1e80ff', '#f53f3f'])
const selectColor = ref(colorConfig.value[0])
const basicCellConfig = reactive({
  size: 5, // 单个格子宽高
  border: 1, // 边框宽度
  xCount: 12, // 横向有几个
  yCount: 12, // 纵向有几个
})

// 初始化画布
const initStage = async () => {
  Stage.value = new AppStage(canvasContainerRef, {
    isInitTransformer: false,
    isAllowMouseSelectShapes: false,
    scale: true,
  })

  Stage.value.setFillConfig({
    color: selectColor.value
    })
}

// 生成矩形框+方格子
const genRectPixelBox = () => {
  PixelRectGroup.value = new Konva.Group({
    x: 500,
    y: 200,
    draggable: false,
  })
  // 矩形的x.y是相对于group的
  PixelRect.value = new Konva.Rect({
    x: 0,
    y: 0,
    width: basicCellConfig.xCount * basicCellConfig.size,
    height: basicCellConfig.yCount * basicCellConfig.size,
    id: 'pixel-container',
    fill: 'white',
    stroke: 'black',
    strokeWidth: 0,
    draggable: false,
  })
  console.log(`PixelRect`, PixelRect.value)
  Stage.value.createShapesByGroup(PixelRectGroup.value, PixelRect.value)
  Stage.value.setScaleControler(PixelRectGroup.value)
  Stage.value.setDrawControler(PixelRectGroup.value)

  genPixelBoxCells()
  //   Stage.value.createShape(rect)

  //   console.log('查找我的原型', Stage.value.findShape('#my-circle'))
}

// 根据配置生成方格子
const genPixelBoxCells = () => {
  let { x, y, strokeWidth: border } = PixelRect.value?.getAttrs()
  let cells = []
  for (let xIndex = 0; xIndex < basicCellConfig.xCount; xIndex++) {
    for (let yIndex = 0; yIndex < basicCellConfig.yCount; yIndex++) {
      let attrs = {
        x: x + border + basicCellConfig.size * xIndex,
        y: y + border + basicCellConfig.size * yIndex,
        width: basicCellConfig.size,
        height: basicCellConfig.size,
        strokeWidth: basicCellConfig.border,
        stroke: 'black',
        fill: 'white',
        name: `fillnode-${xIndex}-${yIndex}`,
        draggable: false,
      }
      let rect = new Konva.Rect(attrs)
      cells.push(rect)
    }
  }
  console.log(`cells.length`, cells.length)

  Stage.value.createShapesByGroup(PixelRectGroup.value, cells)
}

// 清空画布
const resetCanvas = () => {
  Stage.value.clearFilledRects()
}
// 导出图片
const exportImage = () => {
  // 缩放回原始大小
  PixelRectGroup.value.scaleX(1)
  PixelRectGroup.value.scaleY(1)
  Stage.value.batchDraw()
  nextTick(() => {
    // 获取位置
    let { x, y } = PixelRectGroup.value.absolutePosition()
    let { width, height } = PixelRect.value.getAttrs()
    let dataURL = Stage.value.toDataURL({
      x,
      y,
      width,
      height,
      pixelRatio: window.devicePixelRatio,
    })
    downloadPNGForCanvas(dataURL, '测试')
  })
}

// 更改鼠标模式
const changeMode = (e:any) => {
    console.log(`mode`, e.target.checked)
    let checked = e.target.checked;
    isFillMode.value = checked
//   console.log(`this.mode`, mode.value)
    mode.value = checked ? 'fill' : 'basic'
  Stage.value.switchMouseMode(mode.value)
  // 监听填充动作
  Stage.value.listenAndAssignTask()
}

// 更改当前颜色
const changeColor = (color: string) => {
    selectColor.value = color;
    // let colors = colorConfig.value.filter(item => item !== color)
    // colorConfig.value = [color, ...colors];

    Stage.value.setFillConfig({
        color: selectColor.value
    })
}

// 绑定键盘事件
const bindKeyboardEvent = () => {
    window.addEventListener("keydown", (e) => {
      if (e.code === "Tab") {
        let index = colorConfig.value.findIndex(color => color === selectColor.value)
        index = index >= colorConfig.value.length - 1 ? 0 : index+1
        changeColor(colorConfig.value[index])
      }
      e.preventDefault();
    });
}

onMounted(() => {
  initStage()
  bindKeyboardEvent()
  genRectPixelBox()
})
</script>
