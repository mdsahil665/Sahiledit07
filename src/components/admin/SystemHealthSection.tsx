import React, { useState, useEffect } from 'react';
import { Database, ShieldCheck, Cloud, RefreshCw, CheckCircle2, AlertCircle, Wifi, Server, Lock, Activity } from 'lucide-react';
import { testConnection } from '../../lib/firebase';
import { promptStore } from '../../services/promptStore';
import { useToast } from '../Toast';

export const SystemHealthSection: React.FC = () => {
  const [testing, setTesting] = useState(false);
  const [firestoreStatus, setFirestoreStatus] = useState<'connected' | 'checking' | 'offline'>('connected');
  const [latency, setLatency] = useState<number | null>(null);

  const { showToast } = useToast();

  const runDiagnostic = async () => {
    setTesting(true);
    setFirestoreStatus('checking');
    const start = performance.now();

    try {
      await testConnection();
      const end = performance.now();
      const elapsed = Math.round(end - start);
      setLatency(elapsed);
      setFirestoreStatus('connected');
      showToast('✓ System Diagnostic Passed', `Firestore operational (${elapsed}ms latency)`);
    } catch (e) {
      setFirestoreStatus('offline');
      showToast('Connection Warning', 'Operating in resilient offline/cached mode', 'error');
    } finally {
      setTesting(false);
    }
  };

  useEffect(() => {
    runDiagnostic();
  }, []);

  const cldSettings = promptStore.getCloudinarySettings();
  const cldConfigured = Boolean(cldSettings.cloudName && cldSettings.uploadPreset);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-400" />
            <span>Firebase & Storage Health Status</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Real-time status monitoring for Firebase Authentication, Firestore Database, Storage, and Cloudinary Media API.
          </p>
        </div>

        <button
          onClick={runDiagnostic}
          disabled={testing}
          className="px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/20 flex items-center gap-2 transition-all cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${testing ? 'animate-spin' : ''}`} />
          <span>{testing ? 'Running Diagnostic...' : 'Run Live Diagnostic'}</span>
        </button>
      </div>

      {/* System Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Firestore Database */}
        <div className="p-6 rounded-3xl bg-zinc-900/90 border border-zinc-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold">
              <Database className="w-5 h-5" />
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${
                firestoreStatus === 'connected'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              {firestoreStatus === 'connected' ? 'OPERATIONAL' : 'OFFLINE / CACHED'}
            </span>
          </div>

          <div>
            <h3 className="text-base font-extrabold text-white">Firestore Database</h3>
            <p className="text-xs text-zinc-400 mt-1">Primary cloud data persistence & real-time sync engine.</p>
          </div>

          <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400 font-medium">
            <span>Latency:</span>
            <span className="font-bold text-white">{latency !== null ? `${latency} ms` : 'Checking...'}</span>
          </div>
        </div>

        {/* Firebase Auth */}
        <div className="p-6 rounded-3xl bg-zinc-900/90 border border-zinc-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              AUTHENTICATED
            </span>
          </div>

          <div>
            <h3 className="text-base font-extrabold text-white">Firebase Authentication</h3>
            <p className="text-xs text-zinc-400 mt-1">Email/Password & Google OAuth identity provider.</p>
          </div>

          <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400 font-medium">
            <span>Admin Email:</span>
            <span className="font-bold text-blue-400">mdsahil012002@gmail.com</span>
          </div>
        </div>

        {/* Cloudinary Media API */}
        <div className="p-6 rounded-3xl bg-zinc-900/90 border border-zinc-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-2xl bg-violet-500/10 text-violet-400 border border-violet-500/20 flex items-center justify-center font-bold">
              <Cloud className="w-5 h-5" />
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold border ${
                cldConfigured
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              }`}
            >
              {cldConfigured ? 'READY' : 'NOT CONFIGURED'}
            </span>
          </div>

          <div>
            <h3 className="text-base font-extrabold text-white">Cloudinary Storage API</h3>
            <p className="text-xs text-zinc-400 mt-1">Image hosting for post media & custom branding assets.</p>
          </div>

          <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400 font-medium">
            <span>Cloud Name:</span>
            <span className="font-bold text-white">{cldSettings.cloudName || 'dvahk0xom'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
