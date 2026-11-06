export type Format = 'webp' | 'png';

/** Served from public/icons, copied from the repository by scripts/prepare.ts. Files are named after catalog ids. */
export function iconSrc(id: string, size: 64 | 128 | 256 | 512 = 128, format: Format = 'webp') {
  return `/icons/${format}/${size}/${id}.${format}`;
}
