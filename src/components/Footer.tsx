import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Instagram,
  Facebook,
  Github,
  Youtube,
  MessageSquare,
  ArrowUp,
  Zap,
  ShieldCheck,
  Heart,
  CheckCircle2,
  Mail,
  ArrowRight,
  Layers,
  FileText,
  Info,
  Lock,
  Crown,
} from 'lucide-react';
import { CustomPage } from '../types';
import { promptStore } from '../services/promptStore';
import { useLogo } from '../context/LogoContext';
import { AdBanner } from './AdBanner';
import { useToast } from './Toast';
import {
  ORDERED_FOOTER_CHANNELS,
  SOCIAL_CHANNELS_META,
  SocialPlatformId,
  formatSocialChannelUrl,
  getNormalizedFooterSocialLinks,
} from '../services/socialMediaService';

interface FooterProps {
  onOpenPage: (page: CustomPage) => void;
  onOpenPremium?: () => void;
}

// Custom X (Twitter) Icon
const XIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

// Custom Telegram Icon
const TelegramIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.02-1.96 1.25-5.54 3.69-.52.36-1 .53-1.42.52-.47-.01-1.37-.26-2.03-.48-.82-.27-1.47-.42-1.42-.88.03-.25.38-.51 1.07-.78 4.18-1.82 6.97-3.02 8.38-3.61 3.98-1.66 4.81-1.95 5.35-1.96.12 0 .38.03.55.17.14.12.18.28.2.45-.02.07-.02.21-.04.38z" />
  </svg>
);

// Custom Discord Icon
const DiscordIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
  </svg>
);

