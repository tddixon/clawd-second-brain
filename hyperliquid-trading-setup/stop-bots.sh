#!/bin/bash
# Stop both Hummingbot trading bots

echo "=========================================="
echo "Stopping Hummingbot Trading Bots"
echo "=========================================="
echo ""

# Check if docker-compose.yml exists
if [ ! -f "docker-compose.yml" ]; then
    echo "Error: docker-compose.yml not found!"
    exit 1
fi

# Stop the containers
echo "Stopping Hummingbot containers..."
docker-compose stop

if [ $? -eq 0 ]; then
    echo ""
    echo "✓ Bot containers stopped."
    echo ""
    echo "Your data is preserved in the Docker volumes."
    echo ""
    echo "To restart the bots:"
    echo "  ./start-bots.sh"
    echo ""
else
    echo ""
    echo "✗ Failed to stop containers"
    echo "Check the error messages above."
    exit 1
fi
