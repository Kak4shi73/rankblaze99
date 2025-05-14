import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import FAQContent from '../components/home/FAQ';

const FAQ = () => {
  return (
    <div className="min-h-screen pt-20 bg-gradient-to-br from-gray-900 via-purple-950 to-gray-900">
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8 flex items-center">
          <Link to="/" className="text-indigo-400 hover:text-indigo-300 transition-colors mr-4">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-3xl font-bold text-white">Frequently Asked Questions</h1>
        </div>

        <FAQContent />
      </div>
    </div>
  );
};

export default FAQ; 