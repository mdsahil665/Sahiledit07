import React from 'react';
import { Home, Search, Layers, Compass, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';
import { Category } from '../types';

interface NotFoundPageProps {
  onNavigateHome: () => void;
  onSelectCategory: (categoryId: string) => void;
  categories: Category[];
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({
  onNavigateHome,
  onSelectCategory,
  categories,
}) => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-16 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="max-w-xl w-full mx-auto flex flex-col items-center"
      >
        {/* 404 Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-xs font-bold uppercase tracking-wider mb-4">
          <Compass className="w-4 h-4" />
          <span>Error 404 · Page Not Found</span>
        </div>

        {/* Heading */}
        <h1 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight mb-3">
          Page Not Found
        </h1>

        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 mb-8 max-w-md">
          The AI prompt or page you are looking for does not exist or has been moved. Discover hundreds of tested prompts on Sahil Edits.
        </p>

        {/* Primary Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
          <button
            type="button"
            onClick={onNavigateHome}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white text-sm font-bold shadow-lg shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Return to Sahil Edits Home</span>
          </button>
        </div>

        {/* Explore Popular Categories */}
        {categories.length > 0 && (
          <div className="w-full pt-6 border-t border-slate-200 dark:border-slate-800">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-4 flex items-center justify-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-blue-500" />
              <span>Explore Top AI Categories</span>
            </h2>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {categories.slice(0, 6).map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => onSelectCategory(cat.id)}
                  className="px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800/80 hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400 text-slate-700 dark:text-slate-300 text-xs font-medium border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default NotFoundPage;
