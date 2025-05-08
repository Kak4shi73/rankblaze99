import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import ToolCard from '../components/tools/ToolCard';
import { toolsData } from '../data/tools';

const Tools = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [filteredTools, setFilteredTools] = useState(toolsData);
  const [isLoaded, setIsLoaded] = useState(false);

  // Get unique categories
  const categories = ['all', ...new Set(toolsData.map(tool => tool.category || 'uncategorized'))];

  useEffect(() => {
    const filtered = toolsData.filter(tool => {
      const matchesSearch = tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          tool.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || tool.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
    setFilteredTools(filtered);
  }, [searchQuery, selectedCategory]);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <div className="min-h-screen pt-20 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-navy-900 via-navy-950 to-navy-900">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Hero Section with Animation */}
        <div className={`text-center mb-16 transition-all duration-1000 transform ${
          isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          <div className="relative">
            {/* Glowing background effect */}
            <div className="absolute inset-0 blur-3xl bg-gradient-to-r from-royal-400/20 via-royal-500/20 to-royal-600/20 rounded-full transform -translate-y-1/2" />
            
            {/* Main heading with enhanced visibility */}
            <h1 className="relative text-5xl md:text-7xl font-bold mb-8 font-playfair">
              <span className="block text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.25)]">
                Premium Developer
              </span>
              <span className="block bg-gradient-to-r from-royal-300 via-white to-royal-300 bg-clip-text text-transparent">
                Tools
              </span>
            </h1>
            
            {/* Subtitle with improved contrast */}
            <p className="relative text-xl md:text-2xl text-white font-light max-w-3xl mx-auto">
              Unlock your full potential with our suite of professional development tools
            </p>
          </div>
        </div>

        {/* Search and Filter Section */}
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
              className={`transition-all duration-1000 transform ${
                isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
              }`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <ToolCard tool={tool} />
            </div>
          ))}
        </div>

        {/* No Results Message */}
        {filteredTools.length === 0 && (
          <div className="text-center py-12 bg-navy-800/50 rounded-2xl border border-royal-500/20 backdrop-blur-sm">
            <p className="text-xl text-royal-300">
              No tools found matching your search criteria.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Tools;