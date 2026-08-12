import React, { useState } from 'react';
import { Globe, Mail, Instagram, Facebook, Youtube, Github, Send, Save, CheckCircle2, MessageCircle, Twitter } from 'lucide-react';
import { promptStore } from '../../services/promptStore';
import { useToast } from '../Toast';
import { ShareSettingsControl } from './ShareSettingsControl';

interface SocialSettingsSectionProps {
  type: 'share' | 'footer_social' | 'contact_social';
}

export const SocialSettingsSection: React.FC<SocialSettingsSectionProps> = ({ type }) => {
  const [websiteSettings, setWebsiteSettings] = useState(promptStore.getWebsiteSettings());
  const { showToast } = useToast();

  if (type === 'share') {
    return <ShareSettingsControl />;
  }

  const socialLinks = websiteSettings.socialLinks || {
    youtube: 'https://youtube.com/@sahiledits',
    instagram: 'https://instagram.com/sahil_edits',
    facebook: 'https://facebook.com/sahiledits',
    telegram: 'https://t.me/sahiledits',
    whatsapp: 'https://wa.me/919876543210',
    twitter: 'https://x.com/sahil_edits',
    github: 'https://github.com/sahiledits',
  };

  const handleUpdateLink = (platform: string, value: string) => {
    const updated = { ...socialLinks, [platform]: value };
    setWebsiteSettings({
      ...websiteSettings,
      socialLinks: updated,
    });
  };

  const handleSaveSocial = () => {
    promptStore.updateWebsiteSettings(websiteSettings);
    showToast('✓ Social Links Saved', 'Updated social profile URLs successfully.');
  };

  const isFooter = type === 'footer_social';
  const title = isFooter ? 'Footer Social Media Links' : 'Contact Page Social Links';
  const subtitle = isFooter
    ? 'Configure your personal branding profile links displayed in the website footer.'
    : 'Configure official contact social channels displayed on the Contact page.';

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
          onClick={handleSaveSocial}
          className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 flex items-center gap-2 transition-all cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>Save Social Settings</span>
        </button>
      </div>

      {/* Profile Links Card Form */}
      <div className="bg-zinc-900/90 rounded-3xl border border-zinc-800 p-6 space-y-5">
        <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
          Social Profile Channel URLs
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* YouTube */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-300 flex items-center gap-2">
              <Youtube className="w-4 h-4 text-rose-500" />
              <span>YouTube Channel URL</span>
            </label>
            <input
              type="text"
              value={socialLinks.youtube || ''}
              onChange={(e) => handleUpdateLink('youtube', e.target.value)}
              placeholder="https://youtube.com/@channel"
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
              value={socialLinks.instagram || ''}
              onChange={(e) => handleUpdateLink('instagram', e.target.value)}
              placeholder="https://instagram.com/profile"
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
              value={socialLinks.telegram || ''}
              onChange={(e) => handleUpdateLink('telegram', e.target.value)}
              placeholder="https://t.me/channel"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-white focus:outline-none focus:border-sky-400"
            />
          </div>

          {/* WhatsApp */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-300 flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-emerald-400" />
              <span>WhatsApp Contact URL</span>
            </label>
            <input
              type="text"
              value={socialLinks.whatsapp || ''}
              onChange={(e) => handleUpdateLink('whatsapp', e.target.value)}
              placeholder="https://wa.me/number"
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
              value={socialLinks.facebook || ''}
              onChange={(e) => handleUpdateLink('facebook', e.target.value)}
              placeholder="https://facebook.com/page"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* GitHub */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-300 flex items-center gap-2">
              <Github className="w-4 h-4 text-zinc-300" />
              <span>GitHub Profile URL</span>
            </label>
            <input
              type="text"
              value={socialLinks.github || ''}
              onChange={(e) => handleUpdateLink('github', e.target.value)}
              placeholder="https://github.com/username"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-white focus:outline-none focus:border-zinc-400"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
