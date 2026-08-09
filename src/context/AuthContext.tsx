import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth, signInWithGoogle, syncUserToFirestore, getRedirectResult, ADMIN_EMAIL } from '../lib/firebase';
import { promptStore } from '../services/promptStore';

export { ADMIN_EMAIL };

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  isAdmin: boolean;
  favorites: string[];
  loginWithEmail: (e: string, p: string) => Promise<User>;
  registerWithEmail: (e: string, p: string) => Promise<User>;
  resetPassword: (email: string) => Promise<void>;
  loginWithGoogle: () => Promise<User | null>;
  logout: () => Promise<void>;
  toggleFavorite: (postId: string) => void;
  isFavorite: (postId: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
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
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

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
    await sendPasswordResetEmail(auth, email);
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
        favorites,
        loginWithEmail,
        registerWithEmail,
        resetPassword,
        loginWithGoogle,
        logout,
        toggleFavorite,
        isFavorite,
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
