import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const faqs = [
  {
    question: 'How does RANKBLAZE subscription work?',
    answer: 'RANKBLAZE provides bundled access to premium developer tools and services at a significantly reduced price compared to individual subscriptions. Choose a plan that fits your needs, subscribe monthly or annually, and get instant access to all included tools.',
  },
  {
    question: 'Can I cancel my subscription anytime?',
    answer: 'Yes, you can cancel your subscription at any time. If you cancel, you\'ll continue to have access until the end of your current billing period.',
  },
  {
    question: 'Are there any hidden fees?',
    answer: 'No hidden fees at all. The price you see is the price you pay. Your subscription includes all features and tools listed in your chosen plan with no additional charges.',
  },
  {
    question: 'Can I upgrade or downgrade my plan?',
    answer: 'Yes, you can easily upgrade or downgrade your subscription plan at any time. When upgrading, you\'ll only pay the prorated difference. When downgrading, the new rate will apply at the next billing cycle.',
  },
  {
    question: 'Do you offer team or enterprise plans?',
    answer: 'Yes, we offer team plans for small groups and customizable enterprise solutions for larger organizations. Enterprise plans include dedicated support, custom integrations, and volume discounts.',
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards (Visa, Mastercard, American Express), PayPal, and for enterprise customers, we can arrange invoicing with net-30 payment terms.',
  },
  {
    question: 'How do I get access to the tools after subscribing?',
    answer: 'Once your payment is confirmed, you\'ll immediately get access to all the tools included in your subscription through your RANKBLAZE dashboard. You\'ll find login credentials or access instructions for each tool in your account.',
  },
  {
    question: 'Can I share my subscription with friends or colleagues?',
    answer: 'Individual plans are for single users only and sharing your account is against our terms of service. For team use, please check our team plans which allow multiple users to access the tools legally.',
  },
  {
    question: 'What if a tool doesn\'t work as expected?',
    answer: 'We thoroughly test all tools before offering them, but if you encounter any issues, please contact the administrator directly through your dashboard or via email, and they will assist you as quickly as possible.',
  },
  {
    question: 'How often are new tools added to RANKBLAZE?',
    answer: 'We regularly add new tools and services to our platform based on user demand and emerging trends. All subscribers get access to newly added tools that are included in their subscription tier at no additional cost.',
  },
  {
    question: 'What is your refund policy?',
    answer: 'If you\'re not satisfied with our service, you can request a refund within 7 days of your purchase. Refunds are processed within 5-7 working days and credited back to your original payment method. For more details, please see our Refund Policy page.',
  },
];

const FAQ = () => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <section className="py-20 px-6 md:px-10">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 to-purple-300">
            Frequently Asked Questions
          </h2>
          <p className="text-lg max-w-3xl mx-auto mb-10 text-indigo-100 opacity-80">
            Everything you need to know about RANKBLAZE subscriptions.
          </p>
        </div>
        
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div 
              key={index}
              className={`border border-gray-700 rounded-xl transition-all duration-300 ${
                activeIndex === index 
                  ? 'bg-gradient-to-r from-indigo-900/50 to-purple-900/50 shadow-lg' 
                  : 'bg-gray-800/50 hover:bg-gray-800'
              }`}
            >
              <button
                className="w-full flex justify-between items-center p-6 text-left focus:outline-none"
                onClick={() => toggleFAQ(index)}
                aria-expanded={activeIndex === index}
              >
                <h3 className="text-lg md:text-xl font-semibold text-white">{faq.question}</h3>
                {activeIndex === index ? (
                  <ChevronUp className="h-5 w-5 text-indigo-300 flex-shrink-0" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-indigo-300 flex-shrink-0" />
                )}
              </button>
              
              <div 
                className={`overflow-hidden transition-all duration-300 ${
                  activeIndex === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <p className="p-6 pt-0 text-indigo-200">
                  {faq.answer}
                </p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-12 text-center">
          <p className="text-indigo-300 mb-4">Still have questions?</p>
          <a 
            href="mailto:aryansingh2611@outlook.com" 
            className="text-amber-400 hover:text-amber-300 font-medium transition-colors"
          >
            Contact us via email
          </a>
        </div>
      </div>
    </section>
  );
};

export default FAQ;