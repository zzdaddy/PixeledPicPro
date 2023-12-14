import type { Ref } from "vue";
import Konva from "konva";

// canvas容器属性
interface CanvasWindow {
  width: number;
  height: number;
}

// 导入图片配置项
interface ImageConfig {
  initMaxWidth: number;
  initMaxHeight: number;
}

interface RectSelectorPosition {
  x1: number; // 起始x
  x2: number; // 当前x
  y1: number;
  y2: number;
}

interface FillConfig {
  color: string;
}

type FillStatus = "none" | "filling" | "done";
interface AppStageConfig {
  isInitTransformer?: boolean; // 是否启用控件系统
  isAllowMouseSelectShapes?: boolean; // 是否开启鼠标框选
  hasAnimateShapes?: boolean; // 是否需要动画层
  isInitKeyboardEvents?: boolean;
  mouseMode?: MouseMode;
  width?: number;
  height?: number;
  scale?: boolean;
  scaleMember?: any; // 需要被缩放的成员, 默认是layer
}

type layerName = "base" | "animate";
type MouseMode = "basic" | "draw" | "clip" | "fill";
export type ZIndexMoveMode = "up" | "down" | "top" | "bottom";
export class AppStage {
  // vue dom ref
  containerRef: HTMLDivElement;
  stage!: Konva.Stage;
  canvasWindow: CanvasWindow;
  baseLayer!: Konva.Layer;
  baseGroup!: Konva.Group;
  animateLayer!: Konva.Layer;
  rectSelector!: Konva.Rect;
  exportRectSelector!: Konva.Rect;
  mouseMode: MouseMode = "basic";
  importImageConfig: ImageConfig;
  rectSelectorPosition: RectSelectorPosition = {
    x1: 0,
    x2: 0,
    y1: 0,
    y2: 0,
  };

  fillConfig?: FillConfig;
  fillStatus?: FillStatus;
  scaleMember: any; // 可缩放对象, 设置鼠标滚动缩放的对象, 默认为layer
  drawTaget: any; // 绘图对象, 只能在指定的对象上绘图
  //   layers: Array<any>
  constructor(
    ref: Ref,
    options: AppStageConfig = {
      isInitTransformer: true,
      isAllowMouseSelectShapes: true,
      hasAnimateShapes: false,
      isInitKeyboardEvents: true,
      mouseMode: "basic",
      scale: false,
      scaleMember: null,
    },
  ) {
    this.containerRef = ref.value;
    this.canvasWindow = {
      width: options.width || ref.value.clientWidth,
      height: options.height || ref.value.clientHeight,
    };
    const defaultImportImageConfig: ImageConfig = {
      initMaxHeight: Math.floor(this.canvasWindow.height / 2),
      initMaxWidth: Math.floor(this.canvasWindow.width / 2),
    };

    this.importImageConfig = defaultImportImageConfig;
    // 初始化画板
    this.init(options);
    // 添加进一个基础图层
    this.createBaseLayer();
    // 创建动画层
    if (options.hasAnimateShapes) {
      this.createAnimateLayer();
    }

    // 分配鼠标全局事件
    if (options.isAllowMouseSelectShapes) {
      this.listenAndAssignTask(null);
    }

    // 绑定选择器
    if (options.isInitTransformer) {
      this.bindStageTransformerToggle();
    }

    // 绑定键盘事件
    if (options.isInitKeyboardEvents) {
      this.bindKeyboardEvent();
    }

    // 是否可缩放 stage
    if (options.scale) {
      this.setScaleControler(options.scaleMember || this.baseLayer);
      this.listenScaleEvent();
    }
  }

  // 初始化画板
  init(options: AppStageConfig) {
    console.log(
      `初始化容器为: ${this.canvasWindow.width} x ${this.canvasWindow.height}`,
    );
    this.stage = new Konva.Stage({
      container: this.containerRef,
      width: this.canvasWindow.width,
      height: this.canvasWindow.height,
      id: "baseStage",
      draggable: options.scale,
    });
  }

  // 设置缩放对象
  setScaleControler(member = this.baseLayer) {
    // 初始化缩放对象
    this.scaleMember = member;
  }

  // 设置绘图对象 (在什么上可绘制) 目前实现涂色功能
  setDrawControler(target: any) {
    // 设置绘图对象
    this.drawTaget = target;
  }

  setFillConfig(config: FillConfig) {
    this.fillConfig = config;
  }

