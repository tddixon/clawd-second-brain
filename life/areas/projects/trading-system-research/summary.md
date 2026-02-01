# Trading System Research

**Type:** projects
**Last Updated:** 2026-02-01

## Current Context

### Projects

- Launched comprehensive research project to build autonomous trading agent capable of generating profit and covering VPS/LLM costs. 10+ parallel research agents covering alpha sources, execution infrastructure, ML trading, alternative markets, backtesting, whale tracking, arbitrage engine, news trading, and trading infrastructure. (01/31/2026)
- Project must maintain profitability to afford VPS and LLM model running costs. Cannot afford drawdowns that threaten operation. Safety-first approach with circuit breakers at 2% daily and 5% weekly drawdown limits. (01/31/2026)
- Requirement: 4-stage validation pipeline (strategy development, robustness testing, market validation, capital deployment) with paper trading before live deployment. Monte Carlo stress testing (1000+ runs), CVaR for tail risk assessment. No deployment without statistical confidence of profitability. (01/31/2026)

### Integrations

- User specified system must be self-hosted and manageable by Clawd without expensive SaaS dependencies. Avoid QuickNode ($200/mo), Nansen ($1,200-12K/mo), and other paid APIs. Target: <$100/month total operating costs using local databases, free RPC endpoints, and free data tiers. (01/31/2026)
- Opportunity: APE funding rate arbitrage offering 104% annualized return. Buy APE spot, short perp futures. $500 minimum capital, generates ~$1.42/day income. Low-risk strategy suitable for initial revenue generation. (01/31/2026)

### General

- System must identify and execute opportunities faster than human traders. Sub-second arbitrage detection (<100ms detection, <500ms execution), 8-15 second whale copy-trading latency, sub-5 second news reaction. 24/7 automated operation with minimal human intervention. (01/31/2026)
- Opportunity: Ethena USDe synthetic dollar with 15.2% APY yield on stablecoins. Low-risk passive income opportunity suitable for covering baseline costs. Documented in RESEARCH-OPPORTUNITIES-NOW.md. (01/31/2026)
- Opportunity: Credit card and bank bonus arbitrage offering $500-1,500 per opportunity with low risk. Steady income source identified as complement to high-frequency trading strategies. (01/31/2026)
- Sub-agent currently designing self-hosted version of trading system with <$100/month costs, no QuickNode/Nansen dependencies, local databases, free RPC endpoints, Docker-based deployment. Document will be DESIGN-SELFHOSTED-TRADING.md. (01/31/2026)
- Crypto bot will use wallet + DEXs only, no centralized exchange concerns. DEX trading is globally accessible with no KYC or geographic restrictions (2026-01-31 14:51 UTC). (01/31/2026)

### Market

- Multiple research documents created: RESEARCH-POLYMARKET-TRADING.md, RESEARCH-CRYPTO-TRADING.md, RESEARCH-OPPORTUNITIES-NOW.md, DESIGN-WHALETRACKER.md, DESIGN-ARBITRAGE-ENGINE.md, RESEARCH-EXECUTION-INFRA.md, RESEARCH-ALPHA-SOURCES.md, DESIGN-NEWS-TRADING.md, RESEARCH-ML-TRADING.md, DESIGN-TRADING-INFRA.md, RESEARCH-ALTERNATIVE-MARKETS.md, RESEARCH-BACKTESTING-RISK.md. (01/31/2026)
- Pivoted from Polymarket trading to crypto DEX trading due to geographic restrictions - Polymarket not available in Thailand (2026-01-31 14:48 UTC). Will use Chainlink price feeds and DEX-based trading approach instead of prediction markets. (01/31/2026)

### Decisions

- Decision: Use simple ML models (Random Forest, XGBoost with 5-7 features) instead of complex deep learning. Reason: Simple models outperform complex ones in production, easier to validate and monitor, no expensive GPU infrastructure needed, aligns with self-hosted requirement. (01/31/2026)

## Recent Activity (Last 3 Months)

- **01/31/2026:** Launched comprehensive research project to build autonomous trading agent capable of generating profit and covering VPS/LLM costs. 10+ parallel research agents covering alpha sources, execution infrastructure, ML trading, alternative markets, backtesting, whale tracking, arbitrage engine, news trading, and trading infrastructure.
- **01/31/2026:** Project must maintain profitability to afford VPS and LLM model running costs. Cannot afford drawdowns that threaten operation. Safety-first approach with circuit breakers at 2% daily and 5% weekly drawdown limits.
- **01/31/2026:** User specified system must be self-hosted and manageable by Clawd without expensive SaaS dependencies. Avoid QuickNode ($200/mo), Nansen ($1,200-12K/mo), and other paid APIs. Target: <$100/month total operating costs using local databases, free RPC endpoints, and free data tiers.
- **01/31/2026:** System must identify and execute opportunities faster than human traders. Sub-second arbitrage detection (<100ms detection, <500ms execution), 8-15 second whale copy-trading latency, sub-5 second news reaction. 24/7 automated operation with minimal human intervention.
- **01/31/2026:** Opportunity: APE funding rate arbitrage offering 104% annualized return. Buy APE spot, short perp futures. $500 minimum capital, generates ~$1.42/day income. Low-risk strategy suitable for initial revenue generation.
- **01/31/2026:** Opportunity: Ethena USDe synthetic dollar with 15.2% APY yield on stablecoins. Low-risk passive income opportunity suitable for covering baseline costs. Documented in RESEARCH-OPPORTUNITIES-NOW.md.
- **01/31/2026:** Opportunity: Credit card and bank bonus arbitrage offering $500-1,500 per opportunity with low risk. Steady income source identified as complement to high-frequency trading strategies.
- **01/31/2026:** Multiple research documents created: RESEARCH-POLYMARKET-TRADING.md, RESEARCH-CRYPTO-TRADING.md, RESEARCH-OPPORTUNITIES-NOW.md, DESIGN-WHALETRACKER.md, DESIGN-ARBITRAGE-ENGINE.md, RESEARCH-EXECUTION-INFRA.md, RESEARCH-ALPHA-SOURCES.md, DESIGN-NEWS-TRADING.md, RESEARCH-ML-TRADING.md, DESIGN-TRADING-INFRA.md, RESEARCH-ALTERNATIVE-MARKETS.md, RESEARCH-BACKTESTING-RISK.md.
- **01/31/2026:** Decision: Use simple ML models (Random Forest, XGBoost with 5-7 features) instead of complex deep learning. Reason: Simple models outperform complex ones in production, easier to validate and monitor, no expensive GPU infrastructure needed, aligns with self-hosted requirement.
- **01/31/2026:** Requirement: 4-stage validation pipeline (strategy development, robustness testing, market validation, capital deployment) with paper trading before live deployment. Monte Carlo stress testing (1000+ runs), CVaR for tail risk assessment. No deployment without statistical confidence of profitability.

---

**Fact Summary:** 14 recent, 0 older, 0 historical
**Total Facts:** 14
