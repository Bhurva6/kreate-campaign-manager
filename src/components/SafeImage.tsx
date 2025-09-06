'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { getSafeImageUrl } from '@/lib/image-utils';

interface SafeImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  fallbackSrc?: string;
  onError?: () => void;
  [key: string]: any; // Allow additional props
}

/**
 * A component that safely displays images with proper error handling and fallbacks
 */
export default function SafeImage({
  src,
  alt,
  className = '',
  width,
  height,
  fallbackSrc = '/GoLoco-creation.png',
  onError,
  ...rest
}: SafeImageProps) {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const imageSource = error ? fallbackSrc : getSafeImageUrl(src);
  
  const handleError = () => {
    console.error(`Image failed to load: ${imageSource}`);
    setError(true);
    if (onError) onError();
  };
  
  const handleLoad = () => {
    setLoading(false);
  };

  return (
    <div className="relative">
      {/* Native img tag with explicit dimensions for better performance */}
      <img
        src={imageSource}
        alt={alt}
        className={`${className} ${loading ? 'opacity-0' : 'opacity-100'}`}
        onError={handleError}
        onLoad={handleLoad}
        width={width}
        height={height}
        loading="eager"
        crossOrigin="anonymous"
        {...rest}
      />
      
      {/* Show loading state */}
      {loading && (
        <div 
          className={`absolute inset-0 bg-gray-200 animate-pulse ${className}`}
          style={{ width, height }}
        />
      )}
    </div>
  );
}
