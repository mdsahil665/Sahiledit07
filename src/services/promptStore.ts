import {
  Category,
  PromptPost,
  AdminStats,
  RecentActivity,
  MonetizationSettings,
  AdNetworkId,
  AdNetworkConfig,
  TimerSettings,
  CustomPage,
  SeoSettings,
  SecuritySettings,
  WebsiteSettings,
  CloudinarySettings,
  CommentsSettings,
  CommentItem,
  NotificationItem,
  FeatureControls,
  DEFAULT_FEATURE_CONTROLS,
  WebsiteSectionsSettings,
  DEFAULT_WEBSITE_SECTIONS,
  PostCardConfig,
  DEFAULT_POST_CARD_CONFIG,
  PremiumSettings,
  DEFAULT_PREMIUM_SETTINGS,
} from '../types';
import { INITIAL_CATEGORIES, INITIAL_PROMPTS, INITIAL_PAGES } from '../data/initialData';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  limit,
  increment,
  writeBatch,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';

export function getTimestampMillis(dateVal: any): number {
  if (!dateVal) return 0;
  if (typeof dateVal === 'object') {
    if (typeof dateVal.toDate === 'function') {
      return dateVal.toDate().getTime();
    }
    if (typeof dateVal.seconds === 'number') {
      return dateVal.seconds * 1000 + Math.floor((dateVal.nanoseconds || 0) / 1000000);
    }
  }
  const parsed = new Date(dateVal).getTime();
  return isNaN(parsed) ? 0 : parsed;
}

export function parseTimestampToIso(dateVal: any): string {
  const millis = getTimestampMillis(dateVal);
  if (millis > 0) {
    return new Date(millis).toISOString();
  }
  return '';
}

export function getPostCreatedAtMillis(post: Partial<PromptPost>): number {
  let created = getTimestampMillis(post.createdAt);
  if (created > 0) return created;
  let updated = getTimestampMillis(post.updatedAt);
  if (updated > 0) return updated;
  return 0;
}

export function sortPostsByCreatedAtDesc(posts: PromptPost[]): PromptPost[] {
  return [...posts].sort((a, b) => getPostCreatedAtMillis(b) - getPostCreatedAtMillis(a));
}

export function getPostGallery(post: Partial<PromptPost> | null | undefined): string[] {
  if (!post) return [];

  // 1. Primary multi-image array field
  if (post.images && Array.isArray(post.images) && post.images.length > 0) {
    const valid = post.images.filter((img): img is string => typeof img === 'string' && img.trim().length > 0);
    if (valid.length > 0) return valid;
  }

  // 2. Secondary gallery array field if present
  if ((post as any).gallery && Array.isArray((post as any).gallery) && (post as any).gallery.length > 0) {
    const valid = ((post as any).gallery as any[]).filter((img): img is string => typeof img === 'string' && img.trim().length > 0);
    if (valid.length > 0) return valid;
  }

  // 3. Single imageUrl field
  if (post.imageUrl && typeof post.imageUrl === 'string' && post.imageUrl.trim().length > 0) {
    return [post.imageUrl.trim()];
  }

  // 4. Single legacy image field
  if ((post as any).image && typeof (post as any).image === 'string' && (post as any).image.trim().length > 0) {
    return [(post as any).image.trim()];
  }

  return [];
}

const STORAGE_KEYS = {
  POSTS: 'sahil_edits_posts_v1',
  CATEGORIES: 'sahil_edits_categories_v1',
  PAGES: 'sahil_edits_pages_v1',
  ACTIVITIES: 'sahil_edits_activities_v1',
  ADMIN_AUTH: 'sahil_edits_admin_auth_v1',
  ADMIN_PASS: 'sahil_edits_admin_pass_v1',
  MONETIZATION: 'sahil_edits_monetization_v1',
  TIMER_SETTINGS: 'sahil_edits_timer_settings_v1',
  SEO_SETTINGS: 'sahil_edits_seo_settings_v1',
  SECURITY_SETTINGS: 'sahil_edits_security_settings_v1',
  WEBSITE_SETTINGS: 'sahil_edits_website_settings_v1',
  CLOUDINARY_SETTINGS: 'sahil_edits_cloudinary_settings_v1',
  COMMENTS_SETTINGS: 'sahil_edits_comments_settings_v1',
  COMMENTS: 'sahil_edits_comments_v1',
  NOTIFICATIONS: 'sahil_edits_notifications_v1',
  FEATURE_CONTROLS: 'sahil_edits_feature_controls_v1',
  WEBSITE_SECTIONS: 'sahil_edits_website_sections_v1',
  POST_CARD_CONFIG: 'sahil_edits_post_card_config_v1',
  PREMIUM_SETTINGS: 'sahil_edits_premium_settings_v1',
  LIKED_POSTS: 'sahil_edits_liked_posts_v1',
};

const DEFAULT_ADMIN_PASSCODE = 'sahil2026';

const DEFAULT_WEBSITE_SETTINGS: WebsiteSettings = {
  websiteName: 'Sahil Edits',
  tagline: 'Premium AI Prompt Library',
  websiteLogo: '',
  favicon: '',
  homepageTitle: 'Sahil Edits - Premium AI Prompt Library',
  homepageSubtitle:
    'Discover, copy, and optimize high-precision AI prompts for ChatGPT, Gemini, Claude, Midjourney & Flux.',
  footerText: '© 2026 Sahil Edits. All Rights Reserved.',
  primaryColor: '#2563eb',
  accentColor: '#3b82f6',
  darkModeDefault: true,
  socialLinks: {
    enabled: true,
    instagram: 'https://instagram.com/sahiledits',
    facebook: 'https://facebook.com/sahiledits',
    whatsapp: 'https://wa.me/919876543210',
    telegram: 'https://t.me/sahiledits',
    youtube: 'https://youtube.com/@sahiledits',
    twitter: 'https://x.com/sahiledits',
    github: 'https://github.com/sahiledits',
    discord: 'https://discord.gg/sahiledits',
  },
  footerSocialLinks: {
    instagram: { enabled: true, url: 'https://instagram.com/sahiledits' },
    facebook: { enabled: true, url: 'https://facebook.com/sahiledits' },
    telegram: { enabled: true, url: 'https://t.me/sahiledits' },
    discord: { enabled: false, url: 'https://discord.gg/sahiledits' },
    youtube: { enabled: true, url: 'https://youtube.com/@sahiledits' },
    twitter: { enabled: true, url: 'https://x.com/sahiledits' },
    whatsapp: { enabled: true, url: 'https://wa.me/919876543210' },
    github: { enabled: false, url: 'https://github.com/sahiledits' },
  },
  contactEmail: 'mdsahil012002@gmail.com',
  contactPhone: '+1 (555) 019-2834',
  contactAddress: 'Sahil Edits HQ, California, USA',
  googleAnalyticsId: 'G-MEASUREMENT_ID',
  customCss: '',
  customJs: '',
  headerCode: '',
  footerCode: '',
};

const DEFAULT_CLOUDINARY_SETTINGS: CloudinarySettings = {
  cloudName: 'dvahk0xom',
  uploadPreset: 'sahil_logo',
  folder: '',
};

const DEFAULT_COMMENTS_SETTINGS: CommentsSettings = {
  enabled: true,
  autoApprove: true,
  spamProtection: true,
  requireEmail: false,
};

const DEFAULT_AD_NETWORKS: Record<AdNetworkId, AdNetworkConfig> = {
  adsense: {
    id: 'adsense',
    name: 'Google AdSense',
    publisherId: 'pub-9876543210123456',
    scriptCode: '<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9876543210123456" crossorigin="anonymous"></script>',
    enabled: true,
  },
  monetag: {
    id: 'monetag',
    name: 'Monetag',
    publisherId: 'zone-881234',
    scriptCode: '<script src="https://alwingulla.com/88/tag.min.js" data-zone="881234" async data-cfasync="false"></script>',
    enabled: false,
  },
  propeller: {
    id: 'propeller',
    name: 'PropellerAds',
    publisherId: 'zone-995678',
    scriptCode: '<script src="//push-sdk.com/f/sdk.js" data-zone="995678" async></script>',
    enabled: false,
  },
  adsterra: {
    id: 'adsterra',
    name: 'Adsterra',
    publisherId: 'key-345678',
    scriptCode: '<script type="text/javascript" src="//atypical.com/345678/invoke.js"></script>',
    enabled: false,
  },
  medianet: {
    id: 'medianet',
    name: 'Media.net',
    publisherId: 'customer-901234',
    scriptCode: '<script type="text/javascript">window._mNHandle = window._mNHandle || {}; window._mNHandle.queue = window._mNHandle.queue || [];</script>',
    enabled: false,
  },
  custom: {
    id: 'custom',
    name: 'Custom Ad Code',
    publisherId: 'custom-banner-01',
    scriptCode: '<div style="padding: 12px; background: linear-gradient(135deg, #1e293b, #0f172a); color: #38bdf8; text-align: center; font-size: 13px; font-weight: bold; border-radius: 12px; border: 1px solid rgba(56,189,248,0.2);">Sponsored Announcement Banner</div>',
    enabled: false,
  },
};

