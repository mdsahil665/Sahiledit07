import React, { useState } from 'react';
import { FeatureControls } from '../../types';
import { promptStore } from '../../services/promptStore';
import { useToast } from '../Toast';
import {
  Sliders,
  Search,
  Power,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Sparkles,
  Image as ImageIcon,
  DollarSign,
  Globe,
  Shield,
  Cpu,
  Zap,
  Lock,
  Layers,
  MessageSquare,
  Share2,
  Eye,
  Copy,
  Download,
  Bell,
  User,
  Heart,
  FileText,
  Clock,
  Check,
  ToggleLeft,
  ToggleRight,
  Filter,
} from 'lucide-react';

interface FeatureControlCenterProps {
  featureControls: FeatureControls;
}

interface FeatureItem {
  key: keyof FeatureControls;
  label: string;
  description: string;
  category: 'GENERAL' | 'SHARE SETTINGS' | 'SOCIAL MEDIA' | 'POST FEATURES' | 'MONETIZATION' | 'SEO' | 'SECURITY' | 'ADVANCED';
}

const ALL_FEATURES: FeatureItem[] = [
  // SHARE SETTINGS (POST DETAIL ONLY)
  { key: 'postShareEnabled', label: 'Master Post Share Switch', description: 'Master switch to show or hide the Share section in opened post details.', category: 'SHARE SETTINGS' },
  { key: 'shareFacebookToggle', label: 'Facebook Share', description: 'Enable or disable Facebook button in post share section.', category: 'SHARE SETTINGS' },
  { key: 'shareTwitterToggle', label: 'Twitter / X Share', description: 'Enable or disable Twitter / X button in post share section.', category: 'SHARE SETTINGS' },
  { key: 'shareThreadsToggle', label: 'Threads Share', description: 'Enable or disable Threads button in post share section.', category: 'SHARE SETTINGS' },
  { key: 'sharePinterestToggle', label: 'Pinterest Share', description: 'Enable or disable Pinterest button in post share section.', category: 'SHARE SETTINGS' },
  { key: 'shareWhatsappToggle', label: 'WhatsApp Share', description: 'Enable or disable WhatsApp button in post share section.', category: 'SHARE SETTINGS' },
  { key: 'shareTelegramToggle', label: 'Telegram Share', description: 'Enable or disable Telegram button in post share section.', category: 'SHARE SETTINGS' },
  { key: 'shareCopyLinkToggle', label: 'Copy Link Share', description: 'Enable or disable Copy Link button in post share section.', category: 'SHARE SETTINGS' },

  // GENERAL
  { key: 'maintenanceMode', label: 'Website Maintenance Mode', description: 'Restricts public access and displays maintenance screen to non-admin visitors.', category: 'GENERAL' },
  { key: 'darkMode', label: 'Dark Mode', description: 'Enables dark theme background and UI components across the site.', category: 'GENERAL' },
  { key: 'searchBar', label: 'Search Bar', description: 'Displays search inputs in header, hero section, and modals.', category: 'GENERAL' },
  { key: 'homepageBanner', label: 'Homepage Banner', description: 'Displays main hero section, tagline, and intro banner on homepage.', category: 'GENERAL' },
  { key: 'latestPostsSection', label: 'Latest Posts Section', description: 'Displays the latest prompt posts grid on main views.', category: 'GENERAL' },
  { key: 'infiniteScroll', label: 'Infinite Scroll', description: 'Automatically loads more prompt cards when scrolling near the bottom.', category: 'GENERAL' },
  { key: 'loadMoreButton', label: 'Load More Button', description: 'Displays manual "Load More" button at bottom of prompt lists.', category: 'GENERAL' },
  { key: 'footer', label: 'Footer', description: 'Displays site footer containing brand, quick links, and social links.', category: 'GENERAL' },
  { key: 'backToTopButton', label: 'Back To Top Button', description: 'Displays floating scroll-to-top button in lower right corner.', category: 'GENERAL' },
  { key: 'copyButton', label: 'Copy Button', description: 'Enables 1-click prompt copy buttons on cards and post modals.', category: 'GENERAL' },
  { key: 'downloadImageButton', label: 'Download Image Button', description: 'Displays button to save/download high quality prompt images.', category: 'GENERAL' },
  { key: 'viewCounter', label: 'View Counter', description: 'Displays view count badge on prompt cards and detail modal.', category: 'GENERAL' },
  { key: 'copyCounter', label: 'Copy Counter', description: 'Displays total copy count badge on prompt cards and detail modal.', category: 'GENERAL' },
  { key: 'relatedPosts', label: 'Related Posts', description: 'Displays related prompt suggestions inside post detail modal.', category: 'GENERAL' },
  { key: 'featuredPosts', label: 'Featured Posts', description: 'Enables featured post badges, filter tab, and priority sorting.', category: 'GENERAL' },
  { key: 'trendingPosts', label: 'Trending Posts', description: 'Enables trending post badges and trending filter tab.', category: 'GENERAL' },
  { key: 'categories', label: 'Categories', description: 'Displays category filter pills and navigation badges.', category: 'GENERAL' },
  { key: 'comments', label: 'Comments', description: 'Enables user comment section on prompt detail modal.', category: 'GENERAL' },
  { key: 'userLogin', label: 'User Login', description: 'Enables user login modal and account authentication flow.', category: 'GENERAL' },
  { key: 'userRegistration', label: 'User Registration', description: 'Allows new visitors to create account profiles.', category: 'GENERAL' },
  { key: 'profilePage', label: 'Profile Page', description: 'Enables user profile view and account settings modal.', category: 'GENERAL' },
  { key: 'favorites', label: 'Favorites', description: 'Enables bookmarking/saving favorite prompts to local profile.', category: 'GENERAL' },
  { key: 'notifications', label: 'Notifications', description: 'Enables system notification bell and dropdown center in header.', category: 'GENERAL' },

  // SOCIAL MEDIA (FOOTER & CONTACT PROFILE LINKS)
  { key: 'footerSocialLinks', label: 'Footer Social Links Switch', description: 'Master switch to show or hide profile social icons in footer and contact sections.', category: 'SOCIAL MEDIA' },
  { key: 'footerInstagramToggle', label: 'Instagram Profile Link', description: 'Enable or disable Instagram profile link in footer.', category: 'SOCIAL MEDIA' },
  { key: 'footerFacebookToggle', label: 'Facebook Profile Link', description: 'Enable or disable Facebook page link in footer.', category: 'SOCIAL MEDIA' },
  { key: 'footerTwitterToggle', label: 'X (Twitter) Profile Link', description: 'Enable or disable X / Twitter handle in footer.', category: 'SOCIAL MEDIA' },
  { key: 'footerWhatsappToggle', label: 'WhatsApp Direct Chat Link', description: 'Enable or disable WhatsApp direct chat link in footer.', category: 'SOCIAL MEDIA' },
  { key: 'footerTelegramToggle', label: 'Telegram Channel Link', description: 'Enable or disable Telegram channel link in footer.', category: 'SOCIAL MEDIA' },
  { key: 'footerYoutubeToggle', label: 'YouTube Channel Link', description: 'Enable or disable YouTube channel link in footer.', category: 'SOCIAL MEDIA' },
  { key: 'footerGithubToggle', label: 'GitHub Profile Link', description: 'Enable or disable GitHub profile link in footer.', category: 'SOCIAL MEDIA' },
  { key: 'footerDiscordToggle', label: 'Discord Server Link', description: 'Enable or disable Discord server invite link in footer.', category: 'SOCIAL MEDIA' },

  // POST FEATURES
  { key: 'imageUpload', label: 'Image Upload', description: 'Allows uploading local file images when creating or editing posts.', category: 'POST FEATURES' },
  { key: 'imageUrl', label: 'Image URL', description: 'Allows specifying custom image web URLs for prompt posts.', category: 'POST FEATURES' },
  { key: 'timerLock', label: 'Timer Lock', description: 'Enforces countdown timer requirement before revealing full prompt text.', category: 'POST FEATURES' },
  { key: 'promptVisibility', label: 'Prompt Visibility', description: 'Displays full prompt text preview before copy action.', category: 'POST FEATURES' },
  { key: 'promptCopy', label: 'Prompt Copy', description: 'Allows users to copy prompt text to clipboard.', category: 'POST FEATURES' },
  { key: 'promptDownload', label: 'Prompt Download', description: 'Allows users to download prompt text as a plain text file.', category: 'POST FEATURES' },
  { key: 'autoPublish', label: 'Auto Publish', description: 'Automatically marks newly created prompt posts as Published.', category: 'POST FEATURES' },
  { key: 'draftSystem', label: 'Draft System', description: 'Enables draft post saving and draft filtering options.', category: 'POST FEATURES' },
  { key: 'schedulePost', label: 'Schedule Post', description: 'Enables post scheduling for future publication dates.', category: 'POST FEATURES' },

  // MONETIZATION
  { key: 'masterAdsSwitch', label: 'Master Ads Switch', description: 'Global master toggle to enable or disable all advertisements.', category: 'MONETIZATION' },
  { key: 'googleAdSense', label: 'Google AdSense', description: 'Enables Google AdSense ad units and auto-ads scripts.', category: 'MONETIZATION' },
  { key: 'monetag', label: 'Monetag', description: 'Enables Monetag ad network script integration.', category: 'MONETIZATION' },
  { key: 'propellerAds', label: 'PropellerAds', description: 'Enables PropellerAds push and banner integration.', category: 'MONETIZATION' },
  { key: 'adsterra', label: 'Adsterra', description: 'Enables Adsterra ad network scripts.', category: 'MONETIZATION' },
  { key: 'mediaNet', label: 'Media.net', description: 'Enables Media.net contextual ad unit scripts.', category: 'MONETIZATION' },
  { key: 'customAds', label: 'Custom Ads', description: 'Enables custom HTML and banner ad code placements.', category: 'MONETIZATION' },
  { key: 'topBannerAd', label: 'Top Banner', description: 'Displays top leaderboard advertisement banner under header.', category: 'MONETIZATION' },
  { key: 'bottomBannerAd', label: 'Bottom Banner', description: 'Displays bottom advertisement banner above footer.', category: 'MONETIZATION' },
  { key: 'inFeedAds', label: 'In-feed Ads', description: 'Displays native advertisement cards inside post grid lists.', category: 'MONETIZATION' },
  { key: 'insidePostAds', label: 'Inside Post Ads', description: 'Displays ad units inside prompt post detail modal.', category: 'MONETIZATION' },
  { key: 'stickyAds', label: 'Sticky Ads', description: 'Displays sticky bottom floating advertisement bar.', category: 'MONETIZATION' },

  // SEO
  { key: 'sitemap', label: 'Sitemap', description: 'Enables dynamic sitemap header meta tags and search indexing.', category: 'SEO' },
  { key: 'robotsTxt', label: 'Robots.txt', description: 'Serves search engine crawler guidelines and indexing rules.', category: 'SEO' },
  { key: 'openGraph', label: 'Open Graph', description: 'Injects OpenGraph meta tags for rich Facebook & WhatsApp share previews.', category: 'SEO' },
  { key: 'schemaMarkup', label: 'Schema', description: 'Injects JSON-LD structured data schema for rich Google search results.', category: 'SEO' },
  { key: 'metaTags', label: 'Meta Tags', description: 'Injects dynamic meta title, description, and keywords tags.', category: 'SEO' },

  // SECURITY
  { key: 'firebaseAuth', label: 'Firebase Authentication', description: 'Enables Firebase Firestore & Auth integration rules.', category: 'SECURITY' },
  { key: 'adminLogin', label: 'Admin Login', description: 'Enables admin authentication flow and protected routes.', category: 'SECURITY' },
  { key: 'rateLimiting', label: 'Rate Limiting', description: 'Enforces client-side rate limiting on copy actions and API requests.', category: 'SECURITY' },
  { key: 'activityLogs', label: 'Activity Logs', description: 'Records administrative action audit trails to Firestore and storage.', category: 'SECURITY' },
  { key: 'cloudinaryUpload', label: 'Cloudinary Upload', description: 'Enables direct cloud image hosting via Cloudinary API.', category: 'SECURITY' },
  { key: 'backupSystem', label: 'Backup System', description: 'Enables 1-click JSON database backup download and restoration tools.', category: 'SECURITY' },

  // ADVANCED
  { key: 'developerMode', label: 'Enable Developer Mode', description: 'Displays developer inspection tools and JSON state payloads.', category: 'ADVANCED' },
  { key: 'debugMode', label: 'Enable Debug Mode', description: 'Logs detailed event debug info to browser console.', category: 'ADVANCED' },
  { key: 'cacheControl', label: 'Cache Control', description: 'Enables browser localStorage caching for ultra-fast instant loads.', category: 'ADVANCED' },
  { key: 'performanceMode', label: 'Performance Mode', description: 'Optimizes image rendering and animation frame rates.', category: 'ADVANCED' },
];

