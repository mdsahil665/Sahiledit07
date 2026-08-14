import React, { useState, useEffect } from 'react';
import {
  Shield,
  Key,
  Lock,
  Save,
  CheckCircle2,
  AlertTriangle,
  LogOut,
  Clock,
  Eye,
  EyeOff,
  UserCheck,
  Smartphone,
  Sparkles,
} from 'lucide-react';
import { SecuritySettings } from '../../types';
import { promptStore } from '../../services/promptStore';
import { useToast } from '../Toast';

export const SecurityAuthSection: React.FC = () => {
  const [security, setSecurity] = useState<SecuritySettings>(() => promptStore.getSecuritySettings());
  const [currentPasscode, setCurrentPasscode] = useState('');
  const [newPasscode, setNewPasscode] = useState('');
  const [confirmPasscode, setConfirmPasscode] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    const unsub = promptStore.subscribe(() => {
      setSecurity(promptStore.getSecuritySettings());
    });
    return unsub;
  }, []);

  const handlePasscodeChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPasscode.trim()) {
      showToast('Error', 'Passcode cannot be empty', 'error');
      return;
    }
    if (newPasscode !== confirmPasscode) {
      showToast('Mismatch', 'New passcode and confirmation do not match.', 'error');
      return;
    }
    if (newPasscode.length < 4) {
      showToast('Too Short', 'Passcode should be at least 4 characters long.', 'error');
      return;
    }

    promptStore.setAdminPasscode(newPasscode);
    setCurrentPasscode('');
    setNewPasscode('');
    setConfirmPasscode('');
    showToast('✓ Passcode Updated', 'Admin authentication passcode updated successfully.', 'success');
  };

  const handleSaveSecuritySettings = async () => {
    setIsSaving(true);
    try {
      await promptStore.updateSecuritySettings(security);
      showToast('✓ Security Settings Saved', 'Protection preferences updated.');
    } catch (e) {
      showToast('Error', 'Failed to save security settings.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-400" />
            <span>Security, Access & Authentication</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Manage admin credentials, lockout rules, session timeout, and access controls.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            promptStore.logoutAdmin();
            window.location.reload();
          }}
          className="px-4 py-2.5 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-bold transition-all cursor-pointer flex items-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          <span>Lock Admin Panel</span>
        </button>
      </div>

      {/* Security Status Card */}
      <div className="p-5 rounded-3xl bg-zinc-900 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Admin Authentication Status</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                ACTIVE SESSION
              </span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Role: <span className="text-white font-semibold">Master Administrator (Root)</span> · Storage: <span className="text-white font-semibold">Encrypted Client Session</span>
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Change Admin Passcode */}
        <div className="bg-zinc-900/90 rounded-3xl border border-zinc-800 p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
              <Key className="w-4 h-4 text-indigo-400" />
              <span>Change Admin Passcode</span>
            </h3>
            <button
              type="button"
              onClick={() => setShowPasscode(!showPasscode)}
              className="text-xs text-zinc-400 hover:text-white flex items-center gap-1"
            >
              {showPasscode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{showPasscode ? 'Hide' : 'Show'}</span>
            </button>
          </div>

          <form onSubmit={handlePasscodeChange} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300">New Admin Passcode</label>
              <input
                type={showPasscode ? 'text' : 'password'}
                value={newPasscode}
                onChange={(e) => setNewPasscode(e.target.value)}
                placeholder="Enter new master passcode"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300">Confirm New Passcode</label>
              <input
                type={showPasscode ? 'text' : 'password'}
                value={confirmPasscode}
                onChange={(e) => setConfirmPasscode(e.target.value)}
                placeholder="Repeat new passcode"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
            >
              Update Admin Passcode
            </button>
          </form>
        </div>

        {/* Protection & Brute Force Controls */}
        <div className="bg-zinc-900/90 rounded-3xl border border-zinc-800 p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-400" />
              <span>Session & Rate Limits</span>
            </h3>
            <button
              type="button"
              onClick={handleSaveSecuritySettings}
              disabled={isSaving}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold cursor-pointer disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Rules'}
            </button>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300">Max Failed Login Attempts</label>
              <input
                type="number"
                min={3}
                max={20}
                value={security.rateLimitMaxAttempts || 5}
                onChange={(e) => setSecurity({ ...security, rateLimitMaxAttempts: parseInt(e.target.value) || 5 })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-white focus:outline-none focus:border-indigo-500"
              />
              <p className="text-[11px] text-zinc-500">Temporarily locks login upon reaching threshold.</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300">Lockout Duration (Minutes)</label>
              <input
                type="number"
                min={1}
                max={120}
                value={security.lockoutDurationMinutes || 15}
                onChange={(e) => setSecurity({ ...security, lockoutDurationMinutes: parseInt(e.target.value) || 15 })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800/80 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white">Auto-Logout on Inactivity</span>
                <p className="text-[11px] text-zinc-500 mt-0.5">Clears session after 60 minutes of idle time</p>
              </div>
              <input
                type="checkbox"
                checked={security.autoLogoutOnInactivity !== false}
                onChange={(e) => setSecurity({ ...security, autoLogoutOnInactivity: e.target.checked })}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
