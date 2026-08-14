import { WebsiteSettings, FeatureControls, SocialChannelConfig } from '../types';

export type SocialPlatformId =
  | 'instagram'
  | 'facebook'
  | 'telegram'
  | 'discord'
  | 'youtube'
  | 'twitter'
  | 'whatsapp'
  | 'github';

export interface SocialChannelMeta {
  id: SocialPlatformId;
  name: string;
  shortName: string;
  placeholder: string;
  helperText: string;
  defaultDomain: string;
  brandColor: string;
}

export const ORDERED_FOOTER_CHANNELS: SocialPlatformId[] = [
  'instagram',
  'facebook',
  'telegram',
  'discord',
  'youtube',
  'twitter',
  'whatsapp',
  'github',
];

export const SOCIAL_CHANNELS_META: Record<SocialPlatformId, SocialChannelMeta> = {
  instagram: {
    id: 'instagram',
    name: 'Instagram',
    shortName: 'Instagram',
    placeholder: 'https://instagram.com/sahil_edits or @sahil_edits',
    helperText: 'Profile URL or handle',
    defaultDomain: 'instagram.com',
    brandColor: 'text-pink-500 hover:text-pink-400',
  },
  facebook: {
    id: 'facebook',
    name: 'Facebook',
    shortName: 'Facebook',
    placeholder: 'https://facebook.com/sahiledits',
    helperText: 'Page or profile URL',
    defaultDomain: 'facebook.com',
    brandColor: 'text-blue-500 hover:text-blue-400',
  },
  telegram: {
    id: 'telegram',
    name: 'Telegram',
    shortName: 'Telegram',
    placeholder: 'https://t.me/sahiledits or @sahiledits',
    helperText: 'Channel link or username',
    defaultDomain: 't.me',
    brandColor: 'text-sky-400 hover:text-sky-300',
  },
  discord: {
    id: 'discord',
    name: 'Discord',
    shortName: 'Discord',
    placeholder: 'https://discord.gg/sahiledits',
    helperText: 'Server invite link',
    defaultDomain: 'discord.gg',
    brandColor: 'text-indigo-400 hover:text-indigo-300',
  },
  youtube: {
    id: 'youtube',
    name: 'YouTube',
    shortName: 'YouTube',
    placeholder: 'https://youtube.com/@sahiledits',
    helperText: 'Channel URL or handle',
    defaultDomain: 'youtube.com',
    brandColor: 'text-red-500 hover:text-red-400',
  },
  twitter: {
    id: 'twitter',
    name: 'X / Twitter',
    shortName: 'X (Twitter)',
    placeholder: 'https://x.com/sahiledits or @sahiledits',
    helperText: 'X (Twitter) profile URL or handle',
    defaultDomain: 'x.com',
    brandColor: 'text-zinc-200 hover:text-white',
  },
  whatsapp: {
    id: 'whatsapp',
    name: 'WhatsApp',
    shortName: 'WhatsApp',
    placeholder: '+91 98765 43210 or https://wa.me/919876543210',
    helperText: 'Phone number with country code or full wa.me link',
    defaultDomain: 'wa.me',
    brandColor: 'text-emerald-400 hover:text-emerald-300',
  },
  github: {
    id: 'github',
    name: 'GitHub',
    shortName: 'GitHub',
    placeholder: 'https://github.com/sahiledits or @sahiledits',
    helperText: 'Profile or repo URL',
    defaultDomain: 'github.com',
    brandColor: 'text-zinc-300 hover:text-white',
  },
};

/**
 * Format WhatsApp input into valid https://wa.me/PHONE_NUMBER
 */
