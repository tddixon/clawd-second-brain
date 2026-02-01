#!/bin/bash
# Start both Hummingbot trading bots

echo "=========================================="
echo "Starting Hummingbot Trading Bots"
echo "=========================================="
echo ""

# Check if docker-compose.yml exists
if [ ! -f "docker-compose.yml" ]; then
    echo "Error: docker-compose.yml not found!"
    echo "Please run ./setup-hummingbot.sh first."
    exit 1
fi

# Start the containers
echo "Starting Hummingbot containers..."
docker-compose up -d

if [ $? -eq 0 ]; then
    echo ""
    echo "✓ Bot containers started successfully!"
    echo ""
    echo "=========================================="
    echo "Next Steps:"
    echo "=========================================="
    echo ""
    echo "Check status:"
    echo "  ./check-status.sh"
    echo ""
    echo "To attach to Funding Arb bot:"
    echo "  docker attach hummingbot-funding-arb"
    echo ""
    echo "To attach to Meme Grid bot:"
    echo "  docker attach hummingbot-meme-grid"
    echo ""
    echo "View logs:"
    echo "  ./view-logs.sh funding tail"
    echo "  ./view-logs.sh meme follow"
    echo ""
    echo "To detach from a container (without stopping):"
    echo "  Press Ctrl+P then Ctrl+Q"
    echo ""
    echo "To stop a container:"
    echo "  Press Ctrl+C (while attached)"
    echo "  Or run: ./stop-bots.sh"
    echo ""
else
    echo ""
    echo "✗ Failed to start containers"
    echo "Check the error messages above."
    exit 1
fi
