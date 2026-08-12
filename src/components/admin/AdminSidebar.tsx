import React from 'react';
import {
  LayoutDashboard,
  Sparkles,
  Layers,
  Flame,
  Clock,
  TrendingUp,
  Heart,
  Share2,
  Eye,
  Star,
  MessageSquare,
  Users,
  UserCheck,
  Crown,
  DollarSign,
  Share,
  Globe,
  Mail,
  Sliders,
  FileText,
  ImageIcon,
  Search,
  Database,
  Cloud,
  ShieldCheck,
  Activity,
  Settings,
  Rocket,
  ChevronLeft,
  ChevronRight,
  X,
  PlusCircle,
  HelpCircle,
} from 'lucide-react';

export type AdminTab =
  | 'dashboard'
  | 'posts'
  | 'add_post'
  | 'categories'
  | 'trending'
  | 'latest'
  | 'popular'
  | 'likes'
  | 'shares'
  | 'views'
  | 'ratings'
  | 'comments'
  | 'users'
  | 'premium_users'
  | 'premium'
  | 'monetization'
  | 'share'
  | 'footer_social'
  | 'contact_social'
  | 'sections'
  | 'footer'
  | 'pages'
  | 'postcard'
  | 'logo'
  | 'features'
  | 'seo'
  | 'firebase'
  | 'cloudinary'
  | 'security'
  | 'activity'
  | 'settings'
  | 'deployment';

interface NavItem {
  id: AdminTab;
  label: string;
  icon: React.ElementType;
  badge?: string | number;
}

interface NavGroup {
  group: string;
  items: NavItem[];
}

