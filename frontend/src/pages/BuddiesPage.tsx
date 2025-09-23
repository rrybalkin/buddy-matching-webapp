import { useState } from 'react'
import { useQuery } from 'react-query'
import { api } from '../lib/api'
import { useAuth } from '../hooks/useAuth'
import { useDebounce } from '../hooks/useDebounce'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import CreateMatchModal from '../components/CreateMatchModal'
import BuddyMatchModal from '../components/BuddyMatchModal'

export default function BuddiesPage() {
  const { user } = useAuth()
  
  // Local state for input fields (immediate updates)
  const [inputFilters, setInputFilters] = useState({
    location: '',
    unit: '',
    techStack: '',
    interests: '',
    available: ''
  })

  // Modal state
  const [selectedBuddy, setSelectedBuddy] = useState<{id: string, name: string} | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isBuddyModalOpen, setIsBuddyModalOpen] = useState(false)

  // Debounced filters for API calls (delayed updates)
  const debouncedFilters = useDebounce(inputFilters, 500)

  const { data: buddies, isLoading, isFetching } = useQuery(
    ['buddies', debouncedFilters],
    () => api.get('/buddies', { params: debouncedFilters }).then(res => res.data),
    {
      keepPreviousData: true, // Keep previous data while fetching new data
    }
  )

  const handleFilterChange = (key: string, value: string) => {
    setInputFilters(prev => ({ ...prev, [key]: value }))
  }

  const handleCreateMatch = (buddyId: string, buddyName: string) => {
    setSelectedBuddy({ id: buddyId, name: buddyName })
    if (user?.role === 'HR') {
      setIsModalOpen(true)
    } else if (user?.role === 'BUDDY') {
      setIsBuddyModalOpen(true)
    }
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedBuddy(null)
  }

  const handleCloseBuddyModal = () => {
    setIsBuddyModalOpen(false)
    setSelectedBuddy(null)
  }

  if (isLoading) {
    return <div className="flex justify-center py-8">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Buddy Profiles</h1>
        <p className="mt-1 text-sm text-gray-500">
          Find and connect with experienced team members
        </p>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Location</label>
            <input
              type="text"
              value={inputFilters.location}
              onChange={(e) => handleFilterChange('location', e.target.value)}
              placeholder="Search by location"
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Unit/Department</label>
            <input
              type="text"
              value={inputFilters.unit}
              onChange={(e) => handleFilterChange('unit', e.target.value)}
              placeholder="Search by unit"
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Tech Stack</label>
            <input
              type="text"
              value={inputFilters.techStack}
              onChange={(e) => handleFilterChange('techStack', e.target.value)}
              placeholder="e.g. React, Node.js"
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Interests</label>
            <input
              type="text"
              value={inputFilters.interests}
              onChange={(e) => handleFilterChange('interests', e.target.value)}
              placeholder="e.g. Hiking, Photography"
              className="input-field"
            />
          </div>
        </div>
        {isFetching && (
          <div className="mt-4 flex items-center justify-center text-sm text-gray-500">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600 mr-2"></div>
            Searching...
          </div>
        )}
      </div>

      {/* Buddy Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {buddies?.map((buddy: any) => (
          <div key={buddy.id} className="card flex flex-col h-full" data-testid="buddy-card">
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="text-sm font-medium text-primary-600">
                    {buddy.user.firstName[0]}{buddy.user.lastName[0]}
                  </span>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  {buddy.user.firstName} {buddy.user.lastName}
                </h3>
                <p className="text-sm text-gray-500">{buddy.user.profile?.position}</p>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center text-sm text-gray-600">
                <span className="font-medium">Location:</span>
                <span className="ml-2">{buddy.location}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <span className="font-medium">Unit:</span>
                <span className="ml-2">{buddy.unit}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <span className="font-medium">Current Buddies:</span>
                <span className="ml-2">{buddy._count.receivedMatches}/{buddy.maxBuddies}</span>
              </div>
            </div>

            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Tech Stack</h4>
              <div className="flex flex-wrap gap-1">
                {buddy.techStack.map((tech: string) => (
                  <span
                    key={tech}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Interests</h4>
              <div className="flex flex-wrap gap-1">
                {buddy.interests.map((interest: string) => (
                  <span
                    key={interest}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>

            {(user?.role === 'HR' || user?.role === 'BUDDY') && (
              <div className="flex space-x-2 mt-auto">
                <button 
                  onClick={() => handleCreateMatch(buddy.userId, `${buddy.user.firstName} ${buddy.user.lastName}`)}
                  className="btn-primary flex-1"
                >
                  {user?.role === 'HR' ? 'Create Match' : 'Connect'}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {buddies?.length === 0 && (
        <div className="text-center py-8">
          <MagnifyingGlassIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No buddies found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your search filters.
          </p>
        </div>
      )}

      {/* Create Match Modal */}
      {selectedBuddy && (
        <>
          <CreateMatchModal
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            buddyId={selectedBuddy.id}
            buddyName={selectedBuddy.name}
          />
          <BuddyMatchModal
            isOpen={isBuddyModalOpen}
            onClose={handleCloseBuddyModal}
            selectedBuddyId={selectedBuddy.id}
            selectedBuddyName={selectedBuddy.name}
          />
        </>
      )}
    </div>
  )
}
