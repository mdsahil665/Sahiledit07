import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Category } from '../types';
import { CategoryIcon } from './CategoryIcon';
import { useAuth } from '../context/AuthContext';
import { promptStore } from '../services/promptStore';
import { useLogo } from '../context/LogoContext';
import { useToast } from './Toast';
import {
  Search,
  Sun,
  Moon,
  Sparkles,
  Menu,
  X,
  Layers,
  LogIn,
  User as UserIcon,
  Heart,
  ShieldCheck,
  LogOut,
  ChevronRight,
  Crown,
  Smile,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface HeaderProps {
  categories: Category[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string | null;
  onSelectCategory: (id: string | null) => void;
  onNavigateHome: () => void;
  onOpenLogin: () => void;
  onOpenProfile: () => void;
  onOpenAdminDashboard: () => void;
  onOpenPremiumPage: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  categories,
  searchQuery,
  onSearchChange,
  selectedCategory,
  onSelectCategory,
  onNavigateHome,
  onOpenLogin,
  onOpenProfile,
  onOpenAdminDashboard,
  onOpenPremiumPage,
}) => {
  const { theme, toggleTheme } = useTheme();
  const { currentUser, isAdmin, logout } = useAuth();
  const { showToast } = useToast();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [fc, setFc] = useState(() => promptStore.getFeatureControls());
  const [websiteSettings, setWebsiteSettings] = useState(() => promptStore.getWebsiteSettings());
  const [premiumSettings, setPremiumSettings] = useState(() => promptStore.getPremiumSettings());
  const { logoUrl } = useLogo();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    const unsubscribe = promptStore.subscribe(() => {
      setFc(promptStore.getFeatureControls());
      setWebsiteSettings(promptStore.getWebsiteSettings());
      setPremiumSettings(promptStore.getPremiumSettings());
    });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      unsubscribe();
    };
  }, []);

  const handleCrownClick = () => {
    const prem = promptStore.getPremiumSettings();
    if (!prem.enabled || !prem.premiumPageEnabled) {
      showToast('Premium Status', 'Premium is currently unavailable.', 'info');
      return;
    }
    onOpenPremiumPage();
  };

  const handleLogout = async () => {
    await logout();
    setIsMenuOpen(false);
  };

  return (
    <>
      <header className="sticky top-2 z-40 px-3 sm:px-6 max-w-[1400px] 2xl:max-w-[1600px] mx-auto w-full transition-all duration-300">
        <div
          className={`w-full rounded-full transition-all duration-300 px-4 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between border shadow-lg backdrop-blur-xl ${
            theme === 'dark'
              ? 'bg-slate-900/90 border-slate-800/80 shadow-black/40 text-white'
              : 'bg-white/90 border-slate-200/80 shadow-blue-500/5 text-slate-900'
          }`}
        >
          {/* 1. Brand / Logo Left */}
          <div
            className="flex items-center gap-2 sm:gap-3 cursor-pointer group shrink-0 select-none"
            onClick={onNavigateHome}
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-all duration-300 overflow-hidden border border-white/20 shrink-0">
              {logoUrl ? (
                <img src={logoUrl} alt="Website Logo" className="w-full h-full object-cover rounded-full" />
              ) : (
                <span className="font-black text-lg text-white">P</span>
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-lg sm:text-xl font-extrabold tracking-tight font-sans truncate">
                Sahil Edits
              </span>
              <span className="text-[10px] font-bold text-blue-500 tracking-wider uppercase -mt-1 hidden sm:block">
                AI Prompt Library
              </span>
            </div>
          </div>

          {/* 2. Desktop Quick Categories Links */}
          <nav className="hidden xl:flex items-center gap-1.5 mx-4">
            <button
              onClick={() => {
                onSelectCategory(null);
                onSearchChange('');
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                selectedCategory === null && !searchQuery
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              ✨ All Prompts
            </button>

            {categories.slice(0, 5).map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => onSelectCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <CategoryIcon name={cat.icon} className="w-3.5 h-3.5 text-blue-500" />
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </nav>

          {/* 3. Reference-Style Icon Action Buttons Right */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Crown / Premium Icon Button */}
            {premiumSettings.enabled !== false && premiumSettings.showCrownIcon !== false && (
              <button
                type="button"
                onClick={handleCrownClick}
                aria-label="Sahil Edits Premium"
                title="Sahil Edits Premium"
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-tr from-amber-500/20 via-purple-500/20 to-blue-500/20 border border-amber-500/30 text-amber-500 hover:scale-105 flex items-center justify-center transition-all duration-200 shadow-sm active:scale-95 cursor-pointer"
              >
                <Crown className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-amber-400" />
              </button>
            )}

            {/* Smile / Profile Icon Button */}
            <button
              type="button"
              onClick={() => {
                if (currentUser) {
                  onOpenProfile();
                } else {
                  onOpenLogin();
                }
              }}
              aria-label="User Account"
              title={currentUser ? (currentUser.displayName || currentUser.email || 'My Account') : 'Sign In'}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-blue-50 dark:bg-slate-800 border border-blue-100 dark:border-slate-700/80 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-slate-700 flex items-center justify-center transition-all duration-200 shadow-sm active:scale-95 cursor-pointer"
            >
              {currentUser?.photoURL ? (
                <img src={currentUser.photoURL} alt="User Avatar" className="w-full h-full object-cover rounded-full" />
              ) : (
                <Smile className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              )}
            </button>

            {/* Search Toggle Icon Button */}
            {fc.searchBar && (
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById('latest-posts-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                aria-label="Search"
                title="Search Prompts"
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-blue-50 dark:bg-slate-800 border border-blue-100 dark:border-slate-700/80 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-slate-700 flex items-center justify-center transition-all duration-200 shadow-sm active:scale-95 cursor-pointer"
              >
                <Search className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              </button>
            )}

            {/* Theme Toggle Icon Button */}
            {fc.darkMode && (
              <button
                type="button"
                onClick={toggleTheme}
                aria-label="Toggle Theme"
                title="Toggle Light/Dark Mode"
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-blue-50 dark:bg-slate-800 border border-blue-100 dark:border-slate-700/80 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-slate-700 flex items-center justify-center transition-all duration-200 shadow-sm active:scale-95 cursor-pointer"
              >
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-blue-600" />
                )}
              </button>
            )}

            {/* Mobile Hamburger Drawer Menu Button */}
            <button
              type="button"
              onClick={() => setIsMenuOpen(true)}
              aria-label="Open Navigation Menu"
              className="xl:hidden w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition-all shrink-0 cursor-pointer"
            >
              <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Slide-over Mobile Navigation Drawer */}
      <AnimatePresence>
        {isMenuOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              className="relative w-full max-w-sm h-full bg-white dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 shadow-2xl z-10 flex flex-col justify-between overflow-y-auto p-6"
            >
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
                  <div className="flex items-center gap-2">
                    <Layers className="w-5 h-5 text-blue-500" />
                    <span className="font-bold text-lg text-slate-900 dark:text-white">
                      Sahil Edits Menu
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsMenuOpen(false)}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block px-1">
                    Account &amp; Access
                  </span>

                  {!currentUser ? (
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        onOpenLogin();
                      }}
                      className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-sm shadow-md transition-all"
                    >
                      <div className="flex items-center gap-2.5">
                        <LogIn className="w-4 h-4" />
                        <span>Login / Sign In</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-blue-200" />
                    </button>
                  ) : (
                    <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-bold text-sm flex items-center justify-center shrink-0">
                          {(currentUser.displayName || currentUser.email || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-xs text-slate-900 dark:text-white truncate">
                            {currentUser.displayName || currentUser.email?.split('@')[0]}
                          </p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                            {currentUser.email}
                          </p>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1 text-xs">
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => {
                              setIsMenuOpen(false);
                              onOpenAdminDashboard();
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl bg-amber-500 text-white font-bold transition-colors shadow-sm"
                          >
                            <ShieldCheck className="w-4 h-4" />
                            <span>Admin Dashboard</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            setIsMenuOpen(false);
                            onOpenProfile();
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 font-semibold transition-colors"
                        >
                          <UserIcon className="w-4 h-4 text-blue-500" />
                          <span>My Profile</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setIsMenuOpen(false);
                            onOpenProfile();
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 font-semibold transition-colors"
                        >
                          <Heart className="w-4 h-4 text-rose-500" />
                          <span>My Favorites</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 font-semibold transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Logout</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block px-1">
                    Categories
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      onSelectCategory(null);
                      onSearchChange('');
                      setIsMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-3.5 rounded-2xl text-sm font-semibold transition-all ${
                      selectedCategory === null && !searchQuery
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <span>✨ All Prompts</span>
                  </button>

                  <div className="space-y-1.5 pt-1">
                    {categories.map((cat) => {
                      const isSelected = selectedCategory === cat.id;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => {
                            onSelectCategory(cat.id);
                            setIsMenuOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-medium transition-all text-left ${
                            isSelected
                              ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-bold'
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <CategoryIcon name={cat.icon} className="w-4 h-4 text-blue-500" />
                            <span>{cat.name}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
                <div className="text-center text-[11px] text-slate-400 font-medium">
                  © 2026 Sahil Edits. All Rights Reserved.
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
