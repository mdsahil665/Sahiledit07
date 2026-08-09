import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Mail, Lock, ArrowRight, X, Sparkles, AlertCircle, Eye, EyeOff, CheckCircle2, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth, ADMIN_EMAIL } from '../context/AuthContext';
import { useToast } from './Toast';
import { useLogo } from '../context/LogoContext';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (isAdmin: boolean) => void;
  initialMode?: 'login' | 'register';
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  initialMode = 'login',
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'reset'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const { currentUser, loginWithEmail, registerWithEmail, resetPassword, loginWithGoogle } = useAuth();
  const { showToast } = useToast();
  const { logoUrl } = useLogo();

  useEffect(() => {
    if (currentUser && isOpen) {
      const isAdminUser = currentUser.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
      onLoginSuccess(isAdminUser);
      onClose();
    }
  }, [currentUser, isOpen]);

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

  const formatFirebaseError = (err: any): string => {
    if (!err) return 'An error occurred during authentication.';
    const code = err?.code ? `[${err.code}] ` : '';
    const message = err?.message || String(err);
    return `${code}${message}`;
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        const user = await loginWithEmail(email, password);
        const isAdminUser = user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
        showToast(
          'Login Successful',
          isAdminUser ? 'Welcome back! Opening Admin Dashboard...' : `Welcome back, ${user.displayName || user.email}!`
        );
        onLoginSuccess(isAdminUser);
      } else if (mode === 'register') {
        const user = await registerWithEmail(email, password);
        const isAdminUser = user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
        showToast('Account Created!', `Welcome, ${user.displayName || user.email}`);
        onLoginSuccess(isAdminUser);
      }
      onClose();
    } catch (err: any) {
      const msg = formatFirebaseError(err);
      setErrorMsg(msg);
      showToast('Authentication Error', msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMsg('Please enter your email address.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(trimmedEmail);
      setSuccessMsg('Password reset link sent. Please check your email.');
      showToast('Reset Link Sent', 'Password reset instructions sent to your email.');
    } catch (err: any) {
      const errCode = err?.code || '';
      if (errCode === 'auth/user-not-found') {
        setErrorMsg('No user account found with this email address.');
      } else if (errCode === 'auth/invalid-email') {
        setErrorMsg('Please enter a valid email address.');
      } else if (errCode === 'auth/too-many-requests') {
        setErrorMsg('Too many attempts. Please wait a moment and try again.');
      } else {
        setErrorMsg('Failed to send password reset email. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const user = await loginWithGoogle();
      if (user) {
        const isAdminUser = user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
        showToast(
          '✓ Google Sign-In Successful',
          isAdminUser ? 'Welcome Admin! Opening Dashboard...' : `Signed in as ${user.displayName || user.email}`
        );
        onLoginSuccess(isAdminUser);
        onClose();
      }
    } catch (err: any) {
      console.warn('Google Sign-In notice:', err?.code, err?.message, err);
      const errStr = String(err?.message || err || '');
      if (
        err?.code === 'auth/popup-closed-by-user' ||
        err?.code === 'auth/cancelled-popup-request' ||
        errStr.includes('closing') ||
        errStr.includes('hidden')
      ) {
        return;
      }
      const msg = formatFirebaseError(err);
      setErrorMsg(msg);
      showToast('Google Sign-In Error', msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const modalMarkup = (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 cursor-pointer"
          style={{
            background: 'rgba(0, 0, 0, 0.60)',
            backdropFilter: 'blur(16px) saturate(140%)',
            WebkitBackdropFilter: 'blur(16px) saturate(140%)',
          }}
          onClick={onClose}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-md my-auto max-h-[90vh] overflow-y-auto p-6 sm:p-8 rounded-[28px] bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-2xl z-10 text-center space-y-5"
        >
          {/* Close button top right */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
            aria-label="Close login modal"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Top Logo / Icon Badge */}
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center mx-auto shadow-sm overflow-hidden p-1">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="w-full h-full object-contain rounded-xl" />
            ) : (
              <Sparkles className="w-8 h-8 text-amber-500" />
            )}
          </div>

          {/* Title & Subtitle */}
          <div>
            <h3 className="font-black text-2xl text-zinc-900 dark:text-white tracking-tight">
              {mode === 'reset' ? 'Reset Password' : mode === 'login' ? 'Welcome Back' : 'Create Account'}
            </h3>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 font-medium mt-1">
              {mode === 'reset'
                ? 'Enter your email to receive a password reset link.'
                : mode === 'login'
                ? 'Log in to save, rate, and give feedback.'
                : 'Create an account to save, rate, and share feedback.'}
            </p>
          </div>

          {/* Error Message Alert */}
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-medium flex items-center gap-2 text-left">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="break-words">{errorMsg}</span>
            </div>
          )}

          {/* Success Message Alert */}
          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-medium flex items-center gap-2 text-left">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
              <span className="break-words">{successMsg}</span>
            </div>
          )}

          {/* Form Body */}
          {mode === 'reset' ? (
            /* Reset Password View */
            <form onSubmit={handleResetSubmit} className="space-y-4 text-left">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1.5">
                  EMAIL ADDRESS
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@email.com"
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-extrabold text-xs tracking-wider shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
              >
                <span>{loading ? 'Sending Reset Link...' : 'Send Reset Link'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="pt-1 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMsg('');
                    setSuccessMsg('');
                  }}
                  className="text-xs font-bold text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white inline-flex items-center gap-1.5 transition-colors py-1 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Sign In</span>
                </button>
              </div>
            </form>
          ) : (
            /* Login / Register View */
            <form onSubmit={handleEmailSubmit} className="space-y-4 text-left">
              {/* Email Input */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1.5">
                  EMAIL ADDRESS
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@email.com"
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                    PASSWORD
                  </label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => {
                        setMode('reset');
                        setErrorMsg('');
                        setSuccessMsg('');
                      }}
                      className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                    >
                      FORGOT?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
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

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-extrabold text-xs tracking-wider uppercase shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
              >
                <span>{loading ? 'Processing...' : mode === 'login' ? 'Login' : 'Sign Up'}</span>
              </button>

              {/* Quick Connect Divider */}
              <div className="relative flex items-center justify-center my-4">
                <div className="border-t border-zinc-200 dark:border-zinc-800 w-full" />
                <span className="bg-white dark:bg-zinc-900 px-3 text-[10px] font-black tracking-widest text-zinc-400 uppercase absolute">
                  QUICK CONNECT
                </span>
              </div>

              {/* Quick Connect Buttons - ONLY GOOGLE */}
              <div>
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-2xl bg-zinc-100 dark:bg-zinc-800/80 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold text-xs border border-zinc-200 dark:border-zinc-700 flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-sm active:scale-95"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Google</span>
                </button>
              </div>

              {/* Bottom Toggle Link */}
              <div className="pt-2 text-center text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                {mode === 'login' ? (
                  <>
                    Don't have an account?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setMode('register');
                        setErrorMsg('');
                        setSuccessMsg('');
                      }}
                      className="text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer"
                    >
                      Sign Up
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setMode('login');
                        setErrorMsg('');
                        setSuccessMsg('');
                      }}
                      className="text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer"
                    >
                      Log In
                    </button>
                  </>
                )}
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );

  return createPortal(modalMarkup, document.body);
};
