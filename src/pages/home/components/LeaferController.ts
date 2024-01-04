import {
  App,
  Leafer,
  Rect,
  Group,
  Frame,
  Box,
  PointerEvent,
  UI,
  Cursor,
} from "leafer-ui";

import {
  IEventListenerId,
  IFunction,
  ILeafer,
  IObject,
} from "@leafer-ui/interface";
import { isRef } from "vue";
import BtnClearSVG from "~/assets/cursor-clear16.svg";
type viewParam = string | Ref | HTMLElement;
type LeaferConfig = {
  width?: number;
  height?: number;
  fill?: boolean;
};
type StageConfig = {
  ground?: LeaferConfig;
  tree?: LeaferConfig;
};
type StageContainer = Group | Frame | Box;
// type MouseMode = "basic" | "draw" | "clip" | "fill";

type LeaferInnerId = number;
type EventName = string;
type InnerContainer = {
  [key: LeaferInnerId]: StageContainer;
};

type InnerShape = {
  [key: LeaferInnerId]: UI;
};

type InnerEvent = {
  [key: LeaferInnerId]: IEventListenerId[];
};

export enum MouseMode {
  BASIC = "basic",
  DRAW = "draw",
  CLIP = "clip",
  FILL = "fill", // 包含了监听鼠标, 按下和移动会fill
}

type FillConfig = {
  [key: string]: string;
};

export class LeaferController {
  private app!: App;
  private containerView: viewParam;
  private groups?: Group[];
  private mouseMode: MouseMode = MouseMode.BASIC;
  private InnerContainer: InnerContainer = {}; // 所有的容器对象
  private innerShape: InnerShape = {}; // 所有的形状对象
  private innerEvent: InnerEvent = {}; // 已经绑定的事件
  private fillConfig: FillConfig = {};
  //   private mouseMode:

  constructor(containerView: viewParam, stageConfig?: StageConfig) {
    this.containerView = containerView;
    this.initApp(stageConfig);
  }

  initApp(stageConfig?: StageConfig) {
    this.setFillConfig("color", "#000");
    this.app = new App({
      view: isRef(this.containerView)
        ? (this.containerView.value as string)
        : this.containerView,
      //   wheel: {
      //     zoomMode: stageConfig.zoom,
      //   },
      //   start: !!stageConfig.autoRender,
    });
    // 添加一个背景层
    this.app.ground = new Leafer({
      type: "draw",
    });
    this.app.add(this.app.ground);
    Cursor.set("btn-clear", {
      url: BtnClearSVG,
    });
    this.setStage(stageConfig);
  }

  getApp() {
    return this.app;
  }

  getStage() {
    return this.app.tree;
  }

  getGround() {
    return this.app.ground;
  }

  // TODO 像素图解析使用
  // 在背景层插入图片
  importImageInGround() {}

  // container 类型
  // fill模式下只支持容器事件
  setMouseMode(mode: MouseMode, container: StageContainer) {
    this.mouseMode = mode;
    this.offInnerEvent(container);
    switch (mode) {
      case MouseMode.FILL:
        this.startFill(container);
    }
  }

  setFillConfig(key: string, value: string) {
    this.fillConfig[key] = value;
  }

  setZoomLayer(group: Group) {
    this.app.zoomLayer = group;
  }

  // 开始填充, 绑定事件, 传入要操作的容器对象
  startFill(fillTarget: StageContainer) {
    this.bindPointerEventForFill(fillTarget);
  }

  // start
  onStartFillShape(container: StageContainer, fillConfig = this.fillConfig) {
    return (event: PointerEvent) => {
      (event.target as Rect).fill = fillConfig.color;
      let moveEventId = this.bindInnerEvent(
        PointerEvent.MOVE,
        container,
        this.onMoveFillShape(fillConfig),
        this
      );
      this.bindInnerEvent(
        PointerEvent.UP,
        container,
        this.onEndFillShape(container, moveEventId),
        this
      );
    };
  }

