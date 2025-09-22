import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { api } from '../lib/api'
import { XMarkIcon } from '@heroicons/react/24/outline'

interface CreateMatchModalProps {
  isOpen: boolean
  onClose: () => void
  buddyId: string
  buddyName: string
}

export default function CreateMatchModal({ isOpen, onClose, buddyId, buddyName }: CreateMatchModalProps) {
  const [formData, setFormData] = useState({
    type: 'NEWCOMER_MATCH',
    newcomerId: '',
    message: '',
    startDate: '',
    endDate: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const queryClient = useQueryClient()

  // Fetch newcomers for the dropdown
  const { data: newcomers, isLoading: newcomersLoading } = useQuery('newcomers', () =>
    api.get('/users?role=NEWCOMER').then(res => res.data)
  )

  // Create match mutation
  const createMatchMutation = useMutation(
    (matchData: any) => api.post('/matches', matchData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('matches')
        queryClient.invalidateQueries('notifications')
        onClose()
        setFormData({
          type: 'NEWCOMER_MATCH',
          newcomerId: '',
          message: '',
          startDate: '',
          endDate: ''
        })
      }
    }
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.newcomerId) {
      alert('Please select a newcomer to match with this buddy.')
      return
    }
    
    setIsSubmitting(true)

    try {
      await createMatchMutation.mutateAsync({
        receiverId: buddyId,
        newcomerId: formData.newcomerId,
        type: formData.type,
        message: formData.message || `Welcome to the team! ${buddyName} will be your buddy.`,
        startDate: formData.startDate || undefined,
        endDate: formData.endDate || undefined
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
                  Create Match with {buddyName}
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
                      {newcomers?.map((newcomer: any) => (
                        <option key={newcomer.id} value={newcomer.id}>
                          {newcomer.firstName} {newcomer.lastName} 
                          {newcomer.profile?.department && ` - ${newcomer.profile.department}`}
                          {newcomer.profile?.position && ` (${newcomer.profile.position})`}
                        </option>
                      ))}
                    </select>
                  )}
                  {newcomers?.length === 0 && !newcomersLoading && (
                    <p className="mt-1 text-sm text-gray-500">
                      No newcomers found. Make sure newcomers are registered in the system.
                    </p>
                  )}
                </div>

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
                    <option value="NEWCOMER_MATCH">Newcomer Match</option>
                    <option value="RELOCATION_SUPPORT">Relocation Support</option>
                    <option value="OFFICE_CONNECTION">Office Connection</option>
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
                      Start Date (Optional)
                    </label>
                    <input
                      type="date"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      End Date (Optional)
                    </label>
                    <input
                      type="date"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleChange}
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
