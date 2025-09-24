import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
// FIX: import firebase v8 for types and server value
// FIX: Use firebase v9 compat libraries to support v8 syntax.
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { User as AppUser } from '../types';
import { auth, db } from '../utils/firebase';

interface SignUpData {
  email: string;
  password: string;
  options?: {
    data?: {
      [key: string]: any;
    };
  };
}

interface AuthContextType {
  user: AppUser | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error: any | null }>;
  logout: () => Promise<void>;
  signUp: (credentials: SignUpData) => Promise<{
    success: boolean;
    error: any | null;
  }>;
  refreshUser: () => Promise<void>;
  updateUserPassword: (password: string) => Promise<{ success: boolean; error: any | null; }>;
  loading: boolean;
  initialLoading: boolean;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMounted = useRef(true);
  // FIX: Use firebase.User type from v8 compat
  const [firebaseUser, setFirebaseUser] = useState<firebase.User | null>(null);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);
  
  const fetchProfile = useCallback(async (fbUser: firebase.User) => {
    try {
      // FIX: Use v8 database ref and get syntax
      const userDocRef = db.ref('users/' + fbUser.uid);
      const userDoc = await userDocRef.get();

      if (!userDoc.exists()) {
        throw new Error('User profile not found in database.');
      }

      const profileData = userDoc.val();
      const appUser: AppUser = {
        id: fbUser.uid,
        email: fbUser.email || '',
        emailVerified: fbUser.emailVerified || false,
        firstName: profileData.firstName || '',
        lastName: profileData.lastName || '',
        isAdmin: profileData.isAdmin || false,
        phone: profileData.phone || '',
        country: profileData.country || '',
        profilePictureUrl: profileData.profilePictureUrl || '',
      };
      
      if (isMounted.current) {
        setUser(appUser);
      }
    } catch (err: any) {
      if (isMounted.current) {
        setError(err.message);
        setUser(null);
        // FIX: Use v8 signOut syntax
        await auth.signOut(); // Log out if profile is missing
      }
    }
  }, []);

  useEffect(() => {
    // FIX: Use v8 onAuthStateChanged syntax
    const unsubscribe = auth.onAuthStateChanged(async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        await fetchProfile(fbUser);
      } else {
        setUser(null);
      }
      if (isMounted.current) {
        setInitialLoading(false);
      }
    });

    return () => unsubscribe();
  }, [fetchProfile]);


  const refreshUser = useCallback(async () => {
    if (auth.currentUser) {
      await fetchProfile(auth.currentUser);
    }
  }, [fetchProfile]);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      // FIX: Use v8 signInWithEmailAndPassword syntax
      await auth.signInWithEmailAndPassword(email, password);
      return { success: true, error: null };
    } catch (err: any) {
      let friendlyMessage = 'Login failed. Please check your credentials and try again.';
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
          friendlyMessage = 'Invalid email or password. Please try again.';
      } else if (err.code === 'auth/too-many-requests') {
          friendlyMessage = 'Access to this account has been temporarily disabled due to many failed login attempts. You can immediately restore it by resetting your password or you can try again later.';
      }
      setError(friendlyMessage);
      return { success: false, error: err };
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    // FIX: Use v8 signOut syntax
    await auth.signOut();
  }, []);

  const signUp = useCallback(async (credentials: SignUpData) => {
    setLoading(true);
    setError(null);
    const { email, password, options } = credentials;
    try {
      // FIX: Use v8 createUserWithEmailAndPassword syntax
      const userCredential = await auth.createUserWithEmailAndPassword(email, password);
      const newUser = userCredential.user!;

      // Create user profile in Realtime Database
      // FIX: Use v8 database ref, set, and serverTimestamp syntax
      await db.ref('users/' + newUser.uid).set({
        email: newUser.email,
        firstName: options?.data?.firstName || '',
        lastName: options?.data?.lastName || '',
        phone: options?.data?.phone || '',
        country: options?.data?.country || '',
        isAdmin: false, // Default to not admin
        createdAt: firebase.database.ServerValue.TIMESTAMP,
      });

      return { success: true, error: null };
    } catch (err: any)
{
      let friendlyMessage = 'Sign-up failed. Please try again.';
      if (err.code === 'auth/email-already-in-use') {
        friendlyMessage = 'This email address is already in use by another account.';
      } else if (err.code === 'auth/weak-password') {
        friendlyMessage = 'Password should be at least 6 characters.';
      } else if (err.code === 'auth/invalid-email') {
        friendlyMessage = 'Please enter a valid email address.';
      }
      setError(friendlyMessage);
      return { success: false, error: err };
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, []);

  const updateUserPassword = useCallback(async (password: string) => {
    if(!firebaseUser) {
       return { success: false, error: { message: "No user is logged in."} };
    }
    setLoading(true);
    setError(null);
    try {
        // FIX: Use v8 updatePassword syntax (on user object)
        await firebaseUser.updatePassword(password);
        return { success: true, error: null };
    } catch (err: any) {
        setError(err.message);
        return { success: false, error: err };
    } finally {
        if (isMounted.current) setLoading(false);
    }
  }, [firebaseUser]);


  const value = useMemo(
    () => ({
      user,
      login,
      logout,
      signUp,
      refreshUser,
      updateUserPassword,
      loading,
      initialLoading,
      error,
      clearError,
    }),
    [user, login, logout, signUp, refreshUser, updateUserPassword, loading, initialLoading, error, clearError]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
