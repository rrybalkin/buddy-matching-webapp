import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { AuthRequest, requireRole } from '../middleware/auth';
import bcrypt from 'bcryptjs';

const router = express.Router();
const prisma = new PrismaClient();

// Get user profile
router.get('/profile', async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: {
        profile: true,
        buddyProfile: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update user profile
router.put('/profile', [
  body('phone').optional().custom((value) => {
    if (value === '' || value === null || value === undefined) {
      return true; // Allow empty values
    }
    // Use a simple regex for phone validation instead of isMobilePhone
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    if (!phoneRegex.test(value)) {
      throw new Error('Invalid phone number format');
    }
    return true;
  }),
  body('bio').optional().isLength({ max: 500 }),
  body('location').optional().trim(),
  body('department').optional().trim(),
  body('position').optional().trim(),
  body('interests').optional().isArray(),
  body('languages').optional().isArray()
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const updateData = req.body;

    // Check if profile exists
    const existingProfile = await prisma.userProfile.findUnique({
      where: { userId: req.user!.id }
    });

    let profile;
    if (existingProfile) {
      profile = await prisma.userProfile.update({
        where: { userId: req.user!.id },
        data: updateData
      });
    } else {
      profile = await prisma.userProfile.create({
        data: {
          userId: req.user!.id,
          ...updateData
        }
      });
    }

    res.json(profile);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Get all users (HR only)
router.get('/', async (req: AuthRequest, res) => {
  try {
    if (req.user!.role !== 'HR') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const { role, isActive } = req.query;

    const where: any = {};
    if (role) {
      where.role = role;
    }
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
        profile: {
          select: {
            department: true,
            position: true,
            location: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Update user status (HR only)
router.patch('/:id/status', async (req: AuthRequest, res) => {
  try {
    if (req.user!.role !== 'HR') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const { id } = req.params;
    const { isActive } = req.body;

    const user = await prisma.user.update({
      where: { id },
      data: { isActive },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true
      }
    });

    res.json(user);
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }
});

// Get all newcomers with buddy assignment status (HR only)
router.get("/newcomers", requireRole(["HR"]), async (req: AuthRequest, res: Response) => {
  try {
    const { status, search } = req.query;

    const where: any = {
      role: "NEWCOMER",
      isActive: true
    };

    if (search) {
      where.OR = [
        { firstName: { contains: search as string, mode: "insensitive" } },
        { lastName: { contains: search as string, mode: "insensitive" } },
        { email: { contains: search as string, mode: "insensitive" } }
      ];
    }

    const newcomers = await prisma.user.findMany({
      where,
      include: {
        profile: {
          select: {
            department: true,
            position: true,
            location: true,
            startDate: true,
            bio: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    // Get all matches for newcomers
    const newcomerIds = newcomers.map(n => n.id);
    const matches = await prisma.match.findMany({
      where: {
        newcomerId: { in: newcomerIds },
        status: "ACCEPTED",
        type: "NEWCOMER_MATCH"
      },
      include: {
        receiver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    // Create a map of newcomerId to their assigned buddy
    const newcomerToBuddyMap = new Map();
    matches.forEach(match => {
      if (match.newcomerId) {
        newcomerToBuddyMap.set(match.newcomerId, match.receiver);
      }
    });

    // Add buddy assignment status to each newcomer
    const newcomersWithStatus = newcomers.map(newcomer => {
      const assignedBuddy = newcomerToBuddyMap.get(newcomer.id);
      const hasBuddy = !!assignedBuddy;
      
      return {
        ...newcomer,
        buddyStatus: hasBuddy ? "assigned" : "unassigned",
        assignedBuddy: assignedBuddy || null
      };
    });

    // Filter by status if provided
    let filteredNewcomers = newcomersWithStatus;
    if (status) {
      filteredNewcomers = newcomersWithStatus.filter(n => n.buddyStatus === status);
    }

    res.json(filteredNewcomers);
  } catch (error) {
    console.error("Get newcomers error:", error);
    res.status(500).json({ error: "Failed to fetch newcomers" });
  }
});

// Create new newcomer account (HR only)
router.post('/newcomers', requireRole(['HR']), [
  body('firstName').notEmpty().trim(),
  body('lastName').notEmpty().trim(),
  body('email').isEmail().normalizeEmail(),
  body('department').optional().trim(),
  body('position').optional().trim(),
  body('location').optional().trim(),
  body('startDate').optional().isISO8601(),
  body('bio').optional().trim().isLength({ max: 500 })
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { firstName, lastName, email, department, position, location, startDate, bio } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role: 'NEWCOMER'
      }
    });

    // Create profile if additional info provided
    if (department || position || location || startDate || bio) {
      await prisma.userProfile.create({
        data: {
          userId: user.id,
          department,
          position,
          location,
          startDate: startDate ? new Date(startDate) : null,
          bio
        }
      });
    }

    // Return user with temporary password
    res.status(201).json({
      ...user,
      tempPassword,
      profile: {
        department,
        position,
        location,
        startDate: startDate ? new Date(startDate) : null,
        bio
      }
    });
  } catch (error) {
    console.error('Create newcomer error:', error);
    res.status(500).json({ error: 'Failed to create newcomer' });
  }
});

// Get newcomer's buddy assignments (HR only)
router.get('/newcomers/:id/matches', requireRole(['HR']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const newcomer = await prisma.user.findUnique({
      where: { id, role: 'NEWCOMER' },
      include: {
        receivedMatches: {
          where: {
            type: 'NEWCOMER_MATCH'
          },
          include: {
            sender: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                buddyProfile: {
                  select: {
                    location: true,
                    unit: true,
                    techStack: true
                  }
                }
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (!newcomer) {
      return res.status(404).json({ error: 'Newcomer not found' });
    }

    res.json(newcomer.receivedMatches);
  } catch (error) {
    console.error('Get newcomer matches error:', error);
    res.status(500).json({ error: 'Failed to fetch newcomer matches' });
  }
});

// Update newcomer profile (HR only)
router.patch('/newcomers/:id', requireRole(['HR']), [
  body('firstName').optional().trim(),
  body('lastName').optional().trim(),
  body('email').optional().isEmail().normalizeEmail(),
  body('department').optional().trim(),
  body('position').optional().trim(),
  body('location').optional().trim(),
  body('startDate').optional().isISO8601(),
  body('bio').optional().trim().isLength({ max: 500 })
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const updateData = req.body;

    // Check if newcomer exists
    const newcomer = await prisma.user.findUnique({
      where: { id, role: 'NEWCOMER' }
    });

    if (!newcomer) {
      return res.status(404).json({ error: 'Newcomer not found' });
    }

    // Update user data
    const { firstName, lastName, email, ...profileData } = updateData;
    const userUpdateData: any = {};
    
    if (firstName) userUpdateData.firstName = firstName;
    if (lastName) userUpdateData.lastName = lastName;
    if (email) userUpdateData.email = email;

    if (Object.keys(userUpdateData).length > 0) {
      await prisma.user.update({
        where: { id },
        data: userUpdateData
      });
    }

    // Update or create profile
    if (Object.keys(profileData).length > 0) {
      const existingProfile = await prisma.userProfile.findUnique({
        where: { userId: id }
      });

      if (existingProfile) {
        await prisma.userProfile.update({
          where: { userId: id },
          data: profileData
        });
      } else {
        await prisma.userProfile.create({
          data: {
            userId: id,
            ...profileData
          }
        });
      }
    }

    // Return updated newcomer
    const updatedNewcomer = await prisma.user.findUnique({
      where: { id },
      include: {
        profile: true
      }
    });

    res.json(updatedNewcomer);
  } catch (error) {
    console.error('Update newcomer error:', error);
    res.status(500).json({ error: 'Failed to update newcomer' });
  }
});

export default router;
