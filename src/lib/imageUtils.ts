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
