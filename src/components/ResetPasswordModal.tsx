import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Lock,
  ArrowRight,
  X,
  AlertCircle,
  Eye,
  EyeOff,
  CheckCircle2,
  KeyRound,
  Loader2,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { verifyPasswordResetCode, confirmPasswordReset } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useToast } from './Toast';

interface ResetPasswordModalProps {
  isOpen: boolean;
  oobCode: string | null;
  onClose: () => void;
  onSuccessLogin: (email?: string) => void;
  onRequestNewLink: () => void;
}

export const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({
  isOpen,
  oobCode,
  onClose,
  onSuccessLogin,
  onRequestNewLink,
}) => {
  const [status, setStatus] = useState<'verifying' | 'ready' | 'invalid' | 'submitting' | 'success'>('verifying');
  const [userEmail, setUserEmail] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const { showToast } = useToast();

  // Verify the oobCode with Firebase when modal opens or code changes
  useEffect(() => {
    if (!isOpen) return;

    if (!oobCode) {
      setStatus('invalid');
      setErrorMessage('No password reset code found in the link. Please request a new password reset link.');
      return;
    }

    let isMounted = true;
    setStatus('verifying');
    setErrorMessage('');

    console.log('[Firebase Auth] Verifying password reset code (oobCode)...');
    verifyPasswordResetCode(auth, oobCode)
      .then((email) => {
        if (!isMounted) return;
        console.log('[Firebase Auth] Password reset code verified successfully for email:', email);
        setUserEmail(email);
        setStatus('ready');
      })
      .catch((err: any) => {
        if (!isMounted) return;
        console.error('[Firebase Auth] verifyPasswordResetCode error:', err?.code, err?.message);
        setStatus('invalid');
        const code = err?.code || '';
        if (code === 'auth/expired-action-code') {
          setErrorMessage('This password reset link has expired. Please request a new reset link.');
        } else if (code === 'auth/invalid-action-code') {
          setErrorMessage('This password reset link is invalid or has already been used. Please request a new reset link.');
        } else if (code === 'auth/user-disabled') {
          setErrorMessage('This user account has been disabled.');
        } else {
          setErrorMessage('Unable to verify this reset link. It may be invalid or expired.');
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, oobCode]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!newPassword || !confirmPassword) {
      setErrorMessage('Please enter and confirm your new password.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please verify both fields.');
      return;
    }

    if (!oobCode) {
      setErrorMessage('Missing reset code. Please request a new link.');
      return;
    }

    setStatus('submitting');
    console.log('[Firebase Auth] Confirming password reset with Firebase...');

    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      console.log('[Firebase Auth] confirmPasswordReset succeeded.');
      setStatus('success');
      showToast('Password Reset Complete', 'Your new password has been saved successfully.', 'success');
    } catch (err: any) {
      console.error('[Firebase Auth] confirmPasswordReset error:', err?.code, err?.message);
      setStatus('ready');
      const code = err?.code || '';
      if (code === 'auth/weak-password') {
        setErrorMessage('Password is too weak. Please use a stronger password with at least 6 characters.');
      } else if (code === 'auth/expired-action-code') {
        setErrorMessage('This reset code has expired. Please request a new password reset link.');
      } else if (code === 'auth/invalid-action-code') {
        setErrorMessage('This reset code is invalid or has already been used.');
      } else {
        setErrorMessage(err?.message || 'Failed to update password. Please try again.');
      }
      showToast('Reset Failed', errorMessage || 'Could not reset password.', 'error');
    }
  };

  const modalMarkup = (
    <AnimatePresence>
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 cursor-pointer"
          style={{
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(16px) saturate(140%)',
            WebkitBackdropFilter: 'blur(16px) saturate(140%)',
          }}
          onClick={status === 'submitting' ? undefined : onClose}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          className="relative w-full max-w-md my-auto max-h-[90vh] overflow-y-auto p-6 sm:p-8 rounded-[28px] bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-2xl z-10 text-center space-y-5"
        >
          {/* Close button */}
          {status !== 'submitting' && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Top Header Icon */}
          <div className="w-16 h-16 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center justify-center mx-auto shadow-sm">
            {status === 'verifying' ? (
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            ) : status === 'invalid' ? (
              <AlertCircle className="w-8 h-8 text-rose-500" />
            ) : status === 'success' ? (
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            ) : (
              <KeyRound className="w-8 h-8 text-blue-500" />
            )}
          </div>

          {/* Title & Description */}
          <div>
            <h3 className="font-black text-2xl text-zinc-900 dark:text-white tracking-tight">
              {status === 'verifying' && 'Verifying Reset Link'}
              {status === 'invalid' && 'Reset Link Expired or Invalid'}
              {status === 'ready' && 'Set New Password'}
              {status === 'submitting' && 'Saving New Password...'}
              {status === 'success' && 'Password Reset Complete!'}
            </h3>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 font-medium mt-1">
              {status === 'verifying' && 'Please wait while we verify your secure Firebase reset token...'}
              {status === 'invalid' && 'This link cannot be used to reset your password.'}
              {status === 'ready' && userEmail && (
                <span>
                  Create a new password for <span className="font-bold text-zinc-800 dark:text-zinc-200">{userEmail}</span>
                </span>
              )}
              {status === 'ready' && !userEmail && 'Enter your new account password below.'}
              {status === 'submitting' && 'Updating your credentials in Firebase Authentication...'}
              {status === 'success' && 'Your password has been changed. You can now log in.'}
            </p>
          </div>

          {/* Error Alert Box */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-medium flex items-center gap-2 text-left">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span className="break-words">{errorMessage}</span>
            </div>
          )}

          {/* STATE 1: VERIFYING LOADER */}
          {status === 'verifying' && (
            <div className="py-6 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600 dark:text-blue-400" />
              <p className="text-xs text-zinc-400">Communicating with Firebase Auth...</p>
            </div>
          )}

          {/* STATE 2: INVALID / EXPIRED LINK */}
          {status === 'invalid' && (
            <div className="space-y-4 pt-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onRequestNewLink();
                }}
                className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs tracking-wider uppercase shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Request New Reset Link</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="text-xs font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
              >
                Cancel & Return Home
              </button>
            </div>
          )}

          {/* STATE 3 & 4: READY OR SUBMITTING (PASSWORD FORM) */}
          {(status === 'ready' || status === 'submitting') && (
            <form onSubmit={handleSubmit} className="space-y-4 text-left">
              {/* New Password */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1.5">
                  NEW PASSWORD (MIN. 6 CHARACTERS)
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    disabled={status === 'submitting'}
                    className="w-full pl-10 pr-10 py-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors p-1"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1.5">
                  CONFIRM NEW PASSWORD
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    disabled={status === 'submitting'}
                    className="w-full pl-10 pr-10 py-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors p-1"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Password match indicator */}
              {newPassword && confirmPassword && (
                <div className="text-[11px] font-medium flex items-center gap-1.5">
                  {newPassword === confirmPassword ? (
                    <span className="text-emerald-500 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Passwords match
                    </span>
                  ) : (
                    <span className="text-amber-500 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> Passwords do not match yet
                    </span>
                  )}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={status === 'submitting' || !newPassword || !confirmPassword}
                className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-extrabold text-xs tracking-wider uppercase shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
              >
                {status === 'submitting' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving Password...</span>
                  </>
                ) : (
                  <>
                    <span>Save New Password</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* STATE 5: SUCCESS */}
          {status === 'success' && (
            <div className="space-y-4 pt-2">
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
                Your password has been successfully reset. You can now use your new password to sign in.
              </div>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onSuccessLogin(userEmail);
                }}
                className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs tracking-wider uppercase shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
              >
                <Sparkles className="w-4 h-4" />
                <span>Log In With New Password</span>
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );

  return createPortal(modalMarkup, document.body);
};
