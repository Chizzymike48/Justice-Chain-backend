import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MessageCircle, X, Volume2, Mic, Send } from 'lucide-react';
import voiceRecognitionService from '../../services/voiceRecognitionService';
import textToSpeechService from '../../services/textToSpeechService';
import { useI18n } from '../../context/I18nContext';
import { API_BASE_URL } from '../../services/api';

interface Message {
  id: string;
  sender: 'user' | 'bot';
  message: string;
  messageType: 'text' | 'voice' | 'audio-response';
}

const AUTH_TOKEN_KEY = 'authToken';

const buildApiUrl = (path: string) =>
  `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;

const ChatbotWidget: React.FC = () => {
  const { t, language } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const token = localStorage.getItem(AUTH_TOKEN_KEY);

  useEffect(() => {
    voiceRecognitionService.setLanguageByCode(language);
    textToSpeechService.setLanguage(language);
  }, [language]);

  const fetchHistory = useCallback(async () => {
    if (!token) {
      console.warn('No authentication token, skipping history fetch');
      return; // Skip history if not authenticated
    }
    try {
      const response = await fetch(buildApiUrl('/chat/history?limit=20'), {
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Load conversation history
      fetchHistory();
    }
  }, [fetchHistory, isOpen, messages.length]);

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
        
        const botMessage: Message = {
          id: messageId,
          sender: 'bot',
          message: botResponseText,
          messageType: 'text',
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

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Chat Widget */}
      {isOpen && (
        <div className="mb-4 w-96 bg-white rounded-lg shadow-2xl flex flex-col" style={{ height: '500px' }}>
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-t-lg flex justify-between items-center">
            <div>
              <h3 className="font-bold text-lg">{t('chat.title')}</h3>
              <p className="text-sm opacity-90">{t('chat.description')}</p>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-blue-700 p-1 rounded">
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 mt-8">
                <MessageCircle size={36} className="mx-auto mb-2 opacity-50" />
                <p>{t('chat.noMessages')}</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-xs px-4 py-2 rounded-lg ${
                      msg.sender === 'user'
                        ? 'bg-blue-600 text-white rounded-br-none'
                        : 'bg-gray-200 text-gray-900 rounded-bl-none'
                    }`}
                  >
                    <p className="text-sm">{msg.message}</p>
                    {msg.sender === 'bot' && (
                      <button
                        onClick={() => handleSpeakMessage(msg.message)}
                        className="mt-1 text-xs opacity-70 hover:opacity-100 flex items-center gap-1"
                      >
                        <Volume2 size={14} />
                        {isSpeaking ? t('chat.stop') : t('chat.listen')}
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-200 text-gray-900 px-4 py-2 rounded-lg rounded-bl-none">
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
          <div className="border-t p-4 bg-white rounded-b-lg space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder={t('chat.placeholder')}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={handleVoiceInput}
                className={`p-2 rounded-lg transition-all ${
                  isListening
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <Mic size={20} />
              </button>
              <button
                onClick={handleSend}
                disabled={isLoading || !inputValue.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Send size={20} />
              </button>
            </div>
            <p className="text-xs text-gray-500 text-center">
              {isListening ? '🎤 Listening...' : t('chat.listeningTip')}
            </p>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center hover:scale-110"
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </button>
    </div>
  );
};

export default ChatbotWidget;
