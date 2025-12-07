import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageCircle, Send, Clock, CheckCircle, AlertCircle, 
  User, Bell, Loader2, X 
} from 'lucide-react';

const SupportDashboard = () => {
  const [pendingRooms, setPendingRooms] = useState([]);
  const [activeRooms, setActiveRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchRooms();
    fetchNotifications();
    const interval = setInterval(() => {
      fetchRooms();
      fetchNotifications();
      if (selectedRoom) fetchMessages(selectedRoom.room_id);
    }, 3000);
    return () => clearInterval(interval);
  }, [selectedRoom]);

  const fetchRooms = async () => {
    try {
      const [pendingRes, activeRes] = await Promise.all([
        fetch('http://127.0.0.1:8008/support/rooms/pending/', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
        }),
        fetch('http://127.0.0.1:8008/support/rooms/', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
        })
      ]);

      if (pendingRes.ok) setPendingRooms(await pendingRes.json());
      if (activeRes.ok) setActiveRooms(await activeRes.json());
    } catch (error) {
      console.error('Error fetching rooms:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8008/support/notifications/', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
      });
      if (response.ok) setNotifications(await response.json());
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const fetchMessages = async (roomId) => {
    try {
      const response = await fetch(
        `http://127.0.0.1:8008/support/rooms/${roomId}/messages/`,
        {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
        }
      );
      if (response.ok) setMessages(await response.json());
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const acceptRoom = async (roomId) => {
    try {
      const response = await fetch(
        `http://127.0.0.1:8008/support/rooms/${roomId}/accept/`,
        {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
        }
      );
      if (response.ok) {
        fetchRooms();
        const room = await response.json();
        setSelectedRoom(room);
        fetchMessages(room.room_id);
      }
    } catch (error) {
      console.error('Error accepting room:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedRoom) return;

    setLoading(true);
    try {
      const response = await fetch(
        `http://127.0.0.1:8008/support/rooms/${selectedRoom.room_id}/send/`,
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
        fetchMessages(selectedRoom.room_id);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  const closeRoom = async (roomId) => {
    try {
      await fetch(
        `http://127.0.0.1:8008/support/rooms/${roomId}/close/`,
        {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
        }
      );
      setSelectedRoom(null);
      fetchRooms();
    } catch (error) {
      console.error('Error closing room:', error);
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const RoomCard = ({ room, isPending }) => (
    <div
      className={`p-4 border rounded-lg cursor-pointer transition-all ${
        selectedRoom?.room_id === room.room_id
          ? 'bg-blue-50 border-blue-500'
          : 'hover:bg-gray-50 border-gray-200'
      }`}
      onClick={() => {
        if (!isPending) {
          setSelectedRoom(room);
          fetchMessages(room.room_id);
        }
      }}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <User className="w-5 h-5 text-gray-500" />
          <span className="font-medium">{room.customer_info?.email}</span>
        </div>
        {room.unread_count > 0 && (
          <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
            {room.unread_count}
          </span>
        )}
      </div>
      <p className="text-sm text-gray-600 mb-2">{room.subject}</p>
      {room.last_message && (
        <p className="text-xs text-gray-500 truncate">
          {room.last_message.message}
        </p>
      )}
      {isPending && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            acceptRoom(room.room_id);
          }}
          className="mt-2 w-full bg-blue-600 text-white py-1 rounded text-sm hover:bg-blue-700"
        >
          Accept Request
        </button>
      )}
    </div>
  );

  return (
    <div className="h-screen flex bg-gray-100">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r flex flex-col">
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <MessageCircle className="w-6 h-6" />
            Support Dashboard
          </h1>
          {notifications.length > 0 && (
            <div className="mt-2 flex items-center gap-1 text-sm text-red-600">
              <Bell className="w-4 h-4" />
              {notifications.length} new notifications
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Pending Requests */}
          {pendingRooms.length > 0 && (
            <div className="p-4">
              <h2 className="text-sm font-semibold text-gray-500 mb-2 flex items-center gap-1">
                <Clock className="w-4 h-4" />
                Pending Requests ({pendingRooms.length})
              </h2>
              <div className="space-y-2">
                {pendingRooms.map(room => (
                  <RoomCard key={room.id} room={room} isPending />
                ))}
              </div>
            </div>
          )}

          {/* Active Conversations */}
          <div className="p-4">
            <h2 className="text-sm font-semibold text-gray-500 mb-2 flex items-center gap-1">
              <CheckCircle className="w-4 h-4" />
              Active Conversations ({activeRooms.length})
            </h2>
            <div className="space-y-2">
              {activeRooms.map(room => (
                <RoomCard key={room.id} room={room} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedRoom ? (
          <>
            {/* Chat Header */}
            <div className="bg-white p-4 border-b flex justify-between items-center">
              <div>
                <h2 className="font-semibold">{selectedRoom.customer_info?.email}</h2>
                <p className="text-sm text-gray-500">Room ID: {selectedRoom.room_id}</p>
              </div>
              <button
                onClick={() => closeRoom(selectedRoom.room_id)}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
              >
                Close Chat
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-2 ${
                    msg.sender_type === 'agent' ? 'flex-row-reverse' : ''
                  }`}
                >
                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                      msg.sender_type === 'agent'
                        ? 'bg-blue-600 text-white rounded-tr-none'
                        : msg.sender_type === 'bot'
                        ? 'bg-purple-100 text-gray-800 rounded-tl-none'
                        : 'bg-white text-gray-800 rounded-tl-none border'
                    }`}
                  >
                    <p className="text-sm break-words">{msg.message}</p>
                    <span
                      className={`text-xs mt-1 block ${
                        msg.sender_type === 'agent' ? 'text-blue-200' : 'text-gray-500'
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
            <div className="p-4 bg-white border-t">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={loading || !newMessage.trim()}
                  className="bg-blue-600 text-white rounded-lg px-4 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg">Select a conversation to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SupportDashboard;