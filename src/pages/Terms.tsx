import React from 'react';
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
          <h1 className="text-3xl font-bold text-white">Terms of Service</h1>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-xl p-8">
          <div className="prose prose-invert max-w-none">
            <h2 className="text-2xl font-semibold text-white mb-6">1. Introduction</h2>
            <p className="text-gray-300 mb-6">
              These Terms of Service ("Terms") govern your use of the RANKBLAZE website and services.
              By accessing or using our services, you agree to be bound by these Terms. If you disagree with any part of the terms, please do not use our services.
            </p>

            <h2 className="text-2xl font-semibold text-white mb-6">2. Tool Access Services</h2>
            <p className="text-gray-300 mb-6">
              RANKBLAZE provides access-based tools and services. By accessing our services, you agree to:
            </p>
            <ul className="list-disc pl-6 mb-6 text-gray-300 space-y-2">
              <li>Pay the access fees as per your chosen plan</li>
              <li>Use the provided tools in compliance with all applicable laws and regulations</li>
              <li>Not share or redistribute access credentials or content</li>
              <li>Accept that tool availability and features may change</li>
            </ul>

            <h2 className="text-2xl font-semibold text-white mb-6">3. User Accounts</h2>
            <p className="text-gray-300 mb-6">
              To access certain features of RANKBLAZE, you may be required to create a user account. You are responsible for:
            </p>
            <ul className="list-disc pl-6 mb-6 text-gray-300 space-y-2">
              <li>Maintaining the confidentiality of your account credentials</li>
              <li>All activities that occur under your account</li>
              <li>Providing accurate and up-to-date information</li>
            </ul>

            <h2 className="text-2xl font-semibold text-white mb-6">4. Payment Terms</h2>
            <p className="text-gray-300 mb-6">
              Our payment terms include:
            </p>
            <ul className="list-disc pl-6 mb-6 text-gray-300 space-y-2">
              <li>All payments are processed securely through our payment providers</li>
              <li>Prices are subject to change with notice</li>
              <li>Refunds are governed by our Refund Policy</li>
              <li>Recurring payments will be automatically charged until cancellation</li>
            </ul>

            <h2 className="text-2xl font-semibold text-white mb-6">5. Intellectual Property</h2>
            <p className="text-gray-300 mb-6">
              All content on RANKBLAZE, including text, graphics, logos, and software, is the property of RANKBLAZE or its content suppliers and is protected by copyright laws.
            </p>

            <h2 className="text-2xl font-semibold text-white mb-6">6. Termination</h2>
            <p className="text-gray-300 mb-6">
              We reserve the right to terminate or suspend accounts that violate these terms. Users may cancel their tool access at any time, subject to our refund policy.
            </p>

            <h2 className="text-2xl font-semibold text-white mb-6">7. Disclaimer of Warranties</h2>
            <p className="text-gray-300 mb-6">
              RANKBLAZE services are provided "as is" and "as available" without warranties of any kind, either express or implied, including but not limited to warranties of merchantability, fitness for a particular purpose, or non-infringement.
            </p>

            <h2 className="text-2xl font-semibold text-white mb-6">8. Limitation of Liability</h2>
            <p className="text-gray-300 mb-6">
              RANKBLAZE shall not be liable for any indirect, incidental, special, or consequential damages resulting from the use or inability to use our services.
            </p>

            <h2 className="text-2xl font-semibold text-white mb-6">9. Changes to Terms</h2>
            <p className="text-gray-300 mb-6">
              RANKBLAZE reserves the right to modify these Terms at any time. We will provide notice of significant changes through our website or via email.
            </p>

            <h2 className="text-2xl font-semibold text-white mb-6">10. Contact Information</h2>
            <p className="text-gray-300 mb-6">
              For questions about these Terms, please contact us at support@rankblaze.in.
            </p>

            <h2 className="text-2xl font-semibold text-white mb-6">11. Business Management</h2>
            <p className="text-gray-300 mb-6">
              This Business managed by Aryan Singh
            </p>

            <div className="text-gray-400 mt-10 text-sm">
              Last updated: May 15, 2023
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Terms;