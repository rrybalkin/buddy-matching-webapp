import React, { useState } from 'react'
import { useMutation, useQueryClient } from 'react-query'
import { api } from '../lib/api'
import { XMarkIcon, SparklesIcon, UserIcon, StarIcon } from '@heroicons/react/24/outline'
import CreateMatchModal from './CreateMatchModal'

interface AISuggestion {
  buddyId: string;
  buddyName: string;
  score: number;
  reasoning: string;
  buddyProfile: {
    location: string;
    unit: string;
    techStack: string[];
    interests: string[];
    experience: string;
    mentoringStyle: string;
    availability: string;
  };
}

interface AISuggestionsModalProps {
  isOpen: boolean
  onClose: () => void
  newcomer: {
    id: string
    firstName: string
    lastName: string
    profile?: {
      department?: string
      position?: string
      location?: string
      interests?: string[]
      languages?: string[]
    }
  }
}

export default function AISuggestionsModal({ isOpen, onClose, newcomer }: AISuggestionsModalProps) {
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedBuddy, setSelectedBuddy] = useState<{id: string, name: string} | null>(null)
  const [isMatchModalOpen, setIsMatchModalOpen] = useState(false)

  const queryClient = useQueryClient()

  // Get AI suggestions mutation
  const getSuggestionsMutation = useMutation(
    () => api.post('/ai-matching/suggestions', { newcomerId: newcomer.id }),
    {
      onSuccess: (response) => {
        setSuggestions(response.data.suggestions || [])
        setError(null)
      },
      onError: (error: any) => {
        setError(error.response?.data?.error || 'Failed to get AI suggestions')
        setSuggestions([])
      },
      onSettled: () => {
        setIsLoading(false)
      }
    }
  )

  const handleGetSuggestions = () => {
    setIsLoading(true)
    setError(null)
    getSuggestionsMutation.mutate()
  }

  const handleCreateMatch = (buddyId: string, buddyName: string) => {
    setSelectedBuddy({ id: buddyId, name: buddyName })
    setIsMatchModalOpen(true)
  }

  const handleCloseMatchModal = () => {
    setIsMatchModalOpen(false)
    setSelectedBuddy(null)
  }

  const handleClose = () => {
    if (!isLoading) {
      setSuggestions([])
      setError(null)
      onClose()
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600 bg-green-100'
    if (score >= 0.6) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const getScoreLabel = (score: number) => {
    if (score >= 0.8) return 'Excellent Match'
    if (score >= 0.6) return 'Good Match'
    return 'Fair Match'
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={handleClose} />

        <span className="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true">
          &#8203;
        </span>

        <div className="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-6xl sm:align-middle">
          <div className="bg-white px-6 pt-6 pb-6 sm:p-8 sm:pb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <SparklesIcon className="h-6 w-6 text-purple-600 mr-2" />
                <h3 className="text-lg font-medium text-gray-900">
                  AI Buddy Suggestions for {newcomer.firstName} {newcomer.lastName}
                </h3>
              </div>
              <button
                type="button"
                className="text-gray-400 hover:text-gray-600"
                onClick={handleClose}
                disabled={isLoading}
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {!suggestions.length && !isLoading && !error && (
              <div className="text-center py-8">
                <SparklesIcon className="mx-auto h-12 w-12 text-purple-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Get AI-Powered Suggestions</h3>
                <p className="text-sm text-gray-500 mb-6">
                  Let AI analyze {newcomer.firstName}'s profile and find the best buddy matches based on compatibility.
                </p>
                <button
                  onClick={handleGetSuggestions}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  <SparklesIcon className="h-4 w-4 mr-2" />
                  Get AI Suggestions
                </button>
              </div>
            )}

            {isLoading && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                <p className="text-sm text-gray-500">AI is analyzing profiles and finding the best matches...</p>
              </div>
            )}

            {error && (
              <div className="text-center py-8">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                  <XMarkIcon className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Error Getting Suggestions</h3>
                <p className="text-sm text-gray-500 mb-4">{error}</p>
                <button
                  onClick={handleGetSuggestions}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700"
                >
                  Try Again
                </button>
              </div>
            )}

            {suggestions.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-md font-medium text-gray-900">
                    AI Found {suggestions.length} Potential Matches
                  </h4>
                  <button
                    onClick={handleGetSuggestions}
                    className="text-sm text-purple-600 hover:text-purple-700"
                  >
                    Refresh Suggestions
                  </button>
                </div>

                <div className="space-y-4 max-h-[600px] overflow-y-auto">
                  {suggestions.map((suggestion, index) => (
                    <div key={suggestion.buddyId} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <UserIcon className="h-5 w-5 text-gray-400 mr-2" />
                            <h5 className="text-lg font-medium text-gray-900">
                              {suggestion.buddyName}
                            </h5>
                            <span className={`ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getScoreColor(suggestion.score)}`}>
                              <StarIcon className="h-3 w-3 mr-1" />
                              {Math.round(suggestion.score * 100)}% - {getScoreLabel(suggestion.score)}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-3">
                            <div>
                              <span className="text-sm font-medium text-gray-700">Location:</span>
                              <span className="ml-2 text-sm text-gray-600">{suggestion.buddyProfile.location}</span>
                            </div>
                            <div>
                              <span className="text-sm font-medium text-gray-700">Unit:</span>
                              <span className="ml-2 text-sm text-gray-600">{suggestion.buddyProfile.unit}</span>
                            </div>
                            <div>
                              <span className="text-sm font-medium text-gray-700">Experience:</span>
                              <span className="ml-2 text-sm text-gray-600">{suggestion.buddyProfile.experience}</span>
                            </div>
                            <div>
                              <span className="text-sm font-medium text-gray-700">Availability:</span>
                              <span className="ml-2 text-sm text-gray-600">{suggestion.buddyProfile.availability}</span>
                            </div>
                          </div>

                          {suggestion.buddyProfile.techStack.length > 0 && (
                            <div className="mb-2">
                              <span className="text-sm font-medium text-gray-700">Tech Stack:</span>
                              <div className="mt-1 flex flex-wrap gap-1">
                                {suggestion.buddyProfile.techStack.map((tech, techIndex) => (
                                  <span
                                    key={techIndex}
                                    className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                                  >
                                    {tech}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {suggestion.buddyProfile.interests.length > 0 && (
                            <div className="mb-2">
                              <span className="text-sm font-medium text-gray-700">Interests:</span>
                              <div className="mt-1 flex flex-wrap gap-1">
                                {suggestion.buddyProfile.interests.map((interest, interestIndex) => (
                                  <span
                                    key={interestIndex}
                                    className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800"
                                  >
                                    {interest}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="mt-3 p-4 bg-purple-50 rounded-md">
                            <span className="text-sm font-medium text-purple-700">AI Reasoning:</span>
                            <p className="text-sm text-purple-600 mt-2 leading-relaxed">{suggestion.reasoning}</p>
                          </div>
                        </div>

                        <div className="ml-4 flex-shrink-0">
                          <button
                            onClick={() => handleCreateMatch(suggestion.buddyId, suggestion.buddyName)}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                          >
                            Create Match
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Match Modal */}
      {selectedBuddy && (
        <CreateMatchModal
          isOpen={isMatchModalOpen}
          onClose={handleCloseMatchModal}
          buddyId={selectedBuddy.id}
          buddyName={selectedBuddy.name}
          newcomerId={newcomer.id}
          newcomerName={`${newcomer.firstName} ${newcomer.lastName}`}
        />
      )}
    </div>
  )
}
