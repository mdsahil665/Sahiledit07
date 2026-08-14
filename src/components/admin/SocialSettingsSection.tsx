import React, { useState, useEffect } from 'react';
import {
  Globe,
  Mail,
  Instagram,
  Facebook,
  Youtube,
  Github,
  Send,
  Save,
  CheckCircle2,
  MessageCircle,
  Twitter,
  Phone,
  MapPin,
  Sparkles,
} from 'lucide-react';
import { promptStore } from '../../services/promptStore';
import { useToast } from '../Toast';
import { ShareSettingsControl } from './ShareSettingsControl';
import { WebsiteSettings } from '../../types';

interface SocialSettingsSectionProps {
  type: 'share' | 'footer_social' | 'contact_social';
}

export const SocialSettingsSection: React.FC<SocialSettingsSectionProps> = ({ type }) => {
  const [websiteSettings, setWebsiteSettings] = useState<WebsiteSettings>(() => promptStore.getWebsiteSettings());
  const [featureControls, setFeatureControls] = useState(() => promptStore.getFeatureControls());
  const [isSaving, setIsSaving] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    const unsub = promptStore.subscribe(() => {
      setWebsiteSettings(promptStore.getWebsiteSettings());
      setFeatureControls(promptStore.getFeatureControls());
    });
    return unsub;
  }, []);

  if (type === 'share') {
    return <ShareSettingsControl featureControls={featureControls} />;
  }

  const isFooter = type === 'footer_social';

  // Independent links depending on section
  const currentLinks = isFooter
    ? websiteSettings.socialLinks || {}
    : websiteSettings.contactSocialLinks || {};

  const handleUpdateLink = (platform: string, value: string) => {
    if (isFooter) {
      setWebsiteSettings({
        ...websiteSettings,
        socialLinks: {
          ...websiteSettings.socialLinks,
          [platform]: value,
        },
      });
    } else {
      setWebsiteSettings({
        ...websiteSettings,
        contactSocialLinks: {
          ...(websiteSettings.contactSocialLinks || {}),
          [platform]: value,
        },
      });
    }
  };

  const handleSaveSocial = async () => {
    setIsSaving(true);
    try {
      await promptStore.updateWebsiteSettings(websiteSettings);
      showToast(
        '✓ Settings Saved',
        isFooter
          ? 'Footer social channel URLs saved successfully.'
          : 'Contact page social channels and info saved successfully.'
      );
    } catch (e) {
      showToast('Error', 'Failed to save social settings', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const title = isFooter ? 'Footer Social Media Links' : 'Contact Social Channels & Details';
  const subtitle = isFooter
    ? 'Configure your personal branding profile links displayed strictly in the website footer.'
    : 'Configure official contact social channels and direct inquiry info displayed on the Contact page.';

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            {isFooter ? <Globe className="w-5 h-5 text-emerald-400" /> : <Mail className="w-5 h-5 text-violet-400" />}
            <span>{title}</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-1">{subtitle}</p>
        </div>

        <button
          type="button"
          onClick={handleSaveSocial}
          disabled={isSaving}
          className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
        </button>
      </div>

      {/* Direct Contact Information if Contact Social */}
      {!isFooter && (
        <div className="bg-zinc-900/90 rounded-3xl border border-zinc-800 p-6 space-y-5">
          <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
            <Mail className="w-4 h-4 text-violet-400" />
            <span>Direct Contact Information</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300 flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-violet-400" />
                <span>Contact Email</span>
              </label>
              <input
                type="email"
                value={websiteSettings.contactEmail || ''}
                onChange={(e) => setWebsiteSettings({ ...websiteSettings, contactEmail: e.target.value })}
                placeholder="contact@sahiledits.com"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-white focus:outline-none focus:border-violet-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300 flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                <span>Contact Phone / WhatsApp</span>
              </label>
              <input
                type="text"
                value={websiteSettings.contactPhone || ''}
                onChange={(e) => setWebsiteSettings({ ...websiteSettings, contactPhone: e.target.value })}
                placeholder="+91 98765 43210"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-white focus:outline-none focus:border-violet-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300 flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-rose-400" />
                <span>Address / Location</span>
              </label>
              <input
                type="text"
                value={websiteSettings.contactAddress || ''}
                onChange={(e) => setWebsiteSettings({ ...websiteSettings, contactAddress: e.target.value })}
                placeholder="India"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-white focus:outline-none focus:border-violet-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Social Channels Card Form */}
      <div className="bg-zinc-900/90 rounded-3xl border border-zinc-800 p-6 space-y-5">
        <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
          <Globe className="w-4 h-4 text-emerald-400" />
          <span>{isFooter ? 'Footer Social Channels' : 'Contact Social Channels'}</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* YouTube */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-300 flex items-center gap-2">
              <Youtube className="w-4 h-4 text-rose-500" />
              <span>YouTube Channel URL</span>
            </label>
            <input
              type="text"
              value={currentLinks.youtube || ''}
              onChange={(e) => handleUpdateLink('youtube', e.target.value)}
              placeholder="https://youtube.com/@sahiledits"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-white focus:outline-none focus:border-rose-500"
            />
          </div>

          {/* Instagram */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-300 flex items-center gap-2">
              <Instagram className="w-4 h-4 text-pink-500" />
              <span>Instagram Profile URL</span>
            </label>
            <input
              type="text"
              value={currentLinks.instagram || ''}
              onChange={(e) => handleUpdateLink('instagram', e.target.value)}
              placeholder="https://instagram.com/sahil_edits"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-white focus:outline-none focus:border-pink-500"
            />
          </div>

          {/* Telegram */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-300 flex items-center gap-2">
              <Send className="w-4 h-4 text-sky-400" />
              <span>Telegram Channel URL</span>
            </label>
            <input
              type="text"
              value={currentLinks.telegram || ''}
              onChange={(e) => handleUpdateLink('telegram', e.target.value)}
              placeholder="https://t.me/sahiledits"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-white focus:outline-none focus:border-sky-400"
            />
          </div>

          {/* WhatsApp */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-300 flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-emerald-400" />
              <span>WhatsApp Channel / Contact URL</span>
            </label>
            <input
              type="text"
              value={currentLinks.whatsapp || ''}
              onChange={(e) => handleUpdateLink('whatsapp', e.target.value)}
              placeholder="https://wa.me/919876543210"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-white focus:outline-none focus:border-emerald-400"
            />
          </div>

          {/* Facebook */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-300 flex items-center gap-2">
              <Facebook className="w-4 h-4 text-blue-500" />
              <span>Facebook Page URL</span>
            </label>
            <input
              type="text"
              value={currentLinks.facebook || ''}
              onChange={(e) => handleUpdateLink('facebook', e.target.value)}
              placeholder="https://facebook.com/sahiledits"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* X / Twitter */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-300 flex items-center gap-2">
              <Twitter className="w-4 h-4 text-zinc-300" />
              <span>X (Twitter) Profile URL</span>
            </label>
            <input
              type="text"
              value={currentLinks.twitter || ''}
              onChange={(e) => handleUpdateLink('twitter', e.target.value)}
              placeholder="https://x.com/sahil_edits"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-white focus:outline-none focus:border-zinc-400"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