const DEFAULT_MONETIZATION: MonetizationSettings = {
  publisherId: 'pub-9876543210123456',
  enabled: true,
  testMode: false,
  activeNetwork: 'adsense',
  adFrequency: 3,
  networks: DEFAULT_AD_NETWORKS,
  positions: {
    topBanner: true,
    bottomBanner: true,
    homepageBanner: true,
    betweenPosts: true,
    insidePostTop: true,
    insidePrompt: true,
    belowPrompt: true,
    beforeCopyButton: false,
    afterCopyButton: false,
    stickyBottomBanner: false,
    desktopSidebar: false,
    footerBanner: true,
  },
};

const DEFAULT_TIMER_SETTINGS: TimerSettings = {
  enabled: true,
  defaultSeconds: 5,
};

const DEFAULT_SEO_SETTINGS: SeoSettings = {
  websiteTitle: 'Sahil Edits - Premium AI Prompt Library',
  metaDescription:
    'Discover, copy, and optimize high-precision AI prompts for ChatGPT, Gemini, Claude, Midjourney, and Flux updated daily by Sahil.',
  keywords: 'AI prompts, ChatGPT prompts, Midjourney prompts, Gemini prompts, Claude prompts, prompt library',
  canonicalUrl: 'https://sahiledit.vercel.app',
  ogImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
  twitterCard: 'summary_large_image',
  robotsTxt: 'User-agent: *\nAllow: /\nSitemap: https://sahiledit.vercel.app/sitemap.xml',
  authorName: 'Sahil',
};

const DEFAULT_SECURITY_SETTINGS: SecuritySettings = {
  sessionTimeoutMinutes: 30,
  twoFactorEnabled: false,
  rateLimitMaxAttempts: 5,
  autoLogoutOnInactivity: true,
};


class PromptStore {
  private listeners: Set<() => void> = new Set();
  private postsCache: PromptPost[] = [];
  private categoriesCache: Category[] = [];
  private pagesCache: CustomPage[] = [];
  private activitiesCache: RecentActivity[] = [];
  private monetizationCache: MonetizationSettings = DEFAULT_MONETIZATION;
  private timerSettingsCache: TimerSettings = DEFAULT_TIMER_SETTINGS;
  private seoSettingsCache: SeoSettings = DEFAULT_SEO_SETTINGS;
  private securitySettingsCache: SecuritySettings = DEFAULT_SECURITY_SETTINGS;
  private websiteSettingsCache: WebsiteSettings = DEFAULT_WEBSITE_SETTINGS;
  private cloudinarySettingsCache: CloudinarySettings = DEFAULT_CLOUDINARY_SETTINGS;
  private commentsSettingsCache: CommentsSettings = DEFAULT_COMMENTS_SETTINGS;
  private featureControlsCache: FeatureControls = DEFAULT_FEATURE_CONTROLS;
  private websiteSectionsCache: WebsiteSectionsSettings = DEFAULT_WEBSITE_SECTIONS;
  private postCardConfigCache: PostCardConfig = DEFAULT_POST_CARD_CONFIG;
  private premiumSettingsCache: PremiumSettings = DEFAULT_PREMIUM_SETTINGS;
  private commentsCache: CommentItem[] = [];
  private notificationsCache: NotificationItem[] = [
    {
      id: 'notif-1',
      title: 'System Initialized',
      message: 'Sahil Edits AI Prompt Engine & Firestore listener connected',
      type: 'info',
      read: false,
      timestamp: new Date().toISOString(),
    },
  ];

  private isInitialized = false;

  constructor() {
    this.initLocalStorageCache();
    this.initFirestoreListeners();
  }

  private initLocalStorageCache() {
    try {
      const storedPosts = localStorage.getItem(STORAGE_KEYS.POSTS);
      this.postsCache = storedPosts ? sortPostsByCreatedAtDesc(JSON.parse(storedPosts)) : sortPostsByCreatedAtDesc(INITIAL_PROMPTS);

      const storedCats = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      this.categoriesCache = storedCats ? JSON.parse(storedCats) : INITIAL_CATEGORIES;

      const storedPages = localStorage.getItem(STORAGE_KEYS.PAGES);
      this.pagesCache = storedPages ? JSON.parse(storedPages) : INITIAL_PAGES;

      const storedActs = localStorage.getItem(STORAGE_KEYS.ACTIVITIES);
      this.activitiesCache = storedActs ? JSON.parse(storedActs) : [];

      const storedMon = localStorage.getItem(STORAGE_KEYS.MONETIZATION);
      if (storedMon) {
        const parsed = JSON.parse(storedMon);
        this.monetizationCache = {
          ...DEFAULT_MONETIZATION,
          ...parsed,
          networks: {
            ...DEFAULT_AD_NETWORKS,
            ...(parsed.networks || {}),
          },
          positions: {
            ...DEFAULT_MONETIZATION.positions,
            ...(parsed.positions || {}),
          },
        };
      } else {
        this.monetizationCache = DEFAULT_MONETIZATION;
      }

      const storedTimer = localStorage.getItem(STORAGE_KEYS.TIMER_SETTINGS);
      this.timerSettingsCache = storedTimer ? JSON.parse(storedTimer) : DEFAULT_TIMER_SETTINGS;

      const storedSeo = localStorage.getItem(STORAGE_KEYS.SEO_SETTINGS);
      this.seoSettingsCache = storedSeo ? JSON.parse(storedSeo) : DEFAULT_SEO_SETTINGS;

      const storedSec = localStorage.getItem(STORAGE_KEYS.SECURITY_SETTINGS);
      this.securitySettingsCache = storedSec ? JSON.parse(storedSec) : DEFAULT_SECURITY_SETTINGS;

      const storedWeb = localStorage.getItem(STORAGE_KEYS.WEBSITE_SETTINGS);
      this.websiteSettingsCache = storedWeb ? JSON.parse(storedWeb) : DEFAULT_WEBSITE_SETTINGS;

      const storedCld = localStorage.getItem(STORAGE_KEYS.CLOUDINARY_SETTINGS);
      this.cloudinarySettingsCache = storedCld ? JSON.parse(storedCld) : DEFAULT_CLOUDINARY_SETTINGS;

      const storedCmtSet = localStorage.getItem(STORAGE_KEYS.COMMENTS_SETTINGS);
      this.commentsSettingsCache = storedCmtSet ? JSON.parse(storedCmtSet) : DEFAULT_COMMENTS_SETTINGS;

      const storedFeatures = localStorage.getItem(STORAGE_KEYS.FEATURE_CONTROLS);
      this.featureControlsCache = storedFeatures ? { ...DEFAULT_FEATURE_CONTROLS, ...JSON.parse(storedFeatures) } : DEFAULT_FEATURE_CONTROLS;

      const storedSections = localStorage.getItem(STORAGE_KEYS.WEBSITE_SECTIONS);
      this.websiteSectionsCache = storedSections ? { ...DEFAULT_WEBSITE_SECTIONS, ...JSON.parse(storedSections) } : DEFAULT_WEBSITE_SECTIONS;

      const storedCardCfg = localStorage.getItem(STORAGE_KEYS.POST_CARD_CONFIG);
      this.postCardConfigCache = storedCardCfg ? { ...DEFAULT_POST_CARD_CONFIG, ...JSON.parse(storedCardCfg) } : DEFAULT_POST_CARD_CONFIG;

      const storedPremSet = localStorage.getItem(STORAGE_KEYS.PREMIUM_SETTINGS);
      this.premiumSettingsCache = storedPremSet ? { ...DEFAULT_PREMIUM_SETTINGS, ...JSON.parse(storedPremSet) } : DEFAULT_PREMIUM_SETTINGS;

      const storedCmts = localStorage.getItem(STORAGE_KEYS.COMMENTS);
      this.commentsCache = storedCmts ? JSON.parse(storedCmts) : [];

      const storedNotifs = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      this.notificationsCache = storedNotifs ? JSON.parse(storedNotifs) : this.notificationsCache;
    } catch {
      this.postsCache = sortPostsByCreatedAtDesc(INITIAL_PROMPTS);
      this.categoriesCache = INITIAL_CATEGORIES;
      this.pagesCache = INITIAL_PAGES;
      this.activitiesCache = [];
      this.monetizationCache = DEFAULT_MONETIZATION;
      this.timerSettingsCache = DEFAULT_TIMER_SETTINGS;
      this.seoSettingsCache = DEFAULT_SEO_SETTINGS;
      this.securitySettingsCache = DEFAULT_SECURITY_SETTINGS;
      this.websiteSettingsCache = DEFAULT_WEBSITE_SETTINGS;
      this.cloudinarySettingsCache = DEFAULT_CLOUDINARY_SETTINGS;
      this.commentsSettingsCache = DEFAULT_COMMENTS_SETTINGS;
      this.commentsCache = [];
    }
  }

