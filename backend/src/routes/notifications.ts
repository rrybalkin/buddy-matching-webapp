import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Get user notifications
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { limit = 50, offset = 0 } = req.query;

    const notifications = await prisma.notification.findMany({
      where: { userId: req.user!.id },
      orderBy: {
        createdAt: 'desc'
      },
      take: parseInt(limit as string),
      skip: parseInt(offset as string)
    });

    res.json(notifications);
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Mark notification as read
router.patch('/:id/read', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const notification = await prisma.notification.updateMany({
      where: {
        id,
        userId: req.user!.id
      },
      data: {
        isRead: true
      }
    });

    if (notification.count === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// Mark all notifications as read
router.patch('/read-all', async (req: AuthRequest, res: Response) => {
  try {
    await prisma.notification.updateMany({
      where: {
        userId: req.user!.id,
        isRead: false
      },
      data: {
        isRead: true
      }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
});

// Get unread notification count
router.get('/unread-count', async (req: AuthRequest, res: Response) => {
  try {
    const count = await prisma.notification.count({
      where: {
        userId: req.user!.id,
        isRead: false
      }
    });

    res.json({ count });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: 'Failed to get unread count' });
  }
});

export default router;
