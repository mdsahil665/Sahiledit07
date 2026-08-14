import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Save,
  CheckCircle2,
  Power,
  Shield,
  Layers,
  Crown,
  Sparkles,
  Sliders,
  Code,
  Eye,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { MonetizationSettings, AdNetworkId, AdNetworkConfig, FeatureControls } from '../../types';
import { promptStore } from '../../services/promptStore';
import { useToast } from '../Toast';

export const MonetizationAdminSection: React.FC = () => {
  const [monetization, setMonetization] = useState<MonetizationSettings>(() => promptStore.getMonetization());
  const [featureControls, setFeatureControls] = useState<FeatureControls>(() => promptStore.getFeatureControls());
  const [selectedNetwork, setSelectedNetwork] = useState<AdNetworkId>(monetization.activeNetwork || 'adsense');
  const [isSaving, setIsSaving] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    const unsub = promptStore.subscribe(() => {
      setMonetization(promptStore.getMonetization());
      setFeatureControls(promptStore.getFeatureControls());
    });
    return unsub;
  }, []);

  const isMasterAdsOn = featureControls.masterAdsSwitch !== false && monetization.enabled !== false;

  const handleMasterToggle = async () => {
    const nextVal = !isMasterAdsOn;
    try {
      await promptStore.updateFeatureControls({ masterAdsSwitch: nextVal });
      await promptStore.updateMonetization({ enabled: nextVal });
      showToast(
        nextVal ? 'Master Ads Enabled' : 'Master Ads Disabled',
        nextVal ? 'Advertisements are now active for non-premium visitors.' : 'All advertisements are currently disabled site-wide.',
        nextVal ? 'success' : 'info'
      );
    } catch (e) {
      showToast('Error', 'Failed to update master ads toggle.', 'error');
    }
  };

  const handlePositionToggle = (posKey: keyof typeof monetization.positions) => {
    setMonetization({
      ...monetization,
      positions: {
        ...monetization.positions,
        [posKey]: !monetization.positions[posKey],
      },
    });
  };

  const handleNetworkConfigChange = (networkId: AdNetworkId, field: keyof AdNetworkConfig, value: any) => {
    setMonetization({
      ...monetization,
      networks: {
        ...monetization.networks,
        [networkId]: {
          ...monetization.networks[networkId],
          [field]: value,
        },
      },
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await promptStore.updateMonetization({
        ...monetization,
        activeNetwork: selectedNetwork,
      });
      await promptStore.updateFeatureControls(featureControls);
      showToast('✓ Monetization Settings Saved', 'Ad networks and display placement configuration updated.');
    } catch (e) {
      showToast('Save Error', 'Could not save monetization settings.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const currentNetworkConfig = monetization.networks[selectedNetwork] || {
    id: selectedNetwork,
    name: selectedNetwork,
    publisherId: '',
    scriptCode: '',
    enabled: true,
  };

  const NETWORK_OPTIONS: { id: AdNetworkId; name: string; badge: string }[] = [
    { id: 'adsense', name: 'Google AdSense', badge: 'Official Partner' },
    { id: 'monetag', name: 'Monetag', badge: 'Push & Banners' },
    { id: 'propeller', name: 'PropellerAds', badge: 'Multi-tag' },
    { id: 'adsterra', name: 'Adsterra', badge: 'Direct CPM' },
    { id: 'medianet', name: 'Media.net', badge: 'Contextual' },
    { id: 'custom', name: 'Custom HTML / Banner', badge: 'Direct Embed' },
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-400" />
            <span>Ads & Monetization Networks</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Manage advertising networks, custom HTML banners, and placement locations.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'Saving...' : 'Save Monetization Settings'}</span>
        </button>
      </div>

      {/* Premium Lifetime Ad-Free Guarantee Banner */}
      <div className="p-4 sm:p-5 rounded-3xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-4">
        <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0">
          <Crown className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-amber-200 flex items-center gap-2">
            <span>VIP / Lifetime Premium Ad-Exclusion Rule</span>
            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-extrabold uppercase">
              Automated Zero-Ads
            </span>
          </h3>
          <p className="text-xs text-amber-100/80 leading-relaxed">
            All users with an active <strong>Premium / Lifetime VIP Subscription</strong> are guaranteed an 100% ad-free experience. 
            All ad scripts, top banners, in-feed ads, and interstitial units are automatically suppressed whenever a premium user is logged in.
          </p>
        </div>
      </div>

      {/* Master Toggle Card */}
      <div className="p-5 rounded-3xl bg-zinc-900 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm ${
            isMasterAdsOn ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-zinc-800 text-zinc-500'
          }`}>
            <Power className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Master Website Ads Switch</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                isMasterAdsOn ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-zinc-800 text-zinc-500 border-zinc-700'
              }`}>
                {isMasterAdsOn ? 'ACTIVE (MONETIZING)' : 'DISABLED (NO ADS)'}
              </span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Turn off to instantly silence all ads across the entire website.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleMasterToggle}
          className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
            isMasterAdsOn
              ? 'bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20'
          }`}
        >
          {isMasterAdsOn ? 'Disable All Ads' : 'Enable Ads'}
        </button>
      </div>

      {/* Ad Network Tabs and Script Config */}
      <div className="bg-zinc-900/90 rounded-3xl border border-zinc-800 p-6 space-y-6">
        <div>
          <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
            <Code className="w-4 h-4 text-emerald-400" />
            <span>Ad Networks & Integration Code</span>
          </h3>
          <p className="text-xs text-zinc-400 mt-1">Select your active ad provider and enter your publisher tag or script embed.</p>
        </div>

        {/* Network Selector Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {NETWORK_OPTIONS.map((net) => {
            const isSelected = selectedNetwork === net.id;
            const isEnabled = monetization.networks[net.id]?.enabled;
            return (
              <button
                key={net.id}
                type="button"
                onClick={() => setSelectedNetwork(net.id)}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-white'
                    : 'bg-zinc-950 border-zinc-800/80 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <div className="text-xs font-bold truncate">{net.name}</div>
                <div className="flex items-center justify-between mt-1 text-[10px]">
                  <span className="text-zinc-500">{net.badge}</span>
                  {isEnabled && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>}
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Network Editor Form */}
        <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800/80 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              {currentNetworkConfig.name} Configuration
            </h4>
            <label className="flex items-center gap-2 text-xs font-semibold text-zinc-300 cursor-pointer">
              <input
                type="checkbox"
                checked={currentNetworkConfig.enabled !== false}
                onChange={(e) => handleNetworkConfigChange(selectedNetwork, 'enabled', e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span>Enable {currentNetworkConfig.name}</span>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300">Publisher ID / Zone ID</label>
              <input
                type="text"
                value={currentNetworkConfig.publisherId || ''}
                onChange={(e) => handleNetworkConfigChange(selectedNetwork, 'publisherId', e.target.value)}
                placeholder="e.g. ca-pub-9876543210123456"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300">Ad Frequency (Show ad after N posts)</label>
              <input
                type="number"
                min={1}
                max={20}
                value={monetization.adFrequency || 3}
                onChange={(e) => setMonetization({ ...monetization, adFrequency: parseInt(e.target.value) || 3 })}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-300">Integration Script Code / HTML Tag</label>
            <textarea
              rows={4}
              value={currentNetworkConfig.scriptCode || ''}
              onChange={(e) => handleNetworkConfigChange(selectedNetwork, 'scriptCode', e.target.value)}
              placeholder="<script async src='https://...'></script>"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-emerald-300 focus:outline-none focus:border-emerald-500 resize-none"
            />
          </div>
        </div>
      </div>

      {/* Ad Placement Positions */}
      <div className="bg-zinc-900/90 rounded-3xl border border-zinc-800 p-6 space-y-5">
        <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
          <Sliders className="w-4 h-4 text-emerald-400" />
          <span>Ad Display Placement Positions</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {[
            { key: 'topBanner', label: 'Top Leaderboard Banner', desc: 'Display under main navigation header' },
            { key: 'bottomBanner', label: 'Bottom Page Banner', desc: 'Display above the website footer' },
            { key: 'homepageBanner', label: 'Hero Banner Ad', desc: 'Display below homepage hero banner' },
            { key: 'betweenPosts', label: 'In-Feed Grid Ads', desc: 'Native ad units injected inside prompt post grid' },
            { key: 'insidePostTop', label: 'Inside Post Header Ad', desc: 'Display at top of opened prompt post modal' },
            { key: 'insidePrompt', label: 'Inside Prompt Box Ad', desc: 'Display directly below prompt text' },
            { key: 'belowPrompt', label: 'Below Prompt Section', desc: 'Display below prompt metadata section' },
            { key: 'stickyBottomBanner', label: 'Sticky Bottom Floating Banner', desc: 'Floating bar fixed to bottom of browser window' },
            { key: 'footerBanner', label: 'Footer Sponsor Banner', desc: 'Embedded inside website footer container' },
          ].map((pos) => {
            const isChecked = (monetization.positions as any)[pos.key] !== false;
            return (
              <div
                key={pos.key}
                onClick={() => handlePositionToggle(pos.key as any)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                  isChecked
                    ? 'bg-zinc-950 border-emerald-500/30'
                    : 'bg-zinc-950/50 border-zinc-800/60 opacity-60'
                }`}
              >
                <div>
                  <h5 className="text-xs font-bold text-white">{pos.label}</h5>
                  <p className="text-[11px] text-zinc-500 mt-0.5">{pos.desc}</p>
                </div>
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => {}}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 shrink-0 mt-0.5"
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
