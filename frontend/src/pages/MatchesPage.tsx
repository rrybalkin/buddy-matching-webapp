import React from 'react'
import { useQuery } from 'react-query'
import { api } from '../lib/api'
import { useAuth } from '../hooks/useAuth'

export default function MatchesPage() {
  const { user } = useAuth()

  const { data: matches, isLoading } = useQuery('matches', () =>
    api.get('/matches').then(res => res.data)
  )

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
                      {match.senderId === user?.id ? match.receiver.firstName[0] : match.sender.firstName[0]}
                    </span>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {match.senderId === user?.id ? match.receiver.firstName : match.sender.firstName} {match.senderId === user?.id ? match.receiver.lastName : match.sender.lastName}
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
                    <button className="btn-primary text-sm">Accept</button>
                    <button className="btn-secondary text-sm">Reject</button>
                  </div>
                )}
              </div>
            </div>
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
