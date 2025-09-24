import React, { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from 'react-query'
import { api } from '../lib/api'
import { XMarkIcon } from '@heroicons/react/24/outline'

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

interface BuddyMatchModalProps {
  isOpen: boolean
  onClose: () => void
  selectedBuddyId: string
  selectedBuddyName: string
}

export default function BuddyMatchModal({ isOpen, onClose, selectedBuddyId, selectedBuddyName }: BuddyMatchModalProps) {
  const defaultDates = getDefaultDates()
  const [formData, setFormData] = useState({
    type: 'RELOCATION_SUPPORT',
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

  // Create match mutation
  const createMatchMutation = useMutation(
    (matchData: any) => api.post('/matches', matchData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('matches')
        queryClient.invalidateQueries('notifications')
        queryClient.invalidateQueries('buddies')
        onClose()
        const defaultDates = getDefaultDates()
        setFormData({
          type: 'RELOCATION_SUPPORT',
          message: '',
          startDate: defaultDates.startDate,
          endDate: defaultDates.endDate
        })
      }
    }
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
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
      await createMatchMutation.mutateAsync({
        receiverId: selectedBuddyId,
        type: formData.type,
        message: formData.message || `Hi ${selectedBuddyName}, I'd like to connect with you for ${formData.type.replace('_', ' ').toLowerCase()}.`,
        startDate: formData.startDate,
        endDate: formData.endDate
      })
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
                  Create Match with {selectedBuddyName}
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
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Match Type *
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  >
                    <option value="RELOCATION_SUPPORT">Relocation Buddy Match</option>
                    <option value="OFFICE_CONNECTION">Office Buddy Match</option>
                  </select>
                  <p className="mt-1 text-sm text-gray-500">
                    Choose the type of support you're looking for.
                  </p>
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
                    placeholder="Add a personal message to introduce yourself..."
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
