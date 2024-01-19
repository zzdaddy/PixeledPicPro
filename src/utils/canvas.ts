import { Canvas } from "leafer-ui";

export function downloadPNGForCanvas(
  dataURL: string,
  filename: string = (+new Date()).toString()
) {
  const a = document.createElement("a");
  a.download = filename;
  a.href = dataURL;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

// 使用canvas获取rgb色值
export function getPixelColor(canvas: Canvas, x: number, y: number) {
  const ctx = canvas.context;
  let imageData = ctx.getImageData(x, y, 1, 1);
  let pixel = imageData.data;
  let r = pixel[0];
  let g = pixel[1];
  let b = pixel[2];
  let a = pixel[3] / 255;
  a = Math.round(a * 100) / 100;
  let rHex = r.toString(16);
  r < 16 && (rHex = "0" + rHex);
  let gHex = g.toString(16);
  g < 16 && (gHex = "0" + gHex);
  let bHex = b.toString(16);
  b < 16 && (bHex = "0" + bHex);
  let rgbaColor = "rgba(" + r + "," + g + "," + b + "," + a + ")";
  let rgbColor = "rgb(" + r + "," + g + "," + b + ")";
  let hexColor = "#" + rHex + gHex + bHex;
  return {
    rgba: rgbaColor,
    rgb: rgbColor,
    hex: hexColor,
    r: r,
    g: g,
    b: b,
    a: a,
  };
}

// 颜色按色系分类
export function classifyColor(r: number, g: number, b: number) {
  // 定义颜色分类的阈值
  // 红色阈值
  const redThreshold = 100;
  // 黄色阈值
  const yellowThreshold = 200;
  // 蓝色阈值
  const blueThreshold = 150;
  // 绿色阈值
  const greenThreshold = 100;
  // 紫色阈值
  const purpleThreshold = 150;
  // 橙色阈值
  const orangeThreshold = 200;
  // 青色阈值
  const cyanThreshold = 150;
  // 黑色阈值
  const blackThreshold = 40;
  // 白色阈值
  const whiteThreshold = 220;

  // 计算 RGB 分量的平均值
  const avg = (r + g + b) / 3;

  // 分类逻辑
  if (avg <= blackThreshold) {
    return "深色";
  } else if (avg > whiteThreshold) {
    return "浅色";
  } else if (r >= redThreshold && g < yellowThreshold && b < blueThreshold) {
    return "红色";
  } else if (r > redThreshold && g >= orangeThreshold && b < blueThreshold) {
    return "橙色";
  } else if (r < redThreshold && g >= yellowThreshold && b < blueThreshold) {
    return "黄色";
  } else if (r < redThreshold && g >= greenThreshold && b < blueThreshold) {
    return "绿色";
  } else if (r < redThreshold && g < yellowThreshold && b >= blueThreshold) {
    return "蓝色";
  } else if (r >= purpleThreshold && g < yellowThreshold && b > blueThreshold) {
    return "紫色";
  } else if (r < redThreshold && g > yellowThreshold && b >= cyanThreshold) {
    return "青色";
  } else {
    return "其他颜色";
  }
}
