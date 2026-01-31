# Self-Hosted Trading System Design
## Zero SaaS Dependency - Complete Infrastructure Guide

**Version:** 1.0  
**Last Updated:** 2025-01-XX  
**Target Budget:** <$100/month operating cost  
**One-time Hardware:** ~$2,000 (optional, can use existing hardware)

---

## Executive Summary

This document outlines a **100% self-hosted trading system** requiring no external SaaS services. All infrastructure runs locally using Docker Compose, with free APIs and public RPC endpoints as fallbacks.

### Core Strategies Implemented
1. **Polymarket Arbitrage** - Event-based prediction market arbitrage
2. **Funding Rate Farming** - Automated yield from perpetual funding rates
3. **Whale Tracking** - Monitor 5-10 high-value addresses
4. **News-Based Trading** - RSS-triggered position adjustments

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    SINGLE-MACHINE DEPLOYMENT                     │
│                      (Desktop/Server/VPS)                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │   TRADING    │  │    DATA      │  │     MONITORING       │   │
│  │   SERVICES   │  │   SERVICES   │  │      STACK           │   │
│  ├──────────────┤  ├──────────────┤  ├──────────────────────┤   │
│  │• Arbitrage   │  │• PostgreSQL  │  │• Grafana             │   │
│  │  Engine      │  │• TimescaleDB │  │• Prometheus          │   │
│  │• Funding     │  │• Redis       │  │• AlertManager        │   │
│  │  Farmer      │  │• IPFS Node   │  │• Loki (logs)         │   │
│  │• Whale       │  │• SQLite      │  │• Uptime Kuma         │   │
│  │  Watcher     │  │              │  │                      │   │
│  │• News        │  │              │  │                      │   │
│  │  Scraper     │  │              │  │                      │   │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘   │
│         │                 │                     │               │
│         └─────────────────┴─────────────────────┘               │
│                           │                                      │
│                    ┌──────▼──────┐                              │
│                    │   NGINX     │                              │
│                    │  (Reverse   │                              │
│                    │   Proxy)    │                              │
│                    └──────┬──────┘                              │
│                           │                                      │
└───────────────────────────┼──────────────────────────────────────┘
                            │
    ┌───────────────────────┼───────────────────────┐
    │                       │                       │
    ▼                       ▼                       ▼
