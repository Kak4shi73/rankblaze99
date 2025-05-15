import { useState, useEffect } from 'react';
import { ChevronRight } from 'lucide-react';

const HeroSection = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    document.addEventListener('scroll', handleScroll);
    return () => {
      document.removeEventListener('scroll', handleScroll);
    };
  }, [scrolled]);

  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-royal-400/20 rounded-full filter blur-[128px] opacity-30 animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-royal-500/20 rounded-full filter blur-[128px] opacity-30 animate-pulse" style={{animationDelay: '1s'}}></div>
      </div>
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="flex flex-col items-center justify-center text-center">
          <h1 className="font-playfair text-5xl md:text-7xl font-bold mb-16 tracking-tighter">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-royal-300 to-royal-500 animate-text-gradient">Stack More,</span> <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-royal-300 to-royal-500 animate-text-gradient animation-delay-1000">Pay Less</span>
          </h1>
          
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <a 
              href="/tools" 
              className="px-8 py-3 rounded-full bg-gradient-to-r from-royal-400 to-royal-600 text-navy-950 font-medium text-lg transition-all duration-300 hover:shadow-luxury transform hover:-translate-y-1"
            >
              Start Saving Today
            </a>
            <a 
              href="/tools" 
              className="px-8 py-3 rounded-full bg-cream-100/10 backdrop-blur-sm border border-cream-200/20 text-cream-100 font-medium text-lg transition-all duration-300 hover:bg-cream-100/20"
            >
              View Plans
            </a>
          </div>

          <p className="font-ibm-plex text-xl md:text-2xl max-w-3xl mx-auto mb-20 leading-relaxed text-cream-100">
            Next-Gen Subscriptions for the tools you love. Access premium developer tools and services at a fraction of the cost.
          </p>
          
          <div className="flex justify-center items-center gap-8 mt-12">
            <div className="text-center mb-4 opacity-75 transition-opacity hover:opacity-100">
              <img 
                src="https://images.pexels.com/photos/8088451/pexels-photo-8088451.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1" 
                alt="Trusted by developers" 
                className="h-12 w-12 object-cover rounded-full mx-auto mb-3 border-2 border-royal-400/30" 
              />
              <p className="text-sm font-montserrat text-cream-200">Trusted by 10,000+ developers</p>
            </div>
            {/* Premium Support temporarily hidden 
            <div className="text-center mb-4 opacity-75 transition-opacity hover:opacity-100">
              <img 
                src="https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1" 
                alt="24/7 Support" 
                className="h-12 w-12 object-cover rounded-full mx-auto mb-3 border-2 border-royal-400/30" 
              />
              <p className="text-sm font-montserrat text-cream-200">24/7 Premium Support</p>
            </div>
            */}
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce">
        <ChevronRight className="h-10 w-10 rotate-90 text-cream-200 opacity-75" />
      </div>
    </section>
  );
};

export default HeroSection;