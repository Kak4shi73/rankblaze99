import { useState, useEffect, useRef } from 'react';
import { Plus, Check, X, ExternalLink } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';

interface ToolCardProps {
  tool: {
    id: number;
    name: string;
    description: string;
    price: number;
    features: string[];
    icon: any;
    gradient: string;
  };
}

const ToolCard = ({ tool }: ToolCardProps) => {
  const { addToCart, isInCart } = useCart();
  const { showToast } = useToast();
  const [showFeatures, setShowFeatures] = useState(false);
  const Icon = tool.icon;
  const razorpayFormRef = useRef<HTMLFormElement>(null);

  const handleAddToCart = () => {
    addToCart({
      id: tool.id,
      name: tool.name,
      price: tool.price,
      type: 'tool'
    });
    showToast(`${tool.name} added to cart`, 'success');
  };

  // Effect to inject Razorpay script for ChatGPT Plus
  useEffect(() => {
    if (tool.id === 1 && razorpayFormRef.current) {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/payment-button.js';
      script.async = true;
      script.setAttribute('data-payment_button_id', 'pl_QVxRci16PfcNMb');
      razorpayFormRef.current.innerHTML = '';
      razorpayFormRef.current.appendChild(script);
    }
  }, [tool.id]);

  // Render Razorpay button for ChatGPT Plus (id: 1) or standard cart button for others
  const renderActionButton = () => {
    if (tool.id === 1) {
      return (
        <form ref={razorpayFormRef} className="flex-1"></form>
      );
    }

    return (
      <button
        onClick={handleAddToCart}
        disabled={isInCart(tool.id)}
        className={`flex-1 flex items-center justify-center py-3 px-4 rounded-xl font-medium transition-all duration-300 ${
          isInCart(tool.id)
            ? 'bg-green-900/50 text-green-400 cursor-not-allowed border border-green-500/20'
            : `bg-gradient-to-r ${tool.gradient} text-white shadow-lg hover:shadow-royal-500/25 transform hover:scale-105`
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
    );
  };

  return (
    <>
      <div className="group relative rounded-2xl transition-all duration-500 transform hover:-translate-y-2">
        {/* Card Content */}
        <div className="relative bg-navy-800/90 backdrop-blur-xl rounded-2xl border border-royal-500/20 p-8 h-full transition-all duration-300 group-hover:bg-navy-800/95 group-hover:border-royal-400/30 group-hover:shadow-lg group-hover:shadow-royal-500/10">
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-royal-500/5 to-royal-700/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Content */}
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className={`p-4 rounded-xl bg-gradient-to-br ${tool.gradient} shadow-lg transform transition-transform duration-300 group-hover:scale-110`}>
                <Icon className="h-6 w-6 text-white" />
              </div>
              <div className="text-2xl font-bold text-royal-100 font-playfair">
                ₹{tool.price}
                <span className="text-sm text-royal-300 ml-1">/mo</span>
              </div>
            </div>

            <h3 className="text-2xl font-bold text-royal-100 mb-3 font-playfair">{tool.name}</h3>
            <p className="text-royal-300 mb-6 line-clamp-2">{tool.description}</p>

            <div className="flex space-x-4">
              <button
                onClick={() => setShowFeatures(true)}
                className="px-4 py-2 bg-navy-700/50 text-royal-200 rounded-xl hover:bg-navy-600/50 transition-colors duration-300 border border-royal-500/20 backdrop-blur-sm hover:border-royal-400/30"
              >
                View Features
              </button>

              {renderActionButton()}
            </div>
          </div>
        </div>
      </div>

      {/* Features Modal */}
      {showFeatures && (
        <div className="fixed inset-0 bg-navy-950/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-navy-800/90 rounded-2xl p-8 max-w-lg w-full relative animate-fade-in border border-royal-500/20 backdrop-blur-xl">
            <button
              onClick={() => setShowFeatures(false)}
              className="absolute top-4 right-4 text-royal-300 hover:text-royal-100 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>

            <h3 className="text-2xl font-bold text-royal-100 mb-6 font-playfair">
              {tool.name} Features
            </h3>
            
            <div className="space-y-4">
              {tool.features.map((feature, index) => (
                <div key={index} className="flex items-center text-royal-200">
                  <Check className="h-5 w-5 text-royal-400 mr-3 flex-shrink-0" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t border-royal-500/20">
              <button
                onClick={() => setShowFeatures(false)}
                className="w-full py-3 px-4 bg-gradient-to-r from-royal-400 to-royal-600 text-navy-950 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-royal-500/25"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ToolCard;