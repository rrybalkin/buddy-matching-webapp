import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import {
  HomeIcon,
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  UserIcon,
  BellIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowRightOnRectangleIcon,
  UserPlusIcon
} from '@heroicons/react/24/outline'
import { useSocket } from '../contexts/SocketContext'
import { useQuery } from 'react-query'
import { api } from '../lib/api'
import { formatRoleForDisplay } from '../lib/roleUtils'

const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'Buddies', href: '/buddies', icon: UserGroupIcon, roles: ['HR', 'BUDDY'] },
  { name: 'NewComers', href: '/newcomers', icon: UserPlusIcon, roles: ['HR'] },
  { name: 'Matches', href: '/matches', icon: ChatBubbleLeftRightIcon },
  { name: 'Messages', href: '/messages', icon: ChatBubbleLeftRightIcon },
  { name: 'Profile', href: '/profile', icon: UserIcon },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, logout } = useAuth()
  const { socket } = useSocket()
  const location = useLocation()

  // Fetch unread notification count
  const { data: notificationCount } = useQuery(
    'unread-notifications',
    () => api.get('/notifications/unread-count').then(res => res.data),
    {
      refetchInterval: 30000, // Refetch every 30 seconds
    }
  )

  const handleLogout = () => {
    logout()
    if (socket) {
      socket.disconnect()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white">
          <div className="flex h-16 items-center justify-between px-4">
            <h1 className="text-xl font-bold text-primary-600">BuddyMatch</h1>
            <button
              type="button"
              className="text-gray-400 hover:text-gray-600"
              onClick={() => setSidebarOpen(false)}
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation.map((item) => {
              // Check if user has access to this navigation item
              if (item.roles && !item.roles.includes(user?.role || '')) {
                return null
              }
              
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                    isActive
                      ? 'bg-primary-100 text-primary-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
          <div className="flex h-16 items-center px-4">
            <h1 className="text-xl font-bold text-primary-600">BuddyMatch</h1>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation.map((item) => {
              // Check if user has access to this navigation item
              if (item.roles && !item.roles.includes(user?.role || '')) {
                return null
              }
              
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                    isActive
                      ? 'bg-primary-100 text-primary-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Bars3Icon className="h-6 w-6" />
          </button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1" />
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              {/* Notifications */}
              <Link
                to="/notifications"
                className="relative -m-2 p-2 text-gray-400 hover:text-gray-500"
              >
                <BellIcon className="h-6 w-6" />
                {notificationCount?.count > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-xs text-white flex items-center justify-center">
                    {notificationCount.count}
                  </span>
                )}
              </Link>

              {/* User menu */}
              <div className="flex items-center gap-x-4">
                <div className="text-sm">
                  <div className="font-medium text-gray-900">
                    {user?.firstName} {user?.lastName}
                  </div>
                  <div className="text-gray-500">{formatRoleForDisplay(user?.role || '')}</div>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-gray-400 hover:text-gray-500"
                  title="Logout"
                >
                  <ArrowRightOnRectangleIcon className="h-6 w-6" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
