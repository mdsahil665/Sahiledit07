import React from 'react';
import { PromptPost, Category } from '../types';
import { PromptCard } from './PromptCard';
import { Sparkles, Flame, Clock, TrendingUp, SearchX } from 'lucide-react';

interface PromptSectionProps {
  title: string;
  icon?: React.ReactNode;
  subtitle?: string;
  posts: PromptPost[];
  categories: Category[];
  onOpenModal: (post: PromptPost) => void;
  onCopyPrompt: (post: PromptPost) => void;
  emptyMessage?: string;
}

export const PromptSection: React.FC<PromptSectionProps> = ({
  title,
  icon,
  subtitle,
  posts,
  categories,
  onOpenModal,
  onCopyPrompt,
  emptyMessage = 'No prompts found in this section.',
}) => {
  if (posts.length === 0) {
    return (
      <div className="py-12 text-center my-8 rounded-3xl bg-zinc-50 dark:bg-zinc-900/40 border border-dashed border-zinc-200 dark:border-zinc-800 p-8">
        <SearchX className="w-12 h-12 text-zinc-400 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-200">{emptyMessage}</h3>
        <p className="text-sm text-zinc-500 mt-1">Try adjusting your search terms or selecting another category.</p>
      </div>
    );
  }

  return (
    <section className="py-8">
      {/* Section Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 text-zinc-900 dark:text-white font-extrabold text-2xl tracking-tight">
            {icon && <span className="text-blue-500">{icon}</span>}
            <h2>{title}</h2>
          </div>
          {subtitle && <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">{subtitle}</p>}
        </div>

        <span className="text-xs font-semibold text-zinc-400">
          Showing {posts.length} {posts.length === 1 ? 'Prompt' : 'Prompts'}
        </span>
      </div>

      {/* Prompts Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {posts.map((post) => {
          const category = categories.find((c) => c.id === post.categoryId);
          return (
            <PromptCard
              key={post.id}
              post={post}
              category={category}
              onOpenModal={onOpenModal}
              onCopyPrompt={onCopyPrompt}
            />
          );
        })}
      </div>
    </section>
  );
};
