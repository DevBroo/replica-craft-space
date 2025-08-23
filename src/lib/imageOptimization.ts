// Image optimization utilities for better performance

/**
 * Generates optimized image URL using Cloudinary transformations
 * @param imageUrl - Original image URL
 * @param options - Transformation options
 */
export const getOptimizedImageUrl = (
  imageUrl: string,
  options: {
    width?: number;
    height?: number;
    quality?: 'auto' | number;
    format?: 'auto' | 'webp' | 'jpg' | 'png';
    crop?: 'fill' | 'fit' | 'scale' | 'crop';
  } = {}
): string => {
  // If not a Cloudinary URL, return original
  if (!imageUrl.includes('cloudinary.com') && !imageUrl.includes('res.cloudinary.com')) {
    return imageUrl;
  }

  const {
    width = 600,
    height,
    quality = 'auto',
    format = 'auto',
    crop = 'fill'
  } = options;

  try {
    // Build transformation string
    const transformations = [];
    
    if (width) transformations.push(`w_${width}`);
    if (height) transformations.push(`h_${height}`);
    if (crop) transformations.push(`c_${crop}`);
    if (quality) transformations.push(`q_${quality}`);
    if (format) transformations.push(`f_${format}`);

    const transformString = transformations.join(',');

    // Insert transformations into Cloudinary URL
    if (imageUrl.includes('/upload/')) {
      return imageUrl.replace('/upload/', `/upload/${transformString}/`);
    }

    return imageUrl;
  } catch (error) {
    console.warn('Failed to optimize image URL:', error);
    return imageUrl;
  }
};

/**
 * Generates different sizes for responsive images
 */
export const getResponsiveImageUrls = (imageUrl: string) => {
  return {
    thumbnail: getOptimizedImageUrl(imageUrl, { width: 300, height: 200 }),
    small: getOptimizedImageUrl(imageUrl, { width: 600, height: 400 }),
    medium: getOptimizedImageUrl(imageUrl, { width: 900, height: 600 }),
    large: getOptimizedImageUrl(imageUrl, { width: 1200, height: 800 }),
    original: imageUrl
  };
};

/**
 * Get appropriate sizes attribute for responsive images
 */
export const getImageSizes = (context: 'grid' | 'hero' | 'detail' = 'grid'): string => {
  switch (context) {
    case 'hero':
      return '(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px';
    case 'detail':
      return '(max-width: 768px) 100vw, (max-width: 1200px) 60vw, 800px';
    case 'grid':
    default:
      return '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 400px';
  }
};