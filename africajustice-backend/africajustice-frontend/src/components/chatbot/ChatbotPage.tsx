import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Volume2, Mic, Send, Trash2, Download, Search, MessageCircle } from 'lucide-react';
import voiceRecognitionService from '../../services/voiceRecognitionService';
import textToSpeechService from '../../services/textToSpeechService';
import { useI18n } from '../../context/I18nContext';
import { API_BASE_URL } from '../../services/api';

interface Message {
  id: string;
  sender: 'user' | 'bot';
  message: string;
  messageType: 'text' | 'voice' | 'audio-response';
  rating?: number;
  createdAt?: string;
}

interface ConversationStats {
  totalMessages: number;
  botMessages: number;
  userMessages: number;
  averageRating: string;
  ratedCount: number;
}

const AUTH_TOKEN_KEY = 'authToken';
const buildApiUrl = (path: string): string => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  // Handle double slashes if API_BASE_URL already ends with /
  const normalizedBase = API_BASE_URL.replace(/\/+$/, '');
  return `${normalizedBase}${normalizedPath}`;
};

const ChatbotPage: React.FC = () => {
  const { t, language } = useI18n();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [stats, setStats] = useState<ConversationStats | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Message[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const token = localStorage.getItem(AUTH_TOKEN_KEY);

  useEffect(() => {
    voiceRecognitionService.setLanguageByCode(language);
    textToSpeechService.setLanguage(language);
  }, [language]);

  const fetchHistory = useCallback(async () => {
    if (!token) {
      console.warn('No authentication token, skipping history fetch');
      return;
    }
    try {
      const response = await fetch(buildApiUrl('/chat/history'), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Error fetching chat history:', error);
    }
  }, [token]);

  const fetchStats = useCallback(async () => {
    if (!token) {
      console.warn('No authentication token, skipping stats fetch');
      return;
    }
    try {
      const response = await fetch(buildApiUrl('/chat/stats'), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, [token]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    fetchHistory();
    fetchStats();
  }, [fetchHistory, fetchStats]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    // Capture the message before clearing the input
    const messageText = inputValue;

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      message: messageText,
      messageType: 'text',
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Try authenticated endpoint first if token exists
      let response;
      let data;
      
      if (token) {
        response = await fetch(buildApiUrl('/chat/send'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            message: messageText,
            messageType: 'text',
            language: language,
          }),
        });
        
        if (response.ok) {
          data = await response.json();
        }
      }
      
      // Fall back to unauthenticated endpoint if no token or auth failed
      if (!response || !response.ok) {
        response = await fetch(buildApiUrl('/chat/test/send'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: messageText,
            language: language,
          }),
        });
        
        if (response.ok) {
          data = await response.json();
        }
      }

      if (response && response.ok && data) {
        // Handle both response formats
        const botResponseText = typeof data.botResponse === 'string' 
          ? data.botResponse 
          : data.botResponse?.message || 'No response received';
        const messageId = data.botResponse?._id || Date.now().toString();
        const createdAt = data.botResponse?.createdAt || new Date().toISOString();

        const botMessage: Message = {
          id: messageId,
          sender: 'bot',
          message: botResponseText,
          messageType: 'text',
          createdAt: createdAt,
        };
        setMessages((prev) => [...prev, botMessage]);

        // Speak bot response if text is valid
        if (botResponseText && botResponseText.trim()) {
          textToSpeechService.speak(botResponseText, () => {
            setIsSpeaking(false);
          });
          setIsSpeaking(true);
        }
      } else {
        console.error('Failed to get bot response', { response: response?.status, data });
        // Show error message to user
        const errorMessage: Message = {
          id: Date.now().toString(),
          sender: 'bot',
          message: 'Sorry, I encountered an error. Please try again.',
          messageType: 'text',
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Show error message to user
      const errorMessage: Message = {
        id: Date.now().toString(),
        sender: 'bot',
        message: 'Sorry, I encountered an error. Please try again.',
        messageType: 'text',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceInput = () => {
    if (isListening) {
      voiceRecognitionService.stopListening();
      setIsListening(false);
    } else {
      setIsListening(true);
      voiceRecognitionService.startListening(
        (transcript, isFinal) => {
          setInputValue(transcript);
          if (isFinal) {
            setIsListening(false);
            // Auto-send on final transcript
            setTimeout(() => {
              handleSend();
            }, 100);
          }
        },
        (error) => {
          console.error('Voice error:', error);
          setIsListening(false);
        }
      );
    }
  };

  const handleSpeakMessage = (message: string) => {
    if (isSpeaking) {
      textToSpeechService.stop();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      textToSpeechService.speak(message, () => {
        setIsSpeaking(false);
      });
    }
  };

  const handleRateMessage = async (messageId: string, rating: number) => {
    try {
      const response = await fetch(buildApiUrl(`/chat/${messageId}/rate`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ rating }),
      });

      if (response.ok) {
        setMessages((prev) =>
          prev.map((msg) => (msg.id === messageId ? { ...msg, rating } : msg))
        );
        fetchStats();
      }
    } catch (error) {
      console.error('Error rating message:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      const response = await fetch(buildApiUrl(`/chat/search?q=${encodeURIComponent(searchQuery)}`), {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.results || []);
      }
    } catch (error) {
      console.error('Error searching:', error);
    }
  };

  const handleDeleteHistory = async () => {
    if (window.confirm('Are you sure you want to delete old messages?')) {
      try {
        const response = await fetch(buildApiUrl('/chat/history/clear'), {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ daysOld: 30 }),
        });

        if (response.ok) {
          fetchHistory();
          fetchStats();
        }
      } catch (error) {
        console.error('Error deleting history:', error);
      }
    }
  };

  const exportConversation = () => {
    const exportData = JSON.stringify(messages, null, 2);
    const element = document.createElement('a');
    element.setAttribute('href', 'data:application/json;charset=utf-8,' + encodeURIComponent(exportData));
    element.setAttribute('download', `chat-export-${Date.now()}.json`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 pt-28 pb-10">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{t('chat.title')}</h1>
          <p className="text-gray-600">{t('chat.description')}</p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-gray-600 text-sm">{t('chat.stats.totalMessages')}</p>
              <p className="text-3xl font-bold text-blue-600">{stats.totalMessages}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-gray-600 text-sm">{t('chat.stats.yourMessages')}</p>
              <p className="text-3xl font-bold text-indigo-600">{stats.userMessages}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-gray-600 text-sm">{t('chat.stats.botResponses')}</p>
              <p className="text-3xl font-bold text-purple-600">{stats.botMessages}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-gray-600 text-sm">{t('chat.stats.averageRating')}</p>
              <p className="text-3xl font-bold text-yellow-600">
                {stats.averageRating} ⭐ ({stats.ratedCount})
              </p>
            </div>
          </div>
        )}

        {/* Main Chat Container */}
        <div className="bg-white rounded-lg shadow-xl overflow-hidden flex flex-col" style={{ height: '600px' }}>
          {/* Toolbar */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4 flex justify-between items-center">
            <h2 className="text-xl font-bold">{t('chat.toolbar.conversation')}</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setShowSearch(!showSearch)}
                className="p-2 hover:bg-blue-700 rounded transition"
              >
                <Search size={20} />
              </button>
              <button onClick={exportConversation} className="p-2 hover:bg-blue-700 rounded transition">
                <Download size={20} />
              </button>
              <button onClick={handleDeleteHistory} className="p-2 hover:bg-blue-700 rounded transition">
                <Trash2 size={20} />
              </button>
            </div>
          </div>

          {/* Search Bar */}
          {showSearch && (
            <div className="bg-gray-100 px-6 py-3 border-b flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder={t('chat.toolbar.search')}
                className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={handleSearch}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                {t('chat.toolbar.search')}
              </button>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
            {(searchResults.length > 0 && showSearch ? searchResults : messages).length === 0 ? (
              <div className="text-center text-gray-500 mt-20">
                <MessageCircle size={48} className="mx-auto mb-4 opacity-30" />
                <p className="text-lg mb-2">{t('chat.noMessages')}</p>
                <p className="text-sm">{t('chat.startConversation')}</p>
              </div>
            ) : (
              (searchResults.length > 0 && showSearch ? searchResults : messages).map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-lg px-4 py-3 rounded-lg ${
                      msg.sender === 'user'
                        ? 'bg-blue-600 text-white rounded-br-none'
                        : 'bg-gray-200 text-gray-900 rounded-bl-none'
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{msg.message}</p>
                    {msg.sender === 'bot' && (
                      <div className="mt-3 space-y-2">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSpeakMessage(msg.message)}
                            className="text-xs opacity-70 hover:opacity-100 flex items-center gap-1 px-2 py-1 rounded bg-black/10"
                          >
                            <Volume2 size={14} />
                            {isSpeaking ? t('chat.stop') : t('chat.listen')}
                          </button>
                        </div>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((rating) => (
                            <button
                              key={rating}
                              onClick={() => handleRateMessage(msg.id, rating)}
                              className={`text-lg ${
                                msg.rating && msg.rating >= rating
                                  ? 'opacity-100'
                                  : 'opacity-30 hover:opacity-60'
                              }`}
                            >
                              ⭐
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {msg.createdAt && (
                      <p className="text-xs opacity-60 mt-2">
                        {new Date(msg.createdAt).toLocaleTimeString()}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-200 text-gray-900 px-4 py-3 rounded-lg rounded-bl-none">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce delay-100"></div>
                    <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce delay-200"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t bg-white p-6 space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder={t('chat.placeholderFull')}
                className="flex-1 border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
              <button
                onClick={handleVoiceInput}
                className={`px-4 py-3 rounded-lg transition-all font-medium ${
                  isListening
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <Mic size={20} />
              </button>
              <button
                onClick={handleSend}
                disabled={isLoading || !inputValue.trim()}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2"
              >
                <Send size={20} />
                {t('chat.send')}
              </button>
            </div>
            <p className="text-sm text-gray-500">
              {isListening ? t('chat.speaking') : t('chat.listeningTip')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatbotPage;
