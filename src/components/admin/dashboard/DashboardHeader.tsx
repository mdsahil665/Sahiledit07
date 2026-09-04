import React, { useState, useEffect } from 'react';
import { ShieldCheck, Activity } from 'lucide-react';

interface DashboardHeaderProps {
  systemOnline?: boolean;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ systemOnline = true }) => {
  const [currentDateTime, setCurrentDateTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const formatted = now.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
      setCurrentDateTime(formatted);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000 * 30); // update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800/80">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[11px] font-black uppercase tracking-widest text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded-full border border-blue-500/20">
            Sahil Edits
          </span>
          <span className="text-zinc-600 dark:text-zinc-500">•</span>
          <span className="text-xs font-semibold text-zinc-400">
            Control Center
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Admin Dashboard
        </h1>
        <p className="text-xs text-zinc-400 mt-1 font-medium">
          Real-time overview of your website
        </p>
      </div>

      <div className="flex items-center gap-3 self-start sm:self-auto flex-wrap">
        {/* Date & Time */}
        <div className="px-3.5 py-2 rounded-2xl bg-zinc-900/90 border border-zinc-800 text-xs font-mono text-zinc-300 shadow-sm flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-blue-400" />
          <span>{currentDateTime || 'Loading date...'}</span>
        </div>

        {/* Live Status Badge */}
        <div className="px-3.5 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center gap-2 shadow-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>System Online</span>
        </div>
      </div>
    </div>
  );
};
