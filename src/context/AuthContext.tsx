import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth, db, signInWithGoogle, syncUserToFirestore, getRedirectResult, ADMIN_EMAIL } from '../lib/firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { promptStore } from '../services/promptStore';

export { ADMIN_EMAIL };

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  isAdmin: boolean;
  isPremium: boolean;
  favorites: string[];
  loginWithEmail: (e: string, p: string) => Promise<User>;
  registerWithEmail: (e: string, p: string) => Promise<User>;
  resetPassword: (email: string) => Promise<void>;
  loginWithGoogle: () => Promise<User | null>;
  logout: () => Promise<void>;
  toggleFavorite: (postId: string) => void;
  isFavorite: (postId: string) => boolean;
  updateUserPremiumStatus: (uid: string, status: boolean) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('sahil_prompt_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const checkAdminStatus = (user: User | null): boolean => {
    if (!user) return promptStore.isAdminLoggedIn();
    const userEmail = user.email?.toLowerCase() || '';
    const adminCheck = userEmail === ADMIN_EMAIL.toLowerCase() || promptStore.isAdminLoggedIn();
    return adminCheck;
  };

  // Real-time listener for current user's profile document to sync isPremium and role
  useEffect(() => {
    if (!currentUser?.uid) {
      setIsPremium(false);
      return;
    }

    const userRef = doc(db, 'users', currentUser.uid);
    const unsub = onSnapshot(
      userRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setIsPremium(Boolean(data?.isPremium));
        } else {
          setIsPremium(false);
        }
      },
      (err) => {
        console.warn('User profile realtime sync notice:', err);
      }
    );

    return () => unsub();
  }, [currentUser?.uid]);

  useEffect(() => {
    // Check for pending redirect sign-in results
    getRedirectResult(auth)
      .then(async (result) => {
        if (result?.user) {
          await syncUserToFirestore(result.user);
        }
      })
      .catch((err: any) => {
        if (err?.code !== 'auth/popup-closed-by-user') {
          console.error('Redirect Sign-In result error:', err?.code || 'no-code', err?.message || err);
        }
      });

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        const isUserAdmin = await syncUserToFirestore(user);
        const adminState = checkAdminStatus(user) || isUserAdmin;
        setIsAdmin(adminState);
        if (adminState) {
          promptStore.setAdminLoggedIn(true);
        }
      } else {
        const isPasscodeAdmin = promptStore.isAdminLoggedIn();
        setIsAdmin(isPasscodeAdmin);
        setIsPremium(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const updateUserPremiumStatus = async (uid: string, status: boolean) => {
    try {
      const targetRef = doc(db, 'users', uid);
      await setDoc(targetRef, { isPremium: status, updatedAt: new Date().toISOString() }, { merge: true });
      if (currentUser?.uid === uid) {
        setIsPremium(status);
      }
    } catch (e) {
      console.error('Failed to update user premium status:', e);
      throw e;
    }
  };

  const loginWithEmail = async (email: string, pass: string): Promise<User> => {
    const res = await signInWithEmailAndPassword(auth, email, pass);
    const user = res.user;
    const isUserAdmin = await syncUserToFirestore(user);
    const adminState = checkAdminStatus(user) || isUserAdmin;
    setIsAdmin(adminState);
    if (adminState) {
      promptStore.setAdminLoggedIn(true);
    }
    return user;
  };

  const registerWithEmail = async (email: string, pass: string): Promise<User> => {
    const res = await createUserWithEmailAndPassword(auth, email, pass);
    const user = res.user;
    const isUserAdmin = await syncUserToFirestore(user);
    const adminState = checkAdminStatus(user) || isUserAdmin;
    setIsAdmin(adminState);
    if (adminState) {
      promptStore.setAdminLoggedIn(true);
    }
    return user;
  };

  const resetPassword = async (email: string): Promise<void> => {
    const trimmedEmail = (email || '').trim();
    if (!trimmedEmail) {
      const err = new Error('Email address is required.');
      (err as any).code = 'auth/missing-email';
      throw err;
    }

    const origin = typeof window !== 'undefined' && window.location.origin
      ? window.location.origin
      : 'https://sahiledit.vercel.app';

    const actionCodeSettings = {
      url: `${origin}/reset-password`,
      handleCodeInApp: true,
    };

    console.log('[Firebase Auth] Requesting password reset for:', trimmedEmail, 'with continue URL:', actionCodeSettings.url);

    try {
      await sendPasswordResetEmail(auth, trimmedEmail, actionCodeSettings);
      console.log('[Firebase Auth] sendPasswordResetEmail succeeded with custom continue URL.');
    } catch (err: any) {
      console.warn('[Firebase Auth] sendPasswordResetEmail initial attempt notice:', err?.code, err?.message);

      // If the domain is not yet added in Firebase Authorized Domains, fallback to standard sendPasswordResetEmail
      if (
        err?.code === 'auth/unauthorized-continue-uri' ||
        err?.code === 'auth/invalid-continue-uri' ||
        err?.code === 'auth/argument-error'
      ) {
        console.info('[Firebase Auth] Retrying sendPasswordResetEmail with default Firebase action handler...');
        await sendPasswordResetEmail(auth, trimmedEmail);
        console.log('[Firebase Auth] sendPasswordResetEmail default fallback succeeded.');
        return;
      }

      throw err;
    }
  };

  const loginWithGoogle = async (): Promise<User | null> => {
    const user = await signInWithGoogle();
    if (user) {
      const isUserAdmin = await syncUserToFirestore(user);
      const adminState = checkAdminStatus(user) || isUserAdmin;
      setIsAdmin(adminState);
      if (adminState) {
        promptStore.setAdminLoggedIn(true);
      }
    }
    return user;
  };

  const logout = async () => {
    await signOut(auth);
    promptStore.setAdminLoggedIn(false);
    setIsAdmin(false);
    setIsPremium(false);
    setCurrentUser(null);
  };

  const toggleFavorite = (postId: string) => {
    setFavorites((prev) => {
      const updated = prev.includes(postId) ? prev.filter((id) => id !== postId) : [...prev, postId];
      localStorage.setItem('sahil_prompt_favorites', JSON.stringify(updated));
      return updated;
    });
  };

  const isFavorite = (postId: string) => favorites.includes(postId);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        isAdmin,
        isPremium,
        favorites,
        loginWithEmail,
        registerWithEmail,
        resetPassword,
        loginWithGoogle,
        logout,
        toggleFavorite,
        isFavorite,
        updateUserPremiumStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};


export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
