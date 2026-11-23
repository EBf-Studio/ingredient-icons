// The README banner: .github/assets/banner-light.webp and banner-dark.webp (2560×1280).
// Draws an HTML page per theme with the site's fonts and colours and the icons of icons/png/,
// screenshots it with headless Chrome, and encodes the screenshot to webp.
// Run: bun run banner (set CHROME to the browser binary if it is not in /Applications)
// Needs the network for the Google fonts, and fails rather than draw with fallback fonts.
// Writes the pages and screenshots to .out/banner/.

import { existsSync } from "node:fs"
import { mkdir, rm, writeFile } from "node:fs/promises"
import path from "node:path"
import sharp from "sharp"

import { CTA_ICONS } from "../apps/docs/lib/showcase"
import { iconPath } from "./layout"

const OUT = ".out/banner"
const ASSETS = ".github/assets"
const WIDTH = 2560
const HEIGHT = 1280
// Keeps each webp around 120 KB.
const QUALITY = 88

// The wall behind the site's closing call to action, and a fourth row under it.
const WALL = [...CTA_ICONS, "salmon", "creme-fraiche", "black-pepper", "onion", "feta"]

// The site's tokens (apps/docs/app/global.css).
const THEMES = {
  light: {
    background: "#f5f7f2",
    foreground: "#18211c",
    muted: "#5b6a60",
    border: "#dbe2d6",
    card: "#fbfcfa",
    basil: "#2e6b45",
    tomato: "#df4a2f",
    shadow: "rgba(40, 52, 40, 0.16)",
  },
  dark: {
    background: "#0f1411",
    foreground: "#e7ece5",
    muted: "#98a69c",
    border: "#263029",
    card: "#151c17",
    basil: "#8fd0a3",
    tomato: "#ff7a5c",
    shadow: "rgba(0, 0, 0, 0.45)",
  },
}

const FONTS =
  "https://fonts.googleapis.com/css2?family=Figtree:wght@400;500&family=Fraunces:opsz,wght,SOFT,WONK@9..144,600,100,1&display=block"

const icon = (file: string) => {
  const png = path.resolve(iconPath("png", 512, file))
  if (!existsSync(png)) throw new Error(`Banner: no icon for ${file}`)
  return `file://${png}`
}

function page(theme: keyof typeof THEMES) {
  const c = THEMES[theme]
  return `<!doctype html>
<html><head><meta charset="utf-8">
<link rel="stylesheet" href="${FONTS}">
<script>
  // Read back by the script: Chrome falls back to other fonts when these fail to load.
  document.fonts.ready.then(() => {
    document.documentElement.dataset.fonts = [...document.fonts]
      .filter((f) => f.status === "loaded").map((f) => \`\${f.family}:\${f.weight}\`).join(",")
  })
</script>
<style>
  * { margin: 0; box-sizing: border-box; }
  html, body { width: ${WIDTH}px; height: ${HEIGHT}px; overflow: hidden; background: ${c.background}; }
  body { position: relative; font-family: Figtree, sans-serif; color: ${c.foreground}; }
  .grid {
    position: absolute; inset: 0;
    background-image: linear-gradient(${c.border} 2px, transparent 2px), linear-gradient(90deg, ${c.border} 2px, transparent 2px);
    background-size: 112px 112px; background-position: 54px 54px;
    mask-image: radial-gradient(ellipse 60% 70% at 68% 50%, black, transparent 80%);
    opacity: 0.7;
  }
  .wall {
    position: absolute; top: 0; bottom: 0; left: 1250px; right: 0;
    display: flex; align-items: center;
    mask-image: linear-gradient(to right, transparent, rgba(0, 0, 0, 0.3) 16%, black 30%);
  }
  .tiles { display: grid; grid-template-columns: repeat(6, 232px); gap: 34px; transform: rotate(-8deg); flex-shrink: 0; margin-left: 40px; }
  .tiles img { width: 232px; height: 232px; filter: drop-shadow(0 18px 22px ${c.shadow}); }
  .tiles img:nth-child(even) { transform: translateY(78px); }
  .copy { position: absolute; left: 160px; top: 0; bottom: 0; display: flex; flex-direction: column; justify-content: center; }
  .brand { display: flex; align-items: center; gap: 18px; font-size: 40px; font-weight: 500; color: ${c.muted}; }
  .brand img { width: 84px; height: 84px; }
  h1 {
    margin-top: 44px; font-family: Fraunces, serif; font-weight: 600; font-size: 172px; line-height: 0.98;
    letter-spacing: -0.025em; font-variation-settings: 'SOFT' 100, 'WONK' 1; white-space: nowrap;
  }
  h1 span { color: ${c.basil}; }
  p { margin-top: 52px; width: 1000px; font-size: 46px; line-height: 1.5; color: ${c.muted}; }
  .pill {
    margin-top: 56px; align-self: flex-start; padding: 15px 36px; border-radius: 999px;
    border: 2px solid ${c.border}; background: ${c.card}; font-size: 36px; font-weight: 500; color: ${c.tomato};
  }
</style></head>
<body>
  <div class="grid"></div>
  <div class="wall"><div class="tiles">${WALL.map((file) => `<img src="${icon(file)}" alt="">`).join("")}</div></div>
  <div class="copy">
    <div class="brand"><img src="${icon("avocado")}" alt="">Ingredient Icons</div>
    <h1>An icon for every<br><span>ingredient.</span></h1>
    <p>Soft 3D icons for recipe apps, keyed by the ids of an open ingredient catalog.</p>
    <div class="pill">CC0</div>
  </div>
</body></html>`
}

