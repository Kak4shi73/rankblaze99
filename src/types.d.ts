import { ReactNode } from 'react';

// Auth context types
interface User {
  id: string;
  email?: string;
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  [key: string]: any;
}

// Toast context types
type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
  hideToast: () => void;
  [key: string]: any;
}

// Firebase related types
interface FirebaseDatabase {
  db: any;
  auth: any;
  storage: any;
}

// Global declaration
declare global {
  // Modules declaration
  namespace NodeJS {
    interface ProcessEnv {
      REACT_APP_FIREBASE_API_KEY: string;
      REACT_APP_FIREBASE_AUTH_DOMAIN: string;
      REACT_APP_FIREBASE_PROJECT_ID: string;
      REACT_APP_FIREBASE_STORAGE_BUCKET: string;
      REACT_APP_FIREBASE_MESSAGING_SENDER_ID: string;
      REACT_APP_FIREBASE_APP_ID: string;
      REACT_APP_FIREBASE_DATABASE_URL: string;
    }
  }
}

// Declare module augmentations
declare module '../context/AuthContext' {
  export const useAuth: () => AuthContextType;
}

declare module '../context/ToastContext' {
  export const useToast: () => ToastContextType;
}

// Firebase database types
declare module 'firebase/database' {
  export function ref(db: any, path: string): any;
  export function get(ref: any): Promise<{ exists: () => boolean; val: () => any }>;
  export function onValue(
    ref: any,
    callback: (snapshot: { exists: () => boolean; val: () => any }) => void
  ): () => void;
  export function set(ref: any, value: any): Promise<void>;
}

// Add declaration for our config module
declare module '../config/firebase' {
  export const db: any;
  export const auth: any;
  export const storage: any;
} 