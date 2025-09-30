export interface AISuggestion {
  buddyId: string;
  buddyName: string;
  score: number; // 0-1 confidence score
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

export interface AISuggestionRequest {
  newcomerId: string;
  newcomerProfile: {
    firstName: string;
    lastName: string;
    department: string;
    position: string;
    location: string;
    bio: string;
    interests: string[];
    languages: string[];
    timezone: string;
  };
}

export interface AISuggestionResponse {
  suggestions: AISuggestion[];
  totalBuddiesAnalyzed: number;
  processingTime: number;
}
