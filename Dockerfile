# Multi-stage build for production
FROM node:18-alpine as base

# Backend stage
FROM base as backend
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci --only=production
COPY backend/ .
RUN npm run build

# Frontend stage
FROM base as frontend
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci --only=production
COPY frontend/ .
RUN npm run build

# Production stage
FROM base as production
WORKDIR /app
COPY --from=backend /app/dist ./backend
COPY --from=frontend /app/dist ./frontend
COPY --from=backend /app/node_modules ./backend/node_modules
RUN npm install -g serve
EXPOSE 3000
CMD ["serve", "-s", "frontend", "-l", "3000"]
