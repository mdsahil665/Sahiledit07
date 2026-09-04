import React from 'react';
import { PlusCircle, Film, Users, Crown, Zap } from 'lucide-react';
import { AdminTab } from '../AdminSidebar';

interface QuickActionsBarProps {
  onOpenAddPost: () => void;
  onAddVideoPrompt?: () => void;
  onSelectTab: (tab: AdminTab) => void;
}

export const QuickActionsBar: React.FC<QuickActionsBarProps> = ({
  onOpenAddPost,
  onAddVideoPrompt,
  onSelectTab,
}) => {
  return (
    <div className="p-6 rounded-3xl bg-zinc-900/90 border border-zinc-800 shadow-xl space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
          <Zap className="w-4 h-4 text-blue-400" />
          <span>QUICK ACTIONS</span>
        </h2>
        <span className="text-[11px] text-zinc-500 font-semibold">Direct Shortcuts</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* + Create New Post */}
        <button
          type="button"
          onClick={onOpenAddPost}
          className="p-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2.5 transition-all cursor-pointer ring-1 ring-white/20 hover:scale-[1.02] active:scale-[0.98]"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Create New Post</span>
        </button>

        {/* 🎬 Create Video Prompt */}
        <button
          type="button"
          onClick={() => {
            if (onAddVideoPrompt) {
              onAddVideoPrompt();
            } else {
              onSelectTab('posts');
            }
          }}
          className="p-4 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-extrabold text-xs shadow-lg shadow-rose-600/25 flex items-center justify-center gap-2.5 transition-all cursor-pointer ring-1 ring-white/20 hover:scale-[1.02] active:scale-[0.98]"
        >
          <Film className="w-4 h-4" />
          <span>Create Video Prompt</span>
        </button>

        {/* 👥 User Management */}
        <button
          type="button"
          onClick={() => onSelectTab('users')}
          className="p-4 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white font-extrabold text-xs border border-zinc-700/80 flex items-center justify-center gap-2.5 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
        >
          <Users className="w-4 h-4 text-blue-400" />
          <span>User Management</span>
        </button>

        {/* ⭐ Premium Users */}
        <button
          type="button"
          onClick={() => onSelectTab('premium_users')}
          className="p-4 rounded-2xl bg-gradient-to-r from-amber-600/90 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white font-extrabold text-xs shadow-lg shadow-amber-600/20 flex items-center justify-center gap-2.5 transition-all cursor-pointer ring-1 ring-white/20 hover:scale-[1.02] active:scale-[0.98]"
        >
          <Crown className="w-4 h-4" />
          <span>Premium Users</span>
        </button>
      </div>
    </div>
  );
};
