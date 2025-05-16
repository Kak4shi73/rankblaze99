import { 
  Search, FileText, Globe, Lock, Zap, Code, BarChart, FileSearch
} from 'lucide-react';

interface TemporaryTool {
  id: number;
  name: string;
  description: string;
  price: number;
  features: string[];
  icon: any;
  gradient: string;
  category: string;
  route: string;
}

export const temporaryToolsData: TemporaryTool[] = [
  {
    id: 1,
    name: 'Meta Tag Analyzer',
    description: 'Analyze and optimize your website meta tags for better SEO performance',
    price: 99,
    features: [
      'Full meta tag scan',
      'SEO recommendations',
      'Title and description analysis',
      'Social media preview'
    ],
    icon: Search,
    gradient: 'from-blue-500 to-cyan-600',
    category: 'SEO',
    route: '/tool/meta-analyzer'
  },
  {
    id: 2,
    name: 'Word Count Tool',
    description: 'Count words, characters, and paragraphs in any text content',
    price: 49,
    features: [
      'Word count',
      'Character count',
      'Paragraph statistics',
      'Reading time estimation'
    ],
    icon: FileText,
    gradient: 'from-green-500 to-emerald-600',
    category: 'Content',
    route: '/tool/word-count'
  },
  {
    id: 3,
    name: 'Robots.txt Tester',
    description: 'Test and validate your robots.txt file for proper search engine crawling',
    price: 79,
    features: [
      'Syntax validation',
      'Crawler simulation',
      'Access rules testing',
      'SEO recommendations'
    ],
    icon: FileSearch,
    gradient: 'from-yellow-500 to-orange-600',
    category: 'SEO',
    route: '/tool/robots-tester'
  },
  {
    id: 4,
    name: 'SSL Checker',
    description: 'Verify SSL certificate status and security of your website',
    price: 89,
    features: [
      'Certificate validation',
      'Expiration alerts',
      'Security protocol check',
      'Vulnerability scanning'
    ],
    icon: Lock,
    gradient: 'from-green-600 to-teal-600',
    category: 'Security',
    route: '/tool/ssl-checker'
  },
  {
    id: 5,
    name: 'HTTP Status Checker',
    description: 'Check HTTP status codes and response headers for any URL',
    price: 69,
    features: [
      'Status code verification',
      'Response header analysis',
      'Redirect chain tracking',
      'Performance metrics'
    ],
    icon: Globe,
    gradient: 'from-purple-500 to-indigo-600',
    category: 'Development',
    route: '/tool/http-checker'
  },
  {
    id: 6,
    name: 'JSON Formatter',
    description: 'Format, validate and beautify JSON data with ease',
    price: 59,
    features: [
      'JSON formatting',
      'Syntax validation',
      'Tree view visualization',
      'Minification option'
    ],
    icon: Code,
    gradient: 'from-red-500 to-pink-600',
    category: 'Development',
    route: '/tool/json-formatter'
  },
  {
    id: 7,
    name: 'Base64 Encode/Decode',
    description: 'Easily encode and decode Base64 strings and files',
    price: 49,
    features: [
      'Text encoding/decoding',
      'File encoding/decoding',
      'URL-safe Base64 support',
      'Batch processing'
    ],
    icon: Zap,
    gradient: 'from-blue-600 to-indigo-600',
    category: 'Development',
    route: '/tool/base64'
  },
  {
    id: 8,
    name: 'Keyword Density Checker',
    description: 'Analyze keyword usage and density in your content',
    price: 79,
    features: [
      'Keyword frequency analysis',
      'Density percentage calculation',
      'Keyword suggestions',
      'SEO recommendations'
    ],
    icon: BarChart,
    gradient: 'from-orange-500 to-red-600',
    category: 'SEO',
    route: '/tool/keyword-density'
  },
]; 