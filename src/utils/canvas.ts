export function downloadPNGForCanvas(
  dataURL: string,
  filename: string = (+new Date()).toString(),
) {
  const a = document.createElement('a')
  a.download = filename
  a.href = dataURL
  document.body.appendChild(a)
  a.click()
  a.remove()
}
