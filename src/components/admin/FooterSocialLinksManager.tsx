import React, { useState, useEffect } from 'react';
import {
  Globe,
  Instagram,
  Facebook,
  Youtube,
  Github,
  Send,
  Save,
  MessageCircle,
  Twitter,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  RotateCcw,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Eye,
  EyeOff,
} from 'lucide-react';
import { promptStore } from '../../services/promptStore';
import { useToast } from '../Toast';
import { WebsiteSettings, FeatureControls, SocialChannelConfig } from '../../types';
import {
  ORDERED_FOOTER_CHANNELS,
  SOCIAL_CHANNELS_META,
  SocialPlatformId,
  formatSocialChannelUrl,
  formatWhatsAppValue,
  validateSocialInput,
  getNormalizedFooterSocialLinks,
} from '../../services/socialMediaService';

interface FooterSocialLinksManagerProps {
  onSaved?: () => void;
  showMasterToggle?: boolean;
}

export const FooterSocialLinksManager: React.FC<FooterSocialLinksManagerProps> = ({
  onSaved,
  showMasterToggle = true,
}) => {
  const [websiteSettings, setWebsiteSettings] = useState<WebsiteSettings>(() =>
    promptStore.getWebsiteSettings()
  );
  const [featureControls, setFeatureControls] = useState<FeatureControls>(() =>
    promptStore.getFeatureControls()
  );
  const [channels, setChannels] = useState<Record<SocialPlatformId, SocialChannelConfig>>(() =>
    getNormalizedFooterSocialLinks(promptStore.getWebsiteSettings(), promptStore.getFeatureControls())
  );
  const [isSaving, setIsSaving] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    const unsub = promptStore.subscribe(() => {
      const ws = promptStore.getWebsiteSettings();
      const fc = promptStore.getFeatureControls();
      setWebsiteSettings(ws);
      setFeatureControls(fc);
      setChannels(getNormalizedFooterSocialLinks(ws, fc));
    });
    return unsub;
  }, []);

  const handleToggleChannel = (id: SocialPlatformId) => {
    setChannels((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        enabled: !prev[id].enabled,
      },
    }));
  };

  const handleUrlChange = (id: SocialPlatformId, val: string) => {
    setChannels((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        url: val,
      },
    }));
  };

  const handleEnableAll = () => {
    setChannels((prev) => {
      const updated = { ...prev };
      ORDERED_FOOTER_CHANNELS.forEach((id) => {
        updated[id] = { ...updated[id], enabled: true };
      });
      return updated;
    });
  };

  const handleDisableAll = () => {
    setChannels((prev) => {
      const updated = { ...prev };
      ORDERED_FOOTER_CHANNELS.forEach((id) => {
        updated[id] = { ...updated[id], enabled: false };
      });
      return updated;
    });
  };

  const handleResetDefaults = () => {
    const defaultChannels: Record<SocialPlatformId, SocialChannelConfig> = {
      instagram: { enabled: true, url: 'https://instagram.com/sahiledits' },
      facebook: { enabled: true, url: 'https://facebook.com/sahiledits' },
      telegram: { enabled: true, url: 'https://t.me/sahiledits' },
      discord: { enabled: false, url: 'https://discord.gg/sahiledits' },
      youtube: { enabled: true, url: 'https://youtube.com/@sahiledits' },
      twitter: { enabled: true, url: 'https://x.com/sahiledits' },
      whatsapp: { enabled: true, url: 'https://wa.me/919876543210' },
      github: { enabled: false, url: 'https://github.com/sahiledits' },
    };
    setChannels(defaultChannels);
    showToast('Defaults Loaded', 'Reset 8 social channels to default sample configurations.');
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // 1. Prepare legacy socialLinks object
      const updatedLegacySocialLinks = {
        ...(websiteSettings.socialLinks || {}),
        instagram: channels.instagram.url,
        facebook: channels.facebook.url,
        telegram: channels.telegram.url,
        discord: channels.discord.url,
        youtube: channels.youtube.url,
        twitter: channels.twitter.url,
        whatsapp: channels.whatsapp.url,
        github: channels.github.url,
      };

      // 2. Prepare footerSocialLinks structured map
      const updatedFooterSocialLinks = { ...channels };

      // 3. Prepare FeatureControls toggle sync
      const updatedFeatureControls: Partial<FeatureControls> = {
        footerInstagramToggle: channels.instagram.enabled,
        footerFacebookToggle: channels.facebook.enabled,
        footerTelegramToggle: channels.telegram.enabled,
        footerDiscordToggle: channels.discord.enabled,
        footerYoutubeToggle: channels.youtube.enabled,
        footerTwitterToggle: channels.twitter.enabled,
        footerWhatsappToggle: channels.whatsapp.enabled,
        footerGithubToggle: channels.github.enabled,
        // Legacy aliases
        instagramToggle: channels.instagram.enabled,
        facebookToggle: channels.facebook.enabled,
        telegramToggle: channels.telegram.enabled,
        discordToggle: channels.discord.enabled,
        youtubeToggle: channels.youtube.enabled,
        twitterToggle: channels.twitter.enabled,
        whatsappToggle: channels.whatsapp.enabled,
        githubToggle: channels.github.enabled,
      };

      // 4. Update promptStore
      await promptStore.updateWebsiteSettings({
        socialLinks: updatedLegacySocialLinks,
        footerSocialLinks: updatedFooterSocialLinks,
      });

      await promptStore.updateFeatureControls(updatedFeatureControls);

      showToast(
        '✓ Footer Social Channels Saved',
        'All 8 social media links and ON/OFF visibility toggles are synchronized with the live public footer.'
      );
      if (onSaved) onSaved();
    } catch (e: any) {
      showToast('Error Saving Settings', e?.message || 'Could not save social channel settings', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const getChannelIcon = (id: SocialPlatformId) => {
    switch (id) {
      case 'instagram':
        return <Instagram className="w-5 h-5 text-pink-500" />;
      case 'facebook':
        return <Facebook className="w-5 h-5 text-blue-500" />;
      case 'telegram':
        return <Send className="w-5 h-5 text-sky-400" />;
      case 'discord':
        return <MessageSquare className="w-5 h-5 text-indigo-400" />;
      case 'youtube':
        return <Youtube className="w-5 h-5 text-rose-500" />;
      case 'twitter':
        return <Twitter className="w-5 h-5 text-zinc-200" />;
      case 'whatsapp':
        return <MessageCircle className="w-5 h-5 text-emerald-400" />;
      case 'github':
        return <Github className="w-5 h-5 text-zinc-300" />;
    }
  };

  // Count active vs inactive
  const activeCount = ORDERED_FOOTER_CHANNELS.filter(
    (id) => channels[id]?.enabled && channels[id]?.url?.trim()?.length > 0
  ).length;

  return (
    <div className="space-y-6">
      {/* Header and Action Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 sm:p-6 bg-zinc-900/90 rounded-3xl border border-zinc-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
                <span>Footer Social Media Management</span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  8 Channels
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Manage profile URLs and individual ON/OFF visibility toggles for the public website footer.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-center">
          <button
            type="button"
            onClick={handleEnableAll}
            className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold border border-zinc-700/60 transition-all cursor-pointer flex items-center gap-1.5"
            title="Enable all 8 channels"
          >
            <Eye className="w-3.5 h-3.5 text-emerald-400" />
            <span>Enable All</span>
          </button>
          <button
            type="button"
            onClick={handleDisableAll}
            className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold border border-zinc-700/60 transition-all cursor-pointer flex items-center gap-1.5"
            title="Disable all 8 channels"
          >
            <EyeOff className="w-3.5 h-3.5 text-zinc-400" />
            <span>Disable All</span>
          </button>
          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold border border-zinc-700/60 transition-all cursor-pointer flex items-center gap-1.5"
            title="Load default sample URLs"
          >
            <RotateCcw className="w-3.5 h-3.5 text-sky-400" />
            <span>Defaults</span>
          </button>
          <button
            type="button"
            id="save-footer-social-settings-btn"
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </div>

      {/* Master Toggle Banner if required */}
      {showMasterToggle && (
        <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Master Footer Social Links Switch</div>
              <div className="text-[11px] text-zinc-400">
                Turn entire footer social media icon block ON or OFF across the public website.
              </div>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              id="master-footer-social-switch"
              checked={featureControls.footerSocialLinks !== false}
              onChange={async (e) => {
                const val = e.target.checked;
                await promptStore.updateFeatureControls({ footerSocialLinks: val });
                showToast('Master Switch Updated', `Footer social section is now ${val ? 'enabled' : 'hidden'}.`);
              }}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
          </label>
        </div>
      )}

      {/* 8-Channel Management Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ORDERED_FOOTER_CHANNELS.map((id, index) => {
          const meta = SOCIAL_CHANNELS_META[id];
          const channelConfig = channels[id] || { enabled: false, url: '' };
          const isEnabled = channelConfig.enabled;
          const rawUrl = channelConfig.url;
          const hasUrl = rawUrl && rawUrl.trim().length > 0;
          const formattedUrl = formatSocialChannelUrl(id, rawUrl);
          const validation = validateSocialInput(id, rawUrl);

          // WhatsApp special phone representation preview
          const isWhatsApp = id === 'whatsapp';
          const whatsAppComputed = isWhatsApp && hasUrl ? formatWhatsAppValue(rawUrl) : null;

          return (
            <div
              key={id}
              id={`social-channel-card-${id}`}
              className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 ${
                isEnabled
                  ? 'bg-zinc-900/90 border-zinc-700/80 shadow-md'
                  : 'bg-zinc-950/60 border-zinc-800/60 opacity-80'
              }`}
            >
              {/* Card Top: Icon, Name, Sequence Number, and Toggle */}
              <div className="flex items-center justify-between gap-3 pb-3 border-b border-zinc-800/80">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-zinc-800/90 border border-zinc-700/60 flex items-center justify-center shrink-0">
                    {getChannelIcon(id)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-zinc-500">#{index + 1}</span>
                      <h3 className="text-sm font-bold text-white truncate">{meta.name}</h3>
                    </div>
                    <div className="text-[11px] text-zinc-400 truncate">{meta.helperText}</div>
                  </div>
                </div>

                {/* Individual Toggle Switch */}
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`text-[11px] font-bold tracking-wider px-2 py-0.5 rounded-full ${
                      isEnabled
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : 'bg-zinc-800 text-zinc-500 border border-zinc-700/40'
                    }`}
                  >
                    {isEnabled ? 'ON' : 'OFF'}
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      id={`toggle-${id}`}
                      checked={isEnabled}
                      onChange={() => handleToggleChannel(id)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>
              </div>

              {/* Card Body: URL / Handle / Phone Input */}
              <div className="mt-3.5 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <label htmlFor={`input-${id}`} className="font-semibold text-zinc-300">
                    {isWhatsApp ? 'WhatsApp Number or URL' : `${meta.shortName} URL / Username`}
                  </label>
                  {isEnabled && !hasUrl && (
                    <span className="text-amber-400 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3 h-3" />
                      <span>URL required</span>
                    </span>
                  )}
                  {isEnabled && hasUrl && (
                    <span className="text-emerald-400 flex items-center gap-1 font-medium">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Active</span>
                    </span>
                  )}
                  {!isEnabled && (
                    <span className="text-zinc-500 font-medium">Hidden</span>
                  )}
                </div>

                <div className="relative">
                  <input
                    id={`input-${id}`}
                    type="text"
                    value={rawUrl}
                    onChange={(e) => handleUrlChange(id, e.target.value)}
                    placeholder={meta.placeholder}
                    className={`w-full bg-zinc-950 border rounded-xl px-3.5 py-2.5 text-xs font-semibold text-white placeholder-zinc-500 focus:outline-none transition-all ${
                      isEnabled && !hasUrl
                        ? 'border-amber-500/60 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20'
                        : isEnabled
                        ? 'border-zinc-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20'
                        : 'border-zinc-800 text-zinc-400 focus:border-zinc-600'
                    }`}
                  />
                </div>

                {/* WhatsApp Auto-detection & Formatted URL info */}
                {isWhatsApp && hasUrl && whatsAppComputed && (
                  <div className="p-2 rounded-xl bg-emerald-950/30 border border-emerald-800/40 text-[11px] text-emerald-300 flex items-center justify-between gap-2">
                    <span className="truncate">
                      Generated: <span className="font-mono font-bold text-emerald-200">{whatsAppComputed}</span>
                    </span>
                    <a
                      href={whatsAppComputed}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-400 hover:text-white transition-colors shrink-0"
                      title="Test WhatsApp Link"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}

                {/* Non-WhatsApp formatted preview */}
                {!isWhatsApp && hasUrl && formattedUrl && (
                  <div className="text-[11px] text-zinc-400 flex items-center justify-between gap-2 px-1">
                    <span className="truncate">
                      Opens: <span className="text-zinc-300 font-mono">{formattedUrl}</span>
                    </span>
                    <a
                      href={formattedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-zinc-400 hover:text-emerald-400 transition-colors shrink-0"
                      title="Test Link"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}

                {/* Validation warning if enabled but empty */}
                {isEnabled && !hasUrl && (
                  <p className="text-[11px] text-amber-400/90 leading-tight">
                    Add a valid URL or handle to display this channel in the footer.
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Live Public Footer Simulation / Status Summary */}
      <div className="p-5 sm:p-6 rounded-3xl bg-zinc-900/90 border border-zinc-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Live Footer Synchronization Preview</span>
            </h4>
            <p className="text-xs text-zinc-400 mt-0.5">
              {activeCount} of 8 channels currently visible in the public footer.
            </p>
          </div>

          <div className="text-xs font-semibold text-zinc-400">
            Render Order: 1 to 8
          </div>
        </div>

        {/* Live Icons Strip */}
        <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center flex-wrap gap-3">
          {ORDERED_FOOTER_CHANNELS.map((id) => {
            const cfg = channels[id];
            const isVisible = cfg?.enabled && cfg?.url?.trim()?.length > 0;
            const meta = SOCIAL_CHANNELS_META[id];

            if (!isVisible) return null;

            return (
              <div
                key={id}
                title={`${meta.name}: ${formatSocialChannelUrl(id, cfg.url)}`}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-700/80 text-xs font-medium text-white shadow-sm"
              >
                {getChannelIcon(id)}
                <span>{meta.shortName}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              </div>
            );
          })}

          {activeCount === 0 && (
            <div className="text-xs text-zinc-500 italic py-1">
              No social icons are currently visible. Enable at least one channel and enter its URL.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
