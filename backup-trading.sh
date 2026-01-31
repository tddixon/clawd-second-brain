#!/bin/bash
# backup-trading.sh
# Automated backup script for the trading system

BACKUP_DIR="${BACKUP_DIR:-/backup/trading}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_PATH="$BACKUP_DIR/$TIMESTAMP"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

mkdir -p "$BACKUP_PATH"

echo -e "${GREEN}Starting backup at $TIMESTAMP${NC}"

# Backup databases
echo -e "${YELLOW}Backing up PostgreSQL...${NC}"
docker compose -f docker-compose.trading.yml exec -T postgres pg_dump -U trader trading_db > "$BACKUP_PATH/trading_db.sql" 2>/dev/null
if [ $? -eq 0 ]; then
    echo -e "${GREEN}  ✓ trading_db backed up${NC}"
else
    echo -e "${RED}  ✗ trading_db backup failed${NC}"
fi

echo -e "${YELLOW}Backing up TimescaleDB...${NC}"
docker compose -f docker-compose.trading.yml exec -T timescaledb pg_dump -U trader market_data > "$BACKUP_PATH/market_data.sql" 2>/dev/null
if [ $? -eq 0 ]; then
    echo -e "${GREEN}  ✓ market_data backed up${NC}"
else
    echo -e "${RED}  ✗ market_data backup failed${NC}"
fi

# Backup Redis
echo -e "${YELLOW}Backing up Redis...${NC}"
docker compose -f docker-compose.trading.yml exec redis redis-cli BGSAVE 2>/dev/null
sleep 2
docker cp trading-redis:/data/dump.rdb "$BACKUP_PATH/redis.rdb" 2>/dev/null
if [ $? -eq 0 ]; then
    echo -e "${GREEN}  ✓ Redis backed up${NC}"
else
    echo -e "${RED}  ✗ Redis backup failed${NC}"
fi

# Backup configs
echo -e "${YELLOW}Backing up configuration...${NC}"
tar czf "$BACKUP_PATH/configs.tar.gz" config/ .env 2>/dev/null
if [ $? -eq 0 ]; then
    echo -e "${GREEN}  ✓ Configs backed up${NC}"
else
    echo -e "${RED}  ✗ Configs backup failed${NC}"
fi

# Create archive
ARCHIVE_NAME="trading_backup_$TIMESTAMP.tar.gz"
tar czf "$BACKUP_DIR/$ARCHIVE_NAME" -C "$BACKUP_DIR" "$TIMESTAMP"
rm -rf "$BACKUP_PATH"

echo -e "${GREEN}Backup complete: $BACKUP_DIR/$ARCHIVE_NAME${NC}"

# Cleanup old backups
echo -e "${YELLOW}Cleaning up backups older than $RETENTION_DAYS days...${NC}"
find "$BACKUP_DIR" -name "trading_backup_*.tar.gz" -mtime +$RETENTION_DAYS -delete
echo -e "${GREEN}Cleanup complete${NC}"

# Upload to remote if configured (example with rclone)
if command -v rclone &> /dev/null && [ -n "$RCLONE_REMOTE" ]; then
    echo -e "${YELLOW}Uploading to remote storage...${NC}"
    rclone copy "$BACKUP_DIR/$ARCHIVE_NAME" "$RCLONE_REMOTE:trading-backups/"
    echo -e "${GREEN}Upload complete${NC}"
fi
