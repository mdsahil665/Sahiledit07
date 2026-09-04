import React, { useState } from 'react';
import {
  Menu,
  Search,
  Bell,
  Database,
  LogOut,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  X,
  AlertTriangle,
  ArrowLeft,
} from 'lucide-react';
import { NotificationItem } from '../../types';
import { promptStore } from '../../services/promptStore';
import { AdminTab } from './AdminSidebar';

interface AdminHeaderProps {
  activeTabTitle: string;
  categoryGroup?: string;
  canGoBack?: boolean;
  onBack?: () => void;
  onNavigateTab?: (tab: AdminTab) => void;
  onOpenMobileMenu: () => void;
  onOpenGlobalSearch: () => void;
  notifications: NotificationItem[];
  onLogout: () => void;
  onExit: () => void;
  isFirebaseConnected?: boolean;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  activeTabTitle,
  categoryGroup = 'Management',
  canGoBack = false,
  onBack,
  onNavigateTab,
  onOpenMobileMenu,
  onOpenGlobalSearch,
  notifications,
  onLogout,
  onExit,
  isFirebaseConnected = true,
}) => {
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
  const [showLogoutConfirmModal, setShowLogoutConfirmModal] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <>
      <header className="sticky top-0 z-30 bg-zinc-900/95 backdrop-blur-md border-b border-zinc-800 px-3 sm:px-6 py-2.5 sm:py-3 transition-all">
        <div className="flex items-center justify-between gap-3 sm:gap-4">
          {/* Left: Mobile Hamburger + Back Button + Breadcrumb Navigation */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            {/* Mobile Hamburger Toggle */}
            <button
              onClick={onOpenMobileMenu}
              className="lg:hidden p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center shrink-0 cursor-pointer"
              title="Open Navigation Menu"
              aria-label="Open Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Dedicated Back Button */}
            {canGoBack && onBack && (
              <button
                type="button"
                onClick={onBack}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl bg-zinc-800/90 hover:bg-zinc-700 border border-zinc-700/70 text-zinc-200 hover:text-white text-xs font-bold transition-all cursor-pointer min-w-[44px] min-h-[44px] shrink-0 shadow-sm group active:scale-95"
                title="Go back to previous admin page"
                aria-label="Go back to previous admin page"
              >
                <ArrowLeft className="w-4 h-4 text-blue-400 group-hover:-translate-x-0.5 transition-transform shrink-0" />
                <span className="font-extrabold hidden sm:inline">Back</span>
              </button>
            )}

            {/* Breadcrumb and Page Title */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-zinc-400 uppercase tracking-wider truncate">
                <button
                  type="button"
                  onClick={() => onNavigateTab ? onNavigateTab('dashboard') : (onBack ? onBack() : undefined)}
                  className="hover:text-blue-400 transition-colors cursor-pointer truncate"
                  title="Go to Admin Dashboard"
                >
                  SAHIL EDITS
                </button>
                <span className="text-zinc-600">/</span>
                <span className="text-blue-400 font-semibold truncate">{categoryGroup}</span>
              </div>
              <h1 className="text-base sm:text-lg lg:text-xl font-black text-white tracking-tight truncate flex items-center gap-2">
                <span>{activeTabTitle}</span>
              </h1>
            </div>
          </div>

          {/* Right: Actions, Search, Notifications, Admin Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* System Status Indicator Pill */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <Database className="w-3.5 h-3.5" />
              <span>{isFirebaseConnected ? 'Firebase Connected' : 'Local Mode'}</span>
            </div>

            {/* Global Admin Search Button */}
            <button
              onClick={onOpenGlobalSearch}
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700/80 border border-zinc-700/60 text-zinc-300 hover:text-white text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
              title="Global Admin Search (Cmd + K)"
            >
              <Search className="w-4 h-4 text-zinc-400" />
              <span className="hidden sm:inline text-zinc-400">Search admin...</span>
              <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[10px] font-bold bg-zinc-900 border border-zinc-700 rounded text-zinc-400">
                ⌘K
              </kbd>
            </button>

            {/* Notifications Bell Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowNotificationsDropdown(!showNotificationsDropdown)}
                className="relative p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-blue-500 text-white text-[9px] font-extrabold flex items-center justify-center animate-bounce">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown Panel */}
              {showNotificationsDropdown && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl z-50 p-4 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-blue-400" />
                      <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">
                        Notifications ({notifications.length})
                      </h3>
                    </div>
                    {notifications.length > 0 && (
                      <button
                        onClick={() => {
                          promptStore.clearNotifications();
                          setShowNotificationsDropdown(false);
                        }}
                        className="text-[10px] font-bold text-zinc-400 hover:text-rose-400 transition-colors"
                      >
                        Clear All
                      </button>
                    )}
                  </div>

                  <div className="max-h-72 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-zinc-500 text-center py-6">No recent system notifications.</p>
                    ) : (
                      notifications.map((n) => (
                        <div key={n.id} className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white">{n.title}</span>
                            <span className="text-[10px] text-zinc-500">
                              {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-400">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Exit to Website */}
            <button
              onClick={onExit}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-bold transition-all cursor-pointer border border-zinc-700/50"
              title="Exit to Public Website"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Public Site</span>
            </button>

            {/* Admin Profile & Logout Trigger */}
            <div className="flex items-center gap-2 pl-2 border-l border-zinc-800">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-bold text-white leading-tight">Sahil</span>
                <span className="text-[10px] font-semibold text-emerald-400">Super Admin</span>
              </div>

              <button
                onClick={() => setShowLogoutConfirmModal(true)}
                className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-zinc-900 border border-zinc-800 p-6 space-y-5 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-extrabold text-white">Sign Out of Admin Panel?</h3>
              <p className="text-xs text-zinc-400 mt-1">
                You will be logged out of your current admin session. You will need to re-authenticate to access the dashboard.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowLogoutConfirmModal(false)}
                className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowLogoutConfirmModal(false);
                  onLogout();
                }}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/20 transition-all cursor-pointer"
              >
                Confirm Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
