import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User } from 'lucide-react';

const ChatBot = ({ isOpen, onToggle }) => {
  const [messages, setMessages] = useState([
    {
      id: '1',
      text: 'Hi! I\'m the RankBlaze assistant. Ask me about our tools, pricing, or how to get started!',
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const validateInput = (text) => {
    if (!text.trim()) return 'Please enter a message';
    if (text.trim().length > 200) return 'Message too long (max 50 words)';
    const wordCount = text.trim().split(/\s+/).length;
    if (wordCount > 50) return 'Please limit your message to 50 words';
    return null;
  };

  const getDeepseekResponse = async (userMessage) => {
    const DEEPSEEK_API_KEY = 'sk-622742d539f64398800f162dd0ac6f04';
    const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';

    // Check for abuse or admin contact requests first
    const lowerMessage = userMessage.toLowerCase();
    
    // Admin contact detection
    if (lowerMessage.includes('admin') && (lowerMessage.includes('contact') || lowerMessage.includes('support') || lowerMessage.includes('help') || lowerMessage.includes('phone') || lowerMessage.includes('number'))) {
      return 'For admin support, please contact us on WhatsApp: +91 7071920835 📞';
    }

    // Abuse detection - check for offensive words or negative sentiment about RankBlaze/admin
    const abuseKeywords = [
      'fuck', 'shit', 'damn', 'bastard', 'asshole', 'bitch', 'stupid', 'idiot', 'loser', 'waste',
      'chutiya', 'madarchod', 'bhosadi', 'randi', 'gandu', 'harami', 'kamina', 'saala',
      'rankblaze sucks', 'rankblaze is bad', 'admin is stupid', 'worst platform', 'scam'
    ];
    
    const containsAbuse = abuseKeywords.some(keyword => lowerMessage.includes(keyword));
    
    if (containsAbuse) {
      const abuseResponses = [
        'Ae madarchod, yahan abuse karne aaya hai? RankBlaze ke baare mein galat bola to gaand tod dunga! 😡',
        'Bhosadpappu, RankBlaze admin ko gaali deta hai? Teri maa ki... behave kar! 🤬',
        'Randwe, yahan manners sikha ke aaya kar. RankBlaze best platform hai, samjha bhosadiwale! 💢',
        'Bahenchod, abuse kar raha hai? Tera baap hun main. RankBlaze respect kar! 😠',
        'Oye madarchod, RankBlaze ko gaali dega? Teri gaand mein dum hai to face to face aa! 🔥',
        'Bhosadiwale, keyboard warrior ban raha hai? RankBlaze admin se panga lega? 💀'
      ];
      
      return abuseResponses[Math.floor(Math.random() * abuseResponses.length)];
    }

    const systemPrompt = `You are a helpful assistant for RankBlaze, a platform that provides premium developer tools and services at affordable prices. 

ABOUT RANKBLAZE:
- We offer developer tools with subscription access
- Users can browse tools, add to cart, and purchase subscriptions
- We have authentication system, user dashboard, and admin panel
- Payment processing through PhonePe for Indian users
- Tools include various developer utilities and premium services
- Mission: "Stack More, Pay Less"

GUIDELINES:
- Keep responses under 100 words
- Be helpful and friendly
- Focus on RankBlaze features, pricing, tools, and how to get started
- If asked about technical details, provide clear, concise answers
- Always encourage users to explore our tools and signup

Common questions users ask:
- How to get access to tools
- Pricing information 
- How the platform works
- What tools are available
- Payment and subscription details`;

    try {
      const response = await fetch(DEEPSEEK_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage }
          ],
          max_tokens: 150,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || 'Sorry, I couldn\'t process that. Please try again!';
    } catch (error) {
      console.error('Deepseek API error:', error);
      return 'I\'m having trouble connecting right now. Please try again later or contact our support team.';
    }
  };

  const handleSendMessage = async () => {
    const validationError = validateInput(inputText);
    if (validationError) {
      alert(validationError);
      return;
    }

    const userMessage = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const botResponse = await getDeepseekResponse(userMessage.text);
      
      const botMessage = {
        id: (Date.now() + 1).toString(),
        text: botResponse,
        isUser: false,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        text: 'Sorry, I encountered an error. Please try again!',
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
        aria-label="Open chat"
      >
        <MessageCircle className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-80 h-96 bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4 rounded-t-lg flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Bot className="w-5 h-5" />
          <span className="font-semibold">RankBlaze Assistant</span>
        </div>
        <button
          onClick={onToggle}
          className="text-white hover:text-gray-200 transition-colors"
          aria-label="Close chat"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
          >
            <div className="flex items-start space-x-2 max-w-[75%]">
              {!message.isUser && (
                <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-purple-600" />
                </div>
              )}
              <div
                className={`px-3 py-2 rounded-lg text-sm ${
                  message.isUser
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {message.text}
              </div>
              {message.isUser && (
                <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-gray-600" />
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-start space-x-2">
              <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                <Bot className="w-4 h-4 text-purple-600" />
              </div>
              <div className="bg-gray-100 px-3 py-2 rounded-lg">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about RankBlaze tools..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm bg-white text-black placeholder-gray-500"
            disabled={isLoading}
            maxLength={200}
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !inputText.trim()}
            className="bg-purple-600 text-white p-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {inputText.trim().split(/\s+/).filter(word => word.length > 0).length}/50 words
        </p>
      </div>
    </div>
  );
};

export default ChatBot; 