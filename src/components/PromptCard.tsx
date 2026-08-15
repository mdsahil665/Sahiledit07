import React, { useState, useEffect } from 'react';
import { PromptPost, Category, DEFAULT_POST_CARD_CONFIG, PostCardConfig } from '../types';
import { Eye, Copy, Check, Share2, Sparkles, Heart, ArrowUpRight, Images } from 'lucide-react';
import { promptStore } from '../services/promptStore';
import { getPostDisplayBadge } from '../services/badgeService';
import { getPromptShareUrl } from '../utils/promptUrl';

interface PromptCardProps {
  post: PromptPost;
  category?: Category;
  onOpenModal: (post: PromptPost) => void;
  onCopyPrompt?: (post: PromptPost) => void;
}

export const PromptCard: React.FC<PromptCardProps> = React.memo(({
  post,
  category,
  onOpenModal,
  onCopyPrompt,
}) => {
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);
  const [liked, setLiked] = useState(() => promptStore.isPostLiked(post.id));
  const [likeCount, setLikeCount] = useState(() => {
    const storePost = promptStore.getPostById(post.id);
    if (typeof storePost?.likes === 'number') return storePost.likes;
    if (typeof post.likes === 'number') return post.likes;
    return 0;
  });

  // Get global card settings merged with post-specific card settings
  const globalConfig = promptStore.getPostCardConfig();
  const cardConfig: PostCardConfig = {
    ...DEFAULT_POST_CARD_CONFIG,
    ...globalConfig,
    ...(post.cardConfig || {}),
  };

  useEffect(() => {
    setLiked(promptStore.isPostLiked(post.id));
    const storePost = promptStore.getPostById(post.id);
    if (typeof storePost?.likes === 'number') {
      setLikeCount(storePost.likes);
    } else if (typeof post.likes === 'number') {
      setLikeCount(post.likes);
    } else {
      setLikeCount(0);
    }

    const unsubscribe = promptStore.subscribe(() => {
      setLiked(promptStore.isPostLiked(post.id));
      const updated = promptStore.getPostById(post.id);
      if (updated && typeof updated.likes === 'number') {
        setLikeCount(updated.likes);
      }
    });
    return unsubscribe;
  }, [post.id, post.likes]);

  const allPosts = promptStore.getPosts();
  const badgeResult = getPostDisplayBadge(post, allPosts, cardConfig);

  const rawCategoryLabel =
    cardConfig.categoryLabelText ||
    category?.name ||
    post.categoryName ||
    (post.tags && post.tags.length > 0 ? `#${post.tags[0]}` : '');

  const activeBadgeLabel = badgeResult?.label || '';
  const creatorLabel = cardConfig.creatorText || 'Sahil Edits';

  const showCategoryBadge =
    cardConfig.categoryLabelVisible !== false &&
    rawCategoryLabel.trim().length > 0 &&
    rawCategoryLabel.trim().toLowerCase() !== activeBadgeLabel.trim().toLowerCase();

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    const promptToCopy = post.fullPrompt || post.shortDescription || post.title;
    if (promptToCopy) {
      navigator.clipboard.writeText(promptToCopy);
      promptStore.incrementCopies(post.id);
    }
    if (onCopyPrompt) {
      onCopyPrompt(post);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = getPromptShareUrl(post);
    const shareData = {
      title: post.title,
      text: post.shortDescription || post.title,
      url: shareUrl,
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // user canceled share
      }
    } else {
      navigator.clipboard.writeText(shareUrl);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    }
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    // Immediate optimistic update for zero delay
    const willBeLiked = !liked;
    const newCount = willBeLiked ? likeCount + 1 : Math.max(0, likeCount - 1);
    setLiked(willBeLiked);
    setLikeCount(newCount);

    const result = await promptStore.toggleLikePost(post.id);
    setLiked(result.liked);
    setLikeCount(result.count);
  };

  const coverImageUrl = (post.images && Array.isArray(post.images) && post.images.length > 0)
    ? post.images[0]
    : post.imageUrl;
  const totalImages = (post.images && Array.isArray(post.images) && post.images.length > 1)
    ? post.images.length
    : 1;

  return (
    <article
      onClick={() => onOpenModal(post)}
      className="group relative flex flex-col h-[440px] sm:h-[460px] w-full mx-auto rounded-[2rem] bg-slate-900 border border-slate-200/60 shadow-xl hover:shadow-2xl hover:shadow-blue-500/15 hover:border-blue-400/50 transition-all duration-300 overflow-hidden cursor-pointer hover:-translate-y-1.5 select-none"
      style={{
        isolation: 'isolate',
        WebkitBackfaceVisibility: 'hidden',
        backfaceVisibility: 'hidden',
      }}
    >
      {/* Ambient Glow Gradient background on hover */}
      <div className="absolute -inset-px rounded-[2rem] bg-gradient-to-r from-blue-600/0 via-indigo-600/0 to-purple-600/0 group-hover:from-blue-600/10 group-hover:via-indigo-600/10 group-hover:to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-30" />

      {/* 1. Image Area (Upper & Full Background fill) */}
      {cardConfig.imageVisible !== false && (
        <div className="absolute inset-0 w-full h-full bg-slate-950 overflow-hidden">
          {/* Ambient blurred backdrop fill */}
          <img
            src={coverImageUrl}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-35 scale-125 select-none pointer-events-none"
          />

          {/* Main Subject Image - Always Sharp and Bright */}
          <img
            src={coverImageUrl}
            alt={post.title}
            loading="lazy"
            decoding="async"
            style={{ opacity: (cardConfig.imageOpacity ?? 100) / 100 }}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out brightness-100 contrast-100"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80';
            }}
          />

          {/* Permanent Overlay is disabled by default to keep image 100% clear. Only rendered if admin explicitly turns it ON */}
          {cardConfig.imageOverlay && (
            <div className="absolute inset-0 bg-slate-950/40 pointer-events-none z-10" />
          )}

          {/* Subtle bottom gradient vignette behind glass for depth */}
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-slate-950/60 via-slate-950/20 to-transparent pointer-events-none z-10" />

          {/* Multi-Image Gallery Badge Indicator */}
          {totalImages > 1 && (
            <div className="absolute bottom-24 right-3.5 z-20 pointer-events-none">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-950/80 backdrop-blur-md text-[11px] font-bold text-white border border-white/20 shadow-lg">
                <Images className="w-3 h-3 text-blue-400" />
                <span>1 / {totalImages}</span>
              </span>
            </div>
          )}

          {/* Top Badges / Indicators */}
          <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between gap-2 pointer-events-none z-20">
            {/* Left Badge: Dynamic Smart Badge or Admin Manual Badge */}
            {cardConfig.badgeVisible !== false && badgeResult && (
              <span
                className={`px-3 py-1 rounded-full backdrop-blur-md text-[10px] sm:text-[11px] font-extrabold tracking-wider uppercase shadow-md border flex items-center gap-1.5 ${
                  badgeResult.badgeType === 'NEW'
                    ? 'bg-emerald-500 text-white border-emerald-400 shadow-emerald-500/30'
                    : badgeResult.badgeType === 'PHOTO PROMPT'
                    ? 'bg-sky-500 text-white border-sky-400 shadow-sky-500/30'
                    : badgeResult.badgeType === 'CREATIVE'
                    ? 'bg-purple-600 text-white border-purple-400 shadow-purple-500/30'
                    : badgeResult.badgeType === 'TRENDING'
                    ? 'bg-amber-500 text-white border-amber-400 shadow-amber-500/30'
                    : badgeResult.badgeType === 'HOT'
                    ? 'bg-rose-500 text-white border-rose-400 shadow-rose-500/30'
                    : badgeResult.badgeType === 'PREMIUM'
                    ? 'bg-gradient-to-r from-amber-400 to-amber-300 text-slate-950 font-black border-amber-200 shadow-amber-500/30'
                    : badgeResult.badgeType === 'AI PROMPT'
                    ? 'bg-blue-600 text-white border-blue-400 shadow-blue-500/30'
                    : 'bg-white/95 text-slate-900 border-white/80'
                }`}
              >
                {badgeResult.badgeType === 'NEW' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                )}
                <Sparkles
                  className={`w-3 h-3 ${
                    badgeResult.badgeType === 'PREMIUM'
                      ? 'text-slate-950 fill-slate-950'
                      : badgeResult.badgeType === 'NEW' ||
                        badgeResult.badgeType === 'PHOTO PROMPT' ||
                        badgeResult.badgeType === 'CREATIVE' ||
                        badgeResult.badgeType === 'TRENDING' ||
                        badgeResult.badgeType === 'HOT' ||
                        badgeResult.badgeType === 'AI PROMPT'
                      ? 'text-white fill-white'
                      : 'text-amber-500 fill-amber-500'
                  }`}
                />
                <span className="truncate max-w-[120px]">{badgeResult.label}</span>
              </span>
            )}

            {/* Category Badge if enabled and distinct from main badge */}
            {showCategoryBadge && (
              <span className="px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md text-slate-800 text-[10px] font-bold tracking-wider uppercase border border-white/60 shadow-md">
                <span className="truncate max-w-[100px]">{rawCategoryLabel}</span>
              </span>
            )}

            {/* Top-Right Views Indicator */}
            {cardConfig.viewsVisible !== false && (
              <div className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md text-slate-800 text-xs font-bold border border-white/60 shadow-md">
                <Eye className="w-3.5 h-3.5 text-blue-600" />
                <span>{post.views || 0}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. Liquid Glass / Frosted Glass Overlay Panel Attached to Bottom */}
      {cardConfig.glassPanelVisible !== false && (
        <div
          className="absolute bottom-0 inset-x-0 w-full z-20 p-4 sm:p-4.5 border-t border-white/60 flex flex-col justify-between gap-2.5 transition-all duration-300 group-hover:border-white/85 rounded-b-[2rem] overflow-hidden"
          style={{
            background:
              'linear-gradient(180deg, rgba(255, 255, 255, 0.22) 0%, rgba(245, 247, 250, 0.60) 35%, rgba(240, 244, 248, 0.85) 70%, rgba(248, 250, 252, 0.96) 100%)',
            backdropFilter: 'blur(20px) saturate(135%)',
            WebkitBackdropFilter: 'blur(20px) saturate(135%)',
            boxShadow:
              'inset 0 1px 2px 0 rgba(255, 255, 255, 0.85), inset 0 -1px 1px 0 rgba(255, 255, 255, 0.3), 0 -8px 24px -4px rgba(15, 23, 42, 0.12)',
            WebkitBackfaceVisibility: 'hidden',
            backfaceVisibility: 'hidden',
          }}
        >
          <div className="space-y-1">
            {/* Post Title */}
            {cardConfig.titleVisible !== false && (
              <h2 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors duration-200 leading-snug line-clamp-1 tracking-tight">
                {post.title}
              </h2>
            )}

            {/* Short Description / Prompt Preview */}
            {cardConfig.descriptionVisible !== false && (
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed line-clamp-2 font-normal">
                {post.shortDescription || post.fullPrompt}
              </p>
            )}
          </div>

          {/* Action Buttons & Author Row */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 mt-auto gap-2">
            {/* Buttons: ONLY Like and Open */}
            <div className="flex items-center gap-2">
              {/* Like Button */}
              {cardConfig.likeButtonVisible !== false && (
                <button
                  type="button"
                  onClick={handleLike}
                  className={`px-3 py-1.5 rounded-full font-bold text-xs flex items-center gap-1.5 border shadow-sm active:scale-95 transition-all cursor-pointer ${
                    liked
                      ? 'bg-rose-50 text-rose-600 border-rose-200 shadow-rose-100'
                      : 'bg-white/90 hover:bg-white text-slate-700 border-slate-200/80 hover:border-slate-300'
                  }`}
                  title={liked ? 'Unlike post' : 'Like post'}
                >
                  <Heart className={`w-3.5 h-3.5 ${liked ? 'fill-rose-500 text-rose-500' : ''}`} />
                  <span>{likeCount}</span>
                </button>
              )}

              {/* Open Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenModal(post);
                }}
                className="px-3 py-1.5 rounded-full font-semibold text-xs flex items-center gap-1.5 bg-white/90 hover:bg-white text-slate-700 border border-slate-200/80 hover:border-slate-300 shadow-sm active:scale-95 transition-all cursor-pointer"
                title="Open prompt details"
              >
                <ArrowUpRight className="w-3.5 h-3.5 text-blue-600" />
                <span>Open</span>
              </button>
            </div>

            {/* Creator Attribution */}
            {cardConfig.creatorVisible !== false && (
              <span className="text-[11px] sm:text-xs font-semibold text-slate-600 truncate max-w-[120px] text-right ml-auto">
                By {creatorLabel}
              </span>
            )}
          </div>
        </div>
      )}
    </article>
  );
});

PromptCard.displayName = 'PromptCard';
