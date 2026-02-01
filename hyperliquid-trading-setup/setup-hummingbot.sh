#!/bin/bash
# Hyperliquid Paper Trading Setup Script
# This script sets up two Hummingbot instances for testnet trading

set -e  # Exit on any error

echo "=========================================="
echo "Hyperliquid Trading Bot Setup"
echo "=========================================="
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
    echo -e "${YELLOW}WARNING: Running as root. This script is designed for regular user.${NC}"
    echo "Please run without sudo for better Docker permissions."
    echo ""
fi

# Function to check and install Docker
check_docker() {
    echo "Checking Docker installation..."
    
    if command -v docker &> /dev/null; then
        echo -e "${GREEN}✓ Docker is already installed${NC}"
        docker --version
        echo ""
        return 0
    fi
    
    echo -e "${YELLOW}Docker not found. Installing Docker...${NC}"
    
    # Update package index
    sudo apt-get update
    
    # Install dependencies
    sudo apt-get install -y \
        ca-certificates \
        curl \
        gnupg \
        lsb-release
    
    # Add Docker's official GPG key
    sudo mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    
    # Set up Docker repository
    echo \
        "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
        $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Install Docker Engine
    sudo apt-get update
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    
    # Add current user to docker group
    echo -e "${YELLOW}Adding user to docker group...${NC}"
    sudo usermod -aG docker $USER
    
    echo -e "${GREEN}✓ Docker installed successfully${NC}"
    echo ""
    echo -e "${YELLOW}IMPORTANT: Log out and back in for docker group changes to take effect${NC}"
    echo ""
}

# Function to pull Hummingbot image
pull_hummingbot() {
    echo "Pulling Hummingbot Docker image..."
    echo "This may take a few minutes on first run..."
    echo ""
    
    docker pull hummingbot/hummingbot:latest
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Hummingbot image pulled successfully${NC}"
    else
        echo -e "${RED}✗ Failed to pull Hummingbot image${NC}"
        exit 1
    fi
    echo ""
}

# Function to create volumes and directories
setup_volumes() {
    echo "Setting up Hummingbot volumes..."
    
    # Create data directories for both instances
    mkdir -p hummingbot-funding-arb/conf
    mkdir -p hummingbot-funding-arb/logs
    mkdir -p hummingbot-funding-arb/data
    
    mkdir -p hummingbot-meme-grid/conf
    mkdir -p hummingbot-meme-grid/logs
    mkdir -p hummingbot-meme-grid/data
    
    echo -e "${GREEN}✓ Volume directories created${NC}"
    echo ""
}

# Function to copy config files
setup_configs() {
    echo "Setting up configuration files..."
    
    # Copy .env files
    if [ -f "funding-arb.env" ]; then
        cp funding-arb.env hummingbot-funding-arb/.env
        echo -e "${GREEN}✓ Funding Arb .env copied${NC}"
    else
        echo -e "${YELLOW}⚠ funding-arb.env not found, will create placeholder${NC}"
        touch hummingbot-funding-arb/.env
    fi
    
    if [ -f "meme-grid.env" ]; then
        cp meme-grid.env hummingbot-meme-grid/.env
        echo -e "${GREEN}✓ Meme Grid .env copied${NC}"
    else
        echo -e "${YELLOW}⚠ meme-grid.env not found, will create placeholder${NC}"
        touch hummingbot-meme-grid/.env
    fi
    
    # Copy strategy configs
    mkdir -p hummingbot-funding-arb/conf/strategies
    mkdir -p hummingbot-meme-grid/conf/strategies
    
    if [ -f "funding_arb_config.yml" ]; then
        cp funding_arb_config.yml hummingbot-funding-arb/conf/strategies/
        echo -e "${GREEN}✓ Funding Arb strategy config copied${NC}"
    fi
    
    if [ -f "meme_grid_config.yml" ]; then
        cp meme_grid_config.yml hummingbot-meme-grid/conf/strategies/
        echo -e "${GREEN}✓ Meme Grid strategy config copied${NC}"
    fi
    
    echo ""
}

# Function to create Docker Compose file
create_docker_compose() {
    echo "Creating Docker Compose configuration..."
    
    cat > docker-compose.yml <<'EOF'
version: '3.8'

services:
  hummingbot-funding-arb:
    image: hummingbot/hummingbot:latest
    container_name: hummingbot-funding-arb
    volumes:
      - ./hummingbot-funding-arb/conf:/home/hummingbot/hummingbot_files/conf
      - ./hummingbot-funding-arb/logs:/home/hummingbot/hummingbot_files/logs
      - ./hummingbot-funding-arb/data:/home/hummingbot/hummingbot_files/data
    environment:
      - CONFIG_FILE=strategies/funding_arb_config.yml
    stdin_open: true
    tty: true
    network_mode: host
    restart: unless-stopped
    command: /bin/bash -c "source activate && hummingbot"

  hummingbot-meme-grid:
    image: hummingbot/hummingbot:latest
    container_name: hummingbot-meme-grid
    volumes:
      - ./hummingbot-meme-grid/conf:/home/hummingbot/hummingbot_files/conf
      - ./hummingbot-meme-grid/logs:/home/hummingbot/hummingbot_files/logs
      - ./hummingbot-meme-grid/data:/home/hummingbot/hummingbot_files/data
    environment:
      - CONFIG_FILE=strategies/meme_grid_config.yml
    stdin_open: true
    tty: true
    network_mode: host
    restart: unless-stopped
    command: /bin/bash -c "source activate && hummingbot"

EOF

    echo -e "${GREEN}✓ Docker Compose file created${NC}"
    echo ""
}

