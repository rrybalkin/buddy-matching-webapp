import React from 'react'

export default function RequestsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Buddy Requests</h1>
        <p className="mt-1 text-sm text-gray-500">
          Request a buddy or manage existing requests
        </p>
      </div>

      <div className="card">
        <div className="text-center py-8">
          <h3 className="text-lg font-medium text-gray-900">Request a Buddy</h3>
          <p className="mt-1 text-sm text-gray-500">
            Request a buddy to help you settle in or feel more connected.
          </p>
          <div className="mt-4 space-x-4">
            <button className="btn-primary">
              Request Relocation Buddy
            </button>
            <button className="btn-secondary">
              Request Office Buddy
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
