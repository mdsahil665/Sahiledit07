import React, { useState, useEffect } from 'react';
import { promptStore } from '../../services/promptStore';
import { PremiumSettings } from '../../types';
import { useToast } from '../Toast';
import { db } from '../../lib/firebase';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import {
  Crown,
  Save,
  Check,
  X,
  Plus,
  Trash2,
  DollarSign,
  ShieldCheck,
  User,
  Search,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Eye,
  CheckCircle2,
  Loader2,
} from 'lucide-react';

export const PremiumAdminSection: React.FC = () => {
  const { showToast } = useToast();
  const [settings, setSettings] = useState<PremiumSettings>(() => promptStore.getPremiumSettings());
  const [newBenefit, setNewBenefit] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const snap = await getDocs(collection(db, 'users'));
      const list: any[] = [];
      snap.forEach((d) => {
        list.push({ id: d.id, ...d.data() });
      });
      setUsers(list);
    } catch (e) {
      console.warn('Failed to fetch users list:', e);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      await promptStore.updatePremiumSettings(settings);
      showToast('Settings Saved', 'Premium & Subscription settings updated successfully!', 'success');
    } catch (e: any) {
      showToast('Error', e.message || 'Failed to save settings', 'error');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleToggleUserPremium = async (userId: string, currentStatus: boolean) => {
    try {
      const newStatus = !currentStatus;
      const userRef = doc(db, 'users', userId);
      await setDoc(userRef, { isPremium: newStatus, updatedAt: new Date().toISOString() }, { merge: true });
      
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, isPremium: newStatus } : u))
      );

      showToast(
        'User Status Updated',
        `User Premium status set to ${newStatus ? 'ACTIVE' : 'INACTIVE'}`,
        'success'
      );
    } catch (e: any) {
      showToast('Error', e.message || 'Failed to update user status', 'error');
    }
  };

  const handleAddBenefit = () => {
    if (!newBenefit.trim()) return;
    setSettings((prev) => ({
      ...prev,
      benefits: [...(prev.benefits || []), newBenefit.trim()],
    }));
    setNewBenefit('');
  };

  const handleRemoveBenefit = (index: number) => {
    setSettings((prev) => ({
      ...prev,
      benefits: prev.benefits.filter((_, i) => i !== index),
    }));
  };

  const filteredUsers = users.filter((u) => {
    const q = userSearch.toLowerCase();
    return (
      (u.email || '').toLowerCase().includes(q) ||
      (u.displayName || '').toLowerCase().includes(q) ||
      (u.id || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-blue-500/10 border border-amber-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-purple-600 flex items-center justify-center text-white shadow-lg shrink-0">
            <Crown className="w-6 h-6 text-amber-200" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
              Premium &amp; Subscription Control Panel
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Manage lifetime pricing, benefits, ad settings, and user premium access.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSaveSettings}
          disabled={savingSettings}
          className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
        >
          {savingSettings ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>Save Premium Settings</span>
        </button>
      </div>

      {/* Feature & Controls Toggles */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Premium System ON/OFF */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-500" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Premium System
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setSettings((s) => ({ ...s, enabled: !s.enabled }))}
              className={`px-3 py-1.5 rounded-xl font-extrabold text-xs transition-all flex items-center gap-1 cursor-pointer ${
                settings.enabled
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700'
              }`}
            >
              {settings.enabled ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>ON</span>
                </>
              ) : (
                <>
                  <X className="w-3.5 h-3.5 text-slate-400" />
                  <span>OFF</span>
                </>
              )}
            </button>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Master toggle for entire premium ecosystem across Sahil Edits.
          </p>
        </div>

        {/* Show Premium Crown ON/OFF */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-blue-500" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Show Premium Crown
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setSettings((s) => ({ ...s, showCrownIcon: !s.showCrownIcon }))}
              className={`px-3 py-1.5 rounded-xl font-extrabold text-xs transition-all flex items-center gap-1 cursor-pointer ${
                settings.showCrownIcon !== false
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700'
              }`}
            >
              {settings.showCrownIcon !== false ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>ON</span>
                </>
              ) : (
                <>
                  <X className="w-3.5 h-3.5 text-slate-400" />
                  <span>OFF</span>
                </>
              )}
            </button>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Control whether the Crown icon is visible in website Header.
          </p>
        </div>

        {/* Premium Page ON/OFF */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Premium Page
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setSettings((s) => ({ ...s, premiumPageEnabled: !s.premiumPageEnabled }))}
              className={`px-3 py-1.5 rounded-xl font-extrabold text-xs transition-all flex items-center gap-1 cursor-pointer ${
                settings.premiumPageEnabled !== false
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700'
              }`}
            >
              {settings.premiumPageEnabled !== false ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>ON</span>
                </>
              ) : (
                <>
                  <X className="w-3.5 h-3.5 text-slate-400" />
                  <span>OFF</span>
                </>
              )}
            </button>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Control whether users can open the dedicated /premium page.
          </p>
        </div>

        {/* Premium Purchase ON/OFF */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-500" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Premium Purchase
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setSettings((s) => ({ ...s, premiumPurchaseEnabled: !s.premiumPurchaseEnabled }))}
              className={`px-3 py-1.5 rounded-xl font-extrabold text-xs transition-all flex items-center gap-1 cursor-pointer ${
                settings.premiumPurchaseEnabled !== false
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700'
              }`}
            >
              {settings.premiumPurchaseEnabled !== false ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>ON</span>
                </>
              ) : (
                <>
                  <X className="w-3.5 h-3.5 text-slate-400" />
                  <span>OFF</span>
                </>
              )}
            </button>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Enable or disable new checkout/purchase activations.
          </p>
        </div>

        {/* Website Ads Switch */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm flex flex-col justify-between md:col-span-2 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-500" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Website Ads Switch
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setSettings((s) => ({ ...s, adsEnabled: !s.adsEnabled }))}
              className={`px-3 py-1.5 rounded-xl font-extrabold text-xs transition-all flex items-center gap-1 cursor-pointer ${
                settings.adsEnabled
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30'
              }`}
            >
              {settings.adsEnabled ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Ads ON</span>
                </>
              ) : (
                <>
                  <X className="w-3.5 h-3.5 text-amber-500" />
                  <span>Ads OFF</span>
                </>
              )}
            </button>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Global toggle for ad banners. Free users see ads when ON; Premium users never see ads.
          </p>
        </div>
      </div>

      {/* Pricing & Content Settings */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-6 shadow-sm">
        <h3 className="font-bold text-base text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>Premium Plan &amp; Text Content</span>
        </h3>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Plan Price Display
            </label>
            <input
              type="text"
              value={settings.price || ''}
              onChange={(e) => setSettings({ ...settings, price: e.target.value })}
              placeholder="e.g. ₹99"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Plan Name
            </label>
            <input
              type="text"
              value={settings.planName || ''}
              onChange={(e) => setSettings({ ...settings, planName: e.target.value })}
              placeholder="e.g. PREMIUM"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              CTA Button Text
            </label>
            <input
              type="text"
              value={settings.buttonText || ''}
              onChange={(e) => setSettings({ ...settings, buttonText: e.target.value })}
              placeholder="e.g. Get Lifetime Access — ₹99"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Main Page Headline
            </label>
            <input
              type="text"
              value={settings.headline || ''}
              onChange={(e) => setSettings({ ...settings, headline: e.target.value })}
              placeholder="e.g. Go ad-free. Forever."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Plan Sub-Description
            </label>
            <input
              type="text"
              value={settings.planDescription || ''}
              onChange={(e) => setSettings({ ...settings, planDescription: e.target.value })}
              placeholder="e.g. Pay once, keep it for life — no subscription, no renewals."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Page Subtitle / Description
            </label>
            <textarea
              rows={2}
              value={settings.subtitle || ''}
              onChange={(e) => setSettings({ ...settings, subtitle: e.target.value })}
              placeholder="Enter subtitle for premium page..."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
            />
          </div>
        </div>

        {/* Benefits Manager */}
        <div className="space-y-3 pt-2">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Premium Features / Benefits List
          </label>

          <div className="space-y-2">
            {(settings.benefits || []).map((ben, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div className="flex-1 px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium dark:text-white">
                  {ben}
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveBenefit(idx)}
                  className="p-2 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-all cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="text"
              value={newBenefit}
              onChange={(e) => setNewBenefit(e.target.value)}
              placeholder="Add a new benefit item..."
              className="flex-1 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddBenefit();
                }
              }}
            />
            <button
              type="button"
              onClick={handleAddBenefit}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add</span>
            </button>
          </div>
        </div>
      </div>

      {/* User Premium Access Management */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <User className="w-4 h-4 text-blue-500" />
              <span>Registered Users Premium Access Manager</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Toggle Premium status for any user directly in Firestore.
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              placeholder="Search user email or name..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
            />
          </div>
        </div>

        {loadingUsers ? (
          <div className="py-8 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
            <span>Loading registered users from Firestore...</span>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            No registered users found matching "{userSearch}".
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Premium Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredUsers.map((u) => {
                  const isPrem = Boolean(u.isPremium);
                  return (
                    <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {u.displayName || u.email?.split('@')[0] || 'User'}
                        </div>
                        <div className="text-[11px] text-slate-500">{u.email}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            u.role === 'admin'
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {u.role || 'user'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {isPrem ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            <span>Lifetime Premium</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-semibold">
                            <span>Free Plan</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleToggleUserPremium(u.id, isPrem)}
                          className={`px-3 py-1.5 rounded-xl font-bold text-[11px] transition-all cursor-pointer ${
                            isPrem
                              ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20'
                              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
                          }`}
                        >
                          {isPrem ? 'Revoke Premium' : 'Grant Premium'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
