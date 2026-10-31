import sharp from "sharp"

import { PADDING, borderChannels, median } from "./cut-out"

/** What the reviewer is told about a candidate besides the picture. */
export interface Inspection {
  /** Share of the cut-out's opaque pixels close to the background colour: background left in the object. */
  pinkShare: number
  /** Largest standard deviation of the border's channels: a gradient, floor or shadow raises it. */
  backgroundNoise: number
  /** Object side over image side. */
  fill: number
  flags: string[]
}

/** How close to the background colour a pixel must be to count as left-over background. */
const PINK_DISTANCE = 50

/**
 * Measured on the 314 accepted raws: about 95% pass every check. What gets flagged
 * (thin fronds, glass) deserves a close look, not an automatic rejection.
 * The dill candidates with pink tips left after cut-out measured 0.2%.
 */
const LIMITS = { pinkShare: 0.0015, backgroundNoise: 6, minFill: 0.45, edgePixels: 40 }

/** Measures a raw candidate (`file`) and its cut-out (`master`, as returned by cutOut). */
export async function inspect(file: string, master: Buffer): Promise<Inspection> {
  const { data, info } = await sharp(file).removeAlpha().raw().toBuffer({ resolveWithObject: true })
  const { width: w, height: h } = info

  const border = borderChannels(data, w, h)
  const bg = border.map(median)
  const backgroundNoise = Math.max(
    ...border.map((values) => {
      const mean = values.reduce((s, v) => s + v, 0) / values.length
      return Math.sqrt(values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length)
    }),
  )

  // Object pixels in the outermost ring: the object is cropped by the frame.
  let edgePixels = 0
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++)
      if (x < 3 || y < 3 || x >= w - 3 || y >= h - 3) {
        const i = (y * w + x) * 3
        const d = Math.hypot(data[i]! - bg[0]!, data[i + 1]! - bg[1]!, data[i + 2]! - bg[2]!)
        if (d > 80) edgePixels++
      }

  const cut = await sharp(master).raw().toBuffer({ resolveWithObject: true })
  let opaque = 0
  let pink = 0
  for (let i = 0; i < cut.data.length; i += 4) {
    if (cut.data[i + 3]! < 255) continue
    opaque++
    const d = Math.hypot(cut.data[i]! - bg[0]!, cut.data[i + 1]! - bg[1]!, cut.data[i + 2]! - bg[2]!)
    if (d < PINK_DISTANCE) pink++
  }
  const pinkShare = opaque ? pink / opaque : 0
  const fill = cut.info.width / PADDING / Math.max(w, h)

  const flags: string[] = []
  if (pinkShare > LIMITS.pinkShare) flags.push("magenta in object")
  if (backgroundNoise > LIMITS.backgroundNoise) flags.push("uneven background")
  if (edgePixels > LIMITS.edgePixels) flags.push("cropped")
  if (fill < LIMITS.minFill) flags.push("too small")
  return { pinkShare, backgroundNoise, fill, flags }
}
