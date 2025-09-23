import React, { useState, useEffect } from 'react'
import { useQuery } from 'react-query'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useSocket } from '../contexts/SocketContext'
import { useAuth } from '../hooks/useAuth'
import { 
  ChatBubbleLeftRightIcon, 
  UserGroupIcon, 
  ClockIcon,
  CheckIcon,
  CheckCircleIcon,
  EllipsisVerticalIcon,
  PaperAirplaneIcon,
  UserIcon
} from '@heroicons/react/24/outline'
import { formatDistanceToNow } from 'date-fns'

interface BuddyMatch {
  id: string
  sender: {
    id: string
    firstName: string
    lastName: string
    email: string
    profile?: {
      avatar?: string
      department?: string
      position?: string
    }
  }
  receiver: {
    id: string
    firstName: string
    lastName: string
    email: string
    profile?: {
      avatar?: string
      department?: string
      position?: string
    }
  }
  newcomer?: {
    id: string
    firstName: string
    lastName: string
    email: string
    profile?: {
      department?: string
      position?: string
      location?: string
      bio?: string
    }
  }
  status: string
  type: string
  createdAt: string
  updatedAt: string
  _count: {
    messages: number
  }
  messages: {
    content: string
    createdAt: string
    senderId: string
    isRead: boolean
  }[]
}

interface ChatMessage {
  id: string
  content: string
  senderId: string
  createdAt: string
  isRead: boolean
}

