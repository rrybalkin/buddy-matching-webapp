import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { AuthRequest, requireRole } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Get current user's buddy profile
router.get('/me', requireRole(['BUDDY']), async (req: AuthRequest, res) => {
  try {
    const buddyProfile = await prisma.buddyProfile.findUnique({
      where: { userId: req.user!.id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    if (!buddyProfile) {
      return res.status(404).json({ error: 'Buddy profile not found' });
    }

    res.json(buddyProfile);
  } catch (error) {
    console.error('Get buddy profile error:', error);
    res.status(500).json({ error: 'Failed to fetch buddy profile' });
  }
});

// Get all buddy profiles with filters
router.get('/', async (req: AuthRequest, res) => {
  try {
    const { location, unit, techStack, interests, available } = req.query;
    
    const where: any = {
      isAvailable: available === 'true' ? true : undefined,
      user: { isActive: true },
      // Exclude current user from buddies list
      userId: { not: req.user?.id }
    };

    if (location) {
      where.location = { contains: location as string, mode: 'insensitive' };
    }

    if (unit) {
      where.unit = { contains: unit as string, mode: 'insensitive' };
    }

    // Note: We'll handle techStack and interests filtering after the query for case-insensitive search
    let techStackFilter: string[] = [];
    let interestsFilter: string[] = [];
    
    if (techStack) {
      techStackFilter = (techStack as string).split(',').map(tech => tech.trim());
    }

    if (interests) {
      interestsFilter = (interests as string).split(',').map(interest => interest.trim());
    }

    const buddies = await prisma.buddyProfile.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            profile: {
              select: {
                avatar: true,
                bio: true,
                department: true,
                position: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Apply case-insensitive filtering for techStack and interests
    let filteredBuddies = buddies;
    
    if (techStackFilter.length > 0) {
      filteredBuddies = filteredBuddies.filter(buddy => 
        techStackFilter.some(tech => 
          buddy.techStack.some(buddyTech => 
            buddyTech.toLowerCase() === tech.toLowerCase()
          )
        )
      );
    }
    
    if (interestsFilter.length > 0) {
      filteredBuddies = filteredBuddies.filter(buddy => 
        interestsFilter.some(interest => 
          buddy.interests.some(buddyInterest => 
            buddyInterest.toLowerCase() === interest.toLowerCase()
          )
        )
      );
    }

    // Get count of active matches for each buddy
    const buddiesWithCount = await Promise.all(
      filteredBuddies.map(async (buddy) => {
        const activeMatchesCount = await prisma.match.count({
          where: {
            receiverId: buddy.userId,
            status: 'ACCEPTED'
          }
        });
        return {
          ...buddy,
          _count: {
            receivedMatches: activeMatchesCount
          }
        };
      })
    );

    res.json(buddiesWithCount);
  } catch (error) {
    console.error('Get buddies error:', error);
    res.status(500).json({ error: 'Failed to fetch buddies' });
  }
});

// Create buddy profile
router.post('/', requireRole(['BUDDY']), [
  body('location').notEmpty().trim(),
  body('unit').notEmpty().trim(),
  body('techStack').isArray(),
  body('interests').isArray(),
  body('maxBuddies').isInt({ min: 1, max: 10 })
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { location, unit, techStack, interests, maxBuddies, experience, mentoringStyle, availability } = req.body;

    // Check if profile already exists
    const existingProfile = await prisma.buddyProfile.findUnique({
      where: { userId: req.user!.id }
    });

    if (existingProfile) {
      return res.status(400).json({ error: 'Buddy profile already exists' });
    }

    const buddyProfile = await prisma.buddyProfile.create({
      data: {
        userId: req.user!.id,
        location,
        unit,
        techStack,
        interests,
        maxBuddies: maxBuddies || 3,
        experience,
        mentoringStyle,
        availability
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    res.status(201).json(buddyProfile);
  } catch (error) {
    console.error('Create buddy profile error:', error);
    res.status(500).json({ error: 'Failed to create buddy profile' });
  }
});

// Update current user's buddy profile
router.put('/me', requireRole(['BUDDY']), [
  body('location').optional().trim(),
  body('unit').optional().trim(),
  body('techStack').optional().isArray(),
  body('interests').optional().isArray(),
  body('maxBuddies').optional().isInt({ min: 1, max: 10 }),
  body('experience').optional().trim(),
  body('mentoringStyle').optional().trim(),
  body('availability').optional().trim(),
  body('isAvailable').optional().isBoolean()
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const updateData = req.body;

    // Check if buddy profile exists
    const existingProfile = await prisma.buddyProfile.findUnique({
      where: { userId: req.user!.id }
    });

    if (!existingProfile) {
      return res.status(404).json({ error: 'Buddy profile not found' });
    }

    const updatedProfile = await prisma.buddyProfile.update({
      where: { userId: req.user!.id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    res.json(updatedProfile);
  } catch (error) {
    console.error('Update buddy profile error:', error);
    res.status(500).json({ error: 'Failed to update buddy profile' });
  }
});

// Update buddy profile by ID
router.put('/:id', requireRole(['BUDDY']), [
  body('location').optional().trim(),
  body('unit').optional().trim(),
  body('techStack').optional().isArray(),
  body('interests').optional().isArray(),
  body('maxBuddies').optional().isInt({ min: 1, max: 10 })
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const updateData = req.body;

    // Verify ownership
    const existingProfile = await prisma.buddyProfile.findFirst({
      where: {
        id,
        userId: req.user!.id
      }
    });

    if (!existingProfile) {
      return res.status(404).json({ error: 'Buddy profile not found' });
    }

    const updatedProfile = await prisma.buddyProfile.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    res.json(updatedProfile);
  } catch (error) {
    console.error('Update buddy profile error:', error);
    res.status(500).json({ error: 'Failed to update buddy profile' });
  }
});

// Get buddy load dashboard (HR only)
router.get('/dashboard', requireRole(['HR']), async (req: AuthRequest, res) => {
  try {
    const buddyStats = await prisma.buddyProfile.findMany({
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    const stats = await Promise.all(
      buddyStats.map(async (buddy) => {
        const activeMatchesCount = await prisma.match.count({
          where: {
            receiverId: buddy.userId,
            status: 'ACCEPTED'
          }
        });
        return {
          id: buddy.id,
          name: `${buddy.user.firstName} ${buddy.user.lastName}`,
          email: buddy.user.email,
          location: buddy.location,
          unit: buddy.unit,
          maxBuddies: buddy.maxBuddies,
          currentBuddies: activeMatchesCount,
          availability: buddy.isAvailable,
          utilizationRate: (activeMatchesCount / buddy.maxBuddies) * 100
        };
      })
    );

    res.json(stats);
  } catch (error) {
    console.error('Get buddy dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch buddy dashboard' });
  }
});

// Get buddy match distribution (HR only)
router.get('/match-distribution', requireRole(['HR']), async (req: AuthRequest, res) => {
  try {
    // Get all buddies with their match counts
    const buddies = await prisma.buddyProfile.findMany({
      select: {
        userId: true
      }
    });

    // Get match count for each buddy
    const buddyMatchCounts = await Promise.all(
      buddies.map(async (buddy) => {
        const matchCount = await prisma.match.count({
          where: {
            receiverId: buddy.userId,
            status: 'ACCEPTED'
          }
        });
        return matchCount;
      })
    );

    // Count how many buddies have each number of matches
    const distribution: { [key: number]: number } = {};
    buddyMatchCounts.forEach(count => {
      distribution[count] = (distribution[count] || 0) + 1;
    });

    // Convert to array format for the chart
    const chartData = Object.entries(distribution)
      .map(([matchCount, buddyCount]) => ({
        name: `${matchCount} ${matchCount === '1' ? 'Match' : 'Matches'}`,
        value: buddyCount,
        matchCount: parseInt(matchCount)
      }))
      .sort((a, b) => a.matchCount - b.matchCount);

    res.json(chartData);
  } catch (error) {
    console.error('Get buddy match distribution error:', error);
    res.status(500).json({ error: 'Failed to fetch buddy match distribution' });
  }
});

export default router;
