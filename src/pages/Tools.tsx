import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import ToolCard from '../components/tools/ToolCard';
import { toolsData } from '../data/tools';
import { temporaryToolsData } from '../data/temporaryTools';
import { siteConfig } from '../config/site';
import { Link } from 'react-router-dom';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [filteredTools, setFilteredTools] = useState<Tool[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Use temporary tools or original tools based on config flag
  const currentTools = siteConfig.showTemporaryTools 
    ? temporaryToolsData 
    : toolsData.filter(tool => !tool.hidden);

  // Get unique categories
  const categories = ['all', ...new Set(currentTools.map(tool => tool.category || 'uncategorized'))];

  useEffect(() => {
    try {
      const filtered = currentTools.filter(tool => {
        const matchesSearch = tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          tool.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || tool.category === selectedCategory;
        return matchesSearch && matchesCategory;
      });
      setFilteredTools(filtered);
    } catch (error) {
      console.error('Error filtering tools:', error);
      setFilteredTools([]);
    }
  }, [searchQuery, selectedCategory, currentTools]);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // Function to render temporary tool card
  const renderTemporaryToolCard = (tool: Tool) => (
    <Link to={tool.route || ''} key={tool.id} className="group relative rounded-2xl transition-all duration-500 transform hover:-translate-y-2">
      <div className="relative bg-navy-800/90 backdrop-blur-xl rounded-2xl border border-royal-500/20 p-8 h-full transition-all duration-300 group-hover:bg-navy-800/95 group-hover:border-royal-400/30 group-hover:shadow-lg group-hover:shadow-royal-500/10">
        <div className="absolute inset-0 bg-gradient-to-br from-royal-500/5 to-royal-700/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className={`p-4 rounded-xl bg-gradient-to-br ${tool.gradient} shadow-lg transform transition-transform duration-300 group-hover:scale-110`}>
              {tool.icon && <tool.icon className="h-6 w-6 text-white" />}
            </div>
            <div className="text-2xl font-bold text-royal-100 font-playfair">
              ₹{tool.price}
              <span className="text-sm text-royal-300 ml-1">/mo</span>
            </div>
          </div>

          <h3 className="text-2xl font-bold text-royal-100 mb-3 font-playfair">{tool.name}</h3>
          <p className="text-royal-300 mb-6 line-clamp-2">{tool.description}</p>

          <button className="w-full py-3 px-4 bg-gradient-to-r from-royal-400 to-royal-600 text-navy-950 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-royal-500/25">
            View Tool
          </button>
        </div>
      </div>
    </Link>
  );

  return (
    <div className="container mx-auto py-16 px-4 max-w-7xl">
      <div className="text-center mb-20">
        <h1 
          className={`text-4xl md:text-5xl font-bold bg-gradient-to-r from-royal-50 to-royal-200 text-transparent bg-clip-text mb-6 font-playfair animate-fade-in ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
          style={{ animationDelay: '200ms' }}
        >
          Premium Developer Tools
        </h1>
        <p 
          className={`text-lg text-royal-300 max-w-3xl mx-auto animate-fade-in ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
          style={{ animationDelay: '400ms' }}
        >
          Access professional tools at a fraction of the price. No hidden fees, just powerful tools to boost your productivity.
        </p>
      </div>

      <div className="mb-12 space-y-8">
        {/* Search Bar */}
        <div className="max-w-2xl mx-auto relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-royal-400/20 via-royal-500/20 to-royal-600/20 rounded-xl blur-xl transition-all duration-300 group-hover:blur-2xl group-hover:opacity-75 opacity-50" />
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-royal-300 h-5 w-5" />
            <input
              type="text"
              placeholder="Search tools..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-navy-800/50 backdrop-blur-xl border border-royal-500/20 rounded-xl text-royal-100 placeholder-royal-300/50 focus:outline-none focus:ring-2 focus:ring-royal-500/50 focus:border-transparent transition-all duration-300"
            />
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap justify-center gap-3">
          {categories.map((category, index) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 ${
                selectedCategory === category
                  ? 'bg-gradient-to-r from-royal-400 to-royal-600 text-navy-950 shadow-lg shadow-royal-500/25'
                  : 'bg-navy-800/50 text-royal-300 hover:bg-navy-700/50 border border-royal-500/20 backdrop-blur-sm'
              }`}
              style={{
                animationDelay: `${index * 100}ms`
              }}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Tools Grid with Animation */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredTools.map((tool, index) => (
          <div 
            key={tool.id}
            className={`animate-fade-in-up ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
            style={{ animationDelay: `${index * 150}ms` }}
          >
            {siteConfig.showTemporaryTools 
              ? renderTemporaryToolCard(tool) 
              : <ToolCard tool={tool} />
            }
          </div>
        ))}
      </div>

      {filteredTools.length === 0 && (
        <div className="text-center py-16">
          <h3 className="text-2xl text-royal-200 mb-4">No tools found</h3>
          <p className="text-royal-300">Try adjusting your search or filter criteria</p>
        </div>
      )}
    </div>
  );
};

export default Tools;