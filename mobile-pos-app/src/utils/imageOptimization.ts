import * as React from 'react';
import { Image, View } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { cacheManager, CacheKeys, CacheTTL } from './cache';

interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
  cacheKey?: string;
}

interface OptimizedImageResult {
  uri: string;
  width: number;
  height: number;
  fromCache: boolean;
}

export class ImageOptimizer {
  private static instance: ImageOptimizer;
  private imageCache: Map<string, OptimizedImageResult> = new Map();
  private readonly MAX_CACHE_SIZE = 50; // Maximum images in memory

  static getInstance(): ImageOptimizer {
    if (!ImageOptimizer.instance) {
      ImageOptimizer.instance = new ImageOptimizer();
    }
    return ImageOptimizer.instance;
  }

  async optimizeImage(
    sourceUri: string,
    options: ImageOptimizationOptions = {}
  ): Promise<OptimizedImageResult> {
    const {
      width = 800,
      height = 600,
      quality = 80,
      format = 'webp',
      cacheKey,
    } = options;

    // Generate cache key if not provided
    const finalCacheKey = cacheKey || `image:${sourceUri}:${width}x${height}:${quality}:${format}`;

    // Check memory cache first
    const cachedImage = this.imageCache.get(finalCacheKey);
    if (cachedImage) {
      return { ...cachedImage, fromCache: true };
    }

    // Check persistent cache
    const cachedData = await cacheManager.get<OptimizedImageResult>(finalCacheKey);
    if (cachedData) {
      this.imageCache.set(finalCacheKey, cachedData);
      return { ...cachedData, fromCache: true };
    }

    // Optimize the image
    try {
      const optimized = await this.performOptimization(sourceUri, {
        width,
        height,
        quality,
        format,
      });

      // Cache the result
      this.imageCache.set(finalCacheKey, optimized);
      await cacheManager.set(finalCacheKey, optimized, CacheTTL.LONG);

      // Implement LRU eviction
      if (this.imageCache.size > this.MAX_CACHE_SIZE) {
        const oldestKey = this.imageCache.keys().next().value;
        if (oldestKey) {
          this.imageCache.delete(oldestKey);
        }
      }

      return { ...optimized, fromCache: false };
    } catch (error) {
      console.warn('Image optimization failed:', error);
      // Return original image as fallback
      return {
        uri: sourceUri,
        width,
        height,
        fromCache: false,
      };
    }
  }

  private async performOptimization(
    sourceUri: string,
    options: Required<Omit<ImageOptimizationOptions, 'cacheKey'>>
  ): Promise<OptimizedImageResult> {
    // For React Native, we'll use the Image component's built-in optimization
    // and add query parameters for server-side optimization if available
    
    const { width, height, quality, format } = options;
    
    // Get original image dimensions
    const originalDimensions = await this.getImageDimensions(sourceUri);
    
    // Calculate optimal dimensions maintaining aspect ratio
    const optimalDimensions = this.calculateOptimalDimensions(
      originalDimensions,
      { width, height }
    );

    // Build optimized URL with query parameters
    const optimizedUri = this.buildOptimizedUrl(sourceUri, {
      width: optimalDimensions.width,
      height: optimalDimensions.height,
      quality,
      format,
    });

    return {
      uri: optimizedUri,
      width: optimalDimensions.width,
      height: optimalDimensions.height,
      fromCache: false,
    };
  }

  private async getImageDimensions(uri: string): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      Image.getSize(
        uri,
        (width, height) => resolve({ width, height }),
        (error) => {
          console.warn('Failed to get image dimensions:', error);
          // Return default dimensions
          resolve({ width: 800, height: 600 });
        }
      );
    });
  }

  private calculateOptimalDimensions(
    original: { width: number; height: number },
    target: { width: number; height: number }
  ): { width: number; height: number } {
    const { width: origWidth, height: origHeight } = original;
    const { width: targetWidth, height: targetHeight } = target;

    // Calculate aspect ratios
    const origAspect = origWidth / origHeight;
    const targetAspect = targetWidth / targetHeight;

    let optimalWidth = targetWidth;
    let optimalHeight = targetHeight;

    if (origAspect > targetAspect) {
      // Image is wider than target - constrain by width
      optimalHeight = Math.round(targetWidth / origAspect);
    } else {
      // Image is taller than target - constrain by height
      optimalWidth = Math.round(targetHeight * origAspect);
    }

    // Don't upscale
    if (optimalWidth > origWidth || optimalHeight > origHeight) {
      return { width: origWidth, height: origHeight };
    }

    return { width: optimalWidth, height: optimalHeight };
  }

  private buildOptimizedUrl(
    originalUri: string,
    options: { width: number; height: number; quality: number; format: string }
  ): string {
    // Check if URL already has query parameters
    const separator = originalUri.includes('?') ? '&' : '?';
    
    // Add optimization parameters
    // These would typically be handled by your image CDN or server
    const params = new URLSearchParams({
      w: options.width.toString(),
      h: options.height.toString(),
      q: options.quality.toString(),
      format: options.format,
      auto: 'compress',
    });

    return `${originalUri}${separator}${params.toString()}`;
  }

  async preloadImages(
    imageUrls: string[],
    options: ImageOptimizationOptions = {}
  ): Promise<void> {
    const preloadPromises = imageUrls.map(url => 
      this.optimizeImage(url, options).catch(error => 
        console.warn(`Failed to preload image ${url}:`, error)
      )
    );

    await Promise.all(preloadPromises);
  }

  clearCache(): void {
    this.imageCache.clear();
  }

  async invalidateCache(pattern?: string): Promise<void> {
    this.clearCache();
    if (pattern) {
      await cacheManager.invalidatePattern(`image:${pattern}`);
    } else {
      await cacheManager.invalidatePattern('image:');
    }
  }
}

export const imageOptimizer = ImageOptimizer.getInstance();

// React Native Image component wrapper with optimization
export const OptimizedImage = ({
  source,
  style,
  optimizationOptions = {},
  ...props
}: {
  source: { uri: string } | number;
  style?: any;
  optimizationOptions?: ImageOptimizationOptions;
  [key: string]: any;
}) => {
  const [optimizedSource, setOptimizedSource] = React.useState(source);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (typeof source === 'object' && source.uri) {
      setLoading(true);
      imageOptimizer
        .optimizeImage(source.uri, optimizationOptions)
        .then(result => {
          setOptimizedSource({ uri: result.uri });
          setLoading(false);
        })
        .catch(error => {
          console.warn('Image optimization failed:', error);
          setOptimizedSource(source);
          setLoading(false);
        });
    }
  }, [source, optimizationOptions]);

  if (loading && typeof source === 'object' && source.uri) {
    return React.createElement(
      View,
      { style: [style, { justifyContent: 'center', alignItems: 'center' }] },
      React.createElement(ActivityIndicator, { size: 'small' })
    );
  }

  return React.createElement(Image as any, { source: optimizedSource, style, ...(props || {}) });
};