┌─────────┐          ┌─────────┐           ┌─────────────┐
│Polymarket│          │  Free   │           │  Public RPC │
│   API   │          │  APIs   │           │  Endpoints  │
│(REST/WS)│          │(Binance,│           │(Fallback)   │
│         │          │Hyperliquid│          │             │
└─────────┘          └─────────┘           └─────────────┘
```

---

## Hardware Requirements

### Minimum Viable Setup (Existing Desktop)
```yaml
CPU: 4-core (Intel i5/AMD Ryzen 5 or better)
RAM: 16GB
Storage: 500GB SSD (NVMe preferred)
Network: 100 Mbps stable connection
OS: Linux (Ubuntu 22.04 LTS recommended)
```

### Recommended Setup (Dedicated Server)
```yaml
CPU: 8-core (Intel i7/AMD Ryzen 7)
RAM: 32GB DDR4
Storage:
  - 1TB NVMe SSD (OS + hot data)
  - 4TB HDD (historical data)
Network: 1 Gbps
UPS: Recommended for power stability
```

### Full Node Setup (Optional Archive Node)
```yaml
CPU: 16-core (AMD Ryzen 9/Intel i9)
RAM: 64GB DDR4
Storage:
  - 2TB NVMe SSD (OS + chain state)
  - 16TB NVMe/HDD (archive data)
Network: 1 Gbps unmetered
GPU: Optional (for faster sync)
```

### Cost Breakdown

| Component | Minimum | Recommended | Archive Node |
|-----------|---------|-------------|--------------|
| **One-time Hardware** | $0 (existing) | $800-1,200 | $2,000-3,500 |
| **Monthly Power** | $10-15 | $20-30 | $50-80 |
| **Internet** | $0 (existing) | $0-50 | $50-100 |
| **VPS Alternative** | N/A | $40-80/month | Not recommended |
| **TOTAL MONTHLY** | **$10-15** | **$20-80** | **$100-180** |

**Target:** $100/month maximum with recommended setup

---

## Docker Compose Configuration

### Main Compose File: `docker-compose.yml`

```yaml
version: '3.8'

networks:
  trading-network:
    driver: bridge

volumes:
  postgres_data:
  redis_data:
  grafana_data:
  prometheus_data:
  timescale_data:
  ipfs_data:

services:
  # ==========================================
  # DATABASE LAYER
  # ==========================================
  
  postgres:
    image: postgres:15-alpine
    container_name: trading-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${DB_USER:-trader}
      POSTGRES_PASSWORD: ${DB_PASSWORD:-changeme_in_env}
      POSTGRES_DB: ${DB_NAME:-trading_db}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init-scripts/postgres:/docker-entrypoint-initdb.d
    ports:
      - "127.0.0.1:5432:5432"
    networks:
      - trading-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER:-trader}"]
      interval: 10s
      timeout: 5s
      retries: 5

  timescaledb:
    image: timescale/timescaledb:latest-pg15
    container_name: trading-timescale
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${TSDB_USER:-trader}
      POSTGRES_PASSWORD: ${TSDB_PASSWORD:-changeme_in_env}
      POSTGRES_DB: ${TSDB_NAME:-market_data}
    volumes:
      - timescale_data:/var/lib/postgresql/data
      - ./init-scripts/timescale:/docker-entrypoint-initdb.d
    ports:
      - "127.0.0.1:5433:5432"
    networks:
      - trading-network
    command: >
      postgres
      -c shared_preload_libraries=timescaledb
      -c max_connections=200
      -c shared_buffers=2GB
      -c effective_cache_size=6GB
      -c maintenance_work_mem=512MB

  redis:
    image: redis:7-alpine
    container_name: trading-redis
    restart: unless-stopped
    volumes:
      - redis_data:/data
      - ./config/redis.conf:/usr/local/etc/redis/redis.conf:ro
    ports:
      - "127.0.0.1:6379:6379"
    networks:
      - trading-network
    command: redis-server /usr/local/etc/redis/redis.conf

  # ==========================================
  # MONITORING STACK
  # ==========================================
  
  prometheus:
    image: prom/prometheus:latest
    container_name: trading-prometheus
    restart: unless-stopped
    volumes:
      - ./config/prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - prometheus_data:/prometheus
    ports:
      - "127.0.0.1:9090:9090"
    networks:
      - trading-network
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--storage.tsdb.retention.time=30d'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'

  grafana:
    image: grafana/grafana:latest
    container_name: trading-grafana
    restart: unless-stopped
    environment:
      - GF_SECURITY_ADMIN_USER=${GRAFANA_USER:-admin}
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD:-changeme}
      - GF_INSTALL_PLUGINS=grafana-clock-panel,grafana-simple-json-datasource
    volumes:
      - grafana_data:/var/lib/grafana
      - ./config/grafana/dashboards:/etc/grafana/provisioning/dashboards:ro
      - ./config/grafana/datasources:/etc/grafana/provisioning/datasources:ro
    ports:
      - "127.0.0.1:3000:3000"
    networks:
      - trading-network
    depends_on:
      - prometheus
      - postgres

  alertmanager:
    image: prom/alertmanager:latest
    container_name: trading-alertmanager
    restart: unless-stopped
    volumes:
      - ./config/alertmanager.yml:/etc/alertmanager/alertmanager.yml:ro
    ports:
      - "127.0.0.1:9093:9093"
    networks:
      - trading-network

  loki:
    image: grafana/loki:latest
    container_name: trading-loki
    restart: unless-stopped
    volumes:
      - ./config/loki.yml:/etc/loki/local-config.yaml:ro
    ports:
      - "127.0.0.1:3100:3100"
    networks:
      - trading-network
    command: -config.file=/etc/loki/local-config.yaml

  promtail:
    image: grafana/promtail:latest
    container_name: trading-promtail
    restart: unless-stopped
    volumes:
      - ./config/promtail.yml:/etc/promtail/config.yml:ro
      - /var/log:/var/log:ro
      - ./logs:/var/log/trading:ro
    networks:
      - trading-network
    command: -config.file=/etc/promtail/config.yml

  uptime-kuma:
    image: louislam/uptime-kuma:latest
    container_name: trading-uptime
    restart: unless-stopped
    volumes:
      - ./uptime-kuma-data:/app/data
    ports:
      - "127.0.0.1:3001:3001"
    networks:
      - trading-network

  # ==========================================
  # BLOCKCHAIN INFRASTRUCTURE (OPTIONAL)
  # ==========================================
  
  # Uncomment to run local Ethereum node
  # geth:
  #   image: ethereum/client-go:stable
  #   container_name: trading-geth
  #   restart: unless-stopped
  #   volumes:
  #     - ./geth-data:/root/.ethereum
  #   ports:
  #     - "30303:30303"
  #     - "30303:30303/udp"
  #     - "127.0.0.1:8545:8545"
  #     - "127.0.0.1:8546:8546"
  #   networks:
  #     - trading-network
  #   command: >
  #     --mainnet
  #     --syncmode snap
  #     --http
  #     --http.addr 0.0.0.0
  #     --http.port 8545
  #     --http.api eth,net,web3
  #     --http.vhosts '*'
  #     --http.corsdomain '*'
  #     --ws
  #     --ws.addr 0.0.0.0
  #     --ws.port 8546
  #     --ws.api eth,net,web3

  # ipfs:
  #   image: ipfs/kubo:latest
  #   container_name: trading-ipfs
  #   restart: unless-stopped
  #   volumes:
  #     - ipfs_data:/data/ipfs
  #   ports:
  #     - "4001:4001"
  #     - "4001:4001/udp"
  #     - "127.0.0.1:5001:5001"
  #     - "127.0.0.1:8080:8080"
  #   networks:
  #     - trading-network

  # ==========================================
  # TRADING SERVICES
  # ==========================================
  
  arbitrage-engine:
    build:
      context: ./services/arbitrage
      dockerfile: Dockerfile
    container_name: trading-arbitrage
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_NAME=${DB_NAME:-trading_db}
      - DB_USER=${DB_USER:-trader}
      - DB_PASSWORD=${DB_PASSWORD}
      - REDIS_HOST=redis
      - REDIS_PORT=6379
      - LOG_LEVEL=info
    volumes:
      - ./config/arbitrage:/app/config:ro
      - ./logs/arbitrage:/app/logs
    networks:
      - trading-network
    depends_on:
      - postgres
      - redis

  funding-farmer:
    build:
      context: ./services/funding
      dockerfile: Dockerfile
    container_name: trading-funding
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - DB_HOST=timescaledb
      - DB_PORT=5432
      - DB_NAME=${TSDB_NAME:-market_data}
      - DB_USER=${TSDB_USER:-trader}
      - DB_PASSWORD=${TSDB_PASSWORD}
      - REDIS_HOST=redis
      - REDIS_PORT=6379
    volumes:
      - ./config/funding:/app/config:ro
      - ./logs/funding:/app/logs
    networks:
      - trading-network
    depends_on:
      - timescaledb
      - redis

  whale-tracker:
    build:
      context: ./services/whale-tracker
      dockerfile: Dockerfile
    container_name: trading-whale
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_NAME=${DB_NAME:-trading_db}
      - DB_USER=${DB_USER:-trader}
      - DB_PASSWORD=${DB_PASSWORD}
      - REDIS_HOST=redis
      - REDIS_PORT=6379
      - ETH_RPC_URLS=${ETH_RPC_URLS:-https://eth.llamarpc.com,https://rpc.ankr.com/eth}
    volumes:
      - ./config/whale-tracker:/app/config:ro
      - ./logs/whale-tracker:/app/logs
      - ./data/labels:/app/data/labels:ro
    networks:
      - trading-network
    depends_on:
      - postgres
      - redis

  news-scraper:
    build:
      context: ./services/news
      dockerfile: Dockerfile
    container_name: trading-news
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_NAME=${DB_NAME:-trading_db}
      - DB_USER=${DB_USER:-trader}
      - DB_PASSWORD=${DB_PASSWORD}
      - REDIS_HOST=redis
      - REDIS_PORT=6379
      - OPENAI_API_KEY=${OPENAI_API_KEY:-}
    volumes:
      - ./config/news:/app/config:ro
      - ./logs/news:/app/logs
    networks:
      - trading-network
    depends_on:
      - postgres
      - redis

  # ==========================================
  # REVERSE PROXY
  # ==========================================
  
  nginx:
    image: nginx:alpine
    container_name: trading-nginx
    restart: unless-stopped
    volumes:
      - ./config/nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./config/nginx/ssl:/etc/nginx/ssl:ro
    ports:
      - "80:80"
      - "443:443"
    networks:
      - trading-network
    depends_on:
      - grafana
      - uptime-kuma
```

---

## Trading Services Implementation

### 1. Polymarket Arbitrage Engine

**Location:** `./services/arbitrage/`

**Purpose:** Identify and execute arbitrage opportunities between Polymarket prediction markets and external price feeds.

**Architecture:**
```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Polymarket API │────▶│  Price Oracle   │◀────│  External APIs  │
│  (Order Book)   │     │  Aggregator     │     │  (CoinGecko, etc)│
└─────────────────┘     └────────┬────────┘     └─────────────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │  Arbitrage      │
                        │  Engine         │
                        │  - Detect gaps  │
                        │  - Size trades  │
                        │  - Risk checks  │
                        └────────┬────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │  Execution      │
                        │  Manager        │
                        └─────────────────┘
```

**Key Files:**
- `src/index.ts` - Main service entry
- `src/polymarket.ts` - Polymarket API client
- `src/arbitrage.ts` - Core arbitrage logic
- `src/executor.ts` - Trade execution

**Sample Implementation:**
```typescript
// services/arbitrage/src/arbitrage.ts
import { PolymarketClient } from './polymarket';
import { PriceAggregator } from './prices';
import { RiskManager } from './risk';

interface ArbitrageOpportunity {
  marketId: string;
  side: 'buy' | 'sell';
  size: number;
  expectedProfit: number;
  confidence: number;
}

export class ArbitrageEngine {
  private polymarket: PolymarketClient;
  private prices: PriceAggregator;
  private risk: RiskManager;
  
  async scanOpportunities(): Promise<ArbitrageOpportunity[]> {
    const markets = await this.polymarket.getActiveMarkets();
    const opportunities: ArbitrageOpportunity[] = [];
    
    for (const market of markets) {
      // Get Polymarket best bid/ask
      const orderBook = await this.polymarket.getOrderBook(market.id);
      
      // Get external price reference
      const externalPrice = await this.prices.getPrice(market.underlying);
      
      // Check for arbitrage
      const gap = this.calculateGap(orderBook, externalPrice);
      
      if (gap.profitPercent > this.minProfitThreshold) {
        const sized = this.risk.sizePosition(gap, market);
        if (sized.valid) {
          opportunities.push({
            marketId: market.id,
            side: gap.side,
            size: sized.size,
            expectedProfit: sized.expectedProfit,
            confidence: sized.confidence
          });
        }
      }
    }
    
    return opportunities.sort((a, b) => b.expectedProfit - a.expectedProfit);
  }
}
```

**Configuration:** `config/arbitrage/config.json`
```json
{
  "minProfitPercent": 0.5,
  "maxPositionSize": 5000,
  "maxDailyLoss": 1000,
  "scanIntervalMs": 5000,
  "markets": ["crypto", "politics", "sports"],
  "exchanges": ["binance", "coinbase", "kraken"],
  "riskParams": {
    "maxExposurePerMarket": 0.2,
    "maxCorrelation": 0.7,
    "volatilityThreshold": 0.05
  }
}
```

---

### 2. Funding Rate Farmer

**Location:** `./services/funding/`

**Purpose:** Automatically farm funding rates across perpetual exchanges by opening offsetting positions where funding is most favorable.

**Supported Exchanges (Free APIs):**
- Binance (futures API - free tier)
- Bybit (V5 API - free)
- Hyperliquid (free)
- dYdX (free)
- GMX (on-chain, free)

**Architecture:**
```
┌─────────────────────────────────────────────────────────┐
│                  FUNDING RATE FARMER                     │
├─────────────────────────────────────────────────────────┤
│  Exchanges ◄─────► Rate Aggregator ◄─────► Opportunity │
│  - Binance       - Collect rates        Finder          │
│  - Bybit         - Calculate yield                      │
│  - Hyperliquid   - Rank by APY        ┌───────────────┐ │
│  - dYdX                               │   Strategy    │ │
│                                       │   Engine      │ │
│  Risk Manager ◄─────► Position        │   - Hedging   │ │
│  - Size limits      Manager           │   - Sizing    │ │
│  - Drawdown         - Open positions  │   - Rebalancing│ │
│  - Exposure         - Monitor funding └───────────────┘ │
└─────────────────────────────────────────────────────────┘
```

**Database Schema (TimescaleDB):**
```sql
-- Create hypertable for funding rates
CREATE TABLE funding_rates (
    time TIMESTAMPTZ NOT NULL,
    exchange TEXT NOT NULL,
    symbol TEXT NOT NULL,
    funding_rate DOUBLE PRECISION NOT NULL,
    mark_price DOUBLE PRECISION,
    index_price DOUBLE PRECISION,
    next_funding_time TIMESTAMPTZ,
    PRIMARY KEY (time, exchange, symbol)
);

-- Convert to hypertable
SELECT create_hypertable('funding_rates', 'time', chunk_time_interval => INTERVAL '1 day');

-- Aggregated yield view
CREATE MATERIALIZED VIEW funding_yield_24h AS
SELECT 
    exchange,
    symbol,
    time_bucket('1 day', time) as day,
    AVG(funding_rate) * 3 * 365 as estimated_apr,
    COUNT(*) as samples
FROM funding_rates
WHERE time > NOW() - INTERVAL '7 days'
GROUP BY exchange, symbol, day;
```

**Sample Implementation:**
```typescript
// services/funding/src/strategy.ts
interface FundingOpportunity {
  longExchange: string;
  shortExchange: string;
  symbol: string;
  fundingSpread: number; // Annualized APY difference
  estimatedDailyYield: number;
  confidence: number;
}

export class FundingStrategy {
  async findBestOpportunities(): Promise<FundingOpportunity[]> {
    const rates = await this.getCurrentRates();
    const opportunities: FundingOpportunity[] = [];
    
    // Group by symbol
    const bySymbol = this.groupBySymbol(rates);
    
    for (const [symbol, exchanges] of Object.entries(bySymbol)) {
      // Sort by funding rate
      const sorted = exchanges.sort((a, b) => b.rate - a.rate);
      
      // Find best long/short pair
      for (let i = 0; i < sorted.length; i++) {
        for (let j = i + 1; j < sorted.length; j++) {
          const long = sorted[j];  // Paying negative funding = receive
          const short = sorted[i]; // Receiving positive funding
          
          const spread = Math.abs(short.rate - long.rate) * 3 * 365; // Annualized
          
          if (spread > this.minYieldThreshold) {
            opportunities.push({
              longExchange: long.exchange,
              shortExchange: short.exchange,
              symbol,
              fundingSpread: spread,
              estimatedDailyYield: this.calculateDailyYield(long, short),
              confidence: this.assessConfidence(long, short)
            });
          }
        }
      }
    }
    
    return opportunities.sort((a, b) => b.fundingSpread - a.fundingSpread);
  }
}
```

---

### 3. Whale Tracker

**Location:** `./services/whale-tracker/`

**Purpose:** Monitor 5-10 known high-value addresses and alert on significant transactions.

**Address Labeling System:**
```yaml
# data/labels/whales.yaml
whales:
  - address: "0x..."
    name: "Wintermute Trading"
    category: "market_maker"
    tags: ["mm", "institutional"]
    alert_threshold_eth: 1000
    
  - address: "0x..."
    name: "Jump Trading"
    category: "prop_trading"
    tags: ["prop", "institutional"]
    alert_threshold_eth: 500
    
  - address: "0x..."
    name: "Alameda Remnants"
    category: "suspicious"
    tags: ["watch", "high_risk"]
    alert_threshold_eth: 100

exchanges:
  - address: "0x..."
    name: "Coinbase Hot"
    category: "exchange"
    flow_direction: "both"  # inflow=outflow signal
    
contracts:
  - address: "0x..."
    name: "Uniswap V3 Factory"
    category: "defi"
    relevant_events: ["PoolCreated", "Swap"]
```

**Implementation:**
```typescript
// services/whale-tracker/src/tracker.ts
import { ethers } from 'ethers';

export class WhaleTracker {
  private providers: ethers.Provider[];
  private labels: Map<string, AddressLabel>;
  
  async startMonitoring() {
    // Use multiple free RPC endpoints for redundancy
    this.providers = this.RPC_URLS.map(url => 
      new ethers.JsonRpcProvider(url)
    );
    
    // Subscribe to pending transactions
    for (const provider of this.providers) {
      provider.on('pending', (txHash) => {
        this.processTransaction(txHash, provider);
      });
    }
  }
  
  private async processTransaction(txHash: string, provider: ethers.Provider) {
    try {
      const tx = await provider.getTransaction(txHash);
      if (!tx) return;
      
      const fromLabel = this.labels.get(tx.from?.toLowerCase() || '');
      const toLabel = tx.to ? this.labels.get(tx.to.toLowerCase()) : null;
      
      // Check if whale involved
      if (fromLabel || toLabel) {
        const value = parseFloat(ethers.formatEther(tx.value || 0));
        const threshold = fromLabel?.alertThreshold || toLabel?.alertThreshold || 100;
        
        if (value >= threshold) {
          await this.alert({
            type: 'whale_transfer',
            from: { address: tx.from, label: fromLabel },
            to: { address: tx.to, label: toLabel },
            value,
            txHash,
            timestamp: new Date()
          });
        }
      }
    } catch (err) {
      // Silent fail - transaction might be dropped
    }
  }
}
```

**Free RPC Endpoints (Redundancy):**
```typescript
const FREE_RPC_URLS = [
  'https://eth.llamarpc.com',           // LlamaNodes (free tier)
  'https://rpc.ankr.com/eth',           // Ankr (free tier)
  'https://ethereum.publicnode.com',     // PublicNode
  'https://cloudflare-eth.com',          // Cloudflare
  'https://rpc.mevblocker.io',           // MEV Blocker
];
```

---

### 4. News Scraper & Signal Generator

**Location:** `./services/news/`

**Purpose:** Monitor RSS feeds and social media for market-moving news, generate trading signals.

**Sources (All Free):**
```yaml
# config/news/sources.yaml
rss_feeds:
  - name: "CoinDesk"
    url: "https://www.coindesk.com/arc/outboundfeeds/rss/"
    priority: high
    categories: ["breaking", "regulation", "markets"]
    
  - name: "TheBlock"
    url: "https://www.theblock.co/rss.xml"
    priority: high
    
  - name: "Decrypt"
    url: "https://decrypt.co/feed"
    priority: medium
    
  - name: "CryptoTwitter"
    url: "https://nitter.net/search/rss?f=tweets&q=crypto+OR+bitcoin+OR+ethereum"
    priority: medium

keywords:
  bullish: ["etf approval", "partnership", "adoption", "institutional", "bullish"]
  bearish: ["hack", "exploit", "sec investigation", "ban", "bearish", "crash"]
  urgent: ["breaking", "urgent", "alert", "emergency"]
```

**Signal Generation:**
```typescript
// services/news/src/signals.ts
interface NewsSignal {
  id: string;
  source: string;
  title: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  affectedAssets: string[];
  suggestedAction?: 'long' | 'short' | 'hedge' | 'wait';
  timestamp: Date;
}

export class SignalGenerator {
  async analyzeArticle(article: Article): Promise<NewsSignal | null> {
    // Simple keyword-based analysis (no ML required)
    const text = `${article.title} ${article.summary}`.toLowerCase();
    
    let sentimentScore = 0;
    let confidence = 0.5;
    const affectedAssets: string[] = [];
    
    // Check bullish keywords
    for (const word of this.keywords.bullish) {
      if (text.includes(word)) sentimentScore += 1;
    }
    
    // Check bearish keywords
    for (const word of this.keywords.bearish) {
      if (text.includes(word)) sentimentScore -= 1;
    }
    
    // Detect affected assets
    const assetKeywords = {
      'BTC': ['bitcoin', 'btc'],
      'ETH': ['ethereum', 'eth'],
      'SOL': ['solana', 'sol'],
      'POL': ['polymarket', 'prediction market'],
    };
    
    for (const [asset, keywords] of Object.entries(assetKeywords)) {
      if (keywords.some(k => text.includes(k))) {
        affectedAssets.push(asset);
      }
    }
    
    // Determine signal
    if (Math.abs(sentimentScore) < 2) return null; // Not strong enough
    
    const sentiment = sentimentScore > 0 ? 'bullish' : 'bearish';
    confidence = Math.min(0.5 + Math.abs(sentimentScore) * 0.1, 0.95);
    
    return {
      id: crypto.randomUUID(),
      source: article.source,
      title: article.title,
      sentiment,
      confidence,
      affectedAssets,
      suggestedAction: this.determineAction(sentiment, confidence, affectedAssets),
      timestamp: new Date()
    };
  }
}
```

---

## Configuration Files

### Environment Variables: `.env`
```bash
# Database
DB_USER=trader
DB_PASSWORD=your_secure_password_here
DB_NAME=trading_db

TSDB_USER=trader
TSDB_PASSWORD=your_secure_password_here
TSDB_NAME=market_data

# Redis
REDIS_PASSWORD=your_redis_password

# Grafana
GRAFANA_USER=admin
GRAFANA_PASSWORD=your_grafana_password

# APIs (Free tiers only)
POLYMARKET_API_KEY=optional_api_key
COINMARKETCAP_API_KEY=your_free_api_key
DEFILLAMA_API_KEY=optional

# Alerts
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_CHAT_ID=your_chat_id
EMAIL_SMTP_HOST=smtp.gmail.com
EMAIL_SMTP_USER=your_email@gmail.com
EMAIL_SMTP_PASS=your_app_password

# RPC Endpoints (Free public nodes)
ETH_RPC_URLS=https://eth.llamarpc.com,https://rpc.ankr.com/eth,https://ethereum.publicnode.com
POLYGON_RPC_URLS=https://polygon.llamarpc.com,https://rpc.ankr.com/polygon

# Trading (Paper trading mode by default)
TRADING_MODE=paper  # paper | live
MAX_POSITION_SIZE_USD=1000
MAX_DAILY_LOSS_USD=500
```

### Prometheus Config: `config/prometheus.yml`
```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - /etc/prometheus/rules/*.yml

alerting:
  alertmanagers:
    - static_configs:
        - targets: ['alertmanager:9093']

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres:9187']

  - job_name: 'redis'
    static_configs:
      - targets: ['redis:9121']

  - job_name: 'arbitrage'
    static_configs:
      - targets: ['arbitrage-engine:8080']
    metrics_path: /metrics

  - job_name: 'funding'
    static_configs:
      - targets: ['funding-farmer:8080']

  - job_name: 'whale-tracker'
    static_configs:
      - targets: ['whale-tracker:8080']

  - job_name: 'news'
    static_configs:
      - targets: ['news-scraper:8080']

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['host.docker.internal:9100']
```

---

## Installation & Setup

### Step 1: System Prerequisites
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
sudo apt install -y apt-transport-https ca-certificates curl gnupg lsb-release
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Install additional tools
sudo apt install -y git make jq sqlite3 postgresql-client redis-tools
```

### Step 2: Clone and Configure
```bash
# Clone repository
git clone https://github.com/yourusername/selfhosted-trading.git
cd selfhosted-trading

# Copy environment template
cp .env.example .env

# Edit configuration
nano .env

# Create required directories
mkdir -p logs/{arbitrage,funding,whale-tracker,news}
mkdir -p data/labels
mkdir -p config/{arbitrage,funding,whale-tracker,news,grafana}
```

### Step 3: Build and Start Services
```bash
# Build custom images
docker compose build

# Start infrastructure first
docker compose up -d postgres timescaledb redis

# Wait for databases to be ready
sleep 30

# Start monitoring
docker compose up -d prometheus grafana alertmanager

# Start trading services
docker compose up -d arbitrage-engine funding-farmer whale-tracker news-scraper

# View logs
docker compose logs -f
```

### Step 4: Verify Installation
```bash
# Check all services
docker compose ps

# Test database connection
docker compose exec postgres psql -U trader -d trading_db -c "SELECT 1;"

# Check Prometheus targets
curl -s http://localhost:9090/api/v1/targets | jq

# Access Grafana (default: admin/admin)
# http://localhost:3000
```

---

## Operating Costs Breakdown

### Monthly Operating Costs (Recommended Setup)

| Category | Item | Monthly Cost |
|----------|------|--------------|
| **Infrastructure** | | |
| | Power consumption (~150W) | $20-30 |
| | Internet (unmetered) | $0-50 |
| | VPS backup (optional) | $0-10 |
| **Data** | | |
| | Free RPC endpoints | $0 |
| | Free exchange APIs | $0 |
| | IPFS (optional, self-hosted) | $0 |
| **Monitoring** | | |
| | Self-hosted Grafana | $0 |
| | Self-hosted Prometheus | $0 |
| | Self-hosted AlertManager | $0 |
| **APIs** | | |
| | Polymarket API (free tier) | $0 |
| | CoinGecko API (free tier) | $0 |
| | DefiLlama API (free) | $0 |
| | News RSS feeds (free) | $0 |
| **Notifications** | | |
| | Telegram Bot API (free) | $0 |
| | Email (existing) | $0 |
| **TOTAL** | | **$20-90/month** |

### API Rate Limits (Free Tiers)

| Service | Free Tier Limit | Usage |
|---------|-----------------|-------|
| CoinGecko | 10-30 calls/min | Price data |
| DefiLlama | Unlimited | Protocol data |
| Polymarket | 100 req/min | Market data |
| Binance Futures | 1200 req/min | Funding rates |
| Bybit V5 | 120 req/min | Market data |
| LlamaNodes RPC | 10M calls/month | Blockchain data |
| Ankr RPC | Unlimited (rate limited) | Fallback |

---

## Monitoring & Alerting

### Grafana Dashboards

**1. System Overview Dashboard**
- CPU/Memory/Disk usage
- Network I/O
- Docker container health

**2. Trading Performance Dashboard**
- P&L by strategy
- Position sizes
- Trade frequency
- Win/loss ratio

**3. Market Data Dashboard**
- Funding rates across exchanges
- Price divergences
- Volume analysis

**4. Whale Activity Dashboard**
- Recent large transactions
- Address flow analysis
- Alert history

### Key Alerts (AlertManager)

```yaml
# config/alertmanager/alert_rules.yml
groups:
  - name: trading_alerts
    rules:
      - alert: HighDailyLoss
        expr: daily_pnl < -500
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High daily loss detected"
          
      - alert: ServiceDown
        expr: up == 0
        for: 1m
        labels:
          severity: warning
        annotations:
          summary: "Trading service is down"
          
      - alert: WhaleTransaction
        expr: whale_transaction_detected > 0
        labels:
          severity: info
        annotations:
          summary: "Large whale transaction detected"
          
      - alert: ArbitrageOpportunity
        expr: arbitrage_profit_percent > 1.0
        labels:
          severity: info
        annotations:
          summary: "High-profit arbitrage opportunity"
```

---

## Backup & Recovery

### Automated Backup Script: `scripts/backup.sh`
```bash
#!/bin/bash
BACKUP_DIR="/backup/trading-$(date +%Y%m%d)"
mkdir -p $BACKUP_DIR

# Backup databases
docker compose exec -T postgres pg_dump -U trader trading_db > $BACKUP_DIR/trading_db.sql
docker compose exec -T timescaledb pg_dump -U trader market_data > $BACKUP_DIR/market_data.sql

# Backup Redis
docker compose exec redis redis-cli BGSAVE
sleep 5
cp ./redis_data/dump.rdb $BACKUP_DIR/redis.rdb

# Backup configs
tar czf $BACKUP_DIR/configs.tar.gz ./config

# Upload to remote storage (optional)
# rclone sync $BACKUP_DIR remote:trading-backups

# Cleanup old backups (keep 7 days)
find /backup -name "trading-*" -mtime +7 -delete

echo "Backup complete: $BACKUP_DIR"
```

### Cron Setup
```bash
# Edit crontab
crontab -e

# Add backup job (daily at 2 AM)
0 2 * * * /home/trader/selfhosted-trading/scripts/backup.sh >> /var/log/trading-backup.log 2>&1

# Health check (every 5 minutes)
*/5 * * * * /home/trader/selfhosted-trading/scripts/health-check.sh
```

---

## Security Best Practices

### 1. Network Security
```bash
# UFW firewall rules
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP (nginx)
sudo ufw allow 443/tcp   # HTTPS (nginx)
sudo ufw enable

# Internal services only on localhost
# - PostgreSQL: 127.0.0.1:5432
# - Redis: 127.0.0.1:6379
# - Grafana: 127.0.0.1:3000
```

### 2. Secrets Management
```bash
# Use Docker secrets for production
mkdir -p secrets
echo "your_password" | docker secret create db_password -

# Or use environment files with restricted permissions
chmod 600 .env
chown $USER:$USER .env
```

### 3. Database Security
```sql
-- Create read-only user for monitoring
CREATE USER monitoring WITH PASSWORD 'monitor_pass';
GRANT CONNECT ON DATABASE trading_db TO monitoring;
GRANT USAGE ON SCHEMA public TO monitoring;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO monitoring;
```

---

## Scaling Considerations

### Phase 1: Single Machine (Current)
- All services on one host
- SQLite for simple data
- PostgreSQL for relational data
- TimescaleDB for time-series

### Phase 2: Multi-Machine (Future)
```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Trading Node  │────▶│   Database Node │◀────│  Monitoring Node│
│  (Strategies)   │     │  (TimescaleDB)  │     │  (Grafana)      │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### Phase 3: Local Archive Node (Optional)
- Add Erigon or Geth full node
- Self-sovereign blockchain access
- No external RPC dependency

---

## Troubleshooting

### Common Issues

**Issue:** PostgreSQL fails to start  
**Solution:**
```bash
docker compose down -v  # Remove volumes
docker compose up -d postgres  # Recreate
```

**Issue:** RPC rate limiting  
**Solution:**
```typescript
// Implement exponential backoff
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function withRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === retries - 1) throw err;
      await sleep(Math.pow(2, i) * 1000);
    }
  }
  throw new Error('Max retries exceeded');
}
```

**Issue:** Memory usage too high  
**Solution:**
```yaml
# docker-compose.yml - Add limits
services:
  arbitrage-engine:
    deploy:
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M
```

---

## Quick Reference

### Commands
```bash
# Start all services
docker compose up -d

# View logs
docker compose logs -f [service-name]

# Restart service
docker compose restart [service-name]

# Update images
docker compose pull && docker compose up -d

# Database shell
docker compose exec postgres psql -U trader -d trading_db

# Redis CLI
docker compose exec redis redis-cli

# Check disk usage
docker system df -v

# Cleanup
docker system prune -a
```

### Directory Structure
```
selfhosted-trading/
├── docker-compose.yml
├── .env
├── config/
│   ├── arbitrage/
│   ├── funding/
│   ├── whale-tracker/
│   ├── news/
│   ├── grafana/
│   ├── prometheus.yml
│   └── alertmanager.yml
├── services/
│   ├── arbitrage/
│   ├── funding/
│   ├── whale-tracker/
│   └── news/
├── scripts/
│   ├── backup.sh
│   └── health-check.sh
├── data/
│   └── labels/
└── logs/
```

---

## Resources & References

### Free Data Sources
- **Price Data:** CoinGecko, CoinMarketCap (free tiers)
- **On-Chain:** DefiLlama, Dune Analytics (public dashboards)
- **RPC:** LlamaNodes, Ankr, PublicNode
- **News:** RSS feeds, CryptoPanic (free tier)

### Open Source Tools
- **Node:** Geth, Erigon, Nethermind
- **Monitoring:** Prometheus, Grafana, Loki
- **Database:** PostgreSQL, TimescaleDB, Redis
- **Automation:** n8n (self-hosted alternative to Zapier)

### Documentation
- [Polymarket API Docs](https://docs.polymarket.com/)
- [Binance API Docs](https://binance-docs.github.io/apidocs/spot/en/)
- [Hyperliquid Docs](https://hyperliquid.gitbook.io/hyperliquid-docs/)
- [TimescaleDB Docs](https://docs.timescale.com/)

---

## Conclusion

This self-hosted trading system provides:
- ✅ **Zero SaaS dependencies** - Everything runs locally
- ✅ **<$100/month operating cost** - Minimal ongoing expenses
- ✅ **Full data sovereignty** - You own all your data
- ✅ **Extensible architecture** - Easy to add new strategies
- ✅ **Professional monitoring** - Self-hosted Grafana/Prometheus
- ✅ **Automated backups** - Data protection included

**Next Steps:**
1. Set up hardware (or use existing desktop)
2. Install Docker and dependencies
3. Clone and configure the system
4. Start with paper trading mode
5. Gradually transition to live trading

---

*Document Version: 1.0*  
*License: MIT*  
*Contributions welcome!*
