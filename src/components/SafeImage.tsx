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
  showErrorMessage?: boolean; // New prop to control if error message is shown
  [key: string]: any; // Allow additional props
}

/**
 * A component that safely displays images with proper error handling and error display
 */
export default function SafeImage({
  src,
  alt,
  className = '',
  width,
  height,
  fallbackSrc = '/GoLoco-creation.png',
  onError,
  showErrorMessage = true, // Default to showing error messages
  ...rest
}: SafeImageProps) {
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const imageSource = getSafeImageUrl(src);
  
  const handleError = () => {
    const message = `Image failed to load: ${imageSource}`;
    console.error(message);
    setError(true);
    setErrorMessage(message);
    if (onError) onError();
  };
  
  const handleLoad = () => {
    setLoading(false);
  };

  if (error && showErrorMessage) {
    return (
      <div 
        className={`flex flex-col items-center justify-center p-4 border border-dashed border-red-400 bg-red-50 text-red-700 ${className}`}
        style={{ width, height, minHeight: '100px' }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <p className="text-xs text-center">Image failed to load</p>
        <p className="text-xs text-center break-all mt-1 max-w-full">{src?.substring(0, 50)}{src && src.length > 50 ? '...' : ''}</p>
      </div>
    );
  }

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
