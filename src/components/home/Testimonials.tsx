import { useState, useEffect } from 'react';
import { Star, ChevronLeft, ChevronRight } from 'lucide-react';

const testimonials = [
  {
    id: 1,
    name: 'Alex Johnson',
    role: 'Senior Frontend Developer',
    company: 'TechSolutions Inc.',
    quote: 'NXTGEN has revolutionized my development workflow. I now have access to premium tools that were previously out of my budget. The savings are remarkable!',
    avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    rating: 5
  },
  {
    id: 2,
    name: 'Sarah Chen',
    role: 'DevOps Engineer',
    company: 'CloudScale',
    quote: 'As a DevOps engineer, I need access to a wide range of tools. NXTGEN\'s subscription model has saved our team thousands of dollars while enhancing our capabilities.',
    avatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    rating: 5
  },
  {
    id: 3,
    name: 'Michael Rodriguez',
    role: 'CTO',
    company: 'StartupX',
    quote: 'For our growing startup, NXTGEN has been a game-changer. We get enterprise-level tools at a fraction of the cost, allowing us to compete with much larger companies.',
    avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    rating: 4
  },
];

const Testimonials = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const goToNext = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex((prevIndex) => (prevIndex + 1) % testimonials.length);
    setTimeout(() => setIsAnimating(false), 500);
  };

  const goToPrev = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex((prevIndex) => (prevIndex - 1 + testimonials.length) % testimonials.length);
    setTimeout(() => setIsAnimating(false), 500);
  };

  useEffect(() => {
    const timer = setInterval(goToNext, 8000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="py-20 px-6 md:px-10 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-1/3 left-10 w-72 h-72 bg-purple-600 rounded-full filter blur-[128px] opacity-10"></div>
      <div className="absolute bottom-1/3 right-10 w-72 h-72 bg-indigo-600 rounded-full filter blur-[128px] opacity-10"></div>
      
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 to-purple-300">
            What Our Users Say
          </h2>
          <p className="text-lg max-w-3xl mx-auto mb-10 text-indigo-100 opacity-80">
            Join thousands of developers who are already saving with NXTGEN subscriptions.
          </p>
        </div>
        
        <div className="relative">
          {/* Testimonial cards */}
          <div className="overflow-hidden">
            <div 
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {testimonials.map((testimonial) => (
                <div 
                  key={testimonial.id}
                  className="w-full flex-shrink-0 px-4"
                >
                  <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 md:p-10 shadow-xl border border-gray-700">
                    <div className="flex items-center mb-6">
                      <img 
                        src={testimonial.avatar} 
                        alt={testimonial.name} 
                        className="w-16 h-16 rounded-full object-cover border-2 border-indigo-500"
                      />
                      <div className="ml-4">
                        <h3 className="text-xl font-bold text-white">{testimonial.name}</h3>
                        <p className="text-indigo-300">{testimonial.role}, {testimonial.company}</p>
                      </div>
                    </div>
                    
                    <p className="text-lg text-indigo-100 mb-6 italic leading-relaxed">"{testimonial.quote}"</p>
                    
                    <div className="flex text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i}
                          className={`h-5 w-5 ${i < testimonial.rating ? 'fill-current' : ''}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Navigation buttons */}
          <button 
            onClick={goToPrev}
            className="absolute top-1/2 left-2 md:left-4 transform -translate-y-1/2 bg-gray-800/80 text-white p-2 rounded-full transition hover:bg-gray-700"
            aria-label="Previous testimonial"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          
          <button 
            onClick={goToNext}
            className="absolute top-1/2 right-2 md:right-4 transform -translate-y-1/2 bg-gray-800/80 text-white p-2 rounded-full transition hover:bg-gray-700"
            aria-label="Next testimonial"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
          
          {/* Dots indicator */}
          <div className="flex justify-center mt-8 space-x-2">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  if (isAnimating) return;
                  setIsAnimating(true);
                  setCurrentIndex(index);
                  setTimeout(() => setIsAnimating(false), 500);
                }}
                className={`w-3 h-3 rounded-full transition-colors duration-300 ${
                  index === currentIndex ? 'bg-indigo-500' : 'bg-gray-600'
                }`}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;