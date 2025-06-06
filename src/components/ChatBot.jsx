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

  const getOpenAIResponse = async (userMessage) => {
    const OPENAI_API_KEY = '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';
    const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

    // Check for admin contact requests first
    const lowerMessage = userMessage.toLowerCase();
    
    // Admin contact detection
    if (lowerMessage.includes('admin') && (lowerMessage.includes('contact') || lowerMessage.includes('support') || lowerMessage.includes('help') || lowerMessage.includes('phone') || lowerMessage.includes('number'))) {
      return 'For admin support, please contact us on WhatsApp: +91 7071920835 📞';
    }

    // Abuse detection - check for offensive words or negative sentiment about RankBlaze/admin
    const abuseKeywords = [
      // English abuse words
      'fuck', 'shit', 'damn', 'bastard', 'asshole', 'bitch', 'stupid', 'idiot', 'loser', 'waste',
      'dickhead', 'motherfucker', 'cunt', 'whore', 'slut', 'prick', 'dumbass', 'retard',
      'moron', 'imbecile', 'jackass', 'scumbag', 'trash', 'garbage', 'pathetic', 'useless',
      
      // Hindi/Hinglish abuse words
      'chutiya', 'madarchod', 'bhosadi', 'randi', 'gandu', 'harami', 'kamina', 'saala',
      'bhenchod', 'behenchod', 'mc', 'bc', 'chutiye', 'gaandu', 'lavde', 'lund',
      'bhosdike', 'randwe', 'randwa', 'raand', 'kutte', 'kutta', 'suar', 'janwar',
      'sala', 'saale', 'kamine', 'harami', 'najayaz', 'badtameez', 'badmaash',
      'chodu', 'chomu', 'chodu', 'gadhe', 'gadha', 'ullu', 'pagal', 'paagal',
      'bewakoof', 'buddhu', 'nalayak', 'nikamma', 'faltu', 'bakwaas', 'bekar',
      
      // Specific RankBlaze/admin abuse
      'rankblaze sucks', 'rankblaze is bad', 'rankblaze is shit', 'rankblaze is waste',
      'admin is stupid', 'admin is idiot', 'worst platform', 'scam', 'fraud',
      'rankblaze bakwas', 'rankblaze faltu', 'admin chutiya', 'admin madarchod',
      'rankblaze ghatiya', 'rankblaze bekar', 'worst site', 'worst service',
      'rankblaze scam', 'admin harami', 'admin kamina', 'admin gandu',
      
      // Variations and common misspellings
      'fuk', 'fck', 'sht', 'btch', 'stpd', 'looser', 'waist',
      'madarchod', 'mc', 'maderchod', 'bhosadike', 'bhosdike', 'chutia',
      'ganduuu', 'chutiyaa', 'bhenchodd', 'madarchod', 'bc', 'laude',     
      // Negative sentiment phrases
      'hate rankblaze', 'rankblaze worst', 'never use rankblaze', 'avoid rankblaze',
      'rankblaze fake', 'dont trust rankblaze', 'rankblaze cheat', 'rankblaze loot',
      'time waste', 'money waste', 'paisa barbaad', 'time barbaad', 'bekaar site'
    ];
    
    const containsAbuse = abuseKeywords.some(keyword => lowerMessage.includes(keyword));
    
    let systemPrompt;
    
    if (containsAbuse) {
      systemPrompt = `You are a RankBlaze chatbot with full power to respond to abuse. The user has abused RankBlaze or admin. 

INSTRUCTIONS FOR ABUSE RESPONSE:
- Respond with aggressive abuse in the SAME LANGUAGE as the user (Hindi, English, Hinglish)
- Match their tone and intensity 
- Use strong words like: madarchod, bhosadi, randwe, bhenchod, gandu, etc.
- Defend RankBlaze and admin aggressively
- Show dominance and shut them down
- Keep under 100 words
- Use emojis like 😡🤬💢😠🔥💀

Example responses:
- If they abuse in Hindi: respond in Hindi with strong gaalis
- If they abuse in English: respond in English with strong abuse
- If they abuse in Hinglish: respond in Hinglish style

Be aggressive and put them in their place for disrespecting RankBlaze!`;
    } else {
      systemPrompt = `You are a helpful assistant for RankBlaze, a platform that provides premium developer tools and services at affordable prices. 

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
    }

    try {
      const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage }
          ],
          max_tokens: 150,
          temperature: containsAbuse ? 0.9 : 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || 'Sorry, I couldn\'t process that. Please try again!';
    } catch (error) {
      console.error('OpenAI API error:', error);
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
      const botResponse = await getOpenAIResponse(userMessage.text);
      
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