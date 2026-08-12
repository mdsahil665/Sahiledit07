import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { promptStore } from '../services/promptStore';
import { useToast } from './Toast';
import { useLogo } from '../context/LogoContext';
import { Footer } from './Footer';
import { CustomPage } from '../types';
import {
  Crown,
  Check,
  Zap,
  ShieldCheck,
  X,
  ArrowLeft,
  Sparkles,
  Heart,
  ExternalLink,
  Lock,
  User,
  CheckCircle2,
} from 'lucide-react';
import { motion } from 'motion/react';

interface PremiumPageProps {
  onClose: () => void;
  onOpenPageModal?: (page: CustomPage) => void;
}

export const PremiumPage: React.FC<PremiumPageProps> = ({ onClose, onOpenPageModal }) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { currentUser, isPremium } = useAuth();
  const { showToast } = useToast();
  const { logoUrl } = useLogo();
  const settings = promptStore.getPremiumSettings();
  const webSettings = promptStore.getWebsiteSettings();

  const handlePurchaseClick = () => {
    if (isPremium) {
      showToast('Premium Active', 'You already have Lifetime Premium access!', 'success');
      return;
    }

    if (!currentUser) {
      showToast(
        'Sign In Required',
        "You'll sign in first so your Premium stays with you on every device.",
        'info'
      );
      return;
    }

    showToast(
      'Premium Purchase',
      'Premium purchase will be available soon.',
      'info'
    );
  };

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 overflow-y-auto overflow-x-hidden bg-slate-950 text-slate-100 flex flex-col min-h-screen w-full"
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      {/* Top Header Bar */}
      <div className="sticky top-0 z-20 w-full shrink-0 px-4 sm:px-8 py-4 bg-slate-900/80 backdrop-blur-md border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer" onClick={onClose}>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all flex items-center gap-1 text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back</span>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 via-purple-600 to-blue-600 flex items-center justify-center text-white shadow-md overflow-hidden">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="w-full h-full object-cover rounded-full" />
              ) : (
                <Crown className="w-4 h-4 text-amber-300" />
              )}
            </div>
            <span className="font-extrabold text-base sm:text-lg tracking-tight">Sahil Edits</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-wider">
              Premium
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close Premium Page"
          className="p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-12 space-y-10 flex-1 shrink-0">
        {/* Hero Section */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 via-purple-500/20 to-blue-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-widest shadow-lg shadow-amber-500/10">
            <Crown className="w-3.5 h-3.5 text-amber-400" />
            <span>EARLY-BIRD · LIFETIME DEAL</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            {settings.headline || 'Go ad-free. Forever.'}
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
            {settings.subtitle ||
              'Sahil Edits Premium — one payment, yours for life. Zero ads and every premium prompt unlocked. No subscription, ever.'}
          </p>

          {isPremium && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Premium Active — You enjoy full lifetime ad-free access!</span>
            </div>
          )}
        </div>

        {/* Pricing Plan Card */}
        <div className="relative rounded-3xl border-2 border-amber-500/40 bg-gradient-to-b from-slate-900/90 via-slate-900/95 to-slate-950/90 p-6 sm:p-10 shadow-2xl shadow-purple-950/50 backdrop-blur-xl overflow-hidden">
          {/* Subtle Ambient Glow */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-8">
            {/* Top Badge & Pricing Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
              <div>
                <span className="inline-block px-3 py-1 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-wider mb-2">
                  LIMITED EARLY-BIRD
                </span>
                <h2 className="text-2xl font-black text-white">{settings.planName || 'PREMIUM'}</h2>
                <p className="text-xs text-slate-400 mt-1">
                  {settings.planDescription || 'Pay once, keep it for life — no subscription, no renewals.'}
                </p>
              </div>

              <div className="sm:text-right">
                <div className="text-3xl sm:text-4xl font-black text-amber-400 tracking-tight">
                  {settings.price || '₹99'} <span className="text-sm font-semibold text-slate-400">once</span>
                </div>
                <span className="text-[11px] font-medium text-emerald-400 block mt-0.5">
                  ⚡ EARLY-BIRD — THE LOWEST PRICE IT'LL EVER BE
                </span>
              </div>
            </div>

            {/* Action CTA Button */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={handlePurchaseClick}
                className={`w-full py-4 px-6 rounded-2xl font-black text-sm sm:text-base transition-all duration-300 shadow-xl flex items-center justify-center gap-2 cursor-pointer ${
                  isPremium
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                    : 'bg-gradient-to-r from-amber-500 via-purple-600 to-blue-600 hover:from-amber-400 hover:via-purple-500 hover:to-blue-500 text-white shadow-purple-600/30 hover:scale-[1.01] active:scale-[0.99]'
                }`}
              >
                <Crown className="w-5 h-5 text-amber-200" />
                <span>{isPremium ? 'Premium Active (Lifetime Access)' : settings.buttonText || 'Get Lifetime Access — ₹99'}</span>
              </button>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 text-center text-slate-400 text-[11px]">
                <span>🔒 Secure checkout</span>
                <span className="hidden sm:inline">·</span>
                <span>Instant activation</span>
                <span className="hidden sm:inline">·</span>
                <span>Full refund if it's not for you</span>
              </div>

              {!currentUser && (
                <p className="text-center text-amber-300/90 text-xs font-medium pt-1">
                  💡 You'll sign in first so your Premium stays with you on every device.
                </p>
              )}
            </div>

            {/* Value Highlight Banner */}
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs leading-relaxed font-medium flex items-start gap-3">
              <span className="text-base shrink-0">💡</span>
              <span>
                Most prompt tools bill you every month. This is <strong>one single payment</strong> — then it's yours for good.
              </span>
            </div>

            {/* Benefits List */}
            <div className="space-y-4 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Everything in Free, plus:
              </h3>

              <div className="grid sm:grid-cols-2 gap-3.5">
                {(settings.benefits || []).map((benefit, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-slate-800/50 border border-slate-700/60 flex items-start gap-3"
                  >
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <p className="text-xs text-slate-200 leading-snug font-medium">{benefit}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Free Plan Comparison */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-bold text-white">Free Forever Plan</h3>
              <p className="text-xs text-slate-400">
                No account needed to browse — ads support the free library.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold">
              {!isPremium ? "You're on Free Plan" : 'Free Included'}
            </span>
          </div>

          <div className="grid sm:grid-cols-3 gap-3 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-blue-400 shrink-0" />
              <span>Browse &amp; search entire prompt library</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-blue-400 shrink-0" />
              <span>Copy any free prompt</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-blue-400 shrink-0" />
              <span>Save &amp; like prompts to your account</span>
            </div>
          </div>
        </div>

        {/* Legal Disclaimer */}
        <p className="text-center text-[11px] text-slate-500 max-w-xl mx-auto">
          Prices include applicable taxes. Sahil Edits Premium is a one-time lifetime purchase — no subscription, no auto-renewal.
        </p>
      </div>

      {/* Shared Canonical Website Footer */}
      <div className="w-full shrink-0 mt-auto">
        <Footer
          onOpenPage={(page) => {
            if (onOpenPageModal) {
              onOpenPageModal(page);
            }
          }}
          onOpenPremium={() => {
            if (containerRef.current) {
              containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
        />
      </div>
    </motion.div>
  );
};
