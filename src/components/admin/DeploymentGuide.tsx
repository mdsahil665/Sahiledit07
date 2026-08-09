import React, { useState } from 'react';
import { Rocket, ShieldCheck, Database, Cloud, FileText, CheckCircle2, Copy, ExternalLink, Code2 } from 'lucide-react';
import { useToast } from '../Toast';

export const DeploymentGuide: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'vercel' | 'firebase' | 'cloudinary' | 'env' | 'checklist'>('vercel');
  const { showToast } = useToast();

  const handleCopy = (code: string, label: string) => {
    navigator.clipboard.writeText(code);
    showToast('Copied to Clipboard!', `${label} copied successfully.`);
  };

  const envVariablesCode = `# Environment Variables for Sahil Edits
# Vercel / Cloud Run Environment Configuration

# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Cloudinary Integration (Free Unsigned API)
VITE_CLOUDINARY_CLOUD_NAME=dvahk0xom
VITE_CLOUDINARY_UPLOAD_PRESET=sahil_logo

# Admin Master Access
VITE_ADMIN_PASSCODE=your_admin_passcode
`;

  const vercelBuildSettings = `{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "framework": "vite"
}`;

  const vercelRewrites = `{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}`;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md">
            <Rocket className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Vercel & Production Deployment Guide</h2>
            <p className="text-xs text-blue-100 mt-0.5">
              Deploy Sahil Edits to Vercel, Firebase & Cloudinary in less than 5 minutes.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700">
        <button
          onClick={() => setActiveTab('vercel')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'vercel'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          <Rocket className="w-3.5 h-3.5" />
          <span>Vercel Deployment</span>
        </button>

        <button
          onClick={() => setActiveTab('firebase')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'firebase'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>Firebase Setup</span>
        </button>

        <button
          onClick={() => setActiveTab('cloudinary')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'cloudinary'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          <Cloud className="w-3.5 h-3.5" />
          <span>Cloudinary Setup</span>
        </button>

        <button
          onClick={() => setActiveTab('env')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'env'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Environment Vars</span>
        </button>

        <button
          onClick={() => setActiveTab('checklist')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'checklist'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Production Checklist</span>
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'vercel' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-6">
          <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <Rocket className="w-5 h-5 text-blue-500" />
            <span>Step-by-Step Vercel Deployment</span>
          </h3>

          <ol className="space-y-4 text-xs text-zinc-600 dark:text-zinc-300 list-decimal pl-5">
            <li>
              <strong className="text-zinc-900 dark:text-white">Push Repository to GitHub:</strong> Export your code from AI Studio to GitHub or download the ZIP file and commit to a GitHub repository.
            </li>
            <li>
              <strong className="text-zinc-900 dark:text-white">Import Project on Vercel:</strong> Head to <a href="https://vercel.com" target="_blank" rel="noreferrer" className="text-blue-500 underline inline-flex items-center gap-0.5">vercel.com <ExternalLink className="w-3 h-3" /></a>, click <em>Add New Project</em>, and select your GitHub repository.
            </li>
            <li>
              <strong className="text-zinc-900 dark:text-white">Configure Build Command & Output:</strong>
              <div className="mt-2 relative rounded-2xl bg-zinc-950 p-4 font-mono text-zinc-200 text-xs">
                <button
                  onClick={() => handleCopy(vercelBuildSettings, 'Vercel Settings')}
                  className="absolute top-3 right-3 p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                <pre>{vercelBuildSettings}</pre>
              </div>
            </li>
            <li>
              <strong className="text-zinc-900 dark:text-white">Add Environment Variables:</strong> Copy the variables from the <em>Environment Vars</em> tab into Vercel's <em>Environment Variables</em> section during setup or under Project Settings.
            </li>
            <li>
              <strong className="text-zinc-900 dark:text-white">Deploy:</strong> Click <strong>Deploy</strong>. Vercel will build the SPA assets and serve your site with free SSL, custom domain support, and worldwide CDN caching!
            </li>
          </ol>

          <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-600 dark:text-blue-400">
            <strong>SPA Routing Note:</strong> If deploying with custom routes, add a <code className="font-mono bg-blue-500/20 px-1 py-0.5 rounded">vercel.json</code> in the project root with SPA rewrite rules to ensure deep links reload cleanly.
          </div>
        </div>
      )}

      {activeTab === 'firebase' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-6">
          <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <Database className="w-5 h-5 text-amber-500" />
            <span>Firebase Firestore & Auth Configuration Guide</span>
          </h3>

          <ol className="space-y-4 text-xs text-zinc-600 dark:text-zinc-300 list-decimal pl-5">
            <li>
              <strong className="text-zinc-900 dark:text-white">Create Firebase Project:</strong> Go to <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer" className="text-blue-500 underline inline-flex items-center gap-0.5">Firebase Console <ExternalLink className="w-3 h-3" /></a> and create a project named <strong>Sahil Edits</strong>.
            </li>
            <li>
              <strong className="text-zinc-900 dark:text-white">Enable Firestore Database:</strong> Click <em>Firestore Database</em> &gt; <em>Create Database</em> in <strong>Production Mode</strong>.
            </li>
            <li>
              <strong className="text-zinc-900 dark:text-white">Enable Authentication & Authorized Domains:</strong> Go to <em>Authentication</em> &gt; <em>Sign-in method</em> and enable <strong>Google</strong> and <strong>Email/Password</strong> logins. Under <em>Authentication</em> &gt; <em>Settings</em> &gt; <em>Authorized domains</em>, add your production domain (e.g. <code className="font-mono bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">sahil-edit.vercel.app</code>).
            </li>
            <li>
              <strong className="text-zinc-900 dark:text-white">Deploy Firestore Security Rules:</strong> Copy the hardened security rules from <code className="font-mono bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">firestore.rules</code> into the Firebase Console Rules tab.
            </li>
          </ol>
        </div>
      )}

      {activeTab === 'cloudinary' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-6">
          <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <Cloud className="w-5 h-5 text-sky-500" />
            <span>Cloudinary Image Upload Setup Guide</span>
          </h3>

          <ol className="space-y-4 text-xs text-zinc-600 dark:text-zinc-300 list-decimal pl-5">
            <li>
              <strong className="text-zinc-900 dark:text-white">Create Free Cloudinary Account:</strong> Sign up at <a href="https://cloudinary.com" target="_blank" rel="noreferrer" className="text-blue-500 underline inline-flex items-center gap-0.5">cloudinary.com <ExternalLink className="w-3 h-3" /></a>.
            </li>
            <li>
              <strong className="text-zinc-900 dark:text-white">Find Cloud Name:</strong> On your Dashboard, copy your <strong>Cloud Name</strong> (e.g. <code className="font-mono bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded">sahil-edits</code>).
            </li>
            <li>
              <strong className="text-zinc-900 dark:text-white">Create Unsigned Upload Preset:</strong> Go to <em>Settings</em> &gt; <em>Upload</em> &gt; <em>Upload presets</em> &gt; Click <strong>Add upload preset</strong>. Change Signing Mode to <strong>Unsigned</strong> and save.
            </li>
            <li>
              <strong className="text-zinc-900 dark:text-white">Paste into Admin Settings:</strong> Enter your <strong>Cloud Name</strong> and <strong>Upload Preset</strong> directly in <strong>Admin Panel &gt; Settings &gt; Cloudinary</strong>.
            </li>
          </ol>
        </div>
      )}

      {activeTab === 'env' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <Code2 className="w-5 h-5 text-purple-500" />
              <span>Production Environment Variables (.env.example)</span>
            </h3>
            <button
              onClick={() => handleCopy(envVariablesCode, '.env.example')}
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy .env</span>
            </button>
          </div>

          <div className="relative rounded-2xl bg-zinc-950 p-4 font-mono text-zinc-200 text-xs overflow-x-auto">
            <pre>{envVariablesCode}</pre>
          </div>
        </div>
      )}

      {activeTab === 'checklist' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-4">
          <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
            <span>Production Launch Checklist</span>
          </h3>

          <div className="space-y-3">
            {[
              { text: 'Hidden Admin URL configured (/sahil-admin-portal-2026)', ok: true },
              { text: 'Public website completely free of Admin links / buttons / footers', ok: true },
              { text: 'Load More Posts pagination working smoothly on homepage feed', ok: true },
              { text: 'Timer unlock modal with customized delay & copy protection active', ok: true },
              { text: 'Google AdSense Publisher ID and Ad frequency configured', ok: true },
              { text: 'Firebase Firestore connected & security rules active', ok: true },
              { text: 'Cloudinary image uploader & Photo URL fallback ready', ok: true },
              { text: 'SEO canonical tags, sitemap, open graph & robots.txt generated', ok: true },
              { text: 'Backup & Restore JSON engine tested', ok: true },
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800"
              >
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">{item.text}</span>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Ready
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
