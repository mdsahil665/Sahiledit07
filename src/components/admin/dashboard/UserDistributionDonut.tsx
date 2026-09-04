import React from 'react';
import { PieChart, Crown, Sparkles, User } from 'lucide-react';
import { DashboardUserRecord } from './types';

interface UserDistributionDonutProps {
  users: DashboardUserRecord[];
}

export const UserDistributionDonut: React.FC<UserDistributionDonutProps> = ({ users }) => {
  const total = users.length || 1;

  // Ultra Premium users: plan is 'ultra' or 'ultra_premium'
  const ultraCount = users.filter((u) => u.plan === 'ultra' || u.plan === 'ultra_premium').length;
  // Premium users: isPremium or plan is 'premium' (excluding ultra)
  const premiumCount = users.filter(
    (u) =>
      (u.isPremium || u.plan === 'premium') &&
      u.plan !== 'ultra' &&
      u.plan !== 'ultra_premium'
  ).length;
  // Free users: neither premium nor ultra
  const freeCount = users.filter(
    (u) =>
      !u.isPremium &&
      u.plan !== 'ultra' &&
      u.plan !== 'ultra_premium' &&
      u.plan !== 'premium'
  ).length;

  const ultraPct = ((ultraCount / total) * 100).toFixed(1);
  const premPct = ((premiumCount / total) * 100).toFixed(1);
  const freePct = ((freeCount / total) * 100).toFixed(1);

  // SVG Donut calculation
  const radius = 42;
  const circumference = 2 * Math.PI * radius; // ~263.89

  const ultraLength = (ultraCount / total) * circumference;
  const premLength = (premiumCount / total) * circumference;
  const freeLength = (freeCount / total) * circumference;

  const ultraOffset = 0;
  const premOffset = -ultraLength;
  const freeOffset = -(ultraLength + premLength);

  return (
    <div className="p-6 rounded-3xl bg-zinc-900/90 border border-zinc-800 shadow-xl space-y-6">
      <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
        <div>
          <h2 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
            <PieChart className="w-4 h-4 text-purple-400" />
            <span>USER DISTRIBUTION</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Breakdown of registered community across membership tiers
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-around gap-6">
        {/* SVG Donut Chart */}
        <div className="relative w-44 h-44 shrink-0 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
            {/* Background ring */}
            <circle
              cx="60"
              cy="60"
              r={radius}
              className="stroke-zinc-800"
              strokeWidth="12"
              fill="transparent"
            />

            {/* Free slice (Zinc) */}
            {freeCount > 0 && (
              <circle
                cx="60"
                cy="60"
                r={radius}
                stroke="#71717a"
                strokeWidth="12"
                strokeDasharray={`${freeLength} ${circumference}`}
                strokeDashoffset={freeOffset}
                fill="transparent"
                strokeLinecap="round"
                className="transition-all duration-700 ease-out"
              />
            )}

            {/* Premium slice (Gold/Amber) */}
            {premiumCount > 0 && (
              <circle
                cx="60"
                cy="60"
                r={radius}
                stroke="#f59e0b"
                strokeWidth="12"
                strokeDasharray={`${premLength} ${circumference}`}
                strokeDashoffset={premOffset}
                fill="transparent"
                strokeLinecap="round"
                className="transition-all duration-700 ease-out"
              />
            )}

            {/* Ultra Premium slice (Purple/Violet) */}
            {ultraCount > 0 && (
              <circle
                cx="60"
                cy="60"
                r={radius}
                stroke="#a855f7"
                strokeWidth="12"
                strokeDasharray={`${ultraLength} ${circumference}`}
                strokeDashoffset={ultraOffset}
                fill="transparent"
                strokeLinecap="round"
                className="transition-all duration-700 ease-out"
              />
            )}
          </svg>

          {/* Center Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-black text-white tracking-tight">
              {users.length.toLocaleString()}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              Total Users
            </span>
          </div>
        </div>

        {/* Breakdown Legend with Real Counts and Percentages */}
        <div className="space-y-3 w-full max-w-xs">
          {/* Free */}
          <div className="p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-zinc-500 shadow-sm" />
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <User className="w-3 h-3 text-zinc-400" />
                  <span>Free</span>
                </div>
                <div className="text-[10px] text-zinc-500">Standard Access</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs font-black text-white">{freeCount.toLocaleString()}</div>
              <div className="text-[11px] font-bold text-zinc-400">{freePct}%</div>
            </div>
          </div>

          {/* Premium */}
          <div className="p-3 rounded-2xl bg-zinc-950/60 border border-amber-500/20 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-amber-500 shadow-sm shadow-amber-500/30" />
              <div>
                <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <Crown className="w-3 h-3 text-amber-400" />
                  <span>Premium</span>
                </div>
                <div className="text-[10px] text-zinc-500">Full Access</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs font-black text-amber-400">{premiumCount.toLocaleString()}</div>
              <div className="text-[11px] font-bold text-amber-400">{premPct}%</div>
            </div>
          </div>

          {/* Ultra Premium */}
          <div className="p-3 rounded-2xl bg-zinc-950/60 border border-purple-500/25 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-purple-500 shadow-sm shadow-purple-500/30" />
              <div>
                <div className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-purple-400" />
                  <span>Ultra Premium</span>
                </div>
                <div className="text-[10px] text-zinc-500">VIP Unlimited</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs font-black text-purple-300">{ultraCount.toLocaleString()}</div>
              <div className="text-[11px] font-bold text-purple-300">{ultraPct}%</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
