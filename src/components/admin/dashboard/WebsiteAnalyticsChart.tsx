import React, { useState, useMemo } from 'react';
import { TrendingUp, Calendar, Users, Eye, Globe, AlertCircle } from 'lucide-react';
import { DashboardUserRecord } from './types';
import { PromptPost } from '../../../types';

type MetricType = 'new_users' | 'views' | 'visitors';
type PeriodType = 'today' | '7d' | '30d' | '3m' | '12m';

interface WebsiteAnalyticsChartProps {
  users: DashboardUserRecord[];
  posts: PromptPost[];
  totalViews: number;
}

export const WebsiteAnalyticsChart: React.FC<WebsiteAnalyticsChartProps> = ({
  users,
  posts,
  totalViews,
}) => {
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('new_users');
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('7d');
  const [hoveredPoint, setHoveredPoint] = useState<{ label: string; value: number } | null>(null);

  // Generate real data buckets for New Users based on actual user.createdAt
  const chartData = useMemo(() => {
    const now = new Date();

    if (selectedMetric === 'new_users') {
      if (selectedPeriod === 'today') {
        // Hourly buckets for today (6 slots: 00:00, 04:00, 08:00, 12:00, 16:00, 20:00)
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const buckets = [
          { label: '00:00 - 04:00', start: 0, end: 4, count: 0 },
          { label: '04:00 - 08:00', start: 4, end: 8, count: 0 },
          { label: '08:00 - 12:00', start: 8, end: 12, count: 0 },
          { label: '12:00 - 16:00', start: 12, end: 16, count: 0 },
          { label: '16:00 - 20:00', start: 16, end: 20, count: 0 },
          { label: '20:00 - 23:59', start: 20, end: 24, count: 0 },
        ];

        users.forEach((u) => {
          if (!u.createdAt) return;
          const time = new Date(u.createdAt).getTime();
          if (time >= startOfToday) {
            const hour = new Date(u.createdAt).getHours();
            const b = buckets.find((bucket) => hour >= bucket.start && hour < bucket.end);
            if (b) b.count += 1;
          }
        });

        return buckets.map((b) => ({ label: b.label.split(' - ')[0], value: b.count }));
      }

      if (selectedPeriod === '7d') {
        // Last 7 days
        const days: { label: string; dateStr: string; count: number }[] = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const dateStr = d.toISOString().split('T')[0];
          const label = d.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });
          days.push({ label, dateStr, count: 0 });
        }

        users.forEach((u) => {
          if (!u.createdAt) return;
          const userDate = u.createdAt.split('T')[0];
          const match = days.find((d) => d.dateStr === userDate);
          if (match) match.count += 1;
        });

        return days.map((d) => ({ label: d.label, value: d.count }));
      }

      if (selectedPeriod === '30d') {
        // 6 intervals of 5 days each over the past 30 days
        const intervals: { label: string; start: number; end: number; count: number }[] = [];
        for (let i = 5; i >= 0; i--) {
          const startDays = (i + 1) * 5;
          const endDays = i * 5;
          const startTime = Date.now() - startDays * 24 * 60 * 60 * 1000;
          const endTime = Date.now() - endDays * 24 * 60 * 60 * 1000;
          const d = new Date(endTime);
          const label = `${d.getDate()} ${d.toLocaleDateString('en-US', { month: 'short' })}`;
          intervals.push({ label, start: startTime, end: endTime, count: 0 });
        }

        users.forEach((u) => {
          if (!u.createdAt) return;
          const time = new Date(u.createdAt).getTime();
          const match = intervals.find((int) => time >= int.start && time < int.end);
          if (match) match.count += 1;
        });

        return intervals.map((int) => ({ label: int.label, value: int.count }));
      }

      if (selectedPeriod === '3m') {
        // Last 3 months
        const months: { label: string; yearMonth: string; count: number }[] = [];
        for (let i = 2; i >= 0; i--) {
          const d = new Date();
          d.setMonth(d.getMonth() - i);
          const yearMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          const label = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
          months.push({ label, yearMonth, count: 0 });
        }

        users.forEach((u) => {
          if (!u.createdAt) return;
          const ym = u.createdAt.substring(0, 7);
          const match = months.find((m) => m.yearMonth === ym);
          if (match) match.count += 1;
        });

        return months.map((m) => ({ label: m.label, value: m.count }));
      }

      if (selectedPeriod === '12m') {
        // Last 12 months
        const months: { label: string; yearMonth: string; count: number }[] = [];
        for (let i = 11; i >= 0; i--) {
          const d = new Date();
          d.setMonth(d.getMonth() - i);
          const yearMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          const label = d.toLocaleDateString('en-US', { month: 'short' });
          months.push({ label, yearMonth, count: 0 });
        }

        users.forEach((u) => {
          if (!u.createdAt) return;
          const ym = u.createdAt.substring(0, 7);
          const match = months.find((m) => m.yearMonth === ym);
          if (match) match.count += 1;
        });

        return months.map((m) => ({ label: m.label, value: m.count }));
      }
    }

    // Views and Visitors: Check if time-series tracking exists
    return [];
  }, [users, selectedMetric, selectedPeriod]);

  const maxVal = Math.max(...chartData.map((d) => d.value), 4);
  const totalInPeriod = chartData.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="p-6 rounded-3xl bg-zinc-900/90 border border-zinc-800 shadow-xl space-y-6">
      {/* Header with Title and Control Buttons */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-zinc-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-extrabold text-white tracking-tight flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-400" />
              <span>WEBSITE PERFORMANCE</span>
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase tracking-wider">
              Real Data
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Real performance telemetry, traffic patterns, and user registration history
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          {/* Metric Selector */}
          <div className="flex items-center bg-zinc-950 p-1 rounded-2xl border border-zinc-800 text-xs font-bold">
            <button
              type="button"
              onClick={() => setSelectedMetric('new_users')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedMetric === 'new_users'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>New Users</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedMetric('views')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedMetric === 'views'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Views</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedMetric('visitors')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedMetric === 'visitors'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Visitors</span>
            </button>
          </div>

          {/* Period Selector */}
          <div className="flex items-center bg-zinc-950 p-1 rounded-2xl border border-zinc-800 text-xs font-bold overflow-x-auto">
            {(
              [
                { key: 'today', label: 'Today' },
                { key: '7d', label: '7 Days' },
                { key: '30d', label: '30 Days' },
                { key: '3m', label: '3 Months' },
                { key: '12m', label: '12 Months' },
              ] as const
            ).map((period) => (
              <button
                key={period.key}
                type="button"
                onClick={() => setSelectedPeriod(period.key)}
                className={`px-2.5 py-1.5 rounded-xl transition-all cursor-pointer text-[11px] whitespace-nowrap ${
                  selectedPeriod === period.key
                    ? 'bg-zinc-800 text-white border border-zinc-700 font-extrabold shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {period.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart Canvas Area */}
      {selectedMetric === 'new_users' ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-zinc-400">
              Registrations in selected period:{' '}
              <span className="text-white font-extrabold text-sm">
                {totalInPeriod} new {totalInPeriod === 1 ? 'user' : 'users'}
              </span>
            </div>
            {hoveredPoint && (
              <div className="px-3 py-1 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold flex items-center gap-1.5 animate-fade-in">
                <span>{hoveredPoint.label}:</span>
                <span className="font-extrabold">{hoveredPoint.value} signups</span>
              </div>
            )}
          </div>

          {/* SVG Bar Chart Visualization */}
          <div className="h-64 w-full pt-4 pb-2 relative flex flex-col justify-end">
            <div className="flex-1 flex items-end justify-between gap-2 sm:gap-4 px-2 border-b border-zinc-800">
              {chartData.map((d, idx) => {
                const heightPercent = maxVal > 0 ? (d.value / maxVal) * 100 : 0;
                const isZero = d.value === 0;

                return (
                  <div
                    key={idx}
                    className="flex-1 flex flex-col items-center justify-end h-full group relative cursor-pointer"
                    onMouseEnter={() => setHoveredPoint({ label: d.label, value: d.value })}
                    onMouseLeave={() => setHoveredPoint(null)}
                  >
                    {/* Tooltip on hover */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 bg-zinc-950 text-white text-[10px] font-bold py-1 px-2 rounded-lg border border-zinc-700 pointer-events-none whitespace-nowrap z-20 shadow-xl">
                      {d.label}: {d.value}
                    </div>

                    {/* Bar representation */}
                    <div
                      className={`w-full max-w-[48px] rounded-t-xl transition-all duration-300 ${
                        isZero
                          ? 'bg-zinc-800/40 h-1.5'
                          : 'bg-gradient-to-t from-blue-600 to-indigo-500 hover:from-blue-500 hover:to-indigo-400 shadow-md shadow-blue-600/20'
                      }`}
                      style={{ height: isZero ? '4px' : `${Math.max(12, heightPercent)}%` }}
                    />
                  </div>
                );
              })}
            </div>

            {/* X-Axis Labels */}
            <div className="flex justify-between items-center px-2 pt-2 text-[10px] sm:text-xs font-semibold text-zinc-500">
              {chartData.map((d, idx) => (
                <div key={idx} className="flex-1 text-center truncate px-1">
                  {d.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : selectedMetric === 'views' ? (
        /* Real Views State with Honest Data Reporting */
        <div className="p-8 rounded-2xl bg-zinc-950/60 border border-zinc-800 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto">
            <Eye className="w-6 h-6" />
          </div>

          <div>
            <h3 className="text-base font-extrabold text-white">
              Total Real Views: {totalViews.toLocaleString()}
            </h3>
            <p className="text-xs text-zinc-400 max-w-md mx-auto mt-1">
              Views are counted persistently per prompt post in Firestore. Historical daily time-series breakdowns are not logged per hour/day.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-medium text-zinc-400">
            <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>Time-series view breakdown: Data not available in current database schema</span>
          </div>

          {/* Real Top 3 Viewed Posts Preview as Real Representation */}
          <div className="pt-4 border-t border-zinc-800/80 max-w-lg mx-auto">
            <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-2 text-left">
              Highest Viewed Prompts (Real Telemetry):
            </div>
            <div className="space-y-2 text-left">
              {posts
                .slice()
                .sort((a, b) => (b.views || 0) - (a.views || 0))
                .slice(0, 3)
                .map((p) => (
                  <div
                    key={p.id}
                    className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between text-xs"
                  >
                    <span className="font-bold text-white truncate max-w-xs">{p.title}</span>
                    <span className="font-mono text-emerald-400 font-bold shrink-0">
                      {(p.views || 0).toLocaleString()} views
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      ) : (
        /* Real Visitors State with Honest Data Reporting */
        <div className="p-8 rounded-2xl bg-zinc-950/60 border border-zinc-800 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center mx-auto">
            <Globe className="w-6 h-6" />
          </div>

          <div>
            <h3 className="text-base font-extrabold text-white">
              Website Visitors Telemetry
            </h3>
            <p className="text-xs text-zinc-400 max-w-md mx-auto mt-1">
              Guest visitors are counted from active client sessions without storing third-party tracker cookies.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-medium text-zinc-400">
            <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>Daily historical visitor series: Data not available (requires analytics log pipeline)</span>
          </div>
        </div>
      )}
    </div>
  );
};
