import { cn } from '@/lib/cn';
import { iconSrc } from '@/lib/icon-path';

/** A square icon. Picks the smallest file that stays sharp on a 2× screen. */
export function IconImage({
  file,
  size,
  alt = '',
  className,
  priority,
}: {
  file: string;
  size: number;
  alt?: string;
  className?: string;
  priority?: boolean;
}) {
  const source = size * 2 <= 64 ? 64 : size * 2 <= 128 ? 128 : 256;
  return (
    <img
      src={iconSrc(file, source)}
      alt={alt}
      width={size}
      height={size}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      draggable={false}
      className={cn('icon-img', className)}
    />
  );
}