export function formatWhatsAppValue(input?: string): string {
  if (!input || !input.trim()) return '';
  const trimmed = input.trim();

  // If already a full wa.me or whatsapp url
  if (/^https?:\/\/(wa\.me|api\.whatsapp\.com|web\.whatsapp\.com)\//i.test(trimmed)) {
    return trimmed;
  }

  // Strip spaces, +, -, (), and any non-numeric characters
  const digitsOnly = trimmed.replace(/[^0-9]/g, '');
  if (digitsOnly.length >= 6) {
    return `https://wa.me/${digitsOnly}`;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return digitsOnly ? `https://wa.me/${digitsOnly}` : '';
}

/**
 * Format any social URL or handle to a fully-qualified https URL
 */
export function formatSocialChannelUrl(platform: SocialPlatformId | string, rawUrl?: string): string {
  if (!rawUrl || !rawUrl.trim()) return '';
  const trimmed = rawUrl.trim();

  if (platform === 'whatsapp') {
    return formatWhatsAppValue(trimmed);
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  const cleanHandle = trimmed.startsWith('@') ? trimmed.substring(1) : trimmed;

  switch (platform.toLowerCase()) {
    case 'instagram':
      return `https://instagram.com/${cleanHandle}`;
    case 'facebook':
      return `https://facebook.com/${cleanHandle}`;
    case 'telegram':
      return `https://t.me/${cleanHandle}`;
    case 'discord':
      return cleanHandle.startsWith('http') ? cleanHandle : `https://discord.gg/${cleanHandle}`;
    case 'youtube':
      return `https://youtube.com/@${cleanHandle}`;
    case 'twitter':
    case 'x':
      return `https://x.com/${cleanHandle}`;
    case 'github':
      return `https://github.com/${cleanHandle}`;
    default:
      return `https://${cleanHandle}`;
  }
}

/**
 * Validates whether a given raw social URL or handle is valid
 */
export function validateSocialInput(platform: SocialPlatformId, rawVal: string): { isValid: boolean; warning?: string } {
  if (!rawVal || !rawVal.trim()) {
    return { isValid: false, warning: 'Add a valid URL to display this channel.' };
  }

  const trimmed = rawVal.trim();

  if (platform === 'whatsapp') {
    const formatted = formatWhatsAppValue(trimmed);
    if (!formatted || formatted === 'https://wa.me/') {
      return { isValid: false, warning: 'Please enter a valid phone number with country code (e.g. +91 9876543210) or wa.me link.' };
    }
    return { isValid: true };
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      new URL(trimmed);
      return { isValid: true };
    } catch {
      return { isValid: false, warning: 'Please enter a valid URL (e.g. https://...).' };
    }
  }

  // Handle formats like @username or username
  if (/^[a-zA-Z0-9_.-]+$/.test(trimmed.replace(/^@/, ''))) {
    return { isValid: true };
  }

  return { isValid: true };
}

/**
 * Normalizes all 8 footer social channels from WebsiteSettings & FeatureControls
 * with complete backward compatibility for legacy data
 */
export function getNormalizedFooterSocialLinks(
  websiteSettings: WebsiteSettings,
  featureControls?: FeatureControls
): Record<SocialPlatformId, SocialChannelConfig> {
  const legacySocial = websiteSettings?.socialLinks || {};
  const explicitFooterLinks = websiteSettings?.footerSocialLinks || (legacySocial as any)?.channels || (legacySocial as any)?.footerSocialLinks || {};

  const result: Record<SocialPlatformId, SocialChannelConfig> = {
    instagram: { enabled: false, url: '' },
    facebook: { enabled: false, url: '' },
    telegram: { enabled: false, url: '' },
    discord: { enabled: false, url: '' },
    youtube: { enabled: false, url: '' },
    twitter: { enabled: false, url: '' },
    whatsapp: { enabled: false, url: '' },
    github: { enabled: false, url: '' },
  };

  for (const channel of ORDERED_FOOTER_CHANNELS) {
    const explicit = explicitFooterLinks[channel] || (channel === 'twitter' ? explicitFooterLinks['x'] : undefined);

    let url = '';
    let enabled = false;

    if (explicit && typeof explicit === 'object') {
      url = typeof explicit.url === 'string' ? explicit.url : '';
      enabled = Boolean(explicit.enabled);
    } else {
      // Fallback to legacy string field in socialLinks
      const legacyVal = (legacySocial as any)[channel] || (channel === 'twitter' ? (legacySocial as any)['x'] : undefined);
      if (typeof legacyVal === 'string' && legacyVal.trim().length > 0) {
        url = legacyVal.trim();
        // If legacy value existed:
        if (channel === 'discord' || channel === 'github') {
          // Check feature control toggle if present
          if (featureControls) {
            const toggleKey = `footer${channel.charAt(0).toUpperCase() + channel.slice(1)}Toggle` as keyof FeatureControls;
            enabled = featureControls[toggleKey] !== false;
          } else {
            enabled = true;
          }
        } else {
          const toggleKey = `footer${channel.charAt(0).toUpperCase() + channel.slice(1)}Toggle` as keyof FeatureControls;
          enabled = featureControls ? featureControls[toggleKey] !== false : true;
        }
      } else {
        url = '';
        enabled = false;
      }
    }

    result[channel] = {
      enabled,
      url: url || '',
    };
  }

  return result;
}
