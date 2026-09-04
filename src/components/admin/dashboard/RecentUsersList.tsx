import React from 'react';
import { Users, Crown, Sparkles, ArrowUpRight, CheckCircle2, Ban } from 'lucide-react';
import { DashboardUserRecord } from './types';
import { AdminTab } from '../AdminSidebar';

interface RecentUsersListProps {
  users: DashboardUserRecord[];
  onSelectTab: (tab: AdminTab) => void;
}

export const RecentUsersList: React.FC<RecentUsersListProps> = ({ users, onSelectTab }) => {
  // Sort users by createdAt descending and take the latest 5
  const latestUsers = users
    .slice()
    .sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return timeB - timeA;
    })
    .slice(0, 5);

  const formatJoinedDate = (dateStr?: string) => {
    if (!dateStr) return 'Recently';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return 'Recently';
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return 'Recently';
    }
  };

  return (
    <div className="p-6 rounded-3xl bg-zinc-900/90 border border-zinc-800 shadow-xl space-y-4 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4 mb-4">
          <div>
            <h2 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-400" />
              <span>RECENT USERS</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Latest 5 registered member accounts
            </p>
          </div>

          <button
            type="button"
            onClick={() => onSelectTab('users')}
            className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>View All Users</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {latestUsers.length === 0 ? (
          <div className="py-12 text-center text-xs text-zinc-500">
            No registered users recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="pb-3 pl-2">User</th>
                  <th className="pb-3">Plan</th>
                  <th className="pb-3">Joined</th>
                  <th className="pb-3 pr-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {latestUsers.map((u) => {
                  const isUltra = u.plan === 'ultra' || u.plan === 'ultra_premium';
                  const isPrem = (u.isPremium || u.plan === 'premium') && !isUltra;
                  const isBanned = Boolean(u.isBanned);

                  return (
                    <tr
                      key={u.id}
                      onClick={() => onSelectTab('users')}
                      className="hover:bg-zinc-800/40 transition-colors cursor-pointer group"
                    >
                      {/* Avatar & Name */}
                      <td className="py-3 pl-2">
                        <div className="flex items-center gap-3">
                          {u.photoURL ? (
                            <img
                              src={u.photoURL}
                              alt={u.displayName || 'User'}
                              className="w-8 h-8 rounded-xl object-cover border border-zinc-700/60 shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-zinc-800 to-zinc-700 text-white flex items-center justify-center font-bold text-xs shrink-0 border border-zinc-700/60">
                              {(u.displayName || u.email || 'U')[0].toUpperCase()}
                            </div>
                          )}
                          <div className="truncate max-w-[140px] sm:max-w-[180px]">
                            <div className="font-bold text-white group-hover:text-blue-400 transition-colors truncate">
                              {u.displayName || u.email?.split('@')[0] || 'User'}
                            </div>
                            <div className="text-[10px] text-zinc-500 truncate">{u.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Plan */}
                      <td className="py-3">
                        {isUltra ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-500/15 text-purple-300 border border-purple-500/30 text-[10px] font-extrabold">
                            <Sparkles className="w-3 h-3 text-purple-400" />
                            <span>Ultra</span>
                          </span>
                        ) : isPrem ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[10px] font-extrabold">
                            <Crown className="w-3 h-3 text-amber-400" />
                            <span>Premium</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-400 border border-zinc-700/50 text-[10px] font-bold">
                            Free
                          </span>
                        )}
                      </td>

                      {/* Joined Date */}
                      <td className="py-3 text-zinc-400 text-[11px] font-mono">
                        {formatJoinedDate(u.createdAt)}
                      </td>

                      {/* Status */}
                      <td className="py-3 pr-2 text-right">
                        {isBanned ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-bold">
                            <Ban className="w-3 h-3" />
                            <span>Banned</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Active</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="pt-3 border-t border-zinc-800/80">
        <button
          type="button"
          onClick={() => onSelectTab('users')}
          className="w-full py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>View All Users ({users.length})</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
