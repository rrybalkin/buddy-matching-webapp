import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { api } from '../lib/api'
import { useAuth } from '../hooks/useAuth'
import { XMarkIcon } from '@heroicons/react/24/outline'

interface CreateMatchModalProps {
  isOpen: boolean
  onClose: () => void
  buddyId: string
  buddyName: string
  newcomerId?: string
  newcomerName?: string
}

// Helper function to get default dates
const getDefaultDates = () => {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  
  const endDate = new Date(tomorrow)
  endDate.setMonth(endDate.getMonth() + 3)
  
  return {
    startDate: tomorrow.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0]
  }
}

export default function CreateMatchModal({ isOpen, onClose, buddyId, buddyName, newcomerId, newcomerName }: CreateMatchModalProps) {
  const { user } = useAuth()
  const defaultDates = getDefaultDates()
  const [formData, setFormData] = useState({
    type: 'NEWCOMER_MATCH',
    newcomerId: newcomerId || '',
    selectedBuddyId: buddyId || '',
    message: '',
    startDate: defaultDates.startDate,
    endDate: defaultDates.endDate
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const queryClient = useQueryClient()

  // Reset form data with default dates when modal opens
  useEffect(() => {
    if (isOpen) {
      const defaultDates = getDefaultDates()
      setFormData(prev => ({
        ...prev,
        startDate: defaultDates.startDate,
        endDate: defaultDates.endDate
      }))
    }
  }, [isOpen])

  // Get available match types based on user role
  const getAvailableMatchTypes = () => {
    if (user?.role === 'HR') {
      return [
        { value: 'NEWCOMER_MATCH', label: 'Newcomer Match' }
      ]
    }
    if (user?.role === 'BUDDY') {
      return [
        { value: 'RELOCATION_SUPPORT', label: 'Relocation Buddy Match' },
        { value: 'OFFICE_CONNECTION', label: 'Office Buddy Match' }
      ]
    }
    return []
  }

  // Fetch newcomers for the dropdown (when not pre-selected and user is HR)
  const { data: newcomers, isLoading: newcomersLoading } = useQuery(
    'newcomers',
    () => api.get('/users/newcomers').then(res => res.data),
    { enabled: !newcomerId && user?.role === 'HR' } // Only fetch if newcomer is not pre-selected and user is HR
  )

  // Fetch available buddies (when newcomer is pre-selected or user is BUDDY)
  const { data: buddies, isLoading: buddiesLoading } = useQuery(
    'buddies-available',
    () => api.get('/buddies').then(res => res.data),
    { enabled: !!newcomerId || user?.role === 'BUDDY' } // Fetch if newcomer is pre-selected or user is BUDDY
  )

  // Create match mutation
  const createMatchMutation = useMutation(
    (matchData: any) => api.post('/matches', matchData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('matches')
        queryClient.invalidateQueries('notifications')
        queryClient.invalidateQueries('newcomers')
        queryClient.invalidateQueries('buddies')
        onClose()
        const defaultDates = getDefaultDates()
        setFormData({
          type: 'NEWCOMER_MATCH',
          newcomerId: '',
          selectedBuddyId: '',
          message: '',
          startDate: defaultDates.startDate,
          endDate: defaultDates.endDate
        })
      }
    }
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation based on user role
    if (user?.role === 'HR' && !formData.newcomerId) {
      alert('Please select a newcomer to match with this buddy.')
      return
    }

    if (user?.role === 'HR' && newcomerId && !formData.selectedBuddyId) {
      alert('Please select a buddy to assign to this newcomer.')
      return
    }

    if (user?.role === 'BUDDY' && !formData.selectedBuddyId) {
      alert('Please select a buddy to connect with.')
      return
    }

    // Validate required date fields
    if (!formData.startDate) {
      alert('Please select a start date.')
      return
    }

    if (!formData.endDate) {
      alert('Please select an end date.')
      return
    }

    // Validate that end date is after start date
    if (new Date(formData.endDate) <= new Date(formData.startDate)) {
      alert('End date must be after start date.')
      return
    }
    
    setIsSubmitting(true)

    try {
      const selectedBuddyId = newcomerId ? formData.selectedBuddyId : buddyId
      const selectedBuddyName = newcomerId ? 
        (buddies?.find((b: any) => b.userId === formData.selectedBuddyId)?.user?.firstName + ' ' + 
         buddies?.find((b: any) => b.userId === formData.selectedBuddyId)?.user?.lastName) : 
        buddyName

      const matchData: any = {
        receiverId: selectedBuddyId,
        type: formData.type,
        message: formData.message || (user?.role === 'HR' ? 
          `Welcome to the team! ${selectedBuddyName} will be your buddy.` :
          `Hi ${selectedBuddyName}, I'd like to connect with you for ${formData.type.replace('_', ' ').toLowerCase()}.`),
        startDate: formData.startDate,
        endDate: formData.endDate
      }

      // Only include newcomerId for HR-created matches
      if (user?.role === 'HR' && formData.newcomerId) {
        matchData.newcomerId = formData.newcomerId
      }

      await createMatchMutation.mutateAsync(matchData)
    } catch (error) {
      console.error('Error creating match:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        <span className="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true">
          &#8203;
        </span>

        <div className="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {newcomerName ? `Assign Buddy to ${newcomerName}` : `Create Match with ${buddyName}`}
                </h3>
                <button
                  type="button"
                  className="text-gray-400 hover:text-gray-600"
                  onClick={onClose}
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                {/* HR Role - Newcomer Selection */}
                {user?.role === 'HR' && (
                  <>
                    {newcomerName ? (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Newcomer
                        </label>
                        <div className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm p-2 bg-gray-50 text-gray-900">
                          {newcomerName}
                        </div>
                        <p className="mt-1 text-sm text-gray-500">
                          Select a buddy to assign to this newcomer.
                        </p>
                      </div>
                    ) : (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Select Newcomer *
                        </label>
                        {newcomersLoading ? (
                          <div className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm p-2 text-gray-500">
                            Loading newcomers...
                          </div>
                        ) : (
                          <select
                            name="newcomerId"
                            value={formData.newcomerId}
                            onChange={handleChange}
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                          >
                            <option value="">Choose a newcomer...</option>
                            {newcomers?.filter((newcomer: any) => newcomer.buddyStatus !== 'assigned').map((newcomer: any) => (
                              <option key={newcomer.id} value={newcomer.id}>
                                {newcomer.firstName} {newcomer.lastName} 
                                {newcomer.profile?.department && ` - ${newcomer.profile.department}`}
                                {newcomer.profile?.position && ` (${newcomer.profile.position})`}
                              </option>
                            ))}
                          </select>
                        )}
                        {newcomers?.filter((newcomer: any) => newcomer.buddyStatus !== 'assigned').length === 0 && !newcomersLoading && newcomers && newcomers.length > 0 && (
                          <p className="mt-1 text-sm text-gray-500">
                            All newcomers already have assigned buddies.
                          </p>
                        )}
                        {newcomers?.length === 0 && !newcomersLoading && (
                          <p className="mt-1 text-sm text-gray-500">
                            No newcomers found. Make sure newcomers are registered in the system.
                          </p>
                        )}
                      </div>
                    )}

                    {newcomerName && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Select Buddy *
                        </label>
                        {buddiesLoading ? (
                          <div className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm p-2 text-gray-500">
                            Loading buddies...
                          </div>
                        ) : (
                          <select
                            name="selectedBuddyId"
                            value={formData.selectedBuddyId}
                            onChange={handleChange}
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                          >
                            <option value="">Choose a buddy...</option>
                            {buddies?.map((buddy: any) => (
                              <option key={buddy.userId} value={buddy.userId}>
                                {buddy.user.firstName} {buddy.user.lastName}
                                {buddy.location && ` - ${buddy.location}`}
                                {buddy.unit && ` (${buddy.unit})`}
                                {` - ${buddy._count.receivedMatches}/${buddy.maxBuddies} buddies`}
                              </option>
                            ))}
                          </select>
                        )}
                        {buddies?.length === 0 && !buddiesLoading && (
                          <p className="mt-1 text-sm text-gray-500">
                            No available buddies found. All buddies may be at capacity.
                          </p>
                        )}
                      </div>
                    )}
                  </>
                )}

                {/* BUDDY Role - Buddy Selection */}
                {user?.role === 'BUDDY' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Select Buddy *
                    </label>
                    {buddiesLoading ? (
                      <div className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm p-2 text-gray-500">
                        Loading buddies...
                      </div>
                    ) : (
                      <select
                        name="selectedBuddyId"
                        value={formData.selectedBuddyId}
                        onChange={handleChange}
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      >
                        <option value="">Choose a buddy...</option>
                        {buddies?.filter((buddy: any) => buddy.userId !== user?.id).map((buddy: any) => (
                          <option key={buddy.userId} value={buddy.userId}>
                            {buddy.user.firstName} {buddy.user.lastName}
                            {buddy.location && ` - ${buddy.location}`}
                            {buddy.unit && ` (${buddy.unit})`}
                            {` - ${buddy._count.receivedMatches}/${buddy.maxBuddies} buddies`}
                          </option>
                        ))}
                      </select>
                    )}
                    {buddies?.length === 0 && !buddiesLoading && (
                      <p className="mt-1 text-sm text-gray-500">
                        No available buddies found. All buddies may be at capacity.
                      </p>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Match Type
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  >
                    {getAvailableMatchTypes().map((matchType) => (
                      <option key={matchType.value} value={matchType.value}>
                        {matchType.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Message (Optional)
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Add a personal message for the newcomer..."
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Start Date *
                    </label>
                    <input
                      type="date"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleChange}
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      End Date *
                    </label>
                    <input
                      type="date"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleChange}
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex w-full justify-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 sm:ml-3 sm:w-auto sm:text-sm"
              >
                {isSubmitting ? 'Creating...' : 'Create Match'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