  private initFirestoreListeners() {
    // 1. Prompts Realtime Listener (Ordered by createdAt desc)
    const promptsQuery = query(collection(db, 'prompts'), orderBy('createdAt', 'desc'));
    onSnapshot(
      promptsQuery,
      async (snapshot) => {
        if (snapshot.empty && !this.isInitialized) {
          await this.seedInitialPrompts();
        } else if (!snapshot.empty) {
          const postsList: PromptPost[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            let createdAt = parseTimestampToIso(data.createdAt);
            let updatedAt = parseTimestampToIso(data.updatedAt);
            if (!createdAt && updatedAt) createdAt = updatedAt;
            if (!createdAt) createdAt = new Date().toISOString();
            if (!updatedAt) updatedAt = createdAt;

            const docId = docSnap.id;
            const existingInCache = this.postsCache.find((p) => p.id === docId);
            const isPendingLocalLike = this.pendingLikeRequests.has(docId);
            const likesCount =
              isPendingLocalLike && existingInCache && typeof existingInCache.likes === 'number'
                ? existingInCache.likes
                : typeof data.likes === 'number'
                ? data.likes
                : existingInCache && typeof existingInCache.likes === 'number'
                ? existingInCache.likes
                : 0;

            const docImages = getPostGallery(data);
            const docCover = docImages[0] || data.imageUrl || (data as any).image || '';

            postsList.push({
              ...data,
              imageUrl: docCover,
              images: docImages,
              gallery: docImages,
              id: docId,
              likes: likesCount,
              createdAt,
              updatedAt,
            } as unknown as PromptPost);
          });
          this.postsCache = sortPostsByCreatedAtDesc(postsList);
          this.saveLocalCache();
          this.notify();
        }
      },
      (error) => handleFirestoreError(error, OperationType.GET, 'prompts')
    );

    // 2. Categories Realtime Listener
    const categoriesRef = collection(db, 'categories');
    onSnapshot(
      categoriesRef,
      async (snapshot) => {
        if (snapshot.empty && !this.isInitialized) {
          await this.seedInitialCategories();
        } else if (!snapshot.empty) {
          const catList: Category[] = [];
          snapshot.forEach((docSnap) => {
            catList.push({ id: docSnap.id, ...docSnap.data() } as Category);
          });
          this.categoriesCache = catList;
          this.saveLocalCache();
          this.notify();
        }
      },
      (error) => handleFirestoreError(error, OperationType.GET, 'categories')
    );

    // 3. Pages Realtime Listener
    const pagesRef = collection(db, 'pages');
    onSnapshot(
      pagesRef,
      async (snapshot) => {
        if (snapshot.empty && !this.isInitialized) {
          await this.seedInitialPages();
        } else if (!snapshot.empty) {
          const pageList: CustomPage[] = [];
          snapshot.forEach((docSnap) => {
            pageList.push({ id: docSnap.id, ...docSnap.data() } as CustomPage);
          });
          this.pagesCache = pageList;
          this.saveLocalCache();
          this.notify();
        }
      },
      (error) => handleFirestoreError(error, OperationType.GET, 'pages')
    );

