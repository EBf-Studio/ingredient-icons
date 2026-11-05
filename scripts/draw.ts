// Drawing helpers shared by the contact sheets (preview.ts for the agents, sheet.ts for the user).

import sharp from "sharp"

export const LIGHT = "#f7f4ee"
export const DARK = "#201e1b"
export const TINY = 24
export const ZOOM = 4

/** A transparent image fitted in a square on a flat background. */
export async function onBackground(image: Buffer | string, size: number, background: string) {
  return sharp(image)
    .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .flatten({ background })
    .png()
    .toBuffer()
}

/** What 24 px actually leaves of an image, enlarged without smoothing. */
export async function tinyZoomed(image: Buffer | string) {
  const tiny = await sharp(image).resize(TINY, TINY).png().toBuffer()
  return sharp(await onBackground(tiny, TINY, LIGHT))
    .resize(TINY * ZOOM, TINY * ZOOM, { kernel: "nearest" })
    .png()
    .toBuffer()
}

export function text(x: number, y: number, content: string, size: number, weight: number, fill = DARK) {
  const escaped = content.replace(/&/g, "&amp;").replace(/</g, "&lt;")
  return `<text x="${x}" y="${y}" font-family="Helvetica, Arial, sans-serif" font-size="${size}" font-weight="${weight}" fill="${fill}">${escaped}</text>`
}
