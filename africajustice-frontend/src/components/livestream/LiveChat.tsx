import { FC, useEffect, useRef, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { io, Socket } from 'socket.io-client'

interface ChatMessage {
  id: string
  streamId: string
  username: string
  message: string
  timestamp: number
  role?: string
}

interface LiveChatProps {
  streamId: string
  caseId?: string
}

const resolveSocketOrigin = (): string => {
  const fallback = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5000'
  const apiUrl = import.meta.env.VITE_API_URL as string | undefined
  if (!apiUrl) return fallback
  try {
    return new URL(apiUrl).origin
  } catch {
    return apiUrl.replace(/\/api\/v1\/?$/i, '') || fallback
  }
}

const LiveChatComponent: FC<LiveChatProps> = ({ streamId, caseId }) => {
  const { user } = useAuth()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const socketRef = useRef<Socket | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Initialize socket connection
  useEffect(() => {
    const socketOrigin = resolveSocketOrigin()
    const socket = io(socketOrigin, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    })

    socket.on('connect', () => {
      setIsConnected(true)
      // Join stream room
      const displayName = user?.name || user?.email || 'Anonymous'
      socket.emit('livestream:join', { streamId, caseId, userId: user?.id, username: displayName })
    })

    socket.on('livestream:message', (data: ChatMessage) => {
      setMessages((prev) => [...prev, data])
    })

    socket.on('disconnect', () => {
      setIsConnected(false)
    })

    socketRef.current = socket

    return () => {
      socket.disconnect()
    }
  }, [streamId, caseId, user])

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim() || !socketRef.current) return

    const message: ChatMessage = {
      id: `${Date.now()}`,
      streamId,
      username: user?.name || user?.email || 'Anonymous',
      message: inputValue,
      timestamp: Date.now(),
      role: user?.role,
    }

    socketRef.current.emit('livestream:message', message)
    setInputValue('')
  }

  return (
    <div className="jc-livestream-chat">
      <style>{`
        .jc-livestream-chat {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          overflow: hidden;
        }

        .jc-chat-header {
          padding: 15px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .jc-chat-title {
          font-weight: bold;
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .jc-chat-status {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: ${isConnected ? '#4CAF50' : '#f44336'};
        }

        .jc-chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 15px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .jc-chat-message {
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 8px 12px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 6px;
          font-size: 12px;
          line-height: 1.4;
        }

        .jc-chat-message-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .jc-chat-username {
          font-weight: bold;
          color: #4CAF50;
        }

        .jc-chat-username.admin {
          color: #ff9800;
        }

        .jc-chat-time {
          font-size: 11px;
          color: #888;
        }

        .jc-chat-text {
          color: #fff;
          word-break: break-word;
        }

        .jc-chat-form {
          padding: 12px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          gap: 8px;
        }

        .jc-chat-input {
          flex: 1;
          padding: 8px 12px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 4px;
          background: rgba(255, 255, 255, 0.05);
          color: white;
          font-size: 12px;
        }

        .jc-chat-input::placeholder {
          color: rgba(255, 255, 255, 0.5);
        }

        .jc-chat-button {
          padding: 8px 16px;
          background: #4CAF50;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          font-weight: bold;
          transition: background 0.3s;
        }

        .jc-chat-button:hover:not(:disabled) {
          background: #45a049;
        }

        .jc-chat-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .jc-chat-empty {
          display: flex;
          align-items: center;
          justify-content: center;
          flex: 1;
          color: rgba(255, 255, 255, 0.4);
          font-size: 12px;
          text-align: center;
          padding: 20px;
        }

        .jc-chat-messages::-webkit-scrollbar {
          width: 6px;
        }

        .jc-chat-messages::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
        }

        .jc-chat-messages::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
        }

        .jc-chat-messages::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      `}</style>

      <div className="jc-chat-header">
        <div className="jc-chat-title">
          <span className="jc-chat-status" />
          Live Chat
        </div>
        <span style={{ fontSize: '12px', color: '#aaa' }}>{messages.length}</span>
      </div>

      <div className="jc-chat-messages">
        {messages.length === 0 ? (
          <div className="jc-chat-empty">No messages yet. Be the first to chat!</div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="jc-chat-message">
              <div className="jc-chat-message-header">
                <span className={`jc-chat-username ${msg.role === 'admin' || msg.role === 'investigator' ? 'admin' : ''}`}>
                  {msg.username}
                </span>
                <span className="jc-chat-time">{new Date(msg.timestamp).toLocaleTimeString()}</span>
              </div>
              <div className="jc-chat-text">{msg.message}</div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="jc-chat-form" onSubmit={handleSendMessage}>
        <input
          type="text"
          className="jc-chat-input"
          placeholder="Type a message..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          disabled={!isConnected}
        />
        <button type="submit" className="jc-chat-button" disabled={!isConnected || !inputValue.trim()}>
          Send
        </button>
      </form>
    </div>
  )
}

export default LiveChatComponent
