import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { AuthRequest, requireRole } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Create a match (HR only)
router.post('/', requireRole(['HR']), [
  body('receiverId').notEmpty(),
  body('type').isIn(['NEWCOMER_MATCH', 'RELOCATION_SUPPORT', 'OFFICE_CONNECTION']),
  body('newcomerId').optional().notEmpty(),
  body('message').optional().trim(),
  body('startDate').optional().isISO8601(),
  body('endDate').optional().isISO8601()
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { receiverId, type, newcomerId, message, startDate, endDate } = req.body;

    // Check if receiver is a buddy
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
      include: { buddyProfile: true }
    });

    if (!receiver || !receiver.buddyProfile) {
      return res.status(400).json({ error: 'Receiver must be a buddy' });
    }

    // If newcomerId is provided, validate the newcomer
    if (newcomerId) {
      const newcomer = await prisma.user.findUnique({
        where: { id: newcomerId },
        select: { id: true, role: true, firstName: true, lastName: true }
      });

      if (!newcomer) {
        return res.status(400).json({ error: 'Newcomer not found' });
      }

      if (newcomer.role !== 'NEWCOMER') {
        return res.status(400).json({ error: 'Selected user is not a newcomer' });
      }
    }

    // Check buddy availability
    const currentMatches = await prisma.match.count({
      where: {
        receiverId,
        status: 'ACCEPTED'
      }
    });

    if (currentMatches >= receiver.buddyProfile.maxBuddies) {
      return res.status(400).json({ error: 'Buddy has reached maximum capacity' });
    }

    // Check for existing pending match
    const existingMatch = await prisma.match.findFirst({
      where: {
        senderId: req.user!.id,
        receiverId,
        status: 'PENDING'
      }
    });

    if (existingMatch) {
      return res.status(400).json({ error: 'Pending match already exists' });
    }

    const match = await prisma.match.create({
      data: {
        senderId: req.user!.id,
        receiverId,
        type,
        message,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
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

    // Create notification
    const notificationMessage = newcomerId 
      ? `You have a new ${type.replace('_', ' ').toLowerCase()} request from HR for a newcomer`
      : `You have a new ${type.replace('_', ' ').toLowerCase()} request from HR`;
    
    await prisma.notification.create({
      data: {
        userId: receiverId,
        title: 'New Buddy Match Request',
        message: notificationMessage,
        type: 'MATCH_REQUEST'
      }
    });

    res.status(201).json(match);
  } catch (error) {
    console.error('Create match error:', error);
    res.status(500).json({ error: 'Failed to create match' });
  }
});

// Get matches for current user
router.get('/', async (req: AuthRequest, res) => {
  try {
    const { status, type } = req.query;

    const where: any = {
      OR: [
        { senderId: req.user!.id },
        { receiverId: req.user!.id }
      ]
    };

    if (status) {
      where.status = status;
    }

    if (type) {
      where.type = type;
    }

    const matches = await prisma.match.findMany({
      where,
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            profile: {
              select: {
                avatar: true,
                department: true,
                position: true
              }
            }
          }
        },
        receiver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            profile: {
              select: {
                avatar: true,
                department: true,
                position: true
              }
            }
          }
        },
        _count: {
          select: {
            messages: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(matches);
  } catch (error) {
    console.error('Get matches error:', error);
    res.status(500).json({ error: 'Failed to fetch matches' });
  }
});

// Respond to match (accept/reject)
router.patch('/:id/respond', requireRole(['BUDDY']), [
  body('status').isIn(['ACCEPTED', 'REJECTED']),
  body('message').optional().trim()
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { status, message } = req.body;

    // Verify ownership and status
    const match = await prisma.match.findFirst({
      where: {
        id,
        receiverId: req.user!.id,
        status: 'PENDING'
      }
    });

    if (!match) {
      return res.status(404).json({ error: 'Match not found or already responded' });
    }

    // If accepting, check capacity
    if (status === 'ACCEPTED') {
      const buddyProfile = await prisma.buddyProfile.findUnique({
        where: { userId: req.user!.id }
      });

      if (buddyProfile) {
        const currentMatches = await prisma.match.count({
          where: {
            receiverId: req.user!.id,
            status: 'ACCEPTED'
          }
        });

        if (currentMatches >= buddyProfile.maxBuddies) {
          return res.status(400).json({ error: 'Maximum buddy capacity reached' });
        }
      }
    }

    const updatedMatch = await prisma.match.update({
      where: { id },
      data: {
        status,
        respondedAt: new Date()
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
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

    // Create notification for sender
    await prisma.notification.create({
      data: {
        userId: match.senderId,
        title: `Match ${status}`,
        message: `Your buddy match request has been ${status.toLowerCase()}`,
        type: 'MATCH_RESPONSE'
      }
    });

    res.json(updatedMatch);
  } catch (error) {
    console.error('Respond to match error:', error);
    res.status(500).json({ error: 'Failed to respond to match' });
  }
});

export default router;
