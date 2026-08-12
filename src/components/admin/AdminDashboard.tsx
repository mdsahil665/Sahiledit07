import React, { useState, useEffect } from 'react';
import { PromptPost, Category, AdminStats, RecentActivity, CustomPage, AdNetworkId, AdNetworkConfig, AdPositions } from '../../types';
import { CategoryIcon } from '../CategoryIcon';
import { AdBanner } from '../AdBanner';
import { PremiumAdminSection } from './PremiumAdminSection';
import {
  Crown,
  Plus,
  Trash2,
  Edit,
  Copy,
  Eye,
  ShieldCheck,
  Search,
  Sparkles,
  Flame,
  Layers,
  Activity,
  Download,
  Upload,
  RefreshCw,
  X,
  CheckSquare,
  Square,
  ArrowUpRight,
  DollarSign,
  Clock,
  FileText,
  Globe,
  Lock,
  Database,
  Save,
  CheckCircle2,
  Radio,
  Sliders,
  ShieldAlert,
  Key,
  Settings,
  MessageSquare,
  Bell,
  Cloud,
  Rocket,
  BarChart3,
  Image as ImageIcon,
  Check,
  LogOut,
  Instagram,
  Facebook,
  Github,
  Youtube,
  Send,
  Loader2,
  Monitor,
  Tablet,
  Smartphone,
  Info,
  TrendingUp,
  BarChart2,
  PieChart,
  Share2,
  ArrowLeft,
  ChevronRight,
  LayoutGrid,
  AlertTriangle,
  Heart,
  Star,
  Users,
} from 'lucide-react';
import { motion } from 'motion/react';
import { promptStore } from '../../services/promptStore';
import { useToast } from '../Toast';
import { DeploymentGuide } from './DeploymentGuide';
import { FeatureControlCenter } from './FeatureControlCenter';
import { ShareSettingsControl } from './ShareSettingsControl';
import { WebsiteSectionsControl } from './WebsiteSectionsControl';
import { PostCardAppearanceControl } from './PostCardAppearanceControl';
import { LogoManager } from './LogoManager';
import { ImportPostSection } from './ImportPostSection';
import { useAuth } from '../../context/AuthContext';
import { testConnection } from '../../lib/firebase';

import { AdminSidebar, AdminTab } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { GlobalSearchModal } from './GlobalSearchModal';
import { DashboardOverview } from './DashboardOverview';
import { UserManagementSection } from './UserManagementSection';
import { SystemHealthSection } from './SystemHealthSection';
import { EngagementSection } from './EngagementSection';
import { SocialSettingsSection } from './SocialSettingsSection';

