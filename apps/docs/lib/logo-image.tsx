import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { ImageResponse } from 'next/og';
import { logoFile } from './shared';

/** The site logo as a square PNG, read from the icons the prepare script copies into public/. */

export async function logoImage(size: number, background?: string) {
  const data = await readFile(path.join(process.cwd(), 'public/icons/png/256', `${logoFile}.png`));
  const src = `data:image/png;base64,${data.toString('base64')}`;
  // On a solid background (Apple touch icons), leave room around the avocado.
  const inner = background ? Math.round(size * 0.78) : size;

  return new ImageResponse(
    (
      <div style={{ display: 'flex', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', ...(background && { background }) }}>
        <img src={src} width={inner} height={inner} alt="" />
      </div>
    ),
    { width: size, height: size },
  );
}
