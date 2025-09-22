import React from 'react'
import { useParams } from 'react-router-dom'

export default function MessagesPage() {
  const { matchId } = useParams()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
        <p className="mt-1 text-sm text-gray-500">
          Chat with your buddy matches
        </p>
      </div>

      <div className="card">
        <div className="text-center py-8">
          <h3 className="text-lg font-medium text-gray-900">Messages Coming Soon</h3>
          <p className="mt-1 text-sm text-gray-500">
            Real-time messaging will be available once you have accepted matches.
          </p>
        </div>
      </div>
    </div>
  )
}
