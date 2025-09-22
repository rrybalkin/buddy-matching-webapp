import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { api } from '../lib/api'
import { useAuth } from '../hooks/useAuth'
import { formatRoleForDisplay } from '../lib/roleUtils'

export default function ProfilePage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    phone: '',
    bio: '',
    location: '',
    department: '',
    position: '',
    interests: [] as string[],
    languages: [] as string[]
  })
  const [errors, setErrors] = useState<string[]>([])

  const { data: userData, isLoading } = useQuery('profile', () =>
    api.get('/users/profile').then(res => res.data)
  )
  
  const profile = userData?.profile
  const displayUser = userData || user
  
  // Debug logging
  React.useEffect(() => {
    if (userData) {
      console.log('Profile data received:', { userData, profile })
    }
  }, [userData, profile])

  const updateProfileMutation = useMutation(
    (data: any) => api.put('/users/profile', data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('profile')
        setIsEditing(false)
        setErrors([])
      },
      onError: (error: any) => {
        console.error('Profile update error:', error.response?.data || error.message)
        if (error.response?.data?.errors) {
          const errorMessages = error.response.data.errors.map((err: any) => 
            `${err.path}: ${err.msg}`
          )
          setErrors(errorMessages)
        } else {
          setErrors([error.message || 'Failed to update profile'])
        }
      }
    }
  )

  const handleEdit = () => {
    if (profile) {
      setFormData({
        phone: profile.phone || '',
        bio: profile.bio || '',
        location: profile.location || '',
        department: profile.department || '',
        position: profile.position || '',
        interests: profile.interests || [],
        languages: profile.languages || []
      })
    }
    setErrors([])
    setIsEditing(true)
  }

  const handleCancel = () => {
    setIsEditing(false)
  }

  const handleSave = () => {
    updateProfileMutation.mutate(formData)
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleArrayAdd = (field: 'interests' | 'languages', value: string) => {
    if (value.trim()) {
      setFormData(prev => ({
        ...prev,
        [field]: [...prev[field], value.trim()]
      }))
    }
  }

  const handleArrayRemove = (field: 'interests' | 'languages', index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }))
  }

  if (isLoading) {
    return <div className="flex justify-center py-8">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your profile information
        </p>
      </div>

      <div className="card">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">First Name</label>
                <p className="mt-1 text-sm text-gray-900">{displayUser?.firstName}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Last Name</label>
                <p className="mt-1 text-sm text-gray-900">{displayUser?.lastName}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <p className="mt-1 text-sm text-gray-900">{displayUser?.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Role</label>
                <p className="mt-1 text-sm text-gray-900">{formatRoleForDisplay(displayUser?.role || '')}</p>
              </div>
            </div>
          </div>

          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    There were errors with your submission:
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    <ul className="list-disc pl-5 space-y-1">
                      {errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {profile && (
            <div>
              <h3 className="text-lg font-medium text-gray-900">Profile Details</h3>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Department</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.department}
                      onChange={(e) => handleInputChange('department', e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  ) : (
                    <p className="mt-1 text-sm text-gray-900">{profile.department || 'Not specified'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Position</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.position}
                      onChange={(e) => handleInputChange('position', e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  ) : (
                    <p className="mt-1 text-sm text-gray-900">{profile.position || 'Not specified'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Location</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  ) : (
                    <p className="mt-1 text-sm text-gray-900">{profile.location || 'Not specified'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  {isEditing ? (
                    <div>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        placeholder="e.g., 5550123456"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Enter phone number without country code (e.g., 5550123456)
                      </p>
                    </div>
                  ) : (
                    <p className="mt-1 text-sm text-gray-900">{profile.phone || 'Not specified'}</p>
                  )}
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700">Bio</label>
                {isEditing ? (
                  <textarea
                    value={formData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="Tell us about yourself..."
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-900">{profile.bio || 'Not specified'}</p>
                )}
              </div>

              {/* Interests */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700">Interests</label>
                {isEditing ? (
                  <div className="mt-1">
                    <div className="flex flex-wrap gap-2 mb-2">
                      {formData.interests.map((interest, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                        >
                          {interest}
                          <button
                            type="button"
                            onClick={() => handleArrayRemove('interests', index)}
                            className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full text-indigo-400 hover:bg-indigo-200 hover:text-indigo-500"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex">
                      <input
                        type="text"
                        placeholder="Add an interest..."
                        className="flex-1 rounded-l-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handleArrayAdd('interests', e.currentTarget.value)
                            e.currentTarget.value = ''
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          const input = e.currentTarget.previousElementSibling as HTMLInputElement
                          handleArrayAdd('interests', input.value)
                          input.value = ''
                        }}
                        className="px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-gray-700 hover:bg-gray-100"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-1 flex flex-wrap gap-2">
                    {profile.interests && profile.interests.length > 0 ? (
                      profile.interests.map((interest, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                        >
                          {interest}
                        </span>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">No interests specified</p>
                    )}
                  </div>
                )}
              </div>

              {/* Languages */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700">Languages</label>
                {isEditing ? (
                  <div className="mt-1">
                    <div className="flex flex-wrap gap-2 mb-2">
                      {formData.languages.map((language, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
                        >
                          {language}
                          <button
                            type="button"
                            onClick={() => handleArrayRemove('languages', index)}
                            className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full text-green-400 hover:bg-green-200 hover:text-green-500"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex">
                      <input
                        type="text"
                        placeholder="Add a language..."
                        className="flex-1 rounded-l-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handleArrayAdd('languages', e.currentTarget.value)
                            e.currentTarget.value = ''
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          const input = e.currentTarget.previousElementSibling as HTMLInputElement
                          handleArrayAdd('languages', input.value)
                          input.value = ''
                        }}
                        className="px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-gray-700 hover:bg-gray-100"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-1 flex flex-wrap gap-2">
                    {profile.languages && profile.languages.length > 0 ? (
                      profile.languages.map((language, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
                        >
                          {language}
                        </span>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">No languages specified</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3">
            {isEditing ? (
              <>
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={updateProfileMutation.isLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updateProfileMutation.isLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </>
            ) : (
              <button
                onClick={handleEdit}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Edit Profile
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