  updateContainer(attrs: any) {
    this.stage.setAttrs({
      ...attrs,
    });
    console.log(`画布大小变化 => ${attrs.width} x ${attrs.height}`);
  }

  createBaseLayer() {
    const layer = new Konva.Layer();
    this.baseLayer = layer;
    this.stage.add(layer);
  }

  draw(layerName: layerName = "base") {
    if (layerName === "base") {
      this.baseLayer.draw();
    }
    if (layerName === "animate") {
      this.animateLayer.draw();
    }
  }

  batchDraw(layerName: layerName = "base") {
    if (layerName === "base") {
      this.baseLayer.batchDraw();
    }
    if (layerName === "animate") {
      this.animateLayer.batchDraw();
    }
  }

  // 创建动画层 暂时没有用到
  createAnimateLayer() {
    const layer = new Konva.Layer();
    this.animateLayer = layer;
    this.stage.add(layer);
  }

  // 控件
  // TS Konva.Node
  createTransformer(node: any) {
    const transformer = new Konva.Transformer();
    this.baseLayer.add(transformer);
    transformer.nodes([].concat(node));
    this.baseLayer.draw();
  }

  // 创建图形
  createShape(shape: any) {
    if (!shape) {
      return;
    }
    const shapes = [].concat(shape);
    shapes.forEach((item: any) => {
      if (!item.name) {
        item.name("common-shape");
      }
    });
    // console.log(`增加图形 name:[${shape.name()}]`)
    this.baseLayer.add(...shapes);
    this.draw();
  }

  createShapesByGroup(group: any, shape: any) {
    if (!group || !shape) {
      return;
    }
    const shapes = [].concat(shape);
    group.add(...shapes);
    this.baseLayer.add(group);
    this.batchDraw();
  }

  // 删除图形
  removeNodes() {
    const transformers = this.stage.find("Transformer");
    if (!transformers.length) {
      return;
    }
    // @ts-expect-error
    transformers.forEach((tranformer: Konva.Transformer) => {
      tranformer.nodes().forEach((node) => {
        node?.remove();
      });
      tranformer.destroy();
    });
  }

  clearAllBaseShapes() {
    console.log(`删除图层并重建`)
    // clear不会清除node
    this.baseLayer.destroy();
    this.createBaseLayer();
    // this.draw()
  }

  /**
   *
   * @param imgUrl file url
   * @param curIndex 当前渲染的图片索引  默认是第一张 后面的图片错位排开
   * @returns 图片实例
   */
  importImage(imgUrl: string, curIndex: number = 1) {
    return new Promise((resolve, reject) => {
      const imageObj = new Image();
      imageObj.src = imgUrl;
      const x = 0 + curIndex * 50;
      const y = 0 + curIndex * 50;
      imageObj.onload = () => {
        let width = imageObj.width;
        let height = imageObj.height;
        if (width > this.importImageConfig.initMaxWidth) {
          // 缩小比例
          const downRatio = this.importImageConfig.initMaxWidth / width;
          width = this.importImageConfig.initMaxWidth;
          height = height * downRatio;
        }

        if (height > this.importImageConfig.initMaxHeight) {
          // 缩小比例
          const downRatio = this.importImageConfig.initMaxHeight / height;
          height = this.importImageConfig.initMaxHeight;
          width = width * downRatio;
        }

        const imageShape = new Konva.Image({
          x,
          y,
          image: imageObj,
          width,
          height,
          draggable: true,
          name: "common-shape",
        });

        this.baseLayer.add(imageShape);
        this.draw();
        resolve(imageShape);
      };
    });
  }

  setTransformerZIndex(mode: ZIndexMoveMode = "top") {
    const transformers = this.stage.find("Transformer");
    if (!transformers.length) {
      return;
    }
    // moveUp moveDown moveToBottom moveToTop
    // @ts-expect-error 忽略ts检测
    transformers.forEach((item: Konva.Transformer) => {
      item.nodes().forEach((node: Konva.Node) => {
        switch (mode) {
          case "up":
            node.moveUp();
            break;
          case "down":
            node.moveDown();
            break;
          case "top":
            node.moveToTop();
            break;
          case "bottom":
            node.moveToBottom();
            break;
        }
      });
    });
    this.draw();
  }

  findShape(selector: string) {
    return this.stage.findOne(selector);
  }

  findShapes(selector: string) {
    return this.stage.find(selector);
  }

