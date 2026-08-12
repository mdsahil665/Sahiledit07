import React from 'react';
import { PromptPost, Category, AdminStats, RecentActivity } from '../../types';
import {
  Sparkles,
  Eye,
  Heart,
  Users,
  Crown,
  Share2,
  CheckCircle2,
  FileEdit,
  ArrowUpRight,
  TrendingUp,
  Clock,
  Activity,
  Database,
  ShieldCheck,
  Zap,
  PlusCircle,
  Sliders,
  DollarSign,
  Globe,
  Layers,
} from 'lucide-react';
import { AdminTab } from './AdminSidebar';

interface DashboardOverviewProps {
  posts: PromptPost[];
  categories: Category[];
  stats: AdminStats;
  activities: RecentActivity[];
  onSelectTab: (tab: AdminTab) => void;
  onOpenAddPost: () => void;
  registeredUsersCount?: number;
  premiumUsersCount?: number;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  posts,
  categories,
  stats,
  activities,
  onSelectTab,
  onOpenAddPost,
  registeredUsersCount = 1,
  premiumUsersCount = 1,
}) => {
  // Real Analytics Calculations from actual dataset
  const totalPosts = posts.length;
  const totalViews = posts.reduce((sum, p) => sum + (p.views || 0), 0);
  const totalLikes = posts.reduce((sum, p) => sum + (p.likes || 0), 0);
  const totalShares = posts.reduce((sum, p) => sum + (p.shares || 0), 0);
  const publishedPosts = posts.filter((p) => p.status === 'published').length;
  const draftPosts = posts.filter((p) => p.status === 'draft').length;

  const analyticsCards = [
    {
      title: 'Total Posts',
      value: totalPosts.toLocaleString(),
      subtitle: `${publishedPosts} Live • ${draftPosts} Drafts`,
      icon: Sparkles,
      color: 'from-blue-600 to-cyan-500',
      iconBg: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      tab: 'posts' as AdminTab,
    },
    {
      title: 'Total Views',
      value: totalViews.toLocaleString(),
      subtitle: 'Across all prompt posts',
      icon: Eye,
      color: 'from-emerald-600 to-teal-500',
      iconBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      tab: 'views' as AdminTab,
    },
    {
      title: 'Total Likes',
      value: totalLikes.toLocaleString(),
      subtitle: 'Community engagement',
      icon: Heart,
      color: 'from-rose-600 to-pink-500',
      iconBg: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
      tab: 'likes' as AdminTab,
    },
    {
      title: 'Total Users',
      value: registeredUsersCount.toLocaleString(),
      subtitle: 'Registered accounts',
      icon: Users,
      color: 'from-indigo-600 to-violet-500',
      iconBg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
      tab: 'users' as AdminTab,
    },
    {
      title: 'Premium Users',
      value: premiumUsersCount.toLocaleString(),
      subtitle: 'Lifetime subscribers',
      icon: Crown,
      color: 'from-amber-500 to-orange-500',
      iconBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      tab: 'premium' as AdminTab,
    },
    {
      title: 'Total Shares',
      value: totalShares.toLocaleString(),
      subtitle: 'Post detail shares',
      icon: Share2,
      color: 'from-sky-600 to-blue-500',
      iconBg: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
      tab: 'shares' as AdminTab,
    },
    {
      title: 'Published Posts',
      value: publishedPosts.toLocaleString(),
      subtitle: 'Publicly visible',
      icon: CheckCircle2,
      color: 'from-emerald-500 to-green-600',
      iconBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      tab: 'posts' as AdminTab,
    },
    {
      title: 'Draft Posts',
      value: draftPosts.toLocaleString(),
      subtitle: 'Work in progress',
      icon: FileEdit,
      color: 'from-zinc-500 to-zinc-700',
      iconBg: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
      tab: 'posts' as AdminTab,
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Hero Welcome Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-zinc-900 via-zinc-900/90 to-blue-950/40 border border-zinc-800 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" />
                Live Admin Dashboard
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Welcome back, Sahil 👋
            </h1>
            <p className="text-sm font-medium text-zinc-400 max-w-xl">
              Here's what's happening with Sahil Edits today. Manage your AI prompts, categories, monetization, and system status from one place.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onOpenAddPost}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-xl shadow-blue-600/20 flex items-center gap-2 transition-all cursor-pointer ring-1 ring-white/20 hover:scale-105"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create New Post</span>
            </button>
            <button
              onClick={() => onSelectTab('features')}
              className="px-4 py-3 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white font-bold text-xs border border-zinc-700/60 flex items-center gap-2 transition-all cursor-pointer"
            >
              <Sliders className="w-4 h-4 text-blue-400" />
              <span>Feature Controls</span>
            </button>
          </div>
        </div>
      </div>

      {/* 8 REAL ANALYTICS CARDS GRID */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-400" />
            <span>Real-time Library Analytics</span>
          </h2>
          <span className="text-xs font-semibold text-zinc-500">Live Firebase Sync</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {analyticsCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div
                key={idx}
                onClick={() => onSelectTab(card.tab)}
                className="group relative p-5 rounded-3xl bg-zinc-900/90 hover:bg-zinc-800/90 border border-zinc-800/90 hover:border-zinc-700 transition-all duration-200 cursor-pointer shadow-lg hover:shadow-xl hover:-translate-y-1 overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 group-hover:text-zinc-200 transition-colors">
                    {card.title}
                  </span>
                  <div className={`w-9 h-9 rounded-2xl border flex items-center justify-center ${card.iconBg}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>

                <div className="mt-3">
                  <div className="text-3xl font-black text-white tracking-tight">{card.value}</div>
                  <p className="text-[11px] font-semibold text-zinc-400 mt-1">{card.subtitle}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-[11px] text-zinc-500 group-hover:text-blue-400 font-bold transition-colors">
                  <span>Manage {card.title}</span>
                  <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Workspaces Grid & Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Core Admin Workspaces Shortcuts */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            <span>Admin Workspaces</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div
              onClick={() => onSelectTab('posts')}
              className="p-5 rounded-3xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 hover:border-blue-500/30 transition-all cursor-pointer group space-y-3"
            >
              <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center font-bold">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">
                  Post Management CMS
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Full control over your prompt posts with filters, search, edit, scheduling, and badges.
                </p>
              </div>
            </div>

            <div
              onClick={() => onSelectTab('monetization')}
              className="p-5 rounded-3xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 hover:border-emerald-500/30 transition-all cursor-pointer group space-y-3"
            >
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">
                  Monetization & Ads
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Configure Google AdSense, Monetag, PropellerAds, or custom banner placements.
                </p>
              </div>
            </div>

            <div
              onClick={() => onSelectTab('share')}
              className="p-5 rounded-3xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 hover:border-sky-500/30 transition-all cursor-pointer group space-y-3"
            >
              <div className="w-10 h-10 rounded-2xl bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center font-bold">
                <Share2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white group-hover:text-sky-400 transition-colors">
                  Post Share Controls
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Independent master toggles for post sharing buttons inside post detail view.
                </p>
              </div>
            </div>

            <div
              onClick={() => onSelectTab('footer_social')}
              className="p-5 rounded-3xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 hover:border-violet-500/30 transition-all cursor-pointer group space-y-3"
            >
              <div className="w-10 h-10 rounded-2xl bg-violet-500/10 text-violet-400 border border-violet-500/20 flex items-center justify-center font-bold">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white group-hover:text-violet-400 transition-colors">
                  Footer Social Profiles
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Manage your personal social channel links in the site footer & contact page.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activities Log */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>Recent Admin Activity</span>
            </h2>
            <button
              onClick={() => onSelectTab('activity')}
              className="text-xs font-bold text-blue-400 hover:underline"
            >
              View All
            </button>
          </div>

          <div className="p-5 rounded-3xl bg-zinc-900/90 border border-zinc-800 space-y-3 max-h-80 overflow-y-auto custom-scrollbar">
            {activities.length === 0 ? (
              <p className="text-xs text-zinc-500 text-center py-6">No recent activity recorded.</p>
            ) : (
              activities.slice(0, 6).map((act) => (
                <div
                  key={act.id}
                  className="p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{act.message}</span>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-500 uppercase font-semibold">
                    Admin: Sahil • {act.type.replace('_', ' ')}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
