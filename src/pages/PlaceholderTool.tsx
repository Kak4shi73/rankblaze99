import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { temporaryToolsData } from '../data/temporaryTools';

const PlaceholderTool = () => {
  const { toolId } = useParams<{ toolId: string }>();
  const navigate = useNavigate();
  const [tool, setTool] = useState<any>(null);
  
  useEffect(() => {
    if (toolId) {
      // Find tool by route
      const foundTool = temporaryToolsData.find(t => 
        t.route === `/tool/${toolId}` || t.route.endsWith(`/${toolId}`)
      );
      
      if (foundTool) {
        setTool(foundTool);
      } else {
        navigate('/tools');
      }
    }
  }, [toolId, navigate]);

  if (!tool) {
    return (
      <div className="container mx-auto p-8 text-center">
        <div className="animate-pulse">
          <div className="h-10 bg-navy-700 rounded w-1/4 mx-auto mb-4"></div>
          <div className="h-6 bg-navy-700 rounded w-1/2 mx-auto"></div>
        </div>
      </div>
    );
  }

  const Icon = tool.icon;

  return (
    <div className="container mx-auto py-16 px-4 max-w-5xl">
      {/* Back button */}
      <button 
        onClick={() => navigate('/tools')}
        className="flex items-center space-x-2 text-royal-300 hover:text-royal-100 mb-8 transition-colors duration-300"
      >
        <ArrowLeft className="h-5 w-5" />
        <span>Back to Tools</span>
      </button>

      {/* Tool header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12">
        <div className="flex items-center space-x-4 mb-4 md:mb-0">
          <div className={`p-4 rounded-xl bg-gradient-to-br ${tool.gradient} shadow-lg`}>
            <Icon className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-royal-100">{tool.name}</h1>
        </div>
      </div>

      {/* Tool description */}
      <div className="bg-navy-800/50 border border-royal-500/20 rounded-2xl p-6 mb-10 backdrop-blur-sm">
        <p className="text-royal-200 text-lg">{tool.description}</p>
      </div>

      {/* Placeholder content */}
      <div className="bg-navy-800/50 border border-royal-500/20 rounded-2xl p-8 mb-10 backdrop-blur-sm">
        <h2 className="text-2xl font-bold text-royal-100 mb-6">Tool Interface</h2>
        <div className="space-y-6">
          <div className="space-y-4">
            <label className="block text-royal-200 font-medium">Input URL or Text</label>
            <div className="flex">
              <input 
                type="text" 
                placeholder="Enter URL or text to analyze..." 
                className="flex-grow px-4 py-3 bg-navy-700/70 border border-royal-500/20 rounded-l-xl text-royal-100 placeholder-royal-300/50 focus:outline-none focus:ring-2 focus:ring-royal-500/50 focus:border-transparent transition-all duration-300"
              />
              <button className="px-6 py-3 bg-gradient-to-r from-royal-400 to-royal-600 text-navy-950 rounded-r-xl font-medium transition-all duration-300 hover:shadow-lg hover:shadow-royal-500/25">
                Analyze
              </button>
            </div>
          </div>
          
          <div className="p-8 bg-navy-700/70 border border-royal-500/20 rounded-xl text-royal-300 min-h-[200px] flex items-center justify-center">
            <p className="text-center">Enter your data and click Analyze to see results</p>
          </div>
          
          <div className="text-center">
            <p className="text-royal-300 mb-4">This is a placeholder tool interface for Razorpay verification</p>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="bg-navy-800/50 border border-royal-500/20 rounded-2xl p-8 backdrop-blur-sm">
        <h2 className="text-2xl font-bold text-royal-100 mb-6">Key Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tool.features.map((feature: string, index: number) => (
            <div key={index} className="flex items-start space-x-3">
              <div className={`p-2 rounded-lg bg-gradient-to-br ${tool.gradient} shadow-md flex-shrink-0 mt-1`}>
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-royal-100">{feature}</h3>
                <p className="text-royal-300 text-sm">Placeholder description for this feature.</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PlaceholderTool; 