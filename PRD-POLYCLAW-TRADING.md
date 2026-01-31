# PolyClaw Autonomous Trading System - Product Requirements Document

## 1. Executive Summary

### Product Vision
Build a fully autonomous trading system that generates $100-200/week to cover VPS and LLM costs, with the ability to scale to $1,000+/week. The system combines PolyClaw's hedge discovery with speed optimizations from battle-tested trading bots.

### Success Metrics
| Metric | Phase 1 (Month 1) | Phase 2 (Month 2) | Phase 3 (Month 3+) |
|--------|-------------------|-------------------|-------------------|
| Weekly P&L | $50-100 | $100-200 | $500-1,000 |
| Win Rate | >55% | >60% | >65% |
| Max Drawdown | <10% | <15% | <20% |
| Uptime | >95% | >98% | >99% |

---

## 2. System Architecture

### 2.1 High-Level Components

```
┌─────────────────────────────────────────────────────────────┐
│                    AUTONOMOUS TRADING AGENT                 │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Alpha Discovery│  │ Risk Manager │  │ Execution    │      │
│  │              │  │              │  │ Engine       │      │
│  │ • PolyClaw   │  │ • Position   │  │ • PolyClaw   │      │
│  │ • AlphaPoly  │  │   limits     │  │ • CLOB orders│      │
│  │ • News feeds │  │ • Daily/weekly│  │ • Gas opt    │      │
│  │ • Whale watch│  │   loss limits│  │ • MEV protect│      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                 │                 │              │
│         └─────────────────┼─────────────────┘              │
│                           ▼                                │
│              ┌──────────────────────┐                     │
│              │   Portfolio Manager  │                     │
│              │ • Position tracking  │                     │
│              │ • P&L calculation    │                     │
│              │ • Rebalancing        │                     │
│              └──────────────────────┘                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      DATA & MONITORING                      │
├─────────────────────────────────────────────────────────────┤
│  PostgreSQL  │  TimescaleDB  │  Redis  │  Grafana/Prometheus│
│  (trades)    │  (prices)     │  (cache)│  (monitoring)     │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Core Strategies

| Strategy | Source | Frequency | Capital Allocation | Expected Return |
|----------|--------|-----------|-------------------|-----------------|
| **Combinatorial Arb** | PolyClaw hedge scan | Hourly | 40% | 15-30% APY |
| **Funding Rate Farming** | Hyperliquid | Daily | 30% | 20-60% APY |
| **Whale Copy Trading** | Kuru patterns | Real-time | 20% | Variable |
| **Grid Trading** | Hyperliquid bot | Continuous | 10% | 10-20% APY |

---

## 3. Functional Requirements

### 3.1 Alpha Discovery Module

**FR-1.1: PolyClaw Integration**
- Execute `hedge scan` every 60 minutes
- Parse T1/T2/T3 coverage tiers
- Filter by minimum 3% expected profit
- Cache results for 30 minutes

**FR-1.2: AlphaPoly Dashboard**
- Web UI for visual opportunity monitoring
- Multi-market portfolio correlation analysis
- Real-time P&L visualization
- Manual override capabilities

**FR-1.3: News Monitoring**
- RSS feeds from CoinDesk, TheBlock, Polymarket blog
- Twitter/X monitoring (free API tier)
- Keyword alerts for market-moving events
- NLP sentiment scoring (optional)

**FR-1.4: Whale Tracking**
- Monitor 5-10 pre-configured smart money addresses
- WebSocket `eth_subscribe` for real-time detection
- 8-15 second latency from whale trade → our execution
- Performance tracking per whale

### 3.2 Risk Management Module

**FR-2.1: Position Limits**
- Max $100 per individual trade
- Max $500 total exposure per strategy
- Max 10 trades per day
- Max 3 concurrent positions per market

**FR-2.2: Loss Limits**
- Daily max loss: $20 (circuit breaker)
- Weekly max loss: $100 (circuit breaker)
- Auto-pause trading when limits hit
- Manual reset required to resume

**FR-2.3: Profit Taking**
- Take profit at 5% (configurable)
- Stop loss at 3% (configurable)
- Time-based exits (max 7 days hold)
- Trailing stops for trending positions

**FR-2.4: Correlation Management**
- Track exposure across related markets
- Prevent over-concentration in single event
- Diversify across uncorrelated opportunities

### 3.3 Execution Engine

**FR-3.1: Order Types**
- Limit orders only (no market orders)
- Post-only flag (maker fees)
- IOC (Immediate or Cancel) for urgent fills
- GTC (Good Till Canceled) for passive orders

**FR-3.2: Speed Optimizations**
- Cached blockhash with 5-second background updates
- Pre-computed transaction calldata
- Connection pooling to RPC nodes
- Skip preflight for known transactions

**FR-3.3: Gas Optimization**
- EIP-1559 dynamic fee estimation
- Priority fee adjustment based on urgency
- MEV protection via Flashbots Protect
- Batch transactions when possible

**FR-3.4: RPC Management**
- Multi-provider failover (LlamaNodes, Ankr, PublicNode)
- Auto-switch on latency >2x baseline
- Regional optimization (Singapore for Thailand)
- Success rate monitoring (>99% target)

### 3.4 Portfolio Management

**FR-4.1: Position Tracking**
- Real-time P&L calculation
- Entry price, current price, unrealized P&L
- Fees and gas costs tracking
- Historical trade logging

**FR-4.2: Reporting**
- Daily P&L summary at 9 PM UTC
- Weekly performance report
- Monthly strategy performance analysis
- Telegram alerts for significant events

**FR-4.3: Rebalancing**
- Automatic profit reinvestment
- Capital allocation adjustments based on performance
- Strategy rotation (pause underperforming, scale winners)

---

## 4. Non-Functional Requirements

### 4.1 Performance

| Metric | Requirement |
|--------|-------------|
| Hedge scan latency | <2 minutes for 20 markets |
| Whale detection → execution | <15 seconds |
| Order submission latency | <500ms |
| System uptime | >99% |
| Database query time | <100ms for position queries |

### 4.2 Security

- Private keys stored in environment variables only
- No key logging or transmission
- Hardware wallet support (optional)
- Multi-sig for large withdrawals (optional)
- Regular security audits

### 4.3 Reliability

- Graceful degradation on RPC failure
- Automatic restart on crash
- Data persistence with daily backups
- Paper trading mode for testing

### 4.4 Observability

- Structured logging (JSON format)
- Prometheus metrics export
- Grafana dashboards
- Telegram alerts
- PagerDuty integration (optional)

---

## 5. Technical Stack

### 5.1 Core Technologies

| Component | Technology | Version |
|-----------|------------|---------|
| Runtime | Python | 3.12+ |
| Async Framework | asyncio + uvloop | Latest |
| Database | PostgreSQL + TimescaleDB | 15+ |
| Cache | Redis | 7+ |
| Monitoring | Prometheus + Grafana | Latest |
| Container | Docker + Docker Compose | Latest |

### 5.2 External APIs

| Service | Purpose | Cost |
|---------|---------|------|
| PolyClaw | Hedge discovery, execution | Free |
| AlphaPoly | Visual dashboard | Free |
| Chainstack RPC | Polygon node access | Free tier |
| OpenRouter | LLM for hedge analysis | ~$0.01/scan |
| CoinGecko | Price feeds | Free tier |
| DefiLlama | Protocol metrics | Free |

### 5.3 Infrastructure

- **Minimum**: Single VPS (4GB RAM, 2 vCPU)
- **Recommended**: Dedicated server (8GB RAM, 4 vCPU)
- **Operating System**: Ubuntu 22.04 LTS
- **Deployment**: Docker Compose
- **Backup**: Daily automated backups to S3 or local

---

## 6. User Interface

### 6.1 Command Line Interface

```bash
# Start the autonomous agent
./scripts/polyclaw-agent.py start

