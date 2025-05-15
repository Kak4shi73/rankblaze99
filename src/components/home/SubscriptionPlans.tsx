import { useState } from 'react';
import { Check, ShoppingCart } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';

const plans = [
  {
    id: 1,
    name: 'Starter',
    description: 'Perfect for individual developers',
    price: 29,
    features: [
      'Access to 5 premium tools',
      'Email notifications',
      'Monthly updates',
      'Single user license',
    ],
    popular: false,
    backgroundColor: 'from-gray-800 to-gray-900',
    borderColor: 'border-gray-700',
    btnClass: 'bg-indigo-600 hover:bg-indigo-700',
  },
  {
    id: 2,
    name: 'Pro',
    description: 'For professional developers & small teams',
    price: 79,
    features: [
      'Access to 25 premium tools',
      'Advanced analytics',
      'Weekly updates',
      'Team license (up to 5 users)',
      'Advanced features',
      'API access',
    ],
    popular: true,
    backgroundColor: 'from-indigo-900 to-purple-900',
    borderColor: 'border-indigo-500',
    btnClass: 'bg-gradient-to-r from-amber-400 to-amber-600 text-gray-900 hover:shadow-lg hover:shadow-amber-500/30',
  },
  {
    id: 3,
    name: 'Enterprise',
    description: 'For organizations with larger teams',
    price: 199,
    features: [
      'Access to all premium tools',
      'Premium features',
      'Daily updates',
      'Unlimited users',
      'Custom integrations',
      'Advanced security',
      'White-label options',
    ],
    popular: false,
    backgroundColor: 'from-purple-900 to-indigo-900',
    borderColor: 'border-purple-700',
    btnClass: 'bg-indigo-600 hover:bg-indigo-700',
  },
];

const SubscriptionPlans = () => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const { addToCart } = useCart();
  const { showToast } = useToast();

  const handleAddToCart = (plan: any) => {
    addToCart({
      id: plan.id,
      name: plan.name,
      price: billingCycle === 'annual' ? plan.price * 10 : plan.price,
      billingCycle,
    });
    showToast(`${plan.name} plan added to cart`, 'success');
  };

  return (
    <section id="plans" className="py-20 px-6 md:px-10">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 to-purple-300">
            Choose Your Plan
          </h2>
          <p className="text-lg max-w-3xl mx-auto mb-10 text-indigo-100 opacity-80">
            Select the perfect plan for your needs and start saving on premium developer tools today.
          </p>
          
          {/* Billing toggle */}
          <div className="flex items-center justify-center mb-8">
            <span className={`mr-3 ${billingCycle === 'monthly' ? 'text-white' : 'text-gray-400'}`}>Monthly</span>
            <button 
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')}
              className="relative w-14 h-7 bg-indigo-900 rounded-full p-1 transition-colors duration-300"
            >
              <span 
                className={`absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform duration-300 transform ${
                  billingCycle === 'annual' ? 'translate-x-7' : ''
                }`} 
              />
            </button>
            <span className={`ml-3 ${billingCycle === 'annual' ? 'text-white' : 'text-gray-400'}`}>
              Annual <span className="text-amber-400 text-xs font-semibold ml-1">Save 20%</span>
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div 
              key={plan.id}
              className={`relative p-8 rounded-2xl border ${plan.borderColor} bg-gradient-to-b ${plan.backgroundColor} shadow-xl transition-transform duration-300 hover:-translate-y-2`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-amber-400 to-amber-600 text-gray-900 text-xs font-bold px-4 py-1 rounded-full">
                  MOST POPULAR
                </div>
              )}
              
              <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
              <p className="text-indigo-200 mb-6">{plan.description}</p>
              
              <div className="flex items-baseline mb-6">
                <span className="text-4xl font-bold">
                  ${billingCycle === 'annual' ? (plan.price * 10 * 0.8).toFixed(0) : plan.price}
                </span>
                <span className="text-indigo-300 ml-2">
                  /{billingCycle === 'annual' ? 'year' : 'month'}
                </span>
              </div>
              
              <ul className="mb-8 space-y-4">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <Check className="h-5 w-5 text-green-400 mr-2 shrink-0 mt-0.5" />
                    <span className="text-indigo-100">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <button
                onClick={() => handleAddToCart(plan)}
                className={`w-full flex items-center justify-center py-3 px-4 rounded-lg ${plan.btnClass} text-white font-medium transition-all duration-300`}
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                Add to Cart
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SubscriptionPlans;