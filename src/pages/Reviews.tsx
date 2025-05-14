import React, { useState } from 'react';

const Reviews = () => {
  const [filter, setFilter] = useState('all');

  // Review data
  const reviews = [
    {
      user: "Ankit Sharma",
      rating: 5,
      time: "2 days ago",
      comment: "Rank Blaze boosted my site traffic in 3 weeks. Amazing tools!",
      adminReply: "Glad it helped! Keep tracking your keywords 😊"
    },
    {
      user: "Priya Dev",
      rating: 3,
      time: "5 days ago",
      comment: "UI is great but one tool crashed while analyzing backlinks.",
      adminReply: "Thanks for reporting. We've fixed that issue in the latest patch!"
    },
    {
      user: "Mohd Faizan",
      rating: 1,
      time: "7 days ago",
      comment: "Most tools not loading on mobile.",
      adminReply: "We're optimizing the mobile view. Expect fixes soon 📱"
    },
    {
      user: "Vikram Singh",
      rating: 5,
      time: "1 week ago",
      comment: "Keyword research tool saved me hours of manual work. Worth every penny!",
      adminReply: "Thanks Vikram! We're adding more features to it next month."
    },
    {
      user: "Neha Gupta",
      rating: 4,
      time: "2 weeks ago",
      comment: "Content analysis is spot on. Would love to see more AI features.",
      adminReply: "We're working on integrating GPT-4 for advanced content suggestions!"
    },
    {
      user: "Rajiv Verma",
      rating: 2,
      time: "3 weeks ago",
      comment: "Decent tools but pricing is on the higher side compared to competitors.",
      adminReply: "We appreciate your feedback. Check out our new plans with more flexible options!"
    },
    {
      user: "Shreya Patel",
      rating: 5,
      time: "1 month ago",
      comment: "The backlink analyzer found issues my previous tool missed completely!",
      adminReply: "That's great to hear, Shreya! We use advanced algorithms to catch what others miss."
    },
    {
      user: "Karan Malhotra",
      rating: 4,
      time: "1 month ago",
      comment: "Rank tracking is accurate. Love the daily email updates.",
      adminReply: "Glad you're enjoying the notifications! More customization options coming soon."
    },
    {
      user: "Swati Joshi",
      rating: 3,
      time: "5 weeks ago",
      comment: "Competitor analysis needs more depth. Otherwise good tools.",
      adminReply: "We're expanding competitor metrics in our next release. Stay tuned!"
    },
    {
      user: "Amit Kumar",
      rating: 5,
      time: "2 months ago",
      comment: "Customer support is exceptional! Solved my issue within hours.",
      adminReply: "We pride ourselves on quick support. Thank you for the kind words!"
    },
    {
      user: "Divya Sharma",
      rating: 1,
      time: "2 months ago",
      comment: "Couldn't get the site audit to complete on my large e-commerce site.",
      adminReply: "We've recently improved performance for large sites. Please try again or contact support for assistance."
    },
    {
      user: "Rohit Mishra",
      rating: 5,
      time: "3 months ago",
      comment: "The SEO recommendations helped me climb from page 3 to page 1 for my target keywords!",
      adminReply: "That's an amazing improvement, Rohit! Thanks for sharing your success."
    },
    {
      user: "Meera Reddy",
      rating: 4,
      time: "3 months ago",
      comment: "Easy to use interface. Reports are clear and actionable.",
      adminReply: "Usability is a top priority for us. Glad you're finding value in the reports!"
    },
    {
      user: "Sanjay Desai",
      rating: 2,
      time: "4 months ago",
      comment: "Too many tools bundled together. Makes it overwhelming for beginners.",
      adminReply: "We're working on a 'Simple Mode' for beginners. In the meantime, check out our tutorial videos!"
    },
    {
      user: "Preeti Jain",
      rating: 5,
      time: "4 months ago",
      comment: "The local SEO pack is a game changer for my client's business!",
      adminReply: "Local businesses need specialized tools - happy to hear it's working well for your clients!"
    }
  ];

  // Filter reviews based on rating
  const filteredReviews = reviews.filter(review => {
    if (filter === 'all') return true;
    if (filter === 'positive') return review.rating >= 4;
    if (filter === 'neutral') return review.rating === 3;
    if (filter === 'negative') return review.rating <= 2;
    return true;
  });

  // Star component
  const StarRating = ({ rating }: { rating: number }) => {
    return (
      <div className="flex items-center mb-3">
        {[...Array(5)].map((_, i) => (
          <svg 
            key={i} 
            className={`w-5 h-5 ${i < rating ? 'text-yellow-400' : 'text-gray-600'}`} 
            fill="currentColor" 
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-950 to-gray-900 pt-20 pb-10 px-4">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold text-center text-white mb-10">What Our Users Say</h1>
        
        {/* Filter dropdown */}
        <div className="flex justify-center mb-8">
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg shadow-md inline-flex p-1">
            <button 
              className={`px-4 py-2 rounded-md ${filter === 'all' ? 'bg-indigo-600 text-white' : 'text-gray-300'}`}
              onClick={() => setFilter('all')}
            >
              All Reviews
            </button>
            <button 
              className={`px-4 py-2 rounded-md ${filter === 'positive' ? 'bg-indigo-600 text-white' : 'text-gray-300'}`}
              onClick={() => setFilter('positive')}
            >
              Positive
            </button>
            <button 
              className={`px-4 py-2 rounded-md ${filter === 'neutral' ? 'bg-indigo-600 text-white' : 'text-gray-300'}`}
              onClick={() => setFilter('neutral')}
            >
              Neutral
            </button>
            <button 
              className={`px-4 py-2 rounded-md ${filter === 'negative' ? 'bg-indigo-600 text-white' : 'text-gray-300'}`}
              onClick={() => setFilter('negative')}
            >
              Negative
            </button>
          </div>
        </div>
        
        {/* Review grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReviews.map((review, index) => (
            <div 
              key={index}
              className="bg-gray-800/30 border border-gray-700 shadow-xl rounded-2xl p-6 mb-6 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-semibold text-white">{review.user}</h2>
                <p className="text-sm text-gray-400">{review.time}</p>
              </div>
              
              <StarRating rating={review.rating} />
              
              <p className="text-gray-300 italic">{review.comment}</p>

              <div className="mt-4 border-t pt-3 border-gray-700">
                <p className="text-sm text-indigo-400 font-semibold">Admin Reply:</p>
                <p className="text-gray-300">{review.adminReply}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Reviews; 