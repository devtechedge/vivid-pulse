'use client';

import * as React from 'react';
import { DEFAULT_AVATAR, DEFAULT_IMAGE } from '@/lib/media';
import { cn } from '@/lib/utils';

type SafeImgProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  fallback?: string;
  kind?: 'avatar' | 'media';
};

export default function SafeImg({
  src,
  alt = '',
  fallback,
  kind = 'media',
  className,
  ...rest
}: SafeImgProps) {
  const fallbackSrc = fallback ?? (kind === 'avatar' ? DEFAULT_AVATAR : DEFAULT_IMAGE);
  const [current, setCurrent] = React.useState(src || fallbackSrc);

  React.useEffect(() => {
    setCurrent(src || fallbackSrc);
  }, [src, fallbackSrc]);

  return (
    <img
      src={current}
      alt={alt}
      className={cn('overflow-hidden', className)}
      {...rest}
      onError={() => {
        if (current !== fallbackSrc) setCurrent(fallbackSrc);
      }}
    />
  );
}
