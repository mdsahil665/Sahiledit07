import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Flame, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ShareFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (feedback: string) => Promise<void>;
  postTitle?: string;
}

export const ShareFeedbackModal: React.FC<ShareFeedbackModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit(feedback.trim());
      setFeedback('');
      onClose();
    } catch (e) {
      console.error('Submit feedback error:', e);
    } finally {
      setSubmitting(false);
    }
  };

  const modalMarkup = (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-zinc-950/75 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-zinc-950/75 backdrop-blur-md"
          onClick={onClose}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-md my-auto max-h-[90vh] overflow-y-auto p-6 sm:p-8 rounded-[28px] bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-2xl z-10 text-center space-y-5"
        >
          {/* Close button top right */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Top Flame / Feedback Badge */}
          <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-500 border border-blue-500/20 flex items-center justify-center mx-auto shadow-sm">
            <Flame className="w-7 h-7 text-blue-500 fill-blue-500/20" />
          </div>

          {/* Title & Description */}
          <div>
            <h3 className="font-black text-2xl text-zinc-900 dark:text-white tracking-tight">
              Share your Insights
            </h3>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed max-w-xs mx-auto mt-1.5">
              What did you love about this prompt? Your success stories inspire us.
            </p>
          </div>

          {/* Textarea Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/80 rounded-2xl p-4 text-left">
              <textarea
                rows={4}
                maxLength={500}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="e.g. perfect for my blog!"
                className="w-full bg-transparent text-xs sm:text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none resize-none leading-relaxed"
                autoFocus
              />
              <div className="text-[11px] font-bold text-zinc-400 text-right mt-2">
                {feedback.length} / 500
              </div>
            </div>

            {/* Buttons Row */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="py-3.5 px-5 rounded-2xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-extrabold text-xs tracking-wider transition-all cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={submitting || !feedback.trim()}
                className="py-3.5 px-5 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-extrabold text-xs tracking-wider shadow-lg shadow-blue-500/20 transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-1.5"
              >
                {submitting ? (
                  <span>Submitting...</span>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Submit Feedback</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );

  return createPortal(modalMarkup, document.body);
};
