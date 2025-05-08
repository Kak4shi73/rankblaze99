import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const Terms = () => {
  return (
    <div className="min-h-screen pt-20 bg-gradient-to-br from-gray-900 via-purple-950 to-gray-900">
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8 flex items-center">
          <Link to="/" className="text-indigo-400 hover:text-indigo-300 transition-colors mr-4">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-3xl font-bold text-white">Terms & Conditions</h1>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-xl p-8">
          <div className="prose prose-invert max-w-none">
            <h2 className="text-2xl font-semibold text-white mb-6">1. Acceptance of Terms</h2>
            <p className="text-indigo-200 mb-6">
              By accessing and using NXTGEN's services, you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our services.
            </p>

            <h2 className="text-2xl font-semibold text-white mb-6">2. Subscription Services</h2>
            <p className="text-indigo-200 mb-4">
              NXTGEN provides subscription-based access to developer tools and services. By subscribing to our services, you agree to:
            </p>
            <ul className="list-disc list-inside text-indigo-200 mb-6 space-y-2">
              <li>Pay the subscription fees as per your chosen plan</li>
              <li>Use the services in accordance with these terms</li>
              <li>Maintain the confidentiality of your account credentials</li>
              <li>Accept responsibility for all activities under your account</li>
            </ul>

            <h2 className="text-2xl font-semibold text-white mb-6">3. User Obligations</h2>
            <p className="text-indigo-200 mb-6">
              Users must not:
            </p>
            <ul className="list-disc list-inside text-indigo-200 mb-6 space-y-2">
              <li>Share account access with unauthorized users</li>
              <li>Use the services for illegal purposes</li>
              <li>Attempt to circumvent security measures</li>
              <li>Reverse engineer the services</li>
            </ul>

            <h2 className="text-2xl font-semibold text-white mb-6">4. Intellectual Property</h2>
            <p className="text-indigo-200 mb-6">
              All content, trademarks, and intellectual property on NXTGEN belong to us or our licensors. Users may not copy, modify, or distribute our content without permission.
            </p>

            <h2 className="text-2xl font-semibold text-white mb-6">5. Termination</h2>
            <p className="text-indigo-200 mb-6">
              We reserve the right to terminate or suspend accounts that violate these terms. Users may cancel their subscription at any time, subject to our refund policy.
            </p>

            <h2 className="text-2xl font-semibold text-white mb-6">6. Changes to Terms</h2>
            <p className="text-indigo-200 mb-6">
              NXTGEN may modify these terms at any time. Continued use of our services after changes constitutes acceptance of the new terms.
            </p>

            <h2 className="text-2xl font-semibold text-white mb-6">7. Contact</h2>
            <p className="text-indigo-200">
              For questions about these terms, please contact us at aryansingh2611@outlook.com
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Terms;