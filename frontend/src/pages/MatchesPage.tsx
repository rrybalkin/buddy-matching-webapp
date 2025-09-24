import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { api } from '../lib/api'
import { useAuth } from '../hooks/useAuth'
import FeedbackModal from '../components/FeedbackModal'
import { ChatBubbleLeftRightIcon, EyeIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid'

// Helper function to format dates for display
const formatDate = (dateString: string) => {
  if (!dateString) return 'Not set'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export default function MatchesPage() {
  const { user } = useAuth()
  const [respondingMatch, setRespondingMatch] = useState<string | null>(null)
  const [feedbackModal, setFeedbackModal] = useState<{ isOpen: boolean, matchId: string, partner: string }>({
    isOpen: false,
    matchId: '',
    partner: ''
  })
  const [viewingFeedback, setViewingFeedback] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const { data: matches, isLoading } = useQuery('matches', () =>
    api.get('/matches').then(res => res.data)
  )

  // Get feedback for a specific match
  const { data: matchFeedback } = useQuery(
    ['feedback', viewingFeedback],
    () => api.get(`/feedback/match/${viewingFeedback}`).then(res => res.data),
    { enabled: !!viewingFeedback }
  )

  // Get all feedback for HR
  const { data: allFeedback } = useQuery(
    ['feedback-all', viewingFeedback],
    () => api.get(`/feedback/match/${viewingFeedback}/all`).then(res => res.data),
    { enabled: !!viewingFeedback && user?.role === 'HR' }
  )

  // Respond to match mutation
  const respondToMatchMutation = useMutation(
    ({ matchId, status, message }: { matchId: string, status: 'ACCEPTED' | 'REJECTED', message?: string }) =>
      api.patch(`/matches/${matchId}/respond`, { status, message }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('matches')
        queryClient.invalidateQueries('notifications')
        setRespondingMatch(null)
      }
    }
  )

  const handleRespondToMatch = async (matchId: string, status: 'ACCEPTED' | 'REJECTED') => {
    setRespondingMatch(matchId)
    try {
      await respondToMatchMutation.mutateAsync({ matchId, status })
    } catch (error) {
      console.error('Error responding to match:', error)
      setRespondingMatch(null)
    }
  }

  const handleOpenFeedback = (matchId: string, partner: string) => {
    setFeedbackModal({ isOpen: true, matchId, partner })
  }

  const handleCloseFeedback = () => {
    setFeedbackModal({ isOpen: false, matchId: '', partner: '' })
  }

  const handleFeedbackSuccess = () => {
    queryClient.invalidateQueries('feedback')
    queryClient.invalidateQueries('matches')
    // Force immediate refetch of matches to update button state
    queryClient.refetchQueries('matches')
  }

  const handleViewFeedback = (matchId: string) => {
    setViewingFeedback(matchId)
  }

  const handleCloseViewFeedback = () => {
    setViewingFeedback(null)
  }

  // Helper function to check if user can leave feedback
  const canLeaveFeedback = (match: any) => {
    // HR users cannot leave feedback, only view it
    if (user?.role === 'HR') return false
    
    if (match.type !== 'NEWCOMER_MATCH') return false
    if (!['ACCEPTED', 'COMPLETED'].includes(match.status)) return false
    
    // Check if user is part of this match
    const isParticipant = match.senderId === user?.id || 
                         match.receiverId === user?.id || 
                         match.newcomerId === user?.id
    
    return isParticipant
  }

  // Helper function to check if user has already submitted feedback
  const hasSubmittedFeedback = (match: any) => {
    if (!match.feedback || !Array.isArray(match.feedback)) return false
    return match.feedback.some((feedback: any) => feedback.userId === user?.id)
  }

  // Helper function to get partner name for feedback
  const getPartnerName = (match: any) => {
    if (match.type === 'NEWCOMER_MATCH' && match.newcomer) {
      if (match.receiverId === user?.id) {
        return `${match.newcomer.firstName} ${match.newcomer.lastName}`
      }
      if (match.newcomer.id === user?.id) {
        return `${match.receiver.firstName} ${match.receiver.lastName}`
      }
      return `${match.receiver.firstName} ${match.receiver.lastName}`
    }
    return match.senderId === user?.id ? 
      `${match.receiver.firstName} ${match.receiver.lastName}` : 
      `${match.sender.firstName} ${match.sender.lastName}`
  }

  if (isLoading) {
    return <div className="flex justify-center py-8">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Matches</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your buddy matches and requests
        </p>
      </div>

      <div className="space-y-4">
        {matches?.map((match: any) => (
          <div key={match.id} className="card" data-testid="match-card">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                    <span className="text-sm font-medium text-primary-600">
                      {(() => {
                        // For HR-created matches (NEWCOMER_MATCH), show the appropriate partner initials
                        if (match.type === 'NEWCOMER_MATCH' && match.newcomer) {
                          // If current user is the receiver (buddy), show the newcomer initials
                          if (match.receiverId === user?.id) {
                            return match.newcomer.firstName[0]
                          }
                          // If current user is the newcomer, show the receiver (buddy) initials
                          if (match.newcomer.id === user?.id) {
                            return match.receiver.firstName[0]
                          }
                          // If current user is HR, show the buddy initials
                          return match.receiver.firstName[0]
                        }
                        // For other match types, use standard logic
                        return match.senderId === user?.id ? match.receiver.firstName[0] : match.sender.firstName[0]
                      })()}
                    </span>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {(() => {
                      // For HR-created matches (NEWCOMER_MATCH), show the appropriate partner
                      if (match.type === 'NEWCOMER_MATCH' && match.newcomer) {
                        // If current user is the receiver (buddy), show the newcomer
                        if (match.receiverId === user?.id) {
                          return `${match.newcomer.firstName} ${match.newcomer.lastName}`
                        }
                        // If current user is the newcomer, show the receiver (buddy)
                        if (match.newcomer.id === user?.id) {
                          return `${match.receiver.firstName} ${match.receiver.lastName}`
                        }
                        // If current user is HR, show both buddy and newcomer
                        return `${match.receiver.firstName} ${match.receiver.lastName} → ${match.newcomer.firstName} ${match.newcomer.lastName}`
                      }
                      // For other match types, use standard logic
                      return match.senderId === user?.id ? 
                        `${match.receiver.firstName} ${match.receiver.lastName}` : 
                        `${match.sender.firstName} ${match.sender.lastName}`
                    })()}
                  </h3>
                  <p className="text-sm text-gray-500 capitalize">
                    {match.type.replace('_', ' ').toLowerCase()}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  match.status === 'ACCEPTED' ? 'bg-green-100 text-green-800' :
                  match.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {match.status}
                </span>
                {match.status === 'PENDING' && match.receiverId === user?.id && (
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => handleRespondToMatch(match.id, 'ACCEPTED')}
                      disabled={respondingMatch === match.id}
                      className="btn-primary text-sm disabled:opacity-50"
                    >
                      {respondingMatch === match.id ? 'Processing...' : 'Accept'}
                    </button>
                    <button 
                      onClick={() => handleRespondToMatch(match.id, 'REJECTED')}
                      disabled={respondingMatch === match.id}
                      className="btn-secondary text-sm disabled:opacity-50"
                    >
                      {respondingMatch === match.id ? 'Processing...' : 'Reject'}
                    </button>
                  </div>
                )}
                
                {/* Feedback buttons */}
                {canLeaveFeedback(match) && !hasSubmittedFeedback(match) && (
                  <button
                    onClick={() => handleOpenFeedback(match.id, getPartnerName(match))}
                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-purple-700 bg-purple-100 border border-purple-300 rounded-md hover:bg-purple-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                  >
                    <ChatBubbleLeftRightIcon className="h-4 w-4 mr-1" />
                    Leave Feedback
                  </button>
                )}
                
                {/* Feedback submitted indicator */}
                {canLeaveFeedback(match) && hasSubmittedFeedback(match) && (
                  <span className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-green-700 bg-green-100 border border-green-300 rounded-md">
                    <ChatBubbleLeftRightIcon className="h-4 w-4 mr-1" />
                    Feedback Submitted
                  </span>
                )}
                
                {/* HR View Feedback button */}
                {user?.role === 'HR' && match.type === 'NEWCOMER_MATCH' && (
                  <button
                    onClick={() => handleViewFeedback(match.id)}
                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-100 border border-blue-300 rounded-md hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <EyeIcon className="h-4 w-4 mr-1" />
                    View Feedback
                  </button>
                )}
              </div>
            </div>
            
            {/* Newcomer Information for HR-created matches */}
            {match.newcomer && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="text-sm font-medium text-blue-900 mb-2">Newcomer Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="font-medium text-blue-800">Name:</span>
                    <span className="ml-2 text-blue-700">{match.newcomer.firstName} {match.newcomer.lastName}</span>
                  </div>
                  <div>
                    <span className="font-medium text-blue-800">Email:</span>
                    <span className="ml-2 text-blue-700">{match.newcomer.email}</span>
                  </div>
                  {match.newcomer.profile?.department && (
                    <div>
                      <span className="font-medium text-blue-800">Department:</span>
                      <span className="ml-2 text-blue-700">{match.newcomer.profile.department}</span>
                    </div>
                  )}
                  {match.newcomer.profile?.position && (
                    <div>
                      <span className="font-medium text-blue-800">Position:</span>
                      <span className="ml-2 text-blue-700">{match.newcomer.profile.position}</span>
                    </div>
                  )}
                  {match.newcomer.profile?.location && (
                    <div>
                      <span className="font-medium text-blue-800">Location:</span>
                      <span className="ml-2 text-blue-700">{match.newcomer.profile.location}</span>
                    </div>
                  )}
                  {match.newcomer.profile?.startDate && (
                    <div>
                      <span className="font-medium text-blue-800">Start Date:</span>
                      <span className="ml-2 text-blue-700">{formatDate(match.newcomer.profile.startDate)}</span>
                    </div>
                  )}
                </div>
                {match.newcomer.profile?.bio && (
                  <div className="mt-2">
                    <span className="font-medium text-blue-800">Bio:</span>
                    <p className="mt-1 text-blue-700 text-sm">{match.newcomer.profile.bio}</p>
                  </div>
                )}
              </div>
            )}
            
            {/* Match Duration Information - for all match types */}
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Match Duration</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Start Date:</span>
                  <span className="ml-2 text-gray-600">{formatDate(match.startDate)}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">End Date:</span>
                  <span className="ml-2 text-gray-600">{formatDate(match.endDate)}</span>
                </div>
              </div>
            </div>
            
            {match.message && (
              <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 shadow-sm">
                <div className="flex items-start space-x-2">
                  <div className="flex-shrink-0">
                    <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-xs font-bold text-blue-600">
                        {match.type === 'NEWCOMER_MATCH' ? 'HR' : 'B'}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="text-sm font-semibold text-blue-900">
                        {match.type === 'NEWCOMER_MATCH' ? 'Message from HR' : 'Message from Buddy'}
                      </h4>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {match.type === 'NEWCOMER_MATCH' ? 'Official' : 'Personal'}
                      </span>
                    </div>
                    <p className="text-sm text-blue-800 leading-relaxed">{match.message}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {matches?.length === 0 && (
        <div className="text-center py-8">
          <h3 className="text-lg font-medium text-gray-900">No matches yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            Your buddy matches will appear here once they're created.
          </p>
        </div>
      )}

      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={feedbackModal.isOpen}
        onClose={handleCloseFeedback}
        matchId={feedbackModal.matchId}
        matchPartner={feedbackModal.partner}
        onSuccess={handleFeedbackSuccess}
      />

      {/* View Feedback Modal */}
      {viewingFeedback && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Feedback for Match
                </h3>
                <button
                  onClick={handleCloseViewFeedback}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                {user?.role === 'HR' ? (
                  // HR sees all feedback
                  allFeedback?.map((feedback: any) => (
                    <div key={feedback.id} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">
                          {feedback.user.firstName} {feedback.user.lastName}
                        </h4>
                        <span className="text-sm text-gray-500 capitalize">
                          {feedback.user.role}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1 mb-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <StarIconSolid
                            key={star}
                            className={`h-4 w-4 ${
                              star <= feedback.rating ? 'text-yellow-400' : 'text-gray-300'
                            }`}
                          />
                        ))}
                        <span className="ml-2 text-sm text-gray-600">
                          {feedback.rating}/5
                        </span>
                      </div>
                      {feedback.comment && (
                        <p className="text-sm text-gray-700">{feedback.comment}</p>
                      )}
                      <div className="flex space-x-4 mt-2 text-xs text-gray-500">
                        {feedback.helpfulness && (
                          <span>Helpfulness: {feedback.helpfulness}/5</span>
                        )}
                        {feedback.communication && (
                          <span>Communication: {feedback.communication}/5</span>
                        )}
                        {feedback.availability && (
                          <span>Availability: {feedback.availability}/5</span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  // Regular users see only their feedback
                  matchFeedback?.map((feedback: any) => (
                    <div key={feedback.id} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-1 mb-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <StarIconSolid
                            key={star}
                            className={`h-4 w-4 ${
                              star <= feedback.rating ? 'text-yellow-400' : 'text-gray-300'
                            }`}
                          />
                        ))}
                        <span className="ml-2 text-sm text-gray-600">
                          {feedback.rating}/5
                        </span>
                      </div>
                      {feedback.comment && (
                        <p className="text-sm text-gray-700">{feedback.comment}</p>
                      )}
                      <div className="flex space-x-4 mt-2 text-xs text-gray-500">
                        {feedback.helpfulness && (
                          <span>Helpfulness: {feedback.helpfulness}/5</span>
                        )}
                        {feedback.communication && (
                          <span>Communication: {feedback.communication}/5</span>
                        )}
                        {feedback.availability && (
                          <span>Availability: {feedback.availability}/5</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
                
                {(!matchFeedback?.length && !allFeedback?.length) && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No feedback submitted yet.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
