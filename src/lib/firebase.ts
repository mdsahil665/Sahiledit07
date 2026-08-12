import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  setPersistence,
  browserLocalPersistence,
  User,
} from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, getDocFromServer } from 'firebase/firestore';
import appletConfig from '../../firebase-applet-config.json';

// Firebase configuration prioritizing VITE_FIREBASE_* environment variables with fallback to project config
const getEnvVar = (key: string, fallback: string): string => {
  try {
    if (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env[key]) {
      return (import.meta as any).env[key];
    }
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key] as string;
    }
  } catch (e) {
    // ignore lookup error
  }
  return fallback;
};

const firebaseConfig = {
  apiKey: getEnvVar('VITE_FIREBASE_API_KEY', appletConfig.apiKey),
  authDomain: getEnvVar('VITE_FIREBASE_AUTH_DOMAIN', appletConfig.authDomain),
  projectId: getEnvVar('VITE_FIREBASE_PROJECT_ID', appletConfig.projectId),
  storageBucket: getEnvVar('VITE_FIREBASE_STORAGE_BUCKET', appletConfig.storageBucket),
  messagingSenderId: getEnvVar('VITE_FIREBASE_MESSAGING_SENDER_ID', appletConfig.messagingSenderId),
  appId: getEnvVar('VITE_FIREBASE_APP_ID', appletConfig.appId),
};

const databaseId = appletConfig.firestoreDatabaseId || '(default)';

console.log('[Firebase Init Info]', {
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
  storageBucket: firebaseConfig.storageBucket,
  databaseId,
  hasApiKey: Boolean(firebaseConfig.apiKey),
  hasAppId: Boolean(firebaseConfig.appId),
  locationOrigin: typeof window !== 'undefined' ? window.location.origin : 'server',
});

export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app, databaseId);
export const auth = getAuth(app);

// Enable browserLocalPersistence to avoid IndexedDB closing/hidden issues on mobile browsers
try {
  setPersistence(auth, browserLocalPersistence).catch((pErr) => {
    console.warn('Firebase setPersistence notice:', pErr);
  });
} catch (pErr) {
  console.warn('Firebase setPersistence catch notice:', pErr);
}

export const googleProvider = new GoogleAuthProvider();

export const ADMIN_EMAIL = 'mdsahil012002@gmail.com';

export async function testConnection() {
  try {
    return await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (err: any) {
    if (err?.code === 'unavailable' || err?.message?.includes('Could not reach Cloud Firestore') || err?.message?.includes('offline')) {
      console.info('Firestore client operating in resilient offline/cache mode.');
    } else {
      console.warn('Firestore test connection notice:', err?.message || err);
    }
  }
}
testConnection();

export async function syncUserToFirestore(user: User): Promise<boolean> {
  if (!user || !user.uid) return false;
  try {
    const userRef = doc(db, 'users', user.uid);
    const userEmail = user.email?.toLowerCase() || '';
    const isAdminUser = userEmail === ADMIN_EMAIL.toLowerCase();
    const now = new Date().toISOString();

    let isRoleAdmin = isAdminUser;
    try {
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const data = userSnap.data();
        if (data?.role === 'admin') {
          isRoleAdmin = true;
        }
      }
    } catch (readErr) {
      console.warn('Firestore read user doc notice:', readErr);
    }

    await setDoc(
      userRef,
      {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || user.email?.split('@')[0] || 'User',
        photoURL: user.photoURL || '',
        role: isRoleAdmin ? 'admin' : 'user',
        lastLoginAt: now,
        updatedAt: now,
      },
      { merge: true }
    );

    return isRoleAdmin;
  } catch (err: any) {
    const errCode = err?.code ? `[${err.code}] ` : '';
    const errMsg = err?.message || String(err);
    console.warn('Firestore user sync notice:', `${errCode}${errMsg}`);
    return user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
  }
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  return errInfo;
}

export async function signInWithGoogle(): Promise<User | null> {
  googleProvider.setCustomParameters({ prompt: 'select_account' });

  try {
    const result = await signInWithPopup(auth, googleProvider);
    if (result?.user) {
      await syncUserToFirestore(result.user);
      return result.user;
    }
    return null;
  } catch (error: any) {
    console.warn('signInWithPopup notice:', error?.code || 'no-code', error?.message || error);

    // If popup was blocked by browser popup blocker, try redirect as fallback
    if (error?.code === 'auth/popup-blocked') {
      try {
        await signInWithRedirect(auth, googleProvider);
        return null;
      } catch (redirectErr: any) {
        console.warn('signInWithRedirect fallback notice:', redirectErr);
      }
    }

    if (
      error?.code === 'auth/popup-closed-by-user' ||
      error?.code === 'auth/cancelled-popup-request'
    ) {
      return null;
    }

    throw error;
  }
}

export { getRedirectResult };

export async function logOut(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
}

