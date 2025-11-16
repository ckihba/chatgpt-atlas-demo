#!/bin/bash
set -e

echo "=== ChatGPT Atlas Desktop Startup ==="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check Python environment
echo -e "${YELLOW}Checking Python environment...${NC}"
if [ ! -d ".venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv .venv
fi

source .venv/bin/activate || source .venv/Scripts/activate

echo "Installing Python dependencies..."
pip install -q -r requirements.txt

echo -e "${GREEN}✓ Python environment ready${NC}"

# Check Node environment
echo -e "${YELLOW}Checking Node.js environment...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js not found. Please install Node.js 14+ from https://nodejs.org/${NC}"
    exit 1
fi

NODE_VERSION=$(node -v)
echo "Found Node.js $NODE_VERSION"

cd electron_app

if [ ! -d "node_modules" ]; then
    echo "Installing Node dependencies..."
    npm install
else
    echo "Node dependencies already installed"
fi

echo -e "${GREEN}✓ Node.js environment ready${NC}"

# Check if Python bridge is running
echo -e "${YELLOW}Checking if Python bridge is running...${NC}"
if ! nc -z 127.0.0.1 8000 2>/dev/null; then
    echo -e "${YELLOW}Starting Python bridge in background...${NC}"
    cd ..
    python agent_bridge.py > /tmp/atlas_bridge.log 2>&1 &
    BRIDGE_PID=$!
    echo "Bridge started (PID: $BRIDGE_PID)"
    sleep 2
    
    # Verify bridge is running
    if ! nc -z 127.0.0.1 8000 2>/dev/null; then
        echo -e "${RED}✗ Failed to start Python bridge. Check /tmp/atlas_bridge.log${NC}"
        exit 1
    fi
    cd electron_app
else
    echo -e "${GREEN}✓ Python bridge already running on localhost:8000${NC}"
fi

echo -e "${GREEN}=== Starting Electron App ===${NC}"
npm start
