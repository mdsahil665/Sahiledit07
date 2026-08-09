import React, { useState } from 'react';
import { PromptPost, Category, AdminStats, RecentActivity, CustomPage, AdNetworkId, AdNetworkConfig, AdPositions } from '../../types';
import { CategoryIcon } from '../CategoryIcon';
import { AdBanner } from '../AdBanner';
import {
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
  const [activeTab, setActiveTab] = useState<
    | 'dashboard'
    | 'posts'
    | 'postcard'
    | 'categories'
    | 'monetization'
    | 'timer'
    | 'pages'
    | 'seo'
    | 'social'
    | 'security'
    | 'settings'
    | 'share'
    | 'sections'
    | 'features'
    | 'cloudinary'
    | 'logo'
    | 'firebase'
    | 'comments'
    | 'deployment'
    | 'activity'
  >('dashboard');

  const [featureCategoryFilter, setFeatureCategoryFilter] = useState<string>('all');
  const [featureSearchQuery, setFeatureSearchQuery] = useState<string>('');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const handleAdminLogout = async () => {
    await logout();
    promptStore.setAdminLoggedIn(false);
    showToast('Admin Signed Out', 'Signed out from Firebase Auth session');
    onClose();
  };

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

  // State for Settings
  const [monetization, setMonetization] = useState(promptStore.getMonetization());
  const [monetizationSubTab, setMonetizationSubTab] = useState<'networks' | 'earnings' | 'placements' | 'frequency'>('networks');
  const [selectedNetworkId, setSelectedNetworkId] = useState<AdNetworkId>(monetization.activeNetwork || 'adsense');
  const [previewingPosition, setPreviewingPosition] = useState<keyof AdPositions | null>(null);
  const [previewViewport, setPreviewViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [showDemoMetrics, setShowDemoMetrics] = useState(false);

  const handleSelectNetwork = (netId: AdNetworkId) => {
    setSelectedNetworkId(netId);
    
    // Automatically set active network and enable it, disabling all previous ones
    const currentNetworks = monetization.networks || {};
    const updatedNetworks: Record<string, AdNetworkConfig> = {};

    ['adsense', 'monetag', 'propeller', 'adsterra', 'medianet', 'custom'].forEach((key) => {
      const existing = currentNetworks[key as AdNetworkId] || {
        id: key as AdNetworkId,
        name: key,
        publisherId: '',
        scriptCode: '',
        enabled: false,
      };

      updatedNetworks[key] = {
        ...existing,
        enabled: key === netId,
      };
    });

    const activeConfig = updatedNetworks[netId];
    setMonetization({
      ...monetization,
      activeNetwork: netId,
      publisherId: activeConfig?.publisherId || monetization.publisherId,
      networks: updatedNetworks as Record<AdNetworkId, AdNetworkConfig>,
    });
  };

  const handleUpdateNetworkConfig = (netId: AdNetworkId, field: 'publisherId' | 'scriptCode' | 'enabled', value: any) => {
    const currentNetworks = monetization.networks || {};
    const targetNet = currentNetworks[netId] || {
      id: netId,
      name: netId,
      publisherId: '',
      scriptCode: '',
      enabled: netId === monetization.activeNetwork,
    };

    const updatedNet = { ...targetNet, [field]: value };
    const updatedNetworks = { ...currentNetworks, [netId]: updatedNet };

    setMonetization({
      ...monetization,
      networks: updatedNetworks as Record<AdNetworkId, AdNetworkConfig>,
      publisherId: netId === monetization.activeNetwork && field === 'publisherId' ? value : monetization.publisherId,
    });
  };

  const [timerSettings, setTimerSettings] = useState(promptStore.getTimerSettings());
  const [seoSettings, setSeoSettings] = useState(promptStore.getSeoSettings());
  const [securitySettings, setSecuritySettings] = useState(promptStore.getSecuritySettings());

  const [websiteSettings, setWebsiteSettings] = useState(promptStore.getWebsiteSettings());
  const [cloudinarySettings, setCloudinarySettings] = useState(promptStore.getCloudinarySettings());
  const [commentsSettings, setCommentsSettings] = useState(promptStore.getCommentsSettings());
  const [featureControls, setFeatureControls] = useState(promptStore.getFeatureControls());

  React.useEffect(() => {
    const unsubscribe = promptStore.subscribe(() => {
      setFeatureControls(promptStore.getFeatureControls());
      setWebsiteSettings(promptStore.getWebsiteSettings());
    });
    return unsubscribe;
  }, []);

  const comments = promptStore.getComments();
  const notifications = promptStore.getNotifications();

  // State for Page Builder Modal
  const [editingPage, setEditingPage] = useState<CustomPage | null>(null);
  const [isPageModalOpen, setIsPageModalOpen] = useState(false);
  const [pageFormTitle, setPageFormTitle] = useState('');
  const [pageFormSlug, setPageFormSlug] = useState('');
  const [pageFormContent, setPageFormContent] = useState('');
  const [pageFormSeoTitle, setPageFormSeoTitle] = useState('');
  const [pageFormMetaDesc, setPageFormMetaDesc] = useState('');
  const [pageFormFeaturedImg, setPageFormFeaturedImg] = useState('');
  const [pageFormStatus, setPageFormStatus] = useState<'published' | 'draft'>('published');

  const { showToast } = useToast();

  const pages = promptStore.getPages();

  // Filtered Posts for Table
  const filteredPosts = posts.filter((p) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      p.title.toLowerCase().includes(query) ||
      p.fullPrompt.toLowerCase().includes(query) ||
      (p.shortDescription && p.shortDescription.toLowerCase().includes(query)) ||
      (p.tags && p.tags.some((t) => t.toLowerCase().includes(query)));

    const matchesCategory = categoryFilter === 'all' || p.categoryId === categoryFilter;
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;

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
      showToast('Post deleted successfully.', '', 'success');
      setDeleteConfirmTarget(null);
    } catch (err: any) {
      console.error('Delete action failed:', err);
      showToast('Delete Failed', err.message || 'An error occurred while deleting the post.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDuplicatePost = (id: string) => {
    promptStore.duplicatePost(id);
    onRefreshData();
    showToast('Prompt Duplicated', 'New copy created');
  };

  const currentFeaturedPost = posts.find((p) => p.featured === true);
  const currentTrendingPost = posts.find((p) => p.trending === true);

  const handleSetFeatured = async (post: PromptPost) => {
    if (currentFeaturedPost && currentFeaturedPost.id !== post.id) {
      const confirm = window.confirm(
        `Replace the current Featured Post ("${currentFeaturedPost.title}") with "${post.title}"?`
      );
      if (!confirm) return;
    }
    await promptStore.setFeaturedPost(post.id);
    onRefreshData();
    showToast('✓ Featured Post Updated', `"${post.title}" is now the Featured Post.`);
  };

  const handleRemoveFeatured = async (post: PromptPost) => {
    await promptStore.removeFeaturedPost(post.id);
    onRefreshData();
    showToast('✓ Featured Status Removed', `"${post.title}" is no longer featured.`);
  };

  const handleSetTrending = async (post: PromptPost) => {
    if (currentTrendingPost && currentTrendingPost.id !== post.id) {
      const confirm = window.confirm(
        `Replace the current Trending Post ("${currentTrendingPost.title}") with "${post.title}"?`
      );
      if (!confirm) return;
    }
    await promptStore.setTrendingPost(post.id);
    onRefreshData();
    showToast('✓ Trending Post Updated', `"${post.title}" is now the Trending Post.`);
  };

  const handleRemoveTrending = async (post: PromptPost) => {
    await promptStore.removeTrendingPost(post.id);
    onRefreshData();
    showToast('✓ Trending Status Removed', `"${post.title}" is no longer trending.`);
  };

  const handleDeleteCategory = (id: string, name: string) => {
    if (window.confirm(`Delete category "${name}"? Posts in this category will remain.`)) {
      promptStore.deleteCategory(id);
      onRefreshData();
      showToast('Category Deleted', name);
    }
  };

  const handleSaveMonetization = () => {
    promptStore.updateMonetization(monetization);
    showToast('✓ Monetization Saved', 'Google AdSense configuration updated');
  };

  const handleSaveTimerSettings = () => {
    promptStore.updateTimerSettings(timerSettings);
    showToast('✓ Timer Settings Saved', `Default lock set to ${timerSettings.defaultSeconds}s`);
  };

  const handleSaveSeoSettings = () => {
    promptStore.updateSeoSettings(seoSettings);
    showToast('✓ SEO Settings Saved', 'Meta tags and robots.txt updated');
  };

  const handleSaveWebsiteSettings = () => {
    promptStore.updateWebsiteSettings(websiteSettings);
    promptStore.updateCloudinarySettings(cloudinarySettings);
    showToast('✓ Website Settings Saved', 'Logo, branding, Cloudinary & custom code updated');
  };

  const handleSaveCommentsSettings = () => {
    promptStore.updateCommentsSettings(commentsSettings);
    showToast('✓ Comments Settings Saved', 'Moderation preferences updated');
  };

  const handleApproveComment = (id: string) => {
    promptStore.updateCommentStatus(id, 'approved');
    onRefreshData();
    showToast('Comment Approved', 'Published to prompt details page');
  };

  const handleDeleteComment = (id: string) => {
    promptStore.deleteComment(id);
    onRefreshData();
    showToast('Comment Deleted', 'Removed from database');
  };

  const handleClearNotifications = () => {
    promptStore.clearNotifications();
    onRefreshData();
    showToast('Notifications Cleared', 'All alerts removed');
  };

  const handleSaveSecuritySettings = () => {
    promptStore.updateSecuritySettings(securitySettings);
    showToast('✓ Security Settings Saved', 'Session timeout & auth rules updated');
  };

  // Custom Page Builder Handlers
  const handleOpenNewPageModal = () => {
    setEditingPage(null);
    setPageFormTitle('');
    setPageFormSlug('');
    setPageFormContent('');
    setPageFormSeoTitle('');
    setPageFormMetaDesc('');
    setPageFormFeaturedImg('');
    setPageFormStatus('published');
    setIsPageModalOpen(true);
  };

  const handleEditPage = (page: CustomPage) => {
    setEditingPage(page);
    setPageFormTitle(page.title);
    setPageFormSlug(page.slug);
    setPageFormContent(page.content);
    setPageFormSeoTitle(page.seoTitle || '');
    setPageFormMetaDesc(page.metaDescription || '');
    setPageFormFeaturedImg(page.featuredImage || '');
    setPageFormStatus(page.status);
    setIsPageModalOpen(true);
  };

  const handleSavePageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pageFormTitle.trim()) {
      showToast('Title Required', 'Please enter a page title', 'error');
      return;
    }

    if (editingPage) {
      promptStore.updatePage(editingPage.id, {
        title: pageFormTitle,
        slug: pageFormSlug,
        content: pageFormContent,
        seoTitle: pageFormSeoTitle,
        metaDescription: pageFormMetaDesc,
        featuredImage: pageFormFeaturedImg,
        status: pageFormStatus,
      });
      showToast('✓ Page Updated', pageFormTitle);
    } else {
      promptStore.addPage({
        title: pageFormTitle,
        slug: pageFormSlug,
        content: pageFormContent,
        seoTitle: pageFormSeoTitle,
        metaDescription: pageFormMetaDesc,
        featuredImage: pageFormFeaturedImg,
        status: pageFormStatus,
      });
      showToast('✓ Page Created', pageFormTitle);
    }

    setIsPageModalOpen(false);
    onRefreshData();
  };

  const handleDeletePage = (id: string, title: string) => {
    if (window.confirm(`Delete page "${title}"?`)) {
      promptStore.deletePage(id);
      onRefreshData();
      showToast('Page Deleted', title);
    }
  };

  // Backup System Handlers
  const handleExportBackup = () => {
    const jsonStr = promptStore.exportBackupJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sahil-edits-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('✓ Backup Exported', 'JSON file downloaded to your device');
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      if (content) {
        if (window.confirm('Restore database from backup file? Existing data will be replaced.')) {
          const res = await promptStore.importBackupJson(content);
          if (res.success) {
            onRefreshData();
            showToast('✓ Backup Restored', res.message);
          } else {
            showToast('Backup Error', res.message, 'error');
          }
        }
      }
    };
    reader.readAsText(file);
  };

  const handleResetDefaults = () => {
    if (window.confirm('Reset all data to default seed library? Custom edits will be restored.')) {
      promptStore.resetToDefault();
      onRefreshData();
      showToast('Data Restored', 'Library reset to defaults');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Top Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-blue-500/20 ring-2 ring-blue-500/30">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-white">Sahil Edits Dashboard</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30">
                Live Admin
              </span>
            </div>
            <p className="text-xs text-zinc-400">Manage prompts, categories, monetization, pages, SEO & backup</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleAdminLogout}
            className="px-4 py-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs font-bold text-rose-400 hover:bg-rose-500/20 transition-colors flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-bold text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            Exit to Website
          </button>
        </div>
      </div>

      {/* OVERVIEW STATS GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-zinc-900/90 border border-zinc-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Total Prompts</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white">{stats.totalPosts}</div>
          <p className="text-[11px] text-zinc-500">{stats.draftCount} Drafts • {stats.scheduledCount} Scheduled</p>
        </div>

        <div className="p-5 rounded-3xl bg-zinc-900/90 border border-zinc-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Categories</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white">{stats.totalCategories}</div>
          <p className="text-[11px] text-zinc-500">Unlimited admin creation</p>
        </div>

        <div className="p-5 rounded-3xl bg-zinc-900/90 border border-zinc-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Total Views</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Eye className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white">{stats.totalViews.toLocaleString()}</div>
          <p className="text-[11px] text-zinc-500">Across all prompt posts</p>
        </div>

        <div className="p-5 rounded-3xl bg-zinc-900/90 border border-zinc-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Total Copies</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Copy className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white">{stats.totalCopies.toLocaleString()}</div>
          <p className="text-[11px] text-zinc-500">1-Click instant copy actions</p>
        </div>
      </div>

      {/* SECTION METADATA LIST FOR MODULAR CARDS */}
      {(() => {
        const adminSectionsMeta: Array<{
          key: typeof activeTab;
          title: string;
          category: 'Content' | 'Appearance' | 'Monetization' | 'Settings & Social' | 'System & Security';
          description: string;
          icon: any;
          iconBg: string;
          iconColor: string;
          badge?: string;
        }> = [
          {
            key: 'posts',
            title: 'Prompts Management',
            category: 'Content',
            description: 'View, search, edit, feature, schedule, or delete prompt library posts.',
            icon: Sparkles,
            iconBg: 'bg-blue-500/10 border-blue-500/20',
            iconColor: 'text-blue-400',
            badge: `${stats.totalPosts} Prompts`,
          },
          {
            key: 'categories',
            title: 'Categories Manager',
            category: 'Content',
            description: 'Add, edit, reorder prompt categories and customize SVG icons.',
            icon: Layers,
            iconBg: 'bg-indigo-500/10 border-indigo-500/20',
            iconColor: 'text-indigo-400',
            badge: `${stats.totalCategories} Categories`,
          },
          {
            key: 'pages',
            title: 'Pages Builder',
            category: 'Content',
            description: 'Create and publish custom static pages (Privacy, Terms, About, SEO pages).',
            icon: FileText,
            iconBg: 'bg-violet-500/10 border-violet-500/20',
            iconColor: 'text-violet-400',
            badge: `${pages.length} Pages`,
          },
          {
            key: 'comments',
            title: 'Comments Moderation',
            category: 'Content',
            description: 'Review user comments, approve, moderate or delete comments across prompts.',
            icon: MessageSquare,
            iconBg: 'bg-pink-500/10 border-pink-500/20',
            iconColor: 'text-pink-400',
            badge: `${comments.length} Comments`,
          },
          {
            key: 'postcard',
            title: 'Post Card Appearance',
            category: 'Appearance',
            description: 'Customize card layout, border colors, tags display, copy button & view count.',
            icon: Sliders,
            iconBg: 'bg-cyan-500/10 border-cyan-500/20',
            iconColor: 'text-cyan-400',
            badge: 'Card Customizer',
          },
          {
            key: 'logo',
            title: 'Logo & Branding',
            category: 'Appearance',
            description: 'Upload custom header logos, dark/light variations, favicons and branding.',
            icon: ImageIcon,
            iconBg: 'bg-purple-500/10 border-purple-500/20',
            iconColor: 'text-purple-400',
            badge: 'Brand Assets',
          },
          {
            key: 'sections',
            title: 'Website Sections',
            category: 'Appearance',
            description: 'Enable, disable or reorder Homepage sections (Hero, Trending, Ad Banners).',
            icon: Layers,
            iconBg: 'bg-emerald-500/10 border-emerald-500/20',
            iconColor: 'text-emerald-400',
            badge: 'Homepage Layout',
          },
          {
            key: 'settings',
            title: 'Website Settings',
            category: 'Settings & Social',
            description: 'Site name, tagline, header text, contact email, notice banner messages.',
            icon: Settings,
            iconBg: 'bg-rose-500/10 border-rose-500/20',
            iconColor: 'text-rose-400',
            badge: 'Global Config',
          },
          {
            key: 'social',
            title: 'Social Profile Links',
            category: 'Settings & Social',
            description: 'Manage profile links for YouTube, Instagram, Facebook, Telegram, WhatsApp, Twitter/X.',
            icon: Globe,
            iconBg: 'bg-emerald-500/10 border-emerald-500/20',
            iconColor: 'text-emerald-400',
            badge: 'Social Channels',
          },
          {
            key: 'share',
            title: 'Share Buttons Control',
            category: 'Settings & Social',
            description: 'Master switches to enable or disable social sharing buttons in prompt modals.',
            icon: Share2,
            iconBg: 'bg-blue-500/10 border-blue-500/20',
            iconColor: 'text-blue-400',
            badge: 'Share Modal',
          },
          {
            key: 'features',
            title: 'Feature Control Center',
            category: 'Settings & Social',
            description: 'Enable or disable core site features (Likes, Comments, Search, Login Wall, Copy Button).',
            icon: Sliders,
            iconBg: 'bg-sky-500/10 border-sky-500/20',
            iconColor: 'text-sky-400',
            badge: 'Feature Toggles',
          },
          {
            key: 'monetization',
            title: 'Monetization & Ad Networks',
            category: 'Monetization',
            description: 'AdSense, Monetag, PropellerAds, Adsterra, Media.net or Custom Ads & placements.',
            icon: DollarSign,
            iconBg: 'bg-emerald-500/10 border-emerald-500/20',
            iconColor: 'text-emerald-400',
            badge: monetization.activeNetwork ? monetization.activeNetwork.toUpperCase() : 'Ads Active',
          },
          {
            key: 'timer',
            title: 'Countdown Timer',
            category: 'Monetization',
            description: 'Set prompt copy unlock timer, delay duration and countdown lock messages.',
            icon: Clock,
            iconBg: 'bg-amber-500/10 border-amber-500/20',
            iconColor: 'text-amber-400',
            badge: `${timerSettings.timerDuration || 0}s Delay`,
          },
          {
            key: 'firebase',
            title: 'Firebase & Firestore',
            category: 'System & Security',
            description: 'Firestore cloud sync, database connection testing, project ID & rules.',
            icon: Database,
            iconBg: 'bg-amber-500/10 border-amber-500/20',
            iconColor: 'text-amber-400',
            badge: 'Cloud Sync',
          },
          {
            key: 'cloudinary',
            title: 'Cloudinary Storage',
            category: 'System & Security',
            description: 'Cloudinary cloud name, upload preset and image upload API credentials.',
            icon: Cloud,
            iconBg: 'bg-cyan-500/10 border-cyan-500/20',
            iconColor: 'text-cyan-400',
            badge: 'Media Storage',
          },
          {
            key: 'seo',
            title: 'SEO & Meta Tags',
            category: 'Settings & Social',
            description: 'Meta title, meta description, keywords, OpenGraph images & structured schema.',
            icon: Globe,
            iconBg: 'bg-indigo-500/10 border-indigo-500/20',
            iconColor: 'text-indigo-400',
            badge: 'SEO Meta',
          },
          {
            key: 'security',
            title: 'Security & Passcode',
            category: 'System & Security',
            description: 'Update admin login passcode, session locks, and access security settings.',
            icon: Lock,
            iconBg: 'bg-red-500/10 border-red-500/20',
            iconColor: 'text-red-400',
            badge: 'Protected',
          },
          {
            key: 'deployment',
            title: 'Deployment Guide',
            category: 'System & Security',
            description: 'Step-by-step production setup guide for Cloud Run, Vercel, Firebase & GitHub.',
            icon: Rocket,
            iconBg: 'bg-fuchsia-500/10 border-fuchsia-500/20',
            iconColor: 'text-fuchsia-400',
            badge: 'Production Guide',
          },
          {
            key: 'activity',
            title: 'Activity & Audit Logs',
            category: 'System & Security',
            description: 'Track recent admin actions, system updates, prompt additions and audit history.',
            icon: Activity,
            iconBg: 'bg-teal-500/10 border-teal-500/20',
            iconColor: 'text-teal-400',
            badge: `${activities.length} Logs`,
          },
        ];

        return (
          <>
            {/* MAIN DASHBOARD FEATURE CARDS GRID VIEW */}
            {activeTab === 'dashboard' && (
              <div className="space-y-8">
                {/* Quick Action Toolbar & Backup controls */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-3xl bg-zinc-900/80 border border-zinc-800">
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={onAddPost}
                      className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-500/25 flex items-center gap-2 transition-all cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>+ Add Prompt</span>
                    </button>

                    <button
                      onClick={() => setIsImportModalOpen(true)}
                      className="px-4 py-2.5 rounded-2xl bg-zinc-950 border border-zinc-800 text-white font-bold text-xs hover:border-purple-500/40 flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <Globe className="w-4 h-4 text-purple-400" />
                      <span>Import Post from URL</span>
                    </button>

                    <button
                      onClick={handleOpenNewPageModal}
                      className="px-4 py-2.5 rounded-2xl bg-zinc-950 border border-zinc-800 text-white font-bold text-xs hover:border-blue-500/40 flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <Plus className="w-4 h-4 text-emerald-400" />
                      <span>+ Add Page</span>
                    </button>

                    <button
                      onClick={onAddCategory}
                      className="px-4 py-2.5 rounded-2xl bg-zinc-950 border border-zinc-800 text-white font-bold text-xs hover:border-indigo-500/40 flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <Plus className="w-4 h-4 text-indigo-400" />
                      <span>+ Add Category</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={handleExportBackup}
                      className="px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-blue-400" />
                      <span>Export Backup</span>
                    </button>

                    <label className="px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer">
                      <Upload className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Import Backup</span>
                      <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
                    </label>

                    <button
                      onClick={handleResetDefaults}
                      title="Reset default data"
                      className="p-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Section Filter & Search Header */}
                <div className="space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                        <LayoutGrid className="w-5 h-5 text-blue-400" />
                        <span>Admin Control Panel Sections</span>
                      </h2>
                      <p className="text-xs text-zinc-400 mt-1">
                        Click any section below to open its full-screen management interface.
                      </p>
                    </div>

                    {/* Search Bar for Sections */}
                    <div className="relative w-full md:w-72">
                      <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search admin sections..."
                        value={featureSearchQuery}
                        onChange={(e) => setFeatureSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500/60 transition-all"
                      />
                    </div>
                  </div>

                  {/* Category Filter Pills */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                    {['all', 'Content', 'Appearance', 'Monetization', 'Settings & Social', 'System & Security'].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setFeatureCategoryFilter(cat)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                          featureCategoryFilter === cat
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                            : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800'
                        }`}
                      >
                        {cat === 'all' ? 'All Sections (19)' : cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* FEATURE CARDS GRID */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                  {adminSectionsMeta
                    .filter((sec) => {
                      const matchesCat = featureCategoryFilter === 'all' || sec.category === featureCategoryFilter;
                      const matchesQuery =
                        !featureSearchQuery ||
                        sec.title.toLowerCase().includes(featureSearchQuery.toLowerCase()) ||
                        sec.description.toLowerCase().includes(featureSearchQuery.toLowerCase()) ||
                        sec.category.toLowerCase().includes(featureSearchQuery.toLowerCase());
                      return matchesCat && matchesQuery;
                    })
                    .map((sec) => {
                      const IconComponent = sec.icon;
                      return (
                        <motion.div
                          key={sec.key}
                          whileHover={{ y: -3 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setActiveTab(sec.key)}
                          className="p-5 rounded-3xl bg-zinc-900/90 border border-zinc-800/80 hover:border-blue-500/50 hover:bg-zinc-850/90 transition-all flex flex-col justify-between space-y-4 group cursor-pointer shadow-lg hover:shadow-blue-500/5 relative overflow-hidden"
                        >
                          {/* Card Top Icon & Badge */}
                          <div className="space-y-3">
                            <div className="flex items-start justify-between gap-3">
                              <div className={`w-12 h-12 rounded-2xl ${sec.iconBg} border flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}>
                                <IconComponent className={`w-6 h-6 ${sec.iconColor}`} />
                              </div>
                              {sec.badge && (
                                <span className="px-2.5 py-1 rounded-full bg-zinc-950 border border-zinc-800 text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider group-hover:border-blue-500/30 group-hover:text-blue-400 transition-colors">
                                  {sec.badge}
                                </span>
                              )}
                            </div>

                            <div>
                              <h3 className="font-bold text-base text-white group-hover:text-blue-400 transition-colors flex items-center gap-1.5">
                                <span>{sec.title}</span>
                              </h3>
                              <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed line-clamp-2">
                                {sec.description}
                              </p>
                            </div>
                          </div>

                          {/* Card Footer Button */}
                          <div className="pt-3 border-t border-zinc-800/60 flex items-center justify-between text-xs font-bold text-blue-400 group-hover:text-blue-300">
                            <span>Open {sec.title}</span>
                            <div className="w-7 h-7 rounded-full bg-zinc-950 border border-zinc-800 flex items-center justify-center group-hover:bg-blue-600 group-hover:border-blue-500 group-hover:text-white transition-all">
                              <ChevronRight className="w-4 h-4" />
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* FULL SCREEN SECTION STICKY TOP NAVIGATION BAR */}
            {activeTab !== 'dashboard' && (
              <div className="mb-6">
                <div className="bg-zinc-900/95 border border-zinc-800 rounded-3xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl backdrop-blur-md sticky top-0 z-30">
                  <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                    <button
                      onClick={() => setActiveTab('dashboard')}
                      className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-blue-500/25 flex items-center gap-2 transition-all cursor-pointer shrink-0"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>← Back to Admin Dashboard</span>
                    </button>

                    <div className="h-6 w-[1px] bg-zinc-800 hidden md:block" />

                    {(() => {
                      const meta = adminSectionsMeta.find((s) => s.key === activeTab);
                      const IconComp = meta?.icon || Settings;
                      return (
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-10 h-10 rounded-2xl ${meta?.iconBg || 'bg-blue-500/10'} border flex items-center justify-center shrink-0`}>
                            <IconComp className={`w-5 h-5 ${meta?.iconColor || 'text-blue-400'}`} />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h2 className="text-base sm:text-lg font-bold text-white truncate">
                                {meta?.title || 'Admin Section'}
                              </h2>
                              {meta?.badge && (
                                <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] font-extrabold uppercase shrink-0">
                                  {meta.badge}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-zinc-400 truncate">
                              {meta?.description || 'Manage section settings and features'}
                            </p>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    {/* Quick Section Switcher Dropdown */}
                    <select
                      value={activeTab}
                      onChange={(e) => setActiveTab(e.target.value as typeof activeTab)}
                      className="px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 font-medium focus:outline-none focus:border-blue-500 cursor-pointer"
                    >
                      <option value="dashboard">🏠 Admin Dashboard (All Sections)</option>
                      <optgroup label="Content & Prompts">
                        <option value="posts">✨ Prompts Management</option>
                        <option value="categories">📚 Categories Manager</option>
                        <option value="pages">📄 Custom Pages</option>
                        <option value="comments">💬 Comments Moderation</option>
                      </optgroup>
                      <optgroup label="Appearance & Branding">
                        <option value="postcard">🎨 Post Card Appearance</option>
                        <option value="logo">🖼️ Logo & Branding</option>
                        <option value="sections">🧱 Website Sections</option>
                        <option value="settings">⚙️ Website Settings</option>
                      </optgroup>
                      <optgroup label="Monetization">
                        <option value="monetization">💰 Monetization & Ads</option>
                        <option value="timer">⏱️ Countdown Timer</option>
                      </optgroup>
                      <optgroup label="Social & Features">
                        <option value="social">🌐 Social Links</option>
                        <option value="share">🔗 Share Buttons</option>
                        <option value="features">🎛️ Feature Controls</option>
                        <option value="seo">🔍 SEO & Meta Tags</option>
                      </optgroup>
                      <optgroup label="System & Security">
                        <option value="firebase">🔥 Firebase & Firestore</option>
                        <option value="cloudinary">☁️ Cloudinary Storage</option>
                        <option value="security">🔒 Admin Security</option>
                        <option value="deployment">🚀 Deployment Guide</option>
                        <option value="activity">📊 Activity Logs</option>
                      </optgroup>
                    </select>

                    {activeTab === 'posts' && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={onAddPost}
                          className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Add Prompt</span>
                        </button>
                        <button
                          onClick={() => setIsImportModalOpen(true)}
                          className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-purple-300 border border-purple-500/20 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Globe className="w-4 h-4 text-purple-400" />
                          <span>Import from URL</span>
                        </button>
                      </div>
                    )}

                    {activeTab === 'categories' && (
                      <button
                        onClick={onAddCategory}
                        className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Category</span>
                      </button>
                    )}

                    {activeTab === 'pages' && (
                      <button
                        onClick={handleOpenNewPageModal}
                        className="px-3.5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Page</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        );
      })()}

      {/* TAB 1: PROMPTS TABLE */}
      {activeTab === 'posts' && (
        <div className="space-y-4">
          {/* Permanent Featured & Trending Management Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Featured Post Card */}
            <div className="p-4 rounded-2xl bg-zinc-900/80 border border-blue-500/30 flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-400" />
                  <h3 className="font-bold text-xs sm:text-sm text-white">Current Featured Post</h3>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] font-extrabold uppercase">
                  Fixed 1 Active
                </span>
              </div>

              {currentFeaturedPost ? (
                <div className="flex items-center gap-3 bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                  <img
                    src={currentFeaturedPost.imageUrl}
                    alt={currentFeaturedPost.title}
                    className="w-12 h-12 rounded-lg object-contain bg-zinc-900 p-0.5 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-xs text-white truncate">{currentFeaturedPost.title}</p>
                    <p className="text-[11px] text-zinc-400 truncate">{currentFeaturedPost.shortDescription}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleRemoveFeatured(currentFeaturedPost)}
                      className="px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold transition-colors"
                    >
                      Remove
                    </button>
                    <button
                      onClick={() => onEditPost(currentFeaturedPost)}
                      className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-500 text-center">
                  No Featured Post currently active. Click "Set Featured" on any post below.
                </div>
              )}
            </div>

            {/* Trending Post Card */}
            <div className="p-4 rounded-2xl bg-zinc-900/80 border border-amber-500/30 flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-400" />
                  <h3 className="font-bold text-xs sm:text-sm text-white">Current Trending Post</h3>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-extrabold uppercase">
                  Fixed 1 Active
                </span>
              </div>

              {currentTrendingPost ? (
                <div className="flex items-center gap-3 bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                  <img
                    src={currentTrendingPost.imageUrl}
                    alt={currentTrendingPost.title}
                    className="w-12 h-12 rounded-lg object-contain bg-zinc-900 p-0.5 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-xs text-white truncate">{currentTrendingPost.title}</p>
                    <p className="text-[11px] text-zinc-400 truncate">{currentTrendingPost.shortDescription}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleRemoveTrending(currentTrendingPost)}
                      className="px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold transition-colors"
                    >
                      Remove
                    </button>
                    <button
                      onClick={() => onEditPost(currentTrendingPost)}
                      className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-500 text-center">
                  No Trending Post currently active. Click "Set Trending" on any post below.
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search prompts in table..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200"
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
                className="px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200"
              >
                <option value="all">All Status</option>
                <option value="published">Published</option>
                <option value="draft">Drafts</option>
                <option value="scheduled">Scheduled</option>
              </select>

              {selectedPostIds.length > 0 && (
                <button
                  onClick={handleBulkDelete}
                  className="px-3 py-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete ({selectedPostIds.length})</span>
                </button>
              )}
            </div>
          </div>

          <div className="rounded-3xl bg-zinc-900/90 border border-zinc-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-950/80 text-zinc-400 font-bold uppercase tracking-wider">
                    <th className="p-4 w-10">
                      <button onClick={handleSelectAll} className="text-zinc-400 hover:text-white">
                        {selectedPostIds.length === filteredPosts.length && filteredPosts.length > 0 ? (
                          <CheckSquare className="w-4 h-4 text-blue-500" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </th>
                    <th className="p-4">Prompt Title</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Timer</th>
                    <th className="p-4">Views / Copies</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/80">
                  {filteredPosts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-zinc-500">
                        No prompts found matching your filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredPosts.map((post) => {
                      const isSelected = selectedPostIds.includes(post.id);
                      const cat = categories.find((c) => c.id === post.categoryId);

                      return (
                        <tr
                          key={post.id}
                          className={`hover:bg-zinc-800/40 transition-colors ${
                            isSelected ? 'bg-blue-500/10' : ''
                          }`}
                        >
                          <td className="p-4">
                            <button
                              onClick={() => handleToggleSelectPost(post.id)}
                              className="text-zinc-400 hover:text-white"
                            >
                              {isSelected ? (
                                <CheckSquare className="w-4 h-4 text-blue-500" />
                              ) : (
                                <Square className="w-4 h-4" />
                              )}
                            </button>
                          </td>

                          <td className="p-4 max-w-xs">
                            <div className="flex items-center gap-3">
                              <img
                                src={post.imageUrl}
                                alt=""
                                className="w-10 h-10 rounded-xl object-contain bg-zinc-800 p-0.5 flex-shrink-0"
                              />
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <p className="font-bold text-white truncate">{post.title}</p>
                                  {post.featured && (
                                    <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] font-bold shrink-0">
                                      Featured
                                    </span>
                                  )}
                                  {post.trending && (
                                    <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold shrink-0">
                                      Trending
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-zinc-500 line-clamp-1">{post.shortDescription}</p>
                              </div>
                            </div>
                          </td>

                          <td className="p-4">
                            <span className="px-2.5 py-1 rounded-xl bg-zinc-800 text-zinc-300 font-semibold text-[11px]">
                              {cat?.name || 'General'}
                            </span>
                          </td>

                          <td className="p-4">
                            {post.timerOverride?.enabled === false ? (
                              <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 text-[10px] font-bold">
                                Disabled
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 text-[10px] font-bold border border-amber-500/20">
                                {post.timerOverride?.seconds ?? timerSettings.defaultSeconds}s Lock
                              </span>
                            )}
                          </td>

                          <td className="p-4 text-zinc-400 font-mono">
                            <div className="flex items-center gap-3">
                              <span title="Views">👁 {post.views || 0}</span>
                              <span title="Copies">📋 {post.copies || 0}</span>
                            </div>
                          </td>

                          <td className="p-4">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                post.status === 'published'
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                  : post.status === 'draft'
                                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                  : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                              }`}
                            >
                              {post.status}
                            </span>
                          </td>

                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => onOpenPreviewModal(post)}
                                title="Preview"
                                className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
                              >
                                <ArrowUpRight className="w-4 h-4" />
                              </button>

                              {/* Featured Toggle Button */}
                              {post.featured ? (
                                <button
                                  onClick={() => handleRemoveFeatured(post)}
                                  title="Remove Featured Status"
                                  className="px-2 py-1 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[11px] font-bold flex items-center gap-1 hover:bg-rose-500/20 hover:text-rose-400 hover:border-rose-500/30 transition-colors"
                                >
                                  <Sparkles className="w-3.5 h-3.5 fill-blue-400" />
                                  <span className="hidden xl:inline">Featured</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleSetFeatured(post)}
                                  title="Set as Featured Post"
                                  className="px-2 py-1 rounded-lg bg-zinc-800 text-zinc-400 hover:text-blue-400 hover:bg-blue-500/10 text-[11px] font-medium flex items-center gap-1 transition-colors"
                                >
                                  <Sparkles className="w-3.5 h-3.5" />
                                  <span className="hidden xl:inline">Set Featured</span>
                                </button>
                              )}

                              {/* Trending Toggle Button */}
                              {post.trending ? (
                                <button
                                  onClick={() => handleRemoveTrending(post)}
                                  title="Remove Trending Status"
                                  className="px-2 py-1 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[11px] font-bold flex items-center gap-1 hover:bg-rose-500/20 hover:text-rose-400 hover:border-rose-500/30 transition-colors"
                                >
                                  <Flame className="w-3.5 h-3.5 fill-amber-400" />
                                  <span className="hidden xl:inline">Trending</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleSetTrending(post)}
                                  title="Set as Trending Post"
                                  className="px-2 py-1 rounded-lg bg-zinc-800 text-zinc-400 hover:text-amber-400 hover:bg-amber-500/10 text-[11px] font-medium flex items-center gap-1 transition-colors"
                                >
                                  <Flame className="w-3.5 h-3.5" />
                                  <span className="hidden xl:inline">Set Trending</span>
                                </button>
                              )}

                              <button
                                onClick={() => onEditPost(post)}
                                title="Edit"
                                className="p-2 rounded-lg text-zinc-400 hover:text-blue-400 hover:bg-zinc-800"
                              >
                                <Edit className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => handleDuplicatePost(post.id)}
                                title="Duplicate"
                                className="p-2 rounded-lg text-zinc-400 hover:text-indigo-400 hover:bg-zinc-800"
                              >
                                <Copy className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => handleDeletePost(post.id, post.title)}
                                title="Delete"
                                className="p-2 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-zinc-800"
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

      {/* TAB 2: CATEGORIES */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={onAddCategory}
              className="px-4 py-2.5 rounded-2xl bg-blue-600 text-white font-bold text-xs flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Category</span>
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {categories.map((cat) => {
              const count = posts.filter((p) => p.categoryId === cat.id).length;
              return (
                <div
                  key={cat.id}
                  className="p-5 rounded-3xl bg-zinc-900/90 border border-zinc-800 flex flex-col justify-between space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                      <CategoryIcon name={cat.icon} className="w-5 h-5" />
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onEditCategory(cat)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(cat.id, cat.name)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-zinc-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold text-base text-white">{cat.name}</h4>
                    <p className="text-xs text-zinc-400 line-clamp-2 mt-1">{cat.description}</p>
                  </div>

                  <div className="pt-3 border-t border-zinc-800 flex items-center justify-between text-xs font-semibold text-zinc-500">
                    <span>{count} Prompts</span>
                    <span className="font-mono text-[10px]">slug: {cat.slug}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: MONETIZATION SETTINGS */}
      {activeTab === 'monetization' && (
        <div className="p-6 rounded-3xl bg-zinc-900/90 border border-zinc-800 space-y-8 max-w-5xl">
          {/* Header Bar */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <DollarSign className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-black text-white tracking-tight">
                  Monetization & Ad Networks Engine
                </h3>
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                Manage Multi-Network Ads (AdSense, Monetag, PropellerAds, Adsterra, Media.net, Custom), Earnings Reports & 12 Ad Placements
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleSaveMonetization}
                className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>Save All Monetization Settings</span>
              </button>
            </div>
          </div>

          {/* Master Global Controls & Test Mode Bar */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 rounded-2xl bg-zinc-950 border border-zinc-800">
            {/* Global Master Switch */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-900 border border-zinc-800/80">
              <div>
                <span className="text-xs font-bold text-white block">Global Advertisements Switch</span>
                <span className="text-[11px] text-zinc-400">Master toggle for all ad zones across the site</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={monetization.enabled}
                  onChange={(e) => setMonetization({ ...monetization, enabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>

            {/* Test Mode Switch */}
            <div className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
              monetization.testMode
                ? 'bg-amber-500/10 border-amber-500/30'
                : 'bg-zinc-900 border-zinc-800/80'
            }`}>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-white">Ad Test Mode</span>
                  {monetization.testMode && (
                    <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[9px] font-extrabold uppercase">Active</span>
                  )}
                </div>
                <span className="text-[11px] text-zinc-400">Render test placeholders on frontend without live scripts</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={monetization.testMode}
                  onChange={(e) => setMonetization({ ...monetization, testMode: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
              </label>
            </div>
          </div>

          {/* Sub-Tabs Bar */}
          <div className="flex items-center gap-2 border-b border-zinc-800 pb-3 overflow-x-auto">
            {[
              { id: 'networks', label: 'Monetization → Ad Networks', icon: Globe },
              { id: 'earnings', label: 'Earnings Dashboard', icon: BarChart2 },
              { id: 'placements', label: '12 Ad Placements', icon: Layers },
              { id: 'frequency', label: 'In-Feed Frequency', icon: Sliders },
            ].map((sub) => {
              const Icon = sub.icon;
              const isSel = monetizationSubTab === sub.id;
              return (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => setMonetizationSubTab(sub.id as any)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
                    isSel
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                      : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{sub.label}</span>
                </button>
              );
            })}
          </div>

          {/* SUB-TAB 1: AD NETWORKS */}
          {monetizationSubTab === 'networks' && (
            <div className="space-y-6">
              {/* Network Selector Cards */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300">
                    Select Active Ad Network (Only 1 Active At A Time)
                  </label>
                  <span className="text-[11px] text-emerald-400 font-semibold">
                    Current Active: {monetization.networks?.[monetization.activeNetwork]?.name || 'Google AdSense'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {[
                    { id: 'adsense', name: 'Google AdSense', color: 'from-blue-600 to-indigo-600' },
                    { id: 'monetag', name: 'Monetag', color: 'from-emerald-600 to-teal-600' },
                    { id: 'propeller', name: 'PropellerAds', color: 'from-purple-600 to-violet-600' },
                    { id: 'adsterra', name: 'Adsterra', color: 'from-rose-600 to-red-600' },
                    { id: 'medianet', name: 'Media.net', color: 'from-amber-600 to-orange-600' },
                    { id: 'custom', name: 'Custom Code', color: 'from-zinc-700 to-zinc-800' },
                  ].map((net) => {
                    const isActive = monetization.activeNetwork === net.id;
                    return (
                      <button
                        key={net.id}
                        type="button"
                        onClick={() => handleSelectNetwork(net.id as AdNetworkId)}
                        className={`p-4 rounded-2xl text-left border transition-all flex flex-col justify-between h-28 relative overflow-hidden ${
                          isActive
                            ? 'bg-zinc-950 border-emerald-500/80 shadow-lg shadow-emerald-500/10 ring-2 ring-emerald-500/30'
                            : 'bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-950'
                        }`}
                      >
                        <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${net.color} mb-2`} />
                        <div>
                          <p className="text-xs font-bold text-white leading-tight">{net.name}</p>
                          <p className="text-[10px] text-zinc-500 mt-1">
                            {isActive ? '✓ Active Network' : 'Click to Activate'}
                          </p>
                        </div>
                        {isActive && (
                          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selected Network Detailed Configuration Panel */}
              {(() => {
                const currentNetId = selectedNetworkId;
                const currentNet = monetization.networks?.[currentNetId] || {
                  id: currentNetId,
                  name: currentNetId,
                  publisherId: '',
                  scriptCode: '',
                  enabled: currentNetId === monetization.activeNetwork,
                };
                const isActive = monetization.activeNetwork === currentNetId;

                return (
                  <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-6">
                    <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
                      <div>
                        <h4 className="text-base font-bold text-white flex items-center gap-2">
                          <Globe className="w-4 h-4 text-emerald-400" />
                          <span>{currentNet.name} Network Settings</span>
                        </h4>
                        <p className="text-xs text-zinc-400 mt-0.5">
                          Configure publisher ID / zone ID, custom ad scripts, and status for {currentNet.name}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {isActive ? (
                          <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
                            ✓ Currently Active Network
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSelectNetwork(currentNetId)}
                            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md"
                          >
                            Set As Active Network
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300">
                          Publisher ID / Zone ID
                        </label>
                        <input
                          type="text"
                          value={currentNet.publisherId || ''}
                          onChange={(e) => handleUpdateNetworkConfig(currentNetId, 'publisherId', e.target.value)}
                          placeholder={
                            currentNetId === 'adsense' ? 'ca-pub-1234567890123456' :
                            currentNetId === 'monetag' ? 'zone-881234' :
                            currentNetId === 'propeller' ? 'zone-995678' :
                            currentNetId === 'adsterra' ? 'key-345678' :
                            currentNetId === 'medianet' ? 'customer-901234' : 'custom-banner-id'
                          }
                          className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
                        />
                        <p className="text-[11px] text-zinc-500">
                          Your unique publisher account identifier or zone key from {currentNet.name}.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300">
                          Network Activation Status
                        </label>
                        <label className="flex items-center justify-between p-3 rounded-xl bg-zinc-900 border border-zinc-800 cursor-pointer">
                          <span className="text-xs font-bold text-white">
                            {currentNet.enabled ? '✓ Network Enabled' : '✕ Network Disabled'}
                          </span>
                          <input
                            type="checkbox"
                            checked={currentNet.enabled}
                            onChange={(e) => handleUpdateNetworkConfig(currentNetId, 'enabled', e.target.checked)}
                            className="w-5 h-5 rounded text-emerald-500 focus:ring-emerald-500"
                          />
                        </label>
                        <p className="text-[11px] text-zinc-500">
                          Enabling this network automatically sets it as active and disables previous networks.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300">
                        Script Code / HTML Embed Code
                      </label>
                      <textarea
                        rows={4}
                        value={currentNet.scriptCode || ''}
                        onChange={(e) => handleUpdateNetworkConfig(currentNetId, 'scriptCode', e.target.value)}
                        placeholder={`<script src="...">...</script>`}
                        className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-mono text-emerald-300 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 leading-relaxed"
                      />
                      <p className="text-[11px] text-zinc-500">
                        Paste header scripts, auto-ad tags, or banner codes provided by {currentNet.name}.
                      </p>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="button"
                        onClick={handleSaveMonetization}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Save Network Settings</span>
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* SUB-TAB 2: EARNINGS DASHBOARD */}
          {monetizationSubTab === 'earnings' && (
            <div className="space-y-6">
              {/* Active Network Status Bar */}
              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">Active Network:</span>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-extrabold uppercase">
                        {monetization.networks?.[monetization.activeNetwork]?.name || 'Google AdSense'}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Real-time performance metrics for {monetization.networks?.[monetization.activeNetwork]?.name}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowDemoMetrics(!showDemoMetrics)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                      showDemoMetrics
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                    }`}
                  >
                    {showDemoMetrics ? '✓ Demo Mode (Simulated Stats)' : 'Show Demo Report Data'}
                  </button>
                </div>
              </div>

              {!showDemoMetrics && (
                <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-blue-300 leading-relaxed">
                    <strong>Live API Sync Notice:</strong> Direct live revenue API reporting is not synced for {monetization.networks?.[monetization.activeNetwork]?.name || 'this ad network'}. As per standard monetization rules, live stats show <strong>"Not Available"</strong>. Click <em>"Show Demo Report Data"</em> above to preview earnings report layouts.
                  </div>
                </div>
              )}

              {/* Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { label: 'Estimated Earnings', value: showDemoMetrics ? '$184.20' : 'Not Available', sub: 'Total accumulated earnings' },
                  { label: "Today's Revenue", value: showDemoMetrics ? '$14.80' : 'Not Available', sub: 'Calculated since 00:00 UTC' },
                  { label: "Yesterday's Revenue", value: showDemoMetrics ? '$19.50' : 'Not Available', sub: 'Finalized yesterday total' },
                  { label: 'This Month Revenue', value: showDemoMetrics ? '$412.00' : 'Not Available', sub: 'Current billing month' },
                  { label: 'Total Ad Impressions', value: showDemoMetrics ? '52,400' : 'Not Available', sub: 'Valid ad views rendered' },
                  { label: 'Total Ad Clicks', value: showDemoMetrics ? '1,180' : 'Not Available', sub: 'User ad clicks recorded' },
                  { label: 'Click-Through Rate (CTR)', value: showDemoMetrics ? '2.25%' : 'Not Available', sub: 'Clicks ÷ Impressions ratio' },
                  { label: 'Revenue Per Mille (RPM)', value: showDemoMetrics ? '$3.51' : 'Not Available', sub: 'Earnings per 1,000 views' },
                  { label: 'Ad Fill Rate', value: showDemoMetrics ? '98.6%' : 'Not Available', sub: 'Served ÷ Requested ads' },
                ].map((metric, idx) => (
                  <div key={idx} className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800/80 space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block">
                      {metric.label}
                    </span>
                    <div className="text-xl font-black text-white tracking-tight flex items-center justify-between">
                      <span>{metric.value}</span>
                      {metric.value === 'Not Available' ? (
                        <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-[10px] font-semibold text-zinc-400">
                          Not Synced
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-extrabold">
                          Live Rate
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-500">{metric.sub}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SUB-TAB 3: AD PLACEMENTS */}
          {monetizationSubTab === 'placements' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold uppercase tracking-wider text-zinc-300">
                    12 Supported Ad Positions
                  </h4>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Toggle locations on/off and click "Preview" to inspect responsive units
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  { key: 'topBanner', label: 'Top Banner Header', desc: 'Above main header & navigation bar' },
                  { key: 'bottomBanner', label: 'Bottom Banner', desc: 'Above website footer' },
                  { key: 'homepageBanner', label: 'Homepage Hero Banner', desc: 'Below welcome title on home page' },
                  { key: 'betweenPosts', label: 'Between Feed Posts', desc: 'Interspersed inside prompt feed cards' },
                  { key: 'insidePostTop', label: 'Inside Post Top', desc: 'Top of prompt detail popup page' },
                  { key: 'insidePrompt', label: 'Inside Prompt Box', desc: 'Directly inside prompt content area' },
                  { key: 'belowPrompt', label: 'Below Prompt Box', desc: 'Directly beneath prompt text box' },
                  { key: 'beforeCopyButton', label: 'Before Copy Button', desc: 'Above prompt copy action button' },
                  { key: 'afterCopyButton', label: 'After Copy Button', desc: 'Below copy action button' },
                  { key: 'stickyBottomBanner', label: 'Sticky Bottom Banner', desc: 'Fixed floating bar at screen bottom' },
                  { key: 'desktopSidebar', label: 'Desktop Sidebar Ad', desc: 'Sticky sidebar column on large screens' },
                  { key: 'footerBanner', label: 'Footer Banner', desc: 'Inside website footer section' },
                ].map((pos) => {
                  const posKey = pos.key as keyof AdPositions;
                  const isEnabled = monetization.positions?.[posKey];
                  return (
                    <div
                      key={pos.key}
                      className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                        isEnabled
                          ? 'bg-zinc-950 border-zinc-800'
                          : 'bg-zinc-950/40 border-zinc-900 opacity-60'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-white">{pos.label}</span>
                          <input
                            type="checkbox"
                            checked={!!isEnabled}
                            onChange={(e) =>
                              setMonetization({
                                ...monetization,
                                positions: { ...monetization.positions, [posKey]: e.target.checked },
                              })
                            }
                            className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                          />
                        </div>
                        <p className="text-[11px] text-zinc-500 mt-1">{pos.desc}</p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-zinc-900">
                        <span className={`text-[10px] font-extrabold uppercase tracking-wider ${
                          isEnabled ? 'text-emerald-400' : 'text-zinc-600'
                        }`}>
                          {isEnabled ? '✓ Enabled' : '✕ Disabled'}
                        </span>
                        <button
                          type="button"
                          onClick={() => setPreviewingPosition(posKey)}
                          className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white text-[11px] font-bold flex items-center gap-1.5 transition-colors"
                        >
                          <Eye className="w-3 h-3 text-amber-400" />
                          <span>Preview</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SUB-TAB 4: IN-FEED FREQUENCY */}
          {monetizationSubTab === 'frequency' && (
            <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4">
              <div>
                <h4 className="text-sm font-bold uppercase tracking-wider text-zinc-300">
                  In-Feed Ad Frequency
                </h4>
                <p className="text-xs text-zinc-400 mt-1">
                  Choose how frequently ads appear between prompt cards in the homepage feed
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
                {[2, 3, 4, 5, 10].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setMonetization({ ...monetization, adFrequency: num })}
                    className={`p-4 rounded-2xl text-xs font-bold border transition-all ${
                      monetization.adFrequency === num
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 shadow-lg shadow-emerald-500/10'
                        : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                    }`}
                  >
                    Every {num} Posts
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Ad Position Preview Modal */}
          {previewingPosition && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
              <div className="w-full max-w-3xl rounded-3xl bg-zinc-900 border border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Modal Header */}
                <div className="p-5 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      <Eye className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">
                        Ad Position Preview
                      </h3>
                      <p className="text-xs text-zinc-400">
                        Active Network: <strong className="text-emerald-400">{monetization.networks?.[monetization.activeNetwork]?.name || 'Google AdSense'}</strong>
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setPreviewingPosition(null)}
                    className="p-2 rounded-xl bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Viewport Switcher */}
                <div className="px-5 py-3 bg-zinc-950/60 border-b border-zinc-800/80 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-zinc-400">Viewport:</span>
                    {[
                      { id: 'desktop', label: 'Desktop', icon: Monitor },
                      { id: 'tablet', label: 'Tablet', icon: Tablet },
                      { id: 'mobile', label: 'Mobile', icon: Smartphone },
                    ].map((vp) => {
                      const Icon = vp.icon;
                      const isSel = previewViewport === vp.id;
                      return (
                        <button
                          key={vp.id}
                          type="button"
                          onClick={() => setPreviewViewport(vp.id as any)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                            isSel
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span>{vp.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <span className="text-xs font-bold text-zinc-300">Status:</span>
                    <input
                      type="checkbox"
                      checked={!!monetization.positions?.[previewingPosition]}
                      onChange={(e) =>
                        setMonetization({
                          ...monetization,
                          positions: { ...monetization.positions, [previewingPosition]: e.target.checked },
                        })
                      }
                      className="w-4 h-4 rounded text-emerald-500"
                    />
                    <span className="text-xs font-bold text-emerald-400">
                      {monetization.positions?.[previewingPosition] ? 'Enabled' : 'Disabled'}
                    </span>
                  </label>
                </div>

                {/* Preview Stage Container */}
                <div className="p-6 overflow-y-auto bg-zinc-950/40 flex-1 flex flex-col items-center justify-center min-h-[280px]">
                  <div
                    className={`transition-all duration-300 w-full ${
                      previewViewport === 'mobile' ? 'max-w-[375px]' : previewViewport === 'tablet' ? 'max-w-[768px]' : 'max-w-full'
                    }`}
                  >
                    {/* Simulated Web Framing */}
                    <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3">
                      <div className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 border-b border-zinc-800 pb-2 flex justify-between">
                        <span>Simulated Web Framing ({previewViewport})</span>
                        <span>{previewingPosition}</span>
                      </div>

                      <p className="text-xs text-zinc-400 italic">Content preceding ad placement...</p>

                      {/* Render Ad Banner inside Preview Frame */}
                      <AdBanner
                        position={previewingPosition}
                        settings={{
                          ...monetization,
                          testMode: true, // Force test mode preview box
                        }}
                      />

                      <p className="text-xs text-zinc-400 italic">Content following ad placement...</p>
                    </div>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="p-4 bg-zinc-950 border-t border-zinc-800 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setPreviewingPosition(null)}
                    className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition-colors"
                  >
                    Close Preview
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: TIMER SETTINGS */}
      {activeTab === 'timer' && (
        <div className="p-6 rounded-3xl bg-zinc-900/90 border border-zinc-800 space-y-6 max-w-2xl">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-400" />
                <span>Timer & Unlock Countdown Settings</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-1">Control countdown delay before prompt copy button unlocks</p>
            </div>
            <button
              onClick={handleSaveTimerSettings}
              className="px-5 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-600/20"
            >
              <Save className="w-4 h-4" />
              <span>Save Timer</span>
            </button>
          </div>

          <div className="space-y-4">
            <label className="flex items-center gap-3 p-4 rounded-2xl bg-zinc-950 border border-zinc-800 cursor-pointer">
              <input
                type="checkbox"
                checked={timerSettings.enabled}
                onChange={(e) => setTimerSettings({ ...timerSettings, enabled: e.target.checked })}
                className="w-5 h-5 rounded text-amber-500 focus:ring-amber-500"
              />
              <div>
                <span className="text-sm font-bold text-white">Enable Global Timer Countdown</span>
                <p className="text-xs text-zinc-400">When enabled, prompt text is locked with countdown before copying</p>
              </div>
            </label>

            <div className="space-y-2 p-4 rounded-2xl bg-zinc-950 border border-zinc-800">
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
                Choose Default Seconds
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[0, 3, 5, 10, 15, 20, 30, 60].map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => setTimerSettings({ ...timerSettings, defaultSeconds: sec })}
                    className={`p-3 rounded-2xl text-xs font-bold border transition-colors ${
                      timerSettings.defaultSeconds === sec
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                        : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                    }`}
                  >
                    {sec === 0 ? '0s (Instant)' : `${sec} Seconds`}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: PAGES & CUSTOM PAGE BUILDER */}
      {activeTab === 'pages' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-400" />
              <span>Custom Page Builder & Policy Pages</span>
            </h3>
            <button
              onClick={handleOpenNewPageModal}
              className="px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>+ Create Custom Page</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {pages.map((page) => (
              <div
                key={page.id}
                className="p-5 rounded-3xl bg-zinc-900/90 border border-zinc-800 flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <span className="px-2.5 py-1 rounded-xl bg-blue-500/10 text-blue-400 text-[10px] font-bold uppercase tracking-wider">
                      {page.isSystem ? 'System Policy' : 'Custom Page'}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        page.status === 'published' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                      }`}
                    >
                      {page.status}
                    </span>
                  </div>

                  <h4 className="font-bold text-base text-white mt-3">{page.title}</h4>
                  <p className="text-xs font-mono text-zinc-500 mt-0.5">/{page.slug}</p>
                  <p className="text-xs text-zinc-400 line-clamp-3 mt-2">{page.content}</p>
                </div>

                <div className="pt-3 border-t border-zinc-800 flex items-center justify-between">
                  <button
                    onClick={() => onOpenPageModal(page)}
                    className="text-xs font-bold text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <span>Preview Page</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEditPage(page)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    {!page.isSystem && (
                      <button
                        onClick={() => handleDeletePage(page.id, page.title)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-zinc-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: ADVANCED SEO */}
      {activeTab === 'seo' && (
        <div className="p-6 rounded-3xl bg-zinc-900/90 border border-zinc-800 space-y-6 max-w-4xl">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Globe className="w-5 h-5 text-sky-400" />
                <span>Advanced SEO & Meta Tag Generator</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-1">Configure global title, meta description, Open Graph, Twitter cards & robots.txt</p>
            </div>
            <button
              onClick={handleSaveSeoSettings}
              className="px-5 py-2.5 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-sky-600/20"
            >
              <Save className="w-4 h-4" />
              <span>Save SEO Settings</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">Website Title</label>
              <input
                type="text"
                value={seoSettings.websiteTitle}
                onChange={(e) => setSeoSettings({ ...seoSettings, websiteTitle: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">Canonical Base URL</label>
              <input
                type="text"
                value={seoSettings.canonicalUrl}
                onChange={(e) => setSeoSettings({ ...seoSettings, canonicalUrl: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-white font-mono"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">Global Meta Description</label>
            <textarea
              rows={3}
              value={seoSettings.metaDescription}
              onChange={(e) => setSeoSettings({ ...seoSettings, metaDescription: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-white"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">Keywords (Comma Separated)</label>
            <input
              type="text"
              value={seoSettings.keywords}
              onChange={(e) => setSeoSettings({ ...seoSettings, keywords: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-white"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">Robots.txt Content</label>
            <textarea
              rows={4}
              value={seoSettings.robotsTxt}
              onChange={(e) => setSeoSettings({ ...seoSettings, robotsTxt: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-300"
            />
          </div>
        </div>
      )}

      {/* TAB 7: SECURITY */}
      {activeTab === 'security' && (
        <div className="p-6 rounded-3xl bg-zinc-900/90 border border-zinc-800 space-y-6 max-w-4xl">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Lock className="w-5 h-5 text-indigo-400" />
                <span>Enterprise Security & Access Controls</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-1">Admin authentication, session timeouts, rate limits and Firestore rules status</p>
            </div>
            <button
              onClick={handleSaveSecuritySettings}
              className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/20"
            >
              <Save className="w-4 h-4" />
              <span>Save Security</span>
            </button>
          </div>

          {/* Security Status Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-1">
              <span className="text-[10px] font-bold uppercase text-zinc-500">Firebase Auth</span>
              <p className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Active & Protected
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-1">
              <span className="text-[10px] font-bold uppercase text-zinc-500">Public Registration</span>
              <p className="text-xs font-bold text-blue-400 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5" /> Disabled (Admin Only)
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-1">
              <span className="text-[10px] font-bold uppercase text-zinc-500">HTTPS Transport</span>
              <p className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Enforced SSL
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-1">
              <span className="text-[10px] font-bold uppercase text-zinc-500">Hidden Admin Trigger</span>
              <p className="text-xs font-bold text-amber-400 font-mono">?admin or Ctrl+Shift+A</p>
            </div>
          </div>
        </div>
      )}

      {/* TAB: POST CARD APPEARANCE */}
      {activeTab === 'postcard' && (
        <PostCardAppearanceControl />
      )}

      {/* TAB: SHARE SETTINGS */}
      {activeTab === 'share' && (
        <ShareSettingsControl featureControls={featureControls} />
      )}

      {/* TAB: FEATURE CONTROL CENTER */}
      {activeTab === 'features' && (
        <FeatureControlCenter featureControls={featureControls} />
      )}

      {/* TAB: WEBSITE SECTIONS */}
      {activeTab === 'sections' && (
        <WebsiteSectionsControl />
      )}

      {/* TAB: WEBSITE SETTINGS */}
      {activeTab === 'settings' && (
        <div className="p-6 rounded-3xl bg-zinc-900/90 border border-zinc-800 space-y-6 max-w-5xl">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Settings className="w-5 h-5 text-blue-500" />
                <span>Master Website & Cloud Configuration</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Customize site identity, branding, Cloudinary image upload, and custom scripts
              </p>
            </div>
            <button
              onClick={handleSaveWebsiteSettings}
              className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-blue-500/25"
            >
              <Save className="w-4 h-4" />
              <span>Save Settings</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Branding & Identity */}
            <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800/80 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                <span>Website Identity & Branding</span>
              </h4>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-zinc-400 mb-1">
                    Website Name
                  </label>
                  <input
                    type="text"
                    value={websiteSettings.websiteName}
                    onChange={(e) =>
                      setWebsiteSettings({ ...websiteSettings, websiteName: e.target.value })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-zinc-400 mb-1">
                    Tagline
                  </label>
                  <input
                    type="text"
                    value={websiteSettings.tagline}
                    onChange={(e) => setWebsiteSettings({ ...websiteSettings, tagline: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-zinc-400 mb-1">
                    Homepage Title
                  </label>
                  <input
                    type="text"
                    value={websiteSettings.homepageTitle}
                    onChange={(e) =>
                      setWebsiteSettings({ ...websiteSettings, homepageTitle: e.target.value })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-zinc-400 mb-1">
                    Homepage Subtitle
                  </label>
                  <textarea
                    rows={2}
                    value={websiteSettings.homepageSubtitle}
                    onChange={(e) =>
                      setWebsiteSettings({ ...websiteSettings, homepageSubtitle: e.target.value })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-zinc-400 mb-1">
                    Footer Copyright Text
                  </label>
                  <input
                    type="text"
                    value={websiteSettings.footerText}
                    onChange={(e) =>
                      setWebsiteSettings({ ...websiteSettings, footerText: e.target.value })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Cloudinary Integration */}
            <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800/80 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center gap-2">
                <Cloud className="w-4 h-4" />
                <span>Cloudinary Storage Integration</span>
              </h4>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-zinc-400 mb-1">
                    Cloud Name
                  </label>
                  <input
                    type="text"
                    value={cloudinarySettings.cloudName}
                    onChange={(e) =>
                      setCloudinarySettings({ ...cloudinarySettings, cloudName: e.target.value })
                    }
                    placeholder="e.g., sahil-edits"
                    className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-zinc-400 mb-1">
                    Unsigned Upload Preset
                  </label>
                  <input
                    type="text"
                    value={cloudinarySettings.uploadPreset}
                    onChange={(e) =>
                      setCloudinarySettings({ ...cloudinarySettings, uploadPreset: e.target.value })
                    }
                    placeholder="e.g., ml_default"
                    className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white font-mono"
                  />
                </div>

                <div className="pt-2 p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 text-[11px] text-zinc-400 space-y-1">
                  <p className="font-bold text-white flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Status: {cloudinarySettings.cloudName ? 'Connected' : 'Not Configured'}
                  </p>
                  <p>When configured, admin prompt image uploads go directly to Cloudinary CDN.</p>
                </div>
              </div>
            </div>

            {/* Social Links Section */}
            <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800/80 space-y-4 md:col-span-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-800 pb-3 gap-2">
                <div className="flex items-center gap-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    <span>Social Links & Enable / Disable Controls</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      const currentMaster = featureControls.footerSocialLinks && (websiteSettings.socialLinks?.enabled !== false);
                      const newMaster = !currentMaster;
                      promptStore.updateFeatureControls({ footerSocialLinks: newMaster });
                      const updatedSettings = {
                        ...websiteSettings,
                        socialLinks: { ...websiteSettings.socialLinks, enabled: newMaster },
                      };
                      setWebsiteSettings(updatedSettings);
                      promptStore.updateWebsiteSettings(updatedSettings);
                      showToast(
                        newMaster ? '✓ Social Media Enabled' : '✕ Social Media Disabled',
                        newMaster ? 'Social media section enabled globally.' : 'Social media section hidden globally.'
                      );
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all flex items-center gap-1.5 border cursor-pointer ${
                      (featureControls.footerSocialLinks && (websiteSettings.socialLinks?.enabled !== false))
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                        : 'bg-red-500/20 text-red-400 border-red-500/40'
                    }`}
                  >
                    <span>Section:</span>
                    <strong>
                      {(featureControls.footerSocialLinks && (websiteSettings.socialLinks?.enabled !== false)) ? 'ENABLED' : 'DISABLED'}
                    </strong>
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab('features')}
                    className="text-[11px] font-bold text-blue-400 hover:text-blue-300 underline flex items-center gap-1"
                  >
                    <Sliders className="w-3 h-3" />
                    <span>Feature Controls</span>
                  </button>
                  <span className="text-[11px] text-zinc-400 font-medium">
                    Toggle platforms ON/OFF or enter custom URLs.
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                {/* 1. Instagram URL */}
                <div className="p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold uppercase text-zinc-300 flex items-center gap-1.5">
                      <Instagram className="w-3.5 h-3.5 text-pink-500" />
                      <span>Instagram</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const val = !featureControls.instagramToggle;
                        promptStore.updateFeatureControls({ instagramToggle: val });
                      }}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-colors ${
                        featureControls.instagramToggle ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}
                    >
                      {featureControls.instagramToggle ? 'ENABLED' : 'DISABLED'}
                    </button>
                  </div>
                  <input
                    type="url"
                    placeholder="e.g., https://instagram.com/your_profile"
                    value={websiteSettings.socialLinks?.instagram || ''}
                    onChange={(e) =>
                      setWebsiteSettings({
                        ...websiteSettings,
                        socialLinks: { ...websiteSettings.socialLinks, instagram: e.target.value },
                      })
                    }
                    className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 text-xs"
                  />
                </div>

                {/* 2. Facebook URL */}
                <div className="p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold uppercase text-zinc-300 flex items-center gap-1.5">
                      <Facebook className="w-3.5 h-3.5 text-blue-500" />
                      <span>Facebook</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const val = !featureControls.facebookToggle;
                        promptStore.updateFeatureControls({ facebookToggle: val });
                      }}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-colors ${
                        featureControls.facebookToggle ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}
                    >
                      {featureControls.facebookToggle ? 'ENABLED' : 'DISABLED'}
                    </button>
                  </div>
                  <input
                    type="url"
                    placeholder="e.g., https://facebook.com/your_profile"
                    value={websiteSettings.socialLinks?.facebook || ''}
                    onChange={(e) =>
                      setWebsiteSettings({
                        ...websiteSettings,
                        socialLinks: { ...websiteSettings.socialLinks, facebook: e.target.value },
                      })
                    }
                    className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 text-xs"
                  />
                </div>

                {/* 3. WhatsApp Link */}
                <div className="p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold uppercase text-zinc-300 flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                      <span>WhatsApp</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const val = !featureControls.whatsappToggle;
                        promptStore.updateFeatureControls({ whatsappToggle: val });
                      }}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-colors ${
                        featureControls.whatsappToggle ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}
                    >
                      {featureControls.whatsappToggle ? 'ENABLED' : 'DISABLED'}
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="e.g., https://wa.me/91XXXXXXXXXX"
                    value={websiteSettings.socialLinks?.whatsapp || ''}
                    onChange={(e) =>
                      setWebsiteSettings({
                        ...websiteSettings,
                        socialLinks: { ...websiteSettings.socialLinks, whatsapp: e.target.value },
                      })
                    }
                    className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 text-xs"
                  />
                </div>

                {/* 4. Telegram URL */}
                <div className="p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold uppercase text-zinc-300 flex items-center gap-1.5">
                      <Send className="w-3.5 h-3.5 text-sky-400" />
                      <span>Telegram</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const val = !featureControls.telegramToggle;
                        promptStore.updateFeatureControls({ telegramToggle: val });
                      }}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-colors ${
                        featureControls.telegramToggle ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}
                    >
                      {featureControls.telegramToggle ? 'ENABLED' : 'DISABLED'}
                    </button>
                  </div>
                  <input
                    type="url"
                    placeholder="e.g., https://t.me/your_channel"
                    value={websiteSettings.socialLinks?.telegram || ''}
                    onChange={(e) =>
                      setWebsiteSettings({
                        ...websiteSettings,
                        socialLinks: { ...websiteSettings.socialLinks, telegram: e.target.value },
                      })
                    }
                    className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 text-xs"
                  />
                </div>

                {/* 5. YouTube URL */}
                <div className="p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold uppercase text-zinc-300 flex items-center gap-1.5">
                      <Youtube className="w-3.5 h-3.5 text-red-500" />
                      <span>YouTube</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const val = !featureControls.youtubeToggle;
                        promptStore.updateFeatureControls({ youtubeToggle: val });
                      }}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-colors ${
                        featureControls.youtubeToggle ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}
                    >
                      {featureControls.youtubeToggle ? 'ENABLED' : 'DISABLED'}
                    </button>
                  </div>
                  <input
                    type="url"
                    placeholder="e.g., https://youtube.com/@your_channel"
                    value={websiteSettings.socialLinks?.youtube || ''}
                    onChange={(e) =>
                      setWebsiteSettings({
                        ...websiteSettings,
                        socialLinks: { ...websiteSettings.socialLinks, youtube: e.target.value },
                      })
                    }
                    className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 text-xs"
                  />
                </div>

                {/* 6. X (Twitter) URL */}
                <div className="p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold uppercase text-zinc-300 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-zinc-300" />
                      <span>X (Twitter)</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const val = !featureControls.twitterToggle;
                        promptStore.updateFeatureControls({ twitterToggle: val });
                      }}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-colors ${
                        featureControls.twitterToggle ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}
                    >
                      {featureControls.twitterToggle ? 'ENABLED' : 'DISABLED'}
                    </button>
                  </div>
                  <input
                    type="url"
                    placeholder="e.g., https://x.com/your_handle"
                    value={websiteSettings.socialLinks?.twitter || ''}
                    onChange={(e) =>
                      setWebsiteSettings({
                        ...websiteSettings,
                        socialLinks: { ...websiteSettings.socialLinks, twitter: e.target.value },
                      })
                    }
                    className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 text-xs"
                  />
                </div>

                {/* 7. GitHub URL */}
                <div className="p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold uppercase text-zinc-300 flex items-center gap-1.5">
                      <Github className="w-3.5 h-3.5 text-purple-400" />
                      <span>GitHub</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const val = !featureControls.githubToggle;
                        promptStore.updateFeatureControls({ githubToggle: val });
                      }}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-colors ${
                        featureControls.githubToggle ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}
                    >
                      {featureControls.githubToggle ? 'ENABLED' : 'DISABLED'}
                    </button>
                  </div>
                  <input
                    type="url"
                    placeholder="e.g., https://github.com/your_username"
                    value={websiteSettings.socialLinks?.github || ''}
                    onChange={(e) =>
                      setWebsiteSettings({
                        ...websiteSettings,
                        socialLinks: { ...websiteSettings.socialLinks, github: e.target.value },
                      })
                    }
                    className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 text-xs"
                  />
                </div>

                {/* 8. Discord URL */}
                <div className="p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold uppercase text-zinc-300 flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Discord</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const val = !featureControls.discordToggle;
                        promptStore.updateFeatureControls({ discordToggle: val });
                      }}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-colors ${
                        featureControls.discordToggle ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}
                    >
                      {featureControls.discordToggle ? 'ENABLED' : 'DISABLED'}
                    </button>
                  </div>
                  <input
                    type="url"
                    placeholder="e.g., https://discord.gg/your_invite"
                    value={websiteSettings.socialLinks?.discord || ''}
                    onChange={(e) =>
                      setWebsiteSettings({
                        ...websiteSettings,
                        socialLinks: { ...websiteSettings.socialLinks, discord: e.target.value },
                      })
                    }
                    className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Custom Scripts */}
            <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800/80 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-2">
                <Sliders className="w-4 h-4" />
                <span>Analytics & Custom Headers</span>
              </h4>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-zinc-400 mb-1">
                    Google Analytics ID (G-XXXXXXX)
                  </label>
                  <input
                    type="text"
                    value={websiteSettings.googleAnalyticsId}
                    onChange={(e) =>
                      setWebsiteSettings({ ...websiteSettings, googleAnalyticsId: e.target.value })
                    }
                    className="w-full px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-zinc-400 mb-1">
                    Custom CSS Code
                  </label>
                  <textarea
                    rows={3}
                    value={websiteSettings.customCss}
                    onChange={(e) =>
                      setWebsiteSettings({ ...websiteSettings, customCss: e.target.value })
                    }
                    placeholder="/* Custom CSS overrides */"
                    className="w-full p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white font-mono"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: SOCIAL LINKS */}
      {activeTab === 'social' && (
        <div className="p-6 rounded-3xl bg-zinc-900/90 border border-zinc-800 space-y-6 max-w-5xl">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-800 flex-wrap gap-3">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Globe className="w-5 h-5 text-emerald-400" />
                <span>Social Links Configuration</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Enter your actual profile links below. Any empty field will automatically hide that social icon on the website.
              </p>
            </div>

            <button
              onClick={() => {
                promptStore.updateWebsiteSettings(websiteSettings);
                showToast('✓ Social Links Saved', 'All social media profile links have been updated');
              }}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>Save Social Links</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Instagram */}
            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
              <label className="block text-xs font-bold text-white flex items-center gap-2">
                <Instagram className="w-4 h-4 text-pink-500" />
                <span>Instagram Profile URL</span>
              </label>
              <input
                type="url"
                placeholder="e.g., https://instagram.com/your_username"
                value={websiteSettings.socialLinks?.instagram || ''}
                onChange={(e) =>
                  setWebsiteSettings({
                    ...websiteSettings,
                    socialLinks: { ...websiteSettings.socialLinks, instagram: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <p className="text-[11px] text-zinc-500">Direct link to your Instagram profile or page.</p>
            </div>

            {/* Facebook */}
            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
              <label className="block text-xs font-bold text-white flex items-center gap-2">
                <Facebook className="w-4 h-4 text-blue-500" />
                <span>Facebook Profile/Page URL</span>
              </label>
              <input
                type="url"
                placeholder="e.g., https://facebook.com/your_page"
                value={websiteSettings.socialLinks?.facebook || ''}
                onChange={(e) =>
                  setWebsiteSettings({
                    ...websiteSettings,
                    socialLinks: { ...websiteSettings.socialLinks, facebook: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <p className="text-[11px] text-zinc-500">Direct link to your Facebook page or user profile.</p>
            </div>

            {/* WhatsApp */}
            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
              <label className="block text-xs font-bold text-white flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-400" />
                <span>WhatsApp Chat Link</span>
              </label>
              <input
                type="text"
                placeholder="e.g., https://wa.me/91XXXXXXXXXX"
                value={websiteSettings.socialLinks?.whatsapp || ''}
                onChange={(e) =>
                  setWebsiteSettings({
                    ...websiteSettings,
                    socialLinks: { ...websiteSettings.socialLinks, whatsapp: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <p className="text-[11px] text-zinc-500">WhatsApp direct message link (e.g., https://wa.me/919876543210).</p>
            </div>

            {/* Telegram */}
            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
              <label className="block text-xs font-bold text-white flex items-center gap-2">
                <Send className="w-4 h-4 text-sky-400" />
                <span>Telegram Channel/User URL</span>
              </label>
              <input
                type="url"
                placeholder="e.g., https://t.me/your_channel"
                value={websiteSettings.socialLinks?.telegram || ''}
                onChange={(e) =>
                  setWebsiteSettings({
                    ...websiteSettings,
                    socialLinks: { ...websiteSettings.socialLinks, telegram: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <p className="text-[11px] text-zinc-500">Direct link to your Telegram channel or personal handle.</p>
            </div>

            {/* YouTube */}
            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
              <label className="block text-xs font-bold text-white flex items-center gap-2">
                <Youtube className="w-4 h-4 text-red-500" />
                <span>YouTube Channel URL</span>
              </label>
              <input
                type="url"
                placeholder="e.g., https://youtube.com/@your_channel"
                value={websiteSettings.socialLinks?.youtube || ''}
                onChange={(e) =>
                  setWebsiteSettings({
                    ...websiteSettings,
                    socialLinks: { ...websiteSettings.socialLinks, youtube: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <p className="text-[11px] text-zinc-500">Direct link to your YouTube channel or user profile.</p>
            </div>

            {/* X (Twitter) */}
            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
              <label className="block text-xs font-bold text-white flex items-center gap-2">
                <Globe className="w-4 h-4 text-zinc-300" />
                <span>X (Twitter) Profile URL</span>
              </label>
              <input
                type="url"
                placeholder="e.g., https://x.com/your_handle"
                value={websiteSettings.socialLinks?.twitter || ''}
                onChange={(e) =>
                  setWebsiteSettings({
                    ...websiteSettings,
                    socialLinks: { ...websiteSettings.socialLinks, twitter: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <p className="text-[11px] text-zinc-500">Direct link to your X (Twitter) handle.</p>
            </div>

            {/* GitHub */}
            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
              <label className="block text-xs font-bold text-white flex items-center gap-2">
                <Github className="w-4 h-4 text-purple-400" />
                <span>GitHub Profile URL</span>
              </label>
              <input
                type="url"
                placeholder="e.g., https://github.com/your_username"
                value={websiteSettings.socialLinks?.github || ''}
                onChange={(e) =>
                  setWebsiteSettings({
                    ...websiteSettings,
                    socialLinks: { ...websiteSettings.socialLinks, github: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <p className="text-[11px] text-zinc-500">Direct link to your GitHub developer profile.</p>
            </div>

            {/* Discord */}
            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
              <label className="block text-xs font-bold text-white flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-indigo-400" />
                <span>Discord Server/Invite URL</span>
              </label>
              <input
                type="url"
                placeholder="e.g., https://discord.gg/your_invite"
                value={websiteSettings.socialLinks?.discord || ''}
                onChange={(e) =>
                  setWebsiteSettings({
                    ...websiteSettings,
                    socialLinks: { ...websiteSettings.socialLinks, discord: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <p className="text-[11px] text-zinc-500">Direct invite link to your Discord community server.</p>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={() => {
                promptStore.updateWebsiteSettings(websiteSettings);
                showToast('✓ Social Links Saved', 'All social media profile links have been updated');
              }}
              className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>Save Social Links</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB: CLOUDINARY SETTINGS */}
      {activeTab === 'cloudinary' && (
        <div className="p-6 rounded-3xl bg-zinc-900/90 border border-zinc-800 space-y-6 max-w-4xl">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Cloud className="w-5 h-5 text-sky-400" />
                <span>Cloudinary CDN Settings</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Configure Cloudinary image storage for fast CDN prompt image uploads
              </p>
            </div>

            <button
              onClick={() => {
                promptStore.updateCloudinarySettings(cloudinarySettings);
                showToast('✓ Cloudinary Settings Saved', 'Cloudinary configuration updated');
              }}
              className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-lg shadow-sky-500/20 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>Save Cloudinary Settings</span>
            </button>
          </div>

          <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800/80 space-y-4 text-xs">
            <div>
              <label className="block text-[11px] font-bold uppercase text-zinc-400 mb-1">
                Cloud Name
              </label>
              <input
                type="text"
                value={cloudinarySettings.cloudName}
                onChange={(e) =>
                  setCloudinarySettings({ ...cloudinarySettings, cloudName: e.target.value })
                }
                placeholder="e.g., sahil-edits"
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-zinc-400 mb-1">
                Unsigned Upload Preset
              </label>
              <input
                type="text"
                value={cloudinarySettings.uploadPreset}
                onChange={(e) =>
                  setCloudinarySettings({ ...cloudinarySettings, uploadPreset: e.target.value })
                }
                placeholder="e.g., ml_default"
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white font-mono"
              />
            </div>

            <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 text-zinc-400 space-y-2">
              <p className="font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Integration Status: {cloudinarySettings.cloudName ? 'Connected & Active' : 'Not Configured'}</span>
              </p>
              <p className="text-[11px]">
                When configured, admin prompt image uploads go directly to your Cloudinary CDN account.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB: FIREBASE SETTINGS */}
      {activeTab === 'firebase' && (
        <div className="p-6 rounded-3xl bg-zinc-900/90 border border-zinc-800 space-y-6 max-w-4xl">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Database className="w-5 h-5 text-amber-500" />
                <span>Firebase Authentication & Firestore Database</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Firebase Firestore cloud persistence & Firebase Authentication management
              </p>
            </div>

            <button
              onClick={async () => {
                try {
                  await testConnection();
                  showToast('✓ Firebase Connected', 'Firestore database connection tested successfully!');
                } catch (err: any) {
                  const code = err?.code ? `[${err.code}] ` : '';
                  const msg = `${code}${err?.message || String(err)}`;
                  showToast('Firebase Error', msg, 'error');
                }
              }}
              className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-lg shadow-amber-500/20 flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Test Connection</span>
            </button>
          </div>

          <div className="space-y-4 text-xs">
            <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Firestore Cloud Database Configuration
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800">
                  <span className="text-[10px] text-zinc-500 block uppercase font-bold">Project ID</span>
                  <span className="text-xs font-mono font-bold text-white">ai-studio-sahiledits-c87baa5c</span>
                </div>
                <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800">
                  <span className="text-[10px] text-zinc-500 block uppercase font-bold">Firestore Database ID</span>
                  <span className="text-xs font-mono font-bold text-white truncate block">
                    ai-studio-sahiledits-c87baa5c-a269-446e-ae1f-2e996ad4358d
                  </span>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-blue-400">
                Firebase Authentication Status
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800">
                  <span className="text-[10px] text-zinc-500 block uppercase font-bold">Auth Engine</span>
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Firebase Email & Password Auth
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800">
                  <span className="text-[10px] text-zinc-500 block uppercase font-bold">Current Logged Admin</span>
                  <span className="text-xs font-mono font-bold text-white truncate block mt-0.5">
                    {currentUser?.email || 'mdsahil012002@gmail.com'}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs space-y-1">
              <p className="font-bold flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-400" />
                <span>Protected Admin Control</span>
              </p>
              <p>
                All Admin Dashboard routes and mutations are protected. Only authenticated Firebase users with administrator rights can modify settings or posts.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB: COMMENTS & NOTIFICATIONS */}
      {activeTab === 'comments' && (
        <div className="p-6 rounded-3xl bg-zinc-900/90 border border-zinc-800 space-y-6 max-w-5xl">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-amber-500" />
                <span>Comments & Admin Alerts Engine</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Approve or moderate user comments and inspect real-time system alerts
              </p>
            </div>

            <button
              onClick={handleSaveCommentsSettings}
              className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs"
            >
              Save Settings
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-zinc-950 border border-zinc-800">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={commentsSettings.enabled}
                onChange={(e) =>
                  setCommentsSettings({ ...commentsSettings, enabled: e.target.checked })
                }
                className="w-4 h-4 rounded text-amber-500"
              />
              <span className="text-xs font-bold text-white">Enable Public Comments</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={commentsSettings.autoApprove}
                onChange={(e) =>
                  setCommentsSettings({ ...commentsSettings, autoApprove: e.target.checked })
                }
                className="w-4 h-4 rounded text-amber-500"
              />
              <span className="text-xs font-bold text-white">Auto-Approve Comments</span>
            </label>
          </div>

          {/* Comment List */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase text-zinc-400">
              Submitted Comments ({comments.length})
            </h4>

            {comments.length === 0 ? (
              <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-800 text-center text-xs text-zinc-500">
                No user comments submitted yet.
              </div>
            ) : (
              comments.map((cmt) => (
                <div
                  key={cmt.id}
                  className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-white">{cmt.authorName}</span>
                      <span className="text-[10px] text-zinc-500">({cmt.authorEmail || 'Anonymous'})</span>
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          cmt.status === 'approved'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-amber-500/20 text-amber-400'
                        }`}
                      >
                        {cmt.status}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-300 mt-1">{cmt.content}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    {cmt.status !== 'approved' && (
                      <button
                        onClick={() => handleApproveComment(cmt.id)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold"
                      >
                        Approve
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteComment(cmt.id)}
                      className="px-3 py-1.5 rounded-xl bg-rose-600/20 text-rose-400 text-xs font-bold"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB: LOGO MANAGER */}
      {activeTab === 'logo' && <LogoManager />}

      {/* TAB: DEPLOYMENT GUIDE */}
      {activeTab === 'deployment' && (
        <div className="space-y-8 max-w-5xl">
          <DeploymentGuide />

          {/* Backup & Restore Component Inside Deployment Guide */}
          <div className="p-6 rounded-3xl bg-zinc-900/90 border border-zinc-800 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Database className="w-5 h-5 text-emerald-400" />
                  <span>Backup & Restore System</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Export full site data as JSON or restore from existing backup file
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Export */}
              <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4 flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3">
                    <Download className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-base text-white">Export Complete Backup</h4>
                  <p className="text-xs text-zinc-400 mt-1">
                    Downloads all prompts, categories, custom pages, monetization, and SEO settings into a timestamped JSON file.
                  </p>
                </div>
                <button
                  onClick={handleExportBackup}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
                >
                  <Download className="w-4 h-4" />
                  <span>Export JSON Backup</span>
                </button>
              </div>

              {/* Import */}
              <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4 flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-3">
                    <Upload className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-base text-white">Restore Database Backup</h4>
                  <p className="text-xs text-zinc-400 mt-1">
                    Upload a previously saved `.json` backup file to restore full site state.
                  </p>
                </div>

                <label className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 cursor-pointer">
                  <Upload className="w-4 h-4" />
                  <span>Select Backup JSON File</span>
                  <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 9: ACTIVITY LOG */}
      {activeTab === 'activity' && (
        <div className="p-6 rounded-3xl bg-zinc-900/90 border border-zinc-800 space-y-4">
          <h3 className="font-bold text-base text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-500" />
            <span>Recent System Activity</span>
          </h3>

          <div className="space-y-2">
            {activities.length === 0 ? (
              <p className="text-xs text-zinc-500">No activity recorded yet.</p>
            ) : (
              activities.map((act) => (
                <div
                  key={act.id}
                  className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800/80 flex items-center justify-between text-xs"
                >
                  <span className="text-zinc-200">{act.message}</span>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    {new Date(act.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* CUSTOM PAGE BUILDER MODAL */}
      {isPageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="font-bold text-lg text-white">
                {editingPage ? 'Edit Custom Page' : 'Create Custom Page'}
              </h3>
              <button onClick={() => setIsPageModalOpen(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePageSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-zinc-400">Page Title *</label>
                  <input
                    type="text"
                    value={pageFormTitle}
                    onChange={(e) => setPageFormTitle(e.target.value)}
                    placeholder="e.g. Terms of Service"
                    className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-zinc-400">Page Slug</label>
                  <input
                    type="text"
                    value={pageFormSlug}
                    onChange={(e) => setPageFormSlug(e.target.value)}
                    placeholder="terms-of-service"
                    className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-zinc-400">Content (Markdown supported) *</label>
                <textarea
                  rows={8}
                  value={pageFormContent}
                  onChange={(e) => setPageFormContent(e.target.value)}
                  placeholder="Write page content here..."
                  className="w-full p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white font-mono"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={pageFormSeoTitle}
                  onChange={(e) => setPageFormSeoTitle(e.target.value)}
                  placeholder="SEO Title"
                  className="px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white"
                />
                <input
                  type="text"
                  value={pageFormMetaDesc}
                  onChange={(e) => setPageFormMetaDesc(e.target.value)}
                  placeholder="Meta Description"
                  className="px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
                <select
                  value={pageFormStatus}
                  onChange={(e) => setPageFormStatus(e.target.value as 'published' | 'draft')}
                  className="px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-bold text-white"
                >
                  <option value="published">Published</option>
                  <option value="draft">Save Draft</option>
                </select>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsPageModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg"
                  >
                    Save Page
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      {deleteConfirmTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md p-6 rounded-3xl bg-zinc-900 border border-zinc-800 shadow-2xl space-y-5">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Delete Post</h3>
                <p className="text-xs text-zinc-400">
                  {deleteConfirmTarget.type === 'bulk'
                    ? `${deleteConfirmTarget.count} posts selected`
                    : deleteConfirmTarget.title || 'Selected post'}
                </p>
              </div>
            </div>

            <p className="text-sm font-medium text-zinc-200">
              Are you sure you want to delete this post?
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmTarget(null)}
                disabled={isDeleting}
                className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-rose-600/20 flex items-center gap-2 transition-all"
              >
                {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* IMPORT POST FROM URL SECTION */}
      <ImportPostSection
        isOpen={isImportModalOpen}
        categories={categories}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={() => {
          onRefreshData();
          setIsImportModalOpen(false);
        }}
      />
    </div>
  );
};
