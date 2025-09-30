import React, { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from 'react-query'
import { api } from '../lib/api'
import { XMarkIcon } from '@heroicons/react/24/outline'

interface EditNewcomerModalProps {
  isOpen: boolean
  onClose: () => void
  newcomer: {
    id: string
    firstName: string
    lastName: string
    email: string
    profile?: {
      department?: string
      position?: string
      location?: string
      startDate?: string
      bio?: string
      phone?: string
      timezone?: string
      interests?: string[]
      languages?: string[]
    }
  }
}

export default function EditNewcomerModal({ isOpen, onClose, newcomer }: EditNewcomerModalProps) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    department: '',
    position: '',
    location: '',
    startDate: '',
    bio: '',
    phone: '',
    timezone: '',
    interests: [] as string[],
    languages: [] as string[]
  })
  const [interestInput, setInterestInput] = useState('')
  const [languageInput, setLanguageInput] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const queryClient = useQueryClient()

  // Initialize form data when modal opens
  useEffect(() => {
    if (isOpen && newcomer) {
      setFormData({
        firstName: newcomer.firstName || '',
        lastName: newcomer.lastName || '',
        email: newcomer.email || '',
        department: newcomer.profile?.department || '',
        position: newcomer.profile?.position || '',
        location: newcomer.profile?.location || '',
        startDate: newcomer.profile?.startDate ? new Date(newcomer.profile.startDate).toISOString().split('T')[0] : '',
        bio: newcomer.profile?.bio || '',
        phone: newcomer.profile?.phone || '',
        timezone: newcomer.profile?.timezone || '',
        interests: newcomer.profile?.interests || [],
        languages: newcomer.profile?.languages || []
      })
    }
  }, [isOpen, newcomer])

  // Update newcomer mutation
  const updateNewcomerMutation = useMutation(
    (newcomerData: any) => api.patch(`/users/newcomers/${newcomer.id}`, newcomerData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('newcomers')
        onClose()
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
      await updateNewcomerMutation.mutateAsync(formData)
    } catch (error) {
      console.error('Error updating newcomer:', error)
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

  const handleAddInterest = () => {
    if (interestInput.trim() && !formData.interests.includes(interestInput.trim())) {
      setFormData(prev => ({
        ...prev,
        interests: [...prev.interests, interestInput.trim()]
      }))
      setInterestInput('')
    }
  }

  const handleRemoveInterest = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.filter(i => i !== interest)
    }))
  }

  const handleAddLanguage = () => {
    if (languageInput.trim() && !formData.languages.includes(languageInput.trim())) {
      setFormData(prev => ({
        ...prev,
        languages: [...prev.languages, languageInput.trim()]
      }))
      setLanguageInput('')
    }
  }

  const handleRemoveLanguage = (language: string) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages.filter(l => l !== language)
    }))
  }

  const handleClose = () => {
    if (!isSubmitting) {
      onClose()
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
                  Edit Newcomer Profile
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
                      className="input-field mt-1"
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
                      className="input-field mt-1"
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
                    className="input-field mt-1"
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
                      className="input-field mt-1"
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
                      className="input-field mt-1"
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
                      className="input-field mt-1"
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
                      className="input-field mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="input-field mt-1"
                      placeholder="e.g. +1 (555) 123-4567"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Timezone
                    </label>
                    <select
                      name="timezone"
                      value={formData.timezone}
                      onChange={handleChange}
                      className="input-field mt-1"
                    >
                      <option value="">Select timezone</option>
                      <option value="UTC-12">UTC-12 (Baker Island)</option>
                      <option value="UTC-11">UTC-11 (American Samoa)</option>
                      <option value="UTC-10">UTC-10 (Hawaii)</option>
                      <option value="UTC-9">UTC-9 (Alaska)</option>
                      <option value="UTC-8">UTC-8 (Pacific Time)</option>
                      <option value="UTC-7">UTC-7 (Mountain Time)</option>
                      <option value="UTC-6">UTC-6 (Central Time)</option>
                      <option value="UTC-5">UTC-5 (Eastern Time)</option>
                      <option value="UTC-4">UTC-4 (Atlantic Time)</option>
                      <option value="UTC-3">UTC-3 (Brazil)</option>
                      <option value="UTC-2">UTC-2 (Mid-Atlantic)</option>
                      <option value="UTC-1">UTC-1 (Azores)</option>
                      <option value="UTC+0">UTC+0 (Greenwich)</option>
                      <option value="UTC+1">UTC+1 (Central European)</option>
                      <option value="UTC+2">UTC+2 (Eastern European)</option>
                      <option value="UTC+3">UTC+3 (Moscow)</option>
                      <option value="UTC+4">UTC+4 (Gulf)</option>
                      <option value="UTC+5">UTC+5 (Pakistan)</option>
                      <option value="UTC+6">UTC+6 (Bangladesh)</option>
                      <option value="UTC+7">UTC+7 (Thailand)</option>
                      <option value="UTC+8">UTC+8 (China)</option>
                      <option value="UTC+9">UTC+9 (Japan)</option>
                      <option value="UTC+10">UTC+10 (Australia)</option>
                      <option value="UTC+11">UTC+11 (Solomon Islands)</option>
                      <option value="UTC+12">UTC+12 (New Zealand)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Interests
                  </label>
                  <div className="mt-1 flex space-x-2">
                    <input
                      type="text"
                      value={interestInput}
                      onChange={(e) => setInterestInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddInterest())}
                      className="input-field flex-1"
                      placeholder="e.g. hiking, photography, cooking"
                    />
                    <button
                      type="button"
                      onClick={handleAddInterest}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Add
                    </button>
                  </div>
                  {formData.interests.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {formData.interests.map((interest, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {interest}
                          <button
                            type="button"
                            onClick={() => handleRemoveInterest(interest)}
                            className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-blue-400 hover:bg-blue-200 hover:text-blue-500"
                          >
                            <XMarkIcon className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Languages
                  </label>
                  <div className="mt-1 flex space-x-2">
                    <input
                      type="text"
                      value={languageInput}
                      onChange={(e) => setLanguageInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddLanguage())}
                      className="input-field flex-1"
                      placeholder="e.g. English, Spanish, French"
                    />
                    <button
                      type="button"
                      onClick={handleAddLanguage}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Add
                    </button>
                  </div>
                  {formData.languages.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {formData.languages.map((language, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                        >
                          {language}
                          <button
                            type="button"
                            onClick={() => handleRemoveLanguage(language)}
                            className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-green-400 hover:bg-green-200 hover:text-green-500"
                          >
                            <XMarkIcon className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
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
                    className="input-field mt-1"
                    placeholder="Additional information about the newcomer..."
                  />
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex w-full justify-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 sm:ml-3 sm:w-auto sm:text-sm"
              >
                {isSubmitting ? 'Updating...' : 'Update Newcomer'}
              </button>
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
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
