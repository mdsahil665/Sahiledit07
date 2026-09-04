import React from 'react';
import { Crown, Sparkles, User, Shield, CheckCircle2, ArrowUpRight } from 'lucide-react';
import { DashboardUserRecord } from './types';
import { AdminTab } from '../AdminSidebar';

interface MembershipCardsProps {
  users: DashboardUserRecord[];
  onSelectTab: (tab: AdminTab) => void;
}

export const MembershipCards: React.FC<MembershipCardsProps> = ({ users, onSelectTab }) => {
  const total = users.length || 1;

  // Ultra Premium users: plan is 'ultra' or 'ultra_premium'
  const ultraUsers = users.filter(
    (u) => u.plan === 'ultra' || u.plan === 'ultra_premium'
  );
  const ultraCount = ultraUsers.length;
  const ultraPercentage = ((ultraCount / total) * 100).toFixed(1);

  // Premium users: isPremium or plan is 'premium' (excluding ultra)
  const premiumUsers = users.filter(
    (u) =>
      (u.isPremium || u.plan === 'premium') &&
      u.plan !== 'ultra' &&
      u.plan !== 'ultra_premium'
  );
  const premiumCount = premiumUsers.length;
  const premiumPercentage = ((premiumCount / total) * 100).toFixed(1);

  // Free users: neither premium nor ultra
  const freeUsers = users.filter(
    (u) =>
      !u.isPremium &&
      u.plan !== 'ultra' &&
      u.plan !== 'ultra_premium' &&
      u.plan !== 'premium'
  );
  const freeCount = freeUsers.length;
  const freePercentage = ((freeCount / total) * 100).toFixed(1);

  // Active subscriptions count: non-banned subscribers
  const activePremiumSubscriptions = premiumUsers.filter((u) => !u.isBanned).length;
  const activeUltraSubscriptions = ultraUsers.filter((u) => !u.isBanned).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
            <Crown className="w-4 h-4 text-amber-400" />
            <span>Membership Overview</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Real tier breakdown from existing registered accounts & subscriptions
          </p>
        </div>

        <button
          onClick={() => onSelectTab('premium_users')}
          className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors cursor-pointer"
        >
          <span>Manage Subscribers</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* FREE USERS */}
        <div
          onClick={() => onSelectTab('users')}
          className="p-6 rounded-3xl bg-zinc-900/80 hover:bg-zinc-800/90 border border-zinc-800 hover:border-zinc-700 transition-all duration-200 cursor-pointer shadow-lg space-y-5 flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-zinc-800 text-zinc-300 border border-zinc-700/60 flex items-center justify-center font-bold">
                <User className="w-5 h-5 text-zinc-400" />
              </div>
              <span className="px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-300 text-[10px] font-extrabold uppercase tracking-wider border border-zinc-700/50">
                Standard Tier
              </span>
            </div>

            <div>
              <h3 className="text-sm font-extrabold text-zinc-300 uppercase tracking-wider">
                Free Users
              </h3>
              <div className="text-3xl font-black text-white tracking-tight mt-1">
                {freeCount.toLocaleString()}
              </div>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-zinc-800/80">
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="text-zinc-400">Share of Total:</span>
                <span className="font-bold text-white">{freePercentage}%</span>
              </div>
              <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-zinc-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(0, Number(freePercentage)))}%` }}
                />
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-zinc-800/60 text-[11px] text-zinc-500 flex items-center justify-between font-medium">
            <span>Basic prompt access</span>
            <span className="font-bold text-zinc-400">Ad-supported</span>
          </div>
        </div>

        {/* PREMIUM USERS (Prominent Gold styling) */}
        <div
          onClick={() => onSelectTab('premium_users')}
          className="relative p-6 rounded-3xl bg-gradient-to-b from-amber-950/20 via-zinc-900/90 to-zinc-900 border border-amber-500/30 hover:border-amber-500/60 transition-all duration-200 cursor-pointer shadow-xl shadow-amber-950/20 hover:-translate-y-1 space-y-5 flex flex-col justify-between overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="space-y-3 relative z-10">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-600 to-yellow-500 text-white flex items-center justify-center font-bold shadow-md shadow-amber-600/20">
                <Crown className="w-5 h-5 text-white" />
              </div>
              <span className="px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-400 text-[10px] font-black uppercase tracking-wider border border-amber-500/30">
                Gold Tier
              </span>
            </div>

            <div>
              <h3 className="text-sm font-extrabold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <span>Premium Users</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
              </h3>
              <div className="text-3xl font-black text-white tracking-tight mt-1">
                {premiumCount.toLocaleString()}
              </div>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-zinc-800/80">
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="text-zinc-400">Share of Total:</span>
                <span className="font-bold text-amber-400">{premiumPercentage}%</span>
              </div>
              <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-amber-500 to-yellow-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(0, Number(premiumPercentage)))}%` }}
                />
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-3 border-t border-amber-500/20 text-[11px] flex items-center justify-between font-bold">
            <span className="text-zinc-400">Active Subscriptions:</span>
            <span className="text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
              {activePremiumSubscriptions} active
            </span>
          </div>
        </div>

        {/* ULTRA PREMIUM USERS (Prominent Violet/Purple VIP styling) */}
        <div
          onClick={() => onSelectTab('premium_users')}
          className="relative p-6 rounded-3xl bg-gradient-to-b from-purple-950/25 via-zinc-900/90 to-zinc-900 border border-purple-500/40 hover:border-purple-500/70 transition-all duration-200 cursor-pointer shadow-xl shadow-purple-950/25 hover:-translate-y-1 space-y-5 flex flex-col justify-between overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/15 rounded-full blur-2xl pointer-events-none" />

          <div className="space-y-3 relative z-10">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 text-white flex items-center justify-center font-bold shadow-md shadow-purple-600/25">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-black uppercase tracking-wider border border-purple-500/40 animate-pulse">
                Elite VIP Tier
              </span>
            </div>

            <div>
              <h3 className="text-sm font-extrabold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                <span>Ultra Premium Users</span>
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              </h3>
              <div className="text-3xl font-black text-white tracking-tight mt-1">
                {ultraCount.toLocaleString()}
              </div>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-zinc-800/80">
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="text-zinc-400">Share of Total:</span>
                <span className="font-bold text-purple-300">{ultraPercentage}%</span>
              </div>
              <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-purple-500 to-indigo-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(0, Number(ultraPercentage)))}%` }}
                />
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-3 border-t border-purple-500/20 text-[11px] flex items-center justify-between font-bold">
            <span className="text-zinc-400">Active Subscriptions:</span>
            <span className="text-purple-300 bg-purple-500/15 px-2 py-0.5 rounded-md border border-purple-500/30">
              {activeUltraSubscriptions} active
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
