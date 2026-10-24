import path from "node:path"

/** Where every published file lives; the manifest repeats it for consumers. */
export const SIZES = { png: [64, 128, 256, 512], webp: [64, 128, 256] } as const
export type Format = keyof typeof SIZES

export const ICONS_DIR = "icons"
export const PATH_TEMPLATE = `${ICONS_DIR}/{format}/{size}/{file}.{format}`

export const iconPath = (format: Format, size: number, file: string) =>
  path.join(ICONS_DIR, format, String(size), `${file}.${format}`)

/** "en:olive-oil" → "en_olive-oil": file names can't hold a colon on every system. */
export const fileName = (id: string) => id.replace(":", "_")

/** The private sources checkout: raw/, subjects.json, style.txt. */
export const SOURCES_DIR = process.env.INGREDIENT_ICONS_SOURCES ?? "../ingredient-icons-sources"

/** Bumped when the prompt changes enough that old and new icons no longer match. */
export const STYLE_VERSION = 1

export interface Manifest {
  style: number
  sizes: typeof SIZES
  path: string
  icons: Record<string, { file: string }>
}
