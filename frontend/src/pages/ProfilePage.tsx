import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { api } from '../lib/api'
import { useAuth } from '../hooks/useAuth'
import { formatRoleForDisplay } from '../lib/roleUtils'
import ChangePasswordModal from '../components/ChangePasswordModal'

export default function ProfilePage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [formData, setFormData] = useState({
    phone: '',
    bio: '',
    location: '',
    department: '',
    position: '',
    interests: [] as string[],
    languages: [] as string[]
  })
  const [buddyFormData, setBuddyFormData] = useState({
    unit: '',
    techStack: [] as string[],
    interests: [] as string[],
    maxBuddies: 3,
    experience: '',
    mentoringStyle: '',
    availability: '',
    isAvailable: true
  })
  const [errors, setErrors] = useState<string[]>([])

  const { data: userData, isLoading } = useQuery('profile', () =>
    api.get('/users/profile').then(res => res.data)
  )
  
  const { data: buddyData, isLoading: buddyLoading } = useQuery(
    'buddyProfile', 
    () => api.get('/buddies/me').then(res => res.data),
    { enabled: user?.role === 'BUDDY' }
  )
  
  const profile = userData?.profile
  const buddyProfile = buddyData
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

  const updateBuddyProfileMutation = useMutation(
    (data: any) => api.put('/buddies/me', data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('buddyProfile')
        setIsEditing(false)
        setErrors([])
      },
      onError: (error: any) => {
        console.error('Buddy profile update error:', error.response?.data || error.message)
        if (error.response?.data?.errors) {
          const errorMessages = error.response.data.errors.map((err: any) => 
            `${err.path}: ${err.msg}`
          )
          setErrors(errorMessages)
        } else {
          setErrors([error.message || 'Failed to update buddy profile'])
        }
      }
    }
  )

  const handleEdit = () => {
    setFormData({
      phone: profile?.phone || '',
      bio: profile?.bio || '',
      location: profile?.location || '',
      department: profile?.department || '',
      position: profile?.position || '',
      interests: profile?.interests || [],
      languages: profile?.languages || []
    })
    
    if (user?.role === 'BUDDY' && buddyProfile) {
      setBuddyFormData({
        unit: buddyProfile.unit || '',
        techStack: buddyProfile.techStack || [],
        interests: buddyProfile.interests || [],
        maxBuddies: buddyProfile.maxBuddies || 3,
        experience: buddyProfile.experience || '',
        mentoringStyle: buddyProfile.mentoringStyle || '',
        availability: buddyProfile.availability || '',
        isAvailable: buddyProfile.isAvailable ?? true
      })
    }
    
    setErrors([])
    setIsEditing(true)
  }

  const handleCancel = () => {
    setIsEditing(false)
  }

  const handleSave = () => {
    // Update user profile
    updateProfileMutation.mutate(formData)
    
    // Update buddy profile if user is a BUDDY
    if (user?.role === 'BUDDY') {
      updateBuddyProfileMutation.mutate(buddyFormData)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleArrayAdd = (field: 'interests' | 'languages' | 'techStack', value: string) => {
    if (value.trim()) {
      if (field === 'techStack' || field === 'interests') {
        setBuddyFormData(prev => ({
          ...prev,
          [field]: [...prev[field], value.trim()]
        }))
      } else {
        setFormData(prev => ({
          ...prev,
          [field]: [...prev[field], value.trim()]
        }))
      }
    }
  }

  const handleArrayRemove = (field: 'interests' | 'languages' | 'techStack', index: number) => {
    if (field === 'techStack' || field === 'interests') {
      setBuddyFormData(prev => ({
        ...prev,
        [field]: prev[field].filter((_, i) => i !== index)
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: prev[field].filter((_, i) => i !== index)
      }))
    }
  }

  const handleBuddyInputChange = (field: string, value: any) => {
    setBuddyFormData(prev => ({
      ...prev,
      [field]: value
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
            
            <div className="mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={() => setShowPasswordModal(true)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
                Change Password
              </button>
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
                      className="input-field mt-1"
                    />
                  ) : (
                    <p className="mt-1 text-sm text-gray-900">{profile?.department || 'Not specified'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Position</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.position}
                      onChange={(e) => handleInputChange('position', e.target.value)}
                      className="input-field mt-1"
                    />
                  ) : (
                    <p className="mt-1 text-sm text-gray-900">{profile?.position || 'Not specified'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Location</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      className="input-field mt-1"
                    />
                  ) : (
                    <p className="mt-1 text-sm text-gray-900">{profile?.location || 'Not specified'}</p>
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
                        className="input-field mt-1"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Enter phone number without country code (e.g., 5550123456)
                      </p>
                    </div>
                  ) : (
                    <p className="mt-1 text-sm text-gray-900">{profile?.phone || 'Not specified'}</p>
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
                    className="input-field mt-1"
                    placeholder="Tell us about yourself..."
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-900">{profile?.bio || 'Not specified'}</p>
                )}
              </div>

              {/* Interests */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700">Interests</label>
                {isEditing ? (
                  <div className="mt-1">
                    <div className="flex flex-wrap gap-2 mb-2">
                      {(user?.role === 'BUDDY' ? buddyFormData.interests : formData.interests).map((interest, index) => (
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
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
                    {(() => {
                      const interests = user?.role === 'BUDDY' ? buddyProfile?.interests : profile?.interests;
                      return interests && interests.length > 0 ? (
                        interests.map((interest, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                          >
                            {interest}
                          </span>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500">No interests specified</p>
                      );
                    })()}
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
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
                    {profile?.languages && profile.languages.length > 0 ? (
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

          {/* Buddy Profile Section - Only for BUDDY users */}
          {user?.role === 'BUDDY' && (
            <div className="mt-8 border-t pt-8">
              <h3 className="text-lg font-medium text-gray-900">Buddy Profile Settings</h3>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Unit/Team</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={buddyFormData.unit}
                      onChange={(e) => handleBuddyInputChange('unit', e.target.value)}
                      className="input-field mt-1"
                    />
                  ) : (
                    <p className="mt-1 text-sm text-gray-900">{buddyProfile?.unit || 'Not specified'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Max Buddies</label>
                  {isEditing ? (
                    <select
                      value={buddyFormData.maxBuddies}
                      onChange={(e) => handleBuddyInputChange('maxBuddies', parseInt(e.target.value))}
                      className="input-field mt-1"
                    >
                      <option value={1}>1</option>
                      <option value={2}>2</option>
                      <option value={3}>3</option>
                      <option value={4}>4</option>
                      <option value={5}>5</option>
                    </select>
                  ) : (
                    <p className="mt-1 text-sm text-gray-900">{buddyProfile?.maxBuddies || 'Not specified'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Experience Level</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={buddyFormData.experience}
                      onChange={(e) => handleBuddyInputChange('experience', e.target.value)}
                      placeholder="e.g., 5+ years, Senior level"
                      className="input-field mt-1"
                    />
                  ) : (
                    <p className="mt-1 text-sm text-gray-900">{buddyProfile?.experience || 'Not specified'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Availability</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={buddyFormData.availability}
                      onChange={(e) => handleBuddyInputChange('availability', e.target.value)}
                      placeholder="e.g., Weekdays 9-5, Flexible"
                      className="input-field mt-1"
                    />
                  ) : (
                    <p className="mt-1 text-sm text-gray-900">{buddyProfile?.availability || 'Not specified'}</p>
                  )}
                </div>
              </div>
              
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700">Mentoring Style</label>
                {isEditing ? (
                  <textarea
                    value={buddyFormData.mentoringStyle}
                    onChange={(e) => handleBuddyInputChange('mentoringStyle', e.target.value)}
                    rows={3}
                    placeholder="Describe your mentoring approach..."
                    className="input-field mt-1"
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-900">{buddyProfile?.mentoringStyle || 'Not specified'}</p>
                )}
              </div>

              {/* Tech Stack */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700">Tech Stack</label>
                {isEditing ? (
                  <div className="mt-1">
                    <div className="flex flex-wrap gap-2 mb-2">
                      {buddyFormData.techStack.map((tech, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {tech}
                          <button
                            type="button"
                            onClick={() => handleArrayRemove('techStack', index)}
                            className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full text-blue-400 hover:bg-blue-200 hover:text-blue-500"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex">
                      <input
                        type="text"
                        placeholder="Add a technology..."
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            const input = e.target as HTMLInputElement
                            handleArrayAdd('techStack', input.value)
                            input.value = ''
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          const input = e.currentTarget.previousElementSibling as HTMLInputElement
                          handleArrayAdd('techStack', input.value)
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
                    {buddyProfile?.techStack && buddyProfile.techStack.length > 0 ? (
                      buddyProfile.techStack.map((tech, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {tech}
                        </span>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">No technologies specified</p>
                    )}
                  </div>
                )}
              </div>

              {/* Availability Status */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700">Available for New Buddies</label>
                {isEditing ? (
                  <div className="mt-1">
                    <label className="inline-flex items-center">
                      <input
                        type="checkbox"
                        checked={buddyFormData.isAvailable}
                        onChange={(e) => handleBuddyInputChange('isAvailable', e.target.checked)}
                        className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        {buddyFormData.isAvailable ? 'Available' : 'Not available'}
                      </span>
                    </label>
                  </div>
                ) : (
                  <div className="mt-1 flex items-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      buddyProfile?.isAvailable 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {buddyProfile?.isAvailable ? 'Available' : 'Not Available'}
                    </span>
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
      
      <ChangePasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
      />
    </div>
  )
}
