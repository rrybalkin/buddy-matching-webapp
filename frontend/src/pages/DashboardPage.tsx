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
  BellIcon,
  UserPlusIcon
} from '@heroicons/react/24/outline'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

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

  const { data: newcomers, error: newcomersError, isLoading: newcomersLoading } = useQuery(
    'newcomers-dashboard',
    () => api.get('/users/newcomers').then(res => res.data),
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
        // Calculate newcomer buddy assignment statistics
        const totalNewcomers = newcomers?.length || 0
        const assignedNewcomers = newcomers?.filter((n: any) => n.buddyStatus === 'assigned').length || 0
        const unassignedNewcomers = totalNewcomers - assignedNewcomers

        const pieChartData = [
          { name: 'With Buddies', value: assignedNewcomers, color: '#10B981' },
          { name: 'Without Buddies', value: unassignedNewcomers, color: '#EF4444' }
        ]

        return (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
                    <UserPlusIcon className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total Newcomers
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {totalNewcomers}
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

            {/* Pie Chart */}
            {totalNewcomers > 0 && (
              <div className="card">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Newcomer Buddy Assignment Status</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={120}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: any) => [value, 'Newcomers']}
                        labelFormatter={(label: string) => `Status: ${label}`}
                      />
                      <Legend 
                        verticalAlign="bottom" 
                        height={36}
                        formatter={(value: string) => (
                          <span style={{ color: '#374151', fontSize: '14px' }}>
                            {value}
                          </span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-green-600">{assignedNewcomers}</div>
                    <div className="text-sm text-gray-500">With Buddies</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-600">{unassignedNewcomers}</div>
                    <div className="text-sm text-gray-500">Without Buddies</div>
                  </div>
                </div>
              </div>
            )}
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
                          {(() => {
                            // For HR-created matches (NEWCOMER_MATCH), show the appropriate partner
                            if (match.type === 'NEWCOMER_MATCH' && match.newcomer) {
                              // If current user is the receiver (buddy), show the newcomer
                              if (match.receiverId === user.id) {
                                return `${match.newcomer.firstName} ${match.newcomer.lastName}`
                              }
                              // If current user is the newcomer, show the receiver (buddy)
                              if (match.newcomer.id === user.id) {
                                return `${match.receiver.firstName} ${match.receiver.lastName}`
                              }
                              // If current user is HR, show both buddy and newcomer
                              return `${match.receiver.firstName} ${match.receiver.lastName} → ${match.newcomer.firstName} ${match.newcomer.lastName}`
                            }
                            // For other match types, use standard logic
                            return match.senderId === user.id ? 
                              `${match.receiver.firstName} ${match.receiver.lastName}` : 
                              `${match.sender.firstName} ${match.sender.lastName}`
                          })()}
                        </p>
                        <p className="text-sm text-gray-500 capitalize">
                          {match.type.replace('_', ' ').toLowerCase()}
                        </p>
                        <p className="text-xs text-gray-400">
                          {formatDate(match.startDate)} - {formatDate(match.endDate)}
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

      case 'NEWCOMER':
        const newcomerMatches = matches?.filter((m: any) => 
          m.newcomerId === user.id || (m.senderId === user.id || m.receiverId === user.id)
        ) || []

        const acceptedMatches = newcomerMatches.filter((m: any) => m.status === 'ACCEPTED')
        const pendingMatches = newcomerMatches.filter((m: any) => m.status === 'PENDING')

        return (
          <div className="space-y-6">
            {acceptedMatches.length > 0 ? (
              <div className="card">
                <div className="text-center">
                  <CheckCircleIcon className="mx-auto h-12 w-12 text-green-600 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Your Buddy Match is Ready!</h3>
                  <p className="text-gray-600 mb-4">
                    You've been matched with a buddy who can help you get started.
                  </p>
                </div>
              </div>
            ) : pendingMatches.length > 0 ? (
              <div className="card">
                <div className="text-center">
                  <ClockIcon className="mx-auto h-12 w-12 text-yellow-600 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Buddy Match Pending</h3>
                  <p className="text-gray-600 mb-4">
                    Your buddy match request is being reviewed. You'll be notified once it's confirmed.
                  </p>
                </div>
              </div>
            ) : (
              <div className="card">
                <div className="text-center">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Welcome to BuddyMatch!</h3>
                  <p className="text-gray-600 mb-4">
                    We're setting up your buddy match. You'll be notified once it's ready!
                  </p>
                </div>
              </div>
            )}

            {newcomerMatches.length > 0 && (
              <div className="card">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Your Matches</h3>
                <div className="space-y-3">
                  {newcomerMatches.map((match: any) => (
                    <div key={match.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {(() => {
                            // For NEWCOMER_MATCH type, show the buddy (receiver)
                            if (match.type === 'NEWCOMER_MATCH') {
                              return `${match.receiver.firstName} ${match.receiver.lastName}`
                            }
                            // For other match types, show the appropriate partner
                            return match.senderId === user.id ? 
                              `${match.receiver.firstName} ${match.receiver.lastName}` : 
                              `${match.sender.firstName} ${match.sender.lastName}`
                          })()}
                        </p>
                        <p className="text-sm text-gray-500 capitalize">
                          {match.type.replace('_', ' ').toLowerCase()}
                        </p>
                        <p className="text-xs text-gray-400">
                          {formatDate(match.startDate)} - {formatDate(match.endDate)}
                        </p>
                        {match.receiver.profile?.department && (
                          <p className="text-xs text-gray-400">
                            {match.receiver.profile.department}
                            {match.receiver.profile.position && ` - ${match.receiver.profile.position}`}
                          </p>
                        )}
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
                Welcome! You can help newcomers and other employees by being their buddy.
              </p>
              <button className="btn-primary">
                Request a Buddy
              </button>
            </div>
          </div>
        )
    }
  }

  // Show loading state
  if (matchesLoading || (user?.role === 'HR' && (buddyStatsLoading || newcomersLoading))) {
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
  if (matchesError || (user?.role === 'HR' && (buddyStatsError || newcomersError))) {
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
