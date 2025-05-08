import { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User as FirebaseUser,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  browserLocalPersistence
} from 'firebase/auth';
import { ref, get, set, onValue } from 'firebase/database';
import { auth, db } from '../config/firebase';
import { useToast } from './ToastContext';
// Import our security utilities
import { isAdminUser } from '../utils/securityUtils';
import { clearSessionData } from '../utils/sessionTimeout';

// Define User type
type User = {
  id: string;
  name: string | null;
  email: string | null;
  disabled?: boolean;
};

// Define AuthContextType
type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  signupWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { showToast } = useToast();
  const googleProvider = new GoogleAuthProvider();

  useEffect(() => {
    // Set persistence to local
    setPersistence(auth, browserLocalPersistence);

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // Check if user exists in database
          const userRef = ref(db, `users/${firebaseUser.uid}`);
          const snapshot = await get(userRef);

          if (!snapshot.exists()) {
            // Create user in database if they don't exist
            await set(userRef, {
              email: firebaseUser.email,
              name: firebaseUser.displayName || 'User',
              createdAt: new Date().toISOString(),
              isAdmin: false,
              disabled: false
            });
          } else {
            // Check if the account is disabled
            const userData = snapshot.val();
            if (userData.disabled) {
              // Account is disabled, force logout
              await signOut(auth);
              showToast('Your account has been disabled. Please contact support.', 'error');
              setUser(null);
              setIsLoading(false);
              return;
            }
          }

          // Set up a listener for user account status changes
          const userStatusRef = ref(db, `users/${firebaseUser.uid}`);
          const userStatusListener = onValue(userStatusRef, (statusSnapshot) => {
            const userData = statusSnapshot.val();
            if (userData && userData.disabled) {
              // Account was disabled, force logout
              signOut(auth).then(() => {
                showToast('Your account has been disabled by an administrator.', 'error');
                navigate('/');
              });
            }
          });

          // Set user as authenticated immediately
          setUser({
            id: firebaseUser.uid,
            name: firebaseUser.displayName,
            email: firebaseUser.email,
            disabled: snapshot.exists() ? snapshot.val().disabled : false
          });
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Error in auth state change handler:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [navigate, showToast]);

  const login = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // After login, check if the account is disabled
      const userRef = ref(db, `users/${userCredential.user.uid}`);
      const snapshot = await get(userRef);
      
      if (snapshot.exists() && snapshot.val().disabled) {
        // Account is disabled, force logout
        await signOut(auth);
        showToast('Your account has been disabled. Please contact support.', 'error');
        throw new Error('Account disabled');
      }
      
      // Set login time for session management
      localStorage.setItem('userLoginTime', Date.now().toString());
      
      showToast('Successfully logged in', 'success');
      navigate('/dashboard');
    } catch (error: any) {
      const errorMessage = 
        error.code === 'auth/invalid-credential' ? 'Invalid email or password' : 
        error.code === 'auth/user-not-found' ? 'No account found with this email' :
        error.code === 'auth/wrong-password' ? 'Incorrect password' :
        error.code === 'auth/too-many-requests' ? 'Too many failed attempts. Try again later' :
        error.code === 'auth/network-request-failed' ? 'Network error. Check your connection' :
        error.message || 'Failed to login. Please try again.';
        
      showToast(errorMessage, 'error');
      throw error;
    }
  };

  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Check if user exists in database
      const userRef = ref(db, `users/${user.uid}`);
      const snapshot = await get(userRef);

      if (!snapshot.exists()) {
        // Create user in database if they don't exist
        await set(userRef, {
          email: user.email,
          name: user.displayName || 'User',
          createdAt: new Date().toISOString(),
          isAdmin: false,
          disabled: false
        });
      } else if (snapshot.val().disabled) {
        // Account is disabled, force logout
        await signOut(auth);
        showToast('Your account has been disabled. Please contact support.', 'error');
        throw new Error('Account disabled');
      }
      
      // Set login time for session management
      localStorage.setItem('userLoginTime', Date.now().toString());
      
      showToast('Successfully logged in with Google', 'success');
      navigate('/dashboard');
    } catch (error: any) {
      // Check for user cancellation
      if (error.code === 'auth/popup-closed-by-user') {
        showToast('Google login was cancelled', 'info');
      } else {
        const errorMessage = 
          error.code === 'auth/network-request-failed' ? 'Network error. Check your connection' :
          error.code === 'auth/popup-blocked' ? 'Pop-up was blocked. Please enable pop-ups for this site' :
          error.code === 'auth/too-many-requests' ? 'Too many attempts. Try again later' :
          error.message || 'Failed to login with Google. Please try again.';
          
        showToast(errorMessage, 'error');
      }
      throw error;
    }
  };

  const signup = async (name: string, email: string, password: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update user profile with name
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: name
        });
      }

      // Create user in database
      const userRef = ref(db, `users/${userCredential.user.uid}`);
      await set(userRef, {
        email,
        name,
        createdAt: new Date().toISOString(),
        isAdmin: false,
        disabled: false
      });

      showToast('Account created successfully', 'success');
      navigate('/dashboard');
    } catch (error: any) {
      showToast(error.message || 'Failed to create account', 'error');
      throw error;
    }
  };

  const signupWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Create user in database
      const userRef = ref(db, `users/${user.uid}`);
      await set(userRef, {
        email: user.email,
        name: user.displayName || 'User',
        createdAt: new Date().toISOString(),
        isAdmin: false,
        disabled: false
      });

      showToast('Account created successfully with Google', 'success');
      navigate('/dashboard');
    } catch (error: any) {
      showToast(error.message || 'Failed to create account with Google', 'error');
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Clear session data first
      clearSessionData();
      // Then sign out from Firebase
      await signOut(auth);
      showToast('Successfully logged out', 'success');
      navigate('/');
    } catch (error: any) {
      showToast('Failed to logout', 'error');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        loginWithGoogle,
        signup,
        signupWithGoogle,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
