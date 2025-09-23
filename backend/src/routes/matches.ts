import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { AuthRequest, requireRole } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Create a match (HR and BUDDY roles)
router.post('/', requireRole(['HR', 'BUDDY']), [
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

    // Role-based validation for match types
    if (req.user!.role === 'HR' && type !== 'NEWCOMER_MATCH') {
      return res.status(400).json({ error: 'HR can only create NEWCOMER_MATCH type matches' });
    }

    if (req.user!.role === 'BUDDY' && (type === 'NEWCOMER_MATCH' || newcomerId)) {
      return res.status(400).json({ error: 'BUDDY cannot create NEWCOMER_MATCH type matches or include newcomerId' });
    }

    // Check if receiver is a buddy
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
      include: { buddyProfile: true }
    });

    if (!receiver || !receiver.buddyProfile) {
      return res.status(400).json({ error: 'Receiver must be a buddy' });
    }

    // For BUDDY role, prevent self-matching
    if (req.user!.role === 'BUDDY' && receiverId === req.user!.id) {
      return res.status(400).json({ error: 'Cannot create a match with yourself' });
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
    const existingMatchWhere: any = {
      senderId: req.user!.id,
      receiverId,
      type,
      status: 'PENDING'
    };

    // For newcomer matches, also check newcomerId
    if (newcomerId) {
      existingMatchWhere.newcomerId = newcomerId;
    }

    const existingMatch = await prisma.match.findFirst({
      where: existingMatchWhere
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
        endDate: endDate ? new Date(endDate) : null,
        newcomerId: newcomerId || null
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

    // Create notification with enhanced message
    let notificationMessage = '';
    let notificationTitle = '';

    if (req.user!.role === 'HR' && newcomerId) {
      // Get newcomer details for the notification
      const newcomer = await prisma.user.findUnique({
        where: { id: newcomerId },
        select: { firstName: true, lastName: true, profile: { select: { department: true, position: true } } }
      });
      
      const newcomerInfo = newcomer ? 
        `${newcomer.firstName} ${newcomer.lastName}${newcomer.profile?.department ? ` (${newcomer.profile.department})` : ''}${newcomer.profile?.position ? ` - ${newcomer.profile.position}` : ''}` : 
        'a newcomer';
      
      notificationTitle = 'New Buddy Match Request from HR';
      notificationMessage = `You have been assigned as a buddy for ${newcomerInfo}. This is a ${type.replace('_', ' ').toLowerCase()} request.`;
    } else if (req.user!.role === 'BUDDY') {
      const sender = await prisma.user.findUnique({
        where: { id: req.user!.id },
        select: { firstName: true, lastName: true, profile: { select: { department: true, position: true } } }
      });
      
      const senderInfo = sender ? 
        `${sender.firstName} ${sender.lastName}${sender.profile?.department ? ` (${sender.profile.department})` : ''}${sender.profile?.position ? ` - ${sender.profile.position}` : ''}` : 
        'a colleague';
      
      notificationTitle = 'New Buddy Connection Request';
      notificationMessage = `${senderInfo} wants to connect with you for ${type.replace('_', ' ').toLowerCase()}.`;
    } else {
      notificationTitle = 'New Buddy Match Request';
      notificationMessage = `You have a new ${type.replace('_', ' ').toLowerCase()} request from HR`;
    }
    
    await prisma.notification.create({
      data: {
        userId: receiverId,
        title: notificationTitle,
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
        newcomer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            profile: {
              select: {
                department: true,
                position: true,
                location: true,
                bio: true
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
