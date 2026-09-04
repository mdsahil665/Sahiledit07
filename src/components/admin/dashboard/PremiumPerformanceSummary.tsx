import React from 'react';
import { Crown, DollarSign, Sparkles, CreditCard, ShieldCheck, Clock, ArrowUpRight } from 'lucide-react';
import { DashboardUserRecord } from './types';
import { promptStore } from '../../../services/promptStore';
import { AdminTab } from '../AdminSidebar';

interface PremiumPerformanceSummaryProps {
  users: DashboardUserRecord[];
  onSelectTab: (tab: AdminTab) => void;
}

export const PremiumPerformanceSummary: React.FC<PremiumPerformanceSummaryProps> = ({
  users,
  onSelectTab,
}) => {
  const premiumSettings = promptStore.getPremiumSettings();

  // Active Premium & Ultra Premium
  const activePremium = users.filter(
    (u) =>
      (u.isPremium || u.plan === 'premium') &&
      u.plan !== 'ultra' &&
      u.plan !== 'ultra_premium' &&
      !u.isBanned
  ).length;

  const activeUltra = users.filter(
    (u) => (u.plan === 'ultra' || u.plan === 'ultra_premium') && !u.isBanned
  ).length;

  const totalSubscribers = activePremium + activeUltra;

  // Expiring soon / Expired (Checking subscription timestamp if present)
  const now = Date.now();
  const sevenDaysLater = now + 7 * 24 * 60 * 60 * 1000;

  const expiringSoon = users.filter((u) => {
    if (!u.subscriptionExpiresAt) return false;
    const exp = new Date(u.subscriptionExpiresAt).getTime();
    return !isNaN(exp) && exp > now && exp <= sevenDaysLater;
  }).length;

  const expired = users.filter((u) => {
    if (!u.subscriptionExpiresAt) return false;
    const exp = new Date(u.subscriptionExpiresAt).getTime();
    return !isNaN(exp) && exp < now;
  }).length;

  // Revenue calculation based on existing configured price (e.g. ₹99)
  const rawPriceStr = premiumSettings.price || '₹99';
  const currencyMatch = rawPriceStr.match(/^[^\d\s]+/);
  const currency = currencyMatch ? currencyMatch[0] : '₹';
  const numericPrice = parseInt(rawPriceStr.replace(/[^\d]/g, ''), 10) || 99;

  const totalRevenue = totalSubscribers * numericPrice;

  // This month's new subscribers
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const thisMonthSubscribers = users.filter((u) => {
    const isSub = u.isPremium || u.plan === 'premium' || u.plan === 'ultra' || u.plan === 'ultra_premium';
    if (!isSub || !u.createdAt) return false;
    const d = new Date(u.createdAt);
    return !isNaN(d.getTime()) && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  }).length;

  const thisMonthRevenue = thisMonthSubscribers * numericPrice;

  return (
    <div className="p-6 rounded-3xl bg-zinc-900/90 border border-zinc-800 shadow-xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-4">
        <div>
          <h2 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
            <Crown className="w-4 h-4 text-amber-400" />
            <span>PREMIUM PERFORMANCE</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Subscriptions, active members, lifetime plans, and revenue metrics
          </p>
        </div>

        <button
          type="button"
          onClick={() => onSelectTab('premium')}
          className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors self-start sm:self-auto cursor-pointer"
        >
          <span>Gateway &amp; Pricing Settings</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Active Premium */}
        <div className="p-4 rounded-2xl bg-zinc-950/60 border border-amber-500/20 space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Active Premium</span>
            <Crown className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400">{activePremium}</div>
          <p className="text-[10px] text-zinc-500 font-medium">Standard Gold plan</p>
        </div>

        {/* Active Ultra Premium */}
        <div className="p-4 rounded-2xl bg-zinc-950/60 border border-purple-500/25 space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Active Ultra</span>
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-300">{activeUltra}</div>
          <p className="text-[10px] text-zinc-500 font-medium">VIP Unlimited tier</p>
        </div>

        {/* Total Subscribers */}
        <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800 space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Subscribers</span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white">{totalSubscribers}</div>
          <p className="text-[10px] text-zinc-500 font-medium">All active paid tiers</p>
        </div>

        {/* Expiring Soon */}
        <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800 space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Expiring Soon</span>
            <Clock className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-zinc-300">{expiringSoon}</div>
          <p className="text-[10px] text-zinc-500 font-medium">
            {expiringSoon === 0 ? 'Lifetime (No Expiry)' : 'Within 7 days'}
          </p>
        </div>

        {/* Expired */}
        <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800 space-y-2 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Expired</span>
            <span className="text-xs font-bold text-zinc-500">0</span>
          </div>
          <div className="text-2xl font-black text-zinc-300">{expired}</div>
          <p className="text-[10px] text-zinc-500 font-medium">Past billing window</p>
        </div>
      </div>

      {/* Revenue Section (From existing system settings & real subscriber calculation) */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/20 via-zinc-950/70 to-zinc-950/70 border border-emerald-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-extrabold text-emerald-400 uppercase tracking-wider">
              Revenue Summary
            </div>
            <div className="text-[11px] text-zinc-400">
              Calculated from current plan price ({rawPriceStr}) &amp; subscriber volume
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6 self-start sm:self-auto">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              This Month
            </div>
            <div className="text-lg font-black text-white">
              {currency}
              {thisMonthRevenue.toLocaleString()}
            </div>
          </div>

          <div className="h-8 w-px bg-zinc-800" />

          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              Total Revenue
            </div>
            <div className="text-xl font-black text-emerald-400">
              {currency}
              {totalRevenue.toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
