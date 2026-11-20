import sharp from "sharp"

import { PADDING, borderChannels, median } from "./cut-out"
import { DARK } from "./draw"

/** What the reviewer is told about a candidate besides the picture. */
export interface Inspection {
  /** Share of the cut-out's opaque pixels close to the background colour: background left in the object. */
  pinkShare: number
  /** Magenta-hued pixels inside the object: pink seen through a gap, a tinted glass or a reflection. */
  pinkSpots: number
  /** Share of the contour that looks pink on a dark background: a halo or a magenta shadow. */
  pinkEdge: number
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
 * pinkSpots and pinkEdge, measured on the 557 raws of November 2026: a pink fennel
 * frond, a tinted jar rim or a magenta shadow passes 100 spots or 12% of the contour,
 * and so do red onions, aubergines and turnips, which are meant to be purple.
 */
const LIMITS = { pinkShare: 0.0015, pinkSpots: 100, pinkEdge: 0.12, backgroundNoise: 6, minFill: 0.45, edgePixels: 40 }

/** The flags that mean background colour left in or around the object. */
export const PINK_FLAGS = ["magenta in object", "pink spots", "pink edge"]

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
  const { spots, edge, contour } = await pinkPixels(master)
  const pinkSpots = spots.reduce((sum, v) => sum + v, 0)
  const pinkEdge = contour ? edge.reduce((sum, v) => sum + v, 0) / contour : 0
  const fill = cut.info.width / PADDING / Math.max(w, h)

  const flags: string[] = []
  if (pinkShare > LIMITS.pinkShare) flags.push(PINK_FLAGS[0]!)
  if (pinkSpots > LIMITS.pinkSpots) flags.push(PINK_FLAGS[1]!)
  if (pinkEdge > LIMITS.pinkEdge) flags.push(PINK_FLAGS[2]!)
  if (backgroundNoise > LIMITS.backgroundNoise) flags.push("uneven background")
  if (edgePixels > LIMITS.edgePixels) flags.push("cropped")
  if (fill < LIMITS.minFill) flags.push("too small")
  return { pinkShare, pinkSpots, pinkEdge, backgroundNoise, fill, flags }
}

/** One line of an inspection's measures, for preview's and audit's reports. */
export const measures = (r: Inspection) =>
  `magenta ${(r.pinkShare * 100).toFixed(2)}%, spots ${r.pinkSpots}, edge ${(r.pinkEdge * 100).toFixed(1)}%, fill ${Math.round(r.fill * 100)}%`

/** The sheets' dark background, where a pink halo shows most, as RGB. */
const DARK_RGB = [1, 3, 5].map((k) => parseInt(DARK.slice(k, k + 2), 16))

/**
 * Pink pixels of a cut-out (`master`), as masks over its pixels: `spots` inside the object
 * (more than 4 px from its contour, so a halo doesn't count twice), `edge` on its contour
 * once laid on a dark background, and the number of `contour` pixels. Its magenta-hued
 * test catches what pinkShare misses: background tinted by a glass, or blended with thin
 * fronds, far from the exact background colour.
 */
export async function pinkPixels(master: Buffer) {
  const { data, info } = await sharp(master).raw().toBuffer({ resolveWithObject: true })
  const { width: w, height: h } = info
  const n = w * h

  // Distance to the nearest not fully opaque pixel, up to 5.
  const depth = new Uint8Array(n).fill(5)
  const queue: number[] = []
  for (let i = 0; i < n; i++) if (data[i * 4 + 3]! < 255) (depth[i] = 0), queue.push(i)
  for (let k = 0; k < queue.length; k++) {
    const i = queue[k]!
    const x = i % w
    for (const j of [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, i - w, i + w])
      if (j >= 0 && j < n && depth[j]! > depth[i]! + 1) (depth[j] = depth[i]! + 1), queue.push(j)
  }

  const spots = new Uint8Array(n)
  const edge = new Uint8Array(n)
  let contour = 0
  for (let i = 0; i < n; i++) {
    const a = data[i * 4 + 3]! / 255
    if (a === 0) continue
    const [r, g, b] = [0, 1, 2].map((c) => data[i * 4 + c]! * a + DARK_RGB[c]! * (1 - a)) as [number, number, number]
    if (depth[i]! > 4) spots[i] = r - g > 45 && b - g > 45 && b > r * 0.4 ? 1 : 0
    else if (depth[i]! <= 2) {
      contour++
      edge[i] = r - g > 25 && b - g > 25 && b > r * 0.6 ? 1 : 0
    }
  }
  return { spots, edge, contour, width: w, height: h }
}
