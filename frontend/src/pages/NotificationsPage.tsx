import React from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'

export default function NotificationsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  
  const { data: notifications, isLoading } = useQuery('notifications', () =>
    api.get('/notifications').then(res => res.data)
  )

  // Mutation to mark notification as read
  const markAsReadMutation = useMutation(
    (notificationId: string) => api.patch(`/notifications/${notificationId}/read`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('notifications')
      }
    }
  )

  // Mutation to mark all notifications as read
  const markAllAsReadMutation = useMutation(
    () => api.patch('/notifications/read-all'),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('notifications')
      }
    }
  )

  const handleNotificationClick = async (notification: any) => {
    // Mark as read if not already read
    if (!notification.isRead) {
      await markAsReadMutation.mutateAsync(notification.id)
    }

    // Navigate based on notification type
    if (notification.type === 'MATCH_REQUEST' || notification.type === 'MATCH_RESPONSE') {
      navigate('/matches')
    } else if (notification.type === 'MESSAGE' && notification.matchId) {
      navigate(`/messages/${notification.matchId}`)
    }
  }

  if (isLoading) {
    return <div className="flex justify-center py-8">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="mt-1 text-sm text-gray-500">
            Stay updated with your buddy matches and requests
          </p>
        </div>
        {notifications && notifications.some((n: any) => !n.isRead) && (
          <button
            onClick={() => markAllAsReadMutation.mutate()}
            disabled={markAllAsReadMutation.isLoading}
            className="btn-secondary text-sm disabled:opacity-50"
          >
            {markAllAsReadMutation.isLoading ? 'Marking...' : 'Mark all as read'}
          </button>
        )}
      </div>

      <div className="space-y-4">
        {notifications?.map((notification: any) => (
          <div 
            key={notification.id} 
            className={`card ${!notification.isRead ? 'bg-blue-50 border-blue-200' : ''} ${
              notification.type === 'MATCH_REQUEST' || notification.type === 'MATCH_RESPONSE' || notification.type === 'MESSAGE' 
                ? 'cursor-pointer hover:shadow-md transition-shadow' 
                : ''
            }`}
            onClick={() => handleNotificationClick(notification)}
          >
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
                {(notification.type === 'MATCH_REQUEST' || notification.type === 'MATCH_RESPONSE' || notification.type === 'MESSAGE') && (
                  <p className="text-xs text-blue-600 mt-1 font-medium">
                    Click to view details →
                  </p>
                )}
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
