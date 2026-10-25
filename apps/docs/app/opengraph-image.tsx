import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { ImageResponse } from 'next/og';
import { total } from '@/lib/icons';

export const alt = 'Ingredient Icons: an icon for every ingredient';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const FILES = ['en_avocado', 'en_tomato', 'en_shallot', 'en_brie', 'en_lemon', 'en_basil', 'en_salmon', 'en_garlic', 'en_strawberry'];

export default async function Image() {
  const sources = await Promise.all(
    FILES.map(async (file) => {
      const data = await readFile(path.join(process.cwd(), 'public/icons/png/256', `${file}.png`));
      return `data:image/png;base64,${data.toString('base64')}`;
    }),
  );

  return new ImageResponse(
    (
      <div style={{ display: 'flex', width: '100%', height: '100%', background: '#f5f7f2', padding: 72, alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, paddingRight: 40 }}>
          <div style={{ fontSize: 84, fontWeight: 700, lineHeight: 1, color: '#18211c', letterSpacing: -2 }}>
            An icon for every ingredient.
          </div>
          <div style={{ fontSize: 32, marginTop: 32, color: '#5b6a60' }}>
            {`${total} soft 3D icons for recipe apps. Public domain.`}
          </div>
          <div style={{ fontSize: 28, marginTop: 40, color: '#2e6b45' }}>npm install @ingredient-icons/core</div>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', width: 456, gap: 12 }}>
          {sources.map((src) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={src.slice(-24)} src={src} width={144} height={144} alt="" />
          ))}
        </div>
      </div>
    ),
    size,
  );
}
