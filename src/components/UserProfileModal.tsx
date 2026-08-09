import React, { useState, useRef } from 'react';
import { User, Mail, ShieldCheck, Heart, LogOut, X, Copy, Check, Sparkles, Camera, Loader2, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { promptStore } from '../services/promptStore';
import { PromptPost } from '../types';
import { useToast } from './Toast';
import { compressImage, uploadUserProfilePhoto } from '../services/storageService';
import { updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

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
  const { currentUser, isAdmin, favorites, logout, toggleFavorite } = useAuth();
  const { showToast } = useToast();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState<boolean>(false);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

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
      const photoUrl = await uploadUserProfilePhoto(currentUser.uid, compressedBlob, file.name);

      // Update Firebase Auth user profile
      await updateProfile(currentUser, { photoURL: photoUrl });

      // Save URL to users/{uid} document in Firestore
      await setDoc(doc(db, 'users', currentUser.uid), { photoURL: photoUrl, updatedAt: new Date().toISOString() }, { merge: true });

      showToast('Profile Photo Updated!', 'Your new avatar is saved.', 'success');
    } catch (err: any) {
      console.error('Error uploading profile photo:', err);
      showToast('Photo Upload Failed', err?.message || 'Could not update profile photo.', 'error');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const allPosts = promptStore.getPosts();
  const favoritePosts = allPosts.filter((p) => favorites.includes(p.id));

  const handleCopy = (post: PromptPost, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(post.fullPrompt);
    promptStore.incrementCopies(post.id);
    setCopiedId(post.id);
    showToast('Copied to Clipboard!', 'Prompt ready to paste.');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleLogout = async () => {
    await logout();
    showToast('Logged Out', 'You have been signed out safely.');
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0"
          onClick={onClose}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-lg p-6 sm:p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl z-10 space-y-6 max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-3">
              <div
                onClick={() => !uploadingPhoto && avatarInputRef.current?.click()}
                className="relative group cursor-pointer w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-lg font-bold shadow-md shadow-blue-500/20 overflow-hidden border border-white/20"
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
                  <Loader2 className="w-6 h-6 animate-spin text-white" />
                ) : currentUser?.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt="Avatar"
                    className="w-full h-full object-cover rounded-2xl group-hover:opacity-75 transition-opacity"
                  />
                ) : (
                  <span>
                    {(currentUser?.displayName || currentUser?.email || 'U').charAt(0).toUpperCase()}
                  </span>
                )}

                {/* Overlay Camera Badge */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <Camera className="w-5 h-5 text-white" />
                </div>
              </div>

              <div>
                <h3 className="font-bold text-base text-zinc-900 dark:text-white flex items-center gap-2">
                  <span>{currentUser?.displayName || currentUser?.email?.split('@')[0] || 'User Profile'}</span>
                  {isAdmin && (
                    <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-[10px] font-bold uppercase">
                      Admin
                    </span>
                  )}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1 mt-0.5">
                  <Mail className="w-3 h-3" />
                  <span>{currentUser?.email || 'Authenticated Account'}</span>
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {isAdmin && onOpenAdminDashboard && (
              <button
                onClick={() => {
                  onClose();
                  onOpenAdminDashboard();
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 transition-all"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Admin Dashboard</span>
              </button>
            )}

            <button
              onClick={handleLogout}
              className="py-2.5 px-4 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold text-xs flex items-center justify-center gap-2 border border-rose-500/20 transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>

          {/* My Favorites Section */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
              <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
              <span>My Saved Favorites ({favoritePosts.length})</span>
            </h4>

            {favoritePosts.length === 0 ? (
              <div className="p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 text-center space-y-2">
                <Sparkles className="w-6 h-6 text-zinc-400 mx-auto" />
                <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                  No saved prompts yet
                </p>
                <p className="text-[11px] text-zinc-400">
                  Click the heart icon on any prompt card to save it to your personal favorites library!
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {favoritePosts.map((post) => (
                  <div
                    key={post.id}
                    onClick={() => {
                      onClose();
                      onOpenPrompt(post);
                    }}
                    className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 hover:border-blue-500/50 cursor-pointer transition-all flex items-center justify-between gap-3 group"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-xs text-zinc-900 dark:text-white truncate">
                        {post.title}
                      </p>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                        {post.shortDescription || post.fullPrompt}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={(e) => handleCopy(post, e)}
                        className="p-1.5 rounded-lg bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:text-blue-500 transition-colors border border-zinc-200 dark:border-zinc-700"
                      >
                        {copiedId === post.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(post.id);
                        }}
                        className="p-1.5 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-colors"
                      >
                        <Heart className="w-3.5 h-3.5 fill-rose-500" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
