import React, { useState } from 'react'
import { useMutation, useQueryClient } from 'react-query'
import { api } from '../lib/api'
import { XMarkIcon, EnvelopeIcon, ClipboardDocumentIcon } from '@heroicons/react/24/outline'

interface CreateNewcomerModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function CreateNewcomerModal({ isOpen, onClose }: CreateNewcomerModalProps) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    department: '',
    position: '',
    location: '',
    startDate: '',
    bio: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showTempPassword, setShowTempPassword] = useState(false)
  const [tempPassword, setTempPassword] = useState('')
  const [isSendingEmail, setIsSendingEmail] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const queryClient = useQueryClient()

  // Create newcomer mutation
  const createNewcomerMutation = useMutation(
    (newcomerData: any) => api.post('/users/newcomers', newcomerData),
    {
      onSuccess: (response) => {
        queryClient.invalidateQueries('newcomers')
        setTempPassword(response.data.tempPassword)
        setShowTempPassword(true)
        // Don't auto-close anymore - wait for user action
      }
    }
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.firstName || !formData.lastName || !formData.email) {
      alert('Please fill in all required fields.')
      return
    }
    
    setIsSubmitting(true)

    try {
      await createNewcomerMutation.mutateAsync(formData)
    } catch (error) {
      console.error('Error creating newcomer:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        department: '',
        position: '',
        location: '',
        startDate: '',
        bio: ''
      })
      setShowTempPassword(false)
      setTempPassword('')
      setEmailSent(false)
      onClose()
    }
  }

  const handleCopyPassword = async () => {
    try {
      await navigator.clipboard.writeText(tempPassword)
      alert('Password copied to clipboard!')
    } catch (err) {
      console.error('Failed to copy password:', err)
      alert('Failed to copy password. Please copy it manually.')
    }
  }

  const handleSendEmail = async () => {
    setIsSendingEmail(true)
    try {
      // TODO: Implement email sending when email service is available
      // For now, just simulate the action
      await new Promise(resolve => setTimeout(resolve, 2000)) // Simulate API call
      setEmailSent(true)
      alert('Email functionality will be available when email service is configured.')
    } catch (error) {
      console.error('Error sending email:', error)
      alert('Failed to send email. Please try again later.')
    } finally {
      setIsSendingEmail(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={handleClose} />

        <span className="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true">
          &#8203;
        </span>

        <div className="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:align-middle">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {showTempPassword ? 'Newcomer Created Successfully!' : 'Create New Newcomer Account'}
                </h3>
                <button
                  type="button"
                  className="text-gray-400 hover:text-gray-600"
                  onClick={handleClose}
                  disabled={isSubmitting}
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              {showTempPassword ? (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                      <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Newcomer Account Created!</h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Account has been created for <strong>{formData.firstName} {formData.lastName}</strong>
                    </p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-gray-700">
                        Temporary Password for {formData.email}:
                      </label>
                      <button
                        type="button"
                        onClick={handleCopyPassword}
                        className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-600 hover:text-gray-800"
                      >
                        <ClipboardDocumentIcon className="h-4 w-4 mr-1" />
                        Copy
                      </button>
                    </div>
                    <div className="bg-white p-3 rounded border font-mono text-lg font-bold text-gray-900 break-all">
                      {tempPassword}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Please share this password with the newcomer. They should change it on first login.
                    </p>
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Send Welcome Email</h4>
                        <p className="text-sm text-gray-500">
                          Send login credentials and welcome information to {formData.email}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleSendEmail}
                        disabled={isSendingEmail || emailSent}
                        className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                          emailSent
                            ? 'bg-green-100 text-green-800 cursor-not-allowed'
                            : isSendingEmail
                            ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        <EnvelopeIcon className="h-4 w-4 mr-2" />
                        {emailSent ? 'Email Sent' : isSendingEmail ? 'Sending...' : 'Send Email'}
                      </button>
                    </div>
                    {emailSent && (
                      <p className="text-xs text-green-600 mt-2">
                        ✓ Email sent successfully (Note: Email service not yet configured)
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        First Name *
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        placeholder="Enter first name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        placeholder="Enter last name"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      placeholder="Enter email address"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Department
                      </label>
                      <input
                        type="text"
                        name="department"
                        value={formData.department}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        placeholder="e.g. Engineering, Marketing"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Position
                      </label>
                      <input
                        type="text"
                        name="position"
                        value={formData.position}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        placeholder="e.g. Software Engineer, Designer"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Location
                      </label>
                      <input
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        placeholder="e.g. New York, Remote"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Start Date
                      </label>
                      <input
                        type="date"
                        name="startDate"
                        value={formData.startDate}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Bio / Notes
                    </label>
                    <textarea
                      name="bio"
                      value={formData.bio}
                      onChange={handleChange}
                      rows={3}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      placeholder="Additional information about the newcomer..."
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
              {showTempPassword ? (
                <button
                  type="button"
                  onClick={handleClose}
                  className="inline-flex w-full justify-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Close
                </button>
              ) : (
                <>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex w-full justify-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    {isSubmitting ? 'Creating...' : 'Create Newcomer'}
                  </button>
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={isSubmitting}
                    className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
