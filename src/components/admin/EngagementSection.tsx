import React from 'react';
import { PromptPost } from '../../types';
import { Heart, Share2, Eye, Star, TrendingUp, Sparkles, ArrowUpRight } from 'lucide-react';
import { getOptimizedDisplayUrl } from '../../lib/imageUtils';

interface EngagementSectionProps {
  type: 'likes' | 'shares' | 'views' | 'ratings';
  posts: PromptPost[];
  onEditPost: (post: PromptPost) => void;
}

export const EngagementSection: React.FC<EngagementSectionProps> = ({ type, posts, onEditPost }) => {
  let title = 'Engagement Analytics';
  let description = 'Overview of community interactions across all prompts.';
  let icon = Heart;
  let iconColor = 'text-rose-400';
  let metricLabel = 'Likes';

  if (type === 'likes') {
    title = 'Prompt Likes Analytics';
    description = 'Detailed breakdown of the most liked AI prompts by the Sahil Edits community.';
    icon = Heart;
    iconColor = 'text-rose-400';
    metricLabel = 'Likes';
  } else if (type === 'shares') {
    title = 'Post Shares Analytics';
    description = 'Prompts that have been shared the most to social media platforms and copied links.';
    icon = Share2;
    iconColor = 'text-sky-400';
    metricLabel = 'Shares';
  } else if (type === 'views') {
    title = 'Prompt View Count Leaderboard';
    description = 'Total views logged per prompt across homepage and detail pages.';
    icon = Eye;
    iconColor = 'text-emerald-400';
    metricLabel = 'Views';
  } else if (type === 'ratings') {
    title = 'Prompt Ratings & Quality Metrics';
    description = 'Average community rating scores and user quality feedback for library prompts.';
    icon = Star;
    iconColor = 'text-amber-400';
    metricLabel = 'Rating';
  }

  const IconComponent = icon;

  // Sort posts by relevant metric
  const sortedPosts = [...posts].sort((a, b) => {
    if (type === 'likes') return (b.likes || 0) - (a.likes || 0);
    if (type === 'shares') return (b.shares || 0) - (a.shares || 0);
    if (type === 'views') return (b.views || 0) - (a.views || 0);
    return (b.views || 0) - (a.views || 0);
  });

  const totalMetricValue = posts.reduce((sum, p) => {
    if (type === 'likes') return sum + (p.likes || 0);
    if (type === 'shares') return sum + (p.shares || 0);
    if (type === 'views') return sum + (p.views || 0);
    return sum + (p.likes || 0);
  }, 0);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <IconComponent className={`w-5 h-5 ${iconColor}`} />
            <span>{title}</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-1">{description}</p>
        </div>

        <div className="px-4 py-2 rounded-2xl bg-zinc-900 border border-zinc-800 text-xs font-bold text-white flex items-center gap-2">
          <span className="text-zinc-400">Total {metricLabel}:</span>
          <span className="text-base font-black text-blue-400">{totalMetricValue.toLocaleString()}</span>
        </div>
      </div>

      {/* Top Performing List */}
      <div className="bg-zinc-900/90 rounded-3xl border border-zinc-800 p-6 space-y-4">
        <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-blue-400" />
          <span>Top Performing Prompts for {metricLabel}</span>
        </h3>

        <div className="space-y-3">
          {sortedPosts.slice(0, 10).map((post, index) => {
            const val =
              type === 'likes'
                ? post.likes || 0
                : type === 'shares'
                ? post.shares || 0
                : post.views || 0;

            return (
              <div
                key={post.id}
                onClick={() => onEditPost(post)}
                className="p-4 rounded-2xl bg-zinc-950/60 hover:bg-zinc-800/80 border border-zinc-800/80 flex items-center justify-between transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-4 overflow-hidden">
                  <span className="w-6 text-center text-xs font-black text-zinc-500 group-hover:text-blue-400">
                    #{index + 1}
                  </span>
                  <img
                    src={getOptimizedDisplayUrl(post.imageUrl, { width: 100, height: 100, crop: 'fill' })}
                    alt={post.title}
                    className="w-12 h-12 rounded-xl object-cover shrink-0 border border-zinc-800"
                  />
                  <div className="truncate">
                    <h4 className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors truncate">
                      {post.title}
                    </h4>
                    <p className="text-[11px] text-zinc-400 truncate mt-0.5">{post.shortDescription || post.fullPrompt}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <span className="text-sm font-black text-white">{val.toLocaleString()}</span>
                    <p className="text-[10px] text-zinc-500 uppercase font-bold">{metricLabel}</p>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-zinc-500 group-hover:text-blue-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
