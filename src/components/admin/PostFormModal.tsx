import React, { useState, useEffect, useMemo, useRef } from 'react';
import { PromptPost, Category, PostStatus, BadgeMode, BadgeType, AiGeneratedSeoData } from '../../types';
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
  Wand2,
  RefreshCw,
  AlertTriangle,
  Check,
  Globe,
  HelpCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useToast } from '../Toast';
import { useAuth } from '../../context/AuthContext';
import { promptStore, getPostGallery } from '../../services/promptStore';
import { compressImageFile, compressDataUrl, getCloudinaryOriginalUrl, getOptimizedDisplayUrl } from '../../lib/imageUtils';
import { classifyPostContent } from '../../services/categoryClassifier';
import { getCategoryDisplayName, normalizeCategoryKey } from '../../utils/categoryUtils';
import { requestAiPostSeo, prepareImageForAiAnalysis } from '../../services/aiPostService';

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
  const { currentUser } = useAuth();
  const [creatorMode, setCreatorMode] = useState<'ai' | 'manual'>(post ? 'manual' : 'ai');
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
  const [keywordsInput, setKeywordsInput] = useState('');
  const [altText, setAltText] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [featured, setFeatured] = useState(false);
  const [trending, setTrending] = useState(false);
  const [status, setStatus] = useState<PostStatus>('published');
  const [scheduledDate, setScheduledDate] = useState('');
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  // AI Smart Post Creator state
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiAnalysisStep, setAiAnalysisStep] = useState('');
  const [aiResult, setAiResult] = useState<AiGeneratedSeoData | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiImageAnalyzed, setAiImageAnalyzed] = useState<boolean | null>(null);
  const [aiImageNote, setAiImageNote] = useState<string | null>(null);
  const [aiDuplicateWarning, setAiDuplicateWarning] = useState<string | null>(null);
  const [aiSimilarTitle, setAiSimilarTitle] = useState<string | null>(null);
  const [aiQualityNotes, setAiQualityNotes] = useState<string[]>([]);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [newTagInput, setNewTagInput] = useState('');
  const [newKeywordInput, setNewKeywordInput] = useState('');
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const aiFileInputRef = useRef<HTMLInputElement>(null);

  // Per-Post Badge Settings
  const [badgeMode, setBadgeMode] = useState<BadgeMode>('automatic');
  const [badgeType, setBadgeType] = useState<BadgeType>('AI PROMPT');

  // Per-Post Timer Settings
  const [timerEnabled, setTimerEnabled] = useState(true);
  const [timerSeconds, setTimerSeconds] = useState<number>(5);
  const [isUploading, setIsUploading] = useState(false);
  const [isManualCategory, setIsManualCategory] = useState(false);

  const { showToast } = useToast();
  const featureControls = promptStore.getFeatureControls();
  const isMultiGalleryEnabled = featureControls.multiImageGallery !== false;

  useEffect(() => {
    if (post) {
      setCreatorMode('manual');
      setIsManualCategory(true);
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
      setKeywordsInput(post.keywords ? post.keywords.join(', ') : '');
      setAltText(post.altText || '');
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
      setCreatorMode('ai');
      setIsManualCategory(false);
      // New post: Gallery MUST start completely clean with 0 images
      setGalleryImages([]);
      setImageUrl('');
      setTitle('');
      setShortDescription('');
      setPhotoPrompt('');
      setVideoPrompt('');
      setActivePromptTab('photo');
      setCategoryId(categories.find((c) => c.id === 'man')?.id || categories[0]?.id || 'man');
      setTagsInput('');
      setKeywordsInput('');
      setAltText('');
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
      setAiResult(null);
      setAiError(null);
      setAiDuplicateWarning(null);
      setAiQualityNotes([]);
      setSelectedImageFile(null);
    }
    setNewUrlInput('');
  }, [post, categories, isOpen]);

  // Intelligent content-based category recommendation
  const contentCategory = useMemo(() => {
    return classifyPostContent({
      title,
      shortDescription,
      tags: tagsInput,
      photoPrompt,
      videoPrompt,
      postType: !photoPrompt.trim() && videoPrompt.trim() ? 'video_prompt' : 'photo_prompt',
      existingCategoryId: categoryId,
    });
  }, [title, shortDescription, tagsInput, photoPrompt, videoPrompt, categoryId]);

  // If the admin hasn't manually chosen a category on a new post, automatically reflect high-confidence suggestion
  useEffect(() => {
    if (!post && !isManualCategory && contentCategory.confidence !== 'low') {
      const match = categories.find(
        (c) =>
          normalizeCategoryKey(c.id) === contentCategory.categoryId ||
          normalizeCategoryKey(c.slug) === contentCategory.categoryId
      );
      if (match && match.id !== categoryId) {
        setCategoryId(match.id);
      }
    }
  }, [post, isManualCategory, contentCategory, categories, categoryId]);

  const currentTags = useMemo(() => {
    return tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
  }, [tagsInput]);

  const handleRemoveTag = (tagToRemove: string) => {
    const updated = currentTags.filter((t) => t.toLowerCase() !== tagToRemove.toLowerCase());
    setTagsInput(updated.join(', '));
  };

  const handleAddTag = (tagToAdd: string) => {
    const trimmed = tagToAdd.trim().replace(/^#+/, '');
    if (!trimmed) return;
    if (!currentTags.some((t) => t.toLowerCase() === trimmed.toLowerCase())) {
      setTagsInput([...currentTags, trimmed].join(', '));
    }
    setNewTagInput('');
  };

  const currentKeywords = useMemo(() => {
    return keywordsInput
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean);
  }, [keywordsInput]);

  const handleRemoveKeyword = (keywordToRemove: string) => {
    const updated = currentKeywords.filter((k) => k.toLowerCase() !== keywordToRemove.toLowerCase());
    setKeywordsInput(updated.join(', '));
  };

  const handleAddKeyword = (keywordToAdd: string) => {
    const trimmed = keywordToAdd.trim();
    if (!trimmed) return;
    if (!currentKeywords.some((k) => k.toLowerCase() === trimmed.toLowerCase())) {
      setKeywordsInput([...currentKeywords, trimmed].join(', '));
    }
    setNewKeywordInput('');
  };

  const handleAiImageSelect = async (file: File) => {
    if (!file || !file.type.startsWith('image/')) {
      showToast('Invalid File', 'Please select an image file (JPEG, PNG, WEBP).', 'error');
      return;
    }
    setSelectedImageFile(file);
    setIsUploading(true);
    try {
      const previewDataUrl = await prepareImageForAiAnalysis(file);
      setImageUrl(previewDataUrl);
      setGalleryImages([previewDataUrl]);
      showToast('Image Attached', 'Visual attached for AI Vision analysis.', 'info');
    } catch (err) {
      console.error('Failed to prepare image for AI:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleAnalyzeSeo = async (retryPromptOnly = false) => {
    const currentPrompt = photoPrompt.trim() || videoPrompt.trim();
    if (!currentPrompt) {
      showToast('Prompt Required', 'Please enter your AI prompt text to analyze.', 'error');
      return;
    }

    setAiAnalyzing(true);
    setAiError(null);
    setAiAnalysisStep(
      imageUrl && !retryPromptOnly
        ? 'Gemini Vision inspecting visual details, lighting, style & prompt...'
        : 'Gemini AI generating high-intent SEO metadata...'
    );

    try {
      const idToken = currentUser ? await currentUser.getIdToken().catch(() => null) : null;
      const existingTitles = promptStore.getPosts().map((p) => p.title).filter(Boolean);

      const res = await requestAiPostSeo({
        prompt: currentPrompt,
        image: !retryPromptOnly ? (imageUrl || undefined) : undefined,
        categories,
        existingTitles,
        idToken,
      });

      if (!res.success || !res.data) {
        setAiError(res.error || 'AI generation failed. Please try again.');
        showToast('AI Generation Notice', res.error || 'AI generation failed. Please try again.', 'error');
        return;
      }

      const data = res.data;
      setAiResult(data);
      setTitle(data.title);
      setShortDescription(data.description);
      setTagsInput(data.tags.join(', '));
      setKeywordsInput(data.keywords.join(', '));
      setAltText(data.altText);
      setSeoTitle(data.title);
      setMetaDescription(data.description);

      setAiImageAnalyzed(res.imageAnalyzed ?? false);
      setAiImageNote(res.imageNote || null);
      setAiDuplicateWarning(res.duplicateWarning || null);
      setAiSimilarTitle(res.similarExistingTitle || null);
      setAiQualityNotes(res.qualityNotes || []);

      // Auto match category if found
      if (data.category) {
        const match = categories.find(
          (c) =>
            normalizeCategoryKey(c.id) === normalizeCategoryKey(data.category) ||
            normalizeCategoryKey(c.name) === normalizeCategoryKey(data.category) ||
            normalizeCategoryKey(c.slug) === normalizeCategoryKey(data.category)
        );
        if (match) {
          setCategoryId(match.id);
          setIsManualCategory(true);
        }
      }

      showToast('✨ SEO Generated', 'Review and edit the generated metadata before publishing.', 'success');
    } catch (err: any) {
      console.error('Error during AI analysis:', err);
      setAiError('AI generation failed. Please try again.');
      showToast('AI Error', 'AI generation failed. Please try again.', 'error');
    } finally {
      setAiAnalyzing(false);
    }
  };

  const validateSeoQuality = (): { valid: boolean; error?: string } => {
    if (!title.trim()) return { valid: false, error: 'Title cannot be empty.' };
    const promptContent = photoPrompt.trim() || videoPrompt.trim();
    if (!promptContent) return { valid: false, error: 'Prompt content cannot be empty.' };
    if (!shortDescription.trim()) return { valid: false, error: 'Description cannot be empty.' };
    if (currentTags.length === 0) return { valid: false, error: 'At least one tag is required for SEO.' };
    if (!altText.trim() && imageUrl) return { valid: false, error: 'Image Alt Text is required for accessibility & SEO.' };
    return { valid: true };
  };

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

    const parsedKeywords = keywordsInput
      .split(',')
      .map((k) => k.trim())
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

    let coverUrl = processedGallery[0] || (imageUrl.trim().length > 0 ? imageUrl.trim() : '');

    // Upload image to Cloudinary if a local file was selected and not yet uploaded
    if (selectedImageFile) {
      const cldSettings = promptStore.getCloudinarySettings();
      if (cldSettings.cloudName && cldSettings.uploadPreset) {
        setIsUploading(true);
        showToast('Uploading to Cloudinary', 'Transferring media to Cloudinary storage...', 'info');
        const cldRes = await promptStore.uploadToCloudinary(selectedImageFile);
        setIsUploading(false);
        if (cldRes.success && cldRes.url) {
          coverUrl = cldRes.url;
          if (processedGallery.length > 0) {
            processedGallery[0] = coverUrl;
          } else {
            processedGallery.push(coverUrl);
          }
        }
      }
    }

    // Determine postType:
    // If only video prompt provided (no photo prompt), postType is 'video_prompt'.
    // If photo prompt provided (with or without video prompt), postType is 'photo_prompt'.
    const resolvedPostType: 'photo_prompt' | 'video_prompt' =
      !photoTrimmed && videoTrimmed ? 'video_prompt' : 'photo_prompt';

    const resolvedCatId = categoryId || categories[0]?.id || 'man';
    const resolvedCatObj = categories.find((c) => c.id === resolvedCatId || c.slug === resolvedCatId);
    const resolvedCatName = resolvedCatObj?.name || getCategoryDisplayName(resolvedCatId);

    onSave(
      {
        title: title.trim(),
        shortDescription: shortDescription.trim() || (photoTrimmed || videoTrimmed).slice(0, 140) + '...',
        fullPrompt: photoTrimmed || videoTrimmed,
        photoPrompt: photoTrimmed || undefined,
        videoPrompt: videoTrimmed || undefined,
        postType: resolvedPostType,
        categoryId: resolvedCatId,
        categoryName: resolvedCatName,
        tags: parsedTags,
        keywords: parsedKeywords.length > 0 ? parsedKeywords : undefined,
        altText: altText.trim() || undefined,
        imageUrl: coverUrl,
        images: processedGallery.length > 0 ? processedGallery : (coverUrl ? [coverUrl] : []),
        gallery: processedGallery.length > 0 ? processedGallery : (coverUrl ? [coverUrl] : []),
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

          {/* Mode Switcher Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 sm:px-6 py-2.5 bg-zinc-950 border-b border-zinc-800">
            <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-zinc-900 border border-zinc-800">
              <button
                type="button"
                onClick={() => setCreatorMode('ai')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  creatorMode === 'ai'
                    ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Wand2 className="w-3.5 h-3.5 text-sky-300" />
                <span>AI Smart Post Creator</span>
                <span className="px-1.5 py-0.5 rounded bg-white/20 text-[9px] font-black uppercase tracking-wider">
                  Auto SEO
                </span>
              </button>

              <button
                type="button"
                onClick={() => setCreatorMode('manual')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  creatorMode === 'manual'
                    ? 'bg-zinc-800 text-white shadow-md'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Full Post Editor</span>
              </button>
            </div>

            {creatorMode === 'ai' && (
              <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-300 border border-purple-500/20 font-medium">
                  <Sparkles className="w-3 h-3 text-purple-400" />
                  Gemini Vision 2.5 + Prompt
                </span>
                <span className="hidden md:inline text-zinc-500">•</span>
                <span className="hidden md:inline text-zinc-400">Prompt + Image → Instant Google SEO</span>
              </div>
            )}
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
            ) : creatorMode === 'ai' ? (
              /* AI SMART POST CREATOR UI */
              <div className="space-y-6">
                {/* Hero / Intro Card */}
                <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-blue-950/40 via-indigo-950/40 to-purple-950/40 border border-indigo-500/30 space-y-2">
                  <div className="flex items-center gap-2 text-indigo-400">
                    <Wand2 className="w-5 h-5 text-indigo-400" />
                    <h4 className="text-sm font-black uppercase tracking-wider text-white">
                      AI Smart Post Creator — Vision + SEO Engine
                    </h4>
                    <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold text-[10px] border border-indigo-500/30">
                      Gemini Vision 2.5
                    </span>
                  </div>
                  <p className="text-xs text-zinc-300 leading-relaxed max-w-3xl">
                    Create a complete, Google-optimized prompt post by providing only the{' '}
                    <strong className="text-white">AI Prompt</strong> and an{' '}
                    <strong className="text-white">Image</strong>. Gemini Vision analyzes the visual aesthetic, lighting, style, and subject matter to automatically generate an SEO title, compelling meta description, high-ranking tags, search keywords, category match, and accessibility alt text.
                  </p>
                </div>

                {/* Input Step: Prompt & Image */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Step 1: AI Prompt */}
                  <div className="p-5 rounded-3xl bg-zinc-950/70 border border-zinc-800 space-y-3 flex flex-col">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-400" />
                        <label className="text-xs font-black uppercase tracking-wider text-white">
                          1. AI Prompt Text *
                        </label>
                      </div>
                      <span className="text-[11px] font-mono text-zinc-400">
                        {(photoPrompt || videoPrompt).length} chars
                      </span>
                    </div>

                    <textarea
                      value={photoPrompt || videoPrompt}
                      onChange={(e) => {
                        const val = e.target.value;
                        setPhotoPrompt(val);
                        if (videoPrompt) setVideoPrompt('');
                      }}
                      placeholder="Paste your full AI prompt here...&#10;&#10;e.g. Ultra-realistic cinematic 8k portrait of an adventurous nomad in glowing sunset light, shot on 85mm f/1.4 lens, photorealistic texture, warm golden hour tones..."
                      rows={8}
                      className="w-full flex-1 bg-zinc-900 border border-zinc-800 focus:border-purple-500 rounded-2xl p-4 text-xs font-mono text-white placeholder-zinc-500 resize-none focus:outline-none transition-colors"
                    />

                    <p className="text-[11px] text-zinc-400 italic">
                      💡 Tip: Detail lighting, camera angle, subject, and style for the most accurate SEO tags.
                    </p>
                  </div>

                  {/* Step 2: Image for Vision */}
                  <div className="p-5 rounded-3xl bg-zinc-950/70 border border-zinc-800 space-y-3 flex flex-col">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-blue-400" />
                        <label className="text-xs font-black uppercase tracking-wider text-white">
                          2. Image (For Vision Analysis)
                        </label>
                      </div>
                      {imageUrl && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Attached
                        </span>
                      )}
                    </div>

                    {imageUrl ? (
                      <div className="relative aspect-video w-full rounded-2xl overflow-hidden border-2 border-indigo-500/40 bg-zinc-900 flex-1 group">
                        <img src={imageUrl} alt="AI analysis preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 opacity-90 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
                          <div className="flex items-center justify-between">
                            <span className="px-2 py-1 rounded-lg bg-emerald-600/90 text-white font-bold text-[10px] shadow-sm flex items-center gap-1">
                              <Sparkles className="w-3 h-3" /> Ready for Vision AI
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setImageUrl('');
                                setGalleryImages([]);
                                setSelectedImageFile(null);
                              }}
                              className="p-1.5 rounded-xl bg-red-600/90 hover:bg-red-500 text-white text-xs font-bold transition-all cursor-pointer shadow-md"
                              title="Remove Image"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-zinc-300">
                            <span className="truncate max-w-[180px]">
                              {selectedImageFile ? selectedImageFile.name : 'Web URL Image'}
                            </span>
                            <button
                              type="button"
                              onClick={() => aiFileInputRef.current?.click()}
                              className="px-2.5 py-1 rounded-lg bg-zinc-800/90 hover:bg-zinc-700 text-white font-semibold cursor-pointer border border-zinc-700 text-xs"
                            >
                              Replace Image
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div
                        onDragOver={(e) => {
                          e.preventDefault();
                          setIsDraggingImage(true);
                        }}
                        onDragLeave={() => setIsDraggingImage(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setIsDraggingImage(false);
                          const file = e.dataTransfer.files?.[0];
                          if (file) handleAiImageSelect(file);
                        }}
                        onClick={() => aiFileInputRef.current?.click()}
                        className={`flex-1 min-h-[180px] border-2 border-dashed rounded-2xl p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                          isDraggingImage
                            ? 'border-indigo-400 bg-indigo-500/10'
                            : 'border-zinc-800 hover:border-zinc-700 bg-zinc-900/50 hover:bg-zinc-900'
                        }`}
                      >
                        <Upload className="w-8 h-8 text-indigo-400 mb-2" />
                        <p className="text-xs font-bold text-white">Click or drag image file here</p>
                        <p className="text-[11px] text-zinc-400 mt-1 max-w-xs">
                          Gemini Vision analyzes color palette, lighting, composition & style
                        </p>
                        <span className="mt-3 px-2.5 py-1 rounded-xl bg-zinc-800 text-[10px] text-zinc-300 font-medium">
                          Supports JPEG, PNG, WEBP
                        </span>
                      </div>
                    )}

                    <input
                      type="file"
                      ref={aiFileInputRef}
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleAiImageSelect(file);
                      }}
                      className="hidden"
                    />

                    {/* Or paste URL accordion */}
                    {!imageUrl && (
                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="text"
                          placeholder="Or paste direct image URL..."
                          value={newUrlInput}
                          onChange={(e) => setNewUrlInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              if (newUrlInput.trim()) {
                                setImageUrl(newUrlInput.trim());
                                setGalleryImages([newUrlInput.trim()]);
                                setNewUrlInput('');
                              }
                            }
                          }}
                          className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (newUrlInput.trim()) {
                              setImageUrl(newUrlInput.trim());
                              setGalleryImages([newUrlInput.trim()]);
                              setNewUrlInput('');
                            }
                          }}
                          className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs cursor-pointer"
                        >
                          Attach
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Central Action CTA */}
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => handleAnalyzeSeo(false)}
                    disabled={aiAnalyzing || (!photoPrompt.trim() && !videoPrompt.trim())}
                    className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-50 text-white font-black text-sm sm:text-base shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-3 transition-all cursor-pointer group active:scale-[0.99] border border-indigo-400/20"
                  >
                    {aiAnalyzing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin text-white" />
                        <span className="tracking-wide">
                          {aiAnalysisStep || 'Gemini Vision analyzing prompt & visual aesthetics...'}
                        </span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5 text-amber-300 group-hover:rotate-12 transition-transform" />
                        <span className="tracking-wide">✨ ANALYZE & GENERATE SEO</span>
                        <span className="hidden sm:inline text-xs font-normal text-indigo-200">
                          (Title, Description, Tags, Keywords, Category & Alt-Text)
                        </span>
                      </>
                    )}
                  </button>

                  {/* Feedback alerts */}
                  {aiError && (
                    <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-between gap-3 text-red-300 text-xs">
                      <div className="flex items-center gap-2.5">
                        <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                        <span>{aiError}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAnalyzeSeo(true)}
                        className="px-3 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-white font-bold text-[11px] shrink-0 cursor-pointer"
                      >
                        Retry Prompt Only
                      </button>
                    </div>
                  )}

                  {aiDuplicateWarning && (
                    <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-amber-300 text-xs">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold">Originality Check Applied</p>
                        <p className="text-amber-200/90 mt-0.5">{aiDuplicateWarning}</p>
                        {aiSimilarTitle && (
                          <p className="text-[10px] text-amber-400/80 mt-1">Existing post: "{aiSimilarTitle}"</p>
                        )}
                      </div>
                    </div>
                  )}

                  {aiQualityNotes && aiQualityNotes.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                        SEO Optimizations:
                      </span>
                      {aiQualityNotes.map((note, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-xl bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300 flex items-center gap-1.5"
                        >
                          <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                          {note}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* AI PREVIEW UI (Editable) */}
                {(aiResult || title.trim()) && (
                  <div className="p-5 sm:p-6 rounded-3xl bg-zinc-950/90 border-2 border-indigo-500/40 space-y-6 shadow-2xl">
                    {/* Preview Header */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md">
                          <Sparkles className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-extrabold uppercase tracking-wider text-white flex items-center gap-2">
                            <span>✨ AI GENERATED SEO</span>
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold normal-case">
                              {aiImageAnalyzed
                                ? '✓ Vision + Prompt Analyzed'
                                : '✓ Prompt Analyzed'}
                            </span>
                          </h4>
                          <p className="text-[11px] text-zinc-400">
                            All fields below are directly editable. Review and customize before publishing.
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleAnalyzeSeo(false)}
                        disabled={aiAnalyzing}
                        className="px-3.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${aiAnalyzing ? 'animate-spin' : ''}`} />
                        <span>Regenerate</span>
                      </button>
                    </div>

                    {/* FIELD 1: TITLE */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                          <span>Post Title (Google Search Title) *</span>
                        </label>
                        <span
                          className={`text-[11px] font-mono font-bold ${
                            title.length > 70 ? 'text-amber-400' : 'text-emerald-400'
                          }`}
                        >
                          {title.length} / 65 characters optimal
                        </span>
                      </div>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => {
                          setTitle(e.target.value);
                          setSeoTitle(e.target.value);
                        }}
                        placeholder="Optimized prompt title"
                        className="w-full bg-zinc-900 border border-zinc-800 focus:border-indigo-500 rounded-2xl px-4 py-3 text-xs sm:text-sm font-semibold text-white focus:outline-none transition-colors"
                        required
                      />

                      {/* Google Search Snippet Box */}
                      <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-1">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                          Google Search SERP Preview
                        </p>
                        <p className="text-[11px] text-zinc-400 flex items-center gap-1 font-mono truncate">
                          <Globe className="w-3 h-3 text-emerald-400 shrink-0" />
                          https://sahiledit.vercel.app › prompt ›{' '}
                          {title ? title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 32) : 'ai-prompt'}
                        </p>
                        <p className="text-sm font-bold text-blue-400 hover:underline line-clamp-1 cursor-pointer">
                          {title || 'Sahil Edit Vercel – Official AI Prompt Library'}
                        </p>
                        <p className="text-xs text-zinc-400 line-clamp-2">
                          {shortDescription || 'Discover high-quality AI prompts with photography camera settings, creative lighting, and instant copy.'}
                        </p>
                      </div>
                    </div>

                    {/* FIELD 2: SHORT DESCRIPTION */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-white uppercase tracking-wider">
                          Description (Post Summary & Meta Description) *
                        </label>
                        <span
                          className={`text-[11px] font-mono font-bold ${
                            shortDescription.length > 160 ? 'text-amber-400' : 'text-emerald-400'
                          }`}
                        >
                          {shortDescription.length} characters (120–160 optimal)
                        </span>
                      </div>
                      <textarea
                        value={shortDescription}
                        onChange={(e) => {
                          setShortDescription(e.target.value);
                          setMetaDescription(e.target.value);
                        }}
                        rows={3}
                        placeholder="Concise, keyword-rich description for Google search snippet and social cards..."
                        className="w-full bg-zinc-900 border border-zinc-800 focus:border-indigo-500 rounded-2xl p-4 text-xs text-white focus:outline-none transition-colors resize-none"
                        required
                      />
                    </div>

                    {/* FIELD 3: TAGS */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                          <Tag className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Tags ({currentTags.length})</span>
                        </label>
                        <span className="text-[10px] text-zinc-400">Click × to remove or type below to add</span>
                      </div>

                      <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 flex flex-wrap items-center gap-2">
                        {currentTags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-xs font-semibold"
                          >
                            <span>#{tag}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveTag(tag)}
                              className="hover:text-red-400 cursor-pointer p-0.5"
                              title={`Remove #${tag}`}
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}

                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={newTagInput}
                            onChange={(e) => setNewTagInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ',') {
                                e.preventDefault();
                                handleAddTag(newTagInput);
                              }
                            }}
                            placeholder="+ Add tag..."
                            className="bg-transparent border-none text-xs text-white placeholder-zinc-500 focus:outline-none px-2 py-1 min-w-[90px]"
                          />
                          {newTagInput.trim() && (
                            <button
                              type="button"
                              onClick={() => handleAddTag(newTagInput)}
                              className="px-2 py-1 rounded-lg bg-indigo-600 text-white text-[10px] font-bold cursor-pointer"
                            >
                              Add
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* FIELD 4: KEYWORDS */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                          <span>Long-Tail Search Keywords ({currentKeywords.length})</span>
                        </label>
                        <span className="text-[10px] text-zinc-400">Targeted search phrases for Google ranking</span>
                      </div>

                      <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 flex flex-wrap items-center gap-2">
                        {currentKeywords.map((kw) => (
                          <span
                            key={kw}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-purple-500/10 text-purple-300 border border-purple-500/20 text-xs font-semibold"
                          >
                            <span>{kw}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveKeyword(kw)}
                              className="hover:text-red-400 cursor-pointer p-0.5"
                              title={`Remove keyword`}
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}

                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={newKeywordInput}
                            onChange={(e) => setNewKeywordInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ',') {
                                e.preventDefault();
                                handleAddKeyword(newKeywordInput);
                              }
                            }}
                            placeholder="+ Add keyword phrase..."
                            className="bg-transparent border-none text-xs text-white placeholder-zinc-500 focus:outline-none px-2 py-1 min-w-[140px]"
                          />
                          {newKeywordInput.trim() && (
                            <button
                              type="button"
                              onClick={() => handleAddKeyword(newKeywordInput)}
                              className="px-2 py-1 rounded-lg bg-purple-600 text-white text-[10px] font-bold cursor-pointer"
                            >
                              Add
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* FIELD 5 & 6: CATEGORY & ALT-TEXT GRID */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                      {/* Category */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-white uppercase tracking-wider">
                          Category *
                        </label>
                        <select
                          value={categoryId}
                          onChange={(e) => {
                            setCategoryId(e.target.value);
                            setIsManualCategory(true);
                          }}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-2.5 text-xs font-semibold text-white focus:outline-none focus:border-indigo-500"
                        >
                          {categories.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                        {aiResult?.category && (
                          <p className="text-[11px] text-indigo-400 font-medium">
                            AI Category Match: {aiResult.category}
                          </p>
                        )}
                      </div>

                      {/* Alt-Text */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-white uppercase tracking-wider">
                          Image Alt Text (Google Images) *
                        </label>
                        <input
                          type="text"
                          value={altText}
                          onChange={(e) => setAltText(e.target.value)}
                          placeholder="Accessible visual description for Google Image index"
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                        />
                        <p className="text-[11px] text-zinc-400">
                          Accurately describes visual contents for SEO and screen readers.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
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
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-zinc-300">Category *</label>
                        {contentCategory.categoryId !== normalizeCategoryKey(categoryId) && (
                          <button
                            type="button"
                            onClick={() => {
                              const match = categories.find(
                                (c) =>
                                  normalizeCategoryKey(c.id) === contentCategory.categoryId ||
                                  normalizeCategoryKey(c.slug) === contentCategory.categoryId
                              );
                              if (match) {
                                setCategoryId(match.id);
                              } else {
                                setCategoryId(contentCategory.categoryId);
                              }
                              setIsManualCategory(true);
                            }}
                            className="text-[11px] font-semibold text-blue-400 hover:text-blue-300 underline cursor-pointer"
                          >
                            Suggest: {contentCategory.categoryName} (Apply)
                          </button>
                        )}
                      </div>
                      <select
                        value={categoryId}
                        onChange={(e) => {
                          setCategoryId(e.target.value);
                          setIsManualCategory(true);
                        }}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-2.5 text-xs font-semibold text-white focus:outline-none focus:border-blue-500"
                      >
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                      {contentCategory.categoryId === normalizeCategoryKey(categoryId) && (
                        <p className="text-[11px] text-emerald-400/90 font-medium">
                          ✓ Category matched by content analysis ({contentCategory.categoryName})
                        </p>
                      )}
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
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-sky-400" />
                      <h4 className="text-xs font-black uppercase tracking-wider text-zinc-300">
                        4. SEO & Search Engine Optimization
                      </h4>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAnalyzeSeo(false)}
                      disabled={aiAnalyzing || (!photoPrompt.trim() && !videoPrompt.trim())}
                      className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
                    >
                      {aiAnalyzing ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Generating SEO...</span>
                        </>
                      ) : (
                        <>
                          <Wand2 className="w-3.5 h-3.5" />
                          <span>Auto-Fill with AI</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-zinc-400">Custom SEO Title</label>
                      <input
                        type="text"
                        value={seoTitle}
                        onChange={(e) => setSeoTitle(e.target.value)}
                        placeholder="Custom SEO Title"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-sky-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-zinc-400">Meta Description for Google</label>
                      <input
                        type="text"
                        value={metaDescription}
                        onChange={(e) => setMetaDescription(e.target.value)}
                        placeholder="Meta Description for Google"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-sky-500"
                      />
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-[11px] font-bold text-zinc-400">Image Alt Text (Google Images & Accessibility)</label>
                      <input
                        type="text"
                        value={altText}
                        onChange={(e) => setAltText(e.target.value)}
                        placeholder="Descriptive alt text for Google Image search and accessibility"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-sky-500"
                      />
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-[11px] font-bold text-zinc-400">Long-Tail Search Keywords (Comma separated)</label>
                      <input
                        type="text"
                        value={keywordsInput}
                        onChange={(e) => setKeywordsInput(e.target.value)}
                        placeholder="e.g. cinematic portrait prompt, 8k photography prompt, midjourney photorealistic lighting"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-sky-500"
                      />
                    </div>
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
