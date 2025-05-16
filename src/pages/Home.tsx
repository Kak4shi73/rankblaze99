import { useEffect, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import HeroSection from '../components/home/HeroSection';
import ToolsSlideshow from '../components/home/ToolsSlideshow';
import Testimonials from '../components/home/Testimonials';
import HowItWorks from '../components/home/HowItWorks';
import { useAutoToasts } from '../utils/autoToasts';

const Home = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Initialize auto toasts
  useAutoToasts();

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <div className={`transition-opacity duration-1000 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
      <HeroSection />
      <HowItWorks />
      <ToolsSlideshow />
      <Testimonials />
      
      {/* CTA Section */}
      <section className="py-20 px-6 md:px-10 bg-gradient-to-r from-indigo-900 to-purple-900">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-amber-200 to-yellow-400">
            Ready to upgrade your stack?
          </h2>
          <p className="text-lg md:text-xl max-w-3xl mx-auto mb-10 text-indigo-100">
            Join thousands of developers who are saving time and money with RANKBLAZE tool access.
          </p>
          <a 
            href="/tools" 
            className="inline-flex items-center px-8 py-3 rounded-full bg-gradient-to-r from-amber-400 to-amber-600 text-gray-900 font-medium text-lg transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/30 transform hover:-translate-y-1"
          >
            Get Started <ChevronRight className="ml-2 h-5 w-5" />
          </a>
        </div>
      </section>
    </div>
  );
};

export default Home;