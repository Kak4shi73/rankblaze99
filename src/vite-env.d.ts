/// <reference types="vite/client" />

// Explicitly define React module types
declare module 'react' {
  import * as React from 'react';
  export = React;
  export as namespace React;
}

declare module 'react-dom' {
  import * as ReactDOM from 'react-dom';
  export = ReactDOM;
  export as namespace ReactDOM;
}

declare module 'react-dom/client' {
  export * from 'react-dom/client';
}

declare module 'react/jsx-runtime' {
  export default any;
  export const jsx: any;
  export const jsxs: any;
  export const Fragment: any;
}

// Declare modules for which TypeScript can't find type definitions
declare module 'react-router-dom' {
  export const BrowserRouter: any;
  export const Routes: any;
  export const Route: any;
  export const Link: any;
  export const Navigate: any;
  export const useNavigate: any;
  export const useLocation: any;
  export const useParams: any;
}

declare module 'lucide-react' {
  export const Search: any;
  export const Users: any;
  export const CreditCard: any;
  export const Activity: any;
  export const BarChart3: any;
  export const UserPlus: any;
  export const Key: any;
  export const Trash2: any;
  export const Eye: any;
  export const Lock: any;
  export const Unlock: any;
  export const Plus: any;
  export const Check: any;
  export const X: any;
  export const ExternalLink: any;
  export const FileText: any;
  export const Globe: any;
  export const Zap: any;
  export const Code: any;
  export const FileSearch: any;
  export const Image: any;
  export const Film: any;
  export const Presentation: any;
  export const Bot: any;
  export const Book: any;
  export const Video: any;
  export const Music: any;
  export const ShoppingCart: any;
  export const Layout: any;
  export const Lightbulb: any;
  export const Mic: any;
  export const Play: any;
  export const Monitor: any;
  export const Sparkles: any;
  export const Palette: any;
  export const Pen: any;
  export const Brain: any;
}

declare module 'firebase/auth';
declare module 'firebase/database';
declare module 'firebase/firestore';

// Add declarations for lucide-react icon modules
declare module 'lucide-react/dist/esm/icons/check' {
  import { LucideIcon } from 'lucide-react';
  const Check: LucideIcon;
  export default Check;
}

declare module 'lucide-react/dist/esm/icons/x' {
  import { LucideIcon } from 'lucide-react';
  const X: LucideIcon;
  export default X;
}

declare module 'lucide-react/dist/esm/icons/arrow-right' {
  import { LucideIcon } from 'lucide-react';
  const ArrowRight: LucideIcon;
  export default ArrowRight;
}

declare module 'lucide-react/dist/esm/icons/arrow-left' {
  import { LucideIcon } from 'lucide-react';
  const ArrowLeft: LucideIcon;
  export default ArrowLeft;
}

declare module 'lucide-react/dist/esm/icons/shopping-bag' {
  import { LucideIcon } from 'lucide-react';
  const ShoppingBag: LucideIcon;
  export default ShoppingBag;
} 