    // 4. Settings Doc Realtime Listener
    onSnapshot(
      doc(db, 'settings', 'global'),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.monetization) this.monetizationCache = data.monetization;
          if (data.timerSettings) this.timerSettingsCache = data.timerSettings;
          if (data.seoSettings) this.seoSettingsCache = data.seoSettings;
          if (data.securitySettings) this.securitySettingsCache = data.securitySettings;
          if (data.websiteSettings) this.websiteSettingsCache = data.websiteSettings;
          if (data.cloudinarySettings) this.cloudinarySettingsCache = data.cloudinarySettings;
          if (data.commentsSettings) this.commentsSettingsCache = data.commentsSettings;
          if (data.premiumSettings) this.premiumSettingsCache = { ...DEFAULT_PREMIUM_SETTINGS, ...data.premiumSettings };
          if (data.featureControls) this.featureControlsCache = { ...DEFAULT_FEATURE_CONTROLS, ...data.featureControls };
          if (data.websiteSections) {
            this.websiteSectionsCache = {
              ...DEFAULT_WEBSITE_SECTIONS,
              ...data.websiteSections,
              categories: {
                ...DEFAULT_WEBSITE_SECTIONS.categories,
                ...(data.websiteSections.categories || {}),
              },
              categoryPage: {
                ...DEFAULT_WEBSITE_SECTIONS.categoryPage,
                ...(data.websiteSections.categoryPage || {}),
              },
            };
          }
          this.saveLocalCache();
          this.notify();
        }
      },
      (error) => handleFirestoreError(error, OperationType.GET, 'settings/global')
    );

    // 4.5 Website Sections Specific Listener
    onSnapshot(
      doc(db, 'settings', 'websiteSections'),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as WebsiteSectionsSettings;
          this.websiteSectionsCache = {
            ...DEFAULT_WEBSITE_SECTIONS,
            ...data,
            categories: {
              ...DEFAULT_WEBSITE_SECTIONS.categories,
              ...(data.categories || {}),
            },
            categoryPage: {
              ...DEFAULT_WEBSITE_SECTIONS.categoryPage,
              ...(data.categoryPage || {}),
            },
          };
          this.saveLocalCache();
          this.notify();
        }
      },
      (error) => handleFirestoreError(error, OperationType.GET, 'settings/websiteSections')
    );

    // 4.6 Post Card Config Specific Listener
    onSnapshot(
      doc(db, 'settings', 'postCardConfig'),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as PostCardConfig;
          this.postCardConfigCache = {
            ...DEFAULT_POST_CARD_CONFIG,
            ...data,
          };
          this.saveLocalCache();
          this.notify();
        }
      },
      (error) => handleFirestoreError(error, OperationType.GET, 'settings/postCardConfig')
    );

    // 5. Comments Realtime Listener
    const commentsRef = collection(db, 'comments');
    onSnapshot(
      query(commentsRef, limit(100)),
      (snapshot) => {
        if (!snapshot.empty) {
          const cmtList: CommentItem[] = [];
          snapshot.forEach((docSnap) => {
            cmtList.push({ id: docSnap.id, ...docSnap.data() } as CommentItem);
          });
          cmtList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          this.commentsCache = cmtList;
          this.saveLocalCache();
          this.notify();
        }
      },
      (error) => handleFirestoreError(error, OperationType.GET, 'comments')
    );

    // 6. Activities Realtime Listener
    const activitiesRef = collection(db, 'activities');
    onSnapshot(
      query(activitiesRef, limit(30)),
      (snapshot) => {
        if (!snapshot.empty) {
          const actList: RecentActivity[] = [];
          snapshot.forEach((docSnap) => {
            actList.push({ id: docSnap.id, ...docSnap.data() } as RecentActivity);
          });
          actList.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          this.activitiesCache = actList;
          this.saveLocalCache();
          this.notify();
        }
      },
      (error) => handleFirestoreError(error, OperationType.GET, 'activities')
    );

    this.isInitialized = true;
  }

  private async seedInitialPrompts() {
    try {
      const batch = writeBatch(db);
      for (const post of INITIAL_PROMPTS) {
        const postRef = doc(db, 'prompts', post.id);
        const { id, ...data } = post;
        batch.set(postRef, {
          ...data,
          likes: typeof post.likes === 'number' ? post.likes : 0,
        });
      }
      await batch.commit();
    } catch (e) {
      console.warn('Failed to seed prompts to Firestore', e);
    }
  }

  private async seedInitialCategories() {
    try {
      const batch = writeBatch(db);
      for (const cat of INITIAL_CATEGORIES) {
        const catRef = doc(db, 'categories', cat.id);
        const { id, ...data } = cat;
        batch.set(catRef, data);
      }
      await batch.commit();
    } catch (e) {
      console.warn('Failed to seed categories to Firestore', e);
    }
  }

  private async seedInitialPages() {
    try {
      const batch = writeBatch(db);
      for (const page of INITIAL_PAGES) {
        const pageRef = doc(db, 'pages', page.id);
        const { id, ...data } = page;
        batch.set(pageRef, data);
      }
      await batch.commit();
    } catch (e) {
      console.warn('Failed to seed pages to Firestore', e);
    }
  }

  private saveLocalCache() {
    try {
      localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(this.postsCache));
    } catch (e) {
      console.warn('LocalStorage save error, pruning large data URLs for local storage', e);
      try {
        const cleanedPosts = this.postsCache.map((p) => ({
          ...p,
          imageUrl:
            p.imageUrl && p.imageUrl.startsWith('data:image/') && p.imageUrl.length > 100000
              ? 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80'
              : p.imageUrl,
        }));
        localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(cleanedPosts));
      } catch (err) {
        console.error('LocalStorage ultimate save error', err);
      }
    }

    try {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(this.categoriesCache));
      localStorage.setItem(STORAGE_KEYS.PAGES, JSON.stringify(this.pagesCache));
      localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(this.activitiesCache));
      localStorage.setItem(STORAGE_KEYS.MONETIZATION, JSON.stringify(this.monetizationCache));
      localStorage.setItem(STORAGE_KEYS.TIMER_SETTINGS, JSON.stringify(this.timerSettingsCache));
      localStorage.setItem(STORAGE_KEYS.SEO_SETTINGS, JSON.stringify(this.seoSettingsCache));
      localStorage.setItem(STORAGE_KEYS.SECURITY_SETTINGS, JSON.stringify(this.securitySettingsCache));
      localStorage.setItem(STORAGE_KEYS.WEBSITE_SETTINGS, JSON.stringify(this.websiteSettingsCache));
      localStorage.setItem(STORAGE_KEYS.CLOUDINARY_SETTINGS, JSON.stringify(this.cloudinarySettingsCache));
      localStorage.setItem(STORAGE_KEYS.COMMENTS_SETTINGS, JSON.stringify(this.commentsSettingsCache));
      localStorage.setItem(STORAGE_KEYS.FEATURE_CONTROLS, JSON.stringify(this.featureControlsCache));
      localStorage.setItem(STORAGE_KEYS.WEBSITE_SECTIONS, JSON.stringify(this.websiteSectionsCache));
      localStorage.setItem(STORAGE_KEYS.POST_CARD_CONFIG, JSON.stringify(this.postCardConfigCache));
      localStorage.setItem(STORAGE_KEYS.PREMIUM_SETTINGS, JSON.stringify(this.premiumSettingsCache));
      localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(this.commentsCache));
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(this.notificationsCache));
    } catch (e) {
      console.error('LocalStorage settings save error', e);
    }
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((listener) => listener());
  }

  // --- POSTS ---
  public getPosts(): PromptPost[] {
    return sortPostsByCreatedAtDesc(this.postsCache);
  }

  public getPostById(id: string): PromptPost | undefined {
    return this.postsCache.find((p) => p.id === id);
  }

  public getFeaturedPost(): PromptPost | undefined {
    return this.postsCache.find((p) => p.featured === true);
  }

  public getTrendingPost(): PromptPost | undefined {
    return this.postsCache.find((p) => p.trending === true);
  }

  public async setFeaturedPost(id: string): Promise<void> {
    const existing = this.getFeaturedPost();
    if (existing && existing.id !== id) {
      await this.updatePost(existing.id, { featured: false });
    }
    await this.updatePost(id, { featured: true });
  }

  public async removeFeaturedPost(id?: string): Promise<void> {
    const targetId = id || this.getFeaturedPost()?.id;
    if (targetId) {
      await this.updatePost(targetId, { featured: false });
    }
  }

  public async setTrendingPost(id: string): Promise<void> {
    const existing = this.getTrendingPost();
    if (existing && existing.id !== id) {
      await this.updatePost(existing.id, { trending: false });
    }
    await this.updatePost(id, { trending: true });
  }

  public async removeTrendingPost(id?: string): Promise<void> {
    const targetId = id || this.getTrendingPost()?.id;
    if (targetId) {
      await this.updatePost(targetId, { trending: false });
    }
  }

  public async addPost(
    postData: Omit<PromptPost, 'id' | 'createdAt' | 'updatedAt' | 'views' | 'copies'>
  ): Promise<PromptPost> {
    const id = 'prompt-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
    const nowIso = new Date().toISOString();
    
    // Unset featured/trending on other posts if newly added post has them set
    if (postData.featured) {
      for (const p of this.postsCache) {
        if (p.featured) {
          p.featured = false;
          updateDoc(doc(db, 'prompts', p.id), { featured: false }).catch(console.error);
        }
      }
    }
    if (postData.trending) {
      for (const p of this.postsCache) {
        if (p.trending) {
          p.trending = false;
          updateDoc(doc(db, 'prompts', p.id), { trending: false }).catch(console.error);
        }
      }
    }

    const finalImages: string[] = getPostGallery(postData);
    const coverUrl = finalImages[0] || postData.imageUrl || '';

    const newPost: PromptPost = {
      ...postData,
      imageUrl: coverUrl,
      images: finalImages,
      gallery: finalImages,
      featured: Boolean(postData.featured),
      trending: Boolean(postData.trending),
      id,
      likes: typeof postData.likes === 'number' ? postData.likes : 0,
      views: 0,
      copies: 0,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    this.postsCache = sortPostsByCreatedAtDesc([newPost, ...this.postsCache]);
    this.saveLocalCache();
    this.notify();

    try {
      const { id: _, createdAt: __, updatedAt: ___, ...dataToSave } = newPost;
      if (dataToSave.imageUrl && dataToSave.imageUrl.startsWith('data:image/') && dataToSave.imageUrl.length > 500000) {
        dataToSave.imageUrl = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80';
      }
      await setDoc(doc(db, 'prompts', id), {
        ...dataToSave,
        likes: newPost.likes,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      await this.logActivity('create_post', `Created new prompt "${newPost.title}"`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `prompts/${id}`);
    }

    return newPost;
  }

  public async updatePost(id: string, updates: Partial<PromptPost>): Promise<PromptPost | null> {
    const index = this.postsCache.findIndex((p) => p.id === id);

    // Enforce single-featured and single-trending invariants
    if (updates.featured === true) {
      for (const p of this.postsCache) {
        if (p.id !== id && p.featured) {
          p.featured = false;
          updateDoc(doc(db, 'prompts', p.id), { featured: false }).catch(console.error);
        }
      }
    }
    if (updates.trending === true) {
      for (const p of this.postsCache) {
        if (p.id !== id && p.trending) {
          p.trending = false;
          updateDoc(doc(db, 'prompts', p.id), { trending: false }).catch(console.error);
        }
      }
    }

    let existingPost: PromptPost;
    if (index !== -1) {
      existingPost = this.postsCache[index];
    } else {
      existingPost = {
        id,
        title: updates.title || '',
        shortDescription: updates.shortDescription || '',
        fullPrompt: updates.fullPrompt || '',
        categoryId: updates.categoryId || 'chatgpt',
        tags: updates.tags || [],
        imageUrl: updates.imageUrl || '',
        featured: updates.featured || false,
        trending: updates.trending || false,
        status: updates.status || 'published',
        views: 0,
        copies: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    const preservedCreatedAt = existingPost.createdAt || new Date().toISOString();
    const updatedAtIso = new Date().toISOString();

    // Strip out fields that MUST NOT be overwritten or modified during edit
    const { createdAt: _ignoreCreatedAt, id: _ignoreId, views: _ignoreViews, copies: _ignoreCopies, ...cleanUpdates } = updates;

    // Synchronize images and gallery arrays strictly
    let finalImages: string[];
    if (cleanUpdates.images !== undefined && Array.isArray(cleanUpdates.images)) {
      finalImages = cleanUpdates.images.filter(Boolean);
    } else if ((cleanUpdates as any).gallery !== undefined && Array.isArray((cleanUpdates as any).gallery)) {
      finalImages = ((cleanUpdates as any).gallery as any[]).filter(Boolean);
    } else if (cleanUpdates.imageUrl !== undefined) {
      finalImages = cleanUpdates.imageUrl ? [cleanUpdates.imageUrl] : [];
    } else {
      finalImages = getPostGallery(existingPost);
    }

    const coverUrl = finalImages[0] || cleanUpdates.imageUrl || existingPost.imageUrl || '';
    cleanUpdates.images = finalImages;
    (cleanUpdates as any).gallery = finalImages;
    cleanUpdates.imageUrl = coverUrl;

    const updatedPost: PromptPost = {
      ...existingPost,
      ...cleanUpdates,
      imageUrl: coverUrl,
      images: finalImages,
      gallery: finalImages,
      id: existingPost.id, // Strictly preserve original ID
      views: existingPost.views ?? 0, // Keep analytics unchanged
      copies: existingPost.copies ?? 0, // Keep analytics unchanged
      createdAt: preservedCreatedAt, // Strictly preserve original createdAt
      updatedAt: updatedAtIso,
    };

    if (index !== -1) {
      this.postsCache[index] = updatedPost;
    } else {
      this.postsCache.push(updatedPost);
    }
    this.postsCache = sortPostsByCreatedAtDesc(this.postsCache);
    this.saveLocalCache();
    this.notify();

    try {
      const updateDataForFirestore: Record<string, any> = {
        updatedAt: serverTimestamp(),
      };

      if (cleanUpdates.title !== undefined) updateDataForFirestore.title = cleanUpdates.title;
      if (cleanUpdates.shortDescription !== undefined) updateDataForFirestore.shortDescription = cleanUpdates.shortDescription;
      if (cleanUpdates.fullPrompt !== undefined) updateDataForFirestore.fullPrompt = cleanUpdates.fullPrompt;
      if (cleanUpdates.categoryId !== undefined) updateDataForFirestore.categoryId = cleanUpdates.categoryId;
      if (cleanUpdates.tags !== undefined) updateDataForFirestore.tags = cleanUpdates.tags;
      if (cleanUpdates.imageUrl !== undefined || cleanUpdates.images !== undefined || (cleanUpdates as any).gallery !== undefined) {
        let finalImg = coverUrl;
        if (finalImg.startsWith('data:image/') && finalImg.length > 500000) {
          finalImg = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80';
        }
        updateDataForFirestore.imageUrl = finalImg;
        updateDataForFirestore.images = finalImages;
        updateDataForFirestore.gallery = finalImages;
      }
      if (cleanUpdates.featured !== undefined) updateDataForFirestore.featured = cleanUpdates.featured;
      if (cleanUpdates.trending !== undefined) updateDataForFirestore.trending = cleanUpdates.trending;
      if (cleanUpdates.status !== undefined) updateDataForFirestore.status = cleanUpdates.status;
      if (cleanUpdates.scheduledDate !== undefined) updateDataForFirestore.scheduledDate = cleanUpdates.scheduledDate;
      if (cleanUpdates.seoTitle !== undefined) updateDataForFirestore.seoTitle = cleanUpdates.seoTitle;
      if (cleanUpdates.metaDescription !== undefined) updateDataForFirestore.metaDescription = cleanUpdates.metaDescription;
      if (cleanUpdates.badgeMode !== undefined) updateDataForFirestore.badgeMode = cleanUpdates.badgeMode;
      if (cleanUpdates.badgeType !== undefined) updateDataForFirestore.badgeType = cleanUpdates.badgeType;
      if (cleanUpdates.timerOverride !== undefined) updateDataForFirestore.timerOverride = cleanUpdates.timerOverride;
      if (cleanUpdates.cardConfig !== undefined) updateDataForFirestore.cardConfig = cleanUpdates.cardConfig;
      if (cleanUpdates.likes !== undefined) updateDataForFirestore.likes = cleanUpdates.likes;

      // Use updateDoc exclusively to modify the existing Firestore document
      await updateDoc(doc(db, 'prompts', id), updateDataForFirestore);
      await this.logActivity('edit_post', `Updated prompt "${updatedPost.title}"`);
    } catch (error) {
      try {
        // Fallback setDoc using merge option or existing document ID if doc doesn't exist
        const { id: _, ...fullDataToSave } = updatedPost;
        await setDoc(doc(db, 'prompts', id), {
          ...fullDataToSave,
          createdAt: preservedCreatedAt,
          updatedAt: serverTimestamp(),
        });
      } catch (err2) {
        handleFirestoreError(error, OperationType.UPDATE, `prompts/${id}`);
      }
    }

    return updatedPost;
  }

  private async deleteFromCloudinary(_imageUrl: string): Promise<void> {
    // Unsigned client-side Cloudinary API does not perform deletions without server API secret.
    return;
  }

  public async deletePost(id: string): Promise<boolean> {
    const target = this.postsCache.find((p) => p.id === id);
    if (!target) {
      throw new Error(`Post with ID "${id}" was not found.`);
    }

    // Delete image from Cloudinary if applicable
    if (target.imageUrl && target.imageUrl.includes('cloudinary.com')) {
      await this.deleteFromCloudinary(target.imageUrl);
    }

    try {
      await deleteDoc(doc(db, 'prompts', id));
      this.postsCache = this.postsCache.filter((p) => p.id !== id);
      this.saveLocalCache();
      this.notify();
      await this.logActivity('delete_post', `Deleted prompt "${target.title}"`);
      return true;
    } catch (error: any) {
      handleFirestoreError(error, OperationType.DELETE, `prompts/${id}`);
      throw new Error(error?.message || 'Failed to delete prompt from Firestore');
    }
  }

  public async duplicatePost(id: string): Promise<PromptPost | null> {
    const target = this.getPostById(id);
    if (!target) return null;

    const copyData = {
      ...target,
      title: `${target.title} (Copy)`,
      views: 0,
      copies: 0,
    };
    delete (copyData as any).id;
    delete (copyData as any).createdAt;
    delete (copyData as any).updatedAt;

    return this.addPost(copyData);
  }

  public async bulkDeletePosts(ids: string[]): Promise<void> {
    const targetPosts = this.postsCache.filter((p) => ids.includes(p.id));

    for (const target of targetPosts) {
      if (target.imageUrl && target.imageUrl.includes('cloudinary.com')) {
        await this.deleteFromCloudinary(target.imageUrl);
      }
    }

    try {
      const batch = writeBatch(db);
      for (const id of ids) {
        batch.delete(doc(db, 'prompts', id));
      }
      await batch.commit();

      this.postsCache = this.postsCache.filter((p) => !ids.includes(p.id));
      this.saveLocalCache();
      this.notify();
      await this.logActivity('delete_post', `Bulk deleted ${ids.length} prompts`);
    } catch (error: any) {
      handleFirestoreError(error, OperationType.DELETE, 'prompts');
      throw new Error(error?.message || 'Failed to bulk delete prompts from Firestore');
    }
  }

  public async incrementViews(id: string): Promise<void> {
    const index = this.postsCache.findIndex((p) => p.id === id);
    if (index !== -1) {
      this.postsCache[index].views = (this.postsCache[index].views || 0) + 1;
      this.notify();
    }

    try {
      await updateDoc(doc(db, 'prompts', id), {
        views: increment(1),
      });
    } catch (error) {
      // Ignore background analytics view count errors gracefully
    }
  }

  public async incrementCopies(id: string): Promise<void> {
    const index = this.postsCache.findIndex((p) => p.id === id);
    if (index !== -1) {
      this.postsCache[index].copies = (this.postsCache[index].copies || 0) + 1;
      this.notify();
      this.logActivity('copy_prompt', `Prompt copied: "${this.postsCache[index].title}"`);
    }

    try {
      await updateDoc(doc(db, 'prompts', id), {
        copies: increment(1),
      });
    } catch (error) {
      // Ignore background count errors gracefully
    }
  }

  // --- LIKES SYSTEM ---
  private pendingLikeRequests: Set<string> = new Set();

  public isPostLiked(id: string): boolean {
    if (!id) return false;
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.LIKED_POSTS);
      if (stored) {
        const list: string[] = JSON.parse(stored);
        return Array.isArray(list) && list.includes(id);
      }
    } catch (e) {
      return false;
    }
    return false;
  }

  public async toggleLikePost(id: string): Promise<{ liked: boolean; count: number }> {
    if (!id) return { liked: false, count: 0 };

    if (this.pendingLikeRequests.has(id)) {
      const isLiked = this.isPostLiked(id);
      const post = this.getPostById(id);
      return { liked: isLiked, count: typeof post?.likes === 'number' ? post.likes : 0 };
    }
    this.pendingLikeRequests.add(id);

    let post = this.postsCache.find((p) => p.id === id);
    if (!post) {
      post = this.getPostById(id);
    }
    if (!post) return { liked: false, count: 0 };

    try {
      let likedPostIds: string[] = [];
      try {
        const stored = localStorage.getItem(STORAGE_KEYS.LIKED_POSTS);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) likedPostIds = parsed;
        }
      } catch (e) {
        likedPostIds = [];
      }

      const isCurrentlyLiked = likedPostIds.includes(id);
      let currentCount = typeof post.likes === 'number' ? post.likes : 0;
      let newLikes = currentCount;
      let newlyLiked = false;

      if (isCurrentlyLiked) {
        likedPostIds = likedPostIds.filter((postId) => postId !== id);
        newLikes = Math.max(0, currentCount - 1);
        newlyLiked = false;
      } else {
        if (!likedPostIds.includes(id)) {
          likedPostIds.push(id);
        }
        newLikes = currentCount + 1;
        newlyLiked = true;
      }

      try {
        localStorage.setItem(STORAGE_KEYS.LIKED_POSTS, JSON.stringify(likedPostIds));
      } catch (e) {
        console.error('LocalStorage write error for likes', e);
      }

      // 1. Update in-memory post state immediately
      post.likes = newLikes;

      // 2. Persist to local cache & notify all components immediately
      this.saveLocalCache();
      this.notify();

      // 3. Persist to Firestore asynchronously
      const postRef = doc(db, 'prompts', id);
      try {
        await setDoc(
          postRef,
          {
            likes: newLikes,
          },
          { merge: true }
        );
      } catch (error) {
        console.warn(`Firestore setDoc like update warning for prompt ${id}:`, error);
      }

      return { liked: newlyLiked, count: newLikes };
    } finally {
      this.pendingLikeRequests.delete(id);
    }
  }

  // --- POST CARD APPEARANCE CONFIG ---
  public getPostCardConfig(): PostCardConfig {
    return { ...this.postCardConfigCache };
  }

  public async updatePostCardConfig(config: Partial<PostCardConfig>, applyToAllPosts: boolean = false): Promise<void> {
    const updated = {
      ...this.postCardConfigCache,
      ...config,
    };
    this.postCardConfigCache = updated;
    this.saveLocalCache();
    this.notify();

    try {
      await setDoc(doc(db, 'settings', 'postCardConfig'), updated, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'settings/postCardConfig');
    }

    if (applyToAllPosts) {
      try {
        const batch = writeBatch(db);
        for (const p of this.postsCache) {
          p.cardConfig = updated;
          const pRef = doc(db, 'prompts', p.id);
          batch.update(pRef, { cardConfig: updated });
        }
        await batch.commit();
        this.saveLocalCache();
        this.notify();
      } catch (e) {
        console.error('Failed to apply card config to all posts', e);
      }
    }
  }

  // --- CATEGORIES ---
  public getCategories(): Category[] {
    return this.categoriesCache;
  }

  public async addCategory(catData: Omit<Category, 'id' | 'slug'>): Promise<Category> {
    const slug = catData.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    const id = 'cat-' + Date.now();
    const newCategory: Category = {
      ...catData,
      id,
      slug,
    };

    this.categoriesCache.push(newCategory);
    this.notify();

    try {
      const { id: _, ...dataToSave } = newCategory;
      await setDoc(doc(db, 'categories', id), dataToSave);
      await this.logActivity('create_category', `Created category "${newCategory.name}"`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `categories/${id}`);
    }

    return newCategory;
  }

  public async updateCategory(id: string, updates: Partial<Category>): Promise<Category | null> {
    const index = this.categoriesCache.findIndex((c) => c.id === id);
    if (index === -1) return null;

    if (updates.name) {
      updates.slug = updates.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
    }

    const updatedCat = {
      ...this.categoriesCache[index],
      ...updates,
    };

    this.categoriesCache[index] = updatedCat;
    this.notify();

    try {
      const { id: _, ...dataToSave } = updatedCat;
      await setDoc(doc(db, 'categories', id), dataToSave);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `categories/${id}`);
    }

    return updatedCat;
  }

  public async deleteCategory(id: string): Promise<boolean> {
    this.categoriesCache = this.categoriesCache.filter((c) => c.id !== id);
    this.notify();

    try {
      await deleteDoc(doc(db, 'categories', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `categories/${id}`);
    }

    return true;
  }

  // --- CUSTOM PAGES ---
  public getPages(): CustomPage[] {
    return this.pagesCache;
  }

  public getPageBySlug(slug: string): CustomPage | undefined {
    return this.pagesCache.find((p) => p.slug === slug);
  }

  public async addPage(
    pageData: Omit<CustomPage, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<CustomPage> {
    const id = 'page-' + Date.now();
    const now = new Date().toISOString();
    const slug =
      pageData.slug ||
      pageData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');

    const newPage: CustomPage = {
      ...pageData,
      id,
      slug,
      createdAt: now,
      updatedAt: now,
    };

    this.pagesCache.push(newPage);
    this.notify();

    try {
      const { id: _, ...dataToSave } = newPage;
      await setDoc(doc(db, 'pages', id), dataToSave);
      await this.logActivity('create_page', `Created page "${newPage.title}"`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `pages/${id}`);
    }

    return newPage;
  }

  public async updatePage(id: string, updates: Partial<CustomPage>): Promise<CustomPage | null> {
    const index = this.pagesCache.findIndex((p) => p.id === id);
    if (index === -1) return null;

    const updatedAt = new Date().toISOString();
    if (updates.title && !updates.slug) {
      updates.slug = updates.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
    }

    const updatedPage = {
      ...this.pagesCache[index],
      ...updates,
      updatedAt,
    };

    this.pagesCache[index] = updatedPage;
    this.notify();

    try {
      const { id: _, ...dataToSave } = updatedPage;
      await setDoc(doc(db, 'pages', id), dataToSave);
      await this.logActivity('edit_page', `Updated page "${updatedPage.title}"`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `pages/${id}`);
    }

    return updatedPage;
  }

  public async deletePage(id: string): Promise<boolean> {
    const target = this.pagesCache.find((p) => p.id === id);
    if (!target) return false;

    this.pagesCache = this.pagesCache.filter((p) => p.id !== id);
    this.notify();

    try {
      await deleteDoc(doc(db, 'pages', id));
      await this.logActivity('delete_page', `Deleted page "${target.title}"`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `pages/${id}`);
    }

    return true;
  }

  // --- SETTINGS (MONETIZATION, TIMER, SEO, SECURITY) ---
  public getMonetization(): MonetizationSettings {
    return this.monetizationCache;
  }

  public async updateMonetization(updates: Partial<MonetizationSettings>): Promise<void> {
    const updated = { ...this.monetizationCache, ...updates };
    
    // Ensure active network's publisher ID is synced to top-level publisherId
    if (updated.activeNetwork && updated.networks?.[updated.activeNetwork]) {
      const activeNet = updated.networks[updated.activeNetwork];
      if (activeNet.publisherId) {
        updated.publisherId = activeNet.publisherId;
      }
    }

    this.monetizationCache = updated;
    this.saveLocalCache();
    this.notify();

    try {
      await setDoc(
        doc(db, 'settings', 'global'),
        { monetization: this.monetizationCache },
        { merge: true }
      );
      await this.logActivity('update_settings', 'Updated Monetization & Ad Network Settings');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'settings/global');
    }
  }

  public getTimerSettings(): TimerSettings {
    return this.timerSettingsCache;
  }

  public async updateTimerSettings(updates: Partial<TimerSettings>): Promise<void> {
    this.timerSettingsCache = { ...this.timerSettingsCache, ...updates };
    this.saveLocalCache();
    this.notify();

    try {
      await setDoc(
        doc(db, 'settings', 'global'),
        { timerSettings: this.timerSettingsCache },
        { merge: true }
      );
      await this.logActivity('update_settings', 'Updated Global Timer Countdown Settings');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'settings/global');
    }
  }

  public getSeoSettings(): SeoSettings {
    return this.seoSettingsCache;
  }

  public async updateSeoSettings(updates: Partial<SeoSettings>): Promise<void> {
    this.seoSettingsCache = { ...this.seoSettingsCache, ...updates };
    this.saveLocalCache();
    this.notify();

    try {
      await setDoc(
        doc(db, 'settings', 'global'),
        { seoSettings: this.seoSettingsCache },
        { merge: true }
      );
      await this.logActivity('update_settings', 'Updated Global SEO Settings');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'settings/global');
    }
  }

  public getSecuritySettings(): SecuritySettings {
    return this.securitySettingsCache;
  }

  public async updateSecuritySettings(updates: Partial<SecuritySettings>): Promise<void> {
    this.securitySettingsCache = { ...this.securitySettingsCache, ...updates };
    this.saveLocalCache();
    this.notify();

    try {
      await setDoc(
        doc(db, 'settings', 'global'),
        { securitySettings: this.securitySettingsCache },
        { merge: true }
      );
      await this.logActivity('update_settings', 'Updated Security Settings');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'settings/global');
    }
  }

  // --- STATS ---
  public getAdminStats(): AdminStats {
    const posts = this.getPosts();
    const categories = this.getCategories();
    const pages = this.getPages();

    const totalViews = posts.reduce((sum, p) => sum + (p.views || 0), 0);
    const totalCopies = posts.reduce((sum, p) => sum + (p.copies || 0), 0);
    const draftCount = posts.filter((p) => p.status === 'draft').length;
    const scheduledCount = posts.filter((p) => p.status === 'scheduled').length;

    return {
      totalPosts: posts.length,
      totalCategories: categories.length,
      totalPages: pages.length,
      totalViews,
      totalCopies,
      draftCount,
      scheduledCount,
    };
  }

  // --- ACTIVITIES ---
  public getActivities(): RecentActivity[] {
    return this.activitiesCache;
  }

  private async logActivity(type: RecentActivity['type'], message: string): Promise<void> {
    const actId = 'act-' + Date.now();
    const timestamp = new Date().toISOString();
    const newActivity: RecentActivity = {
      id: actId,
      type,
      message,
      timestamp,
    };

    this.activitiesCache.unshift(newActivity);
    if (this.activitiesCache.length > 30) {
      this.activitiesCache = this.activitiesCache.slice(0, 30);
    }
    this.notify();

    try {
      const { id: _, ...dataToSave } = newActivity;
      await setDoc(doc(db, 'activities', actId), dataToSave);
    } catch (e) {
      // Non-blocking log write fail
    }
  }

  // --- ADMIN AUTH ---
  public isAdminLoggedIn(): boolean {
    return localStorage.getItem(STORAGE_KEYS.ADMIN_AUTH) === 'true';
  }

  public setAdminLoggedIn(loggedIn: boolean): void {
    if (loggedIn) {
      localStorage.setItem(STORAGE_KEYS.ADMIN_AUTH, 'true');
    } else {
      localStorage.removeItem(STORAGE_KEYS.ADMIN_AUTH);
    }
    this.notify();
  }

  public verifyAdminPasscode(passcode: string): boolean {
    const setPasscode = localStorage.getItem(STORAGE_KEYS.ADMIN_PASS) || DEFAULT_ADMIN_PASSCODE;
    if (passcode === setPasscode) {
      this.setAdminLoggedIn(true);
      return true;
    }
    return false;
  }

  public logoutAdmin(): void {
    this.setAdminLoggedIn(false);
  }

  public setAdminPasscode(newPasscode: string): void {
    localStorage.setItem(STORAGE_KEYS.ADMIN_PASS, newPasscode);
  }

  // --- WEBSITE SETTINGS ---
  public getWebsiteSettings(): WebsiteSettings {
    const raw = this.websiteSettingsCache || DEFAULT_WEBSITE_SETTINGS;
    return {
      ...DEFAULT_WEBSITE_SETTINGS,
      ...raw,
      socialLinks: {
        ...DEFAULT_WEBSITE_SETTINGS.socialLinks,
        ...(raw.socialLinks || {}),
      },
      footerSocialLinks: {
        ...DEFAULT_WEBSITE_SETTINGS.footerSocialLinks,
        ...(raw.footerSocialLinks || {}),
      },
    };
  }

  public async updateWebsiteSettings(settings: Partial<WebsiteSettings>): Promise<void> {
    this.websiteSettingsCache = { ...this.websiteSettingsCache, ...settings };
    this.saveLocalCache();
    this.notify();

    try {
      await setDoc(
        doc(db, 'settings', 'global'),
        { websiteSettings: this.websiteSettingsCache },
        { merge: true }
      );
      await this.logActivity('update_settings', 'Updated Website Settings');
    } catch (e) {
      console.warn('Firestore website settings sync error', e);
    }
  }

  // --- CLOUDINARY SETTINGS & UPLOADER ---
  public getCloudinarySettings(): CloudinarySettings {
    return this.cloudinarySettingsCache;
  }

  public async updateCloudinarySettings(settings: Partial<CloudinarySettings>): Promise<void> {
    this.cloudinarySettingsCache = { ...this.cloudinarySettingsCache, ...settings };
    this.saveLocalCache();
    this.notify();

    try {
      await setDoc(
        doc(db, 'settings', 'global'),
        { cloudinarySettings: this.cloudinarySettingsCache },
        { merge: true }
      );
      await this.logActivity('update_settings', 'Updated Cloudinary Settings');
      this.addNotification('Cloudinary Configured', 'Cloudinary settings updated successfully', 'cloudinary');
    } catch (e) {
      console.warn('Firestore cloudinary settings sync error', e);
    }
  }

  public async uploadToCloudinary(file: File): Promise<{ success: boolean; url?: string; error?: string }> {
    const cloudName = this.cloudinarySettingsCache.cloudName?.trim() || 'dvahk0xom';
    const uploadPreset = this.cloudinarySettingsCache.uploadPreset?.trim() || 'sahil_logo';

    if (!cloudName || !uploadPreset) {
      return {
        success: false,
        error: 'Cloudinary Cloud Name and Upload Preset must be configured in Admin > Settings > Cloudinary.',
      };
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', uploadPreset);

      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errJson = await response.json();
        const msg = errJson.error?.message || 'Cloudinary upload failed';
        this.addNotification('Cloudinary Upload Failed', msg, 'cloudinary');
        return { success: false, error: msg };
      }

      const data = await response.json();
      this.addNotification('Image Uploaded', 'Successfully uploaded image to Cloudinary', 'cloudinary');
      return { success: true, url: data.secure_url };
    } catch (err: any) {
      const msg = err.message || 'Network error uploading to Cloudinary';
      this.addNotification('Cloudinary Error', msg, 'cloudinary');
      return { success: false, error: msg };
    }
  }

  // --- COMMENTS MANAGEMENT ---
  public getCommentsSettings(): CommentsSettings {
    return this.commentsSettingsCache;
  }

  public async updateCommentsSettings(settings: Partial<CommentsSettings>): Promise<void> {
    this.commentsSettingsCache = { ...this.commentsSettingsCache, ...settings };
    this.saveLocalCache();
    this.notify();

    try {
      await setDoc(
        doc(db, 'settings', 'global'),
        { commentsSettings: this.commentsSettingsCache },
        { merge: true }
      );
    } catch (e) {
      console.warn('Firestore comments settings error', e);
    }
  }

  public getComments(postId?: string): CommentItem[] {
    if (postId) {
      return this.commentsCache.filter((c) => c.postId === postId && c.status === 'approved');
    }
    return this.commentsCache;
  }

  public async addComment(
    commentData: Omit<CommentItem, 'id' | 'createdAt' | 'status'>
  ): Promise<CommentItem> {
    const id = 'comment-' + Date.now();
    const status = this.commentsSettingsCache.autoApprove ? 'approved' : 'pending';
    const newComment: CommentItem = {
      ...commentData,
      id,
      status,
      createdAt: new Date().toISOString(),
    };

    this.commentsCache = [newComment, ...this.commentsCache];
    this.saveLocalCache();
    this.notify();

    try {
      await setDoc(doc(db, 'comments', id), newComment);
      this.addNotification('New Comment', `Comment submitted for ${commentData.postTitle || 'a post'}`, 'info');
    } catch (e) {
      console.warn('Firestore add comment error', e);
    }

    return newComment;
  }

  public async updateCommentStatus(id: string, status: 'approved' | 'pending' | 'spam'): Promise<void> {
    this.commentsCache = this.commentsCache.map((c) => (c.id === id ? { ...c, status } : c));
    this.saveLocalCache();
    this.notify();

    try {
      await updateDoc(doc(db, 'comments', id), { status });
    } catch (e) {
      console.warn('Firestore update comment error', e);
    }
  }

  public async deleteComment(id: string): Promise<void> {
    this.commentsCache = this.commentsCache.filter((c) => c.id !== id);
    this.saveLocalCache();
    this.notify();

    try {
      await deleteDoc(doc(db, 'comments', id));
    } catch (e) {
      console.warn('Firestore delete comment error', e);
    }
  }

  // --- NOTIFICATIONS ---
  public getNotifications(): NotificationItem[] {
    return this.notificationsCache;
  }

  public addNotification(
    title: string,
    message: string,
    type: 'post' | 'backup' | 'storage' | 'firebase' | 'cloudinary' | 'info' = 'info'
  ): void {
    const notif: NotificationItem = {
      id: 'notif-' + Date.now(),
      title,
      message,
      type,
      read: false,
      timestamp: new Date().toISOString(),
    };
    this.notificationsCache = [notif, ...this.notificationsCache.slice(0, 49)];
    this.saveLocalCache();
    this.notify();
  }

  public markNotificationRead(id: string): void {
    this.notificationsCache = this.notificationsCache.map((n) => (n.id === id ? { ...n, read: true } : n));
    this.saveLocalCache();
    this.notify();
  }

  public clearNotifications(): void {
    this.notificationsCache = [];
    this.saveLocalCache();
    this.notify();
  }

  // --- PREMIUM / SUBSCRIPTION SETTINGS ---
  public getPremiumSettings(): PremiumSettings {
    return { ...DEFAULT_PREMIUM_SETTINGS, ...(this.premiumSettingsCache || {}) };
  }

  public async updatePremiumSettings(updates: Partial<PremiumSettings>): Promise<void> {
    this.premiumSettingsCache = {
      ...DEFAULT_PREMIUM_SETTINGS,
      ...this.premiumSettingsCache,
      ...updates,
    };
    this.saveLocalCache();
    this.notify();

    try {
      await setDoc(
        doc(db, 'settings', 'global'),
        { premiumSettings: this.premiumSettingsCache },
        { merge: true }
      );
      await setDoc(doc(db, 'settings', 'premium'), this.premiumSettingsCache);
      await this.logActivity('update_settings', 'Updated Premium / Subscription Settings');
    } catch (e) {
      console.warn('Firestore premium settings sync error', e);
    }
  }

  // --- BACKUP & RESTORE SYSTEM ---
  public exportBackupJson(): string {
    const data = {
      version: '3.0',
      exportDate: new Date().toISOString(),
      posts: this.postsCache,
      categories: this.categoriesCache,
      pages: this.pagesCache,
      monetization: this.monetizationCache,
      timerSettings: this.timerSettingsCache,
      seoSettings: this.seoSettingsCache,
      securitySettings: this.securitySettingsCache,
      websiteSettings: this.websiteSettingsCache,
      cloudinarySettings: this.cloudinarySettingsCache,
      commentsSettings: this.commentsSettingsCache,
      comments: this.commentsCache,
    };
    return JSON.stringify(data, null, 2);
  }

  public async importBackupJson(jsonString: string): Promise<{ success: boolean; message: string }> {
    try {
      const data = JSON.parse(jsonString);
      if (!data.posts || !Array.isArray(data.posts) || !data.categories) {
        return { success: false, message: 'Invalid backup JSON file structure.' };
      }

      this.postsCache = data.posts;
      this.categoriesCache = data.categories;
      if (data.pages) this.pagesCache = data.pages;
      if (data.monetization) this.monetizationCache = data.monetization;
      if (data.timerSettings) this.timerSettingsCache = data.timerSettings;
      if (data.seoSettings) this.seoSettingsCache = data.seoSettings;
      if (data.securitySettings) this.securitySettingsCache = data.securitySettings;
      if (data.websiteSettings) this.websiteSettingsCache = data.websiteSettings;
      if (data.cloudinarySettings) this.cloudinarySettingsCache = data.cloudinarySettings;
      if (data.commentsSettings) this.commentsSettingsCache = data.commentsSettings;
      if (data.comments) this.commentsCache = data.comments;

      this.saveLocalCache();
      this.notify();

      // Write to Firestore in background batches
      const batch = writeBatch(db);
      for (const p of this.postsCache) {
        const { id, ...pData } = p;
        batch.set(doc(db, 'prompts', id), pData);
      }
      for (const c of this.categoriesCache) {
        const { id, ...cData } = c;
        batch.set(doc(db, 'categories', id), cData);
      }
      for (const pg of this.pagesCache) {
        const { id, ...pgData } = pg;
        batch.set(doc(db, 'pages', id), pgData);
      }
      batch.set(
        doc(db, 'settings', 'global'),
        {
          monetization: this.monetizationCache,
          timerSettings: this.timerSettingsCache,
          seoSettings: this.seoSettingsCache,
          securitySettings: this.securitySettingsCache,
          websiteSettings: this.websiteSettingsCache,
          cloudinarySettings: this.cloudinarySettingsCache,
          commentsSettings: this.commentsSettingsCache,
          featureControls: this.featureControlsCache,
        },
        { merge: true }
      );

      await batch.commit();
      await this.logActivity('backup_restore', `Restored database backup (${this.postsCache.length} posts)`);
      this.addNotification('Backup Restored', `Restored ${this.postsCache.length} posts successfully`, 'backup');

      return {
        success: true,
        message: `Successfully restored ${this.postsCache.length} posts, ${this.categoriesCache.length} categories, and ${this.pagesCache.length} pages!`,
      };
    } catch (e: any) {
      return { success: false, message: e.message || 'Error parsing backup file.' };
    }
  }

  // --- FEATURE CONTROLS ---
  public getFeatureControls(): FeatureControls {
    return { ...DEFAULT_FEATURE_CONTROLS, ...(this.featureControlsCache || {}) };
  }

  public async updateFeatureControls(settings: Partial<FeatureControls>): Promise<void> {
    this.featureControlsCache = { ...DEFAULT_FEATURE_CONTROLS, ...this.featureControlsCache, ...settings };
    this.saveLocalCache();
    this.notify();

    try {
      await setDoc(
        doc(db, 'settings', 'global'),
        { featureControls: this.featureControlsCache },
        { merge: true }
      );
      await this.logActivity('update_settings', 'Updated Feature Controls');
    } catch (e) {
      console.warn('Firestore feature controls sync error', e);
    }
  }

  public async enableAllFeatureControls(): Promise<void> {
    const allEnabled: FeatureControls = { ...DEFAULT_FEATURE_CONTROLS };
    Object.keys(allEnabled).forEach((key) => {
      (allEnabled as any)[key] = true;
    });
    allEnabled.maintenanceMode = false;
    await this.updateFeatureControls(allEnabled);
  }

  public async disableAllFeatureControls(): Promise<void> {
    const allDisabled: FeatureControls = { ...DEFAULT_FEATURE_CONTROLS };
    Object.keys(allDisabled).forEach((key) => {
      (allDisabled as any)[key] = false;
    });
    allDisabled.adminLogin = true;
    await this.updateFeatureControls(allDisabled);
  }

  public async restoreDefaultFeatureControls(): Promise<void> {
    await this.updateFeatureControls(DEFAULT_FEATURE_CONTROLS);
  }

  // --- WEBSITE SECTIONS CONTROLS ---
  public getWebsiteSections(): WebsiteSectionsSettings {
    return {
      ...DEFAULT_WEBSITE_SECTIONS,
      ...this.websiteSectionsCache,
      categories: {
        ...DEFAULT_WEBSITE_SECTIONS.categories,
        ...(this.websiteSectionsCache?.categories || {}),
      },
      categoryPage: {
        ...DEFAULT_WEBSITE_SECTIONS.categoryPage,
        ...(this.websiteSectionsCache?.categoryPage || {}),
      },
      sectionHeights: {
        ...DEFAULT_WEBSITE_SECTIONS.sectionHeights,
        ...(this.websiteSectionsCache?.sectionHeights || {}),
      },
    };
  }

  public async updateWebsiteSections(updates: Partial<WebsiteSectionsSettings>): Promise<void> {
    const updated: WebsiteSectionsSettings = {
      ...DEFAULT_WEBSITE_SECTIONS,
      ...this.websiteSectionsCache,
      ...updates,
      categories: {
        ...DEFAULT_WEBSITE_SECTIONS.categories,
        ...(this.websiteSectionsCache?.categories || {}),
        ...(updates.categories || {}),
      },
      categoryPage: {
        ...DEFAULT_WEBSITE_SECTIONS.categoryPage,
        ...(this.websiteSectionsCache?.categoryPage || {}),
        ...(updates.categoryPage || {}),
      },
      sectionHeights: {
        ...DEFAULT_WEBSITE_SECTIONS.sectionHeights,
        ...(this.websiteSectionsCache?.sectionHeights || {}),
        ...(updates.sectionHeights || {}),
      },
    };

    this.websiteSectionsCache = updated;
    this.saveLocalCache();
    this.notify();

    try {
      // 1. Set specific document settings/websiteSections
      await setDoc(doc(db, 'settings', 'websiteSections'), updated);

      // 2. Also merge into global document
      await setDoc(
        doc(db, 'settings', 'global'),
        { websiteSections: updated },
        { merge: true }
      );
      await this.logActivity('update_settings', 'Updated Website Sections Display Controls');
    } catch (e) {
      console.warn('Firestore website sections sync error', e);
    }
  }

  public async enableAllWebsiteSections(): Promise<void> {
    const allEnabled: WebsiteSectionsSettings = {
      ...DEFAULT_WEBSITE_SECTIONS,
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
    };
    await this.updateWebsiteSections(allEnabled);
  }

  public async disableAllWebsiteSections(): Promise<void> {
    const allDisabled: WebsiteSectionsSettings = {
      ...DEFAULT_WEBSITE_SECTIONS,
      hero: false,
      search: false,
      popularCategories: false,
      tabs: false,
      featuredPost: false,
      trendingPosts: false,
      postGallery: false,
      backToTop: false,
      adBanners: false,
      categoryPage: {
        breadcrumb: false,
        title: false,
        description: false,
        tabs: false,
        postGrid: false,
      },
    };
    await this.updateWebsiteSections(allDisabled);
  }

  public async restoreDefaultWebsiteSections(): Promise<void> {
    await this.updateWebsiteSections(DEFAULT_WEBSITE_SECTIONS);
  }

  public async resetToDefault(): Promise<void> {
    await this.seedInitialPrompts();
    await this.seedInitialCategories();
    await this.seedInitialPages();
    this.notify();
  }
}

export const promptStore = new PromptStore();
