export type CategoryId = string;

export interface Category {
  id: CategoryId;
  name: string;
  slug: string;
  icon: string; // Lucide icon name
  color: string; // Tailwind color class or hex
  bgLight: string;
  description: string;
  count?: number;
}

export type PostStatus = 'published' | 'draft' | 'scheduled';

export interface PostTimerOverride {
  enabled: boolean;
  seconds?: number;
}

export interface PostCardConfig {
  badgeVisible: boolean;
  badgeText: string;
  categoryLabelVisible: boolean;
  categoryLabelText?: string;
  titleVisible: boolean;
  descriptionVisible: boolean;
  viewsVisible: boolean;
  likeButtonVisible: boolean;
  shareButtonVisible: boolean;
  copyButtonVisible: boolean;
  creatorVisible: boolean;
  creatorText: string;
  imageVisible: boolean;
  imageOverlay: boolean;
  imageOpacity: number; // 0 to 100, default 100
  glassPanelVisible: boolean;
}

export const DEFAULT_POST_CARD_CONFIG: PostCardConfig = {
  badgeVisible: true,
  badgeText: 'AI PROMPT',
  categoryLabelVisible: true,
  categoryLabelText: '',
  titleVisible: true,
  descriptionVisible: true,
  viewsVisible: true,
  likeButtonVisible: true,
  shareButtonVisible: true,
  copyButtonVisible: true,
  creatorVisible: true,
  creatorText: 'Sahil Edits',
  imageVisible: true,
  imageOverlay: false,
  imageOpacity: 100,
  glassPanelVisible: true,
};

export interface PromptPost {
  id: string;
  title: string;
  shortDescription: string;
  fullPrompt: string;
  categoryId: CategoryId;
  categoryName?: string;
  tags: string[];
  imageUrl: string;
  images?: string[];
  gallery?: string[];
  views: number;
  copies: number;
  likes?: number;
  cardConfig?: Partial<PostCardConfig>;
  featured: boolean;
  trending: boolean;
  status: PostStatus;
  scheduledDate?: string;
  createdAt: string;
  updatedAt: string;
  seoTitle?: string;
  metaDescription?: string;
  pinned?: boolean;
  timerOverride?: PostTimerOverride;
}

export interface AdminStats {
  totalPosts: number;
  totalCategories: number;
  totalPages: number;
  totalViews: number;
  totalCopies: number;
  draftCount: number;
  scheduledCount: number;
}

export interface RecentActivity {
  id: string;
  type:
    | 'create_post'
    | 'edit_post'
    | 'delete_post'
    | 'create_category'
    | 'copy_prompt'
    | 'create_page'
    | 'edit_page'
    | 'delete_page'
    | 'update_settings'
    | 'backup_restore';
  message: string;
  timestamp: string;
}

export type SortOption = 'newest' | 'popular' | 'trending' | 'alphabetical';

// --- MONETIZATION TYPES ---
export type AdNetworkId = 'adsense' | 'monetag' | 'propeller' | 'adsterra' | 'medianet' | 'custom';

export interface AdNetworkConfig {
  id: AdNetworkId;
  name: string;
  publisherId: string; // Publisher ID or Zone ID
  scriptCode: string;  // Script Code or Embed HTML
  enabled: boolean;
}

export interface AdPositions {
  topBanner: boolean;
  bottomBanner: boolean;
  homepageBanner: boolean;
  betweenPosts: boolean;
  insidePostTop: boolean;
  insidePrompt: boolean;
  belowPrompt: boolean;
  beforeCopyButton: boolean;
  afterCopyButton: boolean;
  stickyBottomBanner: boolean;
  desktopSidebar: boolean;
  footerBanner: boolean;
}

export interface EarningsData {
  estimatedEarnings: number | null;
  todayRevenue: number | null;
  yesterdayRevenue: number | null;
  thisMonthRevenue: number | null;
  impressions: number | null;
  clicks: number | null;
  ctr: number | null;
  rpm: number | null;
  fillRate: number | null;
}

