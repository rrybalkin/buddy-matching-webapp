import React from 'react'
import { useQuery } from 'react-query'
import { useAuth } from '../hooks/useAuth'
import { api } from '../lib/api'
import {
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  BellIcon
} from '@heroicons/react/24/outline'

export default function DashboardPage() {
  const { user } = useAuth()

  // Fetch dashboard data based on user role
  const { data: matches, error: matchesError, isLoading: matchesLoading } = useQuery('matches', () => 
    api.get('/matches').then(res => res.data),
    { retry: 1 }
  )

  const { data: buddyStats, error: buddyStatsError, isLoading: buddyStatsLoading } = useQuery(
    'buddy-dashboard',
    () => api.get('/buddies/dashboard').then(res => res.data),
    { enabled: user?.role === 'HR', retry: 1 }
  )

  const { data: notifications, error: notificationsError, isLoading: notificationsLoading } = useQuery('notifications', () =>
    api.get('/notifications?limit=5').then(res => res.data),
    { retry: 1 }
  )

  // Debug logging
  console.log('DashboardPage - User:', user)
  console.log('DashboardPage - Matches:', matches)
  console.log('DashboardPage - BuddyStats:', buddyStats)
  console.log('DashboardPage - Notifications:', notifications)
  console.log('DashboardPage - Errors:', { matchesError, buddyStatsError, notificationsError })

  const getRoleBasedContent = () => {
    switch (user?.role) {
      case 'HR':
        return (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="card">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <UserGroupIcon className="h-8 w-8 text-primary-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Buddies
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {buddyStats?.length || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircleIcon className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Active Matches
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {matches?.filter((m: any) => m.status === 'ACCEPTED').length || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ClockIcon className="h-8 w-8 text-yellow-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Pending Matches
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {matches?.filter((m: any) => m.status === 'PENDING').length || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        )

      case 'BUDDY':
        const myMatches = matches?.filter((m: any) => 
          m.receiverId === user.id || m.senderId === user.id
        ) || []

        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="card">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <CheckCircleIcon className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Active Matches
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {myMatches.filter((m: any) => m.status === 'ACCEPTED').length}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ClockIcon className="h-8 w-8 text-yellow-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Pending Requests
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {myMatches.filter((m: any) => m.status === 'PENDING' && m.receiverId === user.id).length}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {myMatches.length > 0 && (
              <div className="card">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Matches</h3>
                <div className="space-y-3">
                  {myMatches.slice(0, 3).map((match: any) => (
                    <div key={match.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {match.senderId === user.id ? match.receiver.firstName : match.sender.firstName} {match.senderId === user.id ? match.receiver.lastName : match.sender.lastName}
                        </p>
                        <p className="text-sm text-gray-500 capitalize">
                          {match.type.replace('_', ' ').toLowerCase()}
                        </p>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        match.status === 'ACCEPTED' ? 'bg-green-100 text-green-800' :
                        match.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {match.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )

      default:
        return (
          <div className="card">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Welcome to BuddyMatch!</h3>
              <p className="text-gray-600 mb-4">
                {user?.role === 'NEWCOMER' && "We're setting up your buddy match. You'll be notified once it's ready!"}
                {user?.role === 'RELOCATED_EMPLOYEE' && "Request a relocation buddy to help you settle in."}
                {user?.role === 'EXISTING_EMPLOYEE' && "Find an office buddy to help you feel more connected."}
              </p>
              {user?.role !== 'NEWCOMER' && (
                <button className="btn-primary">
                  Request a Buddy
                </button>
              )}
            </div>
          </div>
        )
    }
  }

  // Show loading state
  if (matchesLoading || (user?.role === 'HR' && buddyStatsLoading)) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.firstName}!
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Here's what's happening with your buddy matches.
          </p>
        </div>
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </div>
    )
  }

  // Show error state if there are critical errors
  if (matchesError || (user?.role === 'HR' && buddyStatsError)) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.firstName}!
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Here's what's happening with your buddy matches.
          </p>
        </div>
        <div className="card">
          <div className="text-center">
            <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-yellow-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Unable to load dashboard data</h3>
            <p className="mt-1 text-sm text-gray-500">
              There was an error loading your dashboard information. Please try refreshing the page.
            </p>
            <div className="mt-6">
              <button 
                onClick={() => window.location.reload()} 
                className="btn-primary"
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.firstName}!
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Here's what's happening with your buddy matches.
        </p>
      </div>

      {getRoleBasedContent()}

      {/* Recent Notifications */}
      {notifications && notifications.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Notifications</h3>
          <div className="space-y-3">
            {notifications.map((notification: any) => (
              <div key={notification.id} className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <BellIcon className="h-5 w-5 text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {notification.title}
                  </p>
                  <p className="text-sm text-gray-500">
                    {notification.message}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(notification.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
