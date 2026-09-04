import React, { useState, useEffect } from 'react';
import { PromptPost, Category, CustomPage } from '../../types';
import { Search, Sparkles, Layers, FileText, Settings, X, ArrowRight, ShieldCheck } from 'lucide-react';
import { AdminTab } from './AdminSidebar';
import { getOptimizedDisplayUrl } from '../../lib/imageUtils';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  posts: PromptPost[];
  categories: Category[];
  pages: CustomPage[];
  onSelectTab: (tab: AdminTab) => void;
  onEditPost: (post: PromptPost) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  posts,
  categories,
  pages,
  onSelectTab,
  onEditPost,
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          setQuery('');
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const trimmed = query.trim().toLowerCase();

  const matchedPosts = trimmed
    ? posts.filter(
        (p) =>
          p.title.toLowerCase().includes(trimmed) ||
          p.fullPrompt.toLowerCase().includes(trimmed) ||
          (p.shortDescription && p.shortDescription.toLowerCase().includes(trimmed)) ||
          (p.tags && p.tags.some((t) => t.toLowerCase().includes(trimmed)))
      ).slice(0, 5)
    : [];

  const matchedCategories = trimmed
    ? categories.filter((c) => c.name.toLowerCase().includes(trimmed)).slice(0, 3)
    : [];

  const matchedPages = trimmed
    ? pages.filter((p) => p.title.toLowerCase().includes(trimmed) || p.slug.toLowerCase().includes(trimmed)).slice(0, 3)
    : [];

  const adminSections: { id: AdminTab; title: string; category: string }[] = [
    { id: 'posts', title: 'Posts CMS', category: 'Content' },
    { id: 'categories', title: 'Categories Manager', category: 'Content' },
    { id: 'pages', title: 'Pages Builder', category: 'Content' },
    { id: 'comments', title: 'Comments Moderation', category: 'Content' },
    { id: 'users', title: 'User Management', category: 'Users' },
    { id: 'premium', title: 'Subscription & Premium', category: 'Monetization' },
    { id: 'monetization', title: 'Ads & Networks', category: 'Monetization' },
    { id: 'share', title: 'Post Share Controls', category: 'Social' },
    { id: 'footer_social', title: 'Footer Social Links', category: 'Social' },
    { id: 'contact_social', title: 'Contact Social Links', category: 'Social' },
    { id: 'sections', title: 'Homepage Settings', category: 'Website' },
    { id: 'postcard', title: 'Post Card Appearance', category: 'Website' },
    { id: 'logo', title: 'Logo & Branding', category: 'Website' },
    { id: 'features', title: 'Feature Control Center', category: 'Website' },
    { id: 'seo', title: 'SEO Settings', category: 'Website' },
    { id: 'firebase', title: 'Firebase & Storage', category: 'System' },
    { id: 'security', title: 'Security & Auth', category: 'System' },
    { id: 'activity', title: 'Activity & Logs', category: 'System' },
  ];

  const matchedSections = trimmed
    ? adminSections.filter(
        (s) => s.title.toLowerCase().includes(trimmed) || s.category.toLowerCase().includes(trimmed)
      ).slice(0, 4)
    : [];

  const hasResults =
    matchedPosts.length > 0 || matchedCategories.length > 0 || matchedPages.length > 0 || matchedSections.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/80 backdrop-blur-md animate-fade-in">
      {/* Backdrop click */}
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-2xl rounded-3xl bg-zinc-900 border border-zinc-800 shadow-2xl overflow-hidden z-10 space-y-0">
        {/* Search Bar Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-zinc-800 bg-zinc-950/60">
          <Search className="w-5 h-5 text-blue-400 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search prompts, categories, pages, settings, users..."
            autoFocus
            className="w-full bg-transparent text-sm font-semibold text-white placeholder-zinc-500 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-xs font-bold text-zinc-500 hover:text-white px-2 py-0.5 rounded bg-zinc-800"
            >
              Clear
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Results Body */}
        <div className="p-4 max-h-[60vh] overflow-y-auto custom-scrollbar space-y-4">
          {!trimmed && (
            <div className="py-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto">
                <Search className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-white">Global Admin Quick Search</h4>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                Type keywords to jump directly to any prompt post, category, custom page, user settings, or admin controls.
              </p>
            </div>
          )}

          {trimmed && !hasResults && (
            <div className="py-10 text-center space-y-2">
              <p className="text-sm font-bold text-zinc-300">No admin results found for "{query}"</p>
              <p className="text-xs text-zinc-500">Try searching for post titles, prompt text, or admin settings.</p>
            </div>
          )}

          {/* Matched Posts */}
          {matchedPosts.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500 px-2 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-blue-400" />
                <span>Prompt Posts ({matchedPosts.length})</span>
              </div>
              {matchedPosts.map((post) => (
                <button
                  key={post.id}
                  onClick={() => {
                    onEditPost(post);
                    onClose();
                  }}
                  className="w-full p-3 rounded-2xl bg-zinc-950/60 hover:bg-zinc-800/80 border border-zinc-800/80 flex items-center justify-between text-left transition-all group cursor-pointer"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <img
                      src={getOptimizedDisplayUrl(post.imageUrl, { width: 80, height: 80, crop: 'fill' })}
                      alt={post.title}
                      className="w-10 h-10 rounded-xl object-cover shrink-0 border border-zinc-800"
                    />
                    <div className="truncate">
                      <h5 className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors truncate">
                        {post.title}
                      </h5>
                      <p className="text-[11px] text-zinc-400 truncate mt-0.5">{post.shortDescription || post.fullPrompt}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 text-[10px] font-bold">
                      {post.categoryId}
                    </span>
                    <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Matched Categories */}
          {matchedCategories.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500 px-2 flex items-center gap-1.5">
                <Layers className="w-3 h-3 text-indigo-400" />
                <span>Categories ({matchedCategories.length})</span>
              </div>
              {matchedCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    onSelectTab('categories');
                    onClose();
                  }}
                  className="w-full p-3 rounded-2xl bg-zinc-950/60 hover:bg-zinc-800/80 border border-zinc-800/80 flex items-center justify-between text-left transition-all group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-xs">
                      {cat.name[0]}
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-white group-hover:text-indigo-400 transition-colors">
                        {cat.name}
                      </h5>
                      <p className="text-[10px] text-zinc-400">ID: {cat.id}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                </button>
              ))}
            </div>
          )}

          {/* Matched Sections */}
          {matchedSections.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500 px-2 flex items-center gap-1.5">
                <Settings className="w-3 h-3 text-emerald-400" />
                <span>Admin Sections ({matchedSections.length})</span>
              </div>
              {matchedSections.map((sec) => (
                <button
                  key={sec.id}
                  onClick={() => {
                    onSelectTab(sec.id);
                    onClose();
                  }}
                  className="w-full p-3 rounded-2xl bg-zinc-950/60 hover:bg-zinc-800/80 border border-zinc-800/80 flex items-center justify-between text-left transition-all group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-xs">
                      <Settings className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors">
                        {sec.title}
                      </h5>
                      <p className="text-[10px] text-zinc-400">{sec.category} Section</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-zinc-800 bg-zinc-950/80 text-[11px] text-zinc-500 flex items-center justify-between px-5">
          <span>Press ESC or click backdrop to close</span>
          <span className="font-bold text-zinc-400">Sahil Edits Global Admin Search</span>
        </div>
      </div>
    </div>
  );
};