export interface MonetizationSettings {
  publisherId: string;
  enabled: boolean;
  testMode: boolean;
  activeNetwork: AdNetworkId;
  positions: AdPositions;
  adFrequency: number; // Show ad after N posts (default 3)
  networks: Record<AdNetworkId, AdNetworkConfig>;
}

// --- TIMER TYPES ---
export interface TimerSettings {
  enabled: boolean;
  defaultSeconds: number; // Default 5 seconds
}

// --- PAGES TYPES ---
export interface CustomPage {
  id: string;
  title: string;
  slug: string;
  content: string;
  seoTitle?: string;
  metaDescription?: string;
  featuredImage?: string;
  status: 'published' | 'draft';
  isSystem?: boolean;
  createdAt: string;
  updatedAt: string;
}

// --- SEO TYPES ---
export interface SeoSettings {
  websiteTitle: string;
  metaDescription: string;
  keywords: string;
  canonicalUrl: string;
  ogImage: string;
  twitterCard: 'summary' | 'summary_large_image';
  robotsTxt: string;
  authorName: string;
}

// --- SECURITY TYPES ---
export interface SecuritySettings {
  sessionTimeoutMinutes: number;
  twoFactorEnabled: boolean;
  rateLimitMaxAttempts: number;
  autoLogoutOnInactivity: boolean;
}

// --- WEBSITE SETTINGS ---
export interface SocialMediaLinks {
  enabled?: boolean;
  instagram: string;
  facebook: string;
  whatsapp: string;
  telegram: string;
  youtube: string;
  twitter: string;
  github: string;
  discord?: string;
}

export interface WebsiteSettings {
  websiteName: string;
  tagline: string;
  websiteLogo: string;
  favicon: string;
  homepageTitle: string;
  homepageSubtitle: string;
  footerText: string;
  primaryColor: string;
  accentColor: string;
  darkModeDefault: boolean;
  socialLinks: SocialMediaLinks;
  contactEmail: string;
  contactPhone: string;
  contactAddress: string;
  googleAnalyticsId: string;
  customCss: string;
  customJs: string;
  headerCode: string;
  footerCode: string;
}

// --- CLOUDINARY SETTINGS ---
export interface CloudinarySettings {
  cloudName: string;
  uploadPreset: string;
  folder: string;
}

// --- COMMENTS SETTINGS ---
export interface CommentsSettings {
  enabled: boolean;
  autoApprove: boolean;
  spamProtection: boolean;
  requireEmail: boolean;
}

export interface CommentItem {
  id: string;
  postId: string;
  postTitle?: string;
  authorName: string;
  authorEmail: string;
  content: string;
  status: 'approved' | 'pending' | 'spam';
  createdAt: string;
}

// --- NOTIFICATION TYPES ---
export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'post' | 'backup' | 'storage' | 'firebase' | 'cloudinary' | 'info';
  read: boolean;
  timestamp: string;
}

// --- FEATURE CONTROLS TYPES ---
export interface FeatureControls {
  // GENERAL
  maintenanceMode: boolean;
  darkMode: boolean;
  searchBar: boolean;
  homepageBanner: boolean;
  latestPostsSection: boolean;
  infiniteScroll: boolean;
  loadMoreButton: boolean;
  footer: boolean;
  backToTopButton: boolean;
  socialShareButtons: boolean;
  copyButton: boolean;
  downloadImageButton: boolean;
  viewCounter: boolean;
  copyCounter: boolean;
  relatedPosts: boolean;
  featuredPosts: boolean;
  trendingPosts: boolean;
  categories: boolean;
  comments: boolean;
  userLogin: boolean;
  userRegistration: boolean;
  profilePage: boolean;
  favorites: boolean;
  notifications: boolean;

  // POST SHARE CONTROLS (Post Detail Modal Only)
  postShareEnabled: boolean;
  shareFacebookToggle: boolean;
  shareTwitterToggle: boolean;
  shareThreadsToggle: boolean;
  sharePinterestToggle: boolean;
  shareWhatsappToggle: boolean;
  shareTelegramToggle: boolean;
  shareCopyLinkToggle: boolean;

