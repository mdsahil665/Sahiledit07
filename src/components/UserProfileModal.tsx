import React, { useState, useRef, useEffect } from 'react';
import {
  User as UserIcon,
  Mail,
  ShieldCheck,
  Heart,
  LogOut,
  X,
  Copy,
  Check,
  Sparkles,
  Camera,
  Loader2,
  Trash2,
  Save,
  Key,
  BadgeCheck,
  Crown,
  Calendar,
  Search,
  Sliders,
  Sun,
  Moon,
  ExternalLink,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { promptStore } from '../services/promptStore';
import { PromptPost } from '../types';
import { useToast } from './Toast';
import { compressImage, uploadUserProfilePhoto } from '../services/storageService';
import { updateProfile, sendPasswordResetEmail } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { useTheme } from '../context/ThemeContext';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPrompt: (post: PromptPost) => void;
  onOpenAdminDashboard?: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  onOpenPrompt,
  onOpenAdminDashboard,
}) => {
  const { currentUser, isAdmin, isPremium, favorites, logout, toggleFavorite } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'profile' | 'favorites' | 'settings'>('profile');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedUid, setCopiedUid] = useState<boolean>(false);
  const [uploadingPhoto, setUploadingPhoto] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const [displayName, setDisplayName] = useState<string>('');
  const [bio, setBio] = useState<string>('');
  const [favoriteSearch, setFavoriteSearch] = useState<string>('');

  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (currentUser) {
      setDisplayName(currentUser.displayName || currentUser.email?.split('@')[0] || '');
      const userRef = doc(db, 'users', currentUser.uid);
      getDoc(userRef)
        .then((snap) => {
          if (snap.exists()) {
            const data = snap.data();
            if (data?.bio) setBio(data.bio);
            if (data?.displayName) setDisplayName(data.displayName);
          }
        })
        .catch((err) => console.warn('Fetch profile doc warning:', err));
    }
  }, [currentUser, isOpen]);

  if (!isOpen) return null;

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;

    if (file.size > 10 * 1024 * 1024) {
      showToast('File Too Large', 'Profile photo must be less than 10MB.', 'error');
      return;
    }

    setUploadingPhoto(true);
    try {
      const compressedBlob = await compressImage(file, 400, 400, 0.9);
      let photoUrl = '';
      try {
        photoUrl = await uploadUserProfilePhoto(currentUser.uid, compressedBlob, file.name);
      } catch (cldErr) {
        // Fallback convert to Data URL
        photoUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(compressedBlob);
        });
      }

      await updateProfile(currentUser, { photoURL: photoUrl });
      await setDoc(doc(db, 'users', currentUser.uid), { photoURL: photoUrl, updatedAt: new Date().toISOString() }, { merge: true });

      showToast('Profile Photo Updated!', 'Your new avatar is live.', 'success');
    } catch (err: any) {
      console.error('Error uploading profile photo:', err);
      showToast('Photo Upload Failed', err?.message || 'Could not update profile photo.', 'error');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (!currentUser) return;
    setUploadingPhoto(true);
    try {
      await updateProfile(currentUser, { photoURL: '' });
      await setDoc(doc(db, 'users', currentUser.uid), { photoURL: '', updatedAt: new Date().toISOString() }, { merge: true });
      showToast('Photo Removed', 'Default avatar restored.', 'info');
    } catch (err: any) {
      showToast('Action Failed', err?.message || 'Could not remove photo.', 'error');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setIsSaving(true);
    try {
      const trimmedName = displayName.trim() || currentUser.email?.split('@')[0] || 'User';

      await updateProfile(currentUser, {
        displayName: trimmedName,
      });

      await setDoc(
        doc(db, 'users', currentUser.uid),
        {
          uid: currentUser.uid,
          email: currentUser.email || '',
          displayName: trimmedName,
          bio: bio.trim(),
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      showToast('Profile Updated!', 'Your profile details were saved successfully.', 'success');
    } catch (err: any) {
      console.error('Error updating profile:', err);
      showToast('Update Failed', err?.message || 'Could not save profile details.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetPassword = async () => {
    if (!currentUser?.email) return;
    try {
      await sendPasswordResetEmail(auth, currentUser.email);
      showToast('Reset Link Sent!', `Password reset email sent to ${currentUser.email}`, 'success');
    } catch (err: any) {
      showToast('Reset Request Failed', err?.message || 'Could not send reset email.', 'error');
    }
  };

  const handleCopyUid = () => {
    if (!currentUser?.uid) return;
    navigator.clipboard.writeText(currentUser.uid);
    setCopiedUid(true);
    showToast('UID Copied', 'User ID copied to clipboard.', 'info');
    setTimeout(() => setCopiedUid(false), 2000);
  };

  const allPosts = promptStore.getPosts();
  const favoritePosts = allPosts.filter((p) => favorites.includes(p.id));
  const filteredFavorites = favoritePosts.filter(
    (p) =>
      p.title.toLowerCase().includes(favoriteSearch.toLowerCase()) ||
      p.categoryName?.toLowerCase().includes(favoriteSearch.toLowerCase()) ||
      p.shortDescription?.toLowerCase().includes(favoriteSearch.toLowerCase())
  );

  const handleCopyPrompt = (post: PromptPost, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(post.fullPrompt);
    promptStore.incrementCopies(post.id);
    setCopiedId(post.id);
    showToast('Copied to Clipboard!', 'Prompt ready to paste.');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleLogout = async () => {
    await logout();
    showToast('Logged Out', 'Signed out safely.');
    onClose();
  };

  const createdAtDate = currentUser?.metadata?.creationTime
    ? new Date(currentUser.metadata.creationTime).toLocaleDateString(undefined, {
        month: 'short',
        year: 'numeric',
      })
    : 'Member';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0"
          onClick={onClose}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          className="relative w-full max-w-xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xl z-10 overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* Header Decorative Banner */}
          <div className="relative h-28 sm:h-32 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-4 sm:p-6 flex items-start justify-between shrink-0">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_50%)] pointer-events-none" />
            <div className="flex items-center gap-2 z-10">
              <span className="px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-[11px] font-extrabold uppercase tracking-wider flex items-center gap-1 border border-white/20">
                {isAdmin ? (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
                    <span>Admin Profile</span>
                  </>
                ) : isPremium ? (
                  <>
                    <Crown className="w-3.5 h-3.5 text-amber-300" />
                    <span>VIP Member</span>
                  </>
                ) : (
                  <>
                    <BadgeCheck className="w-3.5 h-3.5 text-blue-200" />
                    <span>Member</span>
                  </>
                )}
              </span>
            </div>

            <button
              onClick={onClose}
              type="button"
              className="z-10 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* User Profile Identity Section */}
          <div className="px-5 sm:px-8 pb-4 pt-0 relative z-10 border-b border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12 sm:-mt-14 mb-4">
              {/* Avatar Upload Container */}
              <div className="relative group">
                <div
                  onClick={() => !uploadingPhoto && avatarInputRef.current?.click()}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-2xl font-black shadow-xl shadow-blue-500/20 overflow-hidden border-4 border-white dark:border-slate-900 cursor-pointer relative"
                  title="Click to upload profile photo"
                >
                  <input
                    type="file"
                    ref={avatarInputRef}
                    onChange={handleAvatarChange}
                    accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                    className="hidden"
                  />

                  {uploadingPhoto ? (
                    <Loader2 className="w-8 h-8 animate-spin text-white" />
                  ) : currentUser?.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt="Avatar"
                      className="w-full h-full object-cover rounded-2xl group-hover:opacity-80 transition-opacity"
                    />
                  ) : (
                    <span>
                      {(currentUser?.displayName || currentUser?.email || 'U').charAt(0).toUpperCase()}
                    </span>
                  )}

                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-2xl">
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                </div>

                {/* Camera Badge Pill */}
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-blue-600 text-white shadow-md hover:scale-110 active:scale-95 transition-all border-2 border-white dark:border-slate-900 cursor-pointer"
                  title="Upload new photo"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center gap-2 pt-2 sm:pt-0">
                {isAdmin && onOpenAdminDashboard && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenAdminDashboard();
                    }}
                    className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Admin Panel</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout</span>
                </button>
              </div>
            </div>

            {/* Name, Email, Bio */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                  {currentUser?.displayName || currentUser?.email?.split('@')[0] || 'User Profile'}
                </h3>
                {isPremium && (
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[10px] font-bold uppercase flex items-center gap-1">
                    <Crown className="w-3 h-3" />
                    Pro
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 flex-wrap pt-0.5">
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-blue-500" />
                  {currentUser?.email}
                </span>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-purple-500" />
                  Joined {createdAtDate}
                </span>
              </div>

              {bio && (
                <p className="text-xs text-slate-600 dark:text-slate-300 pt-1 leading-relaxed italic">
                  "{bio}"
                </p>
              )}
            </div>

            {/* Modal Navigation Tabs */}
            <div className="flex items-center gap-2 mt-5 border-t border-slate-200/80 dark:border-slate-800 pt-3">
              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'profile'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span>Edit Profile</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('favorites')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'favorites'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                <span>Saved Prompts ({favoritePosts.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('settings')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'settings'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Settings</span>
              </button>
            </div>
          </div>

          {/* Modal Tab Contents */}
          <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
            {/* TAB 1: EDIT PROFILE */}
            {activeTab === 'profile' && (
              <form onSubmit={handleSaveProfile} className="space-y-4">
                {/* Photo Control Card */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                      <Camera className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">Profile Picture</h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        PNG, JPG or WEBP up to 10MB
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => avatarInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-all shadow-sm cursor-pointer"
                    >
                      Change Photo
                    </button>
                    {currentUser?.photoURL && (
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        className="p-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-rose-500 transition-colors cursor-pointer"
                        title="Remove photo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Form Fields */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Enter your full name or nickname..."
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Bio / Tagline (Optional)
                    </label>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      rows={2}
                      placeholder="Share a short intro or AI prompt interests..."
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none transition-all resize-none"
                    />
                  </div>

                  {/* Readonly Account Meta */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                        Account Email
                      </span>
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate block">
                        {currentUser?.email}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                          User ID (UID)
                        </span>
                        <span className="text-xs font-mono text-slate-600 dark:text-slate-400 truncate block max-w-[130px]">
                          {currentUser?.uid}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyUid}
                        className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-blue-500 transition-colors cursor-pointer"
                        title="Copy UID"
                      >
                        {copiedUid ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Saving Changes...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Save Profile Details</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* TAB 2: SAVED FAVORITES */}
            {activeTab === 'favorites' && (
              <div className="space-y-3">
                {favoritePosts.length > 0 && (
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={favoriteSearch}
                      onChange={(e) => setFavoriteSearch(e.target.value)}
                      placeholder="Search your saved prompts..."
                      className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-all"
                    />
                  </div>
                )}

                {favoritePosts.length === 0 ? (
                  <div className="p-8 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 text-center space-y-2">
                    <Sparkles className="w-7 h-7 text-blue-500 mx-auto" />
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      No saved prompts yet
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                      Click the heart icon on any prompt card in the library to save prompts to your personal collection!
                    </p>
                  </div>
                ) : filteredFavorites.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400">
                    No saved prompts matching "{favoriteSearch}".
                  </div>
                ) : (
                  <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                    {filteredFavorites.map((post) => (
                      <div
                        key={post.id}
                        onClick={() => {
                          onClose();
                          onOpenPrompt(post);
                        }}
                        className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 hover:border-blue-500/50 cursor-pointer transition-all flex items-center justify-between gap-3 group"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                              {post.categoryName || 'Prompt'}
                            </span>
                            <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {post.title}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            {post.shortDescription || post.fullPrompt}
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => handleCopyPrompt(post, e)}
                            className="p-2 rounded-xl bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-blue-500 transition-colors border border-slate-200/80 dark:border-slate-700 cursor-pointer"
                            title="Copy prompt text"
                          >
                            {copiedId === post.id ? (
                              <Check className="w-4 h-4 text-emerald-500" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(post.id);
                            }}
                            className="p-2 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-colors cursor-pointer"
                            title="Remove from favorites"
                          >
                            <Heart className="w-4 h-4 fill-rose-500" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: ACCOUNT SETTINGS */}
            {activeTab === 'settings' && (
              <div className="space-y-4">
                {/* Theme Preference */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                      {theme === 'dark' ? (
                        <Moon className="w-5 h-5 text-amber-400" />
                      ) : (
                        <Sun className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">Theme Preference</h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Current theme: <span className="font-bold capitalize">{theme} Mode</span>
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={toggleTheme}
                    className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white font-bold text-xs hover:bg-blue-600 hover:text-white transition-all cursor-pointer"
                  >
                    Toggle Theme
                  </button>
                </div>

                {/* Password Reset */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                      <Key className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">Password Security</h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Send a password reset link to your email
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleResetPassword}
                    className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white font-bold text-xs hover:bg-purple-600 hover:text-white transition-all cursor-pointer"
                  >
                    Reset Link
                  </button>
                </div>

                {/* Sign Out Card */}
                <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/20 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                      <LogOut className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">Sign Out Account</h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Safely log out of your session on this browser
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-all shadow-sm cursor-pointer"
                  >
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