const CATEGORY_ICONS = {
  GENERAL: Sparkles,
  'SHARE SETTINGS': Share2,
  'SOCIAL MEDIA': Share2,
  'POST FEATURES': FileText,
  MONETIZATION: DollarSign,
  SEO: Globe,
  SECURITY: Shield,
  ADVANCED: Cpu,
};

export const FeatureControlCenter: React.FC<FeatureControlCenterProps> = ({ featureControls }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('ALL');
  const [isUpdating, setIsUpdating] = useState(false);
  const { showToast } = useToast();

  const handleToggle = async (key: keyof FeatureControls) => {
    const newValue = !featureControls[key];
    try {
      await promptStore.updateFeatureControls({ [key]: newValue });
      showToast(
        `Feature Updated`,
        `${ALL_FEATURES.find((f) => f.key === key)?.label || key} is now ${newValue ? 'ENABLED' : 'DISABLED'}`,
        newValue ? 'success' : 'info'
      );
    } catch (e) {
      showToast('Update Failed', 'Failed to save feature setting to Firestore', 'error');
    }
  };

  const handleEnableAll = async () => {
    setIsUpdating(true);
    try {
      await promptStore.enableAllFeatureControls();
      showToast('All Features Enabled', 'All website feature toggles are now active.', 'success');
    } catch (e) {
      showToast('Error', 'Failed to update features.', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDisableAll = async () => {
    setIsUpdating(true);
    try {
      await promptStore.disableAllFeatureControls();
      showToast('Features Disabled', 'All non-critical features are now disabled.', 'info');
    } catch (e) {
      showToast('Error', 'Failed to update features.', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRestoreDefaults = async () => {
    setIsUpdating(true);
    try {
      await promptStore.restoreDefaultFeatureControls();
      showToast('Defaults Restored', 'Feature controls restored to factory settings.', 'success');
    } catch (e) {
      showToast('Error', 'Failed to restore default settings.', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredFeatures = ALL_FEATURES.filter((item) => {
    const matchesCategory = activeCategoryFilter === 'ALL' || item.category === activeCategoryFilter;
    const matchesSearch =
      item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const categories = ['ALL', 'SHARE SETTINGS', 'GENERAL', 'POST FEATURES', 'MONETIZATION', 'SEO', 'SECURITY', 'ADVANCED'];

  const getCategoryStats = (cat: string) => {
    const items = ALL_FEATURES.filter((f) => cat === 'ALL' || f.category === cat);
    const enabledCount = items.filter((f) => featureControls[f.key]).length;
    return { total: items.length, enabled: enabledCount };
  };

  const totalEnabled = Object.values(featureControls).filter(Boolean).length;
  const totalCount = ALL_FEATURES.length;

  return (
    <div className="space-y-6">
      {/* HEADER CARD */}
      <div className="p-6 rounded-3xl bg-zinc-900/90 border border-zinc-800 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-2xl bg-blue-600/10 text-blue-400 border border-blue-500/20 flex items-center justify-center">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white flex items-center gap-2">
                  <span>Feature Control Center</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-bold uppercase tracking-wider">
                    {totalEnabled} / {totalCount} Active
                  </span>
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Toggle features ON or OFF with instant real-time synchronization to Firebase Firestore
                </p>
              </div>
            </div>
          </div>

          {/* QUICK ACTION BUTTONS */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleEnableAll}
              disabled={isUpdating}
              className="px-3.5 py-2 rounded-xl bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Enable All</span>
            </button>

            <button
              onClick={handleDisableAll}
              disabled={isUpdating}
              className="px-3.5 py-2 rounded-xl bg-red-600/15 hover:bg-red-600/25 text-red-400 border border-red-500/30 text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <Power className="w-3.5 h-3.5" />
              <span>Disable All</span>
            </button>

            <button
              onClick={handleRestoreDefaults}
              disabled={isUpdating}
              className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restore Default Settings</span>
            </button>
          </div>
        </div>

        {/* SEARCH & CATEGORY FILTER BAR */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search feature toggle, key, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-blue-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>

          {/* Category Badges */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 md:pb-0">
            {categories.map((cat) => {
              const stats = getCategoryStats(cat);
              const isActive = activeCategoryFilter === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                      : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
                  }`}
                >
                  <span>{cat}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-zinc-800 text-zinc-400'}`}>
                    {stats.enabled}/{stats.total}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* FEATURE GRID GROUPED BY CATEGORY */}
      {categories
        .filter((cat) => cat !== 'ALL' && (activeCategoryFilter === 'ALL' || activeCategoryFilter === cat))
        .map((cat) => {
          const categoryItems = filteredFeatures.filter((f) => f.category === cat);
          if (categoryItems.length === 0) return null;

          const IconComponent = CATEGORY_ICONS[cat as keyof typeof CATEGORY_ICONS] || Sparkles;
          const catStats = getCategoryStats(cat);

          return (
            <div key={cat} className="space-y-3">
              {/* CATEGORY TITLE BANNER */}
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
                    <IconComponent className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-extrabold uppercase tracking-wider text-white">
                    {cat}
                  </h4>
                </div>
                <span className="text-xs font-bold text-zinc-400">
                  {catStats.enabled} / {catStats.total} Enabled
                </span>
              </div>

              {/* CARDS GRID */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {categoryItems.map((item) => {
                  const isEnabled = Boolean(featureControls[item.key]);

                  return (
                    <div
                      key={item.key}
                      onClick={() => handleToggle(item.key)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer select-none flex flex-col justify-between space-y-3 ${
                        isEnabled
                          ? 'bg-zinc-900/90 border-blue-500/40 hover:border-blue-500/70 shadow-md shadow-blue-500/5'
                          : 'bg-zinc-950/80 border-zinc-800/80 hover:border-zinc-700 opacity-75'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors">
                              {item.label}
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                            {item.description}
                          </p>
                        </div>

                        {/* TOGGLE SWITCH */}
                        <div
                          className={`w-11 h-6 rounded-full p-1 transition-colors relative flex-shrink-0 flex items-center ${
                            isEnabled ? 'bg-blue-600' : 'bg-zinc-800'
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded-full bg-white transition-transform ${
                              isEnabled ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-zinc-800/60 text-[10px]">
                        <span className="font-mono text-zinc-500">key: {item.key}</span>
                        <span
                          className={`font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                            isEnabled
                              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                              : 'bg-zinc-800/60 text-zinc-500 border border-zinc-800'
                          }`}
                        >
                          {isEnabled ? 'ACTIVE' : 'OFF'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

      {filteredFeatures.length === 0 && (
        <div className="p-12 text-center rounded-3xl bg-zinc-900/50 border border-zinc-800 space-y-3">
          <Search className="w-8 h-8 text-zinc-600 mx-auto" />
          <h4 className="text-sm font-bold text-zinc-300">No Features Found</h4>
          <p className="text-xs text-zinc-500">
            No features match your search query "{searchQuery}".
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setActiveCategoryFilter('ALL');
            }}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
};
