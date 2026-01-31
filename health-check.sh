#!/bin/bash
# health-check.sh
# Health check script for the trading system

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

FAILED=0

echo -e "${GREEN}Trading System Health Check${NC}"
echo "============================="
echo ""

# Check Docker
echo -n "Docker: "
if docker info > /dev/null 2>&1; then
    echo -e "${GREEN}OK${NC}"
else
    echo -e "${RED}FAIL${NC}"
    FAILED=1
fi

# Check running containers
echo ""
echo "Container Status:"
CONTAINERS=("trading-postgres" "trading-timescale" "trading-redis" "trading-prometheus" "trading-grafana" "trading-alertmanager")

for container in "${CONTAINERS[@]}"; do
    echo -n "  $container: "
    STATUS=$(docker inspect --format='{{.State.Status}}' "$container" 2>/dev/null)
    if [ "$STATUS" == "running" ]; then
        echo -e "${GREEN}running${NC}"
    else
        echo -e "${RED}$STATUS${NC}"
        FAILED=1
    fi
done

# Check database connectivity
echo ""
echo "Database Connectivity:"
echo -n "  PostgreSQL: "
if docker compose -f docker-compose.trading.yml exec -T postgres pg_isready -U trader > /dev/null 2>&1; then
    echo -e "${GREEN}OK${NC}"
else
    echo -e "${RED}FAIL${NC}"
    FAILED=1
fi

echo -n "  Redis: "
if docker compose -f docker-compose.trading.yml exec -T redis redis-cli ping | grep -q "PONG"; then
    echo -e "${GREEN}OK${NC}"
else
    echo -e "${RED}FAIL${NC}"
    FAILED=1
fi

# Check Prometheus
echo ""
echo -n "Prometheus: "
if curl -s http://localhost:9090/-/healthy > /dev/null 2>&1; then
    echo -e "${GREEN}OK${NC}"
else
    echo -e "${RED}FAIL${NC}"
    FAILED=1
fi

# Check Grafana
echo -n "Grafana: "
if curl -s http://localhost:3000/api/health | grep -q "ok"; then
    echo -e "${GREEN}OK${NC}"
else
    echo -e "${RED}FAIL${NC}"
    FAILED=1
fi

# Check disk space
echo ""
echo "Disk Usage:"
USAGE=$(df . | awk 'NR==2 {print $5}' | sed 's/%//')
echo -n "  Root partition: ${USAGE}% "
if [ "$USAGE" -lt 80 ]; then
    echo -e "${GREEN}OK${NC}"
elif [ "$USAGE" -lt 90 ]; then
    echo -e "${YELLOW}WARNING${NC}"
else
    echo -e "${RED}CRITICAL${NC}"
    FAILED=1
fi

# Check memory
echo ""
echo "Memory Usage:"
MEM_USAGE=$(free | awk '/Mem/{printf("%.0f", $3/$2 * 100)}')
echo -n "  RAM: ${MEM_USAGE}% "
if [ "$MEM_USAGE" -lt 80 ]; then
    echo -e "${GREEN}OK${NC}"
elif [ "$MEM_USAGE" -lt 90 ]; then
    echo -e "${YELLOW}WARNING${NC}"
else
    echo -e "${RED}CRITICAL${NC}"
    FAILED=1
fi

echo ""
echo "============================="
if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}All checks passed!${NC}"
    exit 0
else
    echo -e "${RED}Some checks failed!${NC}"
    exit 1
fi
