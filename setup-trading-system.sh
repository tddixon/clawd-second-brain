#!/bin/bash
# setup-trading-system.sh
# One-command setup script for the self-hosted trading system

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Self-Hosted Trading System Setup     ${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
   echo -e "${RED}Please do not run as root${NC}"
   exit 1
fi

# Detect OS
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$NAME
else
    echo -e "${RED}Cannot detect OS${NC}"
    exit 1
fi

echo -e "${YELLOW}Detected OS: $OS${NC}"

# Function to install Docker on Ubuntu/Debian
install_docker_debian() {
    echo -e "${YELLOW}Installing Docker...${NC}"
    sudo apt-get update
    sudo apt-get install -y \
        apt-transport-https \
        ca-certificates \
        curl \
        gnupg \
        lsb-release
    
    sudo mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    
    echo \
        "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
        $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    sudo apt-get update
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    sudo usermod -aG docker $USER
    echo -e "${GREEN}Docker installed successfully!${NC}"
}

# Check Docker
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}Docker not found. Installing...${NC}"
    if [[ "$OS" == *"Ubuntu"* ]] || [[ "$OS" == *"Debian"* ]]; then
        install_docker_debian
    else
        echo -e "${RED}Please install Docker manually for $OS${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}Docker is already installed${NC}"
fi

# Check Docker Compose
if ! docker compose version &> /dev/null; then
    echo -e "${RED}Docker Compose not found. Please install it.${NC}"
    exit 1
fi

echo -e "${GREEN}Docker Compose is available${NC}"

# Check system resources
echo ""
echo -e "${YELLOW}Checking system resources...${NC}"

MEMORY_GB=$(free -g | awk '/^Mem:/{print $2}')
DISK_GB=$(df -BG . | awk 'NR==2{print $4}' | sed 's/G//')
CPU_CORES=$(nproc)

echo "  Memory: ${MEMORY_GB}GB"
echo "  Disk Available: ${DISK_GB}GB"
echo "  CPU Cores: ${CPU_CORES}"

if [ "$MEMORY_GB" -lt 8 ]; then
    echo -e "${YELLOW}Warning: Recommended minimum is 8GB RAM${NC}"
fi

if [ "$DISK_GB" -lt 50 ]; then
    echo -e "${YELLOW}Warning: Recommended minimum is 50GB disk space${NC}"
fi

# Create directories
echo ""
echo -e "${YELLOW}Creating directory structure...${NC}"
mkdir -p logs/{arbitrage,funding,whale-tracker,news}
mkdir -p data/{labels,uptime-kuma}
mkdir -p init-scripts/{postgres,timescale}
mkdir -p services/{arbitrage,funding,whale-tracker,news}

# Copy example env if .env doesn't exist
if [ ! -f .env ]; then
    echo ""
    echo -e "${YELLOW}Creating .env file from example...${NC}"
    cp .env.trading.example .env
    echo -e "${YELLOW}Please edit .env file with your configuration!${NC}"
else
    echo -e "${GREEN}.env file already exists${NC}"
fi

# Set permissions
echo -e "${YELLOW}Setting permissions...${NC}"
chmod 600 .env 2>/dev/null || true
chmod -R 755 logs data

# Pull images
echo ""
echo -e "${YELLOW}Pulling Docker images...${NC}"
docker compose -f docker-compose.trading.yml pull

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Setup Complete!                      ${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Next steps:"
echo "  1. Edit .env file with your configuration"
echo "  2. Run: docker compose -f docker-compose.trading.yml up -d"
echo "  3. Access Grafana at http://localhost:3000"
echo "  4. Default login: admin / (password from .env)"
echo ""
echo "Useful commands:"
echo "  Start:    docker compose -f docker-compose.trading.yml up -d"
echo "  Stop:     docker compose -f docker-compose.trading.yml down"
echo "  Logs:     docker compose -f docker-compose.trading.yml logs -f"
echo "  Status:   docker compose -f docker-compose.trading.yml ps"
echo ""
