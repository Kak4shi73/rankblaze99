import { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';

const tools = [
  {
    id: 201,
    name: 'ChatGPT',
    description: 'Premium shared access to advanced AI language model',
    image: 'https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    gradient: 'from-emerald-600 to-teal-600'
  },
  {
    id: 202,
    name: 'HixBypass',
    description: 'Advanced content restriction bypass solution',
    image: 'https://images.pexels.com/photos/5473955/pexels-photo-5473955.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    gradient: 'from-blue-600 to-indigo-600'
  },
  {
    id: 203,
    name: 'WriteHuman',
    description: 'AI-powered human-like content generation',
    image: 'https://images.pexels.com/photos/7567443/pexels-photo-7567443.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    gradient: 'from-purple-600 to-pink-600'
  },
  {
    id: 204,
    name: 'StealthWriter',
    description: 'Personal email access with advanced features',
    image: 'https://images.pexels.com/photos/4050291/pexels-photo-4050291.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    gradient: 'from-red-600 to-orange-600'
  }
];

const ToolsSlideshow = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % tools.length);
        setIsAnimating(false);
      }, 500);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const currentTool = tools[currentIndex];

  return (
    <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 md:px-10 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className={`absolute inset-0 transition-opacity duration-1000 ${isAnimating ? 'opacity-0' : 'opacity-20'}`}>
          <div className={`absolute top-1/4 left-1/4 w-64 h-64 sm:w-96 sm:h-96 rounded-full filter blur-[80px] sm:blur-[128px] bg-gradient-to-br ${currentTool.gradient}`} />
          <div className={`absolute bottom-1/4 right-1/4 w-64 h-64 sm:w-96 sm:h-96 rounded-full filter blur-[80px] sm:blur-[128px] bg-gradient-to-br ${currentTool.gradient}`} />
        </div>
      </div>

      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8 sm:mb-12 md:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6 bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 to-purple-300">
            Featured Tools
          </h2>
          <p className="text-base sm:text-lg max-w-xs sm:max-w-lg md:max-w-3xl mx-auto mb-6 sm:mb-10 text-indigo-100 opacity-80">
            Discover our premium collection of developer tools
          </p>
        </div>

        <div className="relative">
          <div className="overflow-hidden rounded-xl sm:rounded-2xl">
            <div 
              className="relative aspect-[16/9] transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              <div className="absolute inset-0 flex">
                {tools.map((tool, index) => (
                  <div
                    key={tool.id}
                    className="relative w-full flex-shrink-0"
                  >
                    <div className="absolute inset-0">
                      <img
                        src={tool.image}
                        alt={tool.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-900/80 to-transparent" />
                    </div>
                    
                    <div className={`relative h-full flex items-center p-4 sm:p-8 md:p-12 transition-opacity duration-500 ${
                      currentIndex === index ? 'opacity-100' : 'opacity-0'
                    }`}>
                      <div className="max-w-xl">
                        <h3 className={`text-2xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-4 bg-clip-text text-transparent bg-gradient-to-r ${tool.gradient}`}>
                          {tool.name}
                        </h3>
                        <p className="text-base sm:text-lg md:text-xl text-white mb-4 sm:mb-6 md:mb-8">
                          {tool.description}
                        </p>
                        <a
                          href="/tools"
                          className={`inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 rounded-lg bg-gradient-to-r ${tool.gradient} text-white font-medium text-sm sm:text-base transition-all duration-300 hover:shadow-lg hover:shadow-current/30 transform hover:-translate-y-1`}
                        >
                          Learn More <ArrowRight className="ml-1 sm:ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Progress Indicators */}
          <div className="flex justify-center mt-4 sm:mt-8 space-x-2 sm:space-x-3">
            {tools.map((_, index) => (
              <div
                key={index}
                className={`h-1 transition-all duration-500 rounded-full ${
                  currentIndex === index 
                    ? 'w-5 sm:w-8 bg-white' 
                    : 'w-3 sm:w-4 bg-gray-600'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ToolsSlideshow;