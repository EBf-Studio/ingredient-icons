import sharp from "sharp"

/**
 * Removes the generated background and returns the object as a transparent square PNG,
 * at the raw image's resolution, with a small margin.
 *
 * The generator paints a flat magenta-ish background whose exact colour varies
 * from image to image, so it is measured on the border, then removed where it
 * touches the edge or fills an enclosed hole (a jug handle). Edge pixels are
 * unmixed from that colour so no pink halo stays.
 */
export async function cutOut(file: string) {
  const { data, info } = await sharp(file).removeAlpha().raw().toBuffer({ resolveWithObject: true })
  const { width: w, height: h } = info
  const n = w * h

  const border: number[][] = [[], [], []]
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++)
      if (x < 8 || y < 8 || x >= w - 8 || y >= h - 8)
        for (let c = 0; c < 3; c++) border[c]!.push(data[(y * w + x) * 3 + c]!)
  const bg = border.map((values) => values.sort((a, b) => a - b)[values.length >> 1]!)

  const distance = new Float32Array(n)
  const alpha = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    const dr = data[i * 3]! - bg[0]!
    const dg = data[i * 3 + 1]! - bg[1]!
    const db = data[i * 3 + 2]! - bg[2]!
    distance[i] = Math.sqrt(dr * dr + dg * dg + db * db)
    alpha[i] = Math.min(1, Math.max(0, (distance[i]! - 35) / 85))
  }

  // Background reachable from the border.
  const background = new Uint8Array(n)
  const stack: number[] = []
  const push = (i: number) => {
    if (!background[i] && alpha[i]! < 0.5) {
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
    const a = near[i] ? alpha[i]! : 1
    const keep = Math.max(a, 1e-3)
    for (let c = 0; c < 3; c++)
      rgba[i * 4 + c] = Math.min(255, Math.max(0, (data[i * 3 + c]! - (1 - keep) * bg[c]!) / keep))
    rgba[i * 4 + 3] = Math.round(a * 255)
  }

  const trimmed = await sharp(rgba, { raw: { width: w, height: h, channels: 4 } })
    .trim({ threshold: 1 })
    .png()
    .toBuffer({ resolveWithObject: true })
  const side = Math.round(Math.max(trimmed.info.width, trimmed.info.height) * 1.04)
  return sharp(trimmed.data)
    .resize(side, side, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer()
}

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
