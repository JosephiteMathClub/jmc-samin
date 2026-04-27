"use client";
import React, { useState } from 'react';
import Image, { ImageProps } from 'next/image';
import { cn } from '@/lib/utils';
import { Skeleton } from './Skeleton';

interface OptimizedImageProps extends Omit<ImageProps, 'onLoad' | 'onError'> {
  /** Optional fallback component if image fails */
  fallback?: React.ReactNode;
  /** Custom wrapper class */
  wrapperClassName?: string;
}

/**
 * A wrapper for Next.js Image with built-in:
 * - Lazy loading optimizations
 * - Blur placeholder system
 * - Skeleton loader for initial state
 * - Failed state handling
 * - Automatic decoding="async"
 * - High-performance decoding for large files
 */
export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className,
  wrapperClassName,
  fallback,
  width,
  height,
  fill,
  sizes = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
  priority,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Skip rendering if source is empty
  if (!src && !fallback) return null;

  if (hasError && fallback) {
    return <div className={wrapperClassName}>{fallback}</div>;
  }

  return (
    <div className={cn(
      "relative overflow-hidden bg-white/5",
      wrapperClassName,
      fill ? "h-full w-full" : ""
    )}>
      {/* Skeleton / Initial loading state */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 z-10">
          <Skeleton className="h-full w-full opacity-30" />
        </div>
      )}

      <Image
        src={src}
        alt={alt}
        className={cn(
          "transition-all duration-700 ease-in-out will-change-[transform,opacity,filter]",
          isLoaded ? "opacity-100 scale-100" : "opacity-0 scale-105 blur-lg",
          className
        )}
        width={width}
        height={height}
        fill={fill}
        priority={priority}
        sizes={sizes}
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        decoding="async"
        loading={priority ? undefined : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        {...props}
      />
    </div>
  );
};
