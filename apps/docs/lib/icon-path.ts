export type Format = 'webp' | 'png';

/** Served from public/icons, copied from the repository by scripts/prepare.ts. */
export function iconSrc(file: string, size: 64 | 128 | 256 | 512 = 128, format: Format = 'webp') {
  return `/icons/${format}/${size}/${file}.${format}`;
}

/** "en:cherry-tomato" → "cherry tomato" */
export const readableId = (id: string) => id.replace(/^[a-z]{2}:/, '').replaceAll('-', ' ');
