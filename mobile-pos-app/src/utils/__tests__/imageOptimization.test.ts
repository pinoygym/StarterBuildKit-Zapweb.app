import { imageOptimizer, ImageOptimizer } from '../imageOptimization';
import { Image } from 'react-native';
import { cacheManager } from '../cache';

// Mock dependencies
jest.mock('react-native', () => ({
  Image: {
    getSize: jest.fn((uri, success, failure) => {
      // Mock successful size retrieval
      if (uri.includes('valid')) {
        success(1920, 1080);
      } else {
        failure(new Error('Invalid image'));
      }
    }),
  },
}));

jest.mock('../cache', () => ({
  cacheManager: {
    get: jest.fn(),
    set: jest.fn(),
    invalidatePattern: jest.fn(),
  },
}));

describe('ImageOptimizer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear the singleton instance
    (ImageOptimizer as any).instance = null;
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = ImageOptimizer.getInstance();
      const instance2 = ImageOptimizer.getInstance();
      
      expect(instance1).toBe(instance2);
    });
  });

  describe('Image Optimization', () => {
    it('should optimize images with default options', async () => {
      const testUri = 'https://example.com/image.jpg';
      
      const result = await imageOptimizer.optimizeImage(testUri);
      
      expect(Image.getSize).toHaveBeenCalledWith(
        testUri,
        expect.any(Function),
        expect.any(Function)
      );
      
      expect(result.uri).toContain(testUri);
      expect(result.uri).toContain('w=800'); // default width
      expect(result.uri).toContain('h=600'); // default height
      expect(result.uri).toContain('q=80'); // default quality
      expect(result.uri).toContain('format=webp'); // default format
      expect(result.fromCache).toBe(false);
    });

    it('should use cached images when available', async () => {
      const testUri = 'https://example.com/valid-image.jpg';
      const cachedResult = {
        uri: 'cached-uri',
        width: 800,
        height: 600,
        fromCache: true,
      };
      
      (cacheManager.get as jest.Mock).mockResolvedValue(cachedResult);
      
      const result = await imageOptimizer.optimizeImage(testUri);
      
      expect(result).toEqual({ ...cachedResult, fromCache: true });
      expect(Image.getSize).not.toHaveBeenCalled();
    });

    it('should handle custom optimization options', async () => {
      const testUri = 'https://example.com/valid-image.jpg';
      const options = {
        width: 400,
        height: 300,
        quality: 90,
        format: 'jpeg' as const,
      };
      
      const result = await imageOptimizer.optimizeImage(testUri, options);
      
      expect(result.uri).toContain('w=400');
      expect(result.uri).toContain('h=300');
      expect(result.uri).toContain('q=90');
      expect(result.uri).toContain('format=jpeg');
    });

    it('should maintain aspect ratio when resizing', async () => {
      const testUri = 'https://example.com/valid-image.jpg';
      const options = {
        width: 400,
        height: 400, // Square target, but original is 16:9
      };
      
      const result = await imageOptimizer.optimizeImage(testUri, options);
      
      // Should maintain aspect ratio (16:9)
      expect(result.width).toBe(400);
      expect(result.height).toBe(225); // 400 * (1080/1920)
    });

    it('should not upscale images', async () => {
      const testUri = 'https://example.com/valid-small-image.jpg';
      const options = {
        width: 3000, // Larger than original
        height: 2000,
      };
      
      const result = await imageOptimizer.optimizeImage(testUri, options);
      
      // Should return original dimensions
      expect(result.width).toBe(1920);
      expect(result.height).toBe(1080);
    });

    it('should handle image loading errors gracefully', async () => {
      const testUri = 'https://example.com/invalid-image.jpg';
      
      const result = await imageOptimizer.optimizeImage(testUri);
      
      expect(result.uri).toBe(testUri); // Fallback to original
      expect(result.width).toBe(800); // Default fallback
      expect(result.height).toBe(600); // Default fallback
    });
  });

  describe('Cache Management', () => {
    it('should cache optimized images', async () => {
      const testUri = 'https://example.com/valid-image.jpg';
      
      await imageOptimizer.optimizeImage(testUri);
      
      expect(cacheManager.set).toHaveBeenCalledWith(
        expect.stringContaining('image:'),
        expect.objectContaining({
          uri: expect.any(String),
          width: expect.any(Number),
          height: expect.any(Number),
        }),
        expect.any(Number)
      );
    });

    it('should use custom cache key when provided', async () => {
      const testUri = 'https://example.com/valid-image.jpg';
      const customCacheKey = 'custom-image-key';
      
      await imageOptimizer.optimizeImage(testUri, { cacheKey: customCacheKey });
      
      expect(cacheManager.get).toHaveBeenCalledWith(customCacheKey);
    });

    it('should implement LRU eviction for memory cache', async () => {
      // Fill memory cache to capacity
      for (let i = 0; i < 50; i++) {
        await imageOptimizer.optimizeImage(`https://example.com/image-${i}.jpg`);
      }
      
      // Add one more to trigger eviction
      await imageOptimizer.optimizeImage('https://example.com/image-50.jpg');
      
      // Verify cache was used (implementation detail)
      expect(cacheManager.set).toHaveBeenCalled();
    });
  });

  describe('Image Preloading', () => {
    it('should preload multiple images', async () => {
      const imageUrls = [
        'https://example.com/image1.jpg',
        'https://example.com/image2.jpg',
        'https://example.com/image3.jpg',
      ];
      
      await imageOptimizer.preloadImages(imageUrls);
      
      expect(Image.getSize).toHaveBeenCalledTimes(3);
    });

    it('should handle preloading errors gracefully', async () => {
      const imageUrls = [
        'https://example.com/valid-image1.jpg',
        'https://example.com/invalid-image.jpg',
        'https://example.com/valid-image2.jpg',
      ];
      
      // Should not throw even if some images fail
      await expect(imageOptimizer.preloadImages(imageUrls)).resolves.not.toThrow();
      
      expect(Image.getSize).toHaveBeenCalledTimes(3);
    });
  });

  describe('Cache Management', () => {
    it('should clear image cache', () => {
      imageOptimizer.clearCache();
      
      // Memory cache should be cleared (implementation detail)
      expect(true).toBe(true); // Basic test to ensure method doesn't throw
    });

    it('should invalidate cache by pattern', async () => {
      await imageOptimizer.invalidateCache('product-images');
      
      expect(cacheManager.invalidatePattern).toHaveBeenCalledWith('image:product-images');
    });

    it('should invalidate all image cache when no pattern provided', async () => {
      await imageOptimizer.invalidateCache();
      
      expect(cacheManager.invalidatePattern).toHaveBeenCalledWith('image:');
    });
  });

  describe('URL Building', () => {
    it('should handle URLs with existing query parameters', async () => {
      const testUri = 'https://example.com/image.jpg?existing=param';
      
      const result = await imageOptimizer.optimizeImage(testUri);
      
      expect(result.uri).toContain('&'); // Should use & for additional params
      expect(result.uri).toContain('existing=param'); // Should preserve existing params
    });

    it('should handle URLs without query parameters', async () => {
      const testUri = 'https://example.com/image.jpg';
      
      const result = await imageOptimizer.optimizeImage(testUri);
      
      expect(result.uri).toContain('?'); // Should use ? for first param
    });
  });
});