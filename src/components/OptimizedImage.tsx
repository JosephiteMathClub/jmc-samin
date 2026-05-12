"use client";
import React, { useState } from 'react';
import Image, { ImageProps } from 'next/image';
import { cn } from '@/lib/utils';
import { Skeleton } from './Skeleton';

interface OptimizedImageProps extends ImageProps {
  /** Custom wrapper class */
  wrapperClassName?: string;
}

/**
 * A wrapper for Next.js Image
 */
export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className,
  wrapperClassName,
  width,
  height,
  fill,
  sizes = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
  priority,
  ...props
}) => {
  // Skip rendering if source is empty
  if (!src) return null;

  return (
    <div className={cn(
      "relative overflow-hidden bg-white/5 flex items-center justify-center",
      wrapperClassName,
      fill ? "h-full w-full" : ""
    )}>
      <Image
        src={src}
        alt={alt}
        className={cn(
          "transition-all duration-700 ease-in-out object-cover object-center",
          className
        )}
        width={width}
        height={height}
        fill={fill}
        priority={priority}
        sizes={sizes}
        decoding="async"
        loading={priority ? undefined : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        referrerPolicy="no-referrer"
        {...props}
      />
    </div>
  );
};
