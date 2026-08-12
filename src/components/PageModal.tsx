import React, { useEffect } from 'react';
import { CustomPage } from '../types';
import { ArrowLeft, Share2, ShieldCheck, Sparkles, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useToast } from './Toast';
import { useLogo } from '../context/LogoContext';

interface PageModalProps {
  page: CustomPage | null;
  onClose: () => void;
  onOpenPage?: (page: CustomPage) => void;
  onOpenPremium?: () => void;
}

export const PageModal: React.FC<PageModalProps> = ({
  page,
  onClose,
  onOpenPage,
  onOpenPremium,
}) => {
  const { showToast } = useToast();
  const { logoUrl } = useLogo();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    if (page) {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [page]);

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
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-[#F8FAFC] dark:bg-slate-950 text-slate-800 dark:text-slate-100 overflow-y-auto flex flex-col justify-between min-h-screen"
      >
        {/* Full-Page Top Header Navigation */}
        <header className="sticky top-0 z-40 w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-4 sm:px-8 py-3.5 shadow-sm">
          <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-4">
            {/* Back Button */}
            <button
              onClick={onClose}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            {/* Brand Logo & Title */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-sm overflow-hidden p-0.5">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="w-full h-full object-cover rounded-[10px]" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
              </div>
              <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white hidden sm:inline">
                Sahil Edits
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleShare}
                title="Share page"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Share</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 sm:p-10 shadow-xl space-y-8">
            {/* Page Header Info */}
            <div className="space-y-3 border-b border-slate-200/80 dark:border-slate-800 pb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-semibold border border-purple-500/20">
                <FileText className="w-3.5 h-3.5" />
                <span>Official Document</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                {page.title}
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-medium">
                <span>Last updated: {formattedDate}</span>
                <span>•</span>
                <span className="font-mono text-slate-400">/{page.slug}</span>
              </div>
            </div>

            {/* Featured Image if present */}
            {page.featuredImage && (
              <div className="w-full h-64 sm:h-80 bg-slate-950 rounded-2xl overflow-hidden relative border border-slate-800 shadow-md">
                <img src={page.featuredImage} alt={page.title} className="w-full h-full object-cover" />
              </div>
            )}

            {/* Body Content */}
            <div className="prose prose-slate dark:prose-invert max-w-none text-slate-700 dark:text-slate-200 text-sm sm:text-base leading-relaxed whitespace-pre-wrap font-sans space-y-4">
              {page.content}
            </div>

            {/* Official Badge Footer Note */}
            <div className="pt-6 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Verified Official Page • Sahil Edits Library</span>
              </div>
              <span>© 2026 Sahil Edits</span>
            </div>
          </div>
        </main>
      </motion.div>
    </AnimatePresence>
  );
};
