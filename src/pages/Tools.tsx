import React from 'react';
import { Search, Plus, Check } from 'lucide-react';
import { toolsData } from '../data/tools';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

// Define proper types for tools
interface Tool {
  id: number;
  name: string;
  description: string;
  price: number;
  features: string[];
  icon: any;
  gradient: string;
  category?: string;
  hidden?: boolean;
  route?: string;
}

const Tools = () => {
  // List of tools to hide
  const toolsToHide = [
    "LinkedIn Learning",
    "Netflix Premium",
    "YouTube Premium",
    "Spotify Premium",
    "Canva Pro",
    "ChatGPT Plus",
    "Grammarly"
  ];

  // Get tools and filter out the ones we want to hide
  const allTools = toolsData ? toolsData.filter(tool => !toolsToHide.includes(tool.name)) : [];
  const { addToCart, isInCart } = useCart();
  const { showToast } = useToast();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  // Map tool names to their exact tool IDs for the tool access page
  // These IDs must match the keys in TOOL_INFO in ToolAccess.tsx
  const toolRouteMap: Record<string, string> = {
    'Envato Elements': 'envato_elements',
    'Storyblocks': 'storyblocks',
    'SEMrush': 'semrush',
    'Helium10': 'helium10', // Make sure this ID exists in ToolAccess component
    'Writesonic': 'stealth_writer',
    'Leonardo.ai': 'leonardo_ai', // Make sure this ID exists in ToolAccess component
    'Coursera': 'coursera', // Make sure this ID exists in ToolAccess component
    'Skillshare': 'skillshare' // Make sure this ID exists in ToolAccess component
  };
  
  const handleAddToCart = (tool: Tool) => {
    try {
      const stringId = tool.id.toString();
      addToCart({
        id: stringId,
        name: tool.name,
        price: tool.price,
        type: 'tool',
        quantity: 1
      });
      showToast(`${tool.name} added to cart`, 'success');
    } catch (error) {
      console.error('Error adding to cart:', error);
      showToast('Failed to add item to cart', 'error');
    }
  };
  
  const handleViewDetails = (e: React.MouseEvent, tool: Tool) => {
    e.preventDefault(); // Prevent default button behavior
    
    // Use the mapping if available, otherwise use ID with prefix "tool_"
    const toolRouteId = toolRouteMap[tool.name] || `tool_${tool.id}`;
    
    if (isAuthenticated) {
      // User is authenticated, navigate to tool access page
      navigate(`/tool-access/${toolRouteId}`);
    } else {
      // User is not authenticated, show toast and navigate to login
      showToast('Please sign in to view tool details', 'info');
      // Save the intended destination as a URL parameter
      navigate(`/login?redirect=/tool-access/${toolRouteId}`);
    }
  };
  
  return (
    <div className="container mx-auto py-16 px-4 max-w-7xl">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-white mb-4">
          Premium Developer Tools
        </h1>
        <p className="text-lg text-royal-300">
          Access professional tools at a fraction of the price.
        </p>
      </div>

      {/* Simple tools grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {allTools.map((tool) => {
          const stringId = tool.id.toString();
          const inCart = isInCart(stringId);
          
          return (
            <div key={tool.id} className="bg-navy-800/90 p-6 rounded-xl border border-royal-500/20 hover:border-royal-400/40 transition-all duration-300 hover:shadow-lg hover:shadow-royal-500/10">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg bg-gradient-to-br ${tool.gradient || 'from-gray-500 to-gray-600'}`}>
                  {tool.icon && React.createElement(tool.icon, { className: "h-5 w-5 text-white" })}
                </div>
                <div className="text-xl font-bold text-royal-100">
                  ₹{tool.price || 0}
                  <span className="text-sm text-royal-300 ml-1">/mo</span>
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-royal-100 mb-2">{tool.name}</h3>
              <p className="text-royal-300 text-sm mb-4 line-clamp-2">{tool.description}</p>
              
              <div className="flex space-x-3">
                <button 
                  onClick={(e) => handleViewDetails(e, tool)}
                  className="flex-1 py-2 px-4 bg-navy-700 text-royal-200 rounded-lg hover:bg-navy-600 transition-colors border border-royal-500/20 text-center"
                >
                  View Details
                </button>
                <button 
                  onClick={() => handleAddToCart(tool)}
                  disabled={inCart}
                  className={`flex-1 flex items-center justify-center py-2 px-4 rounded-lg font-medium transition-all ${
                    inCart
                      ? 'bg-green-900/50 text-green-400 cursor-not-allowed border border-green-500/20'
                      : 'bg-gradient-to-r from-royal-400 to-royal-600 text-navy-950 hover:shadow-lg hover:shadow-royal-500/20'
                  }`}
                >
                  {inCart ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Added
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Add to Cart
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {allTools.length === 0 && (
        <div className="text-center py-16">
          <h3 className="text-2xl text-red-400 mb-4">No tools found</h3>
          <p className="text-royal-300">The tools data appears to be empty.</p>
        </div>
      )}
    </div>
  );
};

export default Tools;