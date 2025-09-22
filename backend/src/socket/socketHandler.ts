import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
}

export const initializeSocket = (io: Server) => {
  // Authentication middleware for Socket.io
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      
      // Verify user exists and is active
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, role: true, isActive: true }
      });

      if (!user || !user.isActive) {
        return next(new Error('Invalid user'));
      }

      socket.userId = user.id;
      socket.userRole = user.role;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`User ${socket.userId} connected`);

    // Join user to their personal room
    socket.join(`user:${socket.userId}`);

    // Join match rooms for real-time messaging
    socket.on('join-match', async (matchId: string) => {
      try {
        // Verify user has access to this match
        const match = await prisma.match.findFirst({
          where: {
            id: matchId,
            OR: [
              { senderId: socket.userId },
              { receiverId: socket.userId }
            ]
          }
        });

        if (match) {
          socket.join(`match:${matchId}`);
          console.log(`User ${socket.userId} joined match ${matchId}`);
        }
      } catch (error) {
        console.error('Error joining match:', error);
      }
    });

    // Leave match room
    socket.on('leave-match', (matchId: string) => {
      socket.leave(`match:${matchId}`);
      console.log(`User ${socket.userId} left match ${matchId}`);
    });

    // Handle new message
    socket.on('new-message', async (data: { matchId: string; content: string }) => {
      try {
        const { matchId, content } = data;

        // Verify user has access to this match
        const match = await prisma.match.findFirst({
          where: {
            id: matchId,
            OR: [
              { senderId: socket.userId },
              { receiverId: socket.userId }
            ],
            status: 'ACCEPTED'
          }
        });

        if (!match) {
          return;
        }

        // Create message in database
        const message = await prisma.message.create({
          data: {
            matchId,
            senderId: socket.userId!,
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

        // Emit message to all users in the match room
        io.to(`match:${matchId}`).emit('message-received', message);

        // Create notification for the other user
        const otherUserId = match.senderId === socket.userId ? match.receiverId : match.senderId;
        
        await prisma.notification.create({
          data: {
            userId: otherUserId,
            title: 'New Message',
            message: `You have a new message from ${message.sender.firstName} ${message.sender.lastName}`,
            type: 'MESSAGE'
          }
        });

        // Emit notification to the other user
        io.to(`user:${otherUserId}`).emit('notification', {
          title: 'New Message',
          message: `You have a new message from ${message.sender.firstName} ${message.sender.lastName}`,
          type: 'MESSAGE'
        });

      } catch (error) {
        console.error('Error handling new message:', error);
      }
    });

    // Handle typing indicators
    socket.on('typing-start', (matchId: string) => {
      socket.to(`match:${matchId}`).emit('user-typing', {
        userId: socket.userId,
        isTyping: true
      });
    });

    socket.on('typing-stop', (matchId: string) => {
      socket.to(`match:${matchId}`).emit('user-typing', {
        userId: socket.userId,
        isTyping: false
      });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`User ${socket.userId} disconnected`);
    });
  });
};
