import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Submit feedback for a match
router.post('/', [
  body('matchId').notEmpty(),
  body('rating').isInt({ min: 1, max: 5 }),
  body('comment').optional().trim().isLength({ max: 500 }),
  body('helpfulness').optional().isInt({ min: 1, max: 5 }),
  body('communication').optional().isInt({ min: 1, max: 5 }),
  body('availability').optional().isInt({ min: 1, max: 5 })
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { matchId, rating, comment, helpfulness, communication, availability } = req.body;

    // Verify user has access to this match and it's completed
    const match = await prisma.match.findFirst({
      where: {
        id: matchId,
        OR: [
          { senderId: req.user!.id },
          { receiverId: req.user!.id }
        ],
        status: 'COMPLETED'
      }
    });

    if (!match) {
      return res.status(404).json({ error: 'Match not found or not completed' });
    }

    // Check if feedback already exists
    const existingFeedback = await prisma.feedback.findUnique({
      where: {
        matchId_userId: {
          matchId,
          userId: req.user!.id
        }
      }
    });

    if (existingFeedback) {
      return res.status(400).json({ error: 'Feedback already submitted for this match' });
    }

    const feedback = await prisma.feedback.create({
      data: {
        matchId,
        userId: req.user!.id,
        rating,
        comment,
        helpfulness,
        communication,
        availability
      }
    });

    res.status(201).json(feedback);
  } catch (error) {
    console.error('Submit feedback error:', error);
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
});

// Get feedback for a match
router.get('/match/:matchId', async (req: AuthRequest, res) => {
  try {
    const { matchId } = req.params;

    // Verify user has access to this match
    const match = await prisma.match.findFirst({
      where: {
        id: matchId,
        OR: [
          { senderId: req.user!.id },
          { receiverId: req.user!.id }
        ]
      }
    });

    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    const feedback = await prisma.feedback.findMany({
      where: { matchId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profile: {
              select: {
                avatar: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(feedback);
  } catch (error) {
    console.error('Get feedback error:', error);
    res.status(500).json({ error: 'Failed to fetch feedback' });
  }
});

// Get feedback statistics (HR only)
router.get('/stats', async (req: AuthRequest, res) => {
  try {
    if (req.user!.role !== 'HR') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const stats = await prisma.feedback.aggregate({
      _avg: {
        rating: true,
        helpfulness: true,
        communication: true,
        availability: true
      },
      _count: {
        id: true
      }
    });

    const recentFeedback = await prisma.feedback.findMany({
      take: 10,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        match: {
          select: {
            type: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      stats,
      recentFeedback
    });
  } catch (error) {
    console.error('Get feedback stats error:', error);
    res.status(500).json({ error: 'Failed to fetch feedback statistics' });
  }
});

export default router;
