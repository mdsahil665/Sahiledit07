import React, { useState, useEffect } from 'react';
import {
  Cloud,
  Save,
  CheckCircle2,
  AlertCircle,
  Upload,
  Image as ImageIcon,
  Copy,
  ExternalLink,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { CloudinarySettings } from '../../types';
import { promptStore } from '../../services/promptStore';
import { useToast } from '../Toast';

export const CloudinaryAdminSection: React.FC = () => {
  const [settings, setSettings] = useState<CloudinarySettings>(() => promptStore.getCloudinarySettings());
  const [isSaving, setIsSaving] = useState(false);
  const [isTestingUpload, setIsTestingUpload] = useState(false);
  const [testResultUrl, setTestResultUrl] = useState<string | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    const unsub = promptStore.subscribe(() => {
      setSettings(promptStore.getCloudinarySettings());
    });
    return unsub;
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await promptStore.updateCloudinarySettings(settings);
      showToast('✓ Cloudinary Settings Saved', 'Media upload preset configuration updated.');
    } catch (e) {
      showToast('Save Error', 'Failed to save Cloudinary settings.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsTestingUpload(true);
    setTestResultUrl(null);
    try {
      const res = await promptStore.uploadToCloudinary(file);
      if (res.success && res.url) {
        setTestResultUrl(res.url);
        showToast('✓ Test Upload Successful', 'Image uploaded to Cloudinary CDN successfully!', 'success');
      } else {
        showToast('Test Upload Failed', res.error || 'Upload could not complete', 'error');
      }
    } catch (err: any) {
      showToast('Upload Error', err.message || 'Network error during test upload', 'error');
    } finally {
      setIsTestingUpload(false);
    }
  };

  const isConfigured = Boolean(settings.cloudName && settings.uploadPreset);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Cloud className="w-5 h-5 text-sky-400" />
            <span>Cloudinary Media API & CDN Storage</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Configure your cloud image storage for prompt cover photos, gallery uploads, and branding assets.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="px-5 py-2.5 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-lg shadow-sky-600/20 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'Saving...' : 'Save Cloudinary Settings'}</span>
        </button>
      </div>

      {/* Connection Status Card */}
      <div className="p-5 rounded-3xl bg-zinc-900 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm ${
            isConfigured ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
          }`}>
            <Cloud className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Cloudinary CDN Integration Status</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                isConfigured ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              }`}>
                {isConfigured ? 'CONFIGURED & READY' : 'SETUP REQUIRED'}
              </span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Current Cloud: <span className="font-mono text-white font-semibold">{settings.cloudName || 'Not configured'}</span> · Preset: <span className="font-mono text-white font-semibold">{settings.uploadPreset || 'Not configured'}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Security Architecture Callout */}
      <div className="p-4 sm:p-5 rounded-3xl bg-blue-500/10 border border-blue-500/20 flex items-start gap-4">
        <div className="w-10 h-10 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-blue-200">Zero-Secret Public Architecture</h4>
          <p className="text-xs text-blue-100/80 leading-relaxed">
            For browser security, this system uses Cloudinary's <strong>Unsigned Upload Presets</strong>. 
            Your private API Secret is never exposed to visitors or stored in frontend code. 
            All uploads run securely directly to your Cloudinary cloud.
          </p>
        </div>
      </div>

      {/* Settings & Test Upload Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Settings Form */}
        <div className="bg-zinc-900/90 rounded-3xl border border-zinc-800 p-6 space-y-5">
          <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
            Cloudinary API Credentials
          </h3>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300">Cloud Name</label>
              <input
                type="text"
                value={settings.cloudName || ''}
                onChange={(e) => setSettings({ ...settings, cloudName: e.target.value })}
                placeholder="dvahk0xom"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-sky-500"
              />
              <p className="text-[11px] text-zinc-500">Your unique Cloudinary cloud identifier.</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300">Upload Preset Name (Unsigned)</label>
              <input
                type="text"
                value={settings.uploadPreset || ''}
                onChange={(e) => setSettings({ ...settings, uploadPreset: e.target.value })}
                placeholder="sahil_logo"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-sky-500"
              />
              <p className="text-[11px] text-zinc-500">Must be configured as "Unsigned" in Cloudinary Console &gt; Settings &gt; Upload.</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300">Default Storage Folder (Optional)</label>
              <input
                type="text"
                value={settings.folder || ''}
                onChange={(e) => setSettings({ ...settings, folder: e.target.value })}
                placeholder="prompts"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>
        </div>

        {/* Test Image Upload Card */}
        <div className="bg-zinc-900/90 rounded-3xl border border-zinc-800 p-6 space-y-5 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
              <Upload className="w-4 h-4 text-sky-400" />
              <span>Verify & Test Upload</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              Select a test image from your device to verify that your Cloudinary credentials and preset work live.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-zinc-950 border border-dashed border-zinc-800 text-center space-y-3">
            {isTestingUpload ? (
              <div className="py-6 space-y-2">
                <Loader2 className="w-8 h-8 text-sky-400 animate-spin mx-auto" />
                <p className="text-xs font-bold text-zinc-300">Uploading test asset to Cloudinary...</p>
              </div>
            ) : testResultUrl ? (
              <div className="space-y-3">
                <img
                  src={testResultUrl}
                  alt="Upload preview"
                  className="w-full h-36 object-cover rounded-xl border border-zinc-800"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={testResultUrl}
                    className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-[11px] font-mono text-zinc-300 truncate"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(testResultUrl);
                      showToast('Copied URL', 'Direct image URL copied to clipboard.');
                    }}
                    className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
                    title="Copy URL"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-6 space-y-3">
                <ImageIcon className="w-10 h-10 text-zinc-600 mx-auto" />
                <p className="text-xs text-zinc-400">Click below to upload a sample photo.</p>
                <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold cursor-pointer transition-all">
                  <Upload className="w-4 h-4" />
                  <span>Choose Test Image</span>
                  <input type="file" accept="image/*" onChange={handleTestUpload} className="hidden" />
                </label>
              </div>
            )}
          </div>

          <div className="text-[11px] text-zinc-500">
            Uploaded test images will immediately show in your Cloudinary Media Library dashboard.
          </div>
        </div>
      </div>
    </div>
  );
};
