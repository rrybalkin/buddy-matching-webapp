import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

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
  body('phone').optional().isMobilePhone('any'),
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

export default router;
