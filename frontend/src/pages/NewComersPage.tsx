import { useState } from 'react'
import { useQuery } from 'react-query'
import { api } from '../lib/api'
import { useAuth } from '../hooks/useAuth'
import { useDebounce } from '../hooks/useDebounce'
import { MagnifyingGlassIcon, PlusIcon, UserIcon } from '@heroicons/react/24/outline'
import CreateNewcomerModal from '../components/CreateNewcomerModal'
import CreateMatchModal from '../components/CreateMatchModal'

export default function NewComersPage() {
  const { user } = useAuth()
  
  // Local state for input fields (immediate updates)
  const [inputFilters, setInputFilters] = useState({
    search: '',
    status: ''
  })

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [selectedNewcomer, setSelectedNewcomer] = useState<{id: string, name: string} | null>(null)
  const [isMatchModalOpen, setIsMatchModalOpen] = useState(false)

  // Debounced filters for API calls (delayed updates)
  const debouncedFilters = useDebounce(inputFilters, 500)

  const { data: newcomers, isLoading, isFetching } = useQuery(
    ['newcomers', debouncedFilters],
    () => api.get('/users/newcomers', { params: debouncedFilters }).then(res => res.data),
    {
      keepPreviousData: true, // Keep previous data while fetching new data
    }
  )

  const handleFilterChange = (key: string, value: string) => {
    setInputFilters(prev => ({ ...prev, [key]: value }))
  }

  const handleCreateNewcomer = () => {
    setIsCreateModalOpen(true)
  }

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false)
  }

  const handleAssignBuddy = (newcomerId: string, newcomerName: string) => {
    setSelectedNewcomer({ id: newcomerId, name: newcomerName })
    setIsMatchModalOpen(true)
  }

  const handleCloseMatchModal = () => {
    setIsMatchModalOpen(false)
    setSelectedNewcomer(null)
  }

  const getStatusBadge = (status: string, assignedBuddy: any) => {
    if (status === 'assigned' && assignedBuddy) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Assigned to {assignedBuddy.firstName} {assignedBuddy.lastName}
        </span>
      )
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
        Unassigned
      </span>
    )
  }

  if (isLoading) {
    return <div className="flex justify-center py-8">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">NewComers Management</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage newcomer accounts and buddy assignments
        </p>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">Search</label>
            <input
              type="text"
              value={inputFilters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Search by name or email"
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <select
              value={inputFilters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="input-field"
            >
              <option value="">All Status</option>
              <option value="assigned">Assigned</option>
              <option value="unassigned">Unassigned</option>
            </select>
          </div>
        </div>
        {isFetching && (
          <div className="mt-4 flex items-center justify-center text-sm text-gray-500">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600 mr-2"></div>
            Searching...
          </div>
        )}
      </div>

      {/* NewComer Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Add NewComer Card */}
        <div 
          className="card border-2 border-dashed border-gray-300 hover:border-primary-400 cursor-pointer transition-colors"
          onClick={handleCreateNewcomer}
        >
          <div className="flex flex-col items-center justify-center py-8">
            <PlusIcon className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Add New Newcomer</h3>
            <p className="text-sm text-gray-500 text-center">
              Create a new newcomer account and profile
            </p>
          </div>
        </div>

        {/* NewComer Cards */}
        {newcomers?.map((newcomer: any) => (
          <div key={newcomer.id} className="card flex flex-col h-full" data-testid="newcomer-card">
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="text-sm font-medium text-primary-600">
                    {newcomer.firstName[0]}{newcomer.lastName[0]}
                  </span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-medium text-gray-900 truncate">
                  {newcomer.firstName} {newcomer.lastName}
                </h3>
                <p className="text-sm text-gray-500 truncate">{newcomer.email}</p>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              {newcomer.profile?.department && (
                <div className="flex items-center text-sm text-gray-600">
                  <span className="font-medium">Department:</span>
                  <span className="ml-2">{newcomer.profile.department}</span>
                </div>
              )}
              {newcomer.profile?.position && (
                <div className="flex items-center text-sm text-gray-600">
                  <span className="font-medium">Position:</span>
                  <span className="ml-2">{newcomer.profile.position}</span>
                </div>
              )}
              {newcomer.profile?.location && (
                <div className="flex items-center text-sm text-gray-600">
                  <span className="font-medium">Location:</span>
                  <span className="ml-2">{newcomer.profile.location}</span>
                </div>
              )}
              {newcomer.profile?.startDate && (
                <div className="flex items-center text-sm text-gray-600">
                  <span className="font-medium">Start Date:</span>
                  <span className="ml-2">
                    {new Date(newcomer.profile.startDate).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900">Status:</span>
                {getStatusBadge(newcomer.buddyStatus, newcomer.assignedBuddy)}
              </div>
            </div>

            {newcomer.profile?.bio && (
              <div className="mb-4">
                <p className="text-sm text-gray-600 line-clamp-2">
                  {newcomer.profile.bio}
                </p>
              </div>
            )}

            {newcomer.buddyStatus !== 'assigned' && (
              <div className="flex space-x-2 mt-auto">
                <button 
                  onClick={() => handleAssignBuddy(newcomer.id, `${newcomer.firstName} ${newcomer.lastName}`)}
                  className="btn-primary flex-1"
                >
                  Assign Buddy
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {newcomers?.length === 0 && (
        <div className="text-center py-8">
          <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No newcomers found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your search filters or create a new newcomer.
          </p>
        </div>
      )}

      {/* Create Newcomer Modal */}
      <CreateNewcomerModal
        isOpen={isCreateModalOpen}
        onClose={handleCloseCreateModal}
      />

      {/* Create Match Modal */}
      {selectedNewcomer && (
        <CreateMatchModal
          isOpen={isMatchModalOpen}
          onClose={handleCloseMatchModal}
          buddyId="" // Will be selected in the modal
          buddyName="" // Will be selected in the modal
          newcomerId={selectedNewcomer.id}
          newcomerName={selectedNewcomer.name}
        />
      )}
    </div>
  )
}
