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

describe('HR Matching Flow - Integration Test', () => {
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

    // Create test users
    const hrPassword = await bcrypt.hash('password123', 12);
    hrUser = await prisma.user.create({
      data: {
        email: 'hr@integration-test.com',
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

    const buddyPassword = await bcrypt.hash('password123', 12);
    buddyUser = await prisma.user.create({
      data: {
        email: 'buddy@integration-test.com',
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

    const newcomerPassword = await bcrypt.hash('password123', 12);
    newcomerUser = await prisma.user.create({
      data: {
        email: 'newcomer@integration-test.com',
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

  test('Complete HR matching workflow from start to finish', async () => {
    // Step 1: HR logs in and views dashboard
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'hr@integration-test.com',
        password: 'password123'
      })
      .expect(200);

    expect(loginResponse.body).toHaveProperty('token');
    expect(loginResponse.body.user.role).toBe('HR');

    // Step 2: HR views buddy dashboard
    const dashboardResponse = await request(app)
      .get('/api/buddies/dashboard')
      .set('Authorization', `Bearer ${hrToken}`)
      .expect(200);

    expect(dashboardResponse.body).toBeInstanceOf(Array);
    expect(dashboardResponse.body.length).toBeGreaterThan(0);
    
    const buddy = dashboardResponse.body[0];
    expect(buddy).toHaveProperty('name');
    expect(buddy).toHaveProperty('currentBuddies');
    expect(buddy).toHaveProperty('maxBuddies');
    expect(buddy).toHaveProperty('utilizationRate');

    // Step 3: HR searches for suitable buddy
    const searchResponse = await request(app)
      .get('/api/buddies?location=San Francisco&techStack=React,Node.js')
      .set('Authorization', `Bearer ${hrToken}`)
      .expect(200);

    expect(searchResponse.body).toBeInstanceOf(Array);
    expect(searchResponse.body.length).toBeGreaterThan(0);
    
    const selectedBuddy = searchResponse.body[0];
    expect(selectedBuddy.location).toContain('San Francisco');
    expect(selectedBuddy.techStack).toContain('React');

    // Step 4: HR creates match for newcomer
    const matchData = {
      receiverId: selectedBuddy.userId,
      type: 'NEWCOMER_MATCH',
      message: 'Welcome to the team! John will be your buddy and help you get started.',
      startDate: '2024-01-15T00:00:00.000Z',
      endDate: '2024-04-15T00:00:00.000Z'
    };

    const createMatchResponse = await request(app)
      .post('/api/matches')
      .set('Authorization', `Bearer ${hrToken}`)
      .send(matchData)
      .expect(201);

    expect(createMatchResponse.body).toHaveProperty('id');
    expect(createMatchResponse.body).toHaveProperty('senderId', hrUser.id);
    expect(createMatchResponse.body).toHaveProperty('receiverId', selectedBuddy.userId);
    expect(createMatchResponse.body).toHaveProperty('type', 'NEWCOMER_MATCH');
    expect(createMatchResponse.body).toHaveProperty('status', 'PENDING');
    expect(createMatchResponse.body).toHaveProperty('message', matchData.message);
    expect(createMatchResponse.body).toHaveProperty('startDate');
    expect(createMatchResponse.body).toHaveProperty('endDate');

    const matchId = createMatchResponse.body.id;

    // Step 5: Verify notification was created for buddy
    const notification = await prisma.notification.findFirst({
      where: { userId: selectedBuddy.userId }
    });

    expect(notification).toBeTruthy();
    expect(notification?.title).toBe('New Buddy Match Request');
    expect(notification?.type).toBe('MATCH_REQUEST');
    expect(notification?.message).toContain('newcomer match request');

    // Step 6: Buddy logs in and views their matches
    const buddyLoginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'buddy@integration-test.com',
        password: 'password123'
      })
      .expect(200);

    expect(buddyLoginResponse.body.user.role).toBe('BUDDY');

    const buddyMatchesResponse = await request(app)
      .get('/api/matches')
      .set('Authorization', `Bearer ${buddyToken}`)
      .expect(200);

    expect(buddyMatchesResponse.body).toBeInstanceOf(Array);
    expect(buddyMatchesResponse.body.length).toBe(1);
    
    const receivedMatch = buddyMatchesResponse.body[0];
    expect(receivedMatch).toHaveProperty('id', matchId);
    expect(receivedMatch).toHaveProperty('senderId', hrUser.id);
    expect(receivedMatch).toHaveProperty('receiverId', selectedBuddy.userId);
    expect(receivedMatch).toHaveProperty('status', 'PENDING');

    // Step 7: Buddy accepts the match
    const acceptResponse = await request(app)
      .patch(`/api/matches/${matchId}/respond`)
      .set('Authorization', `Bearer ${buddyToken}`)
      .send({ 
        status: 'ACCEPTED', 
        message: 'Happy to help Alex get started! Looking forward to working together.' 
      })
      .expect(200);

    expect(acceptResponse.body).toHaveProperty('status', 'ACCEPTED');
    expect(acceptResponse.body).toHaveProperty('respondedAt');

    // Step 8: Verify HR gets notification about acceptance
    const hrNotification = await prisma.notification.findFirst({
      where: { userId: hrUser.id }
    });

    expect(hrNotification).toBeTruthy();
    expect(hrNotification?.title).toBe('Match ACCEPTED');
    expect(hrNotification?.type).toBe('MATCH_RESPONSE');
    expect(hrNotification?.message).toContain('accepted');

    // Step 9: HR views updated match status
    const updatedMatchesResponse = await request(app)
      .get('/api/matches')
      .set('Authorization', `Bearer ${hrToken}`)
      .expect(200);

    const updatedMatch = updatedMatchesResponse.body.find((m: any) => m.id === matchId);
    expect(updatedMatch).toBeTruthy();
    expect(updatedMatch.status).toBe('ACCEPTED');
    expect(updatedMatch.respondedAt).toBeTruthy();

    // Step 10: Verify buddy capacity is updated
    const updatedDashboardResponse = await request(app)
      .get('/api/buddies/dashboard')
      .set('Authorization', `Bearer ${hrToken}`)
      .expect(200);

    const updatedBuddy = updatedDashboardResponse.body.find((b: any) => b.id === selectedBuddy.id);
    expect(updatedBuddy).toBeTruthy();
    expect(updatedBuddy.currentBuddies).toBe(1);
    expect(updatedBuddy.utilizationRate).toBe(33.33); // 1/3 * 100

    // Step 11: Test that newcomer can view their assigned buddy (if they had access)
    // This would require additional API endpoints for newcomers to view their matches
    // For now, we'll verify the match exists in the database
    const finalMatch = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        sender: true,
        receiver: true
      }
    });

    expect(finalMatch).toBeTruthy();
    expect(finalMatch?.status).toBe('ACCEPTED');
    expect(finalMatch?.senderId).toBe(hrUser.id);
    expect(finalMatch?.receiverId).toBe(selectedBuddy.userId);
    expect(finalMatch?.startDate).toEqual(new Date('2024-01-15T00:00:00.000Z'));
    expect(finalMatch?.endDate).toEqual(new Date('2024-04-15T00:00:00.000Z'));
  });

  test('Error handling in HR matching workflow', async () => {
    // Test creating match with invalid data
    const invalidMatchData = {
      receiverId: 'invalid-id',
      type: 'INVALID_TYPE',
      message: 'This should fail'
    };

    const response = await request(app)
      .post('/api/matches')
      .set('Authorization', `Bearer ${hrToken}`)
      .send(invalidMatchData)
      .expect(400);

    expect(response.body).toHaveProperty('errors');

    // Test creating match for non-buddy user
    const nonBuddyMatchData = {
      receiverId: newcomerUser.id,
      type: 'NEWCOMER_MATCH',
      message: 'This should fail'
    };

    const nonBuddyResponse = await request(app)
      .post('/api/matches')
      .set('Authorization', `Bearer ${hrToken}`)
      .send(nonBuddyMatchData)
      .expect(400);

    expect(nonBuddyResponse.body).toHaveProperty('error', 'Receiver must be a buddy');

    // Test unauthorized access
    const unauthorizedResponse = await request(app)
      .post('/api/matches')
      .set('Authorization', `Bearer ${buddyToken}`)
      .send({
        receiverId: buddyUser.id,
        type: 'NEWCOMER_MATCH',
        message: 'This should fail'
      })
      .expect(403);

    expect(unauthorizedResponse.body).toHaveProperty('error', 'Insufficient permissions');
  });

  test('Buddy capacity management', async () => {
    // Fill buddy to capacity
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

    // Try to create another match - should fail
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

    // Verify dashboard shows correct utilization
    const dashboardResponse = await request(app)
      .get('/api/buddies/dashboard')
      .set('Authorization', `Bearer ${hrToken}`)
      .expect(200);

    const buddy = dashboardResponse.body.find((b: any) => b.id === buddyUser.id);
    expect(buddy).toBeTruthy();
    expect(buddy.currentBuddies).toBe(3);
    expect(buddy.utilizationRate).toBe(100);
  });

  test('Pre-start date matching functionality', async () => {
    // Clean up previous matches
    await prisma.match.deleteMany();

    const futureStartDate = new Date('2024-01-15T00:00:00.000Z');
    const futureEndDate = new Date('2024-04-15T00:00:00.000Z');

    const matchData = {
      receiverId: buddyUser.id,
      type: 'NEWCOMER_MATCH',
      message: 'Pre-start date match for Alex - starting February 1st',
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

    // Verify the match is created with correct dates
    const match = await prisma.match.findUnique({
      where: { id: response.body.id }
    });

    expect(match).toBeTruthy();
    expect(match?.startDate).toEqual(futureStartDate);
    expect(match?.endDate).toEqual(futureEndDate);
  });
});
