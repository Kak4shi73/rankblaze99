/// <reference types="vite/client" />

// This file ensures TypeScript recognizes the JSX namespace
import React from 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

// Declare modules for which TypeScript can't find type definitions
declare module 'react-router-dom';
declare module 'lucide-react';
declare module 'firebase/auth';
declare module 'firebase/database';
declare module 'firebase/firestore'; 