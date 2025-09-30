import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { AuthRequest, requireRole } from '../middleware/auth';
import { AIMatchingService } from '../services/aiMatchingService';

const router = express.Router();
const prisma = new PrismaClient();

// Get AI suggestions for a newcomer (HR only)
router.post('/suggestions', requireRole(['HR']), [
  body('newcomerId').notEmpty().trim()
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check if AI matching is enabled
    if (!AIMatchingService.isEnabled()) {
      return res.status(503).json({ 
        error: 'AI matching is not enabled. Please check your OpenAI configuration.' 
      });
    }

    const { newcomerId } = req.body;

    // Fetch newcomer with profile
    const newcomer = await prisma.user.findUnique({
      where: { 
        id: newcomerId,
        role: 'NEWCOMER',
        isActive: true
      },
      include: {
        profile: true
      }
    });

    if (!newcomer) {
      return res.status(404).json({ error: 'Newcomer not found' });
    }

    if (!newcomer.profile) {
      return res.status(400).json({ 
        error: 'Newcomer profile is incomplete. Please add more information before using AI matching.' 
      });
    }

    // Prepare newcomer profile data for AI
    const newcomerProfile = {
      firstName: newcomer.firstName,
      lastName: newcomer.lastName,
      department: newcomer.profile.department || '',
      position: newcomer.profile.position || '',
      location: newcomer.profile.location || '',
      bio: newcomer.profile.bio || '',
      interests: newcomer.profile.interests || [],
      languages: newcomer.profile.languages || [],
      timezone: newcomer.profile.timezone || ''
    };

    // Get AI suggestions
    const suggestions = await AIMatchingService.getSuggestions({
      newcomerId,
      newcomerProfile
    });

    res.json(suggestions);
  } catch (error) {
    console.error('AI suggestions error:', error);
    res.status(500).json({ 
      error: 'Failed to generate AI suggestions',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
});

// Clear AI suggestion cache (HR only)
router.post('/clear-cache', requireRole(['HR']), async (req: AuthRequest, res: Response) => {
  try {
    AIMatchingService.clearCache();
    res.json({ message: 'AI suggestion cache cleared successfully' });
  } catch (error) {
    console.error('Clear cache error:', error);
    res.status(500).json({ error: 'Failed to clear cache' });
  }
});

// Get AI matching status (HR only)
router.get('/status', requireRole(['HR']), async (req: AuthRequest, res: Response) => {
  try {
    const isEnabled = AIMatchingService.isEnabled();
    res.json({ 
      enabled: isEnabled,
      message: isEnabled 
        ? 'AI matching is enabled and ready to use' 
        : 'AI matching is disabled. Please check your OpenAI configuration.'
    });
  } catch (error) {
    console.error('AI status error:', error);
    res.status(500).json({ error: 'Failed to check AI status' });
  }
});

export default router;
