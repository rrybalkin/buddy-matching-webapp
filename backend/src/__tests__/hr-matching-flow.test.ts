import request from 'supertest';
import express from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authenticateToken } from '../middleware/auth';
import matchesRouter from '../routes/matches';
import buddiesRouter from '../routes/buddies';
import authRouter from '../routes/auth';

const app = express();
app.use(express.json());
app.use('/api/auth', authRouter);
app.use('/api/buddies', authenticateToken, buddiesRouter);
app.use('/api/matches', authenticateToken, matchesRouter);

const prisma = new PrismaClient();

describe('HR Matching Flow - Complete User Story Test', () => {
  let hrToken: string;
  let buddyToken: string;
  let newcomerToken: string;
  let hrUser: any;
  let buddyUser: any;
  let newcomerUser: any;

  beforeAll(async () => {
    // Clean up any existing data
    await prisma.notification.deleteMany();
    await prisma.match.deleteMany();
    await prisma.buddyProfile.deleteMany();
    await prisma.userProfile.deleteMany();
    await prisma.user.deleteMany();

    // Create HR user
    const hrPassword = await bcrypt.hash('password123', 12);
    hrUser = await prisma.user.create({
      data: {
        email: 'hr@test.com',
        password: hrPassword,
        firstName: 'Sarah',
        lastName: 'Johnson',
        role: 'HR',
        profile: {
          create: {
            department: 'Human Resources',
            position: 'HR Manager',
            location: 'New York',
            bio: 'Passionate about creating great employee experiences',
            interests: ['Team Building', 'Employee Development'],
            languages: ['English']
          }
        }
      }
    });

    // Create Buddy user
    const buddyPassword = await bcrypt.hash('password123', 12);
    buddyUser = await prisma.user.create({
      data: {
        email: 'buddy@test.com',
        password: buddyPassword,
        firstName: 'John',
        lastName: 'Doe',
        role: 'BUDDY',
        profile: {
          create: {
            department: 'Engineering',
            position: 'Senior Software Engineer',
            location: 'San Francisco',
            bio: 'Experienced engineer passionate about helping others',
            interests: ['Hiking', 'Photography', 'Coffee'],
            languages: ['English']
          }
        },
        buddyProfile: {
          create: {
            location: 'San Francisco',
            unit: 'Engineering',
            techStack: ['React', 'Node.js', 'TypeScript', 'PostgreSQL'],
            interests: ['Hiking', 'Photography', 'Coffee'],
            maxBuddies: 3,
            isAvailable: true,
            experience: '5+ years',
            mentoringStyle: 'Hands-on with regular check-ins'
          }
        }
      }
    });

    // Create Newcomer user
    const newcomerPassword = await bcrypt.hash('password123', 12);
    newcomerUser = await prisma.user.create({
      data: {
        email: 'newcomer@test.com',
        password: newcomerPassword,
        firstName: 'Alex',
        lastName: 'Newcomer',
        role: 'NEWCOMER',
        profile: {
          create: {
            department: 'Engineering',
            position: 'Junior Developer',
            location: 'San Francisco',
            startDate: new Date('2024-02-01'),
            bio: 'Excited to start my journey at the company!',
            interests: ['Learning', 'Networking', 'Growth'],
            languages: ['English']
          }
        }
      }
    });

    // Generate JWT tokens
    hrToken = jwt.sign(
      { userId: hrUser.id, email: hrUser.email, role: hrUser.role },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

    buddyToken = jwt.sign(
      { userId: buddyUser.id, email: buddyUser.email, role: buddyUser.role },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

    newcomerToken = jwt.sign(
      { userId: newcomerUser.id, email: newcomerUser.email, role: newcomerUser.role },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  });

  describe('Step 1: HR Dashboard & Buddy Management', () => {
    test('HR can view buddy dashboard with capacity tracking', async () => {
      const response = await request(app)
        .get('/api/buddies/dashboard')
        .set('Authorization', `Bearer ${hrToken}`)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBeGreaterThan(0);
      
      const buddy = response.body[0];
      expect(buddy).toHaveProperty('name');
      expect(buddy).toHaveProperty('email');
      expect(buddy).toHaveProperty('location');
      expect(buddy).toHaveProperty('unit');
      expect(buddy).toHaveProperty('maxBuddies');
      expect(buddy).toHaveProperty('currentBuddies');
      expect(buddy).toHaveProperty('availability');
      expect(buddy).toHaveProperty('utilizationRate');
    });

    test('HR can filter buddies by location', async () => {
      const response = await request(app)
        .get('/api/buddies?location=San Francisco')
        .set('Authorization', `Bearer ${hrToken}`)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      response.body.forEach((buddy: any) => {
        expect(buddy.location).toContain('San Francisco');
      });
    });

    test('HR can filter buddies by tech stack', async () => {
      const response = await request(app)
        .get('/api/buddies?techStack=React,Node.js')
        .set('Authorization', `Bearer ${hrToken}`)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      response.body.forEach((buddy: any) => {
        const hasReact = buddy.techStack.some((tech: string) => 
          tech.toLowerCase().includes('react')
        );
        const hasNode = buddy.techStack.some((tech: string) => 
          tech.toLowerCase().includes('node')
        );
        expect(hasReact || hasNode).toBe(true);
      });
    });

    test('HR can filter buddies by interests', async () => {
      const response = await request(app)
        .get('/api/buddies?interests=Hiking,Photography')
        .set('Authorization', `Bearer ${hrToken}`)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      response.body.forEach((buddy: any) => {
        const hasHiking = buddy.interests.some((interest: string) => 
          interest.toLowerCase().includes('hiking')
        );
        const hasPhotography = buddy.interests.some((interest: string) => 
          interest.toLowerCase().includes('photography')
        );
        expect(hasHiking || hasPhotography).toBe(true);
      });
    });

    test('HR can filter available buddies only', async () => {
      const response = await request(app)
        .get('/api/buddies?available=true')
        .set('Authorization', `Bearer ${hrToken}`)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      response.body.forEach((buddy: any) => {
        expect(buddy.isAvailable).toBe(true);
      });
    });
  });

  describe('Step 2: Match Creation Workflow', () => {
    test('HR can create a match for a newcomer', async () => {
      const matchData = {
        receiverId: buddyUser.id,
        type: 'NEWCOMER_MATCH',
        message: 'Welcome to the team! John will be your buddy.',
        startDate: '2024-02-01T00:00:00.000Z',
        endDate: '2024-05-01T00:00:00.000Z'
      };

      const response = await request(app)
        .post('/api/matches')
        .set('Authorization', `Bearer ${hrToken}`)
        .send(matchData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('senderId', hrUser.id);
      expect(response.body).toHaveProperty('receiverId', buddyUser.id);
      expect(response.body).toHaveProperty('type', 'NEWCOMER_MATCH');
      expect(response.body).toHaveProperty('status', 'PENDING');
      expect(response.body).toHaveProperty('message', matchData.message);
      expect(response.body).toHaveProperty('startDate');
      expect(response.body).toHaveProperty('endDate');
      expect(response.body).toHaveProperty('sender');
      expect(response.body).toHaveProperty('receiver');
    });

    test('HR cannot create match for non-buddy user', async () => {
      const matchData = {
        receiverId: newcomerUser.id,
        type: 'NEWCOMER_MATCH',
        message: 'This should fail'
      };

      const response = await request(app)
        .post('/api/matches')
        .set('Authorization', `Bearer ${hrToken}`)
        .send(matchData)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Receiver must be a buddy');
    });

    test('HR cannot create match when buddy is at capacity', async () => {
      // First, create matches to fill buddy capacity
      for (let i = 0; i < 3; i++) {
        await prisma.match.create({
          data: {
            senderId: hrUser.id,
            receiverId: buddyUser.id,
            type: 'NEWCOMER_MATCH',
            status: 'ACCEPTED'
          }
        });
      }

      const matchData = {
        receiverId: buddyUser.id,
        type: 'NEWCOMER_MATCH',
        message: 'This should fail - buddy at capacity'
      };

      const response = await request(app)
        .post('/api/matches')
        .set('Authorization', `Bearer ${hrToken}`)
        .send(matchData)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Buddy has reached maximum capacity');
    });

    test('HR cannot create duplicate pending match', async () => {
      // Create first match
      await prisma.match.create({
        data: {
          senderId: hrUser.id,
          receiverId: buddyUser.id,
          type: 'NEWCOMER_MATCH',
          status: 'PENDING'
        }
      });

      const matchData = {
        receiverId: buddyUser.id,
        type: 'NEWCOMER_MATCH',
        message: 'This should fail - duplicate pending'
      };

      const response = await request(app)
        .post('/api/matches')
        .set('Authorization', `Bearer ${hrToken}`)
        .send(matchData)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Pending match already exists');
    });

    test('Match creation creates notification for buddy', async () => {
      // Clean up previous matches
      await prisma.match.deleteMany();
      await prisma.notification.deleteMany();

      const matchData = {
        receiverId: buddyUser.id,
        type: 'NEWCOMER_MATCH',
        message: 'Test notification'
      };

      await request(app)
        .post('/api/matches')
        .set('Authorization', `Bearer ${hrToken}`)
        .send(matchData)
        .expect(201);

      const notification = await prisma.notification.findFirst({
        where: { userId: buddyUser.id }
      });

      expect(notification).toBeTruthy();
      expect(notification?.title).toBe('New Buddy Match Request');
      expect(notification?.type).toBe('MATCH_REQUEST');
    });
  });

  describe('Step 3: Buddy Response Workflow', () => {
    let matchId: string;

    beforeEach(async () => {
      // Clean up and create a fresh match
      await prisma.match.deleteMany();
      await prisma.notification.deleteMany();

      const match = await prisma.match.create({
        data: {
          senderId: hrUser.id,
          receiverId: buddyUser.id,
          type: 'NEWCOMER_MATCH',
          status: 'PENDING',
          message: 'Please accept this match'
        }
      });
      matchId = match.id;
    });

    test('Buddy can accept match request', async () => {
      const response = await request(app)
        .patch(`/api/matches/${matchId}/respond`)
        .set('Authorization', `Bearer ${buddyToken}`)
        .send({ status: 'ACCEPTED', message: 'Happy to help!' })
        .expect(200);

      expect(response.body).toHaveProperty('status', 'ACCEPTED');
      expect(response.body).toHaveProperty('respondedAt');
    });

    test('Buddy can reject match request', async () => {
      const response = await request(app)
        .patch(`/api/matches/${matchId}/respond`)
        .set('Authorization', `Bearer ${buddyToken}`)
        .send({ status: 'REJECTED', message: 'Not available at this time' })
        .expect(200);

      expect(response.body).toHaveProperty('status', 'REJECTED');
      expect(response.body).toHaveProperty('respondedAt');
    });

    test('Buddy cannot respond to match they did not receive', async () => {
      // Create a match where buddy is the sender
      const otherMatch = await prisma.match.create({
        data: {
          senderId: buddyUser.id,
          receiverId: hrUser.id,
          type: 'NEWCOMER_MATCH',
          status: 'PENDING'
        }
      });

      const response = await request(app)
        .patch(`/api/matches/${otherMatch.id}/respond`)
        .set('Authorization', `Bearer ${buddyToken}`)
        .send({ status: 'ACCEPTED' })
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Match not found or already responded');
    });

    test('Buddy cannot respond to already responded match', async () => {
      // First accept the match
      await request(app)
        .patch(`/api/matches/${matchId}/respond`)
        .set('Authorization', `Bearer ${buddyToken}`)
        .send({ status: 'ACCEPTED' })
        .expect(200);

      // Try to respond again
      const response = await request(app)
        .patch(`/api/matches/${matchId}/respond`)
        .set('Authorization', `Bearer ${buddyToken}`)
        .send({ status: 'REJECTED' })
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Match not found or already responded');
    });

    test('Buddy response creates notification for HR', async () => {
      await request(app)
        .patch(`/api/matches/${matchId}/respond`)
        .set('Authorization', `Bearer ${buddyToken}`)
        .send({ status: 'ACCEPTED' })
        .expect(200);

      const notification = await prisma.notification.findFirst({
        where: { userId: hrUser.id }
      });

      expect(notification).toBeTruthy();
      expect(notification?.title).toBe('Match ACCEPTED');
      expect(notification?.type).toBe('MATCH_RESPONSE');
    });
  });

  describe('Step 4: Match Management & Viewing', () => {
    beforeEach(async () => {
      // Clean up and create test matches
      await prisma.match.deleteMany();
      
      // Create matches for different scenarios
      await prisma.match.create({
        data: {
          senderId: hrUser.id,
          receiverId: buddyUser.id,
          type: 'NEWCOMER_MATCH',
          status: 'PENDING',
          message: 'Pending match'
        }
      });

      await prisma.match.create({
        data: {
          senderId: hrUser.id,
          receiverId: buddyUser.id,
          type: 'NEWCOMER_MATCH',
          status: 'ACCEPTED',
          message: 'Accepted match',
          respondedAt: new Date()
        }
      });
    });

    test('HR can view all their matches', async () => {
      const response = await request(app)
        .get('/api/matches')
        .set('Authorization', `Bearer ${hrToken}`)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBe(2);
      
      response.body.forEach((match: any) => {
        expect(match).toHaveProperty('id');
        expect(match).toHaveProperty('senderId', hrUser.id);
        expect(match).toHaveProperty('receiverId', buddyUser.id);
        expect(match).toHaveProperty('type', 'NEWCOMER_MATCH');
        expect(match).toHaveProperty('status');
        expect(match).toHaveProperty('sender');
        expect(match).toHaveProperty('receiver');
      });
    });

    test('HR can filter matches by status', async () => {
      const response = await request(app)
        .get('/api/matches?status=PENDING')
        .set('Authorization', `Bearer ${hrToken}`)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBe(1);
      expect(response.body[0].status).toBe('PENDING');
    });

    test('HR can filter matches by type', async () => {
      const response = await request(app)
        .get('/api/matches?type=NEWCOMER_MATCH')
        .set('Authorization', `Bearer ${hrToken}`)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBe(2);
      response.body.forEach((match: any) => {
        expect(match.type).toBe('NEWCOMER_MATCH');
      });
    });

    test('Buddy can view their received matches', async () => {
      const response = await request(app)
        .get('/api/matches')
        .set('Authorization', `Bearer ${buddyToken}`)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBe(2);
      
      response.body.forEach((match: any) => {
        expect(match).toHaveProperty('receiverId', buddyUser.id);
      });
    });
  });

  describe('Step 5: Pre-Start Date Matching Features', () => {
    test('HR can create match with start date before newcomer start date', async () => {
      const futureStartDate = new Date('2024-01-15T00:00:00.000Z');
      const futureEndDate = new Date('2024-04-15T00:00:00.000Z');

      const matchData = {
        receiverId: buddyUser.id,
        type: 'NEWCOMER_MATCH',
        message: 'Pre-start date match for Alex',
        startDate: futureStartDate.toISOString(),
        endDate: futureEndDate.toISOString()
      };

      const response = await request(app)
        .post('/api/matches')
        .set('Authorization', `Bearer ${hrToken}`)
        .send(matchData)
        .expect(201);

      expect(response.body).toHaveProperty('startDate');
      expect(response.body).toHaveProperty('endDate');
      expect(new Date(response.body.startDate)).toEqual(futureStartDate);
      expect(new Date(response.body.endDate)).toEqual(futureEndDate);
    });

    test('System validates start date format', async () => {
      const matchData = {
        receiverId: buddyUser.id,
        type: 'NEWCOMER_MATCH',
        startDate: 'invalid-date'
      };

      const response = await request(app)
        .post('/api/matches')
        .set('Authorization', `Bearer ${hrToken}`)
        .send(matchData)
        .expect(400);

      expect(response.body).toHaveProperty('errors');
    });
  });

  describe('Step 6: Authorization & Security', () => {
    test('Non-HR users cannot create matches', async () => {
      const matchData = {
        receiverId: buddyUser.id,
        type: 'NEWCOMER_MATCH',
        message: 'This should fail'
      };

      const response = await request(app)
        .post('/api/matches')
        .set('Authorization', `Bearer ${buddyToken}`)
        .send(matchData)
        .expect(403);

      expect(response.body).toHaveProperty('error', 'Insufficient permissions');
    });

    test('Non-buddy users cannot respond to matches', async () => {
      const match = await prisma.match.create({
        data: {
          senderId: hrUser.id,
          receiverId: buddyUser.id,
          type: 'NEWCOMER_MATCH',
          status: 'PENDING'
        }
      });

      const response = await request(app)
        .patch(`/api/matches/${match.id}/respond`)
        .set('Authorization', `Bearer ${newcomerToken}`)
        .send({ status: 'ACCEPTED' })
        .expect(403);

      expect(response.body).toHaveProperty('error', 'Insufficient permissions');
    });

    test('Unauthenticated users cannot access protected endpoints', async () => {
      await request(app)
        .get('/api/matches')
        .expect(401);

      await request(app)
        .post('/api/matches')
        .send({})
        .expect(401);

      await request(app)
        .get('/api/buddies/dashboard')
        .expect(401);
    });
  });

  describe('Step 7: Complete User Journey Integration', () => {
    test('Complete HR matching workflow from start to finish', async () => {
      // Clean up
      await prisma.match.deleteMany();
      await prisma.notification.deleteMany();

      // Step 1: HR views buddy dashboard
      const dashboardResponse = await request(app)
        .get('/api/buddies/dashboard')
        .set('Authorization', `Bearer ${hrToken}`)
        .expect(200);

      expect(dashboardResponse.body.length).toBeGreaterThan(0);

      // Step 2: HR searches for suitable buddy
      const searchResponse = await request(app)
        .get('/api/buddies?location=San Francisco&techStack=React')
        .set('Authorization', `Bearer ${hrToken}`)
        .expect(200);

      expect(searchResponse.body.length).toBeGreaterThan(0);
      const selectedBuddy = searchResponse.body[0];

      // Step 3: HR creates match
      const matchData = {
        receiverId: selectedBuddy.userId,
        type: 'NEWCOMER_MATCH',
        message: 'Welcome to the team! This buddy will help you get started.',
        startDate: '2024-01-15T00:00:00.000Z',
        endDate: '2024-04-15T00:00:00.000Z'
      };

      const createResponse = await request(app)
        .post('/api/matches')
        .set('Authorization', `Bearer ${hrToken}`)
        .send(matchData)
        .expect(201);

      const matchId = createResponse.body.id;

      // Step 4: Verify notification was created
      const notification = await prisma.notification.findFirst({
        where: { userId: selectedBuddy.userId }
      });
      expect(notification).toBeTruthy();

      // Step 5: Buddy accepts match
      const acceptResponse = await request(app)
        .patch(`/api/matches/${matchId}/respond`)
        .set('Authorization', `Bearer ${buddyToken}`)
        .send({ status: 'ACCEPTED', message: 'Happy to help Alex get started!' })
        .expect(200);

      expect(acceptResponse.body.status).toBe('ACCEPTED');

      // Step 6: Verify HR gets notification
      const hrNotification = await prisma.notification.findFirst({
        where: { userId: hrUser.id }
      });
      expect(hrNotification).toBeTruthy();

      // Step 7: HR can view confirmed match
      const matchesResponse = await request(app)
        .get('/api/matches')
        .set('Authorization', `Bearer ${hrToken}`)
        .expect(200);

      const confirmedMatch = matchesResponse.body.find((m: any) => m.id === matchId);
      expect(confirmedMatch).toBeTruthy();
      expect(confirmedMatch.status).toBe('ACCEPTED');
      expect(confirmedMatch.startDate).toBe(matchData.startDate);
      expect(confirmedMatch.endDate).toBe(matchData.endDate);
    });
  });
});
