import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { api } from '../lib/api'
import { useAuth } from '../hooks/useAuth'

export default function MatchesPage() {
  const { user } = useAuth()
  const [respondingMatch, setRespondingMatch] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const { data: matches, isLoading } = useQuery('matches', () =>
    api.get('/matches').then(res => res.data)
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
                </div>
                {match.newcomer.profile?.bio && (
                  <div className="mt-2">
                    <span className="font-medium text-blue-800">Bio:</span>
                    <p className="mt-1 text-blue-700 text-sm">{match.newcomer.profile.bio}</p>
                  </div>
                )}
              </div>
            )}
            
            {match.message && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-700">{match.message}</p>
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
    </div>
  )
}
