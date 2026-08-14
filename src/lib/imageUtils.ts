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

