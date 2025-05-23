import { 
  Palette, Code, Search, Brain, Pen, Book, Video, Music, ShoppingCart, 
  Zap, Image, Film, Presentation, Bot, Lock, Globe, FileText,
  Layout, Lightbulb, Mic, Play, Monitor, Sparkles
} from 'lucide-react';

interface Tool {
  id: number;
  name: string;
  description: string;
  price: number;
  features: string[];
  icon: any;
  gradient: string;
  category: string;
  hidden?: boolean;
}

export const toolsData: Tool[] = [
  {
    id: 1,
    name: 'ChatGPT Plus',
    description: 'Advanced AI language model with GPT-4 access',
    price: 349,
    features: [
      'GPT-4 access',
      'Faster response times',
      'Priority access',
      'Advanced features'
    ],
    icon: Bot,
    gradient: 'from-violet-500 to-purple-600',
    category: 'AI'
  },
  {
    id: 2,
    name: 'Envato Elements',
    description: 'Access millions of creative assets for your projects',
    price: 199,
    features: [
      'Unlimited downloads',
      'Commercial license',
      'Premium templates',
      'Regular updates'
    ],
    icon: Palette,
    gradient: 'from-emerald-500 to-teal-600',
    category: 'Design'
  },
  {
    id: 3,
    name: 'Canva Pro',
    description: 'Professional design tool for all your creative needs',
    price: 149,
    features: [
      'Premium templates',
      'Brand kit',
      'Background remover',
      'Premium assets'
    ],
    icon: Layout,
    gradient: 'from-blue-500 to-indigo-600',
    category: 'Design'
  },
  {
    id: 4,
    name: 'Storyblocks',
    description: 'Unlimited stock videos, audio, and images',
    price: 199,
    features: [
      'Unlimited downloads',
      'HD & 4K videos',
      'Royalty-free music',
      'Commercial license'
    ],
    icon: Video,
    gradient: 'from-purple-500 to-pink-600',
    category: 'Media'
  },
  {
    id: 5,
    name: 'SEMrush',
    description: 'All-in-one marketing toolkit for digital success',
    price: 299,
    features: [
      'Keyword research',
      'Site audit',
      'Competitor analysis',
      'Rank tracking'
    ],
    icon: Search,
    gradient: 'from-green-500 to-emerald-600',
    category: 'Marketing'
  },
  {
    id: 6,
    name: 'Grammarly',
    description: 'Advanced writing assistance and grammar checker',
    price: 99,
    features: [
      'Advanced grammar checks',
      'Style suggestions',
      'Tone adjustments',
      'Plagiarism detector'
    ],
    icon: Pen,
    gradient: 'from-green-500 to-teal-600',
    category: 'Writing'
  },
  {
    id: 7,
    name: 'Netflix Premium',
    description: 'Ultimate streaming experience in 4K quality',
    price: 179,
    features: [
      '4K Ultra HD with HDR',
      'Netflix Originals access',
      'Multiple devices',
      'Offline downloads'
    ],
    icon: Play,
    gradient: 'from-red-500 to-rose-600',
    category: 'Entertainment'
  },
  {
    id: 8,
    name: 'Spotify Premium',
    description: 'Ad-free music streaming experience',
    price: 50,
    features: [
      'Ad-free music',
      'High-quality audio',
      'Offline listening',
      'Unlimited skips'
    ],
    icon: Music,
    gradient: 'from-green-500 to-emerald-600',
    category: 'Entertainment'
  },
  {
    id: 9,
    name: 'YouTube Premium',
    description: 'Ad-free YouTube experience with premium features',
    price: 60,
    features: [
      'Ad-free viewing',
      'Background play',
      'Offline downloads',
      'YouTube Music access'
    ],
    icon: Play,
    gradient: 'from-red-600 to-pink-600',
    category: 'Entertainment'
  },
  {
    id: 10,
    name: 'Helium10',
    description: 'Complete Amazon seller toolkit',
    price: 299,
    features: [
      'Product research',
      'Keyword tracking',
      'Competitor analysis',
      'Listing optimization'
    ],
    icon: ShoppingCart,
    gradient: 'from-orange-500 to-red-600',
    category: 'E-commerce'
  },
  {
    id: 11,
    name: 'Writesonic',
    description: 'AI writing assistant for content creation',
    price: 149,
    features: [
      'Article writing',
      'Blog posts',
      'Marketing copy',
      'SEO optimization'
    ],
    icon: Pen,
    gradient: 'from-indigo-500 to-purple-600',
    category: 'AI'
  },
  {
    id: 12,
    name: 'Leonardo.ai',
    description: 'AI-powered image generation and editing',
    price: 199,
    features: [
      'Image generation',
      'Style transfer',
      'Image editing',
      'Batch processing'
    ],
    icon: Image,
    gradient: 'from-rose-500 to-pink-600',
    category: 'AI'
  },
  {
    id: 13,
    name: 'Coursera',
    description: 'Access to premium online courses',
    price: 99,
    features: [
      'Unlimited courses',
      'Certificates',
      'Expert instruction',
      'Hands-on projects'
    ],
    icon: Book,
    gradient: 'from-blue-500 to-cyan-600',
    category: 'Education'
  },
  {
    id: 14,
    name: 'LinkedIn Learning',
    description: 'Professional development courses',
    price: 99,
    features: [
      'Business courses',
      'Tech tutorials',
      'Creative classes',
      'Certificates'
    ],
    icon: Book,
    gradient: 'from-blue-600 to-indigo-600',
    category: 'Education'
  },
  {
    id: 15,
    name: 'Skillshare',
    description: 'Creative learning platform',
    price: 99,
    features: [
      'Creative courses',
      'Project-based learning',
      'Expert teachers',
      'Community features'
    ],
    icon: Palette,
    gradient: 'from-green-500 to-teal-600',
    category: 'Education'
  },
  {
    id: 16,
    name: 'Prezi',
    description: 'Dynamic presentation creation tool',
    price: 149,
    features: [
      'Interactive presentations',
      'Templates library',
      'Collaboration tools',
      'Analytics'
    ],
    icon: Presentation,
    gradient: 'from-blue-500 to-indigo-600',
    category: 'Productivity'
  },
  {
    id: 17,
    name: 'VistaCreate',
    description: 'Online graphic design platform',
    price: 99,
    features: [
      'Design templates',
      'Stock assets',
      'Brand kit',
      'Team collaboration'
    ],
    icon: Palette,
    gradient: 'from-purple-500 to-pink-600',
    category: 'Design'
  },
  {
    id: 18,
    name: 'Vecteezy',
    description: 'Vector graphics and illustrations',
    price: 99,
    features: [
      'Vector downloads',
      'Commercial license',
      'Premium content',
      'Design tools'
    ],
    icon: Image,
    gradient: 'from-blue-500 to-indigo-600',
    category: 'Design'
  },
  {
    id: 19,
    name: 'Stealth Writer',
    description: 'Advanced AI content creation tool with plagiarism avoidance',
    price: 449,
    features: [
      'AI-powered content generation',
      'Plagiarism detection & avoidance',
      'Multiple writing styles',
      'SEO optimization',
      'Content repurposing'
    ],
    icon: Pen,
    gradient: 'from-indigo-500 to-blue-600',
    category: 'AI'
  },
  {
    id: 20,
    name: 'Hix Bypass',
    description: 'Advanced content protection bypass tool for researchers',
    price: 299,
    features: [
      'Content access tools',
      'Research assistance',
      'Data extraction',
      'Academic resources',
      'Customizable settings'
    ],
    icon: Lock,
    gradient: 'from-amber-500 to-orange-600',
    category: 'Research'
  }
];