import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

beforeAll(async () => {
  // Clean up database before tests
  await prisma.notification.deleteMany();
  await prisma.match.deleteMany();
  await prisma.buddyProfile.deleteMany();
  await prisma.userProfile.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

afterEach(async () => {
  // Clean up after each test
  await prisma.notification.deleteMany();
  await prisma.match.deleteMany();
  await prisma.buddyProfile.deleteMany();
  await prisma.userProfile.deleteMany();
  await prisma.user.deleteMany();
});

// This file is just for setup, not a test file
export {};
