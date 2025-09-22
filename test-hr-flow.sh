#!/bin/bash

echo "🧪 Testing HR Matching Flow - End-to-End Test"
echo "=============================================="

# Set environment variables
export JWT_SECRET="test-secret-key-for-testing"

# Function to test API endpoints
test_api_endpoints() {
    echo "📡 Testing API Endpoints..."
    echo "============================"
    
    # Start the backend in background
    echo "Starting backend server..."
    cd backend
    npm run dev &
    BACKEND_PID=$!
    
    # Wait for backend to start
    echo "Waiting for backend to start..."
    sleep 10
    
    # Test login endpoint
    echo "Testing login endpoint..."
    LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/login \
        -H "Content-Type: application/json" \
        -d '{"email": "hr@company.com", "password": "password123"}')
    
    if echo "$LOGIN_RESPONSE" | grep -q "token"; then
        echo "✅ Login successful"
        TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
        echo "Token: ${TOKEN:0:20}..."
    else
        echo "❌ Login failed"
        echo "Response: $LOGIN_RESPONSE"
        kill $BACKEND_PID
        exit 1
    fi
    
    # Test buddy dashboard endpoint
    echo "Testing buddy dashboard endpoint..."
    DASHBOARD_RESPONSE=$(curl -s -X GET http://localhost:3001/api/buddies/dashboard \
        -H "Authorization: Bearer $TOKEN")
    
    if echo "$DASHBOARD_RESPONSE" | grep -q "name"; then
        echo "✅ Buddy dashboard accessible"
        echo "Dashboard shows $(echo "$DASHBOARD_RESPONSE" | grep -o '"name"' | wc -l) buddies"
    else
        echo "❌ Buddy dashboard failed"
        echo "Response: $DASHBOARD_RESPONSE"
    fi
    
    # Test buddy listing endpoint
    echo "Testing buddy listing endpoint..."
    BUDDIES_RESPONSE=$(curl -s -X GET "http://localhost:3001/api/buddies?location=San Francisco" \
        -H "Authorization: Bearer $TOKEN")
    
    if echo "$BUDDIES_RESPONSE" | grep -q "location"; then
        echo "✅ Buddy listing with filters works"
        echo "Found $(echo "$BUDDIES_RESPONSE" | grep -o '"location"' | wc -l) buddies in San Francisco"
    else
        echo "❌ Buddy listing failed"
        echo "Response: $BUDDIES_RESPONSE"
    fi
    
    # Test match creation
    echo "Testing match creation..."
    MATCH_RESPONSE=$(curl -s -X POST http://localhost:3001/api/matches \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d '{
            "receiverId": "buddy-user-id",
            "type": "NEWCOMER_MATCH",
            "message": "Test match creation",
            "startDate": "2024-01-15T00:00:00.000Z",
            "endDate": "2024-04-15T00:00:00.000Z"
        }')
    
    if echo "$MATCH_RESPONSE" | grep -q "id"; then
        echo "✅ Match creation works"
        MATCH_ID=$(echo "$MATCH_RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
        echo "Created match: $MATCH_ID"
    else
        echo "❌ Match creation failed"
        echo "Response: $MATCH_RESPONSE"
    fi
    
    # Test match listing
    echo "Testing match listing..."
    MATCHES_RESPONSE=$(curl -s -X GET http://localhost:3001/api/matches \
        -H "Authorization: Bearer $TOKEN")
    
    if echo "$MATCHES_RESPONSE" | grep -q "senderId"; then
        echo "✅ Match listing works"
        echo "Found $(echo "$MATCHES_RESPONSE" | grep -o '"senderId"' | wc -l) matches"
    else
        echo "❌ Match listing failed"
        echo "Response: $MATCHES_RESPONSE"
    fi
    
    # Stop backend
    echo "Stopping backend server..."
    kill $BACKEND_PID
    wait $BACKEND_PID 2>/dev/null
}

# Function to test frontend
test_frontend() {
    echo "🎨 Testing Frontend..."
    echo "====================="
    
    # Start frontend in background
    echo "Starting frontend server..."
    cd ../frontend
    npm run dev &
    FRONTEND_PID=$!
    
    # Wait for frontend to start
    echo "Waiting for frontend to start..."
    sleep 15
    
    # Test if frontend is accessible
    echo "Testing frontend accessibility..."
    if curl -s http://localhost:5173 | grep -q "BuddyMatch"; then
        echo "✅ Frontend is accessible"
    else
        echo "❌ Frontend not accessible"
    fi
    
    # Stop frontend
    echo "Stopping frontend server..."
    kill $FRONTEND_PID
    wait $FRONTEND_PID 2>/dev/null
}

# Function to run integration test with docker-compose
test_integration() {
    echo "🔗 Running Integration Test..."
    echo "============================="
    
    # Start the application using docker-compose
    echo "Starting application with docker-compose..."
    docker-compose -f docker-compose.dev.yml up -d
    
    # Wait for services to be ready
    echo "Waiting for services to be ready..."
    sleep 30
    
    # Test if services are running
    echo "Testing service health..."
    
    # Test backend health
    if curl -s http://localhost:3001/api/auth/login | grep -q "error\|token"; then
        echo "✅ Backend is running"
    else
        echo "❌ Backend not responding"
    fi
    
    # Test frontend health
    if curl -s http://localhost:5173 | grep -q "BuddyMatch"; then
        echo "✅ Frontend is running"
    else
        echo "❌ Frontend not responding"
    fi
    
    # Test database connection by trying to seed
    echo "Testing database connection..."
    cd backend
    if npm run db:seed > /dev/null 2>&1; then
        echo "✅ Database connection works"
    else
        echo "❌ Database connection failed"
    fi
    cd ..
    
    # Stop the application
    echo "Stopping application..."
    docker-compose -f docker-compose.dev.yml down
}

# Main execution
case "${1:-all}" in
    "api")
        test_api_endpoints
        ;;
    "frontend")
        test_frontend
        ;;
    "integration")
        test_integration
        ;;
    "all"|*)
        test_integration
        ;;
esac

echo "✅ Test execution completed!"
