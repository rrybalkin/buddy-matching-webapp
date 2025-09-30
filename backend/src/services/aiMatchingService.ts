import { PrismaClient } from '@prisma/client';
import { AISuggestion, AISuggestionRequest, AISuggestionResponse } from '../types/aiMatching';
import { AIProviderFactory } from './ai/aiProviderFactory';
import { AIMessage } from './ai/aiProvider';

const prisma = new PrismaClient();

// Cache for AI responses to avoid repeated API calls
const suggestionCache = new Map<string, { response: AISuggestionResponse; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export class AIMatchingService {
  /**
   * Get AI-powered buddy suggestions for a newcomer
   */
  static async getSuggestions(request: AISuggestionRequest): Promise<AISuggestionResponse> {
    const startTime = Date.now();
    
    // Check cache first
    const cacheKey = `${request.newcomerId}-${JSON.stringify(request.newcomerProfile)}`;
    const cached = suggestionCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.response;
    }

    try {
      // Fetch all available buddies
      const buddies = await prisma.buddyProfile.findMany({
        where: {
          isAvailable: true,
          user: { isActive: true }
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profile: {
                select: {
                  bio: true,
                  interests: true,
                  languages: true
                }
              }
            }
          }
        }
      });

      if (buddies.length === 0) {
        return {
          suggestions: [],
          totalBuddiesAnalyzed: 0,
          processingTime: Date.now() - startTime
        };
      }

      // Create AI prompt
      const { prompt, limitedBuddies } = this.createMatchingPrompt(request.newcomerProfile, buddies);
      
      // Get AI provider and generate completion
      const aiProvider = AIProviderFactory.initializeDefaultProvider();
      
      if (!aiProvider.isConfigured()) {
        throw new Error('AI provider is not properly configured');
      }

      const messages: AIMessage[] = [
        {
          role: 'system',
          content: 'You are an expert HR matching system that pairs newcomers with experienced buddies. Analyze the newcomer profile and available buddies to suggest the best matches with detailed reasoning.'
        },
        {
          role: 'user',
          content: prompt
        }
      ];

      const completion = await aiProvider.generateCompletion({
        messages,
        temperature: 0.3,
        maxTokens: 2000
      });

      // Parse AI response
      const suggestions = this.parseAIResponse(completion.choices[0].message.content || '', buddies);
      
      const response: AISuggestionResponse = {
        suggestions: suggestions.slice(0, 5), // Return top 5 suggestions
        totalBuddiesAnalyzed: limitedBuddies.length, // Use limited buddies count
        processingTime: Date.now() - startTime
      };

      // Cache the response
      suggestionCache.set(cacheKey, { response, timestamp: Date.now() });

      return response;
    } catch (error) {
      console.error('AI matching error:', error);
      console.error('Error details:', error instanceof Error ? error.message : String(error));
      throw new Error(`Failed to generate AI suggestions: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Create a structured prompt for AI matching
   */
  private static createMatchingPrompt(newcomerProfile: AISuggestionRequest['newcomerProfile'], buddies: any[]): { prompt: string; limitedBuddies: any[] } {
    const newcomerInfo = `
NEWCOMER PROFILE:
- Name: ${newcomerProfile.firstName} ${newcomerProfile.lastName}
- Department: ${newcomerProfile.department}
- Position: ${newcomerProfile.position}
- Location: ${newcomerProfile.location}
- Bio: ${newcomerProfile.bio}
- Interests: ${newcomerProfile.interests.join(', ')}
- Languages: ${newcomerProfile.languages.join(', ')}
- Timezone: ${newcomerProfile.timezone}
`;

    // Send all buddies but with concise information to keep prompt manageable
    const buddiesInfo = buddies.map((buddy, index) => 
      `${buddy.user.id}|${buddy.user.firstName} ${buddy.user.lastName}|${buddy.location}|${buddy.unit}|${buddy.techStack.join(',')}|${buddy.interests.join(',')}|${buddy.experience || 'N/A'}|${buddy.user.profile?.languages?.join(',') || 'N/A'}`
    ).join('\n');

    // Log AI matching statistics
    console.log(`AI Matching: Analyzing ${buddies.length} buddies for newcomer matching`);

    return {
      prompt: `${newcomerInfo}

AVAILABLE BUDDIES (Format: ID|Name|Location|Unit|TechStack|Interests|Experience|Languages):
${buddiesInfo}

Please analyze the newcomer profile and suggest the best buddy matches from ALL available buddies above. Consider:
1. Technical compatibility (tech stack, department alignment)
2. Personal interests overlap
3. Location proximity or timezone compatibility
4. Experience level appropriateness
5. Language compatibility

IMPORTANT: 
1. When writing reasoning, make sure to use the EXACT buddy name from the buddy data provided above. Do not reference any other names or make up names.
2. The buddy ID you provide MUST correspond to the buddy you are describing in the reasoning. If you mention "John Doe" in the reasoning, the buddy ID must be for John Doe, not someone else.

For each suggested match, provide:
- Buddy ID (must match exactly from the buddy data above and correspond to the buddy mentioned in reasoning)
- Match score (0-1, where 1 is perfect match)
- Detailed reasoning explaining why this is a good match (use the exact buddy name from the data)
- Specific areas of compatibility

Return your response in this JSON format:
{
  "suggestions": [
    {
      "buddyId": "buddy_id_here",
      "score": 0.85,
      "reasoning": "Detailed explanation of why this is a good match using the EXACT buddy name from the data above..."
    }
  ]
}`,
      limitedBuddies: buddies // Return all buddies for accurate count
    };
  }

  /**
   * Parse AI response and map to our data structure
   */
  private static parseAIResponse(aiResponse: string, buddies: any[]): AISuggestion[] {
    try {
      // Extract JSON from AI response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      const suggestions: AISuggestion[] = [];

      for (const suggestion of parsed.suggestions || []) {
        const buddy = buddies.find(b => b.user.id === suggestion.buddyId);
        if (buddy) {
          suggestions.push({
            buddyId: suggestion.buddyId,
            buddyName: `${buddy.user.firstName} ${buddy.user.lastName}`,
            score: Math.min(Math.max(suggestion.score || 0, 0), 1), // Clamp between 0 and 1
            reasoning: suggestion.reasoning || 'No reasoning provided',
            buddyProfile: {
              location: buddy.location,
              unit: buddy.unit,
              techStack: buddy.techStack,
              interests: buddy.interests,
              experience: buddy.experience || 'Not specified',
              mentoringStyle: buddy.mentoringStyle || 'Not specified',
              availability: buddy.availability || 'Not specified'
            }
          });
        }
      }

      // Sort by score (highest first)
      return suggestions.sort((a, b) => b.score - a.score);
    } catch (error) {
      console.error('Error parsing AI response:', error);
      // Return empty suggestions if parsing fails
      return [];
    }
  }

  /**
   * Clear suggestion cache (useful for testing or when profiles change)
   */
  static clearCache(): void {
    suggestionCache.clear();
  }

  /**
   * Check if AI matching is enabled
   */
  static isEnabled(): boolean {
    if (process.env.AI_MATCHING_ENABLED !== 'true') {
      return false;
    }

    try {
      const aiProvider = AIProviderFactory.initializeDefaultProvider();
      return aiProvider.isConfigured();
    } catch (error) {
      console.error('AI provider configuration error:', error);
      return false;
    }
  }
}
