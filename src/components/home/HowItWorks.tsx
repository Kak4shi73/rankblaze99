import { ClipboardList, MessageCircle, CreditCard, CheckCircle } from 'lucide-react';

const steps = [
  {
    number: 1,
    icon: ClipboardList,
    title: 'Check Our Pricing',
    description: 'Explore our affordable pricing plans tailored to meet your needs',
    gradient: 'from-amber-400 to-amber-600',
  },
  {
    number: 2,
    icon: MessageCircle,
    title: 'Contact with us',
    description: 'Get in touch with our support team for assistance',
    gradient: 'from-purple-400 to-purple-600',
  },
  {
    number: 3,
    icon: CreditCard,
    title: 'Make Payment',
    description: 'Securely process your payment through our trusted payment gateway',
    gradient: 'from-blue-400 to-blue-600',
  },
  {
    number: 4,
    icon: CheckCircle,
    title: 'Activate Your Plan',
    description: 'Start using your premium tools immediately after activation',
    gradient: 'from-green-400 to-green-600',
  },
];

const HowItWorks = () => {
  return (
    <section className="py-20 px-6 md:px-10 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/30 rounded-full filter blur-[128px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/30 rounded-full filter blur-[128px]" />
      </div>

      <div className="max-w-6xl mx-auto relative">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 to-purple-300">
            How to Get Started
          </h2>
          <p className="text-lg text-indigo-100 opacity-80 max-w-3xl mx-auto">
            Follow these simple steps to access premium developer tools and boost your productivity
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={step.number}
                className="relative group"
              >
                <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-purple-500/10">
                  <div className="relative">
                    {/* Step number */}
                    <div className="absolute -top-4 -left-4 w-8 h-8 flex items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-white font-bold">
                      {step.number}
                    </div>
                    
                    {/* Icon */}
                    <div className={`w-16 h-16 mb-6 rounded-lg bg-gradient-to-br ${step.gradient} flex items-center justify-center transform transition-transform group-hover:scale-110`}>
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                  <p className="text-indigo-200">{step.description}</p>

                  {/* Connector line */}
                  {index < steps.length - 1 && (
                    <div className="hidden lg:block absolute top-1/2 left-full w-full h-px bg-gradient-to-r from-gray-700 to-transparent transform -translate-y-1/2 z-0" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;