  // FOOTER / CONTACT SOCIAL LINKS (Profile Links Only)
  footerSocialLinks: boolean;
  footerInstagramToggle: boolean;
  footerFacebookToggle: boolean;
  footerTwitterToggle: boolean;
  footerTelegramToggle: boolean;
  footerYoutubeToggle: boolean;
  footerWhatsappToggle: boolean;
  footerGithubToggle: boolean;
  footerDiscordToggle: boolean;

  // LEGACY ALIAS TOGGLES
  instagramToggle: boolean;
  facebookToggle: boolean;
  twitterToggle: boolean;
  threadsToggle: boolean;
  pinterestToggle: boolean;
  whatsappToggle: boolean;
  copyLinkToggle: boolean;
  telegramToggle: boolean;
  youtubeToggle: boolean;
  githubToggle: boolean;
  discordToggle: boolean;

  // POST FEATURES
  imageUpload: boolean;
  imageUrl: boolean;
  multiImageGallery?: boolean;
  timerLock: boolean;
  promptVisibility: boolean;
  promptCopy: boolean;
  promptDownload: boolean;
  autoPublish: boolean;
  draftSystem: boolean;
  schedulePost: boolean;

  // MONETIZATION
  masterAdsSwitch: boolean;
  googleAdSense: boolean;
  monetag: boolean;
  propellerAds: boolean;
  adsterra: boolean;
  mediaNet: boolean;
  customAds: boolean;
  topBannerAd: boolean;
  bottomBannerAd: boolean;
  inFeedAds: boolean;
  insidePostAds: boolean;
  stickyAds: boolean;

  // SEO
  sitemap: boolean;
  robotsTxt: boolean;
  openGraph: boolean;
  schemaMarkup: boolean;
  metaTags: boolean;

  // SECURITY
  firebaseAuth: boolean;
  adminLogin: boolean;
  rateLimiting: boolean;
  activityLogs: boolean;
  cloudinaryUpload: boolean;
  backupSystem: boolean;

  // ADVANCED
  developerMode: boolean;
  debugMode: boolean;
  cacheControl: boolean;
  performanceMode: boolean;
}

export const DEFAULT_FEATURE_CONTROLS: FeatureControls = {
  // GENERAL
  maintenanceMode: false,
  darkMode: true,
  searchBar: true,
  homepageBanner: true,
  latestPostsSection: true,
  infiniteScroll: true,
  loadMoreButton: true,
  footer: true,
  backToTopButton: true,
  socialShareButtons: true,
  copyButton: true,
  downloadImageButton: true,
  viewCounter: true,
  copyCounter: true,
  relatedPosts: true,
  featuredPosts: true,
  trendingPosts: true,
  categories: true,
  comments: true,
  userLogin: true,
  userRegistration: true,
  profilePage: true,
  favorites: true,
  notifications: true,

  // POST SHARE CONTROLS (Post Detail Modal Only)
  postShareEnabled: true,
  shareFacebookToggle: true,
  shareTwitterToggle: true,
  shareThreadsToggle: true,
  sharePinterestToggle: true,
  shareWhatsappToggle: true,
  shareTelegramToggle: true,
  shareCopyLinkToggle: true,

  // FOOTER / CONTACT SOCIAL LINKS (Profile Links Only)
  footerSocialLinks: true,
  footerInstagramToggle: true,
  footerFacebookToggle: true,
  footerTwitterToggle: true,
  footerTelegramToggle: true,
  footerYoutubeToggle: true,
  footerWhatsappToggle: true,
  footerGithubToggle: true,
  footerDiscordToggle: true,

  // LEGACY ALIAS TOGGLES
  instagramToggle: true,
  facebookToggle: true,
  twitterToggle: true,
  threadsToggle: true,
  pinterestToggle: true,
  whatsappToggle: true,
  copyLinkToggle: true,
  telegramToggle: true,
  youtubeToggle: true,
  githubToggle: true,
  discordToggle: true,

  // POST FEATURES
  imageUpload: true,
  imageUrl: true,
  multiImageGallery: true,
  timerLock: true,
  promptVisibility: true,
  promptCopy: true,
  promptDownload: true,
  autoPublish: true,
  draftSystem: true,
  schedulePost: true,

  // MONETIZATION
  masterAdsSwitch: true,
  googleAdSense: true,
  monetag: true,
  propellerAds: true,
  adsterra: true,
  mediaNet: true,
  customAds: true,
  topBannerAd: true,
  bottomBannerAd: true,
  inFeedAds: true,
  insidePostAds: true,
  stickyAds: true,

  // SEO
  sitemap: true,
  robotsTxt: true,
  openGraph: true,
  schemaMarkup: true,
  metaTags: true,

  // SECURITY
  firebaseAuth: true,
  adminLogin: true,
  rateLimiting: true,
  activityLogs: true,
  cloudinaryUpload: true,
  backupSystem: true,

  // ADVANCED
  developerMode: false,
  debugMode: false,
  cacheControl: true,
  performanceMode: true,
};

