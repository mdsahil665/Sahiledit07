import React, { useState } from 'react';
import { WebsiteSectionsSettings, Category } from '../../types';
import { promptStore } from '../../services/promptStore';
import { useToast } from '../Toast';
import {
  LayoutGrid,
  Search,
  Power,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Sparkles,
  Layers,
  FileText,
  Globe,
  Sliders,
  DollarSign,
  Maximize2,
  ChevronRight,
  Eye,
  Settings,
  Flame,
  Star,
  Home,
  MessageSquare,
  ArrowUp,
  Filter,
} from 'lucide-react';

interface WebsiteSectionsControlProps {
  websiteSections?: WebsiteSectionsSettings;
  categories?: Category[];
}

interface SectionItem {
  key: string; // path or identifier
  type: 'global' | 'categoryPage' | 'categoryItem';
  label: string;
  description: string;
  category: 'HOME PAGE' | 'CATEGORY PAGES' | 'INDIVIDUAL CATEGORIES';
  categoryKey?: string; // for category items
  hasSizeControl?: boolean;
  sizeKey?: 'hero' | 'categoryHeader';
}

export const WebsiteSectionsControl: React.FC<WebsiteSectionsControlProps> = ({
  websiteSections: propSections,
  categories: propCategories,
}) => {
  const [internalSections, setInternalSections] = useState<WebsiteSectionsSettings>(() => propSections || promptStore.getWebsiteSections());
  const [categoryList, setCategoryList] = useState<Category[]>(() => propCategories || promptStore.getCategories());
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTabFilter, setActiveTabFilter] = useState<'ALL' | 'HOME PAGE' | 'CATEGORY PAGES' | 'INDIVIDUAL CATEGORIES'>('ALL');
  const [isUpdating, setIsUpdating] = useState(false);
  const [editingSizeKey, setEditingSizeKey] = useState<'hero' | 'categoryHeader' | null>(null);
  const { showToast } = useToast();

  React.useEffect(() => {
    if (propSections) {
      setInternalSections(propSections);
    }
  }, [propSections]);

  React.useEffect(() => {
    if (propCategories) {
      setCategoryList(propCategories);
    }
  }, [propCategories]);

  React.useEffect(() => {
    const unsub = promptStore.subscribe(() => {
      if (!propSections) setInternalSections(promptStore.getWebsiteSections());
      if (!propCategories) setCategoryList(promptStore.getCategories());
    });
    return unsub;
  }, [propSections, propCategories]);

  const websiteSections = internalSections;
  const categories = categoryList;

  const ALL_SECTIONS: SectionItem[] = [
    // HOME PAGE
    { key: 'header', type: 'global', label: 'Home Header & Navigation', description: 'Header bar with site logo, search input, category links, and user navigation.', category: 'HOME PAGE' },
    { key: 'hero', type: 'global', label: 'Hero / Welcome Banner', description: 'Main hero title, gradient heading, description, search bar, and popular categories pill links.', category: 'HOME PAGE', hasSizeControl: true, sizeKey: 'hero' },
    { key: 'search', type: 'global', label: 'Search Bar', description: 'Interactive search inputs in hero section and site navigation bar.', category: 'HOME PAGE' },
    { key: 'popularCategories', type: 'global', label: 'Popular Category Links', description: 'Quick-access category pill buttons below the main search bar.', category: 'HOME PAGE' },
    { key: 'tabs', type: 'global', label: 'Filter Tabs (Latest / Trending / Popular)', description: 'Horizontal view filter tabs for post sorting and discovery.', category: 'HOME PAGE' },
    { key: 'featuredPost', type: 'global', label: 'Featured Post Highlight', description: 'Special featured prompt post card highlighted at top of feed.', category: 'HOME PAGE' },
    { key: 'trendingPosts', type: 'global', label: 'Trending Post Section', description: 'Prominent trending prompt card section on home page.', category: 'HOME PAGE' },
    { key: 'postGallery', type: 'global', label: 'Post Gallery & Cards', description: 'Main prompt post grid gallery showing prompt cards.', category: 'HOME PAGE' },
    { key: 'footer', type: 'global', label: 'Website Footer', description: 'Footer bar with copyright information, custom links, and social links.', category: 'HOME PAGE' },
    { key: 'backToTop', type: 'global', label: 'Back to Top Floating Button', description: 'Floating quick-scroll button in lower corner of the page.', category: 'HOME PAGE' },
    { key: 'adBanners', type: 'global', label: 'Ad Banner Placements', description: 'Top, bottom, in-feed, and sticky advertisement placement blocks.', category: 'HOME PAGE' },

    // CATEGORY PAGES
    { key: 'breadcrumb', type: 'categoryPage', label: 'Category Breadcrumb Navigation', description: 'Navigation pill (Home -> Libraries -> [Category]) at top of category header.', category: 'CATEGORY PAGES' },
    { key: 'title', type: 'categoryPage', label: 'Category Title Heading', description: 'Main dynamic title e.g. "Man – AI Photo Editing Prompts".', category: 'CATEGORY PAGES', hasSizeControl: true, sizeKey: 'categoryHeader' },
    { key: 'description', type: 'categoryPage', label: 'Category Subtitle / Description', description: 'Dynamic curated description text below category title.', category: 'CATEGORY PAGES' },
    { key: 'categoryTabs', type: 'categoryPage', label: 'Category Page Tabs (Latest / Trending / Popular)', description: 'Tab switcher on category pages for filtering category posts.', category: 'CATEGORY PAGES' },
    { key: 'postGrid', type: 'categoryPage', label: 'Category Post Grid', description: 'Grid gallery displaying prompt cards belonging to selected category.', category: 'CATEGORY PAGES' },

    // INDIVIDUAL CATEGORIES
    { key: 'man', type: 'categoryItem', categoryKey: 'man', label: 'Man Category Page', description: 'Access and dedicated page for "Man" AI photo editing prompts.', category: 'INDIVIDUAL CATEGORIES' },
    { key: 'woman', type: 'categoryItem', categoryKey: 'woman', label: 'Woman Category Page', description: 'Access and dedicated page for "Woman" AI photo editing prompts.', category: 'INDIVIDUAL CATEGORIES' },
    { key: 'couple', type: 'categoryItem', categoryKey: 'couple', label: 'Couple Category Page', description: 'Access and dedicated page for "Couple" AI photo editing prompts.', category: 'INDIVIDUAL CATEGORIES' },
    { key: 'family', type: 'categoryItem', categoryKey: 'family', label: 'Family Category Page', description: 'Access and dedicated page for "Family" AI photo editing prompts.', category: 'INDIVIDUAL CATEGORIES' },
    { key: 'birthday', type: 'categoryItem', categoryKey: 'birthday', label: 'Birthday Category Page', description: 'Access and dedicated page for "Birthday" AI photo editing prompts.', category: 'INDIVIDUAL CATEGORIES' },
  ];

  // Add any dynamically created categories from Firestore
  categories.forEach((cat) => {
    const slug = (cat.slug || cat.id).toLowerCase();
    if (!['man', 'woman', 'couple', 'family', 'birthday'].includes(slug)) {
      ALL_SECTIONS.push({
        key: slug,
        type: 'categoryItem',
        categoryKey: slug,
        label: `${cat.name} Category Page`,
        description: `Access and dedicated page for "${cat.name}" prompts.`,
        category: 'INDIVIDUAL CATEGORIES',
      });
    }
  });

  const getSectionState = (item: SectionItem): boolean => {
    if (item.type === 'global') {
      return (websiteSections as any)[item.key] ?? true;
    }
    if (item.type === 'categoryPage') {
      const keyMap: Record<string, keyof typeof websiteSections.categoryPage> = {
        breadcrumb: 'breadcrumb',
        title: 'title',
        description: 'description',
        categoryTabs: 'tabs',
        postGrid: 'postGrid',
      };
      const subKey = keyMap[item.key] || item.key;
      return websiteSections.categoryPage?.[subKey as keyof typeof websiteSections.categoryPage] ?? true;
    }
    if (item.type === 'categoryItem') {
      const catKey = item.categoryKey || item.key;
      return websiteSections.categories?.[catKey] ?? true;
    }
    return true;
  };

  const handleToggle = async (item: SectionItem) => {
    setIsUpdating(true);
    const currentState = getSectionState(item);
    const newState = !currentState;

    let updates: Partial<WebsiteSectionsSettings> = {};

    if (item.type === 'global') {
      updates = { [item.key]: newState };
    } else if (item.type === 'categoryPage') {
      const keyMap: Record<string, string> = {
        breadcrumb: 'breadcrumb',
        title: 'title',
        description: 'description',
        categoryTabs: 'tabs',
        postGrid: 'postGrid',
      };
      const subKey = keyMap[item.key] || item.key;
      updates = {
        categoryPage: {
          ...websiteSections.categoryPage,
          [subKey]: newState,
        },
      };
    } else if (item.type === 'categoryItem') {
      const catKey = item.categoryKey || item.key;
      updates = {
        categories: {
          ...websiteSections.categories,
          [catKey]: newState,
        },
      };
    }

    try {
      await promptStore.updateWebsiteSections(updates);
      showToast(
        newState ? 'Section Enabled' : 'Section Hidden',
        `"${item.label}" is now ${newState ? 'Visible [ON]' : 'Hidden [OFF]'}`
      );
    } catch (err) {
      showToast('Update Failed', 'Failed to update section visibility.', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSizeChange = async (sizeKey: 'hero' | 'categoryHeader', size: 'auto' | 'small' | 'medium' | 'large') => {
    try {
      await promptStore.updateWebsiteSections({
        sectionHeights: {
          ...websiteSections.sectionHeights,
          [sizeKey]: size,
        },
      });
      showToast('Section Height Updated', `${sizeKey === 'hero' ? 'Hero' : 'Category Header'} size set to ${size.toUpperCase()}`);
    } catch (e) {
      showToast('Error', 'Failed to update section size', 'error');
    } finally {
      setEditingSizeKey(null);
    }
  };

  const handleEnableAll = async () => {
    if (window.confirm('Enable all website sections?')) {
      setIsUpdating(true);
      await promptStore.enableAllWebsiteSections();
      showToast('✓ All Sections Enabled', 'All website sections are now Visible [ON]');
      setIsUpdating(false);
    }
  };

  const handleDisableAll = async () => {
    if (window.confirm('Hide all controllable sections? Main core layout will remain safe.')) {
      setIsUpdating(true);
      await promptStore.disableAllWebsiteSections();
      showToast('Sections Hidden', 'Optional sections turned OFF');
      setIsUpdating(false);
    }
  };

  const handleResetDefaults = async () => {
    if (window.confirm('Reset all section visibility settings to defaults?')) {
      setIsUpdating(true);
      await promptStore.restoreDefaultWebsiteSections();
      showToast('✓ Defaults Restored', 'All sections reset to original default state');
      setIsUpdating(false);
    }
  };

  // Filter sections by search and tab
  const filteredSections = ALL_SECTIONS.filter((item) => {
    const matchesSearch =
      item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeTabFilter === 'ALL' || item.category === activeTabFilter;
    return matchesSearch && matchesCategory;
  });

  const getCategoryCount = (catName: string) => {
    return ALL_SECTIONS.filter((s) => s.category === catName).length;
  };

  return (
    <div className="space-y-6 text-left">
      {/* HEADER BANNER */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-blue-900/40 via-indigo-900/40 to-slate-900 border border-blue-500/30 relative overflow-hidden shadow-2xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-blue-400 mb-1">
              <LayoutGrid className="w-4 h-4" />
              <span>Admin Section Control Center</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Website Sections & Display Controls
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-xl">
              Turn any section of the website ON or OFF in real-time. Hiding a section does NOT delete posts, categories, images, or database records.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={handleEnableAll}
              disabled={isUpdating}
              className="px-3.5 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Enable All</span>
            </button>

            <button
              onClick={handleDisableAll}
              disabled={isUpdating}
              className="px-3.5 py-2 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 border border-amber-500/30 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Power className="w-3.5 h-3.5" />
              <span>Hide All</span>
            </button>

            <button
              onClick={handleResetDefaults}
              disabled={isUpdating}
              className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </div>

      {/* CONTROLS BAR: SEARCH & CATEGORY FILTERS */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800">
        {/* Category Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none p-1 bg-zinc-950 rounded-xl border border-zinc-800">
          <button
            onClick={() => setActiveTabFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTabFilter === 'ALL'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            All ({ALL_SECTIONS.length})
          </button>
          <button
            onClick={() => setActiveTabFilter('HOME PAGE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTabFilter === 'HOME PAGE'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Home Page ({getCategoryCount('HOME PAGE')})
          </button>
          <button
            onClick={() => setActiveTabFilter('CATEGORY PAGES')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTabFilter === 'CATEGORY PAGES'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Category Page Header ({getCategoryCount('CATEGORY PAGES')})
          </button>
          <button
            onClick={() => setActiveTabFilter('INDIVIDUAL CATEGORIES')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTabFilter === 'INDIVIDUAL CATEGORIES'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Individual Categories ({getCategoryCount('INDIVIDUAL CATEGORIES')})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[220px]">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search section..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
      </div>

      {/* SECTIONS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSections.map((item) => {
          const isVisible = getSectionState(item);
          const sizeVal = item.sizeKey ? websiteSections.sectionHeights?.[item.sizeKey] || 'auto' : null;

          return (
            <div
              key={item.key}
              className={`p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between ${
                isVisible
                  ? 'bg-zinc-900/90 border-blue-500/30 shadow-lg shadow-blue-500/5'
                  : 'bg-zinc-950/60 border-zinc-800/80 opacity-75'
              }`}
            >
              <div>
                {/* TOP TITLE & STATUS BADGE */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-400">
                    {item.category}
                  </span>

                  {/* Status Indicator */}
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider ${
                      isVisible
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-zinc-800 text-zinc-500 border border-zinc-700'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isVisible ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'
                      }`}
                    />
                    <span>{isVisible ? 'Visible [ON]' : 'Hidden [OFF]'}</span>
                  </span>
                </div>

                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <span>{item.label}</span>
                </h3>

                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  {item.description}
                </p>

                {/* Optional Height/Size Control Indicator */}
                {item.hasSizeControl && isVisible && (
                  <div className="mt-3 p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800 flex items-center justify-between gap-2">
                    <span className="text-[11px] text-zinc-400 font-semibold">
                      Section Height: <span className="text-blue-400 font-bold uppercase">{sizeVal}</span>
                    </span>

                    <button
                      onClick={() => setEditingSizeKey(item.sizeKey || null)}
                      className="px-2.5 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Maximize2 className="w-3 h-3" />
                      <span>Change Size</span>
                    </button>
                  </div>
                )}
              </div>

              {/* BOTTOM ACTIONS BAR */}
              <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-zinc-500">
                  Status: {isVisible ? 'ON' : 'OFF'}
                </span>

                {/* ON / OFF Toggle Switch */}
                <button
                  onClick={() => handleToggle(item)}
                  disabled={isUpdating}
                  className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    isVisible ? 'bg-blue-600' : 'bg-zinc-800'
                  }`}
                  role="switch"
                  aria-checked={isVisible}
                >
                  <span
                    className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      isVisible ? 'translate-x-7' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredSections.length === 0 && (
        <div className="py-12 text-center bg-zinc-900/50 rounded-2xl border border-zinc-800 space-y-2">
          <p className="text-sm font-bold text-zinc-400">No matching website section found</p>
          <p className="text-xs text-zinc-600">Try searching with a different term or selection filter.</p>
        </div>
      )}

      {/* SECTION HEIGHT CONTROL MODAL */}
      {editingSizeKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-3xl bg-zinc-900 border border-zinc-800 shadow-2xl space-y-5 text-left">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Maximize2 className="w-5 h-5 text-blue-400" />
                <span>Select Height for {editingSizeKey === 'hero' ? 'Hero Banner' : 'Category Header'}</span>
              </h3>
              <button
                onClick={() => setEditingSizeKey(null)}
                className="text-zinc-400 hover:text-white text-xs font-bold"
              >
                Cancel
              </button>
            </div>

            <p className="text-xs text-zinc-400">
              Adjust the vertical height and padding scale of this section for desktop and mobile screens.
            </p>

            <div className="grid grid-cols-2 gap-2">
              {(['auto', 'small', 'medium', 'large'] as const).map((size) => (
                <button
                  key={size}
                  onClick={() => handleSizeChange(editingSizeKey, size)}
                  className={`p-3 rounded-xl border text-xs font-bold uppercase transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                    websiteSections.sectionHeights?.[editingSizeKey] === size
                      ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                      : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white hover:border-zinc-700'
                  }`}
                >
                  <span className="text-sm font-extrabold">{size}</span>
                  <span className="text-[10px] text-zinc-500 normal-case">
                    {size === 'auto' && 'Default Padding'}
                    {size === 'small' && 'Compact View'}
                    {size === 'medium' && 'Balanced View'}
                    {size === 'large' && 'Spacious View'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
