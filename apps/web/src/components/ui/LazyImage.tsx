import React, { useState, useRef, useEffect } from 'react';
import { clsx } from 'clsx';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholder?: string;
  width?: number;
  height?: number;
  onLoad?: () => void;
  onError?: () => void;
  priority?: boolean;
}

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className,
  placeholder,
  width,
  height,
  onLoad,
  onError,
  priority = false,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (priority) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '50px 0px',
        threshold: 0.1,
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [priority]);

  const handleLoad = () => {
    setIsLoaded(true);
    setError(false);
    onLoad?.();
  };

  const handleError = () => {
    setError(true);
    onError?.();
  };

  return (
    <div
      className={clsx(
        'relative overflow-hidden',
        width && height && 'inline-block',
        className
      )}
      style={width && height ? { width, height } : undefined}
    >
      {/* Loading skeleton */}
      {!isLoaded && (
        <div
          className={clsx(
            'absolute inset-0 bg-gray-200 animate-pulse',
            isLoaded && 'hidden'
          )}
        />
      )}

      {/* Low-quality placeholder */}
      {placeholder && !isLoaded && !error && (
        <img
          src={placeholder}
          alt=""
          className="absolute inset-0 w-full h-full object-cover blur-sm"
          style={{ transform: 'scale(1.1)' }}
        />
      )}

      {/* Actual image */}
      {isInView && (
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          className={clsx(
            'w-full h-full object-cover transition-opacity duration-300',
            isLoaded ? 'opacity-100' : 'opacity-0'
          )}
          onLoad={handleLoad}
          onError={handleError}
          loading={priority ? 'eager' : 'lazy'}
          width={width}
          height={height}
        />
      )}

      {/* Error state */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <svg
            className="w-12 h-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
      )}
    </div>
  );
};