export default function MyBuddiesPage() {
  const [selectedMatch, setSelectedMatch] = useState<BuddyMatch | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const { socket } = useSocket()
  const { user } = useAuth()
  const navigate = useNavigate()

  // Check if user has access to this page
  if (user?.role === 'HR') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
          <p className="mt-1 text-sm text-gray-500">
            This page is not available for HR users
          </p>
        </div>
        <div className="card">
          <div className="text-center py-8">
            <div className="text-red-500 mb-2">🚫</div>
            <h3 className="text-lg font-medium text-gray-900">Access Restricted</h3>
            <p className="mt-1 text-sm text-gray-500">
              HR users manage matches but do not participate in buddy relationships. 
              Use the "Matches" page to manage buddy assignments.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Fetch accepted matches (buddies)
  const { data: matches = [], refetch: refetchMatches, isLoading: matchesLoading, error: matchesError } = useQuery(
    'my-buddies',
    () => api.get('/matches?status=ACCEPTED').then(res => res.data),
    {
      refetchInterval: 30000, // Refetch every 30 seconds
    }
  )

  // Fetch messages for selected match
  const { data: matchMessages = [], refetch: refetchMessages } = useQuery(
    ['match-messages', selectedMatch?.id],
    () => api.get(`/matches/${selectedMatch?.id}/messages`).then(res => res.data),
    {
      enabled: !!selectedMatch?.id,
      refetchInterval: 5000, // Refetch every 5 seconds
    }
  )

  // Update messages when data changes
  useEffect(() => {
    setMessages(matchMessages)
  }, [matchMessages])

  // Socket listeners for real-time updates
  useEffect(() => {
    if (!socket) return

    const handleNewMessage = (data: { matchId: string; message: ChatMessage }) => {
      if (data.matchId === selectedMatch?.id) {
        setMessages(prev => [...prev, data.message])
      }
      // Refetch matches to update last message info
      refetchMatches()
    }

    const handleMessageRead = (data: { matchId: string; messageId: string }) => {
      if (data.matchId === selectedMatch?.id) {
        setMessages(prev => 
          prev.map(msg => 
            msg.id === data.messageId ? { ...msg, isRead: true } : msg
          )
        )
      }
    }

    socket.on('new-message', handleNewMessage)
    socket.on('message-read', handleMessageRead)

    return () => {
      socket.off('new-message', handleNewMessage)
      socket.off('message-read', handleMessageRead)
    }
  }, [socket, selectedMatch?.id, refetchMatches])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedMatch) return

    try {
      await api.post(`/matches/${selectedMatch.id}/messages`, {
        content: newMessage.trim()
      })
      setNewMessage('')
      refetchMessages()
      refetchMatches() // Update the last message info
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  const getBuddyInfo = (match: BuddyMatch) => {
    // Determine which user is the buddy (not the current user)
    const currentUserId = user?.id
    
    // For HR-created matches (NEWCOMER_MATCH), the buddy should see the newcomer as their partner
    if (match.type === 'NEWCOMER_MATCH' && match.newcomer) {
      // If current user is the receiver (buddy), show the newcomer
      if (match.receiver.id === currentUserId) {
        return {
          id: match.newcomer.id,
          firstName: match.newcomer.firstName,
          lastName: match.newcomer.lastName,
          email: match.newcomer.email,
          profile: match.newcomer.profile
        }
      }
      // If current user is the newcomer, show the receiver (buddy)
      if (match.newcomer.id === currentUserId) {
        return match.receiver
      }
    }
    
    // For other match types, use the standard sender/receiver logic
    const isSender = match.sender.id === currentUserId
    return isSender ? match.receiver : match.sender
  }

  const getMatchTypeLabel = (type: string) => {
    switch (type) {
      case 'NEWCOMER_MATCH': return 'Newcomer'
      case 'RELOCATION_SUPPORT': return 'Relocation'
      case 'OFFICE_CONNECTION': return 'Office'
      default: return type
    }
  }

  const getMatchTypeColor = (type: string) => {
    switch (type) {
      case 'NEWCOMER_MATCH': return 'bg-blue-100 text-blue-800'
      case 'RELOCATION_SUPPORT': return 'bg-green-100 text-green-800'
      case 'OFFICE_CONNECTION': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatLastMessageTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true })
    } catch {
      return 'Unknown time'
    }
  }

  const getUnreadCount = (match: BuddyMatch) => {
    // This would need to be calculated based on unread messages
    // For now, return 0 as we don't have this data in the current API
    return 0
  }

  if (matchesLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Buddies</h1>
          <p className="mt-1 text-sm text-gray-500">
            Your active buddy connections
          </p>
        </div>
        <div className="card">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-500">Loading your buddies...</p>
          </div>
        </div>
      </div>
    )
  }

  if (matchesError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Buddies</h1>
          <p className="mt-1 text-sm text-gray-500">
            Your active buddy connections
          </p>
        </div>
        <div className="card">
          <div className="text-center py-8">
            <div className="text-red-500 mb-2">⚠️</div>
            <h3 className="text-lg font-medium text-gray-900">Error loading buddies</h3>
            <p className="mt-1 text-sm text-gray-500">
              There was an error loading your buddy connections. Please try again.
            </p>
            <button
              onClick={() => refetchMatches()}
              className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (matches.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Buddies</h1>
          <p className="mt-1 text-sm text-gray-500">
            Your active buddy connections
          </p>
        </div>

        <div className="card">
          <div className="text-center py-12">
            <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">No buddy connections yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              {user?.role === 'NEWCOMER' 
                ? 'Your buddy will be assigned by HR. Check back later or contact HR if you need assistance.'
                : 'Start by exploring available matches or request a buddy to get connected.'
              }
            </p>
            {user?.role !== 'NEWCOMER' && (
              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => navigate('/buddies')}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Find Buddies
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Buddies</h1>
        <p className="mt-1 text-sm text-gray-500">
          Your active buddy connections ({matches.length})
        </p>
      </div>

      <div className="flex h-[600px] bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Chat List */}
        <div className="w-1/3 border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Buddies</h2>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {matches.map((match) => {
              const buddy = getBuddyInfo(match)
              const unreadCount = getUnreadCount(match)
              
              return (
                <div
                  key={match.id}
                  onClick={() => setSelectedMatch(match)}
                  className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                    selectedMatch?.id === match.id ? 'bg-primary-50 border-primary-200' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      <div className="relative">
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                          {buddy.profile?.avatar ? (
                            <img
                              src={buddy.profile.avatar}
                              alt={`${buddy.firstName} ${buddy.lastName}`}
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          ) : (
                            <UserIcon className="h-6 w-6 text-gray-500" />
                          )}
                        </div>
                        <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-400 border-2 border-white rounded-full"></div>
                      </div>
                    </div>

                    {/* Buddy Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {buddy.firstName} {buddy.lastName}
                        </p>
                        <div className="flex items-center space-x-1">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getMatchTypeColor(match.type)}`}>
                            {getMatchTypeLabel(match.type)}
                          </span>
                          {unreadCount > 0 && (
                            <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                              {unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <p className="text-xs text-gray-500 truncate">
                        {buddy.profile?.department} • {buddy.profile?.position}
                      </p>
                      
                      {match.messages && match.messages.length > 0 ? (
                        <div className="mt-1">
                          <p className="text-sm text-gray-600 truncate">
                            {match.messages[0].content}
                          </p>
                          <p className="text-xs text-gray-400">
                            {formatLastMessageTime(match.messages[0].createdAt)}
                          </p>
                        </div>
                      ) : (
                        <div className="mt-1">
                          <p className="text-sm text-gray-400 italic">
                            No messages yet
                          </p>
                          <p className="text-xs text-gray-400">
                            {formatLastMessageTime(match.createdAt)}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* More Actions */}
                    <div className="flex-shrink-0">
                      <button className="p-1 text-gray-400 hover:text-gray-600">
                        <EllipsisVerticalIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Chat Interface */}
        <div className="flex-1 flex flex-col">
          {selectedMatch ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                    {getBuddyInfo(selectedMatch).profile?.avatar ? (
                      <img
                        src={getBuddyInfo(selectedMatch).profile?.avatar}
                        alt={`${getBuddyInfo(selectedMatch).firstName} ${getBuddyInfo(selectedMatch).lastName}`}
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <UserIcon className="h-5 w-5 text-gray-500" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">
                      {getBuddyInfo(selectedMatch).firstName} {getBuddyInfo(selectedMatch).lastName}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {getBuddyInfo(selectedMatch).profile?.department} • {getBuddyInfo(selectedMatch).profile?.position}
                    </p>
                  </div>
                  <div className="ml-auto">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getMatchTypeColor(selectedMatch.type)}`}>
                      {getMatchTypeLabel(selectedMatch.type)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center py-8">
                    <ChatBubbleLeftRightIcon className="mx-auto h-8 w-8 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-500">No messages yet</p>
                    <p className="text-xs text-gray-400">Start the conversation!</p>
                  </div>
                ) : (
                  messages.map((message) => {
                    const isOwn = message.senderId === user?.id
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            isOwn
                              ? 'bg-primary-600 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <div className={`flex items-center mt-1 space-x-1 ${
                            isOwn ? 'justify-end' : 'justify-start'
                          }`}>
                            <span className="text-xs opacity-70">
                              {formatLastMessageTime(message.createdAt)}
                            </span>
                            {isOwn && (
                              <div className="flex items-center space-x-1">
                                {message.isRead ? (
                                  <CheckCircleIcon className="h-3 w-3" />
                                ) : (
                                  <CheckIcon className="h-3 w-3" />
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-gray-200">
                <form onSubmit={handleSendMessage} className="flex space-x-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <PaperAirplaneIcon className="h-4 w-4" />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Select a buddy</h3>
                <p className="mt-1 text-sm text-gray-500">Choose a buddy from the list to start chatting</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
