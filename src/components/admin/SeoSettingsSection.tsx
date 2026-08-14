import React, { useState, useEffect } from 'react';
import {
  Search,
  Globe,
  Save,
  CheckCircle2,
  Share2,
  Code,
  Eye,
  Sliders,
  Sparkles,
  RotateCcw,
  ExternalLink,
  Shield,
  FileText,
} from 'lucide-react';
import { SeoSettings, FeatureControls } from '../../types';
import { promptStore } from '../../services/promptStore';
import { useToast } from '../Toast';

export const SeoSettingsSection: React.FC = () => {
  const [seo, setSeo] = useState<SeoSettings>(() => promptStore.getSeoSettings());
  const [featureControls, setFeatureControls] = useState<FeatureControls>(() => promptStore.getFeatureControls());
  const [isSaving, setIsSaving] = useState(false);
  const [previewTab, setPreviewTab] = useState<'google' | 'social' | 'robots'>('google');
  const { showToast } = useToast();

  useEffect(() => {
    const unsub = promptStore.subscribe(() => {
      setSeo(promptStore.getSeoSettings());
      setFeatureControls(promptStore.getFeatureControls());
    });
    return unsub;
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await promptStore.updateSeoSettings(seo);
      await promptStore.updateFeatureControls(featureControls);
      showToast('✓ SEO Settings Saved', 'Search engine optimization meta tags updated in Firestore.');
    } catch (e) {
      showToast('Error', 'Failed to save SEO settings.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDefaults = async () => {
    const defaults: SeoSettings = {
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
    setSeo(defaults);
    await promptStore.updateSeoSettings(defaults);
    showToast('Defaults Restored', 'Reset SEO configuration to recommended production defaults.');
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Search className="w-5 h-5 text-sky-400" />
            <span>SEO & Social Sharing Metadata</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Optimize search ranking on Google, configure Open Graph social preview cards, and customize robots.txt.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-4 py-2.5 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2.5 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-lg shadow-sky-600/20 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save SEO Settings'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Inputs (Left 7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* General Metadata */}
          <div className="bg-zinc-900/90 rounded-3xl border border-zinc-800 p-6 space-y-4">
            <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
              <Globe className="w-4 h-4 text-sky-400" />
              <span>Core Search Engine Tags</span>
            </h3>

            <div className="space-y-3.5">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-zinc-300">Website Title Tag (Recommended: 50-60 chars)</label>
                  <span className="text-[10px] text-zinc-500">{seo.websiteTitle?.length || 0} chars</span>
                </div>
                <input
                  type="text"
                  value={seo.websiteTitle || ''}
                  onChange={(e) => setSeo({ ...seo, websiteTitle: e.target.value })}
                  placeholder="Sahil Edits - Premium AI Prompt Library"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-zinc-300">Meta Description (Recommended: 120-160 chars)</label>
                  <span className="text-[10px] text-zinc-500">{seo.metaDescription?.length || 0} chars</span>
                </div>
                <textarea
                  rows={3}
                  value={seo.metaDescription || ''}
                  onChange={(e) => setSeo({ ...seo, metaDescription: e.target.value })}
                  placeholder="Discover, copy, and optimize high-precision AI prompts..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-white focus:outline-none focus:border-sky-500 resize-none leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-300">Author Name / Publisher</label>
                  <input
                    type="text"
                    value={seo.authorName || ''}
                    onChange={(e) => setSeo({ ...seo, authorName: e.target.value })}
                    placeholder="Sahil"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-300">Canonical Base URL</label>
                  <input
                    type="text"
                    value={seo.canonicalUrl || ''}
                    onChange={(e) => setSeo({ ...seo, canonicalUrl: e.target.value })}
                    placeholder="https://sahiledit.vercel.app"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300">Meta Keywords (Comma separated)</label>
                <input
                  type="text"
                  value={seo.keywords || ''}
                  onChange={(e) => setSeo({ ...seo, keywords: e.target.value })}
                  placeholder="AI prompts, ChatGPT prompts, Midjourney, Flux..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-white focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>
          </div>

          {/* Social Card & Robots */}
          <div className="bg-zinc-900/90 rounded-3xl border border-zinc-800 p-6 space-y-4">
            <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
              <Share2 className="w-4 h-4 text-sky-400" />
              <span>Social Graph & Crawler Control</span>
            </h3>

            <div className="space-y-3.5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300">Default Open Graph (OG) Image URL</label>
                <input
                  type="text"
                  value={seo.ogImage || ''}
                  onChange={(e) => setSeo({ ...seo, ogImage: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300">Twitter Card Type</label>
                <select
                  value={seo.twitterCard || 'summary_large_image'}
                  onChange={(e) => setSeo({ ...seo, twitterCard: e.target.value as any })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-white focus:outline-none focus:border-sky-500"
                >
                  <option value="summary_large_image">summary_large_image (Large Hero Card)</option>
                  <option value="summary">summary (Small Thumbnail)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300">robots.txt Direct Directive</label>
                <textarea
                  rows={4}
                  value={seo.robotsTxt || ''}
                  onChange={(e) => setSeo({ ...seo, robotsTxt: e.target.value })}
                  placeholder="User-agent: *&#10;Allow: /"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs font-mono text-emerald-400 focus:outline-none focus:border-sky-500 resize-none leading-relaxed"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Live SERP / Social Preview (Right 5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-zinc-900/90 rounded-3xl border border-zinc-800 p-6 space-y-4 sticky top-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                <Eye className="w-4 h-4 text-sky-400" />
                <span>Live SERP & Social Preview</span>
              </h3>

              <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
                <button
                  type="button"
                  onClick={() => setPreviewTab('google')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                    previewTab === 'google' ? 'bg-sky-600 text-white' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Google
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab('social')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                    previewTab === 'social' ? 'bg-sky-600 text-white' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Social
                </button>
              </div>
            </div>

            {/* Google SERP Preview */}
            {previewTab === 'google' && (
              <div className="p-4 rounded-2xl bg-white text-zinc-900 space-y-1.5 shadow-md">
                <div className="flex items-center gap-2 text-[11px] text-zinc-600 truncate">
                  <div className="w-4 h-4 rounded-full bg-sky-600 text-white flex items-center justify-center text-[9px] font-bold shrink-0">
                    S
                  </div>
                  <span className="truncate">{seo.canonicalUrl || 'https://sahiledit.vercel.app'}</span>
                </div>
                <h4 className="text-base font-medium text-[#1a0dab] hover:underline cursor-pointer line-clamp-1 leading-snug">
                  {seo.websiteTitle || 'Sahil Edits - Premium AI Prompt Library'}
                </h4>
                <p className="text-xs text-[#4d5156] line-clamp-2 leading-relaxed">
                  {seo.metaDescription ||
                    'Discover, copy, and optimize high-precision AI prompts for ChatGPT, Gemini, Claude, Midjourney & Flux.'}
                </p>
              </div>
            )}

            {/* Social Share Preview Card */}
            {previewTab === 'social' && (
              <div className="rounded-2xl border border-zinc-800 overflow-hidden bg-zinc-950">
                {seo.ogImage && (
                  <img
                    src={seo.ogImage}
                    alt="Social Card Preview"
                    className="w-full h-40 object-cover border-b border-zinc-800"
                  />
                )}
                <div className="p-3.5 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
                    {seo.canonicalUrl ? new URL(seo.canonicalUrl).hostname : 'sahiledit.vercel.app'}
                  </span>
                  <h4 className="text-xs font-bold text-white line-clamp-1">
                    {seo.websiteTitle || 'Sahil Edits'}
                  </h4>
                  <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                    {seo.metaDescription}
                  </p>
                </div>
              </div>
            )}

            {/* SEO Health Checklist */}
            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800/80 space-y-2.5 text-xs">
              <span className="font-bold text-zinc-300">SEO Quality Checks:</span>
              <div className="space-y-1.5 text-[11px]">
                <div className="flex items-center gap-2 text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Title length: {seo.websiteTitle?.length || 0} characters</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Meta description: {seo.metaDescription?.length || 0} characters</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>OpenGraph & Twitter Card configured</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Robots.txt & Sitemap accessible</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
