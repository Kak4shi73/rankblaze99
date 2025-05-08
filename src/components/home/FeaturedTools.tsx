import { useState } from 'react';
import { Plus, Check, ArrowRight } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';

const tools = [
  {
    id: 101,
    name: 'Code Conductor',
    description: 'AI-powered code generation and optimization',
    price: 19.99,
    tags: ['AI', 'Development'],
    imageUrl: 'https://images.pexels.com/photos/11035471/pexels-photo-11035471.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
  },
  {
    id: 102,
    name: 'DevOps Master',
    description: 'Streamline your CI/CD pipeline and deployment',
    price: 24.99,
    tags: ['DevOps', 'Cloud'],
    imageUrl: 'https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
  },
  {
    id: 103,
    name: 'Database Wizard',
    description: 'Optimize and manage your databases with ease',
    price: 17.99,
    tags: ['Database', 'Performance'],
    imageUrl: 'https://images.pexels.com/photos/8088457/pexels-photo-8088457.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
  },
  {
    id: 104,
    name: 'Security Shield',
    description: 'Protect your applications from vulnerabilities',
    price: 29.99,
    tags: ['Security', 'Compliance'],
    imageUrl: 'https://images.pexels.com/photos/5380642/pexels-photo-5380642.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
  },
];

const FeaturedTools = () => {
  const { addToCart, isInCart } = useCart();
  const { showToast } = useToast();
  const [hoveredTool, setHoveredTool] = useState<number | null>(null);

  const handleAddToCart = (tool: any) => {
    addToCart({
      id: tool.id,
      name: tool.name,
      price: tool.price,
      type: 'tool'
    });
    showToast(`${tool.name} added to cart`, 'success');
  };

  return (
    <section className="py-20 px-6 md:px-10 bg-gradient-to-b from-gray-900 to-indigo-950">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 to-purple-300">
            Premium Developer Tools
          </h2>
          <p className="text-lg max-w-3xl mx-auto mb-6 text-indigo-100 opacity-80">
            Supercharge your workflow with our comprehensive suite of professional developer tools.
          </p>
          <a 
            href="/tools"
            className="inline-flex items-center text-amber-400 hover:text-amber-300 transition-colors"
          >
            View all tools <ArrowRight className="ml-2 h-4 w-4" />
          </a>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {tools.map((tool) => (
            <div 
              key={tool.id}
              className="relative bg-gradient-to-b from-gray-800 to-gray-900 rounded-xl overflow-hidden border border-gray-700 shadow-lg transition-all duration-300 hover:shadow-purple-500/10 hover:-translate-y-1"
              onMouseEnter={() => setHoveredTool(tool.id)}
              onMouseLeave={() => setHoveredTool(null)}
            >
              <div className="h-48 overflow-hidden">
                <img 
                  src={tool.imageUrl} 
                  alt={tool.name} 
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                />
              </div>
              
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-white">{tool.name}</h3>
                  <span className="text-amber-400 font-semibold">${tool.price}/mo</span>
                </div>
                
                <p className="text-indigo-200 mb-6 text-sm">{tool.description}</p>
                
                <div className="flex flex-wrap gap-2 mb-6">
                  {tool.tags.map((tag, index) => (
                    <span 
                      key={index}
                      className="text-xs bg-indigo-900/50 text-indigo-200 px-2 py-1 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                
                <button
                  onClick={() => handleAddToCart(tool)}
                  disabled={isInCart(tool.id)}
                  className={`w-full flex items-center justify-center py-2 px-4 rounded-lg transition-all duration-300 ${
                    isInCart(tool.id)
                      ? 'bg-green-900/50 text-green-400 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  }`}
                >
                  {isInCart(tool.id) ? (
                    <>
                      <Check className="h-5 w-5 mr-2" />
                      Added to Cart
                    </>
                  ) : (
                    <>
                      <Plus className="h-5 w-5 mr-2" />
                      Add to Cart
                    </>
                  )}
                </button>
              </div>
              
              {/* Hover glow effect */}
              <div 
                className={`absolute inset-0 bg-purple-500/10 opacity-0 transition-opacity duration-300 pointer-events-none ${
                  hoveredTool === tool.id ? 'opacity-100' : ''
                }`}
              ></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedTools;