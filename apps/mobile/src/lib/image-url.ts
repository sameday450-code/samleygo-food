import { api } from './axios';

/**
 * Returns a proxied URL that loads images through the API server.
 * This fixes network issues where the phone can't reach Cloudinary directly.
 */
export function getImageUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;

  // If it's a Cloudinary URL, proxy it through our API
  if (url.startsWith('https://res.cloudinary.com/')) {
    return `${api.defaults.baseURL}/image-proxy?url=${encodeURIComponent(url)}`;
  }

  // For other URLs, return as-is
  return url;
}