export const Footer: React.FC<FooterProps> = React.memo(({ onOpenPage, onOpenPremium }) => {
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const { showToast } = useToast();
  const { logoUrl } = useLogo();

  const [websiteSettings, setWebsiteSettings] = useState(() => promptStore.getWebsiteSettings());
  const [fc, setFc] = useState(() => promptStore.getFeatureControls());

  useEffect(() => {
    const unsubscribe = promptStore.subscribe(() => {
      setWebsiteSettings(promptStore.getWebsiteSettings());
      setFc(promptStore.getFeatureControls());
    });
    return unsubscribe;
  }, []);

  const publishedPages = promptStore.getPages().filter((p) => p.status === 'published');
  const monetizationSettings = promptStore.getMonetization();
  const social = websiteSettings.socialLinks;
  const footerText = websiteSettings.footerText || '© 2026 Sahil Edits. All Rights Reserved.';

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail || !newsletterEmail.includes('@')) {
      showToast('Error', 'Please enter a valid email address.', 'error');
      return;
    }
    showToast('✓ Subscribed!', 'Thank you for subscribing to Sahil Edits updates.');
    setNewsletterEmail('');
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const scrollContainers = document.querySelectorAll('.overflow-y-auto');
    scrollContainers.forEach((el) => {
      el.scrollTo({ top: 0, behavior: 'smooth' });
    });
  };

  // Helper function to open or create system page
  const openOrCreatePage = (title: string, slug: string, defaultContent: string) => {
    const existing = publishedPages.find(
      (p) => p.slug === slug || p.title.toLowerCase() === title.toLowerCase()
    );
    if (existing) {
      onOpenPage(existing);
    } else {
      onOpenPage({
        id: slug,
        title,
        slug,
        content: defaultContent,
        status: 'published',
        isSystem: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  };

  // Master social media toggle check
  const isSocialMediaEnabled =
    (fc.footerSocialLinks !== false) &&
    (websiteSettings.socialLinks?.enabled !== false);

  const normalizedSocialMap = getNormalizedFooterSocialLinks(websiteSettings, fc);

  const activeSocialItems = isSocialMediaEnabled
    ? ORDERED_FOOTER_CHANNELS
        .map((channelId) => {
          const cfg = normalizedSocialMap[channelId];
          if (!cfg || !cfg.enabled || !cfg.url || !cfg.url.trim()) return null;
          const formattedUrl = formatSocialChannelUrl(channelId, cfg.url);
          if (!formattedUrl) return null;

          const meta = SOCIAL_CHANNELS_META[channelId];
          let icon: React.ReactNode = <Instagram className="w-5 h-5" />;
          if (channelId === 'instagram') icon = <Instagram className="w-5 h-5" />;
          if (channelId === 'facebook') icon = <Facebook className="w-5 h-5" />;
          if (channelId === 'telegram') icon = <TelegramIcon className="w-5 h-5" />;
          if (channelId === 'discord') icon = <DiscordIcon className="w-5 h-5" />;
          if (channelId === 'youtube') icon = <Youtube className="w-5 h-5 text-red-500" />;
          if (channelId === 'twitter') icon = <XIcon className="w-5 h-5" />;
          if (channelId === 'whatsapp') icon = <MessageSquare className="w-5 h-5 text-emerald-400" />;
          if (channelId === 'github') icon = <Github className="w-5 h-5" />;

          return {
            id: channelId,
            label: meta.name,
            url: formattedUrl,
            icon,
          };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null)
    : [];

  // Glowing badges array
  const glowingBadges = [
    { label: '1-Click Copy', icon: Zap, colorClass: 'from-blue-500/10 to-indigo-500/10 text-blue-700 border-blue-200' },
    { label: 'Verified Prompts', icon: ShieldCheck, colorClass: 'from-emerald-500/10 to-teal-500/10 text-emerald-700 border-emerald-200' },
    { label: 'Daily Updates', icon: Sparkles, colorClass: 'from-purple-500/10 to-pink-500/10 text-purple-700 border-purple-200' },
    { label: '100% Free', icon: Heart, colorClass: 'from-amber-500/10 to-orange-500/10 text-amber-700 border-amber-200' },
  ];

  // Quick Links items formatted as glass cards
  const quickLinksList = [
    {
      title: 'Premium',
      icon: Crown,
      onClick: () => {
        if (onOpenPremium) {
          onOpenPremium();
        } else {
          const params = new URLSearchParams(window.location.search);
          params.set('premium', 'true');
          window.history.pushState({}, '', `${window.location.pathname}?${params.toString()}`);
          window.dispatchEvent(new Event('popstate'));
        }
      },
    },
    {
      title: 'Explore Prompts',
      icon: Sparkles,
      onClick: scrollToTop,
    },
    {
      title: 'Categories',
      icon: Layers,
      onClick: () => {
        const catEl = document.getElementById('categories-section');
        if (catEl) catEl.scrollIntoView({ behavior: 'smooth' });
        else scrollToTop();
      },
    },
    {
      title: 'Privacy Policy',
      icon: Lock,
      onClick: () =>
        openOrCreatePage(
          'Privacy Policy',
          'privacy-policy',
          '## Privacy Policy\n\nYour privacy is important to us. Sahil Edits does not sell or share personal user data. All prompt copying and interactions are encrypted and secured.'
        ),
    },
    {
      title: 'Terms & Conditions',
      icon: FileText,
      onClick: () =>
        openOrCreatePage(
          'Terms & Conditions',
          'terms-and-conditions',
          '## Terms & Conditions\n\nWelcome to Sahil Edits. By accessing our platform, you agree to use our AI prompt templates ethically and responsibly.'
        ),
    },
    {
      title: 'Contact Us',
      icon: Mail,
      onClick: () =>
        openOrCreatePage(
          'Contact Us',
          'contact-us',
          '## Contact Us\n\nHave questions or custom prompt requests? Reach out to us at support@sahiledits.com or connect via our social channels.'
        ),
    },
    {
      title: 'About Us',
      icon: Info,
      onClick: () =>
        openOrCreatePage(
          'About Us',
          'about-us',
          '## About Sahil Edits\n\nSahil Edits is the premier AI prompt library dedicated to helping creators, prompt engineers, and developers maximize their productivity.'
        ),
    },
    {
      title: 'AI Policy',
      icon: ShieldCheck,
      onClick: () =>
        openOrCreatePage(
          'AI Policy',
          'ai-policy',
          '## AI Ethical Policy\n\nAll AI prompts hosted on Sahil Edits adhere to safety, creativity, and privacy standards. Prompts are curated for ethical research, design, and content creation.'
        ),
    },
    {
      title: 'Disclaimer',
      icon: Info,
      onClick: () =>
        openOrCreatePage(
          'Disclaimer',
          'disclaimer',
          '## Disclaimer\n\nSahil Edits provides AI prompt templates for informational and creative purposes. Results generated by third-party AI models may vary.'
        ),
    },
  ];

  // Append dynamic published pages if any custom ones exist
  publishedPages.forEach((p) => {
    if (!quickLinksList.some((q) => q.title.toLowerCase() === p.title.toLowerCase())) {
      quickLinksList.push({
        title: p.title,
        icon: FileText,
        onClick: () => onOpenPage(p),
      });
    }
  });

  const hasStickyBanner = monetizationSettings.enabled && monetizationSettings.positions.stickyBottomBanner;

  return (
    <footer
      aria-label="Site Footer"
      style={{ minHeight: 'auto' }}
      className={`w-full bg-[#F8FAFC] dark:bg-slate-950 bg-gradient-to-b from-[#F1F5F9] via-[#F8FAFC] to-[#EEF2FF] dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-800 dark:text-slate-100 border-t border-slate-200/80 dark:border-slate-800 relative z-30 pt-12 sm:pt-16 ${
        hasStickyBanner ? 'pb-24 sm:pb-16' : 'pb-12'
      } overflow-hidden transition-all duration-300`}
    >
      {/* Top Stylish Gradient Glow Accent Line & Ambient Curve Overlay */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-purple-400 via-indigo-400 to-transparent opacity-80 z-20" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-gradient-to-r from-purple-300/20 via-indigo-300/20 to-blue-300/20 dark:from-purple-600/10 dark:via-indigo-600/10 dark:to-blue-600/10 blur-2xl pointer-events-none rounded-full" />

      {/* Ambient Soft Background Glows */}
      <div className="absolute top-0 left-1/4 w-72 h-72 sm:w-80 sm:h-80 bg-purple-300/10 dark:bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-72 h-72 sm:w-80 sm:h-80 bg-indigo-300/10 dark:bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-[1400px] 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col gap-10 sm:gap-12">
        {/* Optional Footer Ad Banner */}
        <AdBanner position="footerBanner" settings={monetizationSettings} />

        {/* 1. TOP BRAND SECTION */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 sm:gap-8 pb-8 border-b border-slate-200/80 dark:border-slate-800/80">
          <div className="flex flex-col gap-3.5 max-w-2xl w-full">
            {/* Brand Logo & Title */}
            <div className="flex items-center gap-3.5">
              <div className="relative shrink-0">
                <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-600 opacity-50 blur" />
                <div className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-600 flex items-center justify-center text-white shadow-md border border-white/40 dark:border-slate-700 overflow-hidden p-0.5">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Footer Logo" className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse" />
                  )}
                </div>
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  {websiteSettings.websiteName || 'Sahil Edits'}
                </h2>
                <p className="text-[11px] sm:text-xs font-bold tracking-widest text-purple-600 dark:text-purple-400 uppercase">
                  {websiteSettings.tagline || 'Premium AI Prompt Library'}
                </p>
              </div>
            </div>

            {/* Description */}
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
              Discover, copy, and master top-tier AI prompts for Gemini, ChatGPT, Midjourney, Bing &amp; more.
              Engineered for creators, developers, and digital innovators.
            </p>

            {/* Glowing Badges */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {glowingBadges.map((badge) => {
                const IconComp = badge.icon;
                return (
                  <span
                    key={badge.label}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] sm:text-xs font-semibold bg-gradient-to-r ${badge.colorClass} border shadow-sm hover:scale-105 transition-transform cursor-default`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 opacity-90 shrink-0" />
                    <IconComp className="w-3.5 h-3.5 opacity-80 shrink-0" />
                    <span className="whitespace-nowrap">{badge.label}</span>
                  </span>
                );
              })}
            </div>
          </div>

          {/* Inline Back To Top Button */}
          <div className="self-start lg:self-center shrink-0">
            <button
              onClick={scrollToTop}
              aria-label="Scroll back to top"
              className="group flex items-center gap-2.5 px-4 sm:px-5 py-2.5 sm:py-3 rounded-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-600 text-slate-700 dark:text-slate-200 font-semibold text-xs shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
            >
              <span>Back to Top</span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-600 text-white flex items-center justify-center shadow-sm group-hover:scale-110 group-hover:-rotate-6 transition-transform">
                <ArrowUp className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
              </div>
            </button>
          </div>
        </div>

        {/* 2. MAIN GRID (Quick Links, Newsletter, Social Icons) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          {/* Quick Links Section (2-Column Grid of Glass Cards) - 6 cols */}
          <div className="lg:col-span-6 flex flex-col gap-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>Quick Navigation</span>
            </h3>

            <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
              {quickLinksList.slice(0, 8).map((link) => {
                const IconComponent = link.icon;
                return (
                  <button
                    key={link.title}
                    onClick={link.onClick}
                    className="group p-3 sm:p-3.5 rounded-2xl bg-white dark:bg-slate-900/80 hover:bg-purple-50/70 dark:hover:bg-purple-900/30 border border-slate-200/80 dark:border-slate-800/80 hover:border-purple-300 dark:hover:border-purple-600 flex items-center gap-2.5 sm:gap-3 text-[11px] sm:text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-purple-900 dark:hover:text-purple-300 shadow-sm transition-all duration-200 hover:-translate-y-0.5 text-left cursor-pointer"
                  >
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-slate-100 dark:bg-slate-800 group-hover:bg-purple-100 dark:group-hover:bg-purple-900/50 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 transition-colors">
                      <IconComponent className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </div>
                    <span className="truncate">{link.title}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Newsletter & Social Section - 6 cols */}
          <div className="lg:col-span-6 flex flex-col gap-6">
            {/* Newsletter Subscription Card */}
            <div className="p-5 sm:p-7 rounded-3xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-md relative overflow-hidden group">
              <div className="absolute -right-10 -bottom-10 w-36 h-36 bg-purple-300/15 dark:bg-purple-600/15 rounded-full blur-2xl group-hover:bg-purple-300/25 dark:group-hover:bg-purple-600/25 transition-all pointer-events-none" />

              <div className="relative z-10 flex flex-col gap-3.5">
                <div className="flex flex-col gap-1">
                  <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Mail className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                    <span>Join Our Prompt Newsletter</span>
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">
                    Get weekly high-converting AI prompts and editing tips delivered straight to your inbox.
                  </p>
                </div>

                <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 mt-1">
                  <div className="relative w-full">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                    <input
                      type="email"
                      required
                      value={newsletterEmail}
                      onChange={(e) => setNewsletterEmail(e.target.value)}
                      placeholder="Enter your email address..."
                      className="w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none transition-all"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-6 py-2.5 sm:py-3 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold text-xs shadow-md shadow-purple-500/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                  >
                    <span>Subscribe</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>

            {/* Social Media Section (Directly below Newsletter) */}
            {activeSocialItems.length > 0 && (
              <div className="flex flex-col gap-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Connect With Us
                </h3>

                <div className="flex items-center flex-wrap gap-2.5 sm:gap-3">
                  {activeSocialItems.map((item) => (
                    <a
                      key={item.id}
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={item.label}
                      title={item.label}
                      className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300 shadow-sm flex items-center justify-center transition-all duration-200 hover:scale-110 hover:text-purple-600 dark:hover:text-purple-400 hover:border-purple-300 dark:hover:border-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/50 cursor-pointer"
                    >
                      {item.icon}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 3. BOTTOM BAR (Divider, Copyright, Policy Links) */}
        <div className="pt-6 sm:pt-8 border-t border-slate-200/80 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400 font-medium">
          {/* Copyright */}
          <div className="text-center sm:text-left">
            {footerText}
          </div>

          {/* Policy Links */}
          <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
            <button
              onClick={() =>
                openOrCreatePage(
                  'Privacy Policy',
                  'privacy-policy',
                  '## Privacy Policy\n\nYour privacy is important to us. Sahil Edits does not sell or share personal user data. All prompt copying and interactions are encrypted and secured.'
                )
              }
              className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors cursor-pointer"
            >
              Privacy
            </button>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <button
              onClick={() =>
                openOrCreatePage(
                  'Terms of Service',
                  'terms-of-service',
                  '## Terms of Service\n\nWelcome to Sahil Edits. By accessing our platform, you agree to use our AI prompt templates ethically and responsibly.'
                )
              }
              className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors cursor-pointer"
            >
              Terms
            </button>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <button
              onClick={() =>
                openOrCreatePage(
                  'Contact Us',
                  'contact-us',
                  '## Contact Us\n\nHave questions or custom prompt requests? Reach out to us at support@sahiledits.com or connect via our social channels.'
                )
              }
              className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors cursor-pointer"
            >
              Contact
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
});

Footer.displayName = 'Footer';
