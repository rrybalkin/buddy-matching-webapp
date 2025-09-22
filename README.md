# BuddyMatch 🚀

A comprehensive web application designed to help HR and veteran employees coordinate buddy matches for newcomers, supporting onboarding and integration while ensuring fair distribution of buddy responsibilities.

## 🌟 Features

### Core Features
- **Buddy Profile Creation**: Veteran employees can volunteer by creating detailed profiles with location, unit, tech stack, and personal interests
- **HR-Driven Matching Workflow**: HR initiates buddy matches before newcomers' start dates
- **Smart Matching System**: Veterans can accept/reject match requests with load balancing
- **Advanced Search & Filter**: Filter buddy profiles by location, unit, tech stack, and interests
- **Real-time Messaging**: Integrated chat system for matched buddies and newcomers
- **Scheduling Support**: Optional intro meeting scheduling

### Additional Features
- **Relocation Buddy Support**: Help relocated employees settle into new offices
- **Office Buddy Support**: Connect existing employees who feel disconnected
- **Comprehensive Feedback System**: Post-match feedback to improve the program
- **Buddy Load Dashboard**: HR monitoring of buddy distribution and availability
- **Real-time Notifications**: Instant updates for matches, messages, and requests
- **Role-based Access Control**: Different interfaces for HR, Buddies, Newcomers, and other roles

## 🏗️ Architecture

### Tech Stack
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS + React Query
- **Backend**: Node.js + Express + TypeScript + Prisma + PostgreSQL
- **Authentication**: JWT + bcrypt
- **Real-time**: Socket.io for messaging
- **Database**: PostgreSQL with Prisma ORM
- **Deployment**: Docker + Docker Compose

### Project Structure
```
BuddyMatch/
├── backend/                 # Node.js/Express API
│   ├── src/
│   │   ├── routes/         # API route handlers
│   │   ├── middleware/     # Authentication & error handling
│   │   ├── socket/         # Socket.io real-time handlers
│   │   └── index.ts        # Server entry point
│   ├── prisma/             # Database schema & migrations
│   └── package.json
├── frontend/               # React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── contexts/       # React contexts
│   │   ├── hooks/          # Custom hooks
│   │   └── lib/            # Utilities & API client
│   └── package.json
├── docker-compose.yml      # Development environment
├── Dockerfile             # Production build
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Docker & Docker Compose
- Git

### Option 1: Docker Development (Recommended)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd BuddyMatch
   ```

2. **Start the development environment**
   ```bash
   docker-compose -f docker-compose.dev.yml up -d
   ```

3. **Set up the database**
   ```bash
   # Wait for services to start, then run:
   docker-compose -f docker-compose.dev.yml exec backend npm run db:setup
   docker-compose -f docker-compose.dev.yml exec backend npm run db:seed
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - Database: localhost:5432

### Option 2: Local Development

1. **Clone and install dependencies**
   ```bash
   git clone <repository-url>
   cd BuddyMatch
   npm run install:all
   ```

2. **Set up environment variables**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

3. **Start PostgreSQL and Redis**
   ```bash
   # Using Docker for databases
   docker-compose up postgres redis -d
   ```

4. **Set up the database**
   ```bash
   cd backend
   npm run db:setup
   npm run db:seed
   ```

5. **Start development servers**
   ```bash
   # From project root
   npm run dev
   ```

## 🧪 Test Accounts

The application comes with pre-seeded test accounts:

| Role | Email | Password | Description |
|------|-------|----------|-------------|
| HR | hr@company.com | password123 | HR Manager with full access |
| Buddy | john.doe@company.com | password123 | Senior Software Engineer |
| Buddy | jane.smith@company.com | password123 | Product Manager |
| Buddy | mike.wilson@company.com | password123 | UX Designer |
| Newcomer | alex.newcomer@company.com | password123 | Junior Developer |
| Relocated | relocated@company.com | password123 | Recently relocated employee |
| Existing | existing@company.com | password123 | Employee seeking connection |

## 📱 User Roles & Features

### HR Manager
- Create and manage buddy matches
- Filter and search buddy profiles
- Monitor buddy load distribution
- View feedback and analytics
- Manage user accounts

### Buddy (Volunteer)
- Create detailed buddy profiles
- Accept/reject match requests
- Manage availability and capacity
- Chat with matched newcomers
- Provide feedback

### Newcomer
- View assigned buddy information
- Chat with assigned buddy
- Provide feedback after match period
- Update profile information

### Relocated Employee
- Request relocation support buddy
- Connect with local team members
- Access location-specific resources

### Existing Employee
- Request office connection buddy
- Find team members with similar interests
- Improve workplace integration

## 🔧 Development

### Backend Development

```bash
cd backend

# Install dependencies
npm install

# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

# Seed database with test data
npm run db:seed

# Start development server
npm run dev

# Open Prisma Studio
npm run db:studio
```

### Frontend Development

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Database Management

```bash
# Create new migration
cd backend
npx prisma migrate dev --name migration_name

# Reset database
npx prisma migrate reset

# Deploy migrations to production
npx prisma migrate deploy
```

## 🐳 Production Deployment

### Using Docker

1. **Build the application**
   ```bash
   docker build -t buddy-match .
   ```

2. **Run with Docker Compose**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

### Environment Variables

Create a `.env` file with the following variables:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/buddymatch"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-in-production"

# Environment
NODE_ENV="production"

# Frontend
VITE_API_URL="https://your-api-domain.com"
```

## 📊 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Buddy Management
- `GET /api/buddies` - List buddy profiles with filters
- `POST /api/buddies` - Create buddy profile
- `PUT /api/buddies/:id` - Update buddy profile
- `GET /api/buddies/dashboard` - HR buddy load dashboard

### Match Management
- `POST /api/matches` - Create buddy match (HR only)
- `GET /api/matches` - Get user's matches
- `PATCH /api/matches/:id/respond` - Accept/reject match

### Messaging
- `GET /api/messages/match/:matchId` - Get match messages
- `POST /api/messages` - Send message
- `PATCH /api/messages/read` - Mark messages as read

### Feedback
- `POST /api/feedback` - Submit match feedback
- `GET /api/feedback/match/:matchId` - Get match feedback
- `GET /api/feedback/stats` - Feedback statistics (HR only)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## 🔮 Future Enhancements

- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard
- [ ] Integration with HR systems
- [ ] Video call scheduling
- [ ] Multi-language support
- [ ] Advanced matching algorithms
- [ ] Calendar integration
- [ ] Email notifications
- [ ] Admin panel for system management

---

**Built with ❤️ for better workplace connections**
