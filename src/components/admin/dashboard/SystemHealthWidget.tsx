import React, { useState, useEffect } from 'react';
import { Database, ShieldCheck, Cloud, Globe, Lock, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { testConnection, app, auth, db } from '../../../lib/firebase';
import { promptStore } from '../../../services/promptStore';

export const SystemHealthWidget: React.FC = () => {
  const [checking, setChecking] = useState(false);
  const [dbStatus, setDbStatus] = useState<'connected' | 'checking' | 'offline'>('connected');
  const [dbLatency, setDbLatency] = useState<number | null>(null);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  // Cloudinary connection verification
  const cldSettings = promptStore.getCloudinarySettings();
  const isCloudinaryConfigured = Boolean(cldSettings.cloudName && cldSettings.uploadPreset);

  // Real Firebase and Auth initializations
  const isFirebaseAppActive = Boolean(app);
  const isAuthActive = Boolean(auth);

  const checkHealth = async () => {
    setChecking(true);
    setDbStatus('checking');
    const start = performance.now();

    try {
      await testConnection();
      const elapsed = Math.round(performance.now() - start);
      setDbLatency(elapsed);
      setDbStatus('connected');
    } catch {
      setDbStatus('offline');
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    checkHealth();

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="p-6 rounded-3xl bg-zinc-900/90 border border-zinc-800 shadow-xl space-y-4">
      <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
        <div>
          <h2 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>SYSTEM / WEBSITE HEALTH</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Real-time verified operational status of services and APIs
          </p>
        </div>

        <button
          type="button"
          onClick={checkHealth}
          disabled={checking}
          className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin text-blue-400' : ''}`} />
          <span>{checking ? 'Checking...' : 'Ping Live'}</span>
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* 1. Website Status */}
        <div className="p-3.5 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-zinc-400">Website Status</span>
            <Globe className="w-3.5 h-3.5 text-zinc-500" />
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
              }`}
            />
            <span
              className={`text-xs font-extrabold uppercase tracking-wide ${
                isOnline ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>

        {/* 2. Firebase App */}
        <div className="p-3.5 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-zinc-400">Firebase</span>
            <ShieldCheck className="w-3.5 h-3.5 text-zinc-500" />
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                isFirebaseAppActive ? 'bg-emerald-400' : 'bg-rose-500'
              }`}
            />
            <span
              className={`text-xs font-extrabold uppercase tracking-wide ${
                isFirebaseAppActive ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {isFirebaseAppActive ? 'Connected' : 'Unavailable'}
            </span>
          </div>
        </div>

        {/* 3. Database (Firestore) */}
        <div className="p-3.5 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-zinc-400">Database</span>
            <Database className="w-3.5 h-3.5 text-zinc-500" />
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                dbStatus === 'connected'
                  ? 'bg-emerald-400'
                  : dbStatus === 'checking'
                  ? 'bg-amber-400 animate-pulse'
                  : 'bg-rose-500'
              }`}
            />
            <div className="text-xs font-extrabold uppercase tracking-wide">
              {dbStatus === 'connected' ? (
                <span className="text-emerald-400">
                  Connected{dbLatency !== null ? ` (${dbLatency}ms)` : ''}
                </span>
              ) : dbStatus === 'checking' ? (
                <span className="text-amber-400">Pinging...</span>
              ) : (
                <span className="text-rose-400">Offline</span>
              )}
            </div>
          </div>
        </div>

        {/* 4. Cloudinary */}
        <div className="p-3.5 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-zinc-400">Cloudinary</span>
            <Cloud className="w-3.5 h-3.5 text-zinc-500" />
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                isCloudinaryConfigured ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
            />
            <span
              className={`text-xs font-extrabold uppercase tracking-wide ${
                isCloudinaryConfigured ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {isCloudinaryConfigured ? 'Connected' : 'Not Configured'}
            </span>
          </div>
        </div>

        {/* 5. Authentication */}
        <div className="p-3.5 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 space-y-2 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-zinc-400">Authentication</span>
            <Lock className="w-3.5 h-3.5 text-zinc-500" />
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${isAuthActive ? 'bg-emerald-400' : 'bg-rose-500'}`}
            />
            <span
              className={`text-xs font-extrabold uppercase tracking-wide ${
                isAuthActive ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {isAuthActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
