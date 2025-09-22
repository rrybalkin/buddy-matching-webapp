import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { AuthRequest, requireRole } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Create a buddy request
router.post('/', [
  body('type').isIn(['RELOCATION_SUPPORT', 'OFFICE_CONNECTION']),
  body('message').optional().trim().isLength({ max: 500 }),
  body('preferences').optional().isString(),
  body('newLocation').optional().trim(),
  body('relocationDate').optional().isISO8601(),
  body('reason').optional().trim().isLength({ max: 500 })
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { type, message, preferences, newLocation, relocationDate, reason } = req.body;

    // Check if user already has a pending request of this type
    const existingRequest = await prisma.buddyRequest.findFirst({
      where: {
        userId: req.user!.id,
        type,
        status: 'PENDING'
      }
    });

    if (existingRequest) {
      return res.status(400).json({ error: 'You already have a pending request of this type' });
    }

    const request = await prisma.buddyRequest.create({
      data: {
        userId: req.user!.id,
        type,
        message,
        preferences,
        newLocation,
        relocationDate: relocationDate ? new Date(relocationDate) : null,
        reason
      }
    });

    res.status(201).json(request);
  } catch (error) {
    console.error('Create buddy request error:', error);
    res.status(500).json({ error: 'Failed to create buddy request' });
  }
});

// Get user's buddy requests
router.get('/my-requests', async (req: AuthRequest, res) => {
  try {
    const requests = await prisma.buddyRequest.findMany({
      where: { userId: req.user!.id },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(requests);
  } catch (error) {
    console.error('Get my requests error:', error);
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
});

// Get all buddy requests (HR only)
router.get('/', requireRole(['HR']), async (req: AuthRequest, res) => {
  try {
    const { status, type } = req.query;

    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (type) {
      where.type = type;
    }

    const requests = await prisma.buddyRequest.findMany({
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
                department: true,
                position: true,
                location: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(requests);
  } catch (error) {
    console.error('Get all requests error:', error);
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
});

// Update request status (HR only)
router.patch('/:id/status', requireRole(['HR']), [
  body('status').isIn(['PENDING', 'APPROVED', 'REJECTED']),
  body('message').optional().trim()
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { status, message } = req.body;

    const request = await prisma.buddyRequest.update({
      where: { id },
      data: { status },
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

    // Create notification for user
    await prisma.notification.create({
      data: {
        userId: request.userId,
        title: `Request ${status}`,
        message: `Your buddy request has been ${status.toLowerCase()}`,
        type: 'REQUEST_RESPONSE'
      }
    });

    res.json(request);
  } catch (error) {
    console.error('Update request status error:', error);
    res.status(500).json({ error: 'Failed to update request status' });
  }
});

export default router;
