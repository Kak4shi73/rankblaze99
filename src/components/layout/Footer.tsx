import { Facebook, Twitter, Instagram, Github, Linkedin, Mail, MapPin, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';
import Logo from '../ui/Logo';

const Footer = () => {
  return (
    <footer className="bg-gray-900 border-t border-gray-800">
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          <div>
            <div className="flex items-center mb-6">
              <Logo className="h-8 w-8" />
              <span className="ml-2 text-xl font-bold text-white">RANKBLAZE</span>
            </div>
            <p className="text-indigo-200 mb-6 max-w-xs">
              Next-Gen Subscriptions for developers. Access premium tools and services at a fraction of the cost.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-amber-400 transition-colors">
                <Twitter className="h-5 w-5" />
                <span className="sr-only">Twitter</span>
              </a>
              <a href="#" className="text-gray-400 hover:text-amber-400 transition-colors">
                <Facebook className="h-5 w-5" />
                <span className="sr-only">Facebook</span>
              </a>
              <a href="#" className="text-gray-400 hover:text-amber-400 transition-colors">
                <Instagram className="h-5 w-5" />
                <span className="sr-only">Instagram</span>
              </a>
              <a href="#" className="text-gray-400 hover:text-amber-400 transition-colors">
                <Github className="h-5 w-5" />
                <span className="sr-only">GitHub</span>
              </a>
              <a href="#" className="text-gray-400 hover:text-amber-400 transition-colors">
                <Linkedin className="h-5 w-5" />
                <span className="sr-only">LinkedIn</span>
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-bold text-white mb-6">Quick Links</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/" className="text-indigo-200 hover:text-amber-400 transition-colors">Home</Link>
              </li>
              <li>
                <Link to="/tools" className="text-indigo-200 hover:text-amber-400 transition-colors">Tools</Link>
              </li>
              <li>
                <a href="/about" target="_blank" rel="noopener noreferrer" className="text-indigo-200 hover:text-amber-400 transition-colors">About Us</a>
              </li>
              <li>
                <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-indigo-200 hover:text-amber-400 transition-colors">Terms & Conditions</a>
              </li>
              <li>
                <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-indigo-200 hover:text-amber-400 transition-colors">Privacy Policy</a>
              </li>
              <li>
                <a href="/refund" target="_blank" rel="noopener noreferrer" className="text-indigo-200 hover:text-amber-400 transition-colors">Refund Policy</a>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-bold text-white mb-6">Contact Us</h3>
            <ul className="space-y-4">
              <li className="flex">
                <MapPin className="h-5 w-5 text-amber-400 mr-3 shrink-0 mt-1" />
                <span className="text-indigo-200">
                  Sarai Khwaja<br />
                  Faridabad, Haryana<br />
                  Pincode: 121003
                </span>
              </li>
              <li className="flex items-center">
                <Phone className="h-5 w-5 text-amber-400 mr-3 shrink-0" />
                <div className="flex flex-col space-y-2">
                  <a href="tel:+917982604809" className="text-indigo-200 hover:text-amber-400 transition-colors">
                    +91 7982604809
                  </a>
                  <a 
                    href="https://wa.me/917982604809" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                  >
                    <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    Chat on WhatsApp
                  </a>
                </div>
              </li>
              <li className="flex items-center">
                <Mail className="h-5 w-5 text-amber-400 mr-3 shrink-0" />
                <a href="mailto:aryansingh2611@outlook.com" className="text-indigo-200 hover:text-amber-400 transition-colors">
                  aryansingh2611@outlook.com
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-indigo-300 text-sm">
            &copy; {new Date().getFullYear()} RANKBLAZE. All rights reserved.
          </p>
          <div className="mt-4 md:mt-0">
            <ul className="flex space-x-6">
              <li>
                <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-indigo-300 hover:text-amber-400 text-sm transition-colors">
                  Terms
                </a>
              </li>
              <li>
                <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-indigo-300 hover:text-amber-400 text-sm transition-colors">
                  Privacy
                </a>
              </li>
              <li>
                <a href="/cookies" target="_blank" rel="noopener noreferrer" className="text-indigo-300 hover:text-amber-400 text-sm transition-colors">
                  Cookies
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;