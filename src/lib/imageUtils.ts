export function compressDataUrl(
  dataUrl: string,
  maxWidth = 800,
  maxHeight = 800,
  quality = 0.75
): Promise<string> {
  if (!dataUrl || !dataUrl.startsWith('data:image/')) {
    return Promise.resolve(dataUrl);
  }

  // If already reasonable size (< 150KB string), return as is
  if (dataUrl.length < 200000) {
    return Promise.resolve(dataUrl);
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > maxWidth || height > maxHeight) {
        if (width / height > maxWidth / maxHeight) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL('image/jpeg', quality);
        resolve(compressed);
      } else {
        resolve('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80');
      }
    };
    img.onerror = () => {
      resolve('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80');
    };
    img.src = dataUrl;
  });
}

export function compressImageFile(
  file: File,
  maxWidth = 800,
  maxHeight = 800,
  quality = 0.75
): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      if (!src) {
        resolve('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80');
        return;
      }
      compressDataUrl(src, maxWidth, maxHeight, quality).then(resolve);
    };
    reader.onerror = () => resolve('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80');
    reader.readAsDataURL(file);
  });
}

function sanitizeUrl(url: string): string {
  if (!url) return '';
  let clean = url.trim();
  if (clean.startsWith('//')) {
    clean = `https:${clean}`;
  } else if (clean.startsWith('http://')) {
    clean = clean.replace(/^http:\/\//i, 'https://');
  }
  return clean;
}

export function getPostMainCoverImage(post: any): string {
  const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80';
  if (!post) return DEFAULT_IMAGE;

  // 1. Check gallery array
  if (post.gallery && Array.isArray(post.gallery) && post.gallery.length > 0) {
    for (const item of post.gallery) {
      if (typeof item === 'object' && item !== null) {
        if (item.isCover && typeof item.url === 'string' && item.url.trim().length > 0) {
          return sanitizeUrl(item.url);
        }
      }
    }
    const first = post.gallery[0];
    if (typeof first === 'string' && first.trim().length > 0) {
      return sanitizeUrl(first);
    }
    if (typeof first === 'object' && first !== null && typeof (first as any).url === 'string' && (first as any).url.trim().length > 0) {
      return sanitizeUrl((first as any).url);
    }
  }

  // 2. Check images array
  if (post.images && Array.isArray(post.images) && post.images.length > 0) {
    const firstImg = post.images[0];
    if (typeof firstImg === 'string' && firstImg.trim().length > 0) {
      return sanitizeUrl(firstImg);
    }
    if (typeof firstImg === 'object' && firstImg !== null && typeof (firstImg as any).url === 'string' && (firstImg as any).url.trim().length > 0) {
      return sanitizeUrl((firstImg as any).url);
    }
  }

  // 3. Check imageUrl / image
  if (typeof post.imageUrl === 'string' && post.imageUrl.trim().length > 0) {
    return sanitizeUrl(post.imageUrl);
  }
  if (typeof post.image === 'string' && post.image.trim().length > 0) {
    return sanitizeUrl(post.image);
  }

  return DEFAULT_IMAGE;
}

/**
 * Strips transformation parameters from a Cloudinary URL to get the original asset URL.
 * Preserves the original file format, dimensions, and quality.
 */
export function getCloudinaryOriginalUrl(url: string): string {
  if (!url || typeof url !== 'string') return url || '';
  const trimmed = url.trim();
  if (!trimmed.includes('cloudinary.com') || !trimmed.includes('/image/upload/')) {
    // For Unsplash images, remove downscaling constraints if present
    if (trimmed.includes('images.unsplash.com')) {
      try {
        const u = new URL(trimmed);
        u.searchParams.delete('w');
        u.searchParams.delete('h');
        u.searchParams.set('q', '100');
        return u.toString();
      } catch {
        return trimmed;
      }
    }
    return trimmed;
  }

  try {
    const parsed = new URL(trimmed);
    const pathname = parsed.pathname;
    const uploadIndex = pathname.indexOf('/image/upload/');
    if (uploadIndex === -1) return trimmed;

    const prefix = pathname.substring(0, uploadIndex + '/image/upload/'.length);
    const rest = pathname.substring(uploadIndex + '/image/upload/'.length);

    const segments = rest.split('/').filter(Boolean);
    const cleanSegments: string[] = [];

    // Cloudinary transformation parameter pattern (e.g. w_800, c_fill, q_auto, f_auto, fl_attachment, etc.)
    const isTransformSegment = (seg: string): boolean => {
      if (/^v\d+$/.test(seg)) return false; // Version segment, e.g. v1786738769
      if (seg === 'f_auto' || seg === 'q_auto' || seg.includes('q_auto') || seg.includes('f_auto')) return true;
      if (seg.startsWith('w_') || seg.startsWith('h_') || seg.startsWith('c_') || seg.startsWith('fl_')) return true;
      if (seg.startsWith('dpr_') || seg.startsWith('e_') || seg.startsWith('b_') || seg.startsWith('ar_')) return true;
      if (seg.startsWith('g_') || seg.startsWith('r_') || seg.startsWith('o_') || seg.startsWith('co_')) return true;
      if (seg.includes(',') && (seg.includes('w_') || seg.includes('c_') || seg.includes('q_') || seg.includes('f_'))) return true;
      return false;
    };

    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      if (/^v\d+$/.test(seg)) {
        // From version segment onwards, keep everything (version + public_id + extension)
        cleanSegments.push(...segments.slice(i));
        break;
      }
      if (isTransformSegment(seg)) {
        continue; // Skip transformation segment
      }
      // Reached public ID or folder path without version
      cleanSegments.push(...segments.slice(i));
      break;
    }

    parsed.pathname = `${prefix}${cleanSegments.join('/')}`;
    parsed.search = '';
    return parsed.toString();
  } catch {
    return trimmed;
  }
}