interface AdminSidebarProps {
  activeTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  onOpenAddPost: () => void;
  counts?: {
    posts?: number;
    categories?: number;
    pages?: number;
    comments?: number;
    users?: number;
    notifications?: number;
  };
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeTab,
  onSelectTab,
  isCollapsed,
  onToggleCollapse,
  isOpenMobile,
  onCloseMobile,
  onOpenAddPost,
  counts = { posts: 0, categories: 0, pages: 0, comments: 0, users: 0, notifications: 0 },
}) => {
  const navGroups: NavGroup[] = [
    {
      group: 'MAIN',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      ],
    },
    {
      group: 'CONTENT',
      items: [
        { id: 'posts', label: 'Posts CMS', icon: Sparkles, badge: counts.posts },
        { id: 'categories', label: 'Categories', icon: Layers, badge: counts.categories },
        { id: 'trending', label: 'Trending Posts', icon: Flame },
        { id: 'latest', label: 'Latest Posts', icon: Clock },
        { id: 'popular', label: 'Popular Posts', icon: TrendingUp },
      ],
    },
    {
      group: 'ENGAGEMENT',
      items: [
        { id: 'likes', label: 'Likes Overview', icon: Heart },
        { id: 'shares', label: 'Shares Analytics', icon: Share2 },
        { id: 'views', label: 'Views Breakdown', icon: Eye },
        { id: 'ratings', label: 'Prompt Ratings', icon: Star },
        { id: 'comments', label: 'Comments Moderation', icon: MessageSquare, badge: counts.comments },
      ],
    },
    {
      group: 'USERS',
      items: [
        { id: 'users', label: 'User Management', icon: Users, badge: counts.users },
        { id: 'premium_users', label: 'Premium Subscribers', icon: UserCheck },
      ],
    },
    {
      group: 'MONETIZATION',
      items: [
        { id: 'premium', label: 'Subscription / Premium', icon: Crown },
        { id: 'monetization', label: 'Ads & Networks', icon: DollarSign },
      ],
    },
    {
      group: 'SOCIAL',
      items: [
        { id: 'share', label: 'Post Share Controls', icon: Share },
        { id: 'footer_social', label: 'Footer Social Links', icon: Globe },
        { id: 'contact_social', label: 'Contact Social Links', icon: Mail },
      ],
    },
    {
      group: 'WEBSITE',
      items: [
        { id: 'sections', label: 'Homepage Settings', icon: Sliders },
        { id: 'footer', label: 'Footer Settings', icon: Globe },
        { id: 'pages', label: 'Pages & Navigation', icon: FileText, badge: counts.pages },
        { id: 'postcard', label: 'Post Card Appearance', icon: Sliders },
        { id: 'logo', label: 'Logo & Branding', icon: ImageIcon },
        { id: 'features', label: 'Feature Controls', icon: Sliders },
        { id: 'seo', label: 'SEO Settings', icon: Search },
      ],
    },
    {
      group: 'SYSTEM',
      items: [
        { id: 'firebase', label: 'Firebase / Storage', icon: Database },
        { id: 'cloudinary', label: 'Cloudinary API', icon: Cloud },
        { id: 'security', label: 'Security & Auth', icon: ShieldCheck },
        { id: 'activity', label: 'Activity & Logs', icon: Activity },
        { id: 'settings', label: 'Admin Settings', icon: Settings },
        { id: 'deployment', label: 'Deployment Guide', icon: Rocket },
      ],
    },
  ];

  const handleItemClick = (id: AdminTab) => {
    if (id === 'add_post') {
      onOpenAddPost();
    } else {
      onSelectTab(id);
    }
    onCloseMobile();
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-zinc-900 border-r border-zinc-800 text-zinc-300 select-none overflow-hidden transition-all duration-300">
      {/* Brand Header */}
      <div className="p-4 border-b border-zinc-800/80 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 flex items-center justify-center text-white font-extrabold text-base shadow-lg shadow-blue-500/20 shrink-0 ring-1 ring-white/20">
            S
          </div>
          {!isCollapsed && (
            <div className="truncate">
              <h2 className="text-sm font-black text-white tracking-wide uppercase">SAHIL EDITS</h2>
              <p className="text-[10px] font-semibold text-zinc-400 truncate">SaaS Admin CMS v3.0</p>
            </div>
          )}
        </div>

        {/* Desktop Collapse Toggle */}
        <button
          onClick={onToggleCollapse}
          className="hidden lg:flex w-7 h-7 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white items-center justify-center transition-colors border border-zinc-700/50"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        {/* Mobile Close Toggle */}
        <button
          onClick={onCloseMobile}
          className="lg:hidden w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Quick Add Post Action Button */}
      <div className="p-3 shrink-0">
        <button
          onClick={() => {
            onOpenAddPost();
            onCloseMobile();
          }}
          className={`w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer ring-1 ring-white/20 ${
            isCollapsed ? 'px-0' : ''
          }`}
          title="Create New Post"
        >
          <PlusCircle className="w-4 h-4 shrink-0" />
          {!isCollapsed && <span className="truncate">Create New Post</span>}
        </button>
      </div>

      {/* Nav Groups Scrollable Area */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-4 custom-scrollbar">
        {navGroups.map((group) => (
          <div key={group.group} className="space-y-1">
            {!isCollapsed && (
              <div className="px-3 pt-2 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-zinc-500">
                {group.group}
              </div>
            )}

            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item.id)}
                  title={isCollapsed ? item.label : undefined}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer group ${
                    isActive
                      ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 shadow-sm shadow-blue-500/10 font-bold'
                      : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 border border-transparent'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-transform duration-150 group-hover:scale-110 ${
                      isActive ? 'text-blue-400' : 'text-zinc-400 group-hover:text-zinc-200'
                    }`}
                  />

                  {!isCollapsed && (
                    <span className="truncate flex-1 text-left">{item.label}</span>
                  )}

                  {!isCollapsed && item.badge !== undefined && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold shrink-0 ${
                        isActive
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          : 'bg-zinc-800 text-zinc-400 border border-zinc-700/50'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Admin Profile Footer Badge */}
      <div className="p-3 border-t border-zinc-800 bg-zinc-950/50 shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-emerald-400 flex items-center justify-center text-white font-bold text-xs ring-2 ring-zinc-800">
              S
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-zinc-900"></span>
          </div>

          {!isCollapsed && (
            <div className="truncate flex-1">
              <h4 className="text-xs font-bold text-white truncate">Sahil</h4>
              <p className="text-[10px] text-zinc-400 truncate">Super Admin</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside
        className={`hidden lg:block fixed top-0 left-0 bottom-0 z-40 transition-all duration-300 ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop & Sidebar */}
      {isOpenMobile && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Overlay Backdrop */}
          <div
            onClick={onCloseMobile}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
          />

          {/* Drawer Container */}
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
