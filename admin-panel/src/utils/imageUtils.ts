import { apiClient } from '../services/api.config.gateway';

/**
 * Generate a URL for a manga cover image
 * @param mangaId The ID of the manga
 * @returns URL to the manga cover image
 */
export const getMangaCoverUrl = (mangaId: string): string => {
  // Use the API Gateway URL as the base
  const baseUrl = apiClient.defaults.baseURL || '';
  return `${baseUrl}/api/images/cover/manga/${mangaId}`;
};

/**
 * Generate a URL for a volume cover image
 * @param volumeId The ID of the volume
 * @returns URL to the volume cover image
 */
export const getVolumeCoverUrl = (volumeId: string): string => {
  const baseUrl = apiClient.defaults.baseURL || '';
  return `${baseUrl}/api/images/cover/volume/${volumeId}`;
};

/**
 * Generate a URL for an image by its ID
 * @param imageId The ID of the image
 * @returns URL to the image
 */
export const getImageUrl = (imageId: string): string => {
  const baseUrl = apiClient.defaults.baseURL || '';
  return `${baseUrl}/api/images/${imageId}`;
};

/**
 * Generate a local placeholder image URL based on text
 * @param text Text to display in the placeholder
 * @param width Width of the placeholder
 * @param height Height of the placeholder
 * @returns URL to a data URI for a simple placeholder
 */
export const getLocalPlaceholderUrl = (text: string, width = 400, height = 600): string => {
  // Create a canvas element
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  
  // Draw background
  ctx.fillStyle = '#f0f0f0';
  ctx.fillRect(0, 0, width, height);
  
  // Draw text
  ctx.fillStyle = '#999999';
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Split text into multiple lines if it's too long
  const words = text.split(' ');
  const lines = [];
  let currentLine = words[0];
  
  for (let i = 1; i < words.length; i++) {
    const testLine = currentLine + ' ' + words[i];
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;
    
    if (testWidth > width - 40) {
      lines.push(currentLine);
      currentLine = words[i];
    } else {
      currentLine = testLine;
    }
  }
  
  lines.push(currentLine); // Add the last line
  
  // Draw each line
  const lineHeight = 20;
  const startY = height / 2 - ((lines.length - 1) * lineHeight) / 2;
  
  lines.forEach((line, index) => {
    ctx.fillText(line, width / 2, startY + index * lineHeight);
  });
  
  // Convert canvas to data URL
  return canvas.toDataURL('image/png');
};

/**
 * Get a cover image URL with fallback to a local placeholder
 * @param entity The manga or volume object
 * @param type The type of entity ('manga' or 'volume')
 * @returns URL to the cover image or a placeholder
 */
export const getCoverImageUrlWithFallback = (entity: any, type: 'manga' | 'volume'): string => {
  if (!entity) {
    // Default placeholder for null entity
    return getLocalPlaceholderUrl('Нет изображения');
  }
  
  // If the entity already has a coverImageUrl, use it
  if (entity.coverImageUrl) {
    return entity.coverImageUrl;
  }
  
  // If we have a cover image ID, construct the URL based on entity type
  if (type === 'volume' && entity.coverImageId) {
    return getVolumeCoverUrl(entity.id);
  } else if (type === 'manga' && entity.coverImageId) {
    return getMangaCoverUrl(entity.id);
  }
  
  // Generate a placeholder with the entity's title
  const title = entity.title || (type === 'manga' ? 'Манга без названия' : 'Том без названия');
  return getLocalPlaceholderUrl(title);
};