import { AdminTab } from '../components/admin/AdminSidebar';

export interface TabMeta {
  tab: AdminTab;
  title: string;
  group: string;
  slug: string;
}

export const ADMIN_TABS_META: Record<AdminTab, { title: string; group: string; slug: string }> = {
  dashboard: { title: 'Dashboard', group: 'MAIN', slug: 'dashboard' },
  posts: { title: 'Posts CMS', group: 'CONTENT', slug: 'posts' },
  add_post: { title: 'Publish New Post', group: 'CONTENT', slug: 'posts' },
  categories: { title: 'Categories', group: 'CONTENT', slug: 'categories' },
  trending: { title: 'Trending Posts', group: 'CONTENT', slug: 'trending' },
  latest: { title: 'Latest Posts', group: 'CONTENT', slug: 'latest' },
  popular: { title: 'Popular Posts', group: 'CONTENT', slug: 'popular' },
  likes: { title: 'Likes Overview', group: 'ENGAGEMENT', slug: 'likes' },
  shares: { title: 'Shares Analytics', group: 'ENGAGEMENT', slug: 'shares' },
  views: { title: 'Views Breakdown', group: 'ENGAGEMENT', slug: 'views' },
  ratings: { title: 'Prompt Ratings', group: 'ENGAGEMENT', slug: 'ratings' },
  comments: { title: 'Comments Moderation', group: 'ENGAGEMENT', slug: 'comments' },
  users: { title: 'User Management', group: 'USERS', slug: 'users' },
  premium_users: { title: 'Premium Subscribers', group: 'USERS', slug: 'premium-users' },
  premium: { title: 'Subscription / Premium', group: 'MONETIZATION', slug: 'premium' },
  monetization: { title: 'Ads & Networks', group: 'MONETIZATION', slug: 'monetization' },
  share: { title: 'Post Share Controls', group: 'SOCIAL', slug: 'share' },
  footer_social: { title: 'Footer Social Links', group: 'SOCIAL', slug: 'footer-social' },
  contact_social: { title: 'Contact Social Links', group: 'SOCIAL', slug: 'contact-social' },
  sections: { title: 'Homepage Settings', group: 'WEBSITE', slug: 'sections' },
  footer: { title: 'Footer Settings', group: 'WEBSITE', slug: 'footer' },
  pages: { title: 'Pages & Navigation', group: 'WEBSITE', slug: 'pages' },
  postcard: { title: 'Post Card Appearance', group: 'WEBSITE', slug: 'postcard' },
  logo: { title: 'Logo & Branding', group: 'WEBSITE', slug: 'logo' },
  features: { title: 'Feature Controls', group: 'WEBSITE', slug: 'features' },
  seo: { title: 'SEO Settings', group: 'WEBSITE', slug: 'seo' },
  firebase: { title: 'Firebase / Storage', group: 'SYSTEM', slug: 'firebase' },
  cloudinary: { title: 'Cloudinary API', group: 'SYSTEM', slug: 'cloudinary' },
  security: { title: 'Security & Auth', group: 'SYSTEM', slug: 'security' },
  activity: { title: 'Activity & Logs', group: 'SYSTEM', slug: 'activity' },
  settings: { title: 'Admin Settings', group: 'SYSTEM', slug: 'settings' },
  deployment: { title: 'Deployment Guide', group: 'SYSTEM', slug: 'deployment' },
};

// Map slug or alias to AdminTab
const SLUG_TO_TAB: Record<string, AdminTab> = {
  dashboard: 'dashboard',
  posts: 'posts',
  categories: 'categories',
  trending: 'trending',
  latest: 'latest',
  popular: 'popular',
  likes: 'likes',
  shares: 'shares',
  views: 'views',
  ratings: 'ratings',
  comments: 'comments',
  users: 'users',
  'premium-users': 'premium_users',
  premium_users: 'premium_users',
  premium: 'premium',
  subscription: 'premium',
  monetization: 'monetization',
  ads: 'monetization',
  share: 'share',
  'share-controls': 'share',
  'footer-social': 'footer_social',
  footer_social: 'footer_social',
  'contact-social': 'contact_social',
  contact_social: 'contact_social',
  sections: 'sections',
  homepage: 'sections',
  footer: 'footer',
  pages: 'pages',
  postcard: 'postcard',
  'post-card': 'postcard',
  logo: 'logo',
  branding: 'logo',
  features: 'features',
  seo: 'seo',
  firebase: 'firebase',
  storage: 'firebase',
  cloudinary: 'cloudinary',
  security: 'security',
  auth: 'security',
  activity: 'activity',
  logs: 'activity',
  settings: 'settings',
  deployment: 'deployment',
};

/**
 * Parses the current browser URL to determine if an admin tab was requested.
 * Supports /admin/:slug, ?admin=:slug, ?tab=:slug, #admin/:slug, #admin=:slug
 */
export function getAdminTabFromUrl(url?: string): AdminTab | null {
  const targetUrl = url ? new URL(url, window.location.origin) : window.location;
  const pathname = targetUrl.pathname.toLowerCase();
  const search = targetUrl.search;
  const hash = targetUrl.hash.toLowerCase();

  // 1. Check path: /admin or /admin/:slug
  if (pathname === '/admin' || pathname === '/admin/') {
    return 'dashboard';
  }

  if (pathname.startsWith('/admin/')) {
    const sub = pathname.replace('/admin/', '').split('/')[0].trim();
    if (sub && SLUG_TO_TAB[sub]) {
      return SLUG_TO_TAB[sub];
    }
    return 'dashboard';
  }

  // 2. Check query params: ?admin=likes, ?tab=likes
  const searchParams = new URLSearchParams(search);
  const adminParam = searchParams.get('admin') || searchParams.get('tab');
  if (adminParam) {
    const cleanParam = adminParam.toLowerCase().trim();
    if (SLUG_TO_TAB[cleanParam]) {
      return SLUG_TO_TAB[cleanParam];
    }
    return 'dashboard';
  }

  // 3. Check hash: #admin/likes or #admin=likes or #admin
  if (hash.startsWith('#admin')) {
    const hashClean = hash.replace('#admin', '').replace(/^[\/=?]+/, '').trim();
    if (hashClean && SLUG_TO_TAB[hashClean]) {
      return SLUG_TO_TAB[hashClean];
    }
    return 'dashboard';
  }

  return null;
}

/**
 * Returns canonical browser URL path for an AdminTab.
 */
export function getUrlForAdminTab(tab: AdminTab): string {
  const meta = ADMIN_TABS_META[tab];
  const slug = meta ? meta.slug : tab;
  return `/admin/${slug}`;
}

/**
 * Returns metadata (title, group) for an AdminTab.
 */
export function getTabMetadata(tab: AdminTab): { title: string; group: string } {
  const meta = ADMIN_TABS_META[tab];
  if (meta) {
    return { title: meta.title, group: meta.group };
  }
  return { title: 'Admin Workspace', group: 'Management' };
}
