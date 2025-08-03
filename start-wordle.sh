#!/bin/bash

# Wordle Application Startup Script
# This script starts the Spring Boot backend, React frontend, and ngrok tunnel

echo "🎮 Starting Wordle Application Services..."
echo "======================================="

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command_exists mvn; then
    echo "❌ Maven not found. Please install Maven first."
    exit 1
fi

if ! command_exists npm; then
    echo "❌ npm not found. Please install Node.js and npm first."
    exit 1
fi

# if ! command_exists ngrok; then
#     echo "❌ ngrok not found. Please install ngrok first."
#     exit 1
# fi

echo "✅ All prerequisites found"

# Get the current directory (where the script is run from)
BASE_DIR=$(pwd)

# Check if required directories exist
if [ ! -d "$BASE_DIR/wordle-server" ]; then
    echo "❌ wordle-server directory not found in current directory: $BASE_DIR"
    echo "Please run this script from the wordle-game root directory."
    exit 1
fi

if [ ! -d "$BASE_DIR/wordle-client" ]; then
    echo "❌ wordle-client directory not found in current directory: $BASE_DIR"
    echo "Please run this script from the wordle-game root directory."
    exit 1
fi

# Function to cleanup processes on script exit
cleanup() {
    echo ""
    echo "🛑 Shutting down services..."
    
    # Kill background processes
    if [ ! -z "$SPRING_PID" ]; then
        echo "   Stopping Spring Boot server (PID: $SPRING_PID)..."
        kill $SPRING_PID 2>/dev/null
    fi
    
    if [ ! -z "$REACT_PID" ]; then
        echo "   Stopping React dev server (PID: $REACT_PID)..."
        kill $REACT_PID 2>/dev/null
    fi
    
    # if [ ! -z "$NGROK_PID" ]; then
    #     echo "   Stopping ngrok tunnel (PID: $NGROK_PID)..."
    #     kill $NGROK_PID 2>/dev/null
    # fi
    
    echo "✅ All services stopped"
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM EXIT

# Start Spring Boot backend
echo ""
cd "$BASE_DIR/wordle-server"
echo "📦 Installing Maven dependencies..."
mvn clean install
if [ $? -ne 0 ]; then
echo "❌ Maven install failed. Please check your pom.xml and try again."
exit 1
fi
echo "✅ Maven dependencies installed successfully"
echo "🚀 Starting Spring Boot server..."
mvn spring-boot:run > spring-boot.log 2>&1 &
SPRING_PID=$!
echo "   Spring Boot started (PID: $SPRING_PID)"
echo "   Logs: $BASE_DIR/wordle-server/spring-boot.log"

# Wait a bit for Spring Boot to start
echo "   Waiting for Spring Boot to initialize..."
sleep 10

# Start React frontend
echo ""
cd "$BASE_DIR/wordle-client"
echo "📦 Installing npm dependencies..."
npm install
if [ $? -ne 0 ]; then
echo "❌ npm install failed. Please check your package.json and try again."
exit 1
fi
echo "✅ npm dependencies installed successfully"
echo "⚛️  Starting React development server..."
npm run dev > react-dev.log 2>&1 &
REACT_PID=$!
echo "   React dev server started (PID: $REACT_PID)"
echo "   Logs: $BASE_DIR/wordle-client/react-dev.log"

# Wait a bit for React to start
echo "   Waiting for React dev server to initialize..."
sleep 5

### Start ngrok tunnel (This is only for me to create a public URL for you as a plan-b for the game.)
# echo ""
# echo "🌐 Starting ngrok tunnel..."
# ngrok http --url=select-woodcock-lately.ngrok-free.app 3000 > ngrok.log 2>&1 &
# NGROK_PID=$!
# echo "   ngrok tunnel started (PID: $NGROK_PID)"
# echo "   Logs: $BASE_DIR/wordle-client/ngrok.log"

# Display service information
echo ""
echo "🎉 All services started successfully!"
echo "======================================="
echo "📱 Local React App:     http://localhost:3000"
#echo "🔗 Public ngrok URL:    https://select-woodcock-lately.ngrok-free.app"
echo "🖥️  Spring Boot API:    http://localhost:8080"
echo "📊 API Test:           http://localhost:8080/api/wordle"
echo ""
echo "📋 Service Status:"
echo "   Spring Boot PID: $SPRING_PID"
echo "   React Dev PID:   $REACT_PID"
#echo "   ngrok PID:       $NGROK_PID"
echo ""
echo "💡 Tips:"
echo "   - Press Ctrl+C to stop all services"
echo "   - Check logs in respective directories if services fail"
echo "   - Make sure ports 3000 and 8080 are available"
echo ""
echo "🔄 Services are running... Press Ctrl+C to stop"

# Keep script running and wait for user interrupt
while true; do
    sleep 1
done