interface AdminDashboardProps {
  posts: PromptPost[];
  categories: Category[];
  stats: AdminStats;
  activities: RecentActivity[];
  onAddPost: () => void;
  onEditPost: (post: PromptPost) => void;
  onAddCategory: () => void;
  onEditCategory: (cat: Category) => void;
  onClose: () => void;
  onRefreshData: () => void;
  onOpenPreviewModal: (post: PromptPost) => void;
  onOpenPageModal: (page: CustomPage) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  posts,
  categories,
  stats,
  activities,
  onAddPost,
  onEditPost,
  onAddCategory,
  onEditCategory,
  onClose,
  onRefreshData,
  onOpenPreviewModal,
  onOpenPageModal,
}) => {
  const { logout, currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedPostIds, setSelectedPostIds] = useState<string[]>([]);
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<{
    type: 'single' | 'bulk';
    id?: string;
    title?: string;
    count?: number;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Settings State
  const [monetization, setMonetization] = useState(promptStore.getMonetization());
  const [timerSettings, setTimerSettings] = useState(promptStore.getTimerSettings());
  const [seoSettings, setSeoSettings] = useState(promptStore.getSeoSettings());
  const [securitySettings, setSecuritySettings] = useState(promptStore.getSecuritySettings());
  const [websiteSettings, setWebsiteSettings] = useState(promptStore.getWebsiteSettings());
  const [cloudinarySettings, setCloudinarySettings] = useState(promptStore.getCloudinarySettings());
  const [commentsSettings, setCommentsSettings] = useState(promptStore.getCommentsSettings());

  const { showToast } = useToast();

  useEffect(() => {
    const unsubscribe = promptStore.subscribe(() => {
      setWebsiteSettings(promptStore.getWebsiteSettings());
    });
    return unsubscribe;
  }, []);

  const comments = promptStore.getComments();
  const notifications = promptStore.getNotifications();
  const pages = promptStore.getPages();

  const handleAdminLogout = async () => {
    await logout();
    promptStore.setAdminLoggedIn(false);
    showToast('Admin Signed Out', 'Signed out from Firebase Auth session');
    onClose();
  };

  // Filtered Posts
  const filteredPosts = posts.filter((p) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      p.title.toLowerCase().includes(query) ||
      p.fullPrompt.toLowerCase().includes(query) ||
      (p.shortDescription && p.shortDescription.toLowerCase().includes(query)) ||
      (p.tags && p.tags.some((t) => t.toLowerCase().includes(query)));

    const matchesCategory = categoryFilter === 'all' || p.categoryId === categoryFilter;
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;

    if (activeTab === 'trending') return matchesSearch && matchesCategory && matchesStatus && p.trending;
    if (activeTab === 'latest') return matchesSearch && matchesCategory && matchesStatus;
    if (activeTab === 'popular') return matchesSearch && matchesCategory && matchesStatus && (p.views || 0) > 10;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleSelectAll = () => {
    if (selectedPostIds.length === filteredPosts.length) {
      setSelectedPostIds([]);
    } else {
      setSelectedPostIds(filteredPosts.map((p) => p.id));
    }
  };

  const handleToggleSelectPost = (id: string) => {
    setSelectedPostIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = () => {
    if (selectedPostIds.length === 0) return;
    setDeleteConfirmTarget({ type: 'bulk', count: selectedPostIds.length });
  };

  const handleDeletePost = (id: string, title: string) => {
    setDeleteConfirmTarget({ type: 'single', id, title });
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmTarget) return;

    setIsDeleting(true);
    try {
      if (deleteConfirmTarget.type === 'single' && deleteConfirmTarget.id) {
        await promptStore.deletePost(deleteConfirmTarget.id);
      } else if (deleteConfirmTarget.type === 'bulk') {
        await promptStore.bulkDeletePosts(selectedPostIds);
        setSelectedPostIds([]);
      }
      onRefreshData();
      showToast('Post Deleted', 'Removed from prompt library', 'success');
      setDeleteConfirmTarget(null);
    } catch (err: any) {
      console.error('Delete action failed:', err);
      showToast('Delete Failed', err.message || 'An error occurred while deleting', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDuplicatePost = (id: string) => {
    promptStore.duplicatePost(id);
    onRefreshData();
    showToast('Prompt Duplicated', 'New copy created');
  };

  const handleSaveMonetization = () => {
    promptStore.updateMonetization(monetization);
    showToast('✓ Monetization Saved', 'Updated ad configuration');
  };

  const handleSaveSeoSettings = () => {
    promptStore.updateSeoSettings(seoSettings);
    showToast('✓ SEO Settings Saved', 'Meta tags and robots.txt updated');
  };

  const handleSaveWebsiteSettings = () => {
    promptStore.updateWebsiteSettings(websiteSettings);
    promptStore.updateCloudinarySettings(cloudinarySettings);
    showToast('✓ Website Settings Saved', 'Branding & custom settings updated');
  };

  // Title for active tab
  const getTabMeta = (tab: AdminTab) => {
    switch (tab) {
      case 'dashboard':
        return { title: 'Dashboard Overview', group: 'Main' };
      case 'posts':
        return { title: 'Posts Management CMS', group: 'Content' };
      case 'categories':
        return { title: 'Categories Manager', group: 'Content' };
      case 'trending':
        return { title: 'Trending Posts', group: 'Content' };
      case 'latest':
        return { title: 'Latest Posts', group: 'Content' };
      case 'popular':
        return { title: 'Popular Posts', group: 'Content' };
      case 'likes':
        return { title: 'Likes Overview', group: 'Engagement' };
      case 'shares':
        return { title: 'Shares Analytics', group: 'Engagement' };
      case 'views':
        return { title: 'Views Breakdown', group: 'Engagement' };
      case 'ratings':
        return { title: 'Prompt Ratings', group: 'Engagement' };
      case 'comments':
        return { title: 'Comments Moderation', group: 'Engagement' };
      case 'users':
        return { title: 'User Management', group: 'Users' };
      case 'premium_users':
        return { title: 'Premium Subscribers', group: 'Users' };
      case 'premium':
        return { title: 'Subscription / Premium', group: 'Monetization' };
      case 'monetization':
        return { title: 'Ads & Monetization', group: 'Monetization' };
      case 'share':
        return { title: 'Post Share Controls', group: 'Social' };
      case 'footer_social':
        return { title: 'Footer Social Links', group: 'Social' };
      case 'contact_social':
        return { title: 'Contact Social Links', group: 'Social' };
      case 'sections':
        return { title: 'Homepage Settings', group: 'Website' };
      case 'pages':
        return { title: 'Pages & Navigation', group: 'Website' };
      case 'postcard':
        return { title: 'Post Card Appearance', group: 'Website' };
      case 'logo':
        return { title: 'Logo & Branding', group: 'Website' };
      case 'features':
        return { title: 'Feature Controls', group: 'Website' };
      case 'seo':
        return { title: 'SEO Settings', group: 'Website' };
      case 'firebase':
        return { title: 'Firebase & Cloud Storage', group: 'System' };
      case 'cloudinary':
        return { title: 'Cloudinary Media API', group: 'System' };
      case 'security':
        return { title: 'Security & Auth', group: 'System' };
      case 'activity':
        return { title: 'Activity Logs', group: 'System' };
      case 'settings':
        return { title: 'Admin Settings', group: 'System' };
      case 'deployment':
        return { title: 'Deployment Guide', group: 'System' };
      default:
        return { title: 'Admin Workspace', group: 'Management' };
    }
  };

  const currentMeta = getTabMeta(activeTab);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col lg:flex-row antialiased selection:bg-blue-500 selection:text-white">
      {/* Sidebar Navigation */}
      <AdminSidebar
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        onOpenAddPost={onAddPost}
        counts={{
          posts: posts.length,
          categories: categories.length,
          pages: pages.length,
          comments: comments.length,
          notifications: notifications.length,
        }}
      />

      {/* Main Workspace Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        {/* Top Header Bar */}
        <AdminHeader
          activeTabTitle={currentMeta.title}
          categoryGroup={currentMeta.group}
          onOpenMobileMenu={() => setIsMobileSidebarOpen(true)}
          onOpenGlobalSearch={() => setIsGlobalSearchOpen(true)}
          notifications={notifications}
          onLogout={handleAdminLogout}
          onExit={onClose}
          isFirebaseConnected={true}
        />

        {/* Workspace Body Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {/* DASHBOARD OVERVIEW */}
          {activeTab === 'dashboard' && (
            <DashboardOverview
              posts={posts}
              categories={categories}
              stats={stats}
              activities={activities}
              onSelectTab={(tab) => setActiveTab(tab)}
              onOpenAddPost={onAddPost}
            />
          )}

          {/* POSTS MANAGEMENT CMS */}
          {(activeTab === 'posts' || activeTab === 'trending' || activeTab === 'latest' || activeTab === 'popular') && (
            <div className="space-y-6 animate-fade-in pb-12">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
                <div>
                  <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-blue-400" />
                    <span>Prompt Posts Management</span>
                  </h2>
                  <p className="text-xs text-zinc-400 mt-1">
                    Search, filter, preview, publish, feature, or delete posts from your prompt library.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {selectedPostIds.length > 0 && (
                    <button
                      onClick={handleBulkDelete}
                      className="px-4 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/20 flex items-center gap-2 transition-all cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete Selected ({selectedPostIds.length})</span>
                    </button>
                  )}

                  <button
                    onClick={onAddPost}
                    className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-xl shadow-blue-600/20 flex items-center gap-2 transition-all cursor-pointer ring-1 ring-white/20"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create New Post</span>
                  </button>
                </div>
              </div>

              {/* Filters Toolbar */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900/90 p-4 rounded-3xl border border-zinc-800">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search posts by title, prompt, description, tags..."
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl pl-10 pr-4 py-2 text-xs font-semibold text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center gap-3 overflow-x-auto pb-1 sm:pb-0">
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="bg-zinc-950 border border-zinc-800 rounded-2xl px-3.5 py-2 text-xs font-semibold text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="all">All Categories</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-zinc-950 border border-zinc-800 rounded-2xl px-3.5 py-2 text-xs font-semibold text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="all">All Status</option>
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                    <option value="scheduled">Scheduled</option>
                  </select>
                </div>
              </div>

              {/* Post List Table */}
              <div className="bg-zinc-900/90 rounded-3xl border border-zinc-800 shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-zinc-950/80 border-b border-zinc-800 text-[11px] font-extrabold text-zinc-400 uppercase tracking-wider">
                        <th className="p-4 pl-6 w-10">
                          <input
                            type="checkbox"
                            checked={selectedPostIds.length > 0 && selectedPostIds.length === filteredPosts.length}
                            onChange={handleSelectAll}
                            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                          />
                        </th>
                        <th className="p-4">Prompt Post</th>
                        <th className="p-4">Category</th>
                        <th className="p-4">Status</th>
                        <th className="p-4">Views / Likes</th>
                        <th className="p-4 pr-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60 text-xs font-medium">
                      {filteredPosts.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-zinc-500">
                            No prompt posts match your filters.
                          </td>
                        </tr>
                      ) : (
                        filteredPosts.map((post) => {
                          const isSelected = selectedPostIds.includes(post.id);
                          const isPublished = post.status === 'published';

                          return (
                            <tr key={post.id} className="hover:bg-zinc-800/40 transition-colors">
                              <td className="p-4 pl-6">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => handleToggleSelectPost(post.id)}
                                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                                />
                              </td>

                              <td className="p-4">
                                <div className="flex items-center gap-3">
                                  <img
                                    src={post.imageUrl}
                                    alt={post.title}
                                    className="w-12 h-12 rounded-xl object-cover shrink-0 border border-zinc-800"
                                  />
                                  <div className="truncate max-w-xs sm:max-w-md">
                                    <h4 className="font-bold text-white truncate hover:text-blue-400 transition-colors cursor-pointer" onClick={() => onEditPost(post)}>
                                      {post.title}
                                    </h4>
                                    <p className="text-[11px] text-zinc-400 truncate mt-0.5">{post.shortDescription || post.fullPrompt}</p>
                                  </div>
                                </div>
                              </td>

                              <td className="p-4">
                                <span className="px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-300 text-[10px] font-bold border border-zinc-700/50">
                                  {post.categoryId}
                                </span>
                              </td>

                              <td className="p-4">
                                <span
                                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                                    isPublished
                                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                      : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                  }`}
                                >
                                  {post.status || 'published'}
                                </span>
                              </td>

                              <td className="p-4 text-zinc-400">
                                <div className="flex items-center gap-3">
                                  <span className="flex items-center gap-1 text-zinc-300">
                                    <Eye className="w-3.5 h-3.5 text-zinc-500" />
                                    {post.views || 0}
                                  </span>
                                  <span className="flex items-center gap-1 text-rose-400">
                                    <Heart className="w-3.5 h-3.5" />
                                    {post.likes || 0}
                                  </span>
                                </div>
                              </td>

                              <td className="p-4 pr-6 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => onOpenPreviewModal(post)}
                                    className="p-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                                    title="Preview Post"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>

                                  <button
                                    onClick={() => onEditPost(post)}
                                    className="p-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 transition-colors cursor-pointer"
                                    title="Edit Post"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>

                                  <button
                                    onClick={() => handleDuplicatePost(post.id)}
                                    className="p-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                                    title="Duplicate Prompt"
                                  >
                                    <Copy className="w-4 h-4" />
                                  </button>

                                  <button
                                    onClick={() => handleDeletePost(post.id, post.title)}
                                    className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 transition-colors cursor-pointer"
                                    title="Delete Post"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* USERS MANAGEMENT */}
          {(activeTab === 'users' || activeTab === 'premium_users') && <UserManagementSection />}

          {/* ENGAGEMENT SECTIONS */}
          {activeTab === 'likes' && <EngagementSection type="likes" posts={posts} onEditPost={onEditPost} />}
          {activeTab === 'shares' && <EngagementSection type="shares" posts={posts} onEditPost={onEditPost} />}
          {activeTab === 'views' && <EngagementSection type="views" posts={posts} onEditPost={onEditPost} />}
          {activeTab === 'ratings' && <EngagementSection type="ratings" posts={posts} onEditPost={onEditPost} />}

          {/* SOCIAL MEDIA SETTINGS */}
          {(activeTab === 'share' || activeTab === 'footer_social' || activeTab === 'contact_social') && (
            <SocialSettingsSection type={activeTab} />
          )}

          {/* SYSTEM HEALTH & FIREBASE */}
          {activeTab === 'firebase' && <SystemHealthSection />}

          {/* SUBSCRIPTION & PREMIUM */}
          {activeTab === 'premium' && <PremiumAdminSection />}

          {/* CATEGORIES MANAGEMENT */}
          {activeTab === 'categories' && (
            <div className="space-y-6 animate-fade-in pb-12">
              <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
                <div>
                  <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                    <Layers className="w-5 h-5 text-indigo-400" />
                    <span>Categories Manager</span>
                  </h2>
                  <p className="text-xs text-zinc-400 mt-1">Organize your prompt library with custom categories and icons.</p>
                </div>

                <button
                  onClick={onAddCategory}
                  className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/20 flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Category</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map((cat) => {
                  const catPostsCount = posts.filter((p) => p.categoryId === cat.id).length;
                  return (
                    <div
                      key={cat.id}
                      className="p-5 rounded-3xl bg-zinc-900 border border-zinc-800 flex items-center justify-between space-y-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-sm border border-indigo-500/20">
                          {cat.name[0]}
                        </div>
                        <div>
                          <h4 className="font-bold text-white text-sm">{cat.name}</h4>
                          <p className="text-xs text-zinc-400">{catPostsCount} Prompts</p>
                        </div>
                      </div>

                      <button
                        onClick={() => onEditCategory(cat)}
                        className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                        title="Edit Category"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* OTHER ADMIN SECTIONS */}
          {activeTab === 'sections' && <WebsiteSectionsControl />}
          {activeTab === 'postcard' && <PostCardAppearanceControl />}
          {activeTab === 'logo' && <LogoManager />}
          {activeTab === 'features' && <FeatureControlCenter />}
          {activeTab === 'deployment' && <DeploymentGuide />}
        </main>
      </div>

      {/* Global Search Modal */}
      <GlobalSearchModal
        isOpen={isGlobalSearchOpen}
        onClose={() => setIsGlobalSearchOpen(false)}
        posts={posts}
        categories={categories}
        pages={pages}
        onSelectTab={(tab) => setActiveTab(tab)}
        onEditPost={onEditPost}
      />

      {/* Delete Post Confirmation Modal */}
      {deleteConfirmTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-zinc-900 border border-zinc-800 p-6 space-y-5 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-extrabold text-white">
                {deleteConfirmTarget.type === 'bulk'
                  ? `Delete ${deleteConfirmTarget.count} Selected Posts?`
                  : `Delete "${deleteConfirmTarget.title}"?`}
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                This action cannot be undone. The prompt post(s) will be permanently deleted from your Firebase Firestore database.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmTarget(null)}
                className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/20 transition-all cursor-pointer flex items-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Confirm Delete</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
