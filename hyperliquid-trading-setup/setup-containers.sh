#!/bin/bash
# Hyperliquid Paper Trading Setup Script
# Run this to set up both Hummingbot instances

echo "🚀 Setting up Hyperliquid Paper Trading Environment..."

# Create directories
mkdir -p ~/hummingbot/funding-arb/{conf,logs,data}
mkdir -p ~/hummingbot/meme-grid/{conf,logs,data}

# Pull Hummingbot image
echo "📦 Pulling Hummingbot image..."
docker pull hummingbot/hummingbot:latest

# Create Funding Arbitrage container
echo "🔧 Creating Funding Arbitrage bot..."
docker run -d --name hummingbot-funding-arb \
  -v ~/hummingbot/funding-arb/conf:/home/hummingbot/conf \
  -v ~/hummingbot/funding-arb/logs:/home/hummingbot/logs \
  -v ~/hummingbot/funding-arb/data:/home/hummingbot/data \
  -e CONFIG_PASSWORD=a \
  hummingbot/hummingbot:latest

# Create Meme Grid container
echo "🔧 Creating Meme Grid bot..."
docker run -d --name hummingbot-meme-grid \
  -v ~/hummingbot/meme-grid/conf:/home/hummingbot/conf \
  -v ~/hummingbot/meme-grid/logs:/home/hummingbot/logs \
  -v ~/hummingbot/meme-grid/data:/home/hummingbot/data \
  -e CONFIG_PASSWORD=a \
  hummingbot/hummingbot:latest

echo "✅ Containers created!"
echo ""
echo "Next steps:"
echo "1. Connect to Funding Arb: docker attach hummingbot-funding-arb"
echo "2. Connect to Meme Grid: docker attach hummingbot-meme-grid"
echo "3. Connect to Hyperliquid testnet in each"
echo "4. Import strategy configs"