// --- WEBSITE SECTIONS TYPES ---
export interface WebsiteSectionsSettings {
  header: boolean;
  hero: boolean;
  search: boolean;
  popularCategories: boolean;
  tabs: boolean;
  featuredPost: boolean;
  trendingPosts: boolean;
  postGallery: boolean;
  footer: boolean;
  backToTop: boolean;
  adBanners: boolean;
  categories: Record<string, boolean>;
  categoryPage: {
    breadcrumb: boolean;
    title: boolean;
    description: boolean;
    tabs: boolean;
    postGrid: boolean;
  };
  sectionHeights?: {
    hero: 'auto' | 'small' | 'medium' | 'large';
    categoryHeader: 'auto' | 'small' | 'medium' | 'large';
  };
}

export const DEFAULT_WEBSITE_SECTIONS: WebsiteSectionsSettings = {
  header: true,
  hero: true,
  search: true,
  popularCategories: true,
  tabs: true,
  featuredPost: true,
  trendingPosts: true,
  postGallery: true,
  footer: true,
  backToTop: true,
  adBanners: true,
  categories: {
    man: true,
    woman: true,
    couple: true,
    family: true,
    birthday: true,
  },
  categoryPage: {
    breadcrumb: true,
    title: true,
    description: true,
    tabs: true,
    postGrid: true,
  },
  sectionHeights: {
    hero: 'auto',
    categoryHeader: 'auto',
  },
};

// --- PREMIUM / SUBSCRIPTION SETTINGS ---
export interface PremiumSettings {
  enabled: boolean;
  showCrownIcon: boolean;
  premiumPageEnabled: boolean;
  premiumPurchaseEnabled: boolean;
  price: string;
  planName: string;
  planDescription: string;
  buttonText: string;
  headline: string;
  subtitle: string;
  benefits: string[];
  adsEnabled: boolean;
  // Payment Gateway & Pricing
  paymentGateway?: 'Razorpay';
  gatewayStatus?: boolean; // ON / OFF
  paymentMode?: 'TEST' | 'LIVE';
  razorpayKeyId?: string;
  razorpaySecretKeyMasked?: string;
}

export const DEFAULT_PREMIUM_SETTINGS: PremiumSettings = {
  enabled: true,
  showCrownIcon: true,
  premiumPageEnabled: true,
  premiumPurchaseEnabled: true,
  price: '₹99',
  planName: 'PREMIUM',
  planDescription: 'Pay once, keep it for life — no subscription, no renewals.',
  buttonText: 'Get Lifetime Access — ₹99',
  headline: 'Go ad-free. Forever.',
  subtitle: 'Sahil Edits Premium — one payment, yours for life. Zero ads and every premium prompt unlocked. No subscription, ever.',
  benefits: [
    'Ads removed completely (No banners, no sticky bars, no watch-an-ad-to-unlock. The whole site stays clean — forever.)',
    'Premium prompts unlocked (Full access to every premium prompt we release, current and future, the moment it drops.)',
    'Save premium prompts',
    'Access future premium features',
  ],
  adsEnabled: false,
  paymentGateway: 'Razorpay',
  gatewayStatus: true,
  paymentMode: 'TEST',
  razorpayKeyId: 'rzp_test_sahiledits2026',
  razorpaySecretKeyMasked: '••••••••',
};



