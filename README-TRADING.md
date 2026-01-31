# Self-Hosted Trading System

A completely self-hosted trading infrastructure with zero SaaS dependencies. Run everything on your own hardware with minimal operating costs.

## Features

- **Polymarket Arbitrage** - Event-based prediction market arbitrage detection
- **Funding Rate Farming** - Automated yield from perpetual funding rates
- **Whale Tracking** - Monitor high-value addresses via public RPC nodes
- **News Monitoring** - RSS-based news signal generation
- **Full Monitoring Stack** - Self-hosted Grafana, Prometheus, AlertManager
- **Cost Optimized** - <$100/month total operating cost

## Quick Start

```bash
# 1. Clone and enter directory
cd selfhosted-trading

# 2. Run setup script
./setup-trading-system.sh

# 3. Configure environment
nano .env

# 4. Start the system
docker compose -f docker-compose.trading.yml up -d

# 5. Check health
./health-check.sh
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     YOUR MACHINE                            │
├─────────────────────────────────────────────────────────────┤
│  Services:         Databases:        Monitoring:             │
│  • Arbitrage      • PostgreSQL      • Grafana               │
│  • Funding        • TimescaleDB     • Prometheus            │
│  • Whale Tracker  • Redis           • AlertManager          │
│  • News Scraper                     • Loki + Promtail       │
└─────────────────────────────────────────────────────────────┘
                           │
           ┌───────────────┼───────────────┐
           ▼               ▼               ▼
    Polymarket API    Free RPC Nodes    RSS Feeds
```

## Services Overview

### 1. Arbitrage Engine
- Connects to Polymarket API
- Monitors prediction markets for pricing discrepancies
- Integrates with free price feeds (CoinGecko)
- **Paper trading mode by default**

### 2. Funding Rate Farmer
- Collects funding rates from Binance, Bybit, Hyperliquid
- Identifies highest-yield opportunities
- Stores time-series data in TimescaleDB
- Tracks historical APY

### 3. Whale Tracker
- Monitors configured addresses via public RPC
- Uses multiple free RPC endpoints for redundancy
- Alerts on large transactions via Telegram
- Supports custom address labels

### 4. News Scraper
- Monitors RSS feeds (CoinDesk, TheBlock, etc.)
- Keyword-based sentiment analysis
- No ML required - simple rule-based signals

## Hardware Requirements

| Spec | Minimum | Recommended |
|------|---------|-------------|
| CPU | 4-core | 8-core |
| RAM | 16GB | 32GB |
| Storage | 500GB SSD | 1TB NVMe + 4TB HDD |
| Network | 100 Mbps | 1 Gbps |

## Monthly Costs

| Item | Cost |
|------|------|
| Power (150W) | $20-30 |
| Internet | $0-50 |
| APIs (all free tiers) | $0 |
| Monitoring (self-hosted) | $0 |
| **Total** | **$20-80/month** |

## Configuration

### Environment Variables

Copy `.env.trading.example` to `.env` and configure:

```bash
# Database passwords
DB_PASSWORD=your_secure_password
TSDB_PASSWORD=your_secure_password

# Notifications
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id

# Trading limits (paper mode by default)
TRADING_MODE=paper
MAX_POSITION_SIZE_USD=1000
MAX_DAILY_LOSS_USD=500
```

### Whale Tracking Labels

Edit `data/labels/whales.yaml`:

```yaml
whales:
  - address: "0x28C6c06298d514Db089934071355E5743bf21d60"
    name: "Binance 14"
    category: "exchange"
    alert_threshold_eth: 500

exchanges:
  - address: "0x..."
    name: "Coinbase Hot"
    category: "exchange"
    alert_threshold_eth: 1000
```

## Accessing Services

| Service | URL | Credentials |
|---------|-----|-------------|
| Grafana | http://localhost:3000 | admin / (from .env) |
| Prometheus | http://localhost:9090 | - |
| Uptime Kuma | http://localhost:3001 | - |

## Useful Commands

```bash
# Start all services
docker compose -f docker-compose.trading.yml up -d

# View logs
docker compose -f docker-compose.trading.yml logs -f

# View specific service logs
docker compose -f docker-compose.trading.yml logs -f whale-tracker

# Stop all services
docker compose -f docker-compose.trading.yml down

# Health check
./health-check.sh

# Backup data
./backup-trading.sh

# Database shell
docker compose -f docker-compose.trading.yml exec postgres psql -U trader -d trading_db
```

## Free RPC Endpoints (Built-in)

The system uses these free public RPC endpoints with automatic failover:

- `https://eth.llamarpc.com` (10M calls/month)
- `https://rpc.ankr.com/eth` (unlimited)
- `https://ethereum.publicnode.com` (unlimited)
- `https://cloudflare-eth.com` (unlimited)

## API Rate Limits (Free Tiers)

| Service | Limit |
|---------|-------|
| CoinGecko | 10-30 calls/min |
| DefiLlama | Unlimited |
| Binance Futures | 1200 req/min |
| Bybit V5 | 120 req/min |
| Polymarket | 100 req/min |

## Security

- All internal services bind to localhost only
- Use UFW firewall to restrict external access
- Store secrets in `.env` (chmod 600)
- Run in paper trading mode until fully tested

## Backups

Automatic daily backups can be configured via cron:

```bash
# Edit crontab
crontab -e

# Add backup job (daily at 2 AM)
0 2 * * * /path/to/backup-trading.sh
```

## Troubleshooting

### High Memory Usage
Reduce memory limits in docker-compose:
```yaml
services:
  arbitrage-engine:
    deploy:
      resources:
        limits:
          memory: 256M
```

### RPC Rate Limiting
The system automatically rotates through multiple RPC endpoints. If all are rate-limited:
- Wait a few minutes
- Consider adding more endpoints to the list

### Database Connection Issues
```bash
# Restart databases
docker compose -f docker-compose.trading.yml restart postgres timescaledb

# Check logs
docker compose -f docker-compose.trading.yml logs postgres
```

## Directory Structure

```
selfhosted-trading/
├── docker-compose.trading.yml    # Main compose file
├── .env.trading.example          # Environment template
├── setup-trading-system.sh       # One-command setup
├── health-check.sh               # Health monitoring
├── backup-trading.sh             # Backup script
├── config/                       # Service configurations
│   ├── prometheus/
│   ├── grafana/
│   ├── alertmanager/
│   └── ...
├── services/                     # Trading service implementations
│   ├── arbitrage/
│   ├── funding/
│   ├── whale-tracker/
│   └── news/
├── init-scripts/                 # Database initialization
│   ├── postgres/
│   └── timescale/
├── data/                         # Data storage
│   └── labels/
└── logs/                         # Application logs
```

## Customization

### Adding New Strategies

1. Create new service directory in `services/`
2. Add Dockerfile and implementation
3. Add to `docker-compose.trading.yml`
4. Add Prometheus scraping config
5. Create Grafana dashboard panels

### Adding New RPC Endpoints

Edit `ETH_RPC_URLS` in `.env`:
```bash
ETH_RPC_URLS=https://custom-rpc.com,https://eth.llamarpc.com,...
```

## License

MIT - See LICENSE file

## Disclaimer

This software is for educational purposes. Trading involves risk. Always test thoroughly in paper trading mode before using real funds. Past performance does not guarantee future results.
