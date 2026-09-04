import React from 'react';
import {
  FileText,
  Image as ImageIcon,
  Film,
  Eye,
  Heart,
  Share2,
  MessageSquare,
  ArrowUpRight,
} from 'lucide-react';
import { PromptPost, CommentItem } from '../../../types';
import { AdminTab } from '../AdminSidebar';

interface WebsiteOverviewGridProps {
  posts: PromptPost[];
  comments: CommentItem[];
  onSelectTab: (tab: AdminTab) => void;
}

export const WebsiteOverviewGrid: React.FC<WebsiteOverviewGridProps> = ({
  posts,
  comments,
  onSelectTab,
}) => {
  // Real data calculations
  const totalPosts = posts.length;
  const photoPrompts = posts.filter((p) => p.postType !== 'video_prompt').length;
  const videoPrompts = posts.filter((p) => p.postType === 'video_prompt').length;
  const totalViews = posts.reduce((sum, p) => sum + (p.views || 0), 0);
  const totalLikes = posts.reduce((sum, p) => sum + (p.likes || 0), 0);
  const totalShares = posts.reduce((sum, p) => sum + (p.shares || 0), 0);
  const totalComments = comments.length;
  const approvedComments = comments.filter((c) => c.status === 'approved').length;
  const pendingComments = comments.filter((c) => c.status === 'pending').length;

  const cards = [
    {
      title: 'Total Posts',
      value: totalPosts.toLocaleString(),
      subtitle: `${photoPrompts} Photo • ${videoPrompts} Video`,
      icon: FileText,
      iconColor: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
      tab: 'posts' as AdminTab,
    },
    {
      title: 'Photo Prompts',
      value: photoPrompts.toLocaleString(),
      subtitle: 'Standard text-to-image prompts',
      icon: ImageIcon,
      iconColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
      tab: 'posts' as AdminTab,
    },
    {
      title: 'Video Prompts',
      value: videoPrompts.toLocaleString(),
      subtitle: 'AI video generation templates',
      icon: Film,
      iconColor: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
      tab: 'posts' as AdminTab,
    },
    {
      title: 'Total Views',
      value: totalViews.toLocaleString(),
      subtitle: 'Across all prompt posts',
      icon: Eye,
      iconColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      tab: 'views' as AdminTab,
    },
    {
      title: 'Total Likes',
      value: totalLikes.toLocaleString(),
      subtitle: 'Community upvotes & favorites',
      icon: Heart,
      iconColor: 'text-pink-400 bg-pink-500/10 border-pink-500/20',
      tab: 'likes' as AdminTab,
    },
    {
      title: 'Total Shares',
      value: totalShares.toLocaleString(),
      subtitle: 'Shared across social channels',
      icon: Share2,
      iconColor: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
      tab: 'shares' as AdminTab,
    },
    {
      title: 'Total Comments',
      value: totalComments.toLocaleString(),
      subtitle: `${approvedComments} Approved • ${pendingComments} Pending`,
      icon: MessageSquare,
      iconColor: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
      tab: 'comments' as AdminTab,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-400" />
            <span>Website Overview</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Aggregated content metrics and live community engagement totals
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              onClick={() => onSelectTab(card.tab)}
              className="group p-5 rounded-3xl bg-zinc-900/90 hover:bg-zinc-800/90 border border-zinc-800/90 hover:border-zinc-700 transition-all duration-200 cursor-pointer shadow-lg hover:shadow-xl hover:-translate-y-1 relative overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 group-hover:text-zinc-200 transition-colors">
                  {card.title}
                </span>
                <div
                  className={`w-9 h-9 rounded-2xl border flex items-center justify-center ${card.iconColor}`}
                >
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <div className="mt-3">
                <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {card.value}
                </div>
                <p className="text-[11px] font-semibold text-zinc-400 mt-1 truncate">
                  {card.subtitle}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-[11px] text-zinc-500 group-hover:text-blue-400 font-bold transition-colors">
                <span>Inspect {card.title}</span>
                <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
