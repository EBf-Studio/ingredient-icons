import { logoImage } from '@/lib/logo-image';

export const size = { width: 64, height: 64 };
export const contentType = 'image/png';

export default function Icon() {
  return logoImage(size.width);
}