/**
 * Returns the highest quality original URL for any image (Cloudinary, Unsplash, or direct).
 */
export function getOriginalImageUrl(url: string): string {
  return getCloudinaryOriginalUrl(url);
}

/**
 * Generates an optimized display URL for web rendering.
 * Does NOT affect the original stored URL or downloadable file.
 */
export function getOptimizedDisplayUrl(
  url: string,
  options: { width?: number; height?: number; crop?: 'limit' | 'fill' | 'scale'; quality?: string } = {}
): string {
  if (!url || typeof url !== 'string') return url || '';
  const clean = url.trim();

  // If data URI or SVG, return as is
  if (clean.startsWith('data:') || clean.endsWith('.svg')) {
    return clean;
  }

  // Cloudinary optimization
  if (clean.includes('cloudinary.com') && clean.includes('/image/upload/')) {
    const originalUrl = getCloudinaryOriginalUrl(clean);
    try {
      const parsed = new URL(originalUrl);
      const pathname = parsed.pathname;
      const uploadIndex = pathname.indexOf('/image/upload/');
      if (uploadIndex === -1) return originalUrl;

      const prefix = pathname.substring(0, uploadIndex + '/image/upload/'.length);
      const rest = pathname.substring(uploadIndex + '/image/upload/'.length);

      const parts: string[] = ['f_auto', 'q_auto'];
      if (options.width) parts.push(`w_${options.width}`);
      if (options.height) parts.push(`h_${options.height}`);
      if (options.crop) parts.push(`c_${options.crop}`);
      else if (options.width || options.height) parts.push('c_limit');

      parsed.pathname = `${prefix}${parts.join(',')}/${rest}`;
      return parsed.toString();
    } catch {
      return originalUrl;
    }
  }

  // Unsplash optimization for display
  if (clean.includes('images.unsplash.com')) {
    try {
      const u = new URL(clean);
      u.searchParams.set('auto', 'format');
      u.searchParams.set('fit', 'crop');
      if (options.width) u.searchParams.set('w', String(options.width));
      u.searchParams.set('q', options.quality || '80');
      return u.toString();
    } catch {
      return clean;
    }
  }

  return clean;
}

/**
 * Generates a Cloudinary download URL using fl_attachment so the browser triggers
 * native file download with Content-Disposition: attachment header.
 */
