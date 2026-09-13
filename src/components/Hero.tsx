import React from 'react';
import { Category, WebsiteSectionsSettings } from '../types';
import { Sparkles, Search, Clock, Flame, X } from 'lucide-react';
import { motion } from 'motion/react';

interface HeroProps {
  categories: Category[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string | null;
  onSelectCategory: (id: string | null) => void;
  activeTab: 'latest' | 'trending' | 'popular';
  onSelectTab: (tab: 'latest' | 'trending' | 'popular') => void;
  websiteSections?: WebsiteSectionsSettings;
}

export const Hero: React.FC<HeroProps> = ({
  categories,
  searchQuery,
  onSearchChange,
  selectedCategory,
  onSelectCategory,
  activeTab,
  onSelectTab,
  websiteSections,
}) => {
  const showSearch = websiteSections?.search ?? true;
  const showPopularCategories = websiteSections?.popularCategories ?? true;
  const showTabs = websiteSections?.tabs ?? true;

  // Height scaling
  const heightSize = websiteSections?.sectionHeights?.hero || 'auto';
  let paddingClasses = 'pt-8 sm:pt-12 pb-3 sm:pb-4';
  if (heightSize === 'small') paddingClasses = 'pt-4 sm:pt-6 pb-2 sm:pb-3';
  if (heightSize === 'medium') paddingClasses = 'pt-8 sm:pt-12 pb-3 sm:pb-4';
  if (heightSize === 'large') paddingClasses = 'pt-12 sm:pt-18 pb-5 sm:pb-6';

  return (
    <section className={`relative ${paddingClasses} bg-transparent overflow-hidden text-center transition-colors duration-300`}>
      {/* Background Light-Blue Subtle Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#3b82f618_1px,transparent_1px),linear-gradient(to_bottom,#3b82f618_1px,transparent_1px)] bg-[size:2rem_2rem] sm:bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Subtle Soft Lighting Radial Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-72 bg-gradient-to-r from-blue-400/20 via-indigo-400/15 to-purple-400/20 blur-3xl pointer-events-none rounded-full" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col items-center">
        {/* Main Hero Header Title - Exactly ONE Primary H1 for Homepage */}
        <motion.h1
          id="hero-main-title"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-[#0F172A] dark:text-white tracking-tight leading-[1.15] select-none text-center"
        >
          <span>Sahil Edit Vercel</span>
          <span className="block text-xl sm:text-3xl md:text-4xl lg:text-5xl mt-1.5 sm:mt-2.5 font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
            – Sahil Edits AI Prompt Library
          </span>
        </motion.h1>

        {/* Supporting Subheading */}
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="text-base sm:text-xl md:text-2xl font-semibold text-slate-700 dark:text-slate-200 tracking-tight mt-3 select-none text-center max-w-2xl"
        >
          Creative AI Image, Video &amp; Photography Prompts
        </motion.h2>

        {/* Subtitle / Description Text with Visible Brand Content */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mt-3 sm:mt-4 text-sm sm:text-base md:text-lg text-slate-600 dark:text-slate-300 max-w-3xl mx-auto font-normal leading-relaxed text-center px-2"
        >
          Welcome to <strong className="font-semibold text-slate-900 dark:text-white">Sahil Edit Vercel</strong>, the official <span className="font-semibold text-slate-900 dark:text-white">Sahil Edits AI Prompt Library</span>. Explore curated, high-quality AI prompt templates for Gemini, ChatGPT, Midjourney &amp; Flux with free 1-click prompt copying to generate stunning visuals in seconds.
        </motion.p>

        {/* Search Bar with Large Circular Blue Button on Right */}
        {showSearch && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="mt-6 sm:mt-8 w-full max-w-2xl px-2 sm:px-0"
          >
            <div className="relative flex items-center w-full rounded-full bg-white dark:bg-slate-900/95 border border-slate-200/90 dark:border-slate-800 shadow-2xl shadow-blue-500/10 p-1.5 sm:p-2 transition-all duration-300 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search prompts by keyword, style, or tool..."
                className="w-full pl-5 sm:pl-6 pr-3 py-2.5 sm:py-3 bg-transparent text-slate-900 dark:text-white placeholder-slate-400 font-medium text-sm sm:text-base focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  className="mr-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 transition-colors cursor-pointer"
                  title="Clear Search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById('latest-posts-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-blue-600/30 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
                title="Search"
              >
                <Search className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
          </motion.div>
        )}

        {/* Popular Quick Category Row */}
        {showPopularCategories && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className="mt-4 sm:mt-5 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400"
          >
            <span className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mr-0.5">
              Popular:
            </span>

            {websiteSections?.categories?.man !== false && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    onSelectCategory('Man');
                    onSearchChange('');
                  }}
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                >
                  Man
                </button>
                <span className="text-slate-300 dark:text-slate-700">/</span>
              </>
            )}

            {websiteSections?.categories?.woman !== false && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    onSelectCategory('Woman');
                    onSearchChange('');
                  }}
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                >
                  Woman
                </button>
                <span className="text-slate-300 dark:text-slate-700">/</span>
              </>
            )}

            {websiteSections?.categories?.couple !== false && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    onSelectCategory('Couple');
                    onSearchChange('');
                  }}
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                >
                  Couple
                </button>
                <span className="text-slate-300 dark:text-slate-700">/</span>
              </>
            )}

            {websiteSections?.categories?.family !== false && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    onSelectCategory('Family');
                    onSearchChange('');
                  }}
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                >
                  Family
                </button>
                <span className="text-slate-300 dark:text-slate-700">/</span>
              </>
            )}

            {websiteSections?.categories?.birthday !== false && (
              <button
                type="button"
                onClick={() => {
                  onSelectCategory('Birthday');
                  onSearchChange('');
                }}
                className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
              >
                Birthday
              </button>
            )}
          </motion.div>
        )}

        {/* Reference Floating Navigation Pill Container (Latest / Trending / Popular) */}
        {showTabs && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.5 }}
            className="mt-8 sm:mt-10 inline-flex items-center gap-1 sm:gap-2 p-1.5 sm:p-2 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 shadow-xl shadow-slate-900/5 select-none"
          >
            <button
              type="button"
              onClick={() => {
                onSelectTab('latest');
              }}
              className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-extrabold flex items-center gap-2 transition-all duration-200 cursor-pointer ${
                activeTab === 'latest'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Clock className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${activeTab === 'latest' ? 'text-white' : 'text-blue-500'}`} />
              <span>Latest</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onSelectTab('trending');
              }}
              className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-extrabold flex items-center gap-2 transition-all duration-200 cursor-pointer ${
                activeTab === 'trending'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Flame className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${activeTab === 'trending' ? 'text-white' : 'text-amber-500'}`} />
              <span>Trending</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onSelectTab('popular');
              }}
              className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-extrabold flex items-center gap-2 transition-all duration-200 cursor-pointer ${
                activeTab === 'popular'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
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
