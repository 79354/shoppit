import { useState, useEffect, useRef } from 'react';
import { Send, MessageCircle, X, Loader2, Bot, User } from 'lucide-react';

const CustomerSupportChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [roomId, setRoomId] = useState(null);
  const [roomStatus, setRoomStatus] = useState('pending');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && !roomId) {
      createSupportRoom();
    }
  }, [isOpen]);

  useEffect(() => {
    if (roomId) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [roomId]);

  const createSupportRoom = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8008/support/create-room/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({ subject: 'Customer Support' })
      });
      
      if (response.ok) {
        const data = await response.json();
        setRoomId(data.room_id);
        setRoomStatus(data.status);
        fetchMessages();
      }
    } catch (error) {
      console.error('Error creating room:', error);
    }
  };

  const fetchMessages = async () => {
    if (!roomId) return;
    
    try {
      const response = await fetch(
        `http://127.0.0.1:8008/support/rooms/${roomId}/messages/`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !roomId) return;

    setLoading(true);
    try {
      const response = await fetch(
        `http://127.0.0.1:8008/support/rooms/${roomId}/send/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          },
          body: JSON.stringify({ message: newMessage })
        }
      );

      if (response.ok) {
        setNewMessage('');
        fetchMessages();
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getMessageIcon = (senderType) => {
    if (senderType === 'bot') return <Bot className="w-5 h-5 text-purple-500" />;
    if (senderType === 'agent') return <User className="w-5 h-5 text-blue-500" />;
    return <User className="w-5 h-5 text-gray-500" />;
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      {/* Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full p-4 shadow-2xl hover:scale-110 transition-transform z-50"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 border border-gray-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 rounded-t-2xl flex justify-between items-center">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              <div>
                <h3 className="font-semibold">Customer Support</h3>
                <p className="text-xs opacity-90">
                  {roomStatus === 'active' ? '🟢 Agent online' : '🟡 Waiting for agent...'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-white/20 rounded-full p-1 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2 ${
                  msg.sender_type === 'customer' ? 'flex-row-reverse' : ''
                }`}
              >
                <div className="flex-shrink-0 mt-1">
                  {getMessageIcon(msg.sender_type)}
                </div>
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                    msg.sender_type === 'customer'
                      ? 'bg-purple-600 text-white rounded-tr-none'
                      : msg.sender_type === 'bot'
                      ? 'bg-purple-100 text-gray-800 rounded-tl-none'
                      : 'bg-blue-100 text-gray-800 rounded-tl-none'
                  }`}
                >
                  <p className="text-sm break-words">{msg.message}</p>
                  <span
                    className={`text-xs mt-1 block ${
                      msg.sender_type === 'customer'
                        ? 'text-purple-200'
                        : 'text-gray-500'
                    }`}
                  >
                    {formatTime(msg.created_at)}
                  </span>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t bg-white rounded-b-2xl">
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500"
                disabled={loading}
              />
              <button
                onClick={handleSendMessage}
                disabled={loading || !newMessage.trim()}
                className="bg-purple-600 text-white rounded-full p-2 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CustomerSupportChat;