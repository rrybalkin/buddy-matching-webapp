import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Register
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('firstName').notEmpty().trim(),
  body('lastName').notEmpty().trim(),
  body('role').isIn(['HR', 'BUDDY']),
  // Profile fields (optional)
  body('phone').optional().custom((value) => {
    if (value === '' || value === null || value === undefined) {
      return true; // Allow empty values
    }
    return value.length >= 10 && value.length <= 15;
  }).withMessage('Phone number must be 10-15 characters long'),
  body('bio').optional().isLength({ max: 500 }),
  body('location').optional().trim(),
  body('department').optional().trim(),
  body('position').optional().trim(),
  body('interests').optional().isArray(),
  body('languages').optional().isArray(),
  // Buddy-specific fields (optional)
  body('unit').optional().trim(),
  body('techStack').optional().isArray(),
  body('maxBuddies').optional().isInt({ min: 1, max: 10 }),
  body('experience').optional().trim(),
  body('mentoringStyle').optional().trim(),
  body('availability').optional().trim()
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { 
      email, 
      password, 
      firstName, 
      lastName, 
      role,
      // Profile fields
      phone,
      bio,
      location,
      department,
      position,
      interests,
      languages,
      // Buddy-specific fields
      unit,
      techStack,
      maxBuddies,
      experience,
      mentoringStyle,
      availability
    } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user with profile and buddy profile
    const userData: any = {
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role
    };

    // Create user profile if any profile data is provided
    const hasProfileData = phone || bio || location || department || position || 
                          (interests && interests.length > 0) || (languages && languages.length > 0);
    
    if (hasProfileData) {
      userData.profile = {
        create: {
          phone: phone || null,
          bio: bio || null,
          location: location || null,
          department: department || null,
          position: position || null,
          interests: interests || [],
          languages: languages || []
        }
      };
    }

    // If user is registering as BUDDY, create buddy profile
    if (role === 'BUDDY') {
      userData.buddyProfile = {
        create: {
          location: location || 'Not specified',
          unit: unit || 'Not specified',
          techStack: techStack || [],
          interests: interests || [],
          maxBuddies: maxBuddies || 3,
          isAvailable: true,
          experience: experience || null,
          mentoringStyle: mentoringStyle || null,
          availability: availability || null
        }
      };
    }

    const user = await prisma.user.create({
      data: userData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true
      }
    });

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      user,
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true
      }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get current user
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        profile: true,
        buddyProfile: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

export default router;