  onMoveFillShape(fillConfig = this.fillConfig) {
    return (event: PointerEvent) => {
      (event.target as Rect).fill = fillConfig.color;
    };
  }

  onEndFillShape(container: StageContainer, eventId?: IEventListenerId) {
    return () => {
      this.offInnerEvent(container, eventId);
    };
  }

  // 绑定事件入口, 方便收集所有事件id 1:[id1, id2], 返回当前绑定的事件id
  bindInnerEvent(event: string, target: UI, cb: IFunction, bind: IObject) {
    if (!this.innerEvent[target.innerId]) {
      this.innerEvent[target.innerId] = [];
    }

    let curEventId = target.on_(event, cb, bind);
    // 事件id传进去
    this.innerEvent[target.innerId].push(curEventId);
    return curEventId;
  }
  // 为一个 UI 解绑一个或多个或所有事件
  offInnerEvent(target: UI, eventId?: IEventListenerId) {
    if (target && !this.innerEvent[target.innerId]) return;

    if (eventId) {
      // 解绑单个事件
      target.off_(eventId);

      this.innerEvent[target.innerId] = this.innerEvent[target.innerId].filter(
        (_eventId: IEventListenerId) => eventId !== _eventId
      );
    } else {
      console.log(`移除所有事件`, this.innerEvent[target.innerId]);
      target.off_(this.innerEvent[target.innerId]);
      this.innerEvent[target.innerId] = [];
    }
  }
  // 为一个Container绑定鼠标事件
  bindPointerEventForFill(container: StageContainer) {
    console.log(`绑定填充相关事件`);
    // this.offInnerEvent(container, PointerEvent.DOWN);

    this.bindInnerEvent(
      PointerEvent.DOWN,
      container,
      this.onStartFillShape(container, this.fillConfig),
      this
    );
  }
  // 设置tree层, 先设置成固定的width/height, 方便导出, 导出还不支持, 先留着吧!
  setStage(stageConfig?: StageConfig) {
    // 添加中间层, 还有sky 和 ground 用到时再添加
    // 默认操作都是基于tree
    console.log(`stageConfig`, stageConfig);
    this.app.tree = new Leafer({
      //   start: !!stageConfig.autoRender,
    });
    this.app.add(this.app.tree);
  }

  // 添加图形, 统一入口, 会把图形收集起来
  addBaseShape(stage: ILeafer | StageContainer, shape: UI) {
    if (!this.innerShape[shape.innerId]) {
      this.innerShape[shape.innerId] = shape;
    }
    stage.add(shape);
  }

  // 添加容器, 统一入口, 会把容器收集起来
  addStageContainer(leafer: ILeafer, container: StageContainer) {
    if (!this.InnerContainer[container.innerId]) {
      this.InnerContainer[container.innerId] = container;
    }
    console.log(`增加container`);
    // leafer.removeAll();
    leafer.add(container);
  }

  // 添加矩形, 如果指定了StageContainer, 则添加到StageContainer里
  addRect(rect: Rect, container?: StageContainer) {
    if (container) {
      // 如果已经有了, 不再add
      this.addStageContainer(this.app.tree, container);
      // 添加图形
      this.addBaseShape(container, rect);
    } else {
      this.addBaseShape(this.app.tree, rect);
    }
  }

  // 批量添加矩形, 如果指定了container, 则添加到Group里
  // Group没有办法定位和比对, 需要自己管理
  addRects(rects: Rect[], container?: StageContainer) {
    if (container) {
      if (!this.InnerContainer[container.innerId]) {
        this.addStageContainer(this.app.tree, container);
      }
      rects.forEach((rect: Rect) => {
        this.addBaseShape(container, rect);
      });
    } else {
      rects.forEach((rect: Rect) => {
        this.addBaseShape(this.app.tree, rect);
      });
    }
  }

  removeStage() {
    this.app.tree.removeAll();
    Object.keys(this.InnerContainer).forEach((key: unknown) => {
      this.offInnerEvent(this.InnerContainer[key as number]);
    });
    this.InnerContainer = {};
    this.innerShape = {};
    this.innerEvent = {};
  }
}
