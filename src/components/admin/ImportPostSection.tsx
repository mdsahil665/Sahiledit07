import React, { useState } from 'react';
import { Category, PostStatus, PromptPost } from '../../types';
import {
  ArrowLeft,
  Globe,
  Download,
  Image as ImageIcon,
  Upload,
  Trash2,
  Check,
  AlertCircle,
  Loader2,
  Sparkles,
  Save,
  Send,
  Eye,
  FileText,
  Link2,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useToast } from '../Toast';
import { promptStore } from '../../services/promptStore';

interface ImportPostSectionProps {
  isOpen: boolean;
  categories: Category[];
  onClose: () => void;
  onSuccess: () => void;
}

export const ImportPostSection: React.FC<ImportPostSectionProps> = ({
  isOpen,
  categories,
  onClose,
  onSuccess,
}) => {
  const { showToast } = useToast();

  const [inputUrl, setInputUrl] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Editable Form States
  const [step, setStep] = useState<'paste' | 'preview'>('paste');
  const [title, setTitle] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [fullPrompt, setFullPrompt] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [authorName, setAuthorName] = useState('');

  // Image states
  const [imageUrl, setImageUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  // Status & Publishing
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  // STEP 1: FETCH URL CONTENT
  const handleFetchUrl = async () => {
    const trimmedUrl = inputUrl.trim();
    if (!trimmedUrl) {
      setFetchError('Please enter a valid post URL.');
      return;
    }

    if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
      setFetchError('Please enter a valid URL starting with http:// or https://');
      return;
    }

    setIsFetching(true);
    setFetchError(null);

    try {
      let fetchedHtml = '';
      let isBlocked = false;

      // Attempt 1: Fetch via CORS Proxy
      try {
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(trimmedUrl)}`;
        const res = await fetch(proxyUrl, { method: 'GET' });
        if (res.ok) {
          const data = await res.json();
          fetchedHtml = data.contents || '';
        }
      } catch {
        // Proxy failed, try direct fetch fallback
        try {
          const directRes = await fetch(trimmedUrl, { mode: 'cors' });
          if (directRes.ok) {
            fetchedHtml = await directRes.text();
          } else if (directRes.status === 403 || directRes.status === 401) {
            isBlocked = true;
          }
        } catch {
          isBlocked = true;
        }
      }

      if (isBlocked || !fetchedHtml) {
        throw new Error('Unable to import this URL. The source may block automated access.');
      }

      // Parse HTML metadata safely using DOMParser
      const parser = new DOMParser();
      const doc = parser.parseFromString(fetchedHtml, 'text/html');

      // Helper to query meta tags
      const getMeta = (props: string[]) => {
        for (const prop of props) {
          const el =
            doc.querySelector(`meta[property="${prop}"]`) ||
            doc.querySelector(`meta[name="${prop}"]`) ||
            doc.querySelector(`meta[itemprop="${prop}"]`);
          if (el && el.getAttribute('content')) {
            return el.getAttribute('content')!.trim();
          }
        }
        return '';
      };

      const metaTitle =
        getMeta(['og:title', 'twitter:title', 'title']) ||
        doc.querySelector('title')?.textContent?.trim() ||
        doc.querySelector('h1')?.textContent?.trim() ||
        '';

      const metaDesc =
        getMeta(['og:description', 'twitter:description', 'description']) || '';

      const metaImage =
        getMeta(['og:image', 'twitter:image', 'image']) ||
        doc.querySelector('img')?.getAttribute('src') ||
        '';

      const metaSite =
        getMeta(['og:site_name', 'author', 'twitter:creator']) || '';

      // Try finding main content paragraph or code block if available
      let extractedPrompt = metaDesc;
      const codeOrPre = doc.querySelector('pre, code, blockquote');
      if (codeOrPre && codeOrPre.textContent && codeOrPre.textContent.length > 30) {
        extractedPrompt = codeOrPre.textContent.trim();
      }

      // Check if we extracted meaningful info
      if (!metaTitle && !metaDesc) {
        throw new Error('Unable to import this URL. The source may block automated access.');
      }

      // Resolve relative image URL if needed
      let finalImg = metaImage;
      if (finalImg && !finalImg.startsWith('http')) {
        try {
          const baseUrl = new URL(trimmedUrl);
          finalImg = new URL(finalImg, baseUrl.origin).href;
        } catch {
          finalImg = '';
        }
      }

      // Populate extracted values into form
      setTitle(metaTitle || 'Imported Prompt');
      setShortDescription(metaDesc || metaTitle || '');
      setFullPrompt(extractedPrompt || metaDesc || metaTitle || '');
      setImageUrl(finalImg || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80');
      setImagePreviewUrl(finalImg || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80');
      setSourceUrl(trimmedUrl);
      setAuthorName(metaSite || 'Web Source');
      setCategoryId(categories[0]?.id || 'chatgpt');
      setTagsInput('Imported, AI Prompt');

      setStep('preview');
      showToast('URL Fetched Successfully', 'Review and edit the extracted content before publishing.', 'success');
    } catch (err: any) {
      const errorMsg =
        err?.message || 'Unable to import this URL. The source may block automated access.';
      setFetchError(errorMsg);
      showToast('Import Failed', errorMsg, 'error');
    } finally {
      setIsFetching(false);
    }
  };

  // STEP 3: IMAGE HANDLING
  const handleSaveImageToPhone = async () => {
    const targetUrl = imagePreviewUrl || imageUrl;
    if (!targetUrl) {
      showToast('No Image', 'There is no image to save.', 'info');
      return;
    }

    try {
      showToast('Downloading Image...', 'Preparing image for saving to device', 'info');
      const response = await fetch(targetUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `imported_prompt_image_${Date.now()}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
      showToast('Saved to Device', 'Image saved successfully to downloads folder.');
    } catch {
      // Fallback
      window.open(targetUrl, '_blank');
      showToast('Opened Image', 'Image opened in new tab. Long press to save on mobile.');
    }
  };

  const handleChooseImageFromPhone = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setImagePreviewUrl(objectUrl);
    showToast('Image Selected', 'Local image chosen. It will be uploaded on save.');
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setImagePreviewUrl(null);
    setImageUrl('');
    showToast('Image Removed', 'The prompt will be saved without an image.', 'info');
  };

  // STEP 4, 5, 6: PUBLISH / SAVE AS DRAFT
  const handleSavePost = async (publishStatus: PostStatus) => {
    if (!title.trim()) {
      showToast('Title Required', 'Please enter a post title.', 'error');
      return;
    }

    if (!fullPrompt.trim()) {
      showToast('Prompt Required', 'Please enter full prompt content.', 'error');
      return;
    }

    setIsSaving(true);
    let finalImage = imageUrl;

    try {
      // If admin selected an image file from phone, upload it using existing Cloudinary system
      if (selectedFile) {
        showToast('Uploading Image', 'Transferring selected image to Cloudinary...', 'info');
        const uploadRes = await promptStore.uploadToCloudinary(selectedFile);
        if (uploadRes.success && uploadRes.url) {
          finalImage = uploadRes.url;
        } else {
          throw new Error(uploadRes.error || 'Failed to upload selected image to Cloudinary.');
        }
      }

      if (!finalImage) {
        finalImage =
          'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80';
      }

      const selectedCategory = categories.find((c) => c.id === categoryId);
      const categoryName = selectedCategory?.name || 'ChatGPT';

      const parsedTags = tagsInput
        ? tagsInput
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean)
        : [categoryName, 'Imported'];

      const newPostData: Omit<PromptPost, 'id' | 'createdAt' | 'updatedAt' | 'views' | 'copies'> = {
        title: title.trim(),
        shortDescription: shortDescription.trim() || title.trim(),
        fullPrompt: fullPrompt.trim(),
        categoryId: categoryId || categories[0]?.id || 'chatgpt',
        categoryName: categoryName,
        tags: parsedTags,
        imageUrl: finalImage,
        featured: false,
        trending: false,
        status: publishStatus,
        likes: 0,
        seoTitle: title.trim(),
        metaDescription: shortDescription.trim() || title.trim(),
      };

      await promptStore.addPost(newPostData as any);

      showToast(
        publishStatus === 'published' ? 'Post Published!' : 'Draft Saved!',
        `The imported post "${title.trim()}" has been saved.`,
        'success'
      );

      onSuccess();
      onClose();
    } catch (err: any) {
      showToast('Save Failed', err?.message || 'Failed to save post.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950/95 backdrop-blur-xl flex flex-col overflow-y-auto overflow-x-hidden text-zinc-100">
      {/* Top Fixed Header */}
      <div className="sticky top-0 z-20 px-4 py-3 bg-zinc-900/90 border-b border-zinc-800 flex items-center justify-between gap-4 backdrop-blur-md">
        <button
          onClick={onClose}
          type="button"
          className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>← Back to Admin Dashboard</span>
        </button>

        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-indigo-400" />
          <h1 className="text-sm sm:text-base font-bold text-white tracking-wide">
            Import Post from URL
          </h1>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-4xl mx-auto w-full p-4 sm:p-6 space-y-6">
        {step === 'paste' ? (
          /* STEP 1: PASTE URL */
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-3xl bg-zinc-900/80 border border-zinc-800 space-y-6 shadow-2xl"
          >
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-semibold border border-indigo-500/20">
                <Globe className="w-3.5 h-3.5" /> Step 1 — Paste URL
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                Paste Web Post URL
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400">
                Enter the address of a publicly accessible prompt page or article to auto-extract details.
              </p>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider">
                Paste Post URL
              </label>
              <div className="relative">
                <input
                  type="url"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  placeholder="https://example.com/prompt-post-123"
                  className="w-full px-4 py-3.5 pr-12 rounded-2xl bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                />
                <Link2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 pointer-events-none" />
              </div>
            </div>

            {fetchError && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs sm:text-sm flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Import Notice</p>
                  <p>{fetchError}</p>
                </div>
              </div>
            )}

            <button
              onClick={handleFetchUrl}
              disabled={isFetching || !inputUrl.trim()}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white font-bold text-sm shadow-xl shadow-indigo-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {isFetching ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Fetching Public Metadata...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Fetch Post</span>
                </>
              )}
            </button>
          </motion.div>
        ) : (
          /* STEP 2-5: PREVIEW, EDIT & IMAGE HANDLING */
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Header info bar */}
            <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-indigo-300">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>Extracted from: <strong className="text-white">{sourceUrl}</strong></span>
              </div>
              <button
                type="button"
                onClick={() => setStep('paste')}
                className="text-xs text-indigo-400 hover:text-white underline cursor-pointer"
              >
                Change URL
              </button>
            </div>

            {/* Editable Form */}
            <div className="p-6 rounded-3xl bg-zinc-900/80 border border-zinc-800 space-y-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-400" />
                <span>Edit Imported Details</span>
              </h3>

              {/* Title */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider">
                  Post Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter prompt title..."
                  className="w-full px-4 py-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Short Description */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider">
                  Short Description
                </label>
                <textarea
                  rows={2}
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  placeholder="Short overview..."
                  className="w-full px-4 py-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              {/* Full Prompt */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider">
                  Full Prompt Content *
                </label>
                <textarea
                  rows={5}
                  value={fullPrompt}
                  onChange={(e) => setFullPrompt(e.target.value)}
                  placeholder="Paste or edit the full prompt..."
                  className="w-full px-4 py-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              {/* Category & Tags */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider">
                    Category *
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-white text-sm focus:outline-none focus:border-indigo-500"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider">
                    Tags (Comma separated)
                  </label>
                  <input
                    type="text"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="ChatGPT, Midjourney, Photo, AI"
                    className="w-full px-4 py-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* STEP 3: IMAGE HANDLING */}
              <div className="space-y-4 pt-4 border-t border-zinc-800">
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider">
                  Image Handling & Preview
                </label>

                {imagePreviewUrl ? (
                  <div className="relative rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950 max-h-72 flex items-center justify-center">
                    <img
                      src={imagePreviewUrl}
                      alt="Import Preview"
                      className="max-h-72 w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="p-8 rounded-2xl border-2 border-dashed border-zinc-800 text-center text-zinc-500 text-xs">
                    No image attached
                  </div>
                )}

                {/* Image Buttons */}
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleSaveImageToPhone}
                    className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-emerald-400" />
                    <span>Save Image to Phone</span>
                  </button>

                  <label className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer">
                    <Upload className="w-4 h-4" />
                    <span>Choose Image from Phone</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleChooseImageFromPhone}
                      className="hidden"
                    />
                  </label>

                  {imagePreviewUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Remove Image</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Publish / Draft Buttons */}
              <div className="pt-6 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => handleSavePost('draft')}
                  disabled={isSaving}
                  className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Save className="w-4 h-4 text-amber-400" />
                  <span>Save as Draft</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSavePost('published')}
                  disabled={isSaving}
                  className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Publishing...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Publish Post</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};
