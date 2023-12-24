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
