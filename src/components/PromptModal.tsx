import React, { useState, useEffect, useMemo, useRef } from 'react';
import { CustomPage, PromptPost, Category } from '../types';
import { CategoryIcon } from './CategoryIcon';
import {
  Copy,
  Check,
  Share2,
  Eye,
  Calendar,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Send,
  Facebook,
  Twitter,
  CheckCircle2,
  Lock,
  Unlock,
  Instagram,
  Clock,
  Heart,
  ArrowLeft,
  Download,
  Star,
  Bookmark,
  BookmarkCheck,
  Cpu,
  Tag,
  Zap,
  Link,
  Images,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useToast } from './Toast';
import { useAuth } from '../context/AuthContext';
import { LoginModal } from './LoginModal';
import { ShareFeedbackModal } from './ShareFeedbackModal';
import {
  subscribeRatings,
  submitRating,
  submitFeedback,
  RatingStats,
  DEFAULT_RATING_STATS,
} from '../services/ratingService';
import { promptStore, getPostCreatedAtMillis } from '../services/promptStore';
import { AdBanner } from './AdBanner';
import { PromptCard } from './PromptCard';
import { Footer } from './Footer';

interface PromptModalProps {
  post: PromptPost | null;
  categories: Category[];
  allPosts: PromptPost[];
  onClose: () => void;
  onSelectPost: (post: PromptPost) => void;
  onCopyPrompt: (post: PromptPost) => void;
  onOpenPage?: (page: CustomPage) => void;
}

const FacebookIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const TwitterXIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const PinterestIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.367 18.592 0 12.017 0z" />
  </svg>
);

const ThreadsIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.186 24c-6.27 0-11.368-4.708-11.368-11.192 0-6.732 5.232-11.808 11.772-11.808 6.84 0 11.412 5.016 11.412 11.376 0 5.484-3.66 9.384-8.88 9.384-2.58 0-4.308-1.164-4.824-2.52h-.084c-.384 1.488-1.68 2.52-3.42 2.52-2.148 0-3.624-1.548-3.624-3.732 0-3.324 2.892-5.4 7.02-5.4h.876v-.516c0-1.452-.948-2.304-2.52-2.304-1.32 0-2.424.624-2.7 1.836l-2.076-.852c.636-2.244 2.688-3.324 4.884-3.324 3.036 0 4.872 1.764 4.872 4.608v5.52c0 1.284.456 1.896 1.5 1.896 2.892 0 4.86-2.592 4.86-6.6 0-4.812-3.372-8.52-8.892-8.52-5.016 0-8.916 3.756-8.916 9.108 0 4.908 3.756 8.52 8.52 8.52 2.22 0 4.152-.768 5.496-2.1l1.584 1.536C16.896 23.016 14.652 24 12.186 24zm-1.896-10.872c-2.352 0-3.804 1.104-3.804 2.76 0 1.116.756 1.86 1.848 1.86 1.152 0 2.052-.78 2.052-2.124v-2.496z" />
  </svg>
);

const WhatsAppIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.48 2 2 6.48 2 12c0 2.17.69 4.19 1.86 5.85L2.5 21.5l3.82-1.28A9.94 9.94 0 0012 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm5.47 12.87c-.25.7-.85 1.33-1.43 1.41-.52.08-1.17.11-1.88-.12-.43-.14-.99-.32-1.7-.63-3.01-1.29-4.96-4.29-5.11-4.49-.15-.2-1.22-1.63-1.22-3.1 0-1.47.77-2.19 1.04-2.49.27-.3.6-.37.8-.37.2 0 .4 0 .58.01.18.01.43-.07.67.51.25.6.85 2.07.92 2.22.08.15.13.33.03.53-.1.2-.15.32-.3.5-.15.18-.31.39-.45.52-.15.15-.31.31-.13.61.18.3.78 1.28 1.67 2.08 1.15 1.02 2.11 1.33 2.41 1.48.3.15.47.12.65-.08.18-.2.75-.87.95-1.17.2-.3.4-.25.68-.15.27.1 1.73.82 2.03.97.3.15.5.22.57.35.08.12.08.72-.17 1.42z" />
  </svg>
);

const TelegramIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
  </svg>
);

