import { Users, Award, Shield, Zap, ChevronRight, PackageOpen, Wallet } from 'lucide-react';

const About = () => {
  return (
    <div className="min-h-screen pt-20 bg-gradient-to-br from-gray-900 via-purple-950 to-gray-900">
      <div className="container mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 to-purple-300">
            About RANKBLAZE
          </h1>
          <p className="text-xl text-indigo-100 opacity-80 max-w-3xl mx-auto">
            Empowering developers and creators with premium tools and services
          </p>
        </div>

        {/* Mission Statement */}
        <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl p-8 mb-12 border border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-4">Our Mission</h2>
          <p className="text-indigo-200 text-lg leading-relaxed">
            At RANKBLAZE, we're on a mission to democratize access to premium developer and creative tools. We believe that everyone, regardless of their budget, should have access to the best tools in the industry. By bundling premium services at an affordable price, we're making professional tools accessible to everyone.
          </p>
        </div>

        {/* Admin Information */}
        <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl p-8 mb-12 border border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-4">Meet Our Founder</h2>
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            <div className="bg-indigo-900/30 p-6 rounded-xl border border-indigo-700 w-full md:w-auto">
              <h3 className="text-xl font-semibold text-white mb-1">Aryan Singh</h3>
              <p className="text-indigo-300 mb-4">Founder & CEO</p>
              <p className="text-indigo-200">
                Aryan is passionate about making premium tools accessible to everyone. With a background in software development and digital marketing, he founded RANKBLAZE to bridge the gap between high-quality tools and affordability.
              </p>
            </div>
          </div>
        </div>

        {/* Key Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-700">
            <div className="bg-indigo-600 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <PackageOpen className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Premium Tools</h3>
            <p className="text-indigo-200">
              Access to high-quality developer tools that boost productivity.
            </p>
          </div>

          <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-700">
            <div className="bg-purple-600 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <Wallet className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Cost Savings</h3>
            <p className="text-indigo-200">
              Save up to 90% compared to individual tool subscriptions.
            </p>
          </div>

          {/* Support section temporarily hidden 
          <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-700">
            <div className="bg-green-600 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">24/7 Support</h3>
            <p className="text-indigo-200">
              Round-the-clock support to help you resolve any issues quickly.
            </p>
          </div>
          */}
        </div>

        {/* Story Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl p-8 border border-gray-700">
            <h2 className="text-2xl font-bold text-white mb-4">Our Story</h2>
            <p className="text-indigo-200 mb-4">
              RANKBLAZE was founded with a clear vision: to make premium tools accessible to everyone. We recognized that many professionals and creators were spending too much on individual tool subscriptions, creating a significant barrier to entry for many talented individuals.
            </p>
            <p className="text-indigo-200">
              Today, we're proud to serve a global community, helping them create better projects with access to the best tools in the industry. Our commitment to accessibility, quality, and affordability continues to drive our mission forward.
            </p>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl p-8 border border-gray-700">
            <h2 className="text-2xl font-bold text-white mb-4">Our Values</h2>
            <ul className="space-y-4">
              <li className="flex items-start">
                <div className="bg-indigo-600/20 p-2 rounded-lg mr-4">
                  <ChevronRight className="h-5 w-5 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">Innovation</h3>
                  <p className="text-indigo-200">Constantly evolving and improving our services to meet user needs.</p>
                </div>
              </li>
              <li className="flex items-start">
                <div className="bg-purple-600/20 p-2 rounded-lg mr-4">
                  <ChevronRight className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">Accessibility</h3>
                  <p className="text-indigo-200">Making premium tools accessible to everyone, regardless of budget.</p>
                </div>
              </li>
              <li className="flex items-start">
                <div className="bg-amber-600/20 p-2 rounded-lg mr-4">
                  <ChevronRight className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">Quality</h3>
                  <p className="text-indigo-200">Never compromising on the quality of our tools and services.</p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-indigo-900 to-purple-900 rounded-2xl p-8 md:p-12 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Join the RANKBLAZE Community</h2>
          <p className="text-xl text-indigo-200 mb-8 max-w-2xl mx-auto">
            Be part of a growing community of professionals who are creating the future with premium tools at affordable prices.
          </p>
          <a
            href="/signup"
            className="inline-flex items-center px-8 py-3 rounded-full bg-gradient-to-r from-amber-400 to-amber-600 text-gray-900 font-medium text-lg transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/30 transform hover:-translate-y-1"
          >
            Get Started Today <ChevronRight className="ml-2 h-5 w-5" />
          </a>
        </div>
      </div>
    </div>
  );
};

export default About;