export function getCloudinaryDownloadUrl(url: string, filename?: string): string {
  if (!url || typeof url !== 'string') return url || '';
  const originalUrl = getCloudinaryOriginalUrl(url);

  if (!originalUrl.includes('cloudinary.com') || !originalUrl.includes('/image/upload/')) {
    return originalUrl;
  }

  try {
    const parsed = new URL(originalUrl);
    const pathname = parsed.pathname;
    const uploadIndex = pathname.indexOf('/image/upload/');
    if (uploadIndex === -1) return originalUrl;

    const prefix = pathname.substring(0, uploadIndex + '/image/upload/'.length);
    const rest = pathname.substring(uploadIndex + '/image/upload/'.length);

    const safeName = filename ? sanitizeDownloadFilename(filename) : '';
    const flag = safeName ? `fl_attachment:${safeName}` : 'fl_attachment';

    parsed.pathname = `${prefix}${flag}/${rest}`;
    return parsed.toString();
  } catch {
    return originalUrl;
  }
}

/**
 * Extracts the file extension from an image URL (e.g. 'png', 'jpg', 'webp').
 */
export function getFileExtensionFromUrl(url: string, fallback = 'jpg'): string {
  if (!url) return fallback;
  try {
    const pathname = new URL(url, 'https://example.com').pathname;
    const lastPart = pathname.split('/').pop() || '';
    const dotIndex = lastPart.lastIndexOf('.');
    if (dotIndex !== -1 && dotIndex < lastPart.length - 1) {
      const ext = lastPart.substring(dotIndex + 1).toLowerCase();
      if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'bmp', 'avif'].includes(ext)) {
        return ext === 'jpeg' ? 'jpg' : ext;
      }
    }
  } catch {}
  return fallback;
}

/**
 * Cleans a filename string for safe file downloading.
 */
export function sanitizeDownloadFilename(name: string, fallback = 'image'): string {
  if (!name) return fallback;
  const clean = name
    .replace(/[^a-zA-Z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 80);
  return clean || fallback;
}

/**
 * Downloads the highest-quality / original version of an image.
 * Uses the original Cloudinary asset URL and preserves the original file format (PNG, JPG, WEBP).
 */
export async function downloadImage(
  imageUrl: string,
  preferredTitle: string,
  imageIndex?: number
): Promise<void> {
  if (!imageUrl) {
    throw new Error('No image URL provided for download.');
  }

  // 1. Resolve true original asset URL (free from any downscaling / display transformations)
  const originalUrl = getOriginalImageUrl(imageUrl);

  // 2. Determine appropriate file extension from original URL
  const ext = getFileExtensionFromUrl(originalUrl, 'jpg');
  const baseName = sanitizeDownloadFilename(preferredTitle, 'image');
  const indexSuffix = imageIndex !== undefined ? `_${imageIndex + 1}` : '';
  const finalFilename = `${baseName}${indexSuffix}.${ext}`;

  // 3. For Cloudinary, prepare attachment URL
  const attachmentUrl = getCloudinaryDownloadUrl(originalUrl, `${baseName}${indexSuffix}`);

  // 4. Primary method: Fetch as blob to force native browser save
  try {
    const response = await fetch(originalUrl, {
      method: 'GET',
      mode: 'cors',
      cache: 'no-cache',
    });

    if (response.ok) {
      const blob = await response.blob();
      if (blob.size > 0) {
        // Detect blob type extension if available
        let blobExt = ext;
        if (blob.type === 'image/png') blobExt = 'png';
        else if (blob.type === 'image/jpeg') blobExt = 'jpg';
        else if (blob.type === 'image/webp') blobExt = 'webp';

        const blobFilename = `${baseName}${indexSuffix}.${blobExt}`;
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = blobFilename;
        document.body.appendChild(link);
        link.click();
        window.URL.revokeObjectURL(blobUrl);
        document.body.removeChild(link);
        return;
      }
    }
  } catch (err) {
    // Fetch failed (CORS or network policy), proceed to attachment fallback
    console.warn('Direct blob fetch failed, falling back to attachment URL', err);
  }

  // 5. Fallback method: Use attachment link with Content-Disposition fl_attachment
  try {
    const link = document.createElement('a');
    link.href = attachmentUrl;
    link.download = finalFilename;
    link.target = '_self';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch {
    window.open(attachmentUrl, '_blank');
  }
}
