import React, { useState, useRef, useCallback, useEffect } from 'react';
import Cropper, { Area, Point } from 'react-easy-crop';
import {
  Upload,
  RotateCcw,
  Trash2,
  CheckCircle2,
  Loader2,
  Sparkles,
  Crop,
  ZoomIn,
  ZoomOut,
  Save,
  Grid,
  ShieldCheck,
  X,
  Cloud,
  Key,
  Settings,
  RotateCw,
  Maximize2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLogo } from '../../context/LogoContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../Toast';
import { uploadSiteLogo } from '../../services/storageService';
import { promptStore } from '../../services/promptStore';
import { getCroppedImg, PixelCrop } from '../../utils/cropImage';

// Preset default icons/gallery logos for fast selection
const GALLERY_PRESETS = [
  {
    id: 'gradient-sparkles',
    name: 'Sparkles Gradient',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'neon-cyber',
    name: 'Neon Cyber Badge',
    url: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'abstract-crystal',
    name: 'Abstract Crystal',
    url: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'purple-orb',
    name: 'Purple Cosmic Orb',
    url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=400&q=80',
  },
];

export const LogoManager: React.FC = () => {
  const { logoUrl, saveLogo, restoreDefaultLogo, deleteLogo } = useLogo();
  const { isAdmin } = useAuth();
  const { showToast } = useToast();

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // States
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'upload' | 'gallery'>('upload');
  const [showConfig, setShowConfig] = useState<boolean>(false);

  // Cloudinary Config state
  const initialCldSettings = promptStore.getCloudinarySettings();
  const [cloudNameInput, setCloudNameInput] = useState<string>(initialCldSettings.cloudName || 'dvahk0xom');
  const [uploadPresetInput, setUploadPresetInput] = useState<string>(initialCldSettings.uploadPreset || 'sahil_logo');

  // Professional Cropper States
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [cropZoom, setCropZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<PixelCrop | null>(null);
  const [cropAspectMode, setCropAspectMode] = useState<'square' | 'rounded' | 'circle'>('rounded');
  const [livePreviewDataUrl, setLivePreviewDataUrl] = useState<string | null>(null);

  // Reset Cropper state
  const handleResetCrop = useCallback(() => {
    setCrop({ x: 0, y: 0 });
    setCropZoom(1);
    setRotation(0);
  }, []);

  // Save Cloudinary credentials
  const handleSaveCloudinaryConfig = async () => {
    if (!isAdmin) {
      showToast('Admin Privilege Required', 'Only authenticated Admins can update Cloudinary settings.', 'error');
      return;
    }

    try {
      await promptStore.updateCloudinarySettings({
        cloudName: cloudNameInput.trim(),
        uploadPreset: uploadPresetInput.trim(),
      });
      showToast('Cloudinary Config Saved!', 'Unsigned API settings updated.', 'success');
      setShowConfig(false);
    } catch (err: any) {
      showToast('Config Error', err?.message || 'Could not update Cloudinary settings', 'error');
    }
  };

  // Handle image selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 1. Validate File Size (Max 10MB)
    const maxSizeBytes = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSizeBytes) {
      showToast('File Too Large', 'Maximum allowed image size is 10MB.', 'error');
      return;
    }

    // 2. Validate Allowed Image Formats (PNG, JPG, JPEG, WEBP, SVG)
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      showToast(
        'Invalid File Type',
        'Only PNG, JPG, JPEG, WEBP, and SVG files are allowed.',
        'error'
      );
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    handleResetCrop();
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const dt = new DataTransfer();
      dt.items.add(file);
      if (fileInputRef.current) {
        fileInputRef.current.files = dt.files;
        handleFileChange({ target: { files: dt.files } } as any);
      }
    }
  };

  // Crop Complete Callback from react-easy-crop
  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  // Update real-time live preview thumbnail as crop parameters adjust
  useEffect(() => {
    if (!previewUrl || !croppedAreaPixels) {
      setLivePreviewDataUrl(null);
      return;
    }

    let isCancelled = false;
    const updatePreview = async () => {
      try {
        const croppedBlob = await getCroppedImg(
          previewUrl,
          croppedAreaPixels,
          rotation,
          cropAspectMode === 'circle' ? 'round' : 'rect',
          'image/png'
        );
        if (!isCancelled) {
          const url = URL.createObjectURL(croppedBlob);
          setLivePreviewDataUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return url;
          });
        }
      } catch (err) {
        // Suppress transient crop calculation errors during dragging
      }
    };

    const timer = setTimeout(updatePreview, 120);
    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [previewUrl, croppedAreaPixels, rotation, cropAspectMode]);

  // Upload and Save Logo to Cloudinary + Firestore settings/site
  const handleSaveLogo = async () => {
    if (!isAdmin) {
      showToast('Admin Privilege Required', 'Only Admins can modify the site logo.', 'error');
      return;
    }

    if (!selectedFile && !previewUrl) {
      showToast('No Logo Selected', 'Please choose or upload a logo first.', 'error');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      let finalUrl = previewUrl || '';

      if (selectedFile && previewUrl && croppedAreaPixels) {
        setUploadProgress(15);
        
        // 1. Generate high-quality cropped Blob directly from canvas
        const croppedBlob = await getCroppedImg(
          previewUrl,
          croppedAreaPixels,
          rotation,
          cropAspectMode === 'circle' ? 'round' : 'rect',
          'image/png'
        );

        setUploadProgress(35);

        // 2. Direct Unsigned Upload of cropped Blob to Cloudinary Free CDN
        finalUrl = await uploadSiteLogo(croppedBlob, selectedFile.name || 'logo.png', (prog) => {
          setUploadProgress(35 + Math.round(prog * 0.55));
        });
      }

      setUploadProgress(95);

      // 3. Save URL to Firestore document `settings/site`
      await saveLogo(finalUrl);

      setUploadProgress(100);
      showToast('Logo Saved & Published!', 'Cropped Cloudinary logo stored in Firestore settings/site.', 'success');

      // Clear local upload state
      setSelectedFile(null);
      setPreviewUrl(null);
      if (livePreviewDataUrl) {
        URL.revokeObjectURL(livePreviewDataUrl);
        setLivePreviewDataUrl(null);
      }
    } catch (err: any) {
      console.error('Logo upload error:', err);
      showToast('Upload Failed', err?.message || 'Error uploading cropped logo to Cloudinary.', 'error');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // Select preset from gallery
  const handleSelectPreset = async (presetUrl: string) => {
    if (!isAdmin) {
      showToast('Admin Privilege Required', 'Only Admins can change site branding.', 'error');
      return;
    }

    setUploading(true);
    try {
      await saveLogo(presetUrl);
      showToast('Gallery Logo Selected!', 'Site logo updated in Firestore settings/site.', 'success');
      setPreviewUrl(null);
      setSelectedFile(null);
      setLivePreviewDataUrl(null);
    } catch (err: any) {
      showToast('Failed to Select Logo', err?.message || 'Error saving gallery logo.', 'error');
    } finally {
      setUploading(false);
    }
  };

  // Delete current logo
  const handleDeleteCurrentLogo = async () => {
    if (!isAdmin) {
      showToast('Admin Privilege Required', 'Only Admins can delete the site logo.', 'error');
      return;
    }

    if (!logoUrl) {
      showToast('No Custom Logo', 'Site is already using default branding icon.', 'info');
      return;
    }

    setUploading(true);
    try {
      await deleteLogo();
      showToast('Logo Deleted', 'Restored default site branding in Firestore settings/site.', 'success');
      setPreviewUrl(null);
      setSelectedFile(null);
      setLivePreviewDataUrl(null);
    } catch (err: any) {
      showToast('Error Deleting Logo', err?.message || 'Could not delete logo.', 'error');
    } finally {
      setUploading(false);
    }
  };

  // Restore default logo
  const handleRestoreDefault = async () => {
    if (!isAdmin) {
      showToast('Admin Privilege Required', 'Only Admins can restore default logo.', 'error');
      return;
    }

    setUploading(true);
    try {
      await restoreDefaultLogo();
      showToast('Default Logo Restored', 'The original Sparkles logo icon is active.', 'success');
      setPreviewUrl(null);
      setSelectedFile(null);
      setLivePreviewDataUrl(null);
    } catch (err: any) {
      showToast('Error Restoring Logo', err?.message || 'Could not restore default logo.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const activeDisplayLogo = livePreviewDataUrl || previewUrl || logoUrl;

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Top Banner & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-purple-900/40 border border-blue-500/20 backdrop-blur-xl shadow-xl">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider">
            <Cloud className="w-3.5 h-3.5" />
            <span>Cloudinary Free Engine</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Logo &amp; Brand Management
          </h2>
          <p className="text-xs sm:text-sm text-zinc-300 max-w-xl">
            Upload custom logos directly to Cloudinary Free using Unsigned Upload API. Saves secure_url to Firestore <code className="bg-blue-950/80 px-1.5 py-0.5 rounded text-blue-200">settings/site</code> for instant site-wide syncing.
          </p>
        </div>

        {/* Live Logo Status Pill & Config Toggle */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="p-3 rounded-2xl bg-zinc-900/80 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors flex items-center gap-2 text-xs font-bold cursor-pointer"
            title="Configure Cloudinary API Keys"
          >
            <Settings className="w-4 h-4 text-blue-400" />
            <span className="hidden sm:inline">Settings</span>
          </button>

          <div className="flex items-center gap-3 p-3 rounded-2xl bg-zinc-900/80 border border-zinc-800">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center p-1 overflow-hidden border border-white/20 shadow-inner">
              {activeDisplayLogo ? (
                <img src={activeDisplayLogo} alt="Live Logo" className="w-full h-full object-contain rounded-lg" />
              ) : (
                <Sparkles className="w-6 h-6 text-white" />
              )}
            </div>
            <div>
              <span className="text-[10px] uppercase font-extrabold text-zinc-400 tracking-wider block">
                Firestore Logo
              </span>
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {logoUrl ? 'Cloudinary Active' : 'Default Icon'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Cloudinary Config Drawer */}
      <AnimatePresence>
        {showConfig && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-6 rounded-3xl bg-zinc-900/90 border border-blue-500/30 shadow-2xl space-y-4 overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <Key className="w-4 h-4 text-blue-400" />
                <span>Cloudinary Unsigned Credentials</span>
              </div>
              <button
                onClick={() => setShowConfig(false)}
                className="text-xs text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-400">
              Configure your free Cloudinary account credentials. Uploads use the unsigned API endpoint without requiring secret server keys.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">
                  Cloud Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={cloudNameInput}
                  onChange={(e) => setCloudNameInput(e.target.value)}
                  placeholder="e.g. dvahk0xom"
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-semibold text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">
                  Unsigned Upload Preset <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={uploadPresetInput}
                  onChange={(e) => setUploadPresetInput(e.target.value)}
                  placeholder="e.g. sahil_logo"
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-semibold text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={handleSaveCloudinaryConfig}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
              >
                Save Cloudinary Credentials
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Grid: Left Controls & Right Real-Time Previews */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Upload & Gallery Tabs (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Sub-navigation Tabs */}
          <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-zinc-900/80 border border-zinc-800">
            <button
              onClick={() => setActiveTab('upload')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'upload'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>Upload Custom Logo</span>
            </button>
            <button
              onClick={() => setActiveTab('gallery')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'gallery'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
              }`}
            >
              <Grid className="w-4 h-4" />
              <span>Preset Gallery</span>
            </button>
          </div>

          {/* TAB 1: UPLOAD LOGO */}
          {activeTab === 'upload' && (
            <div className="p-6 sm:p-7 rounded-3xl bg-zinc-900/90 border border-zinc-800 shadow-2xl space-y-6">
              {/* Dropzone Area */}
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="relative cursor-pointer border-2 border-dashed border-zinc-700 hover:border-blue-500/80 rounded-2xl p-6 sm:p-8 text-center transition-all group bg-zinc-950/40 hover:bg-blue-500/5"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                  className="hidden"
                />

                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-blue-500/10">
                    <Upload className="w-6 h-6" />
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm font-bold text-zinc-200 group-hover:text-blue-400 transition-colors">
                      Click to upload or drag &amp; drop logo
                    </p>
                    <p className="text-xs text-zinc-400">
                      Supports <strong className="text-zinc-300">PNG, JPG, JPEG, WEBP, SVG</strong> (Max 10MB)
                    </p>
                  </div>
                </div>
              </div>

              {/* Upload Progress Bar */}
              {uploading && (
                <div className="space-y-2 p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800">
                  <div className="flex justify-between items-center text-xs font-bold text-zinc-300">
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                      Uploading Cropped Logo to Cloudinary Free CDN...
                    </span>
                    <span className="text-blue-400">{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 transition-all duration-200"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Professional Cropper & Touch Canvas Section */}
              {previewUrl && (
                <div className="p-5 rounded-2xl bg-zinc-950/90 border border-zinc-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-200 flex items-center gap-2">
                      <Crop className="w-4 h-4 text-blue-400" />
                      <span>Interactive Touch &amp; Drag Logo Cropper</span>
                    </span>
                    <button
                      onClick={() => {
                        setPreviewUrl(null);
                        setSelectedFile(null);
                        setLivePreviewDataUrl(null);
                      }}
                      className="text-xs text-rose-400 hover:text-rose-300 font-semibold cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>

                  {/* Interactive 60fps Drag & Zoom Cropper Container */}
                  <div
                    onDoubleClick={handleResetCrop}
                    className="relative w-full h-72 sm:h-80 bg-zinc-950 rounded-2xl overflow-hidden border-2 border-blue-500/40 shadow-inner touch-none cursor-grab active:cursor-grabbing group"
                    title="Drag to position, pinch or scroll to zoom, double tap to reset"
                  >
                    <Cropper
                      image={previewUrl}
                      crop={crop}
                      zoom={cropZoom}
                      rotation={rotation}
                      aspect={1}
                      cropShape={cropAspectMode === 'circle' ? 'round' : 'rect'}
                      showGrid={true}
                      onCropChange={setCrop}
                      onCropComplete={onCropComplete}
                      onZoomChange={setCropZoom}
                      onRotationChange={setRotation}
                      classes={{
                        containerClassName: 'w-full h-full',
                        cropAreaClassName:
                          cropAspectMode === 'rounded'
                            ? '!rounded-2xl !border-2 !border-blue-500 !shadow-[0_0_0_9999px_rgba(9,9,11,0.75)]'
                            : '!border-2 !border-blue-500 !shadow-[0_0_0_9999px_rgba(9,9,11,0.75)]',
                      }}
                    />

                    {/* Touch / Drag Gesture Guidance Badge */}
                    <div className="absolute top-3 left-3 pointer-events-none z-10 px-2.5 py-1 rounded-full bg-zinc-950/80 backdrop-blur-md text-[10px] font-bold text-zinc-300 border border-white/10 flex items-center gap-1.5 shadow-md">
                      <Maximize2 className="w-3 h-3 text-blue-400" />
                      <span>Drag to Pan • Pinch / Scroll to Zoom</span>
                    </div>
                  </div>

                  {/* Cropper Controls Grid */}
                  <div className="space-y-3 pt-2">
                    {/* Zoom & Rotation Sliders */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-zinc-900/80 p-4 rounded-xl border border-zinc-800">
                      {/* Zoom Control */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-bold text-zinc-300">
                          <span className="flex items-center gap-1.5 text-zinc-400">
                            <ZoomIn className="w-3.5 h-3.5 text-blue-400" />
                            Zoom Scale
                          </span>
                          <span className="font-mono text-blue-400">{Math.round(cropZoom * 100)}%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setCropZoom((z) => Math.max(1, +(z - 0.1).toFixed(2)))}
                            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors cursor-pointer"
                            title="Zoom Out"
                          >
                            <ZoomOut className="w-3.5 h-3.5" />
                          </button>
                          <input
                            type="range"
                            min={1}
                            max={3}
                            step={0.05}
                            value={cropZoom}
                            onChange={(e) => setCropZoom(parseFloat(e.target.value))}
                            className="w-full accent-blue-500 cursor-pointer h-1.5 bg-zinc-800 rounded-lg appearance-none"
                          />
                          <button
                            type="button"
                            onClick={() => setCropZoom((z) => Math.min(3, +(z + 0.1).toFixed(2)))}
                            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors cursor-pointer"
                            title="Zoom In"
                          >
                            <ZoomIn className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Rotation Control */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-bold text-zinc-300">
                          <span className="flex items-center gap-1.5 text-zinc-400">
                            <RotateCw className="w-3.5 h-3.5 text-indigo-400" />
                            Rotation Angle
                          </span>
                          <span className="font-mono text-indigo-400">{rotation}°</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min={0}
                            max={360}
                            step={1}
                            value={rotation}
                            onChange={(e) => setRotation(parseInt(e.target.value, 10))}
                            className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-zinc-800 rounded-lg appearance-none"
                          />
                          <button
                            type="button"
                            onClick={() => setRotation((r) => (r + 90) % 360)}
                            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors cursor-pointer shrink-0"
                            title="Rotate 90°"
                          >
                            <RotateCw className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Shape Selector & Reset */}
                    <div className="flex items-center justify-between gap-3 pt-1">
                      <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-xl border border-zinc-800">
                        <button
                          type="button"
                          onClick={() => setCropAspectMode('rounded')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            cropAspectMode === 'rounded' ? 'bg-blue-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          Rounded
                        </button>
                        <button
                          type="button"
                          onClick={() => setCropAspectMode('circle')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            cropAspectMode === 'circle' ? 'bg-blue-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          Circle
                        </button>
                        <button
                          type="button"
                          onClick={() => setCropAspectMode('square')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            cropAspectMode === 'square' ? 'bg-blue-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          Square
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={handleResetCrop}
                        className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Reset zoom, position and rotation"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-blue-400" />
                        <span>Reset</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  onClick={handleSaveLogo}
                  disabled={uploading || (!selectedFile && !previewUrl)}
                  className="flex-1 min-w-[180px] flex items-center justify-center gap-2 py-3 px-6 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-sm shadow-lg shadow-blue-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Uploading Cropped Logo...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Upload &amp; Save Cropped Logo</span>
                    </>
                  )}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleRestoreDefault}
                    disabled={uploading}
                    className="flex items-center gap-2 py-3 px-4 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4 text-blue-400" />
                    <span>Restore Default</span>
                  </button>

                  <button
                    onClick={handleDeleteCurrentLogo}
                    disabled={uploading || !logoUrl}
                    className="flex items-center gap-2 py-3 px-4 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold text-xs border border-rose-500/20 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Logo</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PRESET GALLERY */}
          {activeTab === 'gallery' && (
            <div className="p-6 sm:p-7 rounded-3xl bg-zinc-900/90 border border-zinc-800 shadow-2xl space-y-6">
              <div className="space-y-1">
                <h3 className="font-bold text-base text-zinc-100">Select Preset Brand Badge</h3>
                <p className="text-xs text-zinc-400">
                  Pick a pre-made vector/abstract icon to instantly set as your site logo in Firestore <code className="bg-zinc-950 px-1 py-0.5 rounded text-blue-300">settings/site</code>.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {GALLERY_PRESETS.map((preset) => {
                  const isSelected = logoUrl === preset.url;
                  return (
                    <div
                      key={preset.id}
                      onClick={() => handleSelectPreset(preset.url)}
                      className={`group cursor-pointer p-4 rounded-2xl border transition-all flex flex-col items-center gap-3 text-center ${
                        isSelected
                          ? 'bg-blue-600/20 border-blue-500 shadow-lg shadow-blue-500/20'
                          : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/40'
                      }`}
                    >
                      <div className="w-16 h-16 rounded-2xl overflow-hidden border border-white/10 group-hover:scale-105 transition-transform shadow-md">
                        <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                      </div>
                      <span className="text-xs font-bold text-zinc-200 group-hover:text-blue-400 transition-colors">
                        {preset.name}
                      </span>
                      {isSelected && (
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-500 text-white">
                          Active
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Live Multi-Component Logo Previews (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 sm:p-7 rounded-3xl bg-zinc-900/90 border border-zinc-800 shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="font-extrabold text-sm text-zinc-100 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-400" />
                <span>Live Website Component Previews</span>
              </h3>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase">
                Real-Time
              </span>
            </div>

            <p className="text-xs text-zinc-400">
              Preview how your cropped Cloudinary logo automatically renders on every component across the application in real-time:
            </p>

            {/* Preview 1: Header / Navbar */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                1. Navbar Header Preview
              </span>
              <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white overflow-hidden p-0.5 shadow-md">
                    {activeDisplayLogo ? (
                      <img src={activeDisplayLogo} alt="Header Preview" className="w-full h-full object-contain rounded-lg" />
                    ) : (
                      <Sparkles className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <span className="font-black text-base text-white">Sahil Edits</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-zinc-500">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Live
                </div>
              </div>
            </div>

            {/* Preview 2: Login Modal Branding */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                2. Login Modal Header Preview
              </span>
              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center overflow-hidden p-1 shadow-md">
                  {activeDisplayLogo ? (
                    <img src={activeDisplayLogo} alt="Login Preview" className="w-full h-full object-contain rounded-xl" />
                  ) : (
                    <Sparkles className="w-5 h-5 text-white" />
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">Welcome Back</h4>
                  <p className="text-[11px] text-zinc-500">Firebase Authentication Engine</p>
                </div>
              </div>
            </div>

            {/* Preview 3: Footer Branding */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                3. Footer Brand Preview
              </span>
              <div className="p-4 rounded-2xl bg-slate-900 border border-white/10 flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center overflow-hidden p-1 shadow-lg border border-white/20">
                  {activeDisplayLogo ? (
                    <img src={activeDisplayLogo} alt="Footer Preview" className="w-full h-full object-contain rounded-xl" />
                  ) : (
                    <Sparkles className="w-5 h-5 text-white" />
                  )}
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-white">Sahil Edits</h4>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-blue-400">
                    Premium AI Prompt Library
                  </p>
                </div>
              </div>
            </div>

            {/* Info Footer Box */}
            <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 shrink-0 text-blue-400 mt-0.5" />
              <p>
                Touch &amp; gesture enabled cropper. Generates high-quality cropped PNG directly in-browser before unsigned Cloudinary upload to Firestore <code className="bg-blue-950 px-1 py-0.5 rounded text-blue-200">settings/site</code>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
