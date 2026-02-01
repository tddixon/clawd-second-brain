#!/bin/bash
# Check status of both Hummingbot trading bots

echo "=========================================="
echo "Hummingbot Bot Status"
echo "=========================================="
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "Error: Docker is not running!"
    echo "Please start Docker and try again."
    exit 1
fi

# Check Funding Arb bot
echo "Funding Arbitrage Bot:"
funding_status=$(docker ps -a --filter "name=hummingbot-funding-arb" --format "{{.Status}}")
if [ -z "$funding_status" ]; then
    echo "  ✗ Container not found"
else
    echo "  $funding_status"
fi
echo ""

# Check Meme Grid bot
echo "Meme Grid Bot:"
meme_status=$(docker ps -a --filter "name=hummingbot-meme-grid" --format "{{.Status}}")
if [ -z "$meme_status" ]; then
    echo "  ✗ Container not found"
else
    echo "  $meme_status"
fi
echo ""

# Check if containers are running
funding_running=$(docker ps --filter "name=hummingbot-funding-arb" --format "{{.Names}}")
meme_running=$(docker ps --filter "name=hummingbot-meme-grid" --format "{{.Names}}")

if [ -n "$funding_running" ] && [ -n "$meme_running" ]; then
    echo "✓ Both bots are running!"
    echo ""
elif [ -n "$funding_running" ] && [ -z "$meme_running" ]; then
    echo "⚠ Funding Arb is running, but Meme Grid is stopped."
    echo ""
elif [ -z "$funding_running" ] && [ -n "$meme_running" ]; then
    echo "⚠ Meme Grid is running, but Funding Arb is stopped."
    echo ""
else
    echo "✗ Both bots are stopped."
    echo "Start them with: ./start-bots.sh"
    echo ""
    exit 0
fi

# Show recent logs for running containers
if [ -n "$funding_running" ]; then
    echo "=========================================="
    echo "Recent Logs - Funding Arb"
    echo "=========================================="
    docker logs --tail 10 hummingbot-funding-arb 2>&1
    echo ""
fi

if [ -n "$meme_running" ]; then
    echo "=========================================="
    echo "Recent Logs - Meme Grid"
    echo "=========================================="
    docker logs --tail 10 hummingbot-meme-grid 2>&1
    echo ""
fi

echo "=========================================="
echo "Quick Commands:"
echo "=========================================="
echo "View logs (funding):  ./view-logs.sh funding tail"
echo "View logs (meme):     ./view-logs.sh meme tail"
echo "Follow logs (funding): ./view-logs.sh funding follow"
echo "Follow logs (meme):    ./view-logs.sh meme follow"
echo "Stop all bots:        ./stop-bots.sh"
echo "Restart all bots:     ./stop-bots.sh && ./start-bots.sh"
echo ""