# Function to create helper scripts
create_helper_scripts() {
    echo "Creating helper scripts..."
    
    # Start script
    cat > start-bots.sh <<'EOF'
#!/bin/bash
# Start both trading bots

echo "Starting Hummingbot containers..."
docker-compose up -d

echo ""
echo "Bot containers started!"
echo ""
echo "To attach to Funding Arb bot:"
echo "  docker attach hummingbot-funding-arb"
echo ""
echo "To attach to Meme Grid bot:"
echo "  docker attach hummingbot-meme-grid"
echo ""
echo "Press Ctrl+P then Ctrl+Q to detach without stopping the container"
EOF
    chmod +x start-bots.sh
    
    # Stop script
    cat > stop-bots.sh <<'EOF'
#!/bin/bash
# Stop both trading bots

echo "Stopping Hummingbot containers..."
docker-compose stop

echo "Bots stopped."
echo "Use ./start-bots.sh to restart them."
EOF
    chmod +x stop-bots.sh
    
    # Status script
    cat > check-status.sh <<'EOF'
#!/bin/bash
# Check status of both bots

echo "========================================"
echo "Hummingbot Status"
echo "========================================"
echo ""

echo "Funding Arb Bot:"
docker ps -a | grep hummingbot-funding-arb || echo "  Container not found"
echo ""

echo "Meme Grid Bot:"
docker ps -a | grep hummingbot-meme-grid || echo "  Container not found"
echo ""

echo "Recent Logs - Funding Arb:"
docker logs --tail 10 hummingbot-funding-arb 2>&1 || echo "  No logs available"
echo ""

echo "Recent Logs - Meme Grid:"
docker logs --tail 10 hummingbot-meme-grid 2>&1 || echo "  No logs available"
EOF
    chmod +x check-status.sh
    
    # View logs script
    cat > view-logs.sh <<'EOF'
#!/bin/bash
# View logs from a specific bot

if [ -z "$1" ]; then
    echo "Usage: ./view-logs.sh [funding|meme] [tail|follow]"
    echo "Example: ./view-logs.sh funding tail"
    echo "         ./view-logs.sh meme follow"
    exit 1
fi

BOT=$1
MODE=${2:-tail}

case $BOT in
    funding)
        CONTAINER="hummingbot-funding-arb"
        ;;
    meme)
        CONTAINER="hummingbot-meme-grid"
        ;;
    *)
        echo "Invalid bot name. Use 'funding' or 'meme'"
        exit 1
esac

case $MODE in
    tail)
        docker logs --tail 50 "$CONTAINER"
        ;;
    follow)
        docker logs -f "$CONTAINER"
        ;;
    *)
        echo "Invalid mode. Use 'tail' or 'follow'"
        exit 1
esac
EOF
    chmod +x view-logs.sh
    
    echo -e "${GREEN}✓ Helper scripts created${NC}"
    echo ""
}

# Function to display next steps
show_next_steps() {
    echo "=========================================="
    echo "Setup Complete!"
    echo "=========================================="
    echo ""
    echo -e "${GREEN}✓ Docker installed${NC}"
    echo -e "${GREEN}✓ Hummingbot image pulled${NC}"
    echo -e "${GREEN}✓ Volumes configured${NC}"
    echo -e "${GREEN}✓ Helper scripts created${NC}"
    echo ""
    echo "=========================================="
    echo "NEXT STEPS:"
    echo "=========================================="
    echo ""
    echo "1. Edit the .env files with your credentials:"
    echo "   - hummingbot-funding-arb/.env"
    echo "   - hummingbot-meme-grid/.env"
    echo ""
    echo "2. Review strategy configs:"
    echo "   - funding_arb_config.yml"
    echo "   - meme_grid_config.yml"
    echo ""
    echo "3. Start the bots:"
    echo "   ./start-bots.sh"
    echo ""
    echo "4. Check status:"
    echo "   ./check-status.sh"
    echo ""
    echo "5. View logs:"
    echo "   ./view-logs.sh funding tail"
    echo "   ./view-logs.sh meme follow"
    echo ""
    echo "=========================================="
    echo "IMPORTANT - READ README.md!"
    echo "=========================================="
    echo ""
}

# Main execution
main() {
    check_docker
    pull_hummingbot
    setup_volumes
    setup_configs
    create_docker_compose
    create_helper_scripts
    show_next_steps
}

# Run main function
main
