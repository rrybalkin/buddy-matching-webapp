import React from 'react'
import { useQuery } from 'react-query'
import { api } from '../lib/api'

export default function NotificationsPage() {
  const { data: notifications, isLoading } = useQuery('notifications', () =>
    api.get('/notifications').then(res => res.data)
  )

  if (isLoading) {
    return <div className="flex justify-center py-8">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        <p className="mt-1 text-sm text-gray-500">
          Stay updated with your buddy matches and requests
        </p>
      </div>

      <div className="space-y-4">
        {notifications?.map((notification: any) => (
          <div key={notification.id} className={`card ${!notification.isRead ? 'bg-blue-50 border-blue-200' : ''}`}>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className={`h-2 w-2 rounded-full ${!notification.isRead ? 'bg-blue-600' : 'bg-gray-300'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-gray-900">
                  {notification.title}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {notification.message}
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  {new Date(notification.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {notifications?.length === 0 && (
        <div className="text-center py-8">
          <h3 className="text-lg font-medium text-gray-900">No notifications</h3>
          <p className="mt-1 text-sm text-gray-500">
            You're all caught up! New notifications will appear here.
          </p>
        </div>
      )}
    </div>
  )
}
