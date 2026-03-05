'use client';

import Image from 'next/image';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  quality?: number;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  sizes?: string;
  fill?: boolean;
  loading?: 'lazy' | 'eager';
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * Composant Image optimisé avec gestion d'erreur, placeholder et performances
 * Utilise next/image avec optimisations pour Core Web Vitals
 */
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  quality = 85,
  placeholder = 'blur',
  blurDataURL = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q==',
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  fill = false,
  loading = 'lazy',
  onLoad,
  onError,
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  if (hasError) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-gray-100 dark:bg-gray-800",
          "text-gray-400 text-sm",
          className
        )}
        style={{ width, height }}
        aria-label={`Image non disponible: ${alt}`}
      >
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {/* Skeleton loader pendant le chargement */}
      {!isLoaded && !fill && (
        <div
          className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 animate-pulse"
          style={{ width, height }}
          aria-hidden="true"
        />
      )}

      <Image
        src={src}
        alt={alt}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        fill={fill}
        priority={priority}
        quality={quality}
        placeholder={placeholder}
        blurDataURL={placeholder === 'blur' ? blurDataURL : undefined}
        sizes={sizes}
        loading={priority ? 'eager' : loading}
        className={cn(
          "transition-opacity duration-300",
          isLoaded ? "opacity-100" : "opacity-0",
          fill ? "object-cover" : ""
        )}
        onLoad={handleLoad}
        onError={handleError}
        style={fill ? undefined : { width, height }}
      />
    </div>
  );
}

/**
 * Hook pour générer des blurDataURL optimisés selon la taille
 */
export function useOptimizedBlur(width: number, height: number): string {
  const aspectRatio = width / height;
  const blurWidth = Math.min(10, width);
  const blurHeight = Math.round(blurWidth / aspectRatio);

  // Retourne une version très simplifiée pour les performances
  return `data:image/svg+xml;base64,${btoa(
    `<svg width="${blurWidth}" height="${blurHeight}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f3f4f6"/>
    </svg>`
  )}`;
}

/**
 * Composant Image Hero optimisé pour above-the-fold
 */
export function HeroImage(props: Omit<OptimizedImageProps, 'priority' | 'loading'>) {
  return (
    <OptimizedImage
      {...props}
      priority={true}
      loading="eager"
      placeholder="blur"
      quality={90}
      sizes="(max-width: 768px) 100vw, 80vw"
    />
  );
}

/**
 * Composant Image de contenu avec lazy loading agressif
 */
export function ContentImage(props: Omit<OptimizedImageProps, 'priority' | 'loading'>) {
  return (
    <OptimizedImage
      {...props}
      priority={false}
      loading="lazy"
      quality={75}
    />
  );
}