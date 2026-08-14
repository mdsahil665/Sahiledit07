import React, { useState, useEffect } from 'react';
import {
  Globe,
  Save,
  CheckCircle2,
  Power,
  RotateCcw,
  Sliders,
  Shield,
  Layers,
  FileText,
  Mail,
  ArrowUp,
  Instagram,
  Facebook,
  Youtube,
  Github,
  Send,
  MessageCircle,
  Twitter,
  Sparkles,
  Info,
  ExternalLink,
} from 'lucide-react';
import { WebsiteSettings, FeatureControls } from '../../types';
import { promptStore } from '../../services/promptStore';
import { useToast } from '../Toast';

export const FooterSettingsControl: React.FC = () => {
  const [websiteSettings, setWebsiteSettings] = useState<WebsiteSettings>(() => promptStore.getWebsiteSettings());
  const [featureControls, setFeatureControls] = useState<FeatureControls>(() => promptStore.getFeatureControls());
  const [isSaving, setIsSaving] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    const unsub = promptStore.subscribe(() => {
      setWebsiteSettings(promptStore.getWebsiteSettings());
      setFeatureControls(promptStore.getFeatureControls());
    });
    return unsub;
  }, []);

  const isFooterOn = featureControls.footer !== false;

  const handleMasterToggle = async () => {
    const nextVal = !isFooterOn;
    try {
      await promptStore.updateFeatureControls({ footer: nextVal });
      showToast(
        nextVal ? 'Footer Enabled' : 'Footer Disabled',
        nextVal ? 'Website footer is now visible across public pages.' : 'Website footer is now hidden.',
        nextVal ? 'success' : 'info'
      );
    } catch (e) {
      showToast('Error', 'Failed to update footer master toggle', 'error');
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await promptStore.updateWebsiteSettings(websiteSettings);
      await promptStore.updateFeatureControls(featureControls);
      showToast('✓ Footer Settings Saved', 'Canonical website footer configuration updated in Firestore.');
    } catch (e) {
      showToast('Save Error', 'Could not save footer settings', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSocialChange = (platform: string, value: string) => {
    setWebsiteSettings({
      ...websiteSettings,
      socialLinks: {
        ...websiteSettings.socialLinks,
        [platform]: value,
      },
    });
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Globe className="w-5 h-5 text-indigo-400" />
            <span>Footer Settings & Branding</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Configure the canonical website footer shared across the Homepage, Category Views, and Premium Page.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/20 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save Footer Settings'}</span>
          </button>
        </div>
      </div>

      {/* Master Toggle Card */}
      <div className="p-5 rounded-3xl bg-zinc-900 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm ${
            isFooterOn ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-zinc-800 text-zinc-500'
          }`}>
            <Power className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Master Footer Switch</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                isFooterOn ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-zinc-800 text-zinc-500 border-zinc-700'
              }`}>
                {isFooterOn ? 'ACTIVE (SHOWN)' : 'DISABLED (HIDDEN)'}
              </span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Turn off to temporarily hide the footer across all public views.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleMasterToggle}
          className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
            isFooterOn
              ? 'bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20'
          }`}
        >
          {isFooterOn ? 'Disable Footer' : 'Enable Footer'}
        </button>
      </div>

      {/* Main Settings Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Brand & Copywriting */}
        <div className="bg-zinc-900/90 rounded-3xl border border-zinc-800 p-6 space-y-5">
          <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>Brand Info & Description</span>
          </h3>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300">Website Brand Title</label>
              <input
                type="text"
                value={websiteSettings.websiteName || ''}
                onChange={(e) => setWebsiteSettings({ ...websiteSettings, websiteName: e.target.value })}
                placeholder="Sahil Edits"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300">Tagline / Brand Accent</label>
              <input
                type="text"
                value={websiteSettings.tagline || ''}
                onChange={(e) => setWebsiteSettings({ ...websiteSettings, tagline: e.target.value })}
                placeholder="Premium AI Prompt Library"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300">Footer Short Description</label>
              <textarea
                rows={3}
                value={websiteSettings.homepageSubtitle || ''}
                onChange={(e) => setWebsiteSettings({ ...websiteSettings, homepageSubtitle: e.target.value })}
                placeholder="Discover, copy, and optimize high-precision AI prompts for ChatGPT, Gemini, Claude, Midjourney & Flux."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-white focus:outline-none focus:border-indigo-500 resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300">Copyright Line</label>
              <input
                type="text"
                value={websiteSettings.footerText || ''}
                onChange={(e) => setWebsiteSettings({ ...websiteSettings, footerText: e.target.value })}
                placeholder="© 2026 Sahil Edits. All Rights Reserved."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Navigation & Section Controls */}
        <div className="bg-zinc-900/90 rounded-3xl border border-zinc-800 p-6 space-y-5">
          <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
            <Sliders className="w-4 h-4 text-indigo-400" />
            <span>Footer Elements & Links</span>
          </h3>

          <div className="space-y-3">
            {/* Back to Top Toggle */}
            <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800/80 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <ArrowUp className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Back to Top Button</span>
                </span>
                <p className="text-[11px] text-zinc-500 mt-0.5">Smooth scroll floating button in bottom right corner</p>
              </div>
              <input
                type="checkbox"
                checked={featureControls.backToTopButton !== false}
                onChange={(e) => setFeatureControls({ ...featureControls, backToTopButton: e.target.checked })}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
            </div>

            {/* Footer Social Media Switch */}
            <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800/80 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Footer Social Links Master</span>
                </span>
                <p className="text-[11px] text-zinc-500 mt-0.5">Show personal social channels row in footer</p>
              </div>
              <input
                type="checkbox"
                checked={featureControls.footerSocialLinks !== false}
                onChange={(e) => setFeatureControls({ ...featureControls, footerSocialLinks: e.target.checked })}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
            </div>

            {/* Quick Links Group */}
            <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800/80 space-y-2">
              <span className="text-xs font-bold text-zinc-300">Default Quick Links Included:</span>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-zinc-400">
                <span className="flex items-center gap-1.5">✓ Explore Prompts</span>
                <span className="flex items-center gap-1.5">✓ Categories Hub</span>
                <span className="flex items-center gap-1.5">✓ Lifetime Premium</span>
                <span className="flex items-center gap-1.5">✓ Privacy Policy</span>
                <span className="flex items-center gap-1.5">✓ Terms of Service</span>
                <span className="flex items-center gap-1.5">✓ Contact Support</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Social Channel URLs */}
      <div className="bg-zinc-900/90 rounded-3xl border border-zinc-800 p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
            <Globe className="w-4 h-4 text-emerald-400" />
            <span>Footer Social Media Profile Channels</span>
          </h3>
          <span className="text-[11px] text-zinc-500">Links open your official channels</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-300 flex items-center gap-2">
              <Youtube className="w-3.5 h-3.5 text-rose-500" />
              <span>YouTube Channel URL</span>
            </label>
            <input
              type="text"
              value={websiteSettings.socialLinks?.youtube || ''}
              onChange={(e) => handleSocialChange('youtube', e.target.value)}
              placeholder="https://youtube.com/@sahiledits"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-white focus:outline-none focus:border-rose-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-300 flex items-center gap-2">
              <Instagram className="w-3.5 h-3.5 text-pink-500" />
              <span>Instagram Profile URL</span>
            </label>
            <input
              type="text"
              value={websiteSettings.socialLinks?.instagram || ''}
              onChange={(e) => handleSocialChange('instagram', e.target.value)}
              placeholder="https://instagram.com/sahil_edits"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-white focus:outline-none focus:border-pink-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-300 flex items-center gap-2">
              <Send className="w-3.5 h-3.5 text-sky-400" />
              <span>Telegram Channel URL</span>
            </label>
            <input
              type="text"
              value={websiteSettings.socialLinks?.telegram || ''}
              onChange={(e) => handleSocialChange('telegram', e.target.value)}
              placeholder="https://t.me/sahiledits"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-white focus:outline-none focus:border-sky-400"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-300 flex items-center gap-2">
              <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>WhatsApp Channel / Chat URL</span>
            </label>
            <input
              type="text"
              value={websiteSettings.socialLinks?.whatsapp || ''}
              onChange={(e) => handleSocialChange('whatsapp', e.target.value)}
              placeholder="https://wa.me/919876543210"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-white focus:outline-none focus:border-emerald-400"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-300 flex items-center gap-2">
              <Facebook className="w-3.5 h-3.5 text-blue-500" />
              <span>Facebook Page URL</span>
            </label>
            <input
              type="text"
              value={websiteSettings.socialLinks?.facebook || ''}
              onChange={(e) => handleSocialChange('facebook', e.target.value)}
              placeholder="https://facebook.com/sahiledits"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-300 flex items-center gap-2">
              <Twitter className="w-3.5 h-3.5 text-zinc-300" />
              <span>X (Twitter) Profile URL</span>
            </label>
            <input
              type="text"
              value={websiteSettings.socialLinks?.twitter || ''}
              onChange={(e) => handleSocialChange('twitter', e.target.value)}
              placeholder="https://x.com/sahil_edits"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-white focus:outline-none focus:border-zinc-400"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
