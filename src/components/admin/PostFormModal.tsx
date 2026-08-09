import React, { useState, useEffect } from 'react';
import { PromptPost, Category, PostStatus } from '../../types';
import { X, Upload, Link as LinkIcon, Sparkles, Image as ImageIcon, Eye, Save, Calendar, Clock, Lock, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useToast } from '../Toast';
import { promptStore } from '../../services/promptStore';
import { compressImageFile, compressDataUrl } from '../../lib/imageUtils';

interface PostFormModalProps {
  isOpen: boolean;
  post: PromptPost | null; // Null means creating new
  categories: Category[];
  onClose: () => void;
  onSave: (
    postData: Omit<PromptPost, 'id' | 'createdAt' | 'updatedAt' | 'views' | 'copies'>,
    existingId?: string
  ) => void;
}

export const PostFormModal: React.FC<PostFormModalProps> = ({
  isOpen,
  post,
  categories,
  onClose,
  onSave,
}) => {
  const [imageMode, setImageMode] = useState<'url' | 'upload'>('url');
  const [imageUrl, setImageUrl] = useState('');
  const [title, setTitle] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [fullPrompt, setFullPrompt] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [featured, setFeatured] = useState(false);
  const [trending, setTrending] = useState(false);
  const [status, setStatus] = useState<PostStatus>('published');
  const [scheduledDate, setScheduledDate] = useState('');
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  // Per-Post Timer Settings
  const [timerEnabled, setTimerEnabled] = useState(true);
  const [timerSeconds, setTimerSeconds] = useState<number>(5);
  const [isUploading, setIsUploading] = useState(false);

  const { showToast } = useToast();

  useEffect(() => {
    if (post) {
      setImageUrl(post.imageUrl || '');
      setTitle(post.title || '');
      setShortDescription(post.shortDescription || '');
      setFullPrompt(post.fullPrompt || '');
      setCategoryId(post.categoryId || (categories[0]?.id || ''));
      setTagsInput(post.tags ? post.tags.join(', ') : '');
      setSeoTitle(post.seoTitle || '');
      setMetaDescription(post.metaDescription || '');
      setFeatured(post.featured || false);
      setTrending(post.trending || false);
      setStatus(post.status || 'published');
      setScheduledDate(post.scheduledDate || '');

      if (post.timerOverride) {
        setTimerEnabled(post.timerOverride.enabled);
        setTimerSeconds(post.timerOverride.seconds ?? 5);
      } else {
        setTimerEnabled(true);
        setTimerSeconds(5);
      }
    } else {
      // Default reset
      setImageUrl('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80');
      setTitle('');
      setShortDescription('');
      setFullPrompt('');
      setCategoryId(categories[0]?.id || 'chatgpt');
      setTagsInput('');
      setSeoTitle('');
      setMetaDescription('');
      setFeatured(false);
      setTrending(false);
      setStatus('published');
      setScheduledDate('');
      setTimerEnabled(true);
      setTimerSeconds(5);
    }
  }, [post, categories, isOpen]);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const cldSettings = promptStore.getCloudinarySettings();
    if (cldSettings.cloudName && cldSettings.uploadPreset) {
      setIsUploading(true);
      showToast('Uploading to Cloudinary', 'Transferring image to your Cloudinary cloud storage...', 'info');
      const res = await promptStore.uploadToCloudinary(file);
      setIsUploading(false);
      if (res.success && res.url) {
        setImageUrl(res.url);
        showToast('Image Uploaded!', 'Secure Cloudinary image URL generated and saved.', 'success');
      } else {
        showToast('Cloudinary Error', res.error || 'Upload failed. Falling back to compressed local preview', 'error');
        setIsUploading(true);
        const compressed = await compressImageFile(file);
        setIsUploading(false);
        setImageUrl(compressed);
      }
    } else {
      // Data URI compressed fallback
      setIsUploading(true);
      const compressed = await compressImageFile(file);
      setIsUploading(false);
      setImageUrl(compressed);
      showToast('Local Preview Loaded', 'Tip: Add Cloudinary keys in Settings for automatic cloud storage', 'info');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      showToast('Title Required', 'Please enter a title for the prompt', 'error');
      return;
    }
    if (!fullPrompt.trim()) {
      showToast('Prompt Required', 'Please enter the full prompt content', 'error');
      return;
    }

    const parsedTags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    let finalImageUrl = imageUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80';
    if (finalImageUrl.startsWith('data:image/')) {
      finalImageUrl = await compressDataUrl(finalImageUrl);
    }

    onSave({
      title,
      shortDescription,
      fullPrompt,
      categoryId: categoryId || categories[0]?.id || 'chatgpt',
      tags: parsedTags,
      imageUrl: finalImageUrl,
      featured,
      trending,
      status,
      scheduledDate,
      seoTitle: seoTitle || `${title} - Sahil Edits Prompt`,
      metaDescription: metaDescription || shortDescription,
      timerOverride: {
        enabled: timerEnabled,
        seconds: timerSeconds,
      },
    }, post?.id);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-zinc-950/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0"
          onClick={onClose}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-3xl max-h-[92vh] flex flex-col rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center border border-blue-500/20">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-zinc-900 dark:text-white">
                  {post ? 'Edit AI Prompt' : 'Publish New AI Prompt'}
                </h3>
                <p className="text-xs text-zinc-500">Fill in prompt parameters and metadata</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsPreviewMode(!isPreviewMode)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  isPreviewMode
                    ? 'bg-blue-600 text-white'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{isPreviewMode ? 'Edit Mode' : 'Preview Card'}</span>
              </button>

              <button
                onClick={onClose}
                className="p-2 rounded-xl text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
            {isPreviewMode ? (
              /* Live Preview Card */
              <div className="p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Card Preview</h4>
                <div className="max-w-sm mx-auto rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-xl">
                  <div className="w-full bg-zinc-100 dark:bg-zinc-950 p-2 flex items-center justify-center rounded-t-3xl">
                    {imageUrl && (
                      <img src={imageUrl} alt="Preview" className="w-full h-auto max-h-[300px] object-contain rounded-2xl" />
                    )}
                  </div>
                  <div className="p-4 space-y-2">
                    <h5 className="font-bold text-base text-zinc-900 dark:text-white">{title || 'Untitled Prompt'}</h5>
                    <p className="text-xs text-zinc-500 line-clamp-2">{shortDescription || 'Short description preview...'}</p>
                    <div className="pt-2 font-mono text-xs bg-zinc-950 text-zinc-200 p-2 rounded-xl line-clamp-3">
                      {fullPrompt || 'Full prompt text preview...'}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Normal Form Fields */
              <>
                {/* Image Source Selection */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Prompt Cover Image
                  </label>
                  <div className="flex items-center gap-2 mb-2">
                    <button
                      type="button"
                      onClick={() => setImageMode('url')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                        imageMode === 'url'
                          ? 'bg-blue-600 text-white'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                      }`}
                    >
                      <LinkIcon className="w-3.5 h-3.5" />
                      <span>Photo URL</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setImageMode('upload')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                        imageMode === 'upload'
                          ? 'bg-blue-600 text-white'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                      }`}
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Image / Cloudinary</span>
                    </button>
                  </div>

                  {imageMode === 'url' ? (
                    <input
                      type="url"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/photo-..."
                      className="w-full px-4 py-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-blue-500"
                    />
                  ) : (
                    <div className="flex items-center gap-3">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="text-xs text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-600 dark:file:bg-zinc-800 dark:file:text-zinc-300 hover:file:bg-blue-100"
                      />
                    </div>
                  )}

                  {imageUrl && (
                    <div className="w-28 h-20 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 mt-2 bg-zinc-100 dark:bg-zinc-950 p-1 flex items-center justify-center">
                      <img src={imageUrl} alt="Thumbnail" className="w-full h-full object-contain rounded-lg" />
                    </div>
                  )}
                </div>

                {/* Title & Category */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g., Cyberpunk Midjourney v6 Portrait"
                      className="w-full px-4 py-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      Category *
                    </label>
                    <select
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-blue-500"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Short Description */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Short Description
                  </label>
                  <input
                    type="text"
                    value={shortDescription}
                    onChange={(e) => setShortDescription(e.target.value)}
                    placeholder="Brief 1-2 sentence overview for the card preview..."
                    className="w-full px-4 py-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Full Prompt Text */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Full AI Prompt Text *
                  </label>
                  <textarea
                    rows={6}
                    value={fullPrompt}
                    onChange={(e) => setFullPrompt(e.target.value)}
                    placeholder="Paste the full exact prompt text here..."
                    className="w-full px-4 py-3 rounded-2xl bg-zinc-950 border border-zinc-800 font-mono text-sm text-zinc-100 focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                {/* Tags */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Tags (Comma Separated)
                  </label>
                  <input
                    type="text"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="e.g. Midjourney, Photorealistic, 3D, Cyberpunk"
                    className="w-full px-4 py-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Individual Post Timer Settings */}
                <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-500" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                        Post Timer Unlock Settings
                      </h4>
                    </div>
                    <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={timerEnabled}
                        onChange={(e) => setTimerEnabled(e.target.checked)}
                        className="w-4 h-4 rounded text-amber-500"
                      />
                      <span>{timerEnabled ? 'Timer Enabled' : 'Timer Disabled'}</span>
                    </label>
                  </div>

                  {timerEnabled && (
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-zinc-500">Lock Duration:</span>
                      <select
                        value={timerSeconds}
                        onChange={(e) => setTimerSeconds(Number(e.target.value))}
                        className="px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-900 dark:text-white"
                      >
                        <option value={0}>0s (Instant Unlock)</option>
                        <option value={3}>3 Seconds</option>
                        <option value={5}>5 Seconds (Default)</option>
                        <option value={10}>10 Seconds</option>
                        <option value={15}>15 Seconds</option>
                        <option value={20}>20 Seconds</option>
                        <option value={30}>30 Seconds</option>
                        <option value={60}>60 Seconds</option>
                      </select>
                    </div>
                  )}
                </div>

                {/* SEO Fields */}
                <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    SEO Metadata (Optional)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={seoTitle}
                      onChange={(e) => setSeoTitle(e.target.value)}
                      placeholder="SEO Page Title"
                      className="px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white"
                    />
                    <input
                      type="text"
                      value={metaDescription}
                      onChange={(e) => setMetaDescription(e.target.value)}
                      placeholder="Meta Description"
                      className="px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Toggles & Status */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <label className="flex items-center gap-3 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={featured}
                      onChange={(e) => {
                        const willBeFeatured = e.target.checked;
                        if (willBeFeatured) {
                          const current = promptStore.getFeaturedPost();
                          if (current && current.id !== post?.id) {
                            const replace = window.confirm(
                              `Replace the current Featured Post ("${current.title}")?`
                            );
                            if (!replace) return;
                          }
                        }
                        setFeatured(willBeFeatured);
                      }}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Featured Post</span>
                  </label>

                  <label className="flex items-center gap-3 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={trending}
                      onChange={(e) => {
                        const willBeTrending = e.target.checked;
                        if (willBeTrending) {
                          const current = promptStore.getTrendingPost();
                          if (current && current.id !== post?.id) {
                            const replace = window.confirm(
                              `Replace the current Trending Post ("${current.title}")?`
                            );
                            if (!replace) return;
                          }
                        }
                        setTrending(willBeTrending);
                      }}
                      className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500"
                    />
                    <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Trending Post</span>
                  </label>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                      Publish Status
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as PostStatus)}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white font-semibold"
                    >
                      <option value="published">Published</option>
                      <option value="draft">Save Draft</option>
                      <option value="scheduled">Scheduled</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            {/* Modal Actions */}
            <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    setStatus('draft');
                    handleSubmit(e);
                  }}
                  className="px-4 py-2.5 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 font-bold text-xs border border-amber-500/30 transition-colors flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Draft</span>
                </button>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isUploading}
                  className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-blue-500/25 flex items-center gap-2 transition-all"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Uploading Image...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>
                        {post
                          ? status === 'draft'
                            ? 'Update Draft'
                            : 'Update & Publish'
                          : status === 'draft'
                          ? 'Save as Draft'
                          : 'Publish Prompt'}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
