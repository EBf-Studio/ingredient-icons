import sharp from "sharp"

/** Side of the output square, relative to the object's larger side. */
export const PADDING = 1.04

/** Distance to the background colour below which a pixel is still background (its noise and gradient). */
const NOISE = 25
/** How far off the line from the background to the object's colour a pixel can be and still be a blend of them. */
const BLEND = 35

/**
 * Removes the generated background and returns the object as a transparent square PNG,
 * at the raw image's resolution, with a small margin.
 *
 * The generator paints a flat magenta-ish background whose exact colour varies
 * from image to image, so it is measured on the border, then removed where it
 * touches the edge or fills an enclosed hole (a jug handle).
 * An edge pixel gets an opacity from its distance to the background. When it is a blend
 * of the background and the object's colour next to it, it takes that colour, and at
 * least its share of the way from one to the other as opacity, so no pink halo stays.
 * Otherwise the background is taken out of its colour, which suits a shadow of the
 * background's hue but turns a pink object olive, hence the blend test first.
 */
export async function cutOut(file: string) {
  const { data, info } = await sharp(file).removeAlpha().raw().toBuffer({ resolveWithObject: true })
  const { width: w, height: h } = info
  const n = w * h

  const bg = borderChannels(data, w, h).map(median)

  const distance = new Float32Array(n)
  for (let i = 0; i < n; i++)
    distance[i] = Math.hypot(data[i * 3]! - bg[0]!, data[i * 3 + 1]! - bg[1]!, data[i * 3 + 2]! - bg[2]!)

  // Background reachable from the border.
  const background = new Uint8Array(n)
  const stack: number[] = []
  const push = (i: number) => {
    if (!background[i] && distance[i]! < 77.5) {
      background[i] = 1
      stack.push(i)
    }
  }
  for (let x = 0; x < w; x++) push(x), push((h - 1) * w + x)
  for (let y = 0; y < h; y++) push(y * w), push(y * w + w - 1)
  floodFill(stack, w, h, push)

  // Enclosed holes of almost exactly the background colour.
  const seen = new Uint8Array(n)
  for (let start = 0; start < n; start++) {
    if (seen[start] || background[start] || distance[start]! >= 30) continue
    const region: number[] = []
    const queue = [start]
    seen[start] = 1
    while (queue.length) {
      const i = queue.pop()!
      region.push(i)
      for (const j of neighbours(i, w, h))
        if (!seen[j] && !background[j] && distance[j]! < 30) {
          seen[j] = 1
          queue.push(j)
        }
    }
    if (region.length > 150) for (const i of region) background[i] = 1
  }

  // Soft edges only next to the removed background; elsewhere the object stays opaque.
  const near = dilate(background, w, h, 4)
  const rgba = Buffer.alloc(n * 4)
  for (let i = 0; i < n; i++) {
    if (!near[i]) {
      for (let c = 0; c < 3; c++) rgba[i * 4 + c] = data[i * 3 + c]!
      rgba[i * 4 + 3] = 255
      continue
    }
    if (distance[i]! < 30) continue
    // Opacity from the distance to the background, and the background taken out of the colour.
    const a = Math.min(1, Math.max(0, (distance[i]! - 35) / 85))
    const object = objectColour(i)
    if ((isShade(i) && isShade(object)) || (object === i ? isPink(i) : !isBlend(i, object))) {
      const keep = Math.max(a, 1e-3)
      for (let c = 0; c < 3; c++)
        rgba[i * 4 + c] = Math.min(255, Math.max(0, (data[i * 3 + c]! - (1 - keep) * bg[c]!) / keep))
      rgba[i * 4 + 3] = Math.round(a * 255)
    } else if (object === i) {
      // The object's own colour, farther from the background than anything around it.
      for (let c = 0; c < 3; c++) rgba[i * 4 + c] = data[i * 3 + c]!
      rgba[i * 4 + 3] = 255
    } else {
      // A blend: at least as opaque as its share of the way to the object's colour, in that colour.
      const o = [0, 1, 2].map((c) => data[object * 3 + c]! - bg[c]!)
      const length = Math.hypot(o[0]!, o[1]!, o[2]!)
      const share = Math.max(0, (along(i, o) - NOISE) / (length - NOISE))
      const opacity = Math.max(a, share)
      if (opacity === 0) continue
      for (let c = 0; c < 3; c++) rgba[i * 4 + c] = data[object * 3 + c]!
      rgba[i * 4 + 3] = Math.round(opacity * 255)
    }
  }

  /** Length of pixel `i`'s step from the background along direction `o` (from the background to an object colour). */
  function along(i: number, o: number[]) {
    return [0, 1, 2].reduce((sum, c) => sum + (data[i * 3 + c]! - bg[c]!) * o[c]!, 0) / Math.hypot(o[0]!, o[1]!, o[2]!)
  }

  /** Whether pixel `i` lies on the way from the background to pixel `object`'s colour, so is a blend of the two. */
  function isBlend(i: number, object: number) {
    if (isShade(object)) return false
    const o = [0, 1, 2].map((c) => data[object * 3 + c]! - bg[c]!)
    return Math.sqrt(Math.max(0, distance[i]! ** 2 - along(i, o) ** 2)) < BLEND
  }

  /** Whether pixel `i` has a magenta hue: red and blue well above green. */
  function isPink(i: number) {
    const [r, g, b] = [data[i * 3]!, data[i * 3 + 1]!, data[i * 3 + 2]!]
    return r - g > 45 && b - g > 45 && b > r * 0.55
  }

  /** Whether pixel `j` is the background's colour darkened, as in a cast shadow or a puddle. */
  function isShade(j: number) {
    const q = [0, 1, 2].map((c) => data[j * 3 + c]!)
    const t = (q[0]! * bg[0]! + q[1]! * bg[1]! + q[2]! * bg[2]!) / (bg[0]! ** 2 + bg[1]! ** 2 + bg[2]! ** 2)
    // Near black, every colour is close to that line: a dark object is no shadow.
    return t > 0.25 && Math.hypot(q[0]! - t * bg[0]!, q[1]! - t * bg[1]!, q[2]! - t * bg[2]!) < NOISE
  }

  /** The pixel farthest from the background within 3 px of `i`: the object's own colour there. */
  function objectColour(i: number) {
    const x = i % w
    const y = (i - x) / w
    let best = i
    for (let Y = Math.max(0, y - 3); Y <= Math.min(h - 1, y + 3); Y++)
      for (let X = Math.max(0, x - 3); X <= Math.min(w - 1, x + 3); X++)
        if (distance[Y * w + X]! > distance[best]!) best = Y * w + X
    return best
  }

  const trimmed = await sharp(rgba, { raw: { width: w, height: h, channels: 4 } })
    .trim({ threshold: 1 })
    .png()
    .toBuffer({ resolveWithObject: true })
  const side = Math.round(Math.max(trimmed.info.width, trimmed.info.height) * PADDING)
  return sharp(trimmed.data)
    .resize(side, side, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer()
}

/** The pixels of the image's 8 px border, one array per channel, from raw RGB data. */
export function borderChannels(data: Buffer, w: number, h: number) {
  const border: number[][] = [[], [], []]
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++)
      if (x < 8 || y < 8 || x >= w - 8 || y >= h - 8)
        for (let c = 0; c < 3; c++) border[c]!.push(data[(y * w + x) * 3 + c]!)
  return border
}

export const median = (values: number[]) => [...values].sort((a, b) => a - b)[values.length >> 1]!

function* neighbours(i: number, w: number, h: number) {
  const x = i % w
  if (x > 0) yield i - 1
  if (x < w - 1) yield i + 1
  if (i >= w) yield i - w
  if (i < w * (h - 1)) yield i + w
}

function floodFill(stack: number[], w: number, h: number, push: (i: number) => void) {
  while (stack.length) for (const j of neighbours(stack.pop()!, w, h)) push(j)
}

function dilate(mask: Uint8Array, w: number, h: number, radius: number) {
  let current = mask
  for (let step = 0; step < radius; step++) {
    const next = new Uint8Array(current)
    for (let i = 0; i < current.length; i++)
      if (current[i]) for (const j of neighbours(i, w, h)) next[j] = 1
    current = next
  }
  return current
}
