#!/bin/bash

echo "🧪 Starting BuddyMatch HR Matching Flow Tests"
echo "=============================================="

# Set environment variables
export JWT_SECRET="test-secret-key-for-testing"
export DATABASE_URL="postgresql://test:test@localhost:5432/buddymatch_test"

# Function to run backend tests
run_backend_tests() {
    echo "📦 Running Backend API Tests..."
    echo "================================"
    
    cd backend
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        echo "Installing backend dependencies..."
        npm install
    fi
    
    # Run tests
    echo "Running Jest tests..."
    npm test -- --verbose
    
    cd ..
}

# Function to run frontend tests
run_frontend_tests() {
    echo "🎨 Running Frontend UI Tests..."
    echo "==============================="
    
    cd frontend
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        echo "Installing frontend dependencies..."
        npm install
    fi
    
    # Install Playwright browsers if needed
    echo "Installing Playwright browsers..."
    npx playwright install
    
    # Run tests
    echo "Running Playwright tests..."
    npm test
    
    cd ..
}

# Function to run integration tests
run_integration_tests() {
    echo "🔗 Running Integration Tests..."
    echo "=============================="
    
    # Start the application using docker-compose
    echo "Starting application with docker-compose..."
    docker-compose -f docker-compose.dev.yml up -d
    
    # Wait for services to be ready
    echo "Waiting for services to be ready..."
    sleep 30
    
    # Run backend tests
    run_backend_tests
    
    # Run frontend tests
    run_frontend_tests
    
    # Stop the application
    echo "Stopping application..."
    docker-compose -f docker-compose.dev.yml down
}

# Main execution
case "${1:-all}" in
    "backend")
        run_backend_tests
        ;;
    "frontend")
        run_frontend_tests
        ;;
    "integration")
        run_integration_tests
        ;;
    "all"|*)
        run_integration_tests
        ;;
esac

echo "✅ Test execution completed!"
