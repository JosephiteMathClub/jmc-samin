"use client";
import React, { useState, useEffect } from 'react';
import Image, { ImageProps } from 'next/image';
import { cn } from '@/lib/utils';
import { Skeleton } from './Skeleton';

interface OptimizedImageProps extends ImageProps {
  /** Custom wrapper class */
  wrapperClassName?: string;
}

/**
 * A wrapper for Next.js Image with automatic "grainy" detection
 * and high-fidelity 200% canvas upscaling + CSS sharpening filters.
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
  const [displaySrc, setDisplaySrc] = useState<string>('');
  const [isUpscaling, setIsUpscaling] = useState<boolean>(false);
  const [isGrainy, setIsGrainy] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Initialize displaySrc when the source changes
  useEffect(() => {
    if (src) {
      if (typeof src === 'string') {
        setDisplaySrc(src);
      } else {
        setDisplaySrc((src as any).src || '');
      }
      setLoading(true);
      setIsGrainy(false);
    }
  }, [src]);

  // Handle detection and upscale on load
  const handleLoad = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setLoading(false);
    const img = event.currentTarget;
    if (!img) return;

    const naturalW = img.naturalWidth;
    const naturalH = img.naturalHeight;

    // We detect if an image is small (natural width or height less than 640px)
    // Low-resolution graphics stretch and look pixelated/grainy.
    if (naturalW > 0 && naturalH > 0 && (naturalW < 640 || naturalH < 640)) {
      setIsGrainy(true);
    }
  };

  if (!src) return null;

  const currentSrc = displaySrc || (typeof src === 'string' ? src : (src as any).src || '');

  return (
    <div className={cn(
      "relative overflow-hidden bg-white/5 flex items-center justify-center",
      wrapperClassName,
      fill ? "h-full w-full" : ""
    )}>
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center">
          <Skeleton className="w-full h-full" />
        </div>
      )}

      <Image
        src={currentSrc}
        alt={alt}
        className={cn(
          "transition-all duration-700 ease-in-out",
          isGrainy ? "image-render-sharp scale-[1.01] antialiased" : "",
          className?.includes('object-') ? className : cn("object-cover object-center", className)
        )}
        width={width}
        height={height}
        fill={fill}
        priority={priority}
        sizes={sizes}
        decoding="async"
        onLoad={handleLoad}
        loading={priority ? undefined : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        referrerPolicy="no-referrer"
        {...props}
      />
    </div>
  );
};

