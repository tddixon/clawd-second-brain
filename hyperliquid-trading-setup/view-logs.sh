#!/bin/bash
# View logs from a specific Hummingbot bot

# Display usage if no arguments provided
if [ -z "$1" ]; then
    echo "Usage: ./view-logs.sh [funding|meme] [tail|follow]"
    echo ""
    echo "Examples:"
    echo "  ./view-logs.sh funding tail    # Show last 50 lines"
    echo "  ./view-logs.sh meme follow     # Follow live logs"
    echo "  ./view-logs.sh funding         # Default: tail"
    echo ""
    exit 1
fi

BOT=$1
MODE=${2:-tail}

# Validate bot argument
case $BOT in
    funding)
        CONTAINER="hummingbot-funding-arb"
        BOT_NAME="Funding Arbitrage"
        ;;
    meme)
        CONTAINER="hummingbot-meme-grid"
        BOT_NAME="Meme Grid"
        ;;
    *)
        echo "Error: Invalid bot name."
        echo "Use 'funding' or 'meme'"
        exit 1
esac

# Validate mode argument
case $MODE in
    tail|follow)
        ;;
    *)
        echo "Error: Invalid mode."
        echo "Use 'tail' or 'follow'"
        exit 1
esac

# Check if container exists
if ! docker ps -a --format "{{.Names}}" | grep -q "^${CONTAINER}$"; then
    echo "Error: Container '${CONTAINER}' not found."
    echo ""
    echo "Available containers:"
    docker ps -a --format "{{.Names}}" | grep hummingbot || echo "  None found"
    exit 1
fi

# Display logs
echo "=========================================="
echo "Logs: ${BOT_NAME} (${MODE} mode)"
echo "=========================================="
echo ""

case $MODE in
    tail)
        docker logs --tail 50 "$CONTAINER" 2>&1
        ;;
    follow)
        echo "Press Ctrl+C to stop following logs"
        echo ""
        docker logs -f "$CONTAINER" 2>&1
        ;;
esac
