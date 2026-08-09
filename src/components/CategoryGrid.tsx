import React from 'react';
import { Category, PromptPost } from '../types';
import { CategoryIcon } from './CategoryIcon';
import { ArrowRight, Layers } from 'lucide-react';
import { motion } from 'motion/react';

interface CategoryGridProps {
  categories: Category[];
  posts: PromptPost[];
  selectedCategory: string | null;
  onSelectCategory: (id: string | null) => void;
}

export const CategoryGrid: React.FC<CategoryGridProps> = ({
  categories,
  posts,
  selectedCategory,
  onSelectCategory,
}) => {
  return (
    <section className="py-12 border-b border-zinc-200/60 dark:border-zinc-800/60 bg-zinc-50/50 dark:bg-zinc-950/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 text-blue-500 font-bold text-xs uppercase tracking-wider mb-1">
              <Layers className="w-4 h-4" />
              <span>Explore Collections</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white">
              Browse by Category
            </h2>
          </div>

          {selectedCategory && (
            <button
              onClick={() => onSelectCategory(null)}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              Clear Filter ✕
            </button>
          )}
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
          {categories.map((cat) => {
            const count = posts.filter((p) => p.categoryId === cat.id && p.status === 'published').length;
            const isSelected = selectedCategory === cat.id;

            return (
              <motion.button
                key={cat.id}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onSelectCategory(isSelected ? null : cat.id)}
                className={`flex flex-col justify-between p-4 rounded-2xl border text-left transition-all duration-200 ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-500 shadow-xl shadow-blue-500/25 ring-2 ring-blue-400'
                    : 'bg-white dark:bg-zinc-900/90 text-zinc-900 dark:text-zinc-100 border-zinc-200/80 dark:border-zinc-800/80 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/5'
                }`}
              >
                <div>
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-colors ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                    }`}
                  >
                    <CategoryIcon name={cat.icon} className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-sm tracking-tight line-clamp-1">{cat.name}</h3>
                </div>

                <div className="mt-3 flex items-center justify-between text-[11px] font-semibold opacity-80">
                  <span>{count} {count === 1 ? 'Prompt' : 'Prompts'}</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </section>
  );
};