  // 绑定键盘事件
  bindKeyboardEvent() {
    window.addEventListener("keydown", (e) => {
      if (e.code === "Backspace") {
        this.removeNodes();
      }
      this.baseLayer.batchDraw();
      e.preventDefault();
    });
    console.log("已绑定键盘事件");
  }

  // 绑定全局的点击事件
  // 1. 点击图形创建控件
  // 2. 点击空白消除空间
  bindStageTransformerToggle() {
    this.stage.on("click", (e: any) => {
      if (e.target.id() === this.stage.id()) {
        // 点击空白区域, 循环destory transformer
        const transformers = this.stage.find("Transformer");
        transformers.forEach((item) => {
          item.destroy();
        });
        this.baseLayer.draw();
        return;
      }
      // create new transformer
      this.createTransformer(e.target);
    });
  }

  destoryMouseEvent() {
    this.stage.off("mousedown");
    this.stage.off("mousemove");
    this.stage.off("mouseup");

    if (this.drawTaget) {
      this.drawTaget.off("mousedown");
    }
  }

  switchMouseMode(mouseMode: MouseMode) {
    this.mouseMode = mouseMode;
  }

  // 监听 然后 分配操作
  // 如互斥的操作
  // 1. 正常模式下 鼠标可以框选
  // 2. 剪裁模式下 鼠标框选切换生成剪裁框
  // 3. 绘图模式下 鼠标可以划线
  // 4. 填充模式下 鼠标可以填充格子
  listenAndAssignTask(callback: Function | null) {
    this.destoryMouseEvent();
    switch (this.mouseMode) {
      case "basic":
        return;
      case "clip":
        this.listenAndCreateClipRectSelector(callback);
      case "draw":
        this.listenAndCreateRectSelector();
      case "fill":
        if (!this.fillConfig) {
          this.fillConfig = {
            color: "red",
          };
        }
        this.listenAndFillRect();
      default:
        this.listenAndCreateRectSelector();
    }
  }

  // 监听鼠标滚动事件
  listenScaleEvent() {
    // 鼠标滚动时, 放大整个画布
    this.stage.on("wheel", (e) => {
      const max = 20; // 放大最大的比例
      const min = 1; // 缩小最小的比例
      const step = 0.1; // 每次缩放的比例
      const evt = e.evt;
      // @ts-expect-error
      if (evt.wheelDelta) {
        // @ts-expect-error
        if (evt.wheelDelta > 0) {
          // 放大
          if (this.scaleMember.scaleX() < max) {
            this.scaleMember.scaleX(this.scaleMember.scaleX() + step);
            this.scaleMember.scaleY(this.scaleMember.scaleY() + step);
            // this.scaleMember.move({ x: -offsetX, y: -offsetY }) // 跟随鼠标偏移位置
          }
        } else {
          // 缩小
          if (this.scaleMember.scaleX() > min) {
            this.scaleMember.scaleX(this.scaleMember.scaleX() - step);
            this.scaleMember.scaleY(this.scaleMember.scaleY() - step);
            // this.scaleMember.move({ x: offsetX, y: offsetY }) // 跟随鼠标偏移位置
          }
        }
      }
    });
  }

  // 自定义矩形选择框, 框选多选多个图形同时操作
  listenAndCreateClipRectSelector(callback: Function | null) {
    this.stage.on("mousedown", (e: any) => {
      if (e.target.id() === this.stage.id()) {
        this.rectSelectorStart();
      }
    });

    this.stage.on("mousemove", () => {
      this.rectSelectorMove();
    });

    this.stage.on("mouseup", () => {
      this.rectSelectorEnd(callback);
    });
  }

  // 自定义矩形选择框, 框选多选多个图形同时操作
  listenAndCreateRectSelector() {
    this.stage.on("mousedown", (e: any) => {
      if (e.target.id() === this.stage.id()) {
        this.rectSelectorStart();
      }
    });

    this.stage.on("mousemove", () => {
      this.rectSelectorMove();
    });

    this.stage.on("mouseup", () => {
      this.rectSelectorEnd(null);
    });
  }

