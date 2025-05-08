import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const RefundPolicy = () => {
  return (
    <div className="min-h-screen pt-20 bg-gradient-to-br from-gray-900 via-purple-950 to-gray-900">
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8 flex items-center">
          <Link to="/" className="text-indigo-400 hover:text-indigo-300 transition-colors mr-4">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-3xl font-bold text-white">Refund Policy</h1>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-xl p-8">
          <div className="prose prose-invert max-w-none">
            <h2 className="text-2xl font-semibold text-white mb-6">1. Eligibility for Refunds</h2>
            <p className="text-indigo-200 mb-4">Refunds are available for:</p>
            <ul className="list-disc list-inside text-indigo-200 mb-6 space-y-2">
              <li>Technical issues preventing service use</li>
              <li>Incorrect subscription charges</li>
              <li>Service unavailability</li>
            </ul>

            <h2 className="text-2xl font-semibold text-white mb-6">2. Non-Refundable Items</h2>
            <p className="text-indigo-200 mb-4">The following are not eligible for refunds:</p>
            <ul className="list-disc list-inside text-indigo-200 mb-6 space-y-2">
              <li>Partial month usage</li>
              <li>Add-on services</li>
              <li>Account termination due to terms violation</li>
            </ul>

            <h2 className="text-2xl font-semibold text-white mb-6">3. Refund Process</h2>
            <p className="text-indigo-200 mb-4">To request a refund:</p>
            <ul className="list-disc list-inside text-indigo-200 mb-6 space-y-2">
              <li>Contact our support team</li>
              <li>Provide your account details</li>
              <li>Explain your refund reason</li>
              <li>Allow 5-10 business days for processing</li>
            </ul>

            <h2 className="text-2xl font-semibold text-white mb-6">4. Contact Information</h2>
            <p className="text-indigo-200">
              For refund requests or questions, please contact us at:<br />
              Email: aryansingh2611@outlook.com<br />
              Phone: +91 7982604809
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RefundPolicy;