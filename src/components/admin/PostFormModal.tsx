import React, { useState, useEffect } from 'react';
import { PromptPost, Category, PostStatus, BadgeMode, BadgeType } from '../../types';
import { ALL_BADGE_TYPES } from '../../services/badgeService';
import {
  X,
  Upload,
  Link as LinkIcon,
  Sparkles,
  Image as ImageIcon,
  Eye,
  Save,
  Calendar,
  Clock,
  Lock,
  Loader2,
  FileText,
  Sliders,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  Trash2,
  Plus,
  Images,
  Star,
  Tag,
  Zap,
  Film,
  Video,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useToast } from '../Toast';
import { promptStore, getPostGallery } from '../../services/promptStore';
import { compressImageFile, compressDataUrl, getCloudinaryOriginalUrl, getOptimizedDisplayUrl } from '../../lib/imageUtils';

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
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [newUrlInput, setNewUrlInput] = useState('');
  const [title, setTitle] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [photoPrompt, setPhotoPrompt] = useState('');
  const [videoPrompt, setVideoPrompt] = useState('');
  const [activePromptTab, setActivePromptTab] = useState<'photo' | 'video'>('photo');
  const [categoryId, setCategoryId] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [featured, setFeatured] = useState(false);
  const [trending, setTrending] = useState(false);
  const [status, setStatus] = useState<PostStatus>('published');
  const [scheduledDate, setScheduledDate] = useState('');
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  // Per-Post Badge Settings
  const [badgeMode, setBadgeMode] = useState<BadgeMode>('automatic');
  const [badgeType, setBadgeType] = useState<BadgeType>('AI PROMPT');

  // Per-Post Timer Settings
  const [timerEnabled, setTimerEnabled] = useState(true);
  const [timerSeconds, setTimerSeconds] = useState<number>(5);
  const [isUploading, setIsUploading] = useState(false);

  const { showToast } = useToast();
  const featureControls = promptStore.getFeatureControls();
  const isMultiGalleryEnabled = featureControls.multiImageGallery !== false;

  useEffect(() => {
    if (post) {
      // Edit mode: load all existing images safely
      const existingImgs = getPostGallery(post);
      setGalleryImages(existingImgs);
      setImageUrl(existingImgs[0] || post.imageUrl || '');
      setTitle(post.title || '');
      setShortDescription(post.shortDescription || '');

      // Load photo prompt & video prompt safely, preserving existing data
      const existingPhotoPrompt =
        post.photoPrompt ||
        (post.postType !== 'video_prompt' ? post.fullPrompt : '') ||
        '';
      const existingVideoPrompt =
        post.videoPrompt ||
        (post.postType === 'video_prompt' ? post.fullPrompt : '') ||
        '';

      setPhotoPrompt(existingPhotoPrompt);
      setVideoPrompt(existingVideoPrompt);

      // Default active tab to video if video-only post, otherwise photo
      if (existingVideoPrompt && !existingPhotoPrompt) {
        setActivePromptTab('video');
      } else {
        setActivePromptTab('photo');
      }

      setCategoryId(post.categoryId || (categories[0]?.id || ''));
      setTagsInput(post.tags ? post.tags.join(', ') : '');
      setSeoTitle(post.seoTitle || '');
      setMetaDescription(post.metaDescription || '');
      setFeatured(post.featured || false);
      setTrending(post.trending || false);
      setStatus(post.status || 'published');
      setScheduledDate(post.scheduledDate || '');
      setBadgeMode(post.badgeMode || 'automatic');
      setBadgeType((post.badgeType as BadgeType) || 'AI PROMPT');

      if (post.timerOverride) {
        setTimerEnabled(post.timerOverride.enabled);
        setTimerSeconds(post.timerOverride.seconds ?? 5);
      } else {
        setTimerEnabled(true);
        setTimerSeconds(5);
      }
    } else {
      // New post: Gallery MUST start completely clean with 0 images
      setGalleryImages([]);
      setImageUrl('');
      setTitle('');
      setShortDescription('');
      setPhotoPrompt('');
      setVideoPrompt('');
      setActivePromptTab('photo');
      setCategoryId(categories[0]?.id || 'chatgpt');
      setTagsInput('');
      setSeoTitle('');
      setMetaDescription('');
      setFeatured(false);
      setTrending(false);
      setStatus('published');
      setScheduledDate('');
      setBadgeMode('automatic');
      setBadgeType('AI PROMPT');
      setTimerEnabled(true);
      setTimerSeconds(5);
    }
    setNewUrlInput('');
  }, [post, categories, isOpen]);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const cldSettings = promptStore.getCloudinarySettings();
    if (cldSettings.cloudName && cldSettings.uploadPreset) {
      setIsUploading(true);
      showToast('Uploading to Cloudinary', 'Transferring image to your Cloudinary storage...', 'info');
      const res = await promptStore.uploadToCloudinary(file);
      setIsUploading(false);
      if (res.success && res.url) {
        const uploadedUrl = res.url;
        setGalleryImages((prev) => [...prev, uploadedUrl]);
        setImageUrl((prev) => prev || uploadedUrl);
        showToast('Image Uploaded!', 'Secure Cloudinary image URL added to post gallery.', 'success');
      } else {
        showToast('Cloudinary Error', res.error || 'Upload failed. Falling back to compressed local preview', 'error');
        setIsUploading(true);
        const compressed = await compressImageFile(file);
        setIsUploading(false);
        setGalleryImages((prev) => [...prev, compressed]);
        setImageUrl((prev) => prev || compressed);
      }
    } else {
      // Data URI compressed fallback
      setIsUploading(true);
      const compressed = await compressImageFile(file);
      setIsUploading(false);
      setGalleryImages((prev) => [...prev, compressed]);
      setImageUrl((prev) => prev || compressed);
      showToast('Image Added', 'Added compressed image to gallery. Add Cloudinary credentials in Settings for cloud URLs.', 'info');
    }
  };

  const handleMultipleFilesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    showToast('Uploading Images', `Processing ${files.length} image file(s)...`, 'info');

    const uploadedUrls: string[] = [];
    const cldSettings = promptStore.getCloudinarySettings();

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (cldSettings.cloudName && cldSettings.uploadPreset) {
        const res = await promptStore.uploadToCloudinary(file);
        if (res.success && res.url) {
          uploadedUrls.push(res.url);
        } else {
          const compressed = await compressImageFile(file);
          uploadedUrls.push(compressed);
        }
      } else {
        const compressed = await compressImageFile(file);
        uploadedUrls.push(compressed);
      }
    }

    setIsUploading(false);
    if (uploadedUrls.length > 0) {
      setGalleryImages((prev) => [...prev, ...uploadedUrls]);
      setImageUrl((prev) => prev || uploadedUrls[0]);
      showToast('Images Uploaded!', `Added ${uploadedUrls.length} image(s) to post gallery.`, 'success');
    }
  };

  const handleAddUrlToGallery = () => {
    if (!newUrlInput.trim()) return;
    const cleanUrl = getCloudinaryOriginalUrl(newUrlInput.trim());
    setGalleryImages((prev) => [...prev, cleanUrl]);
    setImageUrl((prev) => prev || cleanUrl);
    setNewUrlInput('');
    showToast('Image Added', 'Original image URL attached to post gallery.', 'success');
  };

  const handleMoveImage = (index: number, direction: 'left' | 'right') => {
    if (direction === 'left' && index === 0) return;
    if (direction === 'right' && index === galleryImages.length - 1) return;
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    const updated = [...galleryImages];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setGalleryImages(updated);
    setImageUrl(updated[0] || '');
  };

  const handleSetAsMainCover = (index: number) => {
    if (index === 0 || index >= galleryImages.length) return;
    const selected = galleryImages[index];
    const remaining = galleryImages.filter((_, i) => i !== index);
    const reordered = [selected, ...remaining];
    setGalleryImages(reordered);
    setImageUrl(selected);
    showToast('Main Cover Updated', 'Image set as the primary cover.', 'info');
  };

  const handleDeleteImage = (index: number) => {
    const updated = galleryImages.filter((_, i) => i !== index);
    setGalleryImages(updated);
    setImageUrl(updated[0] || '');
    showToast('Image Removed', 'Removed image from gallery.', 'info');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      showToast('Title Required', 'Please enter a title for the prompt', 'error');
      return;
    }

    const photoTrimmed = photoPrompt.trim();
    const videoTrimmed = videoPrompt.trim();

    if (!photoTrimmed && !videoTrimmed) {
      showToast('Prompt Content Required', 'Please enter a Photo Prompt or a Video Prompt (or both)', 'error');
      return;
    }

    const parsedTags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const finalGallery = galleryImages.filter((img) => typeof img === 'string' && img.trim().length > 0);

    // Compress data URI images if present
    const processedGallery: string[] = [];
    for (const img of finalGallery) {
      if (img.startsWith('data:image/')) {
        processedGallery.push(await compressDataUrl(img));
      } else {
        processedGallery.push(img);
      }
    }

    const coverUrl = processedGallery[0] || (imageUrl.trim().length > 0 ? imageUrl.trim() : '');

    // Determine postType:
    // If only video prompt provided (no photo prompt), postType is 'video_prompt'.
    // If photo prompt provided (with or without video prompt), postType is 'photo_prompt'.
    const resolvedPostType: 'photo_prompt' | 'video_prompt' =
      !photoTrimmed && videoTrimmed ? 'video_prompt' : 'photo_prompt';

    onSave(
      {
        title: title.trim(),
        shortDescription: shortDescription.trim() || (photoTrimmed || videoTrimmed).slice(0, 140) + '...',
        fullPrompt: photoTrimmed || videoTrimmed,
        photoPrompt: photoTrimmed || undefined,
        videoPrompt: videoTrimmed || undefined,
        postType: resolvedPostType,
        categoryId: categoryId || categories[0]?.id || 'chatgpt',
        tags: parsedTags,
        imageUrl: coverUrl,
        images: processedGallery,
        gallery: processedGallery,
        featured,
        trending,
        status,
        scheduledDate,
        badgeMode,
        badgeType: badgeMode === 'manual' ? badgeType : (!photoTrimmed && videoTrimmed ? 'VIDEO PROMPT' : undefined),
        seoTitle: seoTitle || `${title.trim()} - Sahil Edits Prompt`,
        metaDescription: metaDescription || shortDescription,
        timerOverride: {
          enabled: timerEnabled,
          seconds: timerSeconds,
        },
      },
      post?.id
    );
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0"
          onClick={onClose}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl bg-zinc-900 border border-zinc-800 shadow-2xl overflow-hidden z-10"
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-zinc-800 bg-zinc-950/80">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white text-xs font-bold transition-all cursor-pointer border border-zinc-700/60 shrink-0 group active:scale-95"
                title="Back to Posts CMS"
                aria-label="Back to Posts CMS"
              >
                <ArrowLeft className="w-4 h-4 text-blue-400 group-hover:-translate-x-0.5 transition-transform" />
                <span className="hidden sm:inline">Back</span>
              </button>

              <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-400 hidden sm:flex items-center justify-center border border-blue-500/20 shadow-md">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base sm:text-lg text-white">
                  {post ? 'Edit AI Prompt Post' : 'Publish New AI Prompt'}
                </h3>
                <p className="text-[11px] sm:text-xs text-zinc-400">Configure prompt info, media, badges, and SEO metadata</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsPreviewMode(!isPreviewMode)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  isPreviewMode
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{isPreviewMode ? 'Back to Editor' : 'Live Card Preview'}</span>
              </button>

              <button
                onClick={onClose}
                className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Form Scrollable Body */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            {isPreviewMode ? (
              /* Live Preview Card */
              <div className="p-6 rounded-3xl bg-zinc-950 border border-zinc-800 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Card Preview</h4>
                <div className="max-w-sm mx-auto rounded-3xl bg-zinc-900 border border-zinc-800 overflow-hidden shadow-2xl p-4 space-y-3">
                  {imageUrl && (
                    <img src={imageUrl} alt="Preview" className="w-full h-48 object-cover rounded-2xl border border-zinc-800" />
                  )}
                  <h5 className="font-bold text-base text-white">{title || 'Untitled Prompt'}</h5>
                  <p className="text-xs text-zinc-400 line-clamp-2">{shortDescription || 'Short description preview...'}</p>
                  <div className="font-mono text-xs bg-zinc-950 text-zinc-300 p-3 rounded-xl border border-zinc-800 line-clamp-3">
                    {photoPrompt || videoPrompt || 'Prompt text preview...'}
                  </div>
                </div>
              </div>
            ) : (
              /* Editor Structured Cards */
              <div className="space-y-6">
                {/* CARD 1: POST INFORMATION */}
                <div className="p-6 rounded-3xl bg-zinc-950/60 border border-zinc-800/80 space-y-4">
                  <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
                    <FileText className="w-4 h-4 text-blue-400" />
                    <h4 className="text-xs font-black uppercase tracking-wider text-zinc-300">
                      1. Post Information
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-xs font-bold text-zinc-300">Prompt Title *</label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Ultra-Realistic Cinematic Portrait Generator"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-2.5 text-xs font-semibold text-white focus:outline-none focus:border-blue-500"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-300">Category *</label>
                      <select
                        value={categoryId}
                        onChange={(e) => setCategoryId(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-2.5 text-xs font-semibold text-white focus:outline-none focus:border-blue-500"
                      >
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-300">Tags (Comma Separated)</label>
                      <input
                        type="text"
                        value={tagsInput}
                        onChange={(e) => setTagsInput(e.target.value)}
                        placeholder="chatgpt, portrait, photorealistic, Midjourney"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-2.5 text-xs font-semibold text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-xs font-bold text-zinc-300">Short Summary / Description</label>
                      <input
                        type="text"
                        value={shortDescription}
                        onChange={(e) => setShortDescription(e.target.value)}
                        placeholder="Brief 1-2 sentence overview of what this prompt creates..."
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-2.5 text-xs font-semibold text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    {/* Prompt Section with [ PHOTO PROMPT ] and [ VIDEO PROMPT ] */}
                    <div className="sm:col-span-2 space-y-4 pt-2">
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800/80 pb-3">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-blue-400" />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black uppercase tracking-wider text-zinc-200">
                                Prompt Content
                              </span>
                              <span className="text-[11px] text-zinc-400 font-medium">
                                (Photo Prompt is primary • Video Prompt is optional)
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* [ PHOTO PROMPT ] [ VIDEO PROMPT ] TABS */}
                        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-zinc-900/90 border border-zinc-800">
                          <button
                            type="button"
                            onClick={() => setActivePromptTab('photo')}
                            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
                              activePromptTab === 'photo'
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
                            }`}
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>PHOTO PROMPT</span>
                            {photoPrompt.trim().length > 0 && (
                              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Photo Prompt has content" />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => setActivePromptTab('video')}
                            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
                              activePromptTab === 'video'
                                ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-lg shadow-rose-600/30'
                                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
                            }`}
                          >
                            <Film className="w-3.5 h-3.5" />
                            <span>VIDEO PROMPT</span>
                            <span className="text-[10px] font-semibold opacity-75">(Optional)</span>
                            {videoPrompt.trim().length > 0 && (
                              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Video Prompt has content" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Prompt Status Pill Bar */}
                      <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-[11px]">
                        <div className="text-zinc-400 font-medium">
                          {activePromptTab === 'photo' ? (
                            <span>
                              📷 <strong className="text-zinc-200">Photo Prompt</strong> — for Midjourney, DALL-E, ChatGPT, Stable Diffusion
                            </span>
                          ) : (
                            <span>
                              🎬 <strong className="text-zinc-200">Video Prompt (Optional)</strong> — for Runway Gen-3, Luma Dream Machine, Sora, Kling, Pika
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              photoPrompt.trim()
                                ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                                : 'bg-zinc-900 text-zinc-500'
                            }`}
                          >
                            Photo: {photoPrompt.trim() ? 'Configured ✓' : 'Empty'}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              videoPrompt.trim()
                                ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                                : 'bg-zinc-900 text-zinc-500'
                            }`}
                          >
                            Video: {videoPrompt.trim() ? 'Configured ✓' : 'Empty (Optional)'}
                          </span>
                        </div>
                      </div>

                      {/* Tab 1: Photo Prompt Input */}
                      {activePromptTab === 'photo' && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-zinc-300">
                              Photo Prompt Content {!videoPrompt.trim() && '*'}
                            </label>
                            <span className="text-[11px] text-zinc-500 font-mono">
                              {photoPrompt.length} characters
                            </span>
                          </div>
                          <textarea
                            rows={6}
                            value={photoPrompt}
                            onChange={(e) => setPhotoPrompt(e.target.value)}
                            placeholder="Enter detailed photo prompt instructions, subject description, lighting, style, aspect ratio, camera settings..."
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-xs font-mono text-zinc-200 focus:outline-none focus:border-blue-500 leading-relaxed custom-scrollbar"
                          />
                          <p className="text-[11px] text-zinc-400">
                            Provide high-detail prompts for AI image generation. You can also switch to the <strong className="text-zinc-300">Video Prompt</strong> tab to add an optional video prompt to this same post.
                          </p>
                        </div>
                      )}

                      {/* Tab 2: Video Prompt Input */}
                      {activePromptTab === 'video' && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-zinc-300">
                              Video Prompt Content <span className="text-zinc-500 font-normal">(Optional addition)</span>
                            </label>
                            <span className="text-[11px] text-zinc-500 font-mono">
                              {videoPrompt.length} characters
                            </span>
                          </div>
                          <textarea
                            rows={6}
                            value={videoPrompt}
                            onChange={(e) => setVideoPrompt(e.target.value)}
                            placeholder="Enter video prompt instructions (e.g. camera motion, cinematic pan, subject action, framerate, lighting dynamics...)"
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-xs font-mono text-zinc-200 focus:outline-none focus:border-rose-500 leading-relaxed custom-scrollbar"
                          />
                          <div className="p-3 rounded-xl bg-zinc-900/70 border border-zinc-800/80 text-[11px] text-zinc-400 space-y-1">
                            <p className="font-semibold text-zinc-300">💡 Flexible Publishing Rules:</p>
                            <ul className="list-disc pl-4 space-y-0.5 text-zinc-400">
                              <li><strong className="text-zinc-200">Video Prompt Only:</strong> Leave photo prompt and image gallery empty — the post will publish cleanly with no photo container or placeholders.</li>
                              <li><strong className="text-zinc-200">Photo + Video Prompt:</strong> Both will be presented on this single post, with Photo Prompt first followed by Video Prompt.</li>
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* CARD 2: POST IMAGES / GALLERY */}
                <div className="p-6 rounded-3xl bg-zinc-950/60 border border-zinc-800/80 space-y-5">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-purple-400" />
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-wider text-zinc-300">
                          2. Post Images / Gallery {isMultiGalleryEnabled ? `(${galleryImages.length} Image${galleryImages.length === 1 ? '' : 's'})` : ''}
                        </h4>
                        <p className="text-[11px] text-zinc-400 font-normal">
                          {isMultiGalleryEnabled
                            ? 'The FIRST image is used as the MAIN/COVER image on home feed. Additional images are shown inside the post gallery.'
                            : 'Set the main image for this prompt post.'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setImageMode('url')}
                        className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                          imageMode === 'url' ? 'bg-purple-600 text-white' : 'bg-zinc-800 text-zinc-400'
                        }`}
                      >
                        Image URL
                      </button>
                      <button
                        type="button"
                        onClick={() => setImageMode('upload')}
                        className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                          imageMode === 'upload' ? 'bg-purple-600 text-white' : 'bg-zinc-800 text-zinc-400'
                        }`}
                      >
                        Upload Image
                      </button>
                    </div>
                  </div>

                  {isMultiGalleryEnabled ? (
                    <div className="space-y-4">
                      {/* Add Image Inputs */}
                      {imageMode === 'url' ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={newUrlInput}
                            onChange={(e) => setNewUrlInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddUrlToGallery();
                              }
                            }}
                            placeholder="Paste image web URL (https://...)"
                            className="flex-1 bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-2.5 text-xs font-semibold text-white focus:outline-none focus:border-purple-500"
                          />
                          <button
                            type="button"
                            onClick={handleAddUrlToGallery}
                            className="px-4 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Add Image</span>
                          </button>
                        </div>
                      ) : (
                        <div className="relative border-2 border-dashed border-zinc-800 rounded-2xl p-5 text-center hover:border-purple-500/50 transition-colors bg-zinc-900/50">
                          {isUploading ? (
                            <div className="flex flex-col items-center justify-center py-2 space-y-2">
                              <Loader2 className="w-7 h-7 text-purple-400 animate-spin" />
                              <p className="text-xs font-bold text-white">Uploading media to storage...</p>
                            </div>
                          ) : (
                            <>
                              <Upload className="w-7 h-7 text-purple-400 mx-auto mb-2" />
                              <p className="text-xs font-bold text-white">Click or drag images to upload</p>
                              <p className="text-[10px] text-zinc-400 mt-1">Select one or multiple images simultaneously</p>
                              <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleMultipleFilesUpload}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                              />
                            </>
                          )}
                        </div>
                      )}

                      {/* Gallery Thumbnails List with Reordering, Set As Cover & Deletion */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                            Attached Gallery Thumbnails ({galleryImages.length})
                          </h5>
                          {galleryImages.length > 0 && (
                            <span className="text-[10px] text-zinc-400">
                              #1 is the active <strong className="text-purple-400">MAIN COVER</strong>
                            </span>
                          )}
                        </div>

                        {galleryImages.length === 0 ? (
                          <div className="p-6 rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 text-center">
                            <Images className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                            <p className="text-xs font-bold text-zinc-300">No images in gallery (0 images)</p>
                            <p className="text-[11px] text-zinc-400 mt-1 max-w-sm mx-auto">
                              Upload files or paste URLs above. The first image added will automatically become the <span className="text-purple-400 font-semibold">MAIN COVER</span>.
                            </p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                            {galleryImages.map((imgUrl, idx) => (
                              <div
                                key={idx}
                                className={`relative group rounded-2xl overflow-hidden border-2 bg-zinc-900 transition-all flex flex-col ${
                                  idx === 0 ? 'border-purple-500/80 ring-2 ring-purple-500/20' : 'border-zinc-800 hover:border-zinc-700'
                                }`}
                              >
                                <div className="relative aspect-video w-full overflow-hidden bg-black">
                                  <img src={imgUrl} alt={`Gallery item ${idx + 1}`} className="w-full h-full object-cover" />
                                  {idx === 0 ? (
                                    <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md bg-purple-600 text-white font-extrabold text-[9px] uppercase tracking-wider shadow-md flex items-center gap-1">
                                      <Star className="w-2.5 h-2.5 fill-current" /> MAIN COVER
                                    </span>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleSetAsMainCover(idx)}
                                      title="Set as Main Cover"
                                      className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-zinc-900/80 hover:bg-purple-600 text-zinc-300 hover:text-white font-bold text-[9px] uppercase tracking-wider shadow transition-colors cursor-pointer flex items-center gap-1 opacity-90 hover:opacity-100"
                                    >
                                      <Star className="w-2.5 h-2.5" /> Make Cover
                                    </button>
                                  )}
                                  <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/70 text-white font-mono text-[10px]">
                                    #{idx + 1}
                                  </span>
                                </div>

                                <div className="flex items-center justify-between p-1.5 bg-zinc-950/90 border-t border-zinc-800">
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => handleMoveImage(idx, 'left')}
                                      disabled={idx === 0}
                                      title="Move Left (Towards Cover)"
                                      className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-20 disabled:hover:bg-transparent cursor-pointer"
                                    >
                                      <ArrowLeft className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleMoveImage(idx, 'right')}
                                      disabled={idx === galleryImages.length - 1}
                                      title="Move Right"
                                      className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-20 disabled:hover:bg-transparent cursor-pointer"
                                    >
                                      <ArrowRight className="w-3.5 h-3.5" />
                                    </button>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => handleDeleteImage(idx)}
                                    title="Delete Image"
                                    className="p-1 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* Single Image Mode Fallback when Multi-Image Gallery toggle is OFF */
                    <div className="space-y-3">
                      {imageMode === 'url' ? (
                        <input
                          type="text"
                          value={imageUrl}
                          onChange={(e) => {
                            const val = e.target.value;
                            setImageUrl(val);
                            setGalleryImages(val.trim() ? [val.trim()] : []);
                          }}
                          placeholder="Paste image web URL (https://...)"
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-2.5 text-xs font-semibold text-white focus:outline-none focus:border-purple-500"
                        />
                      ) : (
                        <div className="relative border-2 border-dashed border-zinc-800 rounded-2xl p-6 text-center hover:border-purple-500/50 transition-colors bg-zinc-900/50">
                          {isUploading ? (
                            <div className="flex flex-col items-center justify-center py-2 space-y-2">
                              <Loader2 className="w-7 h-7 text-purple-400 animate-spin" />
                              <p className="text-xs font-bold text-white">Uploading media to storage...</p>
                            </div>
                          ) : (
                            <>
                              <Upload className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                              <p className="text-xs font-bold text-white">Click or drag image file to upload</p>
                              <p className="text-[10px] text-zinc-400 mt-1">Uploads automatically to cloud storage</p>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileUpload}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                              />
                            </>
                          )}
                        </div>
                      )}

                      {imageUrl ? (
                        <div className="relative w-36 aspect-video rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900 group">
                          <img src={imageUrl} alt="Cover preview" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => {
                              setImageUrl('');
                              setGalleryImages([]);
                            }}
                            className="absolute top-1 right-1 p-1 rounded-lg bg-black/70 text-red-400 hover:text-red-300 hover:bg-black"
                            title="Remove cover"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <p className="text-[11px] text-zinc-400 italic">No image attached yet.</p>
                      )}
                    </div>
                  )}
                </div>

                {/* CARD 3: PUBLISHING & BADGES */}
                <div className="p-6 rounded-3xl bg-zinc-950/60 border border-zinc-800/80 space-y-5">
                  <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
                    <Sliders className="w-4 h-4 text-emerald-400" />
                    <h4 className="text-xs font-black uppercase tracking-wider text-zinc-300">
                      3. Publishing & Badge Controls
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <label className="flex items-center gap-3 p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 cursor-pointer hover:border-zinc-700 transition-colors">
                      <input
                        type="checkbox"
                        checked={featured}
                        onChange={(e) => setFeatured(e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-xs font-bold text-white block">Featured Post</span>
                        <span className="text-[10px] text-zinc-500">Show on Hero banner</span>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 cursor-pointer hover:border-zinc-700 transition-colors">
                      <input
                        type="checkbox"
                        checked={trending}
                        onChange={(e) => setTrending(e.target.checked)}
                        className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500"
                      />
                      <div>
                        <span className="text-xs font-bold text-white block">Trending Post</span>
                        <span className="text-[10px] text-zinc-500">Show in Trending feed</span>
                      </div>
                    </label>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                        Publication Status
                      </label>
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value as PostStatus)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-3.5 py-2 text-xs font-semibold text-white focus:outline-none focus:border-emerald-500"
                      >
                        <option value="published">Published (Live)</option>
                        <option value="draft">Draft (Private)</option>
                        <option value="scheduled">Scheduled</option>
                      </select>
                    </div>
                  </div>

                  {/* POST BADGE MODE SELECTOR */}
                  <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-3.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-blue-400" />
                        <span className="text-xs font-bold text-white uppercase tracking-wider">
                          Post Badge Mode
                        </span>
                      </div>
                      <span className="text-[11px] text-zinc-400 font-medium">
                        Active: <strong className="text-white uppercase">{badgeMode}</strong>
                        {badgeMode === 'manual' && (
                          <span className="ml-1 text-blue-400">({badgeType})</span>
                        )}
                      </span>
                    </div>

                    {/* Mode Buttons */}
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setBadgeMode('automatic')}
                        className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 border ${
                          badgeMode === 'automatic'
                            ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                            : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white hover:border-zinc-700'
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>Automatic / Smart</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setBadgeMode('none')}
                        className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 border ${
                          badgeMode === 'none'
                            ? 'bg-zinc-700 text-white border-zinc-600 shadow-md'
                            : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white hover:border-zinc-700'
                        }`}
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>None (Disabled)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setBadgeMode('manual')}
                        className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 border ${
                          badgeMode === 'manual'
                            ? 'bg-purple-600 text-white border-purple-500 shadow-md'
                            : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white hover:border-zinc-700'
                        }`}
                      >
                        <Sliders className="w-3.5 h-3.5 text-purple-300" />
                        <span>Manual Override</span>
                      </button>
                    </div>

                    {/* Mode Explanations & Manual Selection */}
                    {badgeMode === 'automatic' && (
                      <p className="text-[11px] text-zinc-400 bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-800/60">
                        ⚡ <strong>Smart Automatic Mode:</strong> Analyzes title, category, tags, and content keywords. The <strong>latest 3 published posts</strong> dynamically receive the <span className="text-emerald-400 font-bold">NEW</span> badge, while older posts show smart topic badges (AI PROMPT, PHOTO PROMPT, CREATIVE, etc.).
                      </p>
                    )}

                    {badgeMode === 'none' && (
                      <p className="text-[11px] text-zinc-400 bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-800/60">
                        🚫 <strong>None:</strong> No badge will be rendered on this specific post card.
                      </p>
                    )}

                    {badgeMode === 'manual' && (
                      <div className="space-y-2 pt-1">
                        <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider block">
                          Select Manual Badge:
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {ALL_BADGE_TYPES.map((b) => {
                            const isSelected = badgeType === b;
                            return (
                              <button
                                key={b}
                                type="button"
                                onClick={() => setBadgeType(b)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5 ${
                                  isSelected
                                    ? b === 'NEW'
                                      ? 'bg-emerald-500 text-white border-emerald-400 shadow-emerald-500/30'
                                      : b === 'PREMIUM'
                                      ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-amber-500/30'
                                      : b === 'PHOTO PROMPT'
                                      ? 'bg-sky-500 text-white border-sky-400 shadow-sky-500/30'
                                      : b === 'CREATIVE'
                                      ? 'bg-purple-600 text-white border-purple-400 shadow-purple-500/30'
                                      : b === 'TRENDING'
                                      ? 'bg-amber-500 text-white border-amber-400 shadow-amber-500/30'
                                      : b === 'HOT'
                                      ? 'bg-rose-500 text-white border-rose-400 shadow-rose-500/30'
                                      : 'bg-blue-600 text-white border-blue-400 shadow-blue-500/30'
                                    : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white hover:border-zinc-700'
                                }`}
                              >
                                <Sparkles className="w-3 h-3" />
                                <span>{b}</span>
                                {isSelected && <CheckCircle2 className="w-3 h-3 ml-0.5" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* CARD 4: SEO METADATA */}
                <div className="p-6 rounded-3xl bg-zinc-950/60 border border-zinc-800/80 space-y-4">
                  <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
                    <Sparkles className="w-4 h-4 text-sky-400" />
                    <h4 className="text-xs font-black uppercase tracking-wider text-zinc-300">
                      4. SEO & Search Engine Optimization
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input
                      type="text"
                      value={seoTitle}
                      onChange={(e) => setSeoTitle(e.target.value)}
                      placeholder="Custom SEO Title"
                      className="bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-sky-500"
                    />
                    <input
                      type="text"
                      value={metaDescription}
                      onChange={(e) => setMetaDescription(e.target.value)}
                      placeholder="Meta Description for Google"
                      className="bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Sticky Bottom Actions Bar */}
            <div className="sticky bottom-0 -mx-6 -mb-6 p-4 bg-zinc-950/95 backdrop-blur-md border-t border-zinc-800 flex items-center justify-between gap-3 z-20">
              <button
                type="button"
                onClick={(e) => {
                  setStatus('draft');
                  handleSubmit(e);
                }}
                className="px-4 py-2.5 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-bold text-xs border border-amber-500/30 transition-all cursor-pointer flex items-center gap-2"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save as Draft</span>
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-2xl bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700 text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isUploading}
                  className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-xs shadow-xl shadow-blue-600/20 flex items-center gap-2 transition-all cursor-pointer"
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
