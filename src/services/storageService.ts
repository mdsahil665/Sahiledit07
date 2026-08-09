import { promptStore } from './promptStore';

export interface UploadProgressCallback {
  (progress: number): void;
}

/**
 * Compresses an image file client-side before uploading.
 * Max width/height 1200px, quality 0.85. SVGs are bypassed.
 */
export async function compressImage(
  file: File,
  maxWidth = 1200,
  maxHeight = 1200,
  quality = 0.85
): Promise<Blob> {
  if (file.type === 'image/svg+xml') {
    return file; // SVGs don't need canvas compression
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              resolve(file);
            }
          },
          mimeType,
          quality
        );
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}

/**
 * Uploads directly to Cloudinary Free using Unsigned Upload API
 * Provides 0-100% progress callback via XMLHttpRequest
 */
export async function uploadToCloudinary(
  fileOrBlob: File | Blob,
  fileName: string,
  _folder = '',
  onProgress?: UploadProgressCallback
): Promise<string> {
  const cldSettings = promptStore.getCloudinarySettings();
  const cloudName = cldSettings.cloudName?.trim() || 'dvahk0xom';
  const uploadPreset = cldSettings.uploadPreset?.trim() || 'sahil_logo';

  if (!cloudName || !uploadPreset) {
    throw new Error('Cloudinary Cloud Name or Upload Preset is missing. Please configure in Admin Settings.');
  }

  const formData = new FormData();
  const fileToUpload =
    fileOrBlob instanceof File
      ? fileOrBlob
      : new File([fileOrBlob], fileName, { type: fileOrBlob.type || 'image/png' });

  formData.append('file', fileToUpload);
  formData.append('upload_preset', uploadPreset);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`);

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          onProgress(percent);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          if (response.secure_url) {
            resolve(response.secure_url);
          } else {
            reject(new Error('Cloudinary response missing secure_url'));
          }
        } catch {
          reject(new Error('Invalid JSON response from Cloudinary'));
        }
      } else {
        try {
          const errResp = JSON.parse(xhr.responseText);
          reject(new Error(errResp.error?.message || `Cloudinary upload failed (Status ${xhr.status})`));
        } catch {
          reject(new Error(`Cloudinary upload failed with status ${xhr.status}`));
        }
      }
    };

    xhr.onerror = () => {
      reject(new Error('Network error uploading to Cloudinary. Check connection and Cloudinary settings.'));
    };

    xhr.send(formData);
  });
}

/**
 * Upload site logo helper
 */
export async function uploadSiteLogo(
  fileOrBlob: File | Blob,
  fileName: string,
  onProgress?: UploadProgressCallback
): Promise<string> {
  return uploadToCloudinary(fileOrBlob, fileName, 'site_logos', onProgress);
}

/**
 * Upload user profile photo helper
 */
export async function uploadUserProfilePhoto(
  uid: string,
  fileOrBlob: File | Blob,
  fileName: string,
  onProgress?: UploadProgressCallback
): Promise<string> {
  return uploadToCloudinary(fileOrBlob, fileName, `users/${uid}`, onProgress);
}

/**
 * No-op deletion for client-side Cloudinary unsigned storage
 */
export async function deleteStorageFileByUrl(_url: string): Promise<void> {
  // Client-side unsigned API cannot delete assets directly (requires API secret).
}
