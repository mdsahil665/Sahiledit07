import React from 'react';
import { Home, ChevronRight, Clock, Flame, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { WebsiteSectionsSettings } from '../types';

interface CategoryHeaderProps {
  categoryName: string;
  postCount: number;
  activeTab: 'latest' | 'trending' | 'popular';
  onSelectTab: (tab: 'latest' | 'trending' | 'popular') => void;
  onNavigateHome: () => void;
  websiteSections?: WebsiteSectionsSettings;
}

export const CategoryHeader: React.FC<CategoryHeaderProps> = ({
  categoryName,
  postCount,
  activeTab,
  onSelectTab,
  onNavigateHome,
  websiteSections,
}) => {
  // Check section visibility controls (default to true if undefined)
  const showBreadcrumb = websiteSections?.categoryPage?.breadcrumb ?? true;
  const showTitle = websiteSections?.categoryPage?.title ?? true;
  const showDescription = websiteSections?.categoryPage?.description ?? true;
  const showTabs = websiteSections?.categoryPage?.tabs ?? true;

  // Height scaling
  const heightSize = websiteSections?.sectionHeights?.categoryHeader || 'auto';
  let paddingClasses = 'pt-6 sm:pt-8 pb-3 sm:pb-4';
  if (heightSize === 'small') paddingClasses = 'pt-4 sm:pt-5 pb-2 sm:pb-3';
  if (heightSize === 'medium') paddingClasses = 'pt-6 sm:pt-8 pb-3 sm:pb-4';
  if (heightSize === 'large') paddingClasses = 'pt-10 sm:pt-14 pb-5 sm:pb-6';

  // Map display description dynamically per category
  const descriptionText = React.useMemo(() => {
    const lower = (categoryName || '').toLowerCase().trim();

    if (lower === 'man' || lower === 'men') {
      return `Explore ${postCount} curated Men AI Photo Editing Prompts. High-quality, tested AI image editing prompts and AI image prompts optimized for Gemini, ChatGPT & Midjourney.`;
    }
    if (lower === 'woman' || lower === 'women') {
      return `Explore ${postCount} curated Woman AI Photo Editing Prompts. High-quality, tested AI image editing prompts and AI image prompts optimized for Gemini, ChatGPT & Midjourney.`;
    }
    if (lower === 'couple' || lower === 'couples') {
      return `Explore ${postCount} curated Couple AI Photo Editing Prompts. High-quality, tested AI image editing prompts and AI image prompts optimized for Gemini, ChatGPT & Midjourney.`;
    }
    if (lower === 'family' || lower === 'families') {
      return `Explore ${postCount} curated Family AI Photo Editing Prompts. High-quality, tested AI image editing prompts and AI image prompts optimized for Gemini, ChatGPT & Midjourney.`;
    }
    if (lower === 'birthday' || lower === 'bday') {
      return `Explore ${postCount} curated Birthday AI Photo Editing Prompts. High-quality, tested AI image editing prompts and AI image prompts optimized for Gemini, ChatGPT & Midjourney.`;
    }

    return `Explore ${postCount} curated ${categoryName} AI Photo Editing Prompts. High-quality, tested AI image editing prompts and AI image prompts optimized for Gemini, ChatGPT & Midjourney.`;
  }, [categoryName, postCount]);

  return (
    <section className={`relative ${paddingClasses} bg-transparent overflow-hidden text-left transition-colors duration-300`}>
      {/* Background Light-Blue Subtle Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#3b82f618_1px,transparent_1px),linear-gradient(to_bottom,#3b82f618_1px,transparent_1px)] bg-[size:2rem_2rem] sm:bg-[size:2.5rem_2.5rem] [mask-image:radial-gradient(ellipse_75%_75%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Subtle Soft Lighting Radial Glows */}
      <div className="absolute top-0 left-0 w-96 h-72 bg-gradient-to-r from-blue-400/20 via-purple-400/15 to-transparent blur-3xl pointer-events-none rounded-full" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col items-start">
        {/* 1. CATEGORY BREADCRUMB - Left Aligned Pill */}
        {showBreadcrumb && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-sm border border-slate-200/80 dark:border-slate-800 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 mb-5 sm:mb-6"
          >
            <button
              type="button"
              onClick={onNavigateHome}
              className="flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
            >
              <Home className="w-3.5 h-3.5 text-blue-500" />
              <span>Home</span>
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />
            <button
              type="button"
              onClick={onNavigateHome}
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
            >
              Libraries
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />
            <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 text-white font-extrabold text-[11px] uppercase tracking-wider shadow-sm">
              {categoryName}
            </span>
          </motion.div>
        )}

        {/* 2. CATEGORY TITLE - Left Aligned, Bold Modern Sans-Serif */}
        {showTitle && (
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="text-3xl sm:text-5xl md:text-6xl font-black text-[#0F172A] dark:text-white tracking-tight leading-[1.15] text-left select-none max-w-3xl"
          >
            <span>{categoryName}</span>{' '}
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 bg-clip-text text-transparent block sm:inline">
              – AI Photo Editing Prompts
            </span>
          </motion.h1>
        )}

        {/* 3. CATEGORY DESCRIPTION - Left Aligned with Category-Specific Description */}
        {showDescription && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="mt-3 sm:mt-4 text-sm sm:text-base md:text-lg text-slate-600 dark:text-slate-300 max-w-2xl text-left font-normal leading-relaxed"
          >
            {descriptionText}
          </motion.p>
        )}

        {/* 4. CATEGORY TABS - Horizontal Rounded White Tab Container */}
        {showTabs && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="mt-6 sm:mt-8 w-full sm:w-auto inline-flex items-center justify-center sm:justify-start gap-1 sm:gap-2 p-1.5 rounded-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 shadow-xl shadow-slate-900/5 select-none"
          >
            <button
              type="button"
              onClick={() => onSelectTab('latest')}
              className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer ${
                activeTab === 'latest'
                  ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-md shadow-blue-500/25'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Clock className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${activeTab === 'latest' ? 'text-white' : 'text-blue-500'}`} />
              <span>Latest</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectTab('trending')}
              className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer ${
                activeTab === 'trending'
                  ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-md shadow-blue-500/25'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Flame className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${activeTab === 'trending' ? 'text-white' : 'text-amber-500'}`} />
              <span>Trending</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectTab('popular')}
              className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer ${
                activeTab === 'popular'
                  ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-md shadow-blue-500/25'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Sparkles className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${activeTab === 'popular' ? 'text-white' : 'text-purple-500'}`} />
              <span>Popular</span>
            </button>
          </motion.div>
        )}
      </div>
    </section>
  );
};

