import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Get messages for a match
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

    const messages = await prisma.message.findMany({
      where: { matchId },
      include: {
        sender: {
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
        createdAt: 'asc'
      }
    });

    res.json(messages);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Send a message
router.post('/', [
  body('matchId').notEmpty(),
  body('content').notEmpty().trim().isLength({ min: 1, max: 1000 })
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { matchId, content } = req.body;

    // Verify user has access to this match
    const match = await prisma.match.findFirst({
      where: {
        id: matchId,
        OR: [
          { senderId: req.user!.id },
          { receiverId: req.user!.id }
        ],
        status: 'ACCEPTED' // Only allow messages for accepted matches
      }
    });

    if (!match) {
      return res.status(404).json({ error: 'Match not found or not accepted' });
    }

    const message = await prisma.message.create({
      data: {
        matchId,
        senderId: req.user!.id,
        content
      },
      include: {
        sender: {
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
      }
    });

    res.status(201).json(message);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Mark messages as read
router.patch('/read', [
  body('matchId').notEmpty(),
  body('messageIds').isArray()
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { matchId, messageIds } = req.body;

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

    // Mark messages as read
    await prisma.message.updateMany({
      where: {
        id: { in: messageIds },
        matchId,
        senderId: { not: req.user!.id } // Don't mark own messages as read
      },
      data: {
        isRead: true
      }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Mark messages read error:', error);
    res.status(500).json({ error: 'Failed to mark messages as read' });
  }
});

export default router;
