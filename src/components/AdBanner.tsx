import React, { useEffect, useRef } from 'react';
import { MonetizationSettings, AdPositions, AdNetworkId } from '../types';
import { promptStore } from '../services/promptStore';
import { useAuth } from '../context/AuthContext';
import { Eye } from 'lucide-react';

interface AdBannerProps {
  position: keyof AdPositions;
  settings: MonetizationSettings;
  className?: string;
}

const POSITION_LABELS: Record<keyof AdPositions, string> = {
  topBanner: 'Top Banner Header',
  bottomBanner: 'Bottom Banner',
  homepageBanner: 'Homepage Hero Banner',
  betweenPosts: 'Between Feed Posts',
  insidePostTop: 'Inside Post Top',
  insidePrompt: 'Inside Prompt Box',
  belowPrompt: 'Below Prompt Box',
  beforeCopyButton: 'Before Copy Button',
  afterCopyButton: 'After Copy Button',
  stickyBottomBanner: 'Sticky Bottom Banner',
  desktopSidebar: 'Desktop Sidebar Ad',
  footerBanner: 'Footer Banner',
};

const NETWORK_NAMES: Record<AdNetworkId, string> = {
  adsense: 'Google AdSense',
  monetag: 'Monetag',
  propeller: 'PropellerAds',
  adsterra: 'Adsterra',
  medianet: 'Media.net',
  custom: 'Custom Ad Code',
};

export const AdBanner: React.FC<AdBannerProps> = ({ position, settings, className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { isPremium } = useAuth();
  const fc = promptStore.getFeatureControls();
  const premiumSettings = promptStore.getPremiumSettings();

  // Premium User check: Premium users never see ads
  if (isPremium) return null;

  // Premium Admin Ads setting check: If Ads switch is explicitly OFF in Premium Settings, hide ads
  if (premiumSettings.adsEnabled === false && !settings?.testMode) {
    // Only show if test mode is enabled in monetization for previewing
    if (!settings?.testMode) return null;
  }

  // Feature Control Center Master & Position checks
  if (!fc.masterAdsSwitch) return null;

  // Position-based feature flag checks
  if (position === 'topBanner' && !fc.topBannerAd) return null;
  if (position === 'bottomBanner' && !fc.bottomBannerAd) return null;
  if (position === 'betweenPosts' && !fc.inFeedAds) return null;
  if ((position === 'insidePostTop' || position === 'insidePrompt' || position === 'belowPrompt' || position === 'beforeCopyButton' || position === 'afterCopyButton') && !fc.insidePostAds) return null;
  if (position === 'stickyBottomBanner' && !fc.stickyAds) return null;

  // Network-based feature flag checks
  const activeNetId = settings.activeNetwork || 'adsense';
  if (activeNetId === 'adsense' && !fc.googleAdSense) return null;
  if (activeNetId === 'monetag' && !fc.monetag) return null;
  if (activeNetId === 'propeller' && !fc.propellerAds) return null;
  if (activeNetId === 'adsterra' && !fc.adsterra) return null;
  if (activeNetId === 'medianet' && !fc.mediaNet) return null;
  if (activeNetId === 'custom' && !fc.customAds) return null;

  // 1. Check global enable and position enable
  if (!settings || !settings.enabled || !settings.positions?.[position]) {
    return null;
  }

  const activeNetConfig = settings.networks?.[activeNetId];
  const networkName = activeNetConfig?.name || NETWORK_NAMES[activeNetId] || 'Ad Network';

  // 2. TEST MODE rendering
  if (settings.testMode) {
    return (
      <div className={`my-4 overflow-hidden rounded-2xl border-2 border-dashed border-amber-500/40 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-amber-500/10 p-4 text-center transition-all ${className}`}>
        <div className="flex items-center justify-between gap-2 border-b border-amber-500/20 pb-2 mb-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-[10px] font-bold uppercase tracking-wider text-amber-400">
            <Eye className="w-3 h-3" />
            <span>TEST MODE PREVIEW</span>
          </span>
          <span className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500">
            {networkName}
          </span>
        </div>
        <div className="py-3 flex flex-col items-center justify-center">
          <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
            {POSITION_LABELS[position]}
          </p>
          <p className="text-[11px] text-zinc-500 mt-0.5">
            Responsive Ad Unit ({position})
          </p>
        </div>
      </div>
    );
  }

  // 3. LIVE MODE - Check if network is enabled and configured
  if (!activeNetConfig || !activeNetConfig.enabled) {
    // Automatically hide without blank space if active network is disabled or missing
    return null;
  }

  const pubId = (activeNetConfig.publisherId || settings.publisherId || '').trim();
  const scriptCode = (activeNetConfig.scriptCode || '').trim();

  // If no publisher ID and no script code, hide automatically
  if (!pubId && !scriptCode) {
    return null;
  }

  // 4. Handle Active Network rendering
  useEffect(() => {
    if (settings.testMode) return;

    if (activeNetId === 'adsense' && pubId) {
      if (!document.querySelector(`script[src*="adsbygoogle.js?client=${pubId}"]`)) {
        const script = document.createElement('script');
        script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${pubId}`;
        script.async = true;
        script.crossOrigin = 'anonymous';
        document.head.appendChild(script);
      }
      try {
        // @ts-ignore
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (e) {
        // Ignore re-init
      }
    } else if (activeNetId !== 'custom' && scriptCode && containerRef.current) {
      // Inject external network scripts if required
      try {
        const range = document.createRange();
        range.selectNode(containerRef.current);
        const documentFragment = range.createContextualFragment(scriptCode);
        containerRef.current.innerHTML = '';
        containerRef.current.appendChild(documentFragment);
      } catch (e) {
        console.warn('Ad script insertion warning:', e);
      }
    }
  }, [activeNetId, pubId, scriptCode, position, settings.testMode]);

  return (
    <div className={`ad-container my-4 overflow-hidden rounded-2xl flex flex-col items-center justify-center ${className}`}>
      <div className="w-full text-center">
        <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 dark:text-zinc-600 block mb-1">
          Advertisement
        </span>

        {activeNetId === 'adsense' ? (
          <ins
            className="adsbygoogle block w-full"
            data-ad-client={pubId}
            data-ad-slot="1234567890"
            data-ad-format="auto"
            data-full-width-responsive="true"
          />
        ) : activeNetId === 'custom' ? (
          <div
            className="w-full overflow-hidden"
            dangerouslySetInnerHTML={{ __html: scriptCode }}
          />
        ) : (
          <div ref={containerRef} className="w-full overflow-hidden min-h-[60px]" />
        )}
      </div>
    </div>
  );
};
