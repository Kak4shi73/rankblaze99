/**
 * Site Configuration File
 * Contains settings specific to the RANKBLAZE site
 */

export const siteConfig = {
  name: 'RANKBLAZE',
  description: 'Stack More, Pay Less. RANKBLAZE provides premium developer tools and services at a fraction of the cost.',
  url: import.meta.env.VITE_SITE_URL || 'https://rankblaze.in',
  logoUrl: '/vite.svg',
  author: 'RANKBLAZE Team',
  showTemporaryTools: true,
  social: {
    twitter: '@rankblaze',
    facebook: 'rankblaze',
    instagram: 'rankblaze',
    linkedin: 'rankblaze'
  },
  contact: {
    email: 'aryansingh2611@outlook.com',
    phone: '',
    address: ''
  },
  navigation: [
    { name: 'Home', path: '/' },
    { name: 'Features', path: '/features' },
    { name: 'Pricing', path: '/pricing' },
    { name: 'About', path: '/about' },
    { name: 'Contact', path: '/contact' }
  ]
};

export default siteConfig; 