export const PromptModal: React.FC<PromptModalProps> = ({
  post,
  categories,
  allPosts,
  onClose,
  onSelectPost,
  onCopyPrompt,
  onOpenPage,
}) => {
  const [copied, setCopied] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [countdown, setCountdown] = useState<number>(0);
  const [isUnlocked, setIsUnlocked] = useState<boolean>(true);
  const [liked, setLiked] = useState<boolean>(() => (post ? promptStore.isPostLiked(post.id) : false));
  const [likeCount, setLikeCount] = useState<number>(() => {
    if (!post) return 0;
    const storePost = promptStore.getPostById(post.id);
    if (typeof storePost?.likes === 'number') return storePost.likes;
    if (typeof post.likes === 'number') return post.likes;
    return 0;
  });

  const [saved, setSaved] = useState<boolean>(false);
  const [userRating, setUserRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [ratingSubmitted, setRatingSubmitted] = useState<boolean>(false);
  const [feedbackText, setFeedbackText] = useState<string>('');

  const { currentUser } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ type: 'rate'; stars: number } | { type: 'feedback' } | null>(null);
  const [ratingStats, setRatingStats] = useState<RatingStats>(DEFAULT_RATING_STATS);

  const [visibleRelatedCount, setVisibleRelatedCount] = useState<number>(4);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const modalScrollRef = useRef<HTMLDivElement | null>(null);
  const touchStartXRef = useRef<number | null>(null);

  const galleryImages: string[] = useMemo(() => {
    if (!post) return [];

    // 1. Primary multi-image array field
    if (post.images && Array.isArray(post.images) && post.images.length > 0) {
      const valid = post.images.filter((img): img is string => typeof img === 'string' && img.trim().length > 0);
      if (valid.length > 0) return valid;
    }

    // 2. Secondary gallery field if present on document
    if ((post as any).gallery && Array.isArray((post as any).gallery) && (post as any).gallery.length > 0) {
      const valid = (post as any).gallery.filter((img: any): img is string => typeof img === 'string' && img.trim().length > 0);
      if (valid.length > 0) return valid;
    }

    // 3. Single image fallback fields
    if (post.imageUrl && typeof post.imageUrl === 'string' && post.imageUrl.trim().length > 0) {
      return [post.imageUrl];
    }
    if ((post as any).image && typeof (post as any).image === 'string' && (post as any).image.trim().length > 0) {
      return [(post as any).image];
    }

    return [];
  }, [post]);

  useEffect(() => {
    setActiveImageIndex(0);
  }, [post?.id]);

  const { showToast } = useToast();
  const timerSettings = promptStore.getTimerSettings();
  const monetizationSettings = promptStore.getMonetization();
  const websiteSettings = promptStore.getWebsiteSettings();
  const fc = promptStore.getFeatureControls();

  // Real-time rating subscription
  useEffect(() => {
    if (!post?.id) return;
    const unsubscribe = subscribeRatings(
      post.id,
      (stats, uRating) => {
        setRatingStats(stats);
        if (uRating > 0) {
          setUserRating(uRating);
        }
      },
      currentUser?.uid
    );
    return () => unsubscribe();
  }, [post?.id, currentUser?.uid]);

  useEffect(() => {
    if (post) {
      if (modalScrollRef.current) {
        modalScrollRef.current.scrollTop = 0;
      }
      window.scrollTo(0, 0);
      setActiveImageIndex(0);

      const storePost = promptStore.getPostById(post.id);
      setLiked(promptStore.isPostLiked(post.id));
      if (typeof storePost?.likes === 'number') {
        setLikeCount(storePost.likes);
      } else if (typeof post.likes === 'number') {
        setLikeCount(post.likes);
      } else {
        setLikeCount(0);
      }

      // Check Saved status
      try {
        const stored = localStorage.getItem('sahil_edits_saved_posts_v1');
        if (stored) {
          const list: string[] = JSON.parse(stored);
          setSaved(list.includes(post.id));
        } else {
          setSaved(false);
        }
      } catch (e) {
        setSaved(false);
      }

      // Reset visible related posts count
      setVisibleRelatedCount(4);
    }
  }, [post?.id, post?.likes]);

  // Subscribe to promptStore updates for real-time like updates inside modal
  useEffect(() => {
    if (!post?.id) return;
    const unsubscribe = promptStore.subscribe(() => {
      setLiked(promptStore.isPostLiked(post.id));
      const updated = promptStore.getPostById(post.id);
      if (updated) {
        setLikeCount(typeof updated.likes === 'number' ? updated.likes : 0);
      }
    });
    return unsubscribe;
  }, [post?.id]);

  const handleStarClick = async (star: number) => {
    if (!currentUser) {
      setPendingAction({ type: 'rate', stars: star });
      setShowLoginModal(true);
      return;
    }
    if (!post?.id) return;
    setUserRating(star);
    await submitRating(post.id, currentUser.uid, currentUser.email || '', star);
    showToast('✓ Rating Submitted', `Thank you for rating ${star} stars!`);
  };

  const handleShareFeedbackClick = () => {
    if (!currentUser) {
      setPendingAction({ type: 'feedback' });
      setShowLoginModal(true);
      return;
    }
    setShowFeedbackModal(true);
  };

  const handleLoginSuccess = async () => {
    setShowLoginModal(false);
    if (pendingAction) {
      if (pendingAction.type === 'feedback') {
        setShowFeedbackModal(true);
      } else if (pendingAction.type === 'rate' && post?.id && currentUser) {
        setUserRating(pendingAction.stars);
        await submitRating(post.id, currentUser.uid, currentUser.email || '', pendingAction.stars);
        showToast('✓ Rating Submitted', `Thank you for rating ${pendingAction.stars} stars!`);
      }
      setPendingAction(null);
    }
  };

  const handleFeedbackSubmit = async (fText: string) => {
    if (!post?.id || !currentUser) return;
    const displayName = currentUser.displayName || currentUser.email?.split('@')[0] || 'User';
    await submitFeedback(
      post.id,
      post.title || '',
      currentUser.uid,
      currentUser.email || '',
      displayName,
      fText
    );
    showToast('✓ Feedback Submitted', 'Thank you for sharing your insights!');
  };

  const handleLike = async () => {
    if (!post) return;
    const willBeLiked = !liked;
    const newCount = willBeLiked ? likeCount + 1 : Math.max(0, likeCount - 1);
    setLiked(willBeLiked);
    setLikeCount(newCount);

    const res = await promptStore.toggleLikePost(post.id);
    setLiked(res.liked);
    setLikeCount(res.count);
  };

  const handleToggleSave = () => {
    if (!post) return;
    try {
      const stored = localStorage.getItem('sahil_edits_saved_posts_v1');
      let list: string[] = stored ? JSON.parse(stored) : [];
      if (list.includes(post.id)) {
        list = list.filter((id) => id !== post.id);
        setSaved(false);
        showToast('Removed from Saved', 'Post un-bookmarked.');
      } else {
        list.push(post.id);
        setSaved(true);
        showToast('✓ Saved to Favorites', 'Access anytime from your saved list.');
      }
      localStorage.setItem('sahil_edits_saved_posts_v1', JSON.stringify(list));
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmitRating = (ratingVal: number) => {
    if (!post || ratingVal === 0) return;
    setUserRating(ratingVal);
    setRatingSubmitted(true);
    try {
      localStorage.setItem(
        `sahil_edits_rating_${post.id}`,
        JSON.stringify({ rating: ratingVal, feedback: feedbackText, timestamp: Date.now() })
      );
      showToast('✓ Rating Submitted!', `Thank you for rating ${ratingVal} stars.`);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDownloadImage = async () => {
    const targetUrl = galleryImages[activeImageIndex] || post?.imageUrl;
    if (!targetUrl) return;
    try {
      const response = await fetch(targetUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${post?.title ? post.title.replace(/[^a-z0-9]/gi, '_') : 'image'}_${activeImageIndex + 1}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showToast('✓ Image Downloaded', 'Saved high-quality image to your downloads.');
    } catch (err) {
      window.open(targetUrl, '_blank');
    }
  };

  // Timer Countdown initialization
  useEffect(() => {
    if (!post) return;

    let seconds = 0;
    if (fc.timerLock === false) {
      seconds = 0;
    } else if (post.timerOverride) {
      if (post.timerOverride.enabled === false) {
        seconds = 0;
      } else if (typeof post.timerOverride.seconds === 'number') {
        seconds = post.timerOverride.seconds;
      } else {
        seconds = timerSettings.enabled ? timerSettings.defaultSeconds : 0;
      }
    } else {
      seconds = timerSettings.enabled ? timerSettings.defaultSeconds : 0;
    }

    setCountdown(seconds);
    setIsUnlocked(seconds === 0);

    if (seconds > 0) {
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setIsUnlocked(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [post?.id, timerSettings.enabled, timerSettings.defaultSeconds]);

  // ESC key to close modal & lock body overflow for ultra smooth modal interaction
  useEffect(() => {
    if (!post) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [post, onClose]);

  if (!post) return null;

  const category = categories.find((c) => c.id === post.categoryId);

  // Dynamic Related Posts Calculation
  const relatedPosts = allPosts
    .filter((p) => p.id !== post.id)
    .sort((a, b) => {
      const currentCategory = post.categoryId;
      const currentTags = new Set((post.tags || []).map((t) => t.toLowerCase()));

      const aSameCat = a.categoryId === currentCategory ? 5 : 0;
      const bSameCat = b.categoryId === currentCategory ? 5 : 0;

      const aTagOverlap = (a.tags || []).filter((t) => currentTags.has(t.toLowerCase())).length;
      const bTagOverlap = (b.tags || []).filter((t) => currentTags.has(t.toLowerCase())).length;

      const scoreA = aSameCat + aTagOverlap * 2 + (a.likes || 0) * 0.1;
      const scoreB = bSameCat + bTagOverlap * 2 + (b.likes || 0) * 0.1;

      return scoreB - scoreA;
    });

  const visibleRelatedPosts = relatedPosts.slice(0, visibleRelatedCount);
  const hasMoreRelated = visibleRelatedCount < relatedPosts.length;

  const handleLoadMoreRelated = () => {
    setVisibleRelatedCount((prev) => prev + 4);
  };

  const handleCopyPrompt = () => {
    if (!isUnlocked) return;
    navigator.clipboard.writeText(post.fullPrompt);
    setCopied(true);
    onCopyPrompt(post);
    showToast('✓ Prompt Copied Successfully', 'Ready to paste into your AI assistant.');

    setTimeout(() => {
      setCopied(false);
    }, 2500);
  };

  const postShareUrl = `${window.location.origin}${window.location.pathname}?prompt=${post.id}`;
  const shareTitle = encodeURIComponent(`Check out this AI Prompt: ${post.title} on Sahil Edits`);

  const shareLinks = {
    whatsapp: `https://api.whatsapp.com/send?text=${shareTitle}%20${encodeURIComponent(postShareUrl)}`,
    telegram: `https://t.me/share/url?url=${encodeURIComponent(postShareUrl)}&text=${shareTitle}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postShareUrl)}`,
    twitter: `https://twitter.com/intent/tweet?text=${shareTitle}&url=${encodeURIComponent(postShareUrl)}`,
    pinterest: `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(postShareUrl)}&media=${encodeURIComponent(galleryImages[0] || post.imageUrl || '')}&description=${shareTitle}`,
    threads: `https://www.threads.net/intent/post?text=${shareTitle}%20${encodeURIComponent(postShareUrl)}`,
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(postShareUrl);
    setShareCopied(true);
    showToast('✓ Link Copied to Clipboard', 'Share it with your friends!');
    setTimeout(() => setShareCopied(false), 2000);
  };

  const createdMillis = getPostCreatedAtMillis(post);
  const formattedDate = createdMillis > 0
    ? new Date(createdMillis).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Recently';

  const modelOrToolName =
    post.model ||
    (post.tags && post.tags.find((t) => ['gemini', 'chatgpt', 'midjourney', 'flux', 'claude', 'dall-e'].includes(t.toLowerCase()))) ||
    category?.name ||
    'Gemini AI';

  return (
    <AnimatePresence>
      {/* Full Open Detail Page Overlay Container */}
      <div ref={modalScrollRef} className="fixed inset-0 z-50 overflow-y-auto bg-zinc-950/90 dark:bg-zinc-950/95 backdrop-blur-md w-full h-full">
        {/* Backdrop click */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 -z-10"
          onClick={onClose}
        />

        {/* Detail View Container: 100% full screen on mobile, max-w-5xl centered on desktop */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 15 }}
          transition={{ type: 'spring', stiffness: 350, damping: 25 }}
          className="relative w-full min-h-screen sm:min-h-0 sm:my-4 max-w-4xl lg:max-w-5xl mx-auto bg-zinc-50 dark:bg-zinc-900 border-0 sm:border border-zinc-200 dark:border-zinc-800 rounded-none sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Top Detail Header Bar */}
          <div className="sticky top-0 z-30 flex items-center justify-between px-3.5 sm:px-6 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md shrink-0">
            {/* Left: Back Button */}
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white text-xs font-bold transition-all active:scale-95 cursor-pointer border border-zinc-200 dark:border-zinc-700 shadow-sm"
              aria-label="Back to Previous Page"
            >
              <ArrowLeft className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Back</span>
            </button>

            {/* Right: Tool/Model Badge */}
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                <CategoryIcon name={category?.icon || 'Sparkles'} className="w-3.5 h-3.5" />
                <span>{modelOrToolName}</span>
              </span>
            </div>
          </div>

          {/* Modal Content Body - Full Required Order */}
          <div className="flex-1 p-3 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 bg-zinc-50 dark:bg-zinc-900">

            {/* 1. FULL POST IMAGE / GALLERY */}
            <div className="space-y-3">
              <div
                onTouchStart={(e) => {
                  touchStartXRef.current = e.touches[0].clientX;
                }}
                onTouchEnd={(e) => {
                  if (touchStartXRef.current === null) return;
                  const touchEndX = e.changedTouches[0].clientX;
                  const diff = touchStartXRef.current - touchEndX;
                  if (diff > 40) {
                    // Swipe Left -> Next Image
                    setActiveImageIndex((prev) => (prev < galleryImages.length - 1 ? prev + 1 : 0));
                  } else if (diff < -40) {
                    // Swipe Right -> Prev Image
                    setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : galleryImages.length - 1));
                  }
                  touchStartXRef.current = null;
                }}
                className="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-950 shadow-xl flex flex-col items-center justify-center p-2 sm:p-4 group touch-pan-y select-none"
              >
                {/* Dynamic Ambient Background generated from current post image */}
                <div
                  className="absolute inset-0 -m-6 bg-cover bg-center scale-125 blur-3xl opacity-65 dark:opacity-55 pointer-events-none transition-all duration-700 ease-out"
                  style={{
                    backgroundImage: `url(${galleryImages[activeImageIndex] || post.imageUrl})`,
                  }}
                />
                {/* Softening Dark Overlay & Vignette */}
                <div className="absolute inset-0 bg-zinc-950/40 dark:bg-zinc-950/50 pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-zinc-950/40 pointer-events-none" />

                {/* Foreground Sharp Image */}
                <img
                  src={galleryImages[activeImageIndex] || post.imageUrl}
                  alt={`${post.title} - Image ${activeImageIndex + 1}`}
                  loading="lazy"
                  decoding="async"
                  className="relative z-10 w-full h-auto max-h-[75vh] sm:max-h-[600px] object-contain rounded-xl sm:rounded-2xl transition-transform duration-300 group-hover:scale-[1.005] shadow-2xl"
                  style={{ display: 'block', maxWidth: '100%' }}
                />

                {/* Top-Left Counter Badge if multiple images exist */}
                {galleryImages.length > 1 && (
                  <div className="absolute top-3 left-3 sm:top-5 sm:left-5 z-20 pointer-events-none">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-zinc-950/85 backdrop-blur-md text-white text-xs font-bold border border-white/15 shadow-xl">
                      <Images className="w-3.5 h-3.5 text-blue-400" />
                      <span>{activeImageIndex + 1} / {galleryImages.length}</span>
                    </span>
                  </div>
                )}

                {/* Navigation Arrows for Gallery */}
                {galleryImages.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() => setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : galleryImages.length - 1))}
                      className="absolute left-3 top-1/2 -translate-y-1/2 z-20 p-2.5 rounded-full bg-zinc-950/80 hover:bg-zinc-950 text-white border border-white/20 transition-all cursor-pointer shadow-xl active:scale-90"
                      aria-label="Previous image"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveImageIndex((prev) => (prev < galleryImages.length - 1 ? prev + 1 : 0))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 z-20 p-2.5 rounded-full bg-zinc-950/80 hover:bg-zinc-950 text-white border border-white/20 transition-all cursor-pointer shadow-xl active:scale-90"
                      aria-label="Next image"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}

                {/* Image Controls: Views + Download */}
                <div className="absolute bottom-3 right-3 sm:bottom-5 sm:right-5 z-20 flex items-center gap-2 bg-zinc-950/85 backdrop-blur-md p-1.5 sm:p-2 rounded-2xl border border-white/10 shadow-xl">
                  <span className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs font-semibold text-white">
                    <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400" />
                    {post.views || 0} views
                  </span>
                  <button
                    type="button"
                    onClick={handleDownloadImage}
                    className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
                    title="Download current active image"
                  >
                    <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span>Download</span>
                  </button>
                </div>
              </div>

              {/* Thumbnails Row if multiple images exist */}
              {galleryImages.length > 1 && (
                <div className="flex items-center gap-2.5 overflow-x-auto pb-1.5 pt-1 px-1 scrollbar-none">
                  {galleryImages.map((imgUrl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveImageIndex(idx)}
                      className={`relative shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 transition-all cursor-pointer ${
                        activeImageIndex === idx
                          ? 'border-blue-500 dark:border-blue-400 ring-2 ring-blue-500/40 scale-105'
                          : 'border-zinc-200 dark:border-zinc-800 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={imgUrl} alt={`${post.title} thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                      <span className="absolute bottom-1 right-1 px-1 py-0.2 rounded bg-black/75 text-white font-mono text-[9px]">
                        #{idx + 1}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 2. PROMPT DETAIL SECTION (LABEL, TITLE, SUBTITLE, AUTHOR + DATE) */}
            <div className="space-y-2 pt-1">
              <div className="inline-block px-3.5 py-1.5 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-black uppercase tracking-wider shadow-sm">
                PROMPT DETAIL
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold text-zinc-900 dark:text-white leading-tight">
                {post.title}
              </h1>
              {post.shortDescription && (
                <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 font-medium leading-relaxed">
                  {post.shortDescription}
                </p>
              )}
              <div className="flex items-center gap-2 text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 pt-1">
                <span>
                  Shared by <span className="font-bold text-zinc-900 dark:text-zinc-100">@{post.author || 'Sahil Edits'}</span>
                </span>
                <span>•</span>
                <span>{formattedDate}</span>
              </div>
            </div>

            {/* 3. PROMPT CONTENT CARD */}
            <div className="rounded-3xl bg-white dark:bg-zinc-850 p-5 sm:p-7 border border-zinc-200/80 dark:border-zinc-800 shadow-sm space-y-4 sm:space-y-5">
              {/* Card Header */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xs font-black uppercase tracking-widest text-purple-600 dark:text-purple-400">
                      PROMPT
                    </h2>
                    <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                      Optimized for {modelOrToolName}
                    </p>
                  </div>
                </div>

                {/* Save Button */}
                <button
                  type="button"
                  onClick={handleToggleSave}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    saved
                      ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                      : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700'
                  }`}
                >
                  {saved ? <BookmarkCheck className="w-4 h-4 text-amber-500 fill-amber-500" /> : <Bookmark className="w-4 h-4" />}
                  <span>{saved ? 'Saved' : 'Save'}</span>
                </button>
              </div>

              {/* Dedicated Inner Box for Prompt Text - Standard Uniform Height Across All Posts */}
              <div className="relative rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 p-4 sm:p-6 text-xs sm:text-sm font-mono text-zinc-900 dark:text-zinc-100 leading-relaxed shadow-inner overflow-hidden select-text h-60 sm:h-72 flex flex-col">
                {!isUnlocked && (
                  <div className="absolute inset-0 z-20 backdrop-blur-md bg-white/95 dark:bg-zinc-900/95 rounded-2xl flex flex-col items-center justify-center p-4 text-center space-y-3">
                    <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center shadow-md animate-bounce">
                      <Lock className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-zinc-900 dark:text-white text-sm sm:text-base">Unlock the full prompt</h4>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-xs">
                        Prompt will unlock automatically in <span className="font-bold text-emerald-600 dark:text-emerald-400">{countdown}s</span> — free.
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
                  <pre className="whitespace-pre-wrap font-sans sm:font-mono text-xs sm:text-sm select-text break-words">
                    {post.fullPrompt}
                  </pre>
                </div>
              </div>

              {/* Card Footer Actions: Copy + Like */}
              <div className="flex items-center justify-between gap-3 pt-1">
                {/* Copy Button */}
                {fc.promptCopy && fc.copyButton && (
                  <button
                    type="button"
                    onClick={handleCopyPrompt}
                    disabled={!isUnlocked}
                    className={`inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer shadow-md active:scale-95 ${
                      !isUnlocked
                        ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed border border-zinc-300 dark:border-zinc-700'
                        : copied
                        ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                        : 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-orange-500/25'
                    }`}
                  >
                    {!isUnlocked ? (
                      <>
                        <Clock className="w-4 h-4 animate-spin" />
                        <span>Locked ({countdown}s)</span>
                      </>
                    ) : copied ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                )}

                {/* Like Button */}
                <button
                  type="button"
                  onClick={handleLike}
                  className={`inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer shadow-sm active:scale-95 ${
                    liked
                      ? 'bg-blue-600 text-white shadow-blue-600/30'
                      : 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${liked ? 'fill-white text-white' : ''}`} />
                  <span>Like {likeCount}</span>
                </button>
              </div>
            </div>

            {/* SECTION 3: SHARE */}
            {fc.postShareEnabled !== false && fc.socialShareButtons !== false && (
              (fc.shareFacebookToggle !== false || fc.facebookToggle !== false) ||
              (fc.shareTwitterToggle !== false || fc.twitterToggle !== false) ||
              (fc.shareThreadsToggle !== false || fc.threadsToggle !== false) ||
              (fc.sharePinterestToggle !== false || fc.pinterestToggle !== false) ||
              (fc.shareWhatsappToggle !== false || fc.whatsappToggle !== false) ||
              (fc.shareTelegramToggle !== false || fc.telegramToggle !== false) ||
              (fc.shareCopyLinkToggle !== false || fc.copyLinkToggle !== false)
            ) && (
              <div className="rounded-[28px] bg-white dark:bg-zinc-850 p-6 sm:p-8 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-5 sm:space-y-6">
                <div className="flex items-center gap-3">
                  <Share2 className="w-7 h-7 sm:w-8 sm:h-8 text-zinc-900 dark:text-white stroke-[2.2]" />
                  <h3 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white tracking-tight">
                    Share
                  </h3>
                </div>

                <div className="flex flex-wrap items-center gap-3 sm:gap-3.5">
                  {fc.shareFacebookToggle !== false && fc.facebookToggle !== false && (
                    <a
                      href={shareLinks.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-[#1877F2] hover:bg-[#166fe5] text-white flex items-center justify-center transition-transform hover:scale-105 active:scale-95 shadow-sm cursor-pointer shrink-0"
                      title="Share on Facebook"
                      aria-label="Share on Facebook"
                    >
                      <FacebookIcon className="w-5 h-5 text-white" />
                    </a>
                  )}

                  {fc.shareTwitterToggle !== false && fc.twitterToggle !== false && (
                    <a
                      href={shareLinks.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-[#1DA1F2] hover:bg-[#1a91da] text-white flex items-center justify-center transition-transform hover:scale-105 active:scale-95 shadow-sm cursor-pointer shrink-0"
                      title="Share on Twitter / X"
                      aria-label="Share on Twitter / X"
                    >
                      <TwitterXIcon className="w-5 h-5 text-white" />
                    </a>
                  )}

                  {fc.shareThreadsToggle !== false && fc.threadsToggle !== false && (
                    <a
                      href={shareLinks.threads}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-black hover:bg-zinc-800 text-white flex items-center justify-center transition-transform hover:scale-105 active:scale-95 shadow-sm cursor-pointer shrink-0"
                      title="Share on Threads"
                      aria-label="Share on Threads"
                    >
                      <ThreadsIcon className="w-5 h-5 text-white" />
                    </a>
                  )}

                  {fc.sharePinterestToggle !== false && fc.pinterestToggle !== false && (
                    <a
                      href={shareLinks.pinterest}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-[#E60023] hover:bg-[#cc001f] text-white flex items-center justify-center transition-transform hover:scale-105 active:scale-95 shadow-sm cursor-pointer shrink-0"
                      title="Share on Pinterest"
                      aria-label="Share on Pinterest"
                    >
                      <PinterestIcon className="w-5 h-5 text-white" />
                    </a>
                  )}

                  {fc.shareWhatsappToggle !== false && fc.whatsappToggle !== false && (
                    <a
                      href={shareLinks.whatsapp}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white flex items-center justify-center transition-transform hover:scale-105 active:scale-95 shadow-sm cursor-pointer shrink-0"
                      title="Share on WhatsApp"
                      aria-label="Share on WhatsApp"
                    >
                      <WhatsAppIcon className="w-5 h-5 text-white" />
                    </a>
                  )}

                  {fc.shareTelegramToggle !== false && fc.telegramToggle !== false && (
                    <a
                      href={shareLinks.telegram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-[#229ED9] hover:bg-[#1f8ebd] text-white flex items-center justify-center transition-transform hover:scale-105 active:scale-95 shadow-sm cursor-pointer shrink-0"
                      title="Share on Telegram"
                      aria-label="Share on Telegram"
                    >
                      <TelegramIcon className="w-5 h-5 text-white" />
                    </a>
                  )}

                  {fc.shareCopyLinkToggle !== false && fc.copyLinkToggle !== false && (
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-[#8E99A8] hover:bg-[#7d8897] text-white flex items-center justify-center transition-transform hover:scale-105 active:scale-95 shadow-sm cursor-pointer shrink-0"
                      title={shareCopied ? 'Link Copied!' : 'Copy Link'}
                      aria-label="Copy Link"
                    >
                      {shareCopied ? (
                        <Check className="w-5 h-5 text-white stroke-[3]" />
                      ) : (
                        <Link className="w-5 h-5 text-white stroke-[2.5]" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* SECTION 4: COMMUNITY RATING */}
            <div className="rounded-[28px] bg-white dark:bg-zinc-850 p-6 sm:p-8 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-6 text-center">
              {/* Header: Icon + Title */}
              <div className="flex items-center gap-3 text-left">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center shrink-0">
                  <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                </div>
                <h3 className="text-xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
                  Community Rating
                </h3>
              </div>

              {/* Big Rating Number */}
              <div className="py-2">
                <div className="text-5xl sm:text-6xl font-black text-zinc-900 dark:text-white tracking-tight">
                  {ratingStats.average.toFixed(1)}
                </div>

                {/* 5 Filled Gold Stars */}
                <div className="flex items-center justify-center gap-1.5 text-amber-400 mt-2.5 mb-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="w-5 h-5 fill-amber-400 text-amber-400" />
                  ))}
                </div>

                {/* Rating Count */}
                <div className="text-xs font-black tracking-wider text-zinc-400 dark:text-zinc-500 uppercase mt-1">
                  {ratingStats.total} {ratingStats.total === 1 ? 'RATING' : 'RATINGS'}
                </div>
              </div>

              {/* Distribution Bars */}
              <div className="max-w-md mx-auto space-y-2 py-1">
                {[5, 4, 3, 2, 1].map((num) => {
                  const count = ratingStats.distribution[num as 1 | 2 | 3 | 4 | 5] || 0;
                  const pct = ratingStats.total > 0 ? (count / ratingStats.total) * 100 : (num === 5 ? 100 : 0);
                  return (
                    <div key={num} className="flex items-center gap-3 text-xs font-bold">
                      <span className="w-3 text-zinc-400 text-right">{num}</span>
                      <div className="flex-1 h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                        <div
                          className="h-full bg-amber-400 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-4 text-zinc-700 dark:text-zinc-300 text-left">{count}</span>
                    </div>
                  );
                })}
              </div>

              {/* Rate This Prompt */}
              <div className="border-t border-zinc-200 dark:border-zinc-800 pt-6">
                <div className="text-xs font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 text-center mb-3">
                  RATE THIS PROMPT
                </div>

                {/* 5 Interactive Star Icons */}
                <div className="flex items-center justify-center gap-2 mb-6">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => handleStarClick(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 cursor-pointer transition-transform hover:scale-110 active:scale-95"
                      aria-label={`Rate ${star} stars`}
                    >
                      <Star
                        className={`w-8 h-8 transition-colors ${
                          (hoverRating || userRating) >= star
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-zinc-300 dark:text-zinc-700'
                        }`}
                      />
                    </button>
                  ))}
                </div>

                {/* Share Feedback Button */}
                <button
                  type="button"
                  onClick={handleShareFeedbackClick}
                  className="w-full py-3.5 px-6 rounded-2xl bg-zinc-100 dark:bg-zinc-800/80 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-extrabold text-xs sm:text-sm tracking-wider uppercase border border-zinc-200 dark:border-zinc-700 flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-sm active:scale-[0.98]"
                >
                  <MessageSquare className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                  <span>SHARE FEEDBACK</span>
                </button>
              </div>
            </div>

            {/* SECTION 5: MODEL OR TOOL + TAGS (COMBINED SINGLE CARD) */}
            <div className="rounded-[28px] bg-white dark:bg-zinc-850 p-6 sm:p-8 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-7">
              {/* MODEL OR TOOL BLOCK */}
              <div className="space-y-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <Zap className="w-5 h-5 fill-white" />
                  </div>
                  <h3 className="text-sm sm:text-base font-black text-zinc-900 dark:text-white uppercase tracking-wider">
                    MODEL OR TOOL
                  </h3>
                </div>
                <div>
                  <span className="inline-flex items-center px-5 py-2.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white text-xs sm:text-sm font-extrabold border border-zinc-200/80 dark:border-zinc-700/80 shadow-xs">
                    {modelOrToolName}
                  </span>
                </div>
              </div>

              {/* TAGS BLOCK */}
              <div className="space-y-3.5 pt-1 border-t border-zinc-100 dark:border-zinc-800/60">
                <div className="flex items-center gap-3 pt-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-500 to-cyan-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <Tag className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm sm:text-base font-black text-zinc-900 dark:text-white uppercase tracking-wider">
                    TAGS
                  </h3>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {(post.tags && post.tags.length > 0 ? post.tags : [category?.name || 'lifestyle']).map((tag, idx) => {
                    const cleanTag = tag.startsWith('#') ? tag.slice(1) : tag;
                    return (
                      <span
                        key={idx}
                        className="px-4 py-2 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-xs sm:text-sm font-extrabold border border-blue-200/60 dark:border-blue-800/60 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-all cursor-pointer"
                      >
                        # {cleanTag}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* SECTION 6: YOU MIGHT ALSO LIKE (STANDALONE RECOMMENDATION SECTION) */}
            <div className="space-y-6 pt-4">
              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-500 border border-blue-500/20 flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5 text-blue-500" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
                    You might also like
                  </h3>
                </div>
                <span className="text-xs font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                  Recommended Prompts
                </span>
              </div>

              {/* RECOMMENDED POSTS GRID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {visibleRelatedPosts.map((relPost) => (
                  <PromptCard
                    key={relPost.id}
                    post={relPost}
                    category={categories.find((c) => c.id === relPost.categoryId)}
                    onOpenModal={onSelectPost}
                    onCopyPrompt={onCopyPrompt}
                  />
                ))}
              </div>

              {/* SECTION 7: LOAD MORE BUTTON */}
              {hasMoreRelated && (
                <div className="flex justify-center pt-2">
                  <button
                    type="button"
                    onClick={handleLoadMoreRelated}
                    className="px-8 py-3.5 rounded-2xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-xs font-black uppercase tracking-wider transition-all shadow-lg active:scale-95 cursor-pointer"
                  >
                    Load More
                  </button>
                </div>
              )}
            </div>

            {/* SECTION 8: FOOTER */}
            <div className="pt-6">
              <Footer onOpenPage={onOpenPage || (() => {})} />
            </div>

          </div>

          {/* Login Modal */}
          <LoginModal
            isOpen={showLoginModal}
            onClose={() => {
              setShowLoginModal(false);
              setPendingAction(null);
            }}
            onLoginSuccess={handleLoginSuccess}
          />

          {/* Share Feedback Modal */}
          <ShareFeedbackModal
            isOpen={showFeedbackModal}
            onClose={() => setShowFeedbackModal(false)}
            onSubmit={handleFeedbackSubmit}
            postTitle={post?.title}
          />
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

