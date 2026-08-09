import React, { useState, useEffect } from 'react';
import { PostCardConfig, DEFAULT_POST_CARD_CONFIG, PromptPost } from '../../types';
import { promptStore } from '../../services/promptStore';
import { useToast } from '../Toast';
import { PromptCard } from '../PromptCard';
import {
  Sparkles,
  Eye,
  Heart,
  Share2,
  Copy,
  User,
  Sliders,
  CheckCircle2,
  RotateCcw,
  Tag,
  Type,
  FileText,
  Image as ImageIcon,
  Layers,
  Palette,
  Save,
} from 'lucide-react';

export const PostCardAppearanceControl: React.FC = () => {
  const { showToast } = useToast();
  const [config, setConfig] = useState<PostCardConfig>(DEFAULT_POST_CARD_CONFIG);
  const [isSaving, setIsSaving] = useState(false);
  const [applyToAll, setApplyToAll] = useState(false);

  useEffect(() => {
    const current = promptStore.getPostCardConfig();
    setConfig(current);

    const unsubscribe = promptStore.subscribe(() => {
      setConfig(promptStore.getPostCardConfig());
    });
    return () => unsubscribe();
  }, []);

  const handleChange = <K extends keyof PostCardConfig>(key: K, value: PostCardConfig[K]) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await promptStore.updatePostCardConfig(config, applyToAll);
      showToast(
        '✓ Card Settings Saved',
        applyToAll
          ? 'Card settings saved and applied to all posts successfully!'
          : 'Global Post Card settings saved successfully!',
        'success'
      );
    } catch (e) {
      showToast('Error', 'Failed to save Post Card settings.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setConfig(DEFAULT_POST_CARD_CONFIG);
    showToast('Reset Default', 'Reset to default Post Card settings.', 'info');
  };

  const QUICK_BADGES = ['AI PROMPT', 'PHOTO PROMPT', 'CREATIVE', 'NEW', 'TRENDING', 'HOT', 'PREMIUM'];

  // Sample post for live preview
  const samplePost: PromptPost = {
    id: 'sample-preview',
    title: '3D Cyberpunk Neon Character Portrait',
    shortDescription: 'Hyper-detailed futuristic cyberpunk portrait prompt with glowing blue neon lights, cinematic raytracing, and high dynamic range.',
    fullPrompt: 'Hyper-detailed futuristic cyberpunk portrait prompt with glowing blue neon lights, cinematic raytracing, and high dynamic range.',
    categoryId: 'gemini',
    categoryName: 'Men AI Photo Editing',
    tags: ['Cyberpunk', '3D', 'Neon'],
    imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
    views: 1240,
    copies: 382,
    likes: 89,
    featured: true,
    trending: false,
    status: 'published',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    cardConfig: config,
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-2.5">
            <Sliders className="w-6 h-6 text-blue-400" />
            <h2 className="text-xl font-bold text-white">Post Card Appearance & Controls</h2>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Customize every element of the post cards displayed across the website. Real-time preview below.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs flex items-center gap-2 border border-slate-700 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Defaults
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Changes
          </button>
        </div>
      </div>

      {/* Main Grid: Settings Controls vs Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Controls Section (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Badge & Category Labels */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
            <h3 className="text-base font-bold text-white flex items-center gap-2 pb-3 border-b border-slate-800">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Badges & Category Controls
            </h3>

            {/* AI Prompt Badge Toggle */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-semibold text-slate-200">AI Prompt Badge</label>
                  <p className="text-xs text-slate-400">Show/hide top badge on post cards</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleChange('badgeVisible', !config.badgeVisible)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                    config.badgeVisible ? 'bg-blue-600' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      config.badgeVisible ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {config.badgeVisible && (
                <div className="space-y-2 pt-1">
                  <label className="text-xs font-medium text-slate-400">Editable Badge Text</label>
                  <input
                    type="text"
                    value={config.badgeText}
                    onChange={(e) => handleChange('badgeText', e.target.value)}
                    placeholder="AI PROMPT"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-blue-500"
                  />

                  {/* Quick Preset Buttons */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {QUICK_BADGES.map((badge) => (
                      <button
                        key={badge}
                        type="button"
                        onClick={() => handleChange('badgeText', badge)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                          config.badgeText === badge
                            ? 'bg-blue-600/20 text-blue-400 border-blue-500'
                            : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                        }`}
                      >
                        {badge}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Category Label Toggle */}
            <div className="pt-4 border-t border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-semibold text-slate-200">Category Label</label>
                  <p className="text-xs text-slate-400">Display category pill or badge</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleChange('categoryLabelVisible', !config.categoryLabelVisible)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                    config.categoryLabelVisible ? 'bg-blue-600' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      config.categoryLabelVisible ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {config.categoryLabelVisible && (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-400">Custom Category Label Override (Optional)</label>
                  <input
                    type="text"
                    value={config.categoryLabelText || ''}
                    onChange={(e) => handleChange('categoryLabelText', e.target.value)}
                    placeholder="Leave blank for automatic post category"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Text Content Visibility */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2 pb-3 border-b border-slate-800">
              <Type className="w-4 h-4 text-blue-400" />
              Content Visibility
            </h3>

            {/* Title */}
            <div className="flex items-center justify-between py-1">
              <div>
                <label className="text-sm font-semibold text-slate-200">Post Title</label>
                <p className="text-xs text-slate-400">Display main title heading on post card</p>
              </div>
              <button
                type="button"
                onClick={() => handleChange('titleVisible', !config.titleVisible)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                  config.titleVisible ? 'bg-blue-600' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    config.titleVisible ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Short Description */}
            <div className="flex items-center justify-between py-1 border-t border-slate-800/80">
              <div>
                <label className="text-sm font-semibold text-slate-200">Prompt Description / Preview</label>
                <p className="text-xs text-slate-400">Display prompt snippet text below title</p>
              </div>
              <button
                type="button"
                onClick={() => handleChange('descriptionVisible', !config.descriptionVisible)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                  config.descriptionVisible ? 'bg-blue-600' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    config.descriptionVisible ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Creator Attribution */}
            <div className="pt-3 border-t border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-semibold text-slate-200">Creator Attribution</label>
                  <p className="text-xs text-slate-400">Show creator branding tag (e.g. By Sahil Edits)</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleChange('creatorVisible', !config.creatorVisible)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                    config.creatorVisible ? 'bg-blue-600' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      config.creatorVisible ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {config.creatorVisible && (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-400">Creator Branding Name</label>
                  <input
                    type="text"
                    value={config.creatorText}
                    onChange={(e) => handleChange('creatorText', e.target.value)}
                    placeholder="Sahil Edits"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons & Counter Visibility */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2 pb-3 border-b border-slate-800">
              <Heart className="w-4 h-4 text-rose-400" />
              Buttons & Engagement Counters
            </h3>

            {/* Views Badge */}
            <div className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-blue-400" />
                <div>
                  <label className="text-sm font-semibold text-slate-200">View Count Badge</label>
                  <p className="text-xs text-slate-400">Displays real view counts on card</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleChange('viewsVisible', !config.viewsVisible)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                  config.viewsVisible ? 'bg-blue-600' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    config.viewsVisible ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Like Button */}
            <div className="flex items-center justify-between py-2 border-t border-slate-800/80">
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-rose-500" />
                <div>
                  <label className="text-sm font-semibold text-slate-200">Like / Heart Button</label>
                  <p className="text-xs text-slate-400">Enables functional like button & like counter</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleChange('likeButtonVisible', !config.likeButtonVisible)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                  config.likeButtonVisible ? 'bg-blue-600' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    config.likeButtonVisible ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Copy Button */}
            <div className="flex items-center justify-between py-2 border-t border-slate-800/80">
              <div className="flex items-center gap-2">
                <Copy className="w-4 h-4 text-emerald-400" />
                <div>
                  <label className="text-sm font-semibold text-slate-200">Copy Button</label>
                  <p className="text-xs text-slate-400">Enables 1-click prompt copy with feedback</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleChange('copyButtonVisible', !config.copyButtonVisible)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                  config.copyButtonVisible ? 'bg-blue-600' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    config.copyButtonVisible ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Share Button */}
            <div className="flex items-center justify-between py-2 border-t border-slate-800/80">
              <div className="flex items-center gap-2">
                <Share2 className="w-4 h-4 text-indigo-400" />
                <div>
                  <label className="text-sm font-semibold text-slate-200">Share Button</label>
                  <p className="text-xs text-slate-400">Enables social/link share action</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleChange('shareButtonVisible', !config.shareButtonVisible)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                  config.shareButtonVisible ? 'bg-blue-600' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    config.shareButtonVisible ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Image & Glass Panel Aesthetics */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2 pb-3 border-b border-slate-800">
              <ImageIcon className="w-4 h-4 text-cyan-400" />
              Image Clarity & Card Glass Panel
            </h3>

            {/* Image Visibility */}
            <div className="flex items-center justify-between py-1">
              <div>
                <label className="text-sm font-semibold text-slate-200">Image Container</label>
                <p className="text-xs text-slate-400">Show main subject image</p>
              </div>
              <button
                type="button"
                onClick={() => handleChange('imageVisible', !config.imageVisible)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                  config.imageVisible ? 'bg-blue-600' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    config.imageVisible ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Dark Overlay Switch */}
            <div className="flex items-center justify-between py-2 border-t border-slate-800/80">
              <div>
                <label className="text-sm font-semibold text-slate-200">Permanent Dark Overlay</label>
                <p className="text-xs text-amber-400 font-medium">
                  {config.imageOverlay ? 'Enabled (Image dimmed)' : 'Disabled (100% Sharp & Bright Image - Recommended)'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleChange('imageOverlay', !config.imageOverlay)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                  config.imageOverlay ? 'bg-blue-600' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    config.imageOverlay ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Image Opacity Slider */}
            <div className="pt-2 border-t border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-200">Image Opacity</label>
                <span className="text-xs font-bold text-blue-400">{config.imageOpacity}%</span>
              </div>
              <input
                type="range"
                min="30"
                max="100"
                value={config.imageOpacity}
                onChange={(e) => handleChange('imageOpacity', Number(e.target.value))}
                className="w-full accent-blue-500 cursor-pointer"
              />
            </div>

            {/* Glass Information Panel */}
            <div className="flex items-center justify-between py-2 border-t border-slate-800/80">
              <div>
                <label className="text-sm font-semibold text-slate-200">Glassmorphism Info Panel</label>
                <p className="text-xs text-slate-400">Overlapping lower glass info container</p>
              </div>
              <button
                type="button"
                onClick={() => handleChange('glassPanelVisible', !config.glassPanelVisible)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                  config.glassPanelVisible ? 'bg-blue-600' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    config.glassPanelVisible ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Scope Option: Apply to all posts */}
          <div className="bg-slate-900 border border-blue-500/30 rounded-2xl p-5 flex items-start gap-3">
            <input
              type="checkbox"
              id="applyToAll"
              checked={applyToAll}
              onChange={(e) => setApplyToAll(e.target.checked)}
              className="mt-1 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-slate-950 border-slate-700 cursor-pointer"
            />
            <label htmlFor="applyToAll" className="text-sm text-slate-300 cursor-pointer select-none">
              <span className="font-bold text-white block">Apply settings to all existing individual post overrides</span>
              When checked, saving will force update card configurations across all published posts in Firestore.
            </label>
          </div>
        </div>

        {/* Live Card Preview Section (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="sticky top-6 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-400" />
                Live Card Preview
              </h3>
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                REAL-TIME
              </span>
            </div>

            <p className="text-xs text-slate-400">
              This is how your post cards will look to visitors based on your current settings.
            </p>

            {/* Live Prompt Card Render */}
            <div className="pt-2 max-w-[340px] mx-auto">
              <PromptCard
                post={samplePost}
                onOpenModal={() => {}}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
