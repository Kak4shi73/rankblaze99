import { Users, Award, Shield, Zap, ChevronRight } from 'lucide-react';

const About = () => {
  return (
    <div className="min-h-screen pt-20 bg-gradient-to-br from-gray-900 via-purple-950 to-gray-900">
      <div className="container mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 to-purple-300">
            About NXTGEN
          </h1>
          <p className="text-xl text-indigo-100 opacity-80 max-w-3xl mx-auto">
            Empowering developers with next-generation tools and solutions
          </p>
        </div>

        {/* Mission Statement */}
        <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl p-8 mb-12 border border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-4">Our Mission</h2>
          <p className="text-indigo-200 text-lg leading-relaxed">
            At NXTGEN, we're on a mission to democratize access to premium developer tools. We believe that every developer, regardless of their budget, should have access to the best tools in the industry. By bundling premium services at an affordable price, we're making professional development tools accessible to everyone.
          </p>
        </div>

        {/* Key Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-700">
            <div className="bg-indigo-600 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <Users className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">10,000+ Users</h3>
            <p className="text-indigo-200">
              Trusted by thousands of developers worldwide for their daily development needs.
            </p>
          </div>

          <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-700">
            <div className="bg-purple-600 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <Award className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Premium Quality</h3>
            <p className="text-indigo-200">
              Curated selection of high-quality tools and services for professional development.
            </p>
          </div>

          <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-700">
            <div className="bg-amber-600 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Secure & Reliable</h3>
            <p className="text-indigo-200">
              Enterprise-grade security and reliability for all our services and tools.
            </p>
          </div>

          <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-700">
            <div className="bg-green-600 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">24/7 Support</h3>
            <p className="text-indigo-200">
              Round-the-clock support to help you resolve any issues quickly.
            </p>
          </div>
        </div>

        {/* Story Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl p-8 border border-gray-700">
            <h2 className="text-2xl font-bold text-white mb-4">Our Story</h2>
            <p className="text-indigo-200 mb-4">
              Founded in 2025, NXTGEN emerged from a simple observation: developers were spending too much on individual tool subscriptions. We saw an opportunity to create a platform that would bundle premium tools together, making them more accessible and affordable.
            </p>
            <p className="text-indigo-200">
              Today, we're proud to serve a global community of developers, helping them build better software with access to the best tools in the industry. Our commitment to innovation, quality, and affordability continues to drive our mission forward.
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
                  <p className="text-indigo-200">Constantly evolving and improving our services to meet developer needs.</p>
                </div>
              </li>
              <li className="flex items-start">
                <div className="bg-purple-600/20 p-2 rounded-lg mr-4">
                  <ChevronRight className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">Accessibility</h3>
                  <p className="text-indigo-200">Making premium tools accessible to developers of all backgrounds.</p>
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
          <h2 className="text-3xl font-bold text-white mb-4">Join the NXTGEN Community</h2>
          <p className="text-xl text-indigo-200 mb-8 max-w-2xl mx-auto">
            Be part of the next generation of developers who are building the future with premium tools at affordable prices.
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