const chrome = process.env.CHROME ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
if (!existsSync(chrome)) throw new Error(`No Chrome at ${chrome}: set CHROME to the browser binary`)

const FONTS_LOADED = ["Figtree:400", "Figtree:500", "Fraunces:600"]

// Draws both themes and checks them before writing either webp, so a failure leaves both banners as they were.
async function shoot(theme: keyof typeof THEMES) {
  const html = path.resolve(OUT, `${theme}.html`)
  const png = path.resolve(OUT, `${theme}.png`)
  await writeFile(html, page(theme))
  await rm(png, { force: true })
  const run = Bun.spawnSync(
    [
      chrome,
      "--headless",
      "--disable-gpu",
      "--hide-scrollbars",
      "--allow-file-access-from-files",
      "--force-device-scale-factor=1",
      `--window-size=${WIDTH},${HEIGHT}`,
      // Lets the fonts and icons load before the shot.
      "--virtual-time-budget=10000",
      `--screenshot=${png}`,
      "--dump-dom",
      `file://${html}`,
    ],
    { timeout: 60_000, stdout: "pipe", stderr: "pipe" },
  )
  if (!run.success || !existsSync(png))
    throw new Error(
      `Chrome drew no screenshot for ${theme} (exit ${run.exitCode ?? run.signalCode}, timeout 60 s):\n${run.stderr.toString()}`,
    )
  const loaded = run.stdout.toString().match(/data-fonts="([^"]*)"/)?.[1]?.split(",") ?? []
  const missing = FONTS_LOADED.filter((font) => !loaded.includes(font))
  if (missing.length) throw new Error(`Fonts not loaded for ${theme}: ${missing.join(", ")} (offline?)`)
  const { width, height } = await sharp(png).metadata()
  if (width !== WIDTH || height !== HEIGHT) throw new Error(`Screenshot for ${theme} is ${width}×${height}`)
  return { theme, png }
}

await mkdir(OUT, { recursive: true })
const shots = [await shoot("light"), await shoot("dark")]
for (const { theme, png } of shots) {
  const webp = path.join(ASSETS, `banner-${theme}.webp`)
  const { size } = await sharp(png).webp({ quality: QUALITY, effort: 6 }).toFile(webp)
  console.log(`${webp}: ${Math.round(size / 1024)} KB`)
}