  // 填充模式, 监听鼠标事件, 默认在一个固定区域内绘图
  listenAndFillRect() {
    if (!this.drawTaget) {
      console.error(`未设置绘图对象 drawTarget : this.drawTarget(target:any)`);
      return;
    }

    this.drawTaget.on("mousedown", (e: any) => {
      // 绘图时禁止冒泡, 防止拖拽
      e.cancelBubble = true;
      if (this.mouseMode !== "fill") {
        this.drawTaget.off("mousedown");
        return;
      };
      //   console.log(`鼠标落下e.target`, e.target)
      this.fillStatus = "filling";
      e.target.fill(this.fillConfig?.color);

      this.drawTaget.on("mousemove", (e: any) => {
        if (this.fillStatus === "filling") {
          //   console.log(`鼠标移动e.target`, e, e.target)
          e.target.fill(this.fillConfig?.color);

          this.batchDraw()
        }

        // this.drawTaget.getIntersection()
        //   this.rectSelectorMove()
      });

      this.drawTaget.on("mouseup", () => {
        //   this.rectSelectorEnd(null)
        this.drawTaget.off("mousemove");
        this.drawTaget.off("mouseup");
        this.fillStatus = "done";
      });
    });
  }

  // 清除填充色
  clearFilledRects(option: any) {
    // 没有涂色区域，退出
    if (!this.drawTaget) {
      return;
    }
    // 没有选项， 清除全部
    if (!option) {
      this.drawTaget.getChildren().forEach((node: Konva.Rect) => {
        node.fill("white");
      });
    }
  }

  // 矩形选择框拖拽开始
  rectSelectorStart() {
    // 特别注意 Konva最新版本中 删除元素使 remove
    this.rectSelector?.remove();
    this.rectSelector = new Konva.Rect({
      fill: "rgba(0, 0, 0, 0.3)",
      width: 0,
      height: 0,
      visible: false,
    });

    this.baseLayer.add(this.rectSelector);
    const position = this.stage.getPointerPosition();
    if (position) {
      const { x, y } = position;
      this.rectSelectorPosition.x1 = x;
      this.rectSelectorPosition.x2 = x;
      this.rectSelectorPosition.y1 = y;
      this.rectSelectorPosition.y2 = y;
      this.rectSelector.visible(true);
    }
  }

  // 矩形选择框拖拽移动
  rectSelectorMove() {
    if (!this.rectSelector) {
      return;
    }

    if (!this.rectSelector.visible()) {
      return;
    }
    const position = this.stage.getPointerPosition();

    if (position) {
      const { x, y } = position;
      this.rectSelectorPosition.x2 = x;
      this.rectSelectorPosition.y2 = y;
      const { x1, y1, x2, y2 } = this.rectSelectorPosition;
      this.rectSelector.setAttrs({
        x: Math.min(x1, x2),
        y: Math.min(y1, y2),
        width: Math.abs(x2 - x1),
        height: Math.abs(y2 - y1),
      });
    }
  }

  // 矩形选择框拖拽结束
  rectSelectorEnd(callback: Function | null) {

    if (!this.rectSelector) {
      return;
    }
    if (!this.rectSelector.visible()) {
      return;
    }
    const attrs = this.rectSelector.getAttrs();
    this.rectSelector.visible(false);

    if (this.mouseMode === "basic") {
      this.rectCommonSelectorEnd();
    }

    if (this.mouseMode === "clip") {
      this.rectClipSelectorEnd(attrs, callback);
    }
  }

  rectCommonSelectorEnd() {
    // this.baseLayer.draw()
    const shapes = this.stage.find(".common-shape");
    const box = this.rectSelector.getClientRect();
    // 过滤出和框选矩形有重合的图形
    const selected = shapes.filter(shape =>
      Konva.Util.haveIntersection(box, shape.getClientRect()),
    );
    // 为所有框选的图形创建一个统一的控件
    this.createTransformer(selected);
  }

  // 框选并截取事件结束, 画一个矩形, 并返回矩形信息, 导出时作为参数传一下
  rectClipSelectorEnd(option: Konva.NodeConfig, callback: Function | null) {
    const { x, y, width, height } = option;
    const rectOption = {
      x,
      y,
      width,
      height,
      id: "my-export-rect",
      fill: "transparent",
      stroke: "black",
      strokeWidth: 1,
      draggable: false,
    };
    this.exportRectSelector = new Konva.Rect(rectOption);
    this.exportRectSelector.moveToBottom();

    if (callback) {
      callback(option).finally(() => {
        this.exportRectSelector.remove();
        this.switchMouseMode("basic");
        this.draw();
      });
    }
  }

  // 转dataURL 用于导出
  toDataURL(options = {}) {
    return this.stage.toDataURL(options);
  }

  // 序列化数据  图片和事件不可序列化 图片可以根据id或者name 自行渲染
  toJSON() {
    return this.stage.toJSON();
  }
}
