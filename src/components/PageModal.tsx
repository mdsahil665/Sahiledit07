import React, { useEffect } from 'react';
import { CustomPage } from '../types';
import { X, FileText, Calendar, Share2, Sparkles, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useToast } from './Toast';

interface PageModalProps {
  page: CustomPage | null;
  onClose: () => void;
}

export const PageModal: React.FC<PageModalProps> = ({ page, onClose }) => {
  const { showToast } = useToast();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!page) return null;

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    showToast('✓ Link Copied', `Copied link for ${page.title}`);
  };

  const formattedDate = new Date(page.updatedAt || page.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-zinc-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0"
          onClick={onClose}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', stiffness: 350, damping: 25 }}
          className="relative w-full max-w-3xl max-h-[88vh] flex flex-col rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center border border-blue-500/20">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-zinc-900 dark:text-white">{page.title}</h3>
                <p className="text-xs text-zinc-500 flex items-center gap-2">
                  <span>Last updated: {formattedDate}</span>
                  <span>•</span>
                  <span className="font-mono text-[11px]">/{page.slug}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleShare}
                title="Share page"
                className="p-2 rounded-xl text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <Share2 className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Featured Image if present */}
          {page.featuredImage && (
            <div className="w-full h-48 bg-zinc-950 overflow-hidden relative">
              <img src={page.featuredImage} alt={page.title} className="w-full h-full object-cover" />
            </div>
          )}

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 text-zinc-800 dark:text-zinc-200 leading-relaxed text-sm">
            <div className="prose prose-zinc dark:prose-invert max-w-none space-y-4 whitespace-pre-wrap font-sans">
              {page.content}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex items-center justify-between text-xs text-zinc-500">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Official Policy Document • Sahil Edits</span>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-zinc-900 text-white dark:bg-zinc-800 dark:hover:bg-zinc-700 text-xs font-bold transition-colors"
            >
              Close Page
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