# Check status
./scripts/polyclaw-agent.py status

# View positions
./scripts/polyclaw-agent.py positions

# Force hedge scan
./scripts/polyclaw-agent.py scan

# Emergency stop
./scripts/polyclaw-agent.py stop
```

### 6.2 Web Dashboard (AlphaPoly)

- URL: http://localhost:3000
- Real-time opportunity feed
- Position P&L tracking
- Historical performance charts
- Manual trade entry (optional)

### 6.3 Telegram Bot

- Daily P&L summaries
- Trade execution alerts
- Risk limit warnings
- Manual approval requests for large trades

---

## 7. Development Phases

### Phase 1: Foundation (Week 1)
**Goal**: Paper trading with basic functionality

- [ ] Install PolyClaw and AlphaPoly
- [ ] Set up database and monitoring
- [ ] Implement basic hedge scanning
- [ ] Paper trading mode
- [ ] Telegram alerts

**Deliverables**:
- Working paper trading system
- Daily P&L reports
- 0 risk exposure

### Phase 2: Live Trading (Week 2-3)
**Goal**: Live trading with $500 capital

- [ ] Wallet setup and funding
- [ ] Live trading mode
- [ ] Risk management circuit breakers
- [ ] Performance optimization
- [ ] First profitable week

**Deliverables**:
- $50-100/week profit target
- <5% max drawdown
- >95% uptime

### Phase 3: Scaling (Week 4-8)
**Goal**: Scale to $2,000 capital

- [ ] Add funding rate farming
- [ ] Implement whale copy trading
- [ ] Multi-strategy coordination
- [ ] Advanced monitoring
- [ ] $100-200/week profit

**Deliverables**:
- 4 active strategies
- Automated rebalancing
- Full observability

### Phase 4: Optimization (Month 3+)
**Goal**: Institutional-grade system

- [ ] Speed optimizations (<100ms execution)
- [ ] MEV protection
- [ ] Multi-region deployment
- [ ] Advanced ML signals
- [ ] $500+/week profit

**Deliverables**:
- Sub-second execution
- 99.9% uptime
- Self-healing infrastructure

---

## 8. Risk Assessment

### 8.1 Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| RPC failure | Medium | High | Multi-provider failover |
| Smart contract bug | Low | Critical | Use audited contracts only |
| System crash | Low | Medium | Auto-restart, backups |
| Latency spikes | Medium | Medium | Cached data, regional optimization |

### 8.2 Market Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Strategy stops working | Medium | High | Multiple strategies, continuous monitoring |
| Black swan event | Low | Critical | Circuit breakers, max loss limits |
| Liquidity dries up | Medium | Medium | Position size limits, exit strategies |
| Regulatory changes | Low | Medium | Diversify across jurisdictions |

### 8.3 Operational Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Key compromise | Low | Critical | Hardware wallets, minimal hot wallet balance |
| Configuration error | Medium | High | Validation, paper trading first |
| API rate limits | Medium | Low | Free tier monitoring, caching |

---

## 9. Success Criteria

### 9.1 Minimum Viable Product (Phase 1)
- [ ] Paper trading profitable for 7 days
- [ ] <5% max drawdown
- [ ] >95% uptime
- [ ] Automated daily reporting

### 9.2 Product-Market Fit (Phase 2)
- [ ] Live trading profitable for 14 days
- [ ] $50-100/week profit
- [ ] >55% win rate
- [ ] No manual intervention required

### 9.3 Scale (Phase 3)
- [ ] $100-200/week profit
- [ ] >60% win rate
- [ ] <10% max drawdown
- [ ] Self-funding (covers VPS + LLM costs)

---

## 10. Appendices

### Appendix A: Glossary

- **CLOB**: Central Limit Order Book
- **CTF**: Conditional Token Framework (Polymarket)
- **P&L**: Profit and Loss
- **APY**: Annual Percentage Yield
- **MEV**: Miner Extractable Value
- **PDA**: Program Derived Address

### Appendix B: References

1. PolyClaw Documentation: https://github.com/chainstacklabs/polyclaw
2. AlphaPoly Repository: https://github.com/chainstacklabs/polymarket-alpha-bot
3. PumpFun Bot Analysis: `/home/desktop/clawd/ANALYSIS-PUMPFUN-BOT.md`
4. Hyperliquid Bot Analysis: `/home/desktop/clawd/ANALYSIS-HYPERLIQUID-BOT.md`
5. Kuru Copy Bot Analysis: `/home/desktop/clawd/ANALYSIS-KURU-COPYBOT.md`

### Appendix C: Task Tracker

See: `/home/desktop/clawd/PROJECT-TASKS.md`

---

**Document Version**: 1.0  
**Last Updated**: 2026-01-31  
**Owner**: Trevor / Clawd  
**Status**: Draft
