import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const Privacy = () => {
  return (
    <div className="min-h-screen pt-20 bg-gradient-to-br from-gray-900 via-purple-950 to-gray-900">
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8 flex items-center">
          <Link to="/" className="text-indigo-400 hover:text-indigo-300 transition-colors mr-4">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-3xl font-bold text-white">Privacy Policy</h1>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-xl p-8">
          <div className="prose prose-invert max-w-none">
            <h2 className="text-2xl font-semibold text-white mb-6">1. Information We Collect</h2>
            <p className="text-indigo-200 mb-4">We collect the following types of information:</p>
            <ul className="list-disc list-inside text-indigo-200 mb-6 space-y-2">
              <li>Account information (name, email, password)</li>
              <li>Payment information</li>
              <li>Usage data and analytics</li>
              <li>Communication preferences</li>
            </ul>

            <h2 className="text-2xl font-semibold text-white mb-6">2. How We Use Your Information</h2>
            <p className="text-indigo-200 mb-4">Your information is used to:</p>
            <ul className="list-disc list-inside text-indigo-200 mb-6 space-y-2">
              <li>Provide and improve our services</li>
              <li>Process payments and tool access</li>
              <li>Send important updates and notifications</li>
              <li>Analyze service usage and performance</li>
            </ul>

            <h2 className="text-2xl font-semibold text-white mb-6">3. Data Security</h2>
            <p className="text-indigo-200 mb-6">
              We implement industry-standard security measures to protect your data. However, no method of transmission over the internet is 100% secure.
            </p>

            <h2 className="text-2xl font-semibold text-white mb-6">4. Data Sharing</h2>
            <p className="text-indigo-200 mb-6">
              We do not sell your personal information. We may share data with trusted service providers who assist in operating our services.
            </p>

            <h2 className="text-2xl font-semibold text-white mb-6">5. Your Rights</h2>
            <p className="text-indigo-200 mb-4">You have the right to:</p>
            <ul className="list-disc list-inside text-indigo-200 mb-6 space-y-2">
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Request data deletion</li>
              <li>Opt-out of marketing communications</li>
            </ul>

            <h2 className="text-2xl font-semibold text-white mb-6">6. Contact Us</h2>
            <p className="text-indigo-200">
              For privacy-related inquiries, please contact us at aryansingh2611@outlook.com
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Privacy;