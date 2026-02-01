# Self-Improving Hyperliquid Trading Agent Strategy
## Comprehensive Architecture & Implementation Guide

**Document Version:** 1.0  
**Date:** 2025-01-31  
**Research Sources:** 10+ GitHub repositories, industry best practices, alpha sources

---

## Executive Summary

This document outlines a complete architecture for a self-improving trading agent on Hyperliquid that combines AI-driven decision-making, robust risk management, and continuous learning from wins/losses. The agent leverages market flow signals, sentiment analysis, technical indicators, and a sophisticated self-improvement loop to maximize profits while minimizing losses.

**Core Principles:**
- **Survival First**: Strict risk management guardrails prevent catastrophic losses
- **Adaptive Intelligence**: Multi-model consensus with dynamic model switching
- **Market-Aware Trading**: Trade only when market structure shifts (not 24/7 noise)
- **Continuous Learning**: Every trade feeds into the decision engine for improvement
- **News & Alpha Integration**: Real-time sentiment, narrative detection, and macro monitoring

---

## Part 1: Repository Analysis

### 1.1 HammerGPT/Hyper-Alpha-Arena
**Pattern:** Dual-engine platform with market flow signal monitoring

**Key Features:**
- **Two Trading Modes:**
  - AI Trader: Strategies requiring market understanding (news, sentiment)
  - Program Trader: Fixed-rule strategies (technical indicators, Python code)
- **Market Flow Signal Monitoring**: Triggers only when market structure changes (order flow imbalance, OI surges, funding rate extremes)
- **Trade Attribution Analytics**: Performance breakdown by symbol, trigger type, time period
- **Multi-Account Comparison**: Real-time asset curve comparison across AI traders
- **AI-Assisted Configuration**: Conversational AI generators help configure strategies

**Best Practices Extracted:**
✓ Don't trade 24/7 - wait for market structure shifts  
✓ Separate AI Trader (market understanding) from Program Trader (rules-based)  
✓ Use attribution analytics to identify weaknesses  
✓ Compare strategies side-by-side in real-time  
✓ AI-assisted configuration reduces barrier to entry  

---

### 1.2 hyperliquid-ai-trading-bot
**Pattern:** Autonomous AI with single-model and multi-model environments

**Key Features:**
- **Single-Model Trading Agents**: Each bot uses one AI model (GPT, DeepSeek, Qwen) operating in isolation
- **Multi-Model Environment**: Cooperative AI system where models specialize (news, technicals, on-chain, risk)
- **Intelligent Risk Management**: Smart-RR, Drawdown Shield, Volatility Monitor, Session Cooldown
- **Auto Model Switching**: Dynamically switches models based on performance or market conditions
- **Trader Journal**: Detailed logs, PnL analysis, performance charts, PDF/HTML reports

**Best Practices Extracted:**
✓ Multi-model consensus vs. single-model isolation  
✓ Dynamic model switching for self-adaptation  
✓ Drawdown Shield (pause trading at -10%)  
✓ Volatility Monitor (reduce position size in extreme volatility)  
✓ Session Cooldown (prevent over-trading)  

---

### 1.3 molt-bot/openclaw-trading-assistant
**Pattern:** Alpha Arena integration with sentiment analysis and self-improvement

**Key Features:**
- **Alpha Arena Core**: Winning heuristics from nof1.ai experiment
- **"1-2% Rule" Hard-Lock**: Bot cannot open position >2% of equity
- **Semantic Sentiment & "Trump-Tracker"**: X (Twitter) monitoring with SLM filtering (Noise/FUD/Alpha)
- **Self-Improving Strategy Loop**: 
  - Automated post-mortem on every closed trade
  - Dynamic strategy scoring (wins weighted higher, losses deprecated)
  - RAG-based memory queries to avoid repeating mistakes
- **Agentic Collaboration**: Two-way strategy debates between user and bot
- **Non-Custodial Security**: Local key storage, human-in-the-loop mode

**Best Practices Extracted:**
✓ Hard-coded risk limits (1-2% max position size) override LLM hallucinations  
✓ Trend-following constraint ("Don't Catch Knives" - only trade aligned with HTF MAs)  
✓ SLM-based noise filtering for social sentiment  
✓ Bench failing strategies after 3 consecutive losses  
✓ RAG-based historical pattern recognition  

---

### 1.4 rz0718/hyperliquid-monitor
**Pattern:** Real-time position monitoring with notifications

**Key Features:**
- **Real-Time Monitoring**: WebSocket for instant updates
- **Position Tracking**: New positions, updates, closures
- **Trade Alerts**: Detailed notifications on executions
- **Slack Integration**: Formatted alerts
- **Web Dashboard**: Monitoring status

**Best Practices Extracted:**
✓ WebSocket > Polling for real-time data  
✓ Multi-address monitoring for copy-trading  
✓ Automated notifications on position changes  
✓ Web dashboard for at-a-glance status  

---

### 1.5 NoFxAiOS/nofx
**Pattern:** Open source AI trading OS with multi-AI support

**Key Features:**
- **Multi-AI Support**: DeepSeek, Qwen, GPT, Claude, Gemini, Grok, Kimi - switch anytime
- **Multi-Exchange**: Binance, Bybit, OKX, Bitget, KuCoin, Gate, Hyperliquid, Aster DEX, Lighter
- **Strategy Studio**: Visual strategy builder with coin sources, indicators, risk controls
- **AI Debate Arena**: Multiple AI models debate with different roles (Bull, Bear, Analyst)
- **AI Competition Mode**: Real-time performance comparison
- **Web-Based Config**: No JSON editing required

**Best Practices Extracted:**
✓ Multi-AI debate for consensus decisions  
✓ Visual strategy builder for accessibility  
✓ Competition mode for A/B testing models  
✓ Web-based configuration reduces errors  

---

### 1.6 openclaw/skills/hyperliquid-trading
**Pattern**: Momentum scalping with market analysis tools

**Key Features:**
- **Chart Data with Volume**: Historical price action via CoinGecko
- **Momentum Detection**: Automated signals (strong bull/bear/neutral)
- **Volume Analysis**: Compare current vs average volume
- **Multi-Timeframe**: 1-hour and 6-hour trend analysis
- **228+ Assets**: Trade any perpetual on Hyperliquid
- **Strategy**: 
  - Entry: Price move >0.5% + Volume >1.5x average
  - Position size: 10% of account
  - Exit: +2% profit target or -1% stop loss

**Best Practices Extracted:**
✓ Volume confirmation for momentum entries  
✓ Multi-timeframe analysis (1h + 6h trends)  
✓ Clear entry/exit thresholds  
✓ Risk/reward ratio of 2:1 (2% target, 1% stop)  
✓ Max hold time: 4 hours (prevents stale positions)  

---

### 1.7 cryptole0/Hyperliquid-market-making-bot
**Pattern**: Market making for liquidity provision

**Key Features:**
- **Automated Market Making**: Continuous bid/ask quotes with configurable spread
- **Real-Time Order Book Monitoring**: WebSocket integration
- **Position Management**: Automatic position tracking
- **Telegram Notifications**: Real-time alerts and control

**Best Practices Extracted:**
✓ Continuous market making for passive income  
✓ Configurable spread and order size  
✓ Position size limits for risk control  
✓ Telegram for remote monitoring/control  

---

### 1.8 chainstacklabs/hyperliquid-trading-bot
**Pattern**: Grid trading with configurable risk management

**Key Features:**
- **Grid Trading**: Buy low, sell high in defined price ranges
- **Exit Strategies**: 
  - Stop loss (1-20%)
  - Take profit (5-100%)
  - Max drawdown (5-50%)
  - Max position size (10-100%)
  - Grid rebalancing
- **YAML Configuration**: Clear parameter documentation
- **Learning Examples**: Educational scripts for API mastery

**Best Practices Extracted:**
✓ Multiple exit strategies (position-level + account-level)  
✓ Grid rebalancing when price moves outside range  
✓ Conservative parameters for testing (10% allocation, ±5% range)  
✓ YAML config for readability  

---

### 1.9 BankrBot/openclaw-skills
**Pattern**: Skills repository for modular functionality

**Best Practices Extracted:**
✓ Modular skill architecture for extensibility  
✓ Community contributions for rapid iteration  
✓ Standardized SKILL.md format  

---

## Part 2: Best Practices for Hyperliquid Trading Bots

### 2.1 Risk Management (NON-NEGOTIABLE)

**Position Sizing:**
- **Hard Limit**: Max 1-2% of equity per position (openclaw's "1-2% Rule")
- **Default**: 10% of account per trade (anajuliabit skill) - more aggressive but with tight stops
- **Model Decision**: Dynamic based on volatility (reduce size in extreme conditions)

**Stop Loss & Take Profit:**
- **Default RR Ratio**: 2:1 (2% target, 1% stop - anajuliabit)
- **Configurable**: 1-20% stop loss, 5-100% take profit (chainstack)
- **Dynamic**: Set based on ATR (Average True Range) for volatility-adjusted stops

**Account-Level Protection:**
- **Drawdown Shield**: Pause trading at -10% account drawdown (hyperliquid-ai-bot)
- **Max Drawdown**: Stop trading at 5-50% account loss (chainstack)
- **Daily Loss Limit**: Configurable (e.g., 5% daily max loss)

**Position Limits:**
- **Max Positions**: 1-3 simultaneous positions (focus capital, manage attention)
- **Max Position Size**: 40% of account (chainstack default)
- **Leverage Cap**: 10x maximum (never exceed - hyperliquid-ai-bot)

### 2.2 Market Timing Strategies

**Market Structure Signals (Hyper-Alpha-Arena):**
Trade ONLY when these trigger:

1. **Order Flow Imbalance**: 
   - Large buy/sell walls appearing/disappearing
   - Aggressive taker volume in one direction
   - Bid/ask spread compression

2. **Open Interest (OI) Surges**:
   - Sudden OI increase (>20% in 1h) = new money entering
   - OI decrease with price moving opposite direction = liquidation cascade

3. **Funding Rate Extremes**:
   - Funding rate >0.1% = Long overcrowding → potential reversal
   - Funding rate < -0.1% = Short overcrowding → potential reversal

**Multi-Timeframe Confirmation:**
- **1h Trend**: Current short-term momentum
- **4h/6h Trend**: Medium-term direction (anajuliabit uses 6h)
- **Daily Trend**: Long-term bias

**Volume Confirmation:**
- Current volume >1.5x average volume (anajuliabit)
- Volume + price move >0.5% (anajuliabit entry signal)

### 2.3 Entry & Exit Rules

**Entry Criteria (All must be met):**
1. Market structure signal triggered (OR high-conviction news event)
2. Volume >1.5x average
3. Price move >0.5% in 15-30 minutes
4. Aligned with higher timeframe trend (Don't Catch Knives rule)
5. Clear directional bias (not choppy/ranging)

**Exit Criteria (Any one triggers):**
1. Take profit hit (+2% default)
2. Stop loss hit (-1% default)
3. Momentum dies (volume drops below average, no price movement)
4. Max hold time reached (4 hours default)
5. Market structure reverses (exit signal)

**Trailing Stops (Advanced):**
- Lock in 50% of profit at +1.5% move
- Move stop to breakeven at +2% move
- Trail 50% of unrealized profit thereafter

### 2.4 Security Best Practices

**Key Management:**
- Local encrypted storage (AES-256)
- Never hardcode keys in code
- Use environment variables or encrypted vaults
- Separate testnet and mainnet wallets

**Execution Safety:**
- Slippage protection (5% limit buffer on market orders - anajuliabit)
- Position size validation (minimum order size checks)
- Testnet mandatory before mainnet
- Human-in-the-loop for large trades (user approval required)

**Data Privacy:**
- No cloud calls except trading API
- All sentiment/data processing local
- Secure Slack/Telegram webhooks

---

## Part 3: News & Alpha Sources

### 3.1 Primary Alpha Sources

**Social Sentiment (Real-Time):**
- **X (Twitter)**: High-impact accounts (POTUS, Elon Musk, macroeconomists)
- **Reddit**: r/CryptoCurrency, r/Bitcoin, r/ethereum
- **Telegram**: Alpha groups, trading signal channels
- **Discord**: Community servers, project announcements

**Processing Pipeline:**
1. **SLM Filtering**: Classify tweets as Noise/FUD/Alpha (openclaw)
2. **Trump Tracker**: Specific weight for Trump posts (tariffs/crypto mentions)
3. **Vibe Watcher**: Continuous scanning of high-impact accounts
4. **Narrative Detection**: Identify emerging themes (e.g., "DeFi resurgence")

**Tools & APIs:**
- **LunarCrush**: Social intelligence, market sentiment, galaxy scores
- **CoinGecko**: Market data, volume, historical prices (anajuliabit uses)
- **CryptoCompare**: Social stats, trading signals
- **Messari**: Research reports, quarterly reviews

### 3.2 News Sources

**Major Crypto News:**
- **CoinDesk**: Industry news, institutional coverage
- **The Block**: Deep-dive reporting, exchange news
- **Crypto Briefing**: Market analysis, project reviews
- **Decrypt**: Consumer-focused crypto news

**Macro Economic:**
- **Bloomberg**: Federal Reserve, treasury yields
- **Reuters**: Global macro events, geopolitical developments
- **WSJ**: Economic indicators, market-moving news

**On-Chain Data:**
- **Nansen**: Wallet tracking, smart money flows
- **Arkham Intelligence**: Exchange inflows/outflows
- **Dune Analytics**: Custom dashboards, protocol metrics
- **Glassnode**: Market cycles, HODLer behavior

### 3.3 Signal Integration Strategy

**Multi-Model AI Analysis (hyperliquid-ai-bot):**
- **Model A (News)**: Analyzes news and market sentiment
- **Model B (Technical)**: Evaluates technical indicators
- **Model C (On-Chain)**: Monitors liquidity flows and wallet activity
- **Model D (Risk)**: Manages risk and capital allocation
- **Consensus**: All models debate and vote on final action

**Confidence Scoring:**
- **High Confidence (≥80%)**: All models agree + market structure signal + volume confirmation
- **Medium Confidence (60-79%)**: Most models agree + at least one technical signal
- **Low Confidence (<60%)**: Conflicting signals → NO TRADE

---

## Part 4: Trading Agent Architecture

### 4.1 System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     USER INTERFACE LAYER                         │
│  • Web Dashboard (NOFX-style)                                    │
│  • Telegram/Slack Notifications (rz0718)                         │
│  • Voice/Chat Commands (openclaw)                                │
└─────────────────────────────┬───────────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────────┐
│                  DECISION ENGINE (AI Core)                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Multi-Model Consensus System                             │  │
│  │  • News/Sentiment Model (GPT/Claude)                     │  │
│  │  • Technical Model (DeepSeek)                            │  │
│  │  • On-Chain Model (Qwen)                                  │  │
│  │  • Risk Manager Model (Specialized)                      │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Strategy Scoring & Self-Improvement Loop                 │  │
│  │  • Dynamic strategy weighting                            │  │
│  │  • RAG-based historical pattern recognition               │  │
│  │  • Post-trade analysis & feedback                         │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────┬───────────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────────┐
│                  MARKET INTELLIGENCE LAYER                       │
│  ┌─────────────────────┬─────────────────────┬──────────────┐  │
│  │  Market Structure   │  Sentiment Analysis │  On-Chain    │  │
│  │  Signals            │  (Twitter/Reddit)   │  Monitoring  │  │
│  │                     │                     │              │  │
│  │  • Order Flow       │  • SLM Filtering    │  • Wallet    │  │
│  │  • OI Changes       │  • Trump Tracker    │    Tracking  │  │
│  │  • Funding Rate     │  • Vibe Watcher     │  • Exchange  │  │
│  │  • CVD              │  • Narrative Detect│    Flows     │  │
│  └─────────────────────┴─────────────────────┴──────────────┘  │
└─────────────────────────────┬───────────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────────┐
│                  RISK MANAGEMENT LAYER                           │
│  • Position Sizing (1-2% hard limit)                             │
│  • Stop Loss / Take Profit (2:1 RR ratio)                       │
│  • Drawdown Shield (-10% account pause)                          │
│  • Volatility Monitor (adjust position size)                    │
│  • Position Limits (max 3 concurrent)                            │
└─────────────────────────────┬───────────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────────┐
│                  TRADING ENGINE                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Order Management                                         │  │
│  │  • Market Orders (with 5% slippage protection)           │  │
│  │  • Limit Orders                                          │  │
│  │  • Order Cancellation                                     │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Position Management                                     │  │
│  │  • Real-time P&L tracking                                │  │
│  │  • Trailing stops                                        │  │
│  │  • Position monitoring                                   │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────┬───────────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────────┐
│                  EXECUTION LAYER                                  │
│  • Hyperliquid API (REST + WebSocket)                            │
│  • Official Hyperliquid SDK                                     │
│  • Testnet Sandbox (mandatory testing)                         │
│  • Mainnet Execution (live trading)                            │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                  LOGGING & ANALYTICS LAYER                        │
│  • Trade Journal (full logs with timestamps)                     │
│  • Performance Metrics (ROI, Sharpe, Win Rate, Max DD)          │
│  • Attribution Analytics (by symbol, trigger, time)              │
│  • AI Diagnosis (identify weaknesses)                           │
│  • Reports (PDF/HTML, Telegram alerts)                           │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Component Specifications

#### Decision Engine (AI Core)

**Multi-Model Architecture:**
```python
class DecisionEngine:
    def __init__(self):
        self.news_model = GPT4()  # News/Sentiment analysis
        self.technical_model = DeepSeek()  # Technical indicators
        self.onchain_model = Qwen()  # On-chain flows
        self.risk_model = Claude()  # Risk management
        
    def make_decision(self, market_data, sentiment, onchain_data):
        # Each model analyzes and votes
        votes = {
            self.news_model.analyze(sentiment),
            self.technical_model.analyze(market_data),
            self.onchain_model.analyze(onchain_data),
            self.risk_model.evaluate(market_data)
        }
        
        # Consensus calculation
        confidence = self.calculate_confidence(votes)
        
        if confidence >= 0.8:
            return self.execute_trade(votes)
        elif confidence >= 0.6:
            return self.execute_small_trade(votes)
        else:
            return self.hold()
```

**Strategy Scoring System:**
```python
class StrategyScorer:
    def __init__(self):
        self.strategies = {}  # {strategy_name: weight}
        
    def update_weights(self, trade_result):
        """Update strategy weights based on trade outcome"""
        strategy = trade_result.strategy
        outcome = trade_result.outcome  # WIN or LOSS
        
        if outcome == WIN:
            self.strategies[strategy] *= 1.2  # Increase weight by 20%
        else:
            self.strategies[strategy] *= 0.8  # Decrease weight by 20%
            
            # Bench strategy if 3 consecutive losses
            if self.strategies[strategy].consecutive_losses >= 3:
                self.strategies[strategy].active = False
                
    def get_best_strategy(self, market_conditions):
        """Return highest-weighted active strategy"""
        active = {k: v for k, v in self.strategies.items() if v.active}
        return max(active, key=active.get)
```

#### Market Intelligence Layer

**Market Structure Signals (Hyper-Alpha-Arena):**
```python
class MarketStructureSignals:
    def monitor(self):
        signals = []
        
        # Order Flow Imbalance
        if self.detect_order_flow_imbalance():
            signals.append("ORDER_FLOW_IMBALANCE")
            
        # OI Surge
        if self.detect_oi_surge(threshold=0.2):  # 20% increase
            signals.append("OI_SURGE")
            
        # Funding Rate Extreme
        if self.funding_rate > 0.001:  # >0.1%
            signals.append("FUNDING_RATE_LONG_OVERFLOW")
        elif self.funding_rate < -0.001:  # <-0.1%
            signals.append("FUNDING_RATE_SHORT_OVERFLOW")
            
        return signals
```

**Sentiment Analysis (openclaw):**
```python
class SentimentAnalyzer:
    def __init__(self):
        self.slm = LocalSLM()  # Small Language Model for filtering
        
    def analyze_tweet(self, tweet):
        classification = self.slm.classify(tweet.text)
        
        if classification == "ALPHA":
            self.alpha_tweets.append(tweet)
        elif classification == "FUD":
            self.fud_score += tweet.impact
            
    def get_trump_weight(self):
        """Special handling for Trump's posts"""
        trump_tweets = [t for t in self.alpha_tweets if t.author == "realDonaldTrump"]
        return sum(t.impact for t in trump_tweets)
```

#### Risk Management Layer

**Position Sizing:**
```python
class PositionSizer:
    def calculate_size(self, equity, volatility, confidence):
        base_size = 0.02  # 2% of equity (hard max from openclaw)
        
        # Reduce size in high volatility
        if volatility > 2 * self.avg_volatility:
            base_size *= 0.5
            
        # Reduce size for low confidence
        if confidence < 0.8:
            base_size *= 0.7
            
        return base_size * equity
```

**Drawdown Shield:**
```python
class DrawdownShield:
    def check(self, current_equity, peak_equity):
        drawdown = (peak_equity - current_equity) / peak_equity
        
        if drawdown >= 0.10:  # 10% drawdown
            self.pause_trading()
            self.notify_user("Drawdown Shield triggered: 10% account drawdown")
            
        elif drawdown >= 0.05:  # 5% drawdown warning
            self.notify_user("Warning: 5% account drawdown")
```

#### Trading Engine

**Order Execution:**
```python
class OrderExecutor:
    def market_buy(self, symbol, size, slippage_protection=0.05):
        """Market buy with slippage protection (anajuliabit style)"""
        current_price = self.get_price(symbol)
        limit_price = current_price * (1 + slippage_protection)
        
        return self.place_order(
            type="MARKET",
            side="BUY",
            symbol=symbol,
            size=size,
            limit_price=limit_price  # Acts as slippage protection
        )
    
    def set_stop_loss(self, position, stop_pct=0.01):
        """Set 1% stop loss (anajuliabit style)"""
        if position.side == "LONG":
            stop_price = position.entry_price * (1 - stop_pct)
        else:
            stop_price = position.entry_price * (1 + stop_pct)
            
        return self.place_order(
            type="STOP_MARKET",
            side=position.opposite_side(),
            symbol=position.symbol,
            size=position.size,
            stop_price=stop_price
        )
```

---

## Part 5: Self-Improvement Loop

### 5.1 Post-Trade Analysis

**Automated Post-Mortem (openclaw):**
```python
class PostMortem:
    def analyze_trade(self, trade):
        # Expected vs Actual
        expected = trade.expected_outcome
        actual = trade.actual_outcome
        
        # Reasoning chain evaluation
        reasoning = trade.reasoning_chain
        outcome = trade.outcome  # WIN or LOSS
        
        # Update strategy score
        self.strategy_scorer.update(trade)
        
        # Store in RAG database
        self.rag.store(
            pattern=trade.market_pattern,
            reasoning=reasoning,
            outcome=outcome
        )
        
        # Check for 3 consecutive losses (bench strategy)
        if self.strategy_scorer.consecutive_losses(trade.strategy) >= 3:
            self.strategy_scorer.bench(trade.strategy)
```

### 5.2 RAG-Based Memory

**Historical Pattern Recognition:**
```python
class RAGMemory:
    def query_similar_trades(self, current_market_state):
        """Find similar historical patterns to avoid repeating mistakes"""
        similar = self.vector_db.search(
            query=current_market_state,
            k=5,  # Top 5 most similar
            filters={"outcome": "LOSS"}  # Focus on losses
        )
        
        warnings = []
        for trade in similar:
            if trade.strategy == self.current_strategy:
                warnings.append(
                    f"Similar setup in {trade.date} resulted in {trade.outcome}. "
                    f"Reasoning: {trade.reasoning}"
                )
                
        return warnings
```

### 5.3 Dynamic Model Switching

**Auto Model Switching (hyperliquid-ai-bot):**
```python
class ModelSwitcher:
    def should_switch(self, current_model, market_conditions):
        # Switch if current model has been losing
        if self.get_model_win_rate(current_model, period="1w") < 0.4:
            return True
            
        # Switch if market regime changed
        if market_conditions.regime != current_model.best_regime:
            return True
            
        # Switch if another model has higher accuracy
        other_models = [m for m in self.models if m != current_model]
        for model in other_models:
            if self.get_model_win_rate(model) > self.get_model_win_rate(current_model):
                return True
                
        return False
    
    def switch_model(self, current_model):
        """Switch to best-performing model"""
        best_model = max(
            self.models,
            key=lambda m: self.get_model_win_rate(m)
        )
        return best_model
```

### 5.4 Continuous Learning Pipeline

```
Trade Closed → Post-Mortem → Strategy Score Update → RAG Storage → 
→ Query Similar Patterns (Before Next Trade) → Decision Adjustment → 
→ Execute Trade → Repeat
```

---

## Part 6: Required Data Sources, APIs, and Tools

### 6.1 Trading APIs

**Hyperliquid:**
- REST API: `https://api.hyperliquid.xyz`
- WebSocket: `wss://api.hyperliquid.xyz/ws`
- Official Python SDK: `hyperliquid` npm package
- Documentation: https://hyperliquid.gitbook.io/

**Features Needed:**
- Market data (prices, order book)
- Account information (balances, positions)
- Order management (place, cancel, modify)
- Trading (market, limit, stop orders)
- WebSocket for real-time updates

### 6.2 Market Data APIs

**Price & Volume:**
- CoinGecko API (free) - anajuliabit uses this
- CryptoCompare API (free tier)
- Binance API (public data)

**Historical Data:**
- CoinGecko: 24-hour historical data with volume
- TradingView (chart data)
- Hyperliquid API (historical prices)

**Technical Indicators:**
- TA-Lib (Python library) - NOFX uses this
- Pandas TA (Python)
- Built-in calculations (SMA, EMA, RSI, MACD, ATR)

### 6.3 Sentiment & Social APIs

**Social Intelligence:**
- LunarCrush API (social sentiment, galaxy scores)
- Twitter/X API (tweets, user timelines)
- Reddit API (posts, comments)
- Telegram API (channels, messages)

**News APIs:**
- CryptoControl (aggregated crypto news)
- NewsAPI (general news)
- CryptoCompare (news feed)

### 6.4 On-Chain Data APIs

**Nansen:**
- Wallet tracking
- Smart money flows
- Exchange inflows/outflows

**Arkham Intelligence:**
- Entity labeling
- Transaction visualization
- Exchange monitoring

**Dune Analytics:**
- Custom dashboards
- Protocol metrics
- Query builder

**Glassnode:**
- Market cycles
- HODLer behavior
- Exchange reserves

### 6.5 AI Model APIs

**Primary Models:**
- DeepSeek API (recommended for cost-effectiveness)
- OpenAI API (GPT-4, GPT-4o)
- Anthropic API (Claude)
- Qwen API (Alibaba)
- Gemini API (Google)

**Local Models (for privacy/speed):**
- Ollama (run LLMs locally)
- Llamafile (single-file LLMs)
- vLLM (high-throughput serving)

### 6.6 Notification APIs

**Telegram:**
- Bot API (notifications, commands)
- Webhooks (real-time alerts)

**Slack:**
- Webhook API (formatted alerts)
- Bot Kit (interactive commands)

**Discord:**
- Webhook API (rich embeds)
- Bot API (slash commands)

### 6.7 Development Tools

**Programming Languages:**
- Python 3.10+ (primary)
- Node.js 18+ (Hyperliquid SDK)
- TypeScript 5.0+ (NOFX frontend)

**Dependencies:**
- Hyperliquid SDK (npm)
- TA-Lib (technical indicators)
- Pandas (data analysis)
- NumPy (numerical computing)
- asyncio (async/await)
- websockets (real-time data)

**Databases:**
- PostgreSQL (trade logs, strategy scores)
- Vector Database (RAG memory):
  - Pinecone
  - Qdrant
  - Chroma
  - Weaviate

**Monitoring:**
- Grafana (dashboards)
- Prometheus (metrics)
- ELK Stack (logs)

---

## Part 7: Decision-Making Framework

### 7.1 Decision Flowchart

```
                    START
                      │
                      ▼
        ┌───────────────────────────────┐
        │  Market Structure Triggered? │
        └───────────┬───────────────────┘
                    │ NO
                    │
                    ▼
              WAIT FOR SIGNAL
                    │
                    │ YES
                    ▼
        ┌───────────────────────────────┐
        │  Check Sentiment & News        │
        │  • Trump Tracker weight        │
        │  • High-impact account tweets  │
        │  • Recent news analysis        │
        └───────────┬───────────────────┘
                    │
                    ▼
        ┌───────────────────────────────┐
        │  Check Technical Indicators    │
        │  • Price momentum (>0.5%)      │
        │  • Volume (>1.5x avg)         │
        │  • Multi-timeframe alignment   │
        └───────────┬───────────────────┘
                    │
                    ▼
        ┌───────────────────────────────┐
        │  Check On-Chain Data           │
        │  • Exchange flows             │
        │  • Smart money activity       │
        │  • Liquidation events         │
        └───────────┬───────────────────┘
                    │
                    ▼
        ┌───────────────────────────────┐
        │  Multi-Model Consensus         │
        │  • News Model vote            │
        │  • Technical Model vote       │
        │  • On-Chain Model vote        │
        │  • Risk Manager vote          │
        └───────────┬───────────────────┘
                    │
                    ▼
        ┌───────────────────────────────┐
        │  Calculate Confidence Score   │
        └───────────┬───────────────────┘
                    │
          ┌─────────┴─────────┐
          │                   │
    Confidence ≥80%      Confidence <80%
          │                   │
          ▼                   ▼
    FULL POSITION     NO TRADE
  (1-2% of equity)   or RE-EVALUATE
          │
          ▼
    Set Stop Loss
    (1% below entry)
          │
          ▼
    Set Take Profit
    (2% above entry)
          │
          ▼
    EXECUTE TRADE
          │
          ▼
    Monitor Position
          │
          ▼
    Exit Condition?
  (TP/SL/Momentum/
   Time Limit)
          │
          ▼
    CLOSE POSITION
          │
          ▼
    POST-MORTEM ANALYSIS
    (Update Strategy Scores)
          │
          ▼
    STORE IN RAG MEMORY
          │
          ▼
          START
```

### 7.2 Confidence Scoring System

**Weight Calculation:**
```
Total Confidence = (Signal Weight × 0.3) +
                   (Sentiment Weight × 0.2) +
                   (Technical Weight × 0.25) +
                   (On-Chain Weight × 0.15) +
                   (Consensus Weight × 0.1)
```

**Signal Weight (30%):**
- Market structure signal: +30%
- No market structure signal: 0%

**Sentiment Weight (20%):**
- Strong bullish sentiment (Trump positive, high-impact bullish tweets): +20%
- Moderate bullish sentiment: +15%
- Neutral sentiment: +10%
- Bearish sentiment: 0%

**Technical Weight (25%):**
- Price move >0.5% + Volume >1.5x avg: +25%
- Price move >0.5% only: +15%
- Volume >1.5x avg only: +10%
- Neither: 0%

**On-Chain Weight (15%):**
- Smart money accumulating: +15%
- Exchange outflows (bullish): +12%
- Neutral: +5%
- Exchange inflows (bearish): 0%

**Consensus Weight (10%):**
- All 4 models agree: +10%
- 3/4 models agree: +7%
- 2/4 models agree: +3%
- No consensus: 0%

**Thresholds:**
- ≥80%: Full position (1-2% of equity)
- 60-79%: Small position (0.5-1% of equity)
- <60%: NO TRADE

### 7.3 Exit Decision Framework

```
Position Open → Monitor Every 30 Seconds

                │
                ▼
    ┌───────────────────────┐
    │  Check Exit Conditions│
    └───────────┬───────────┘
                │
    ┌───────────┼───────────┐
    │           │           │
    ▼           ▼           ▼
  TP Hit      SL Hit    Other Conditions
    │           │           │
    │           │           ▼
    │           │    ┌─────────────────┐
    │           │    │ Momentum Died?   │
    │           │    └────────┬────────┘
    │           │             │ YES/NO
    │           │             ▼
    │           │      ┌──────────────┐
    │           │      │ Time Limit?  │
    │           │      │ (4 hours)    │
    │           │      └──────┬───────┘
    │           │             │ YES/NO
    │           │             ▼
    │           │      ┌──────────────┐
    │           │      │ Structure    │
    │           │      │ Reversed?    │
    │           │      └──────┬───────┘
    │           │             │ YES/NO
    │           │             ▼
    │           │         CLOSE
    │           │
    │           └─────────→ CLOSE
    │
    └─────────────→ CLOSE (Take Profit)
                       │
                       ▼
                 LOG TRADE OUTCOME
                       │
                       ▼
                  POST-MORTEM
```

---

## Part 8: Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
- [ ] Set up Hyperliquid API integration (SDK)
- [ ] Implement basic market data fetching (prices, order book)
- [ ] Create order execution module (market, limit orders)
- [ ] Set up PostgreSQL database for trade logging
- [ ] Implement position tracking and P&L calculation
- [ ] Set up testnet environment

### Phase 2: Risk Management (Week 3-4)
- [ ] Implement position sizing (1-2% hard limit)
- [ ] Create stop loss / take profit logic (2:1 RR)
- [ ] Build drawdown shield (pause at -10%)
- [ ] Implement volatility monitor
- [ ] Add position limits (max 3 concurrent)
- [ ] Create leverage cap (10x maximum)

### Phase 3: Market Intelligence (Week 5-6)
- [ ] Implement market structure signals (order flow, OI, funding rate)
- [ ] Integrate CoinGecko API for price/volume data
- [ ] Build technical indicators module (EMA, RSI, MACD, ATR)
- [ ] Create multi-timeframe analysis (1h, 4h, 6h)
- [ ] Implement volume confirmation (>1.5x average)

### Phase 4: Sentiment & News (Week 7-8)
- [ ] Integrate Twitter/X API
- [ ] Build SLM-based tweet classifier (Noise/FUD/Alpha)
- [ ] Create "Trump Tracker" for high-impact posts
- [ ] Integrate Reddit API for sentiment
- [ ] Add news aggregation (CryptoControl, NewsAPI)
- [ ] Build narrative detection module

### Phase 5: Multi-Model AI (Week 9-10)
- [ ] Integrate DeepSeek API (primary model)
- [ ] Set up OpenAI API (GPT-4)
- [ ] Configure Anthropic API (Claude)
- [ ] Create multi-model consensus system
- [ ] Build model performance tracking
- [ ] Implement auto model switching

### Phase 6: Self-Improvement (Week 11-12)
- [ ] Set up vector database (Pinecone or Qdrant)
- [ ] Create RAG-based historical pattern recognition
- [ ] Build strategy scoring system
- [ ] Implement post-trade post-mortem
- [ ] Create strategy benching logic (3 losses)
- [ ] Add decision explanation/reasoning logging

### Phase 7: Monitoring & Notifications (Week 13-14)
- [ ] Set up Telegram bot API
- [ ] Create Slack webhook integration
- [ ] Build web dashboard (React + NOFX-style)
- [ ] Implement real-time position alerts
- [ ] Add performance reports (daily/weekly)
- [ ] Create anomaly detection alerts

### Phase 8: Testing & Optimization (Week 15-16)
- [ ] Paper trading on testnet (1-2 weeks)
- [ ] Backtest strategies on historical data
- [ ] Optimize parameters (confidence thresholds, position sizing)
- [ ] Stress testing (extreme volatility scenarios)
- [ ] Security audit (key management, API calls)
- [ ] Documentation and user guides

### Phase 9: Deployment (Week 17-18)
- [ ] Deploy to production (small capital)
- [ ] Monitor closely for first week
- [ ] Gradually increase position sizes
- [ ] Continuous monitoring and adjustments
- [ ] Regular performance reviews

---

## Part 9: Risk Management Checklist

### Pre-Trade Checklist
- [ ] Market structure signal triggered?
- [ ] Volume >1.5x average?
- [ ] Price move >0.5% in 15-30 min?
- [ ] Aligned with higher timeframe trend?
- [ ] Confidence score ≥80%?
- [ ] Position size ≤2% of equity?
- [ ] Stop loss set (1% below/above entry)?
- [ ] Take profit set (2% above/below entry)?
- [ ] Maximum 3 concurrent positions?
- [ ] Not in high volatility (ATR spike)?

### During Trade Checklist
- [ ] Monitoring position every 30-60 seconds?
- [ ] Account drawdown <10%?
- [ ] Daily loss limit not exceeded?
- [ ] Market structure still favorable?
- [ ] Momentum still present?
- [ ] Not holding beyond 4 hours?

### Post-Trade Checklist
- [ ] Trade logged to database?
- [ ] Expected vs. actual outcome recorded?
- [ ] Strategy score updated?
- [ ] Stored in RAG memory?
- [ ] Reasoning chain evaluated?
- [ ] Performance metrics calculated?

### System Health Checklist
- [ ] API keys secure (not hardcoded)?
- [ ] Database backups running?
- [ ] Notification systems working?
- [ ] Model API credits sufficient?
- [ ] No failed connections?
- [ ] Latency acceptable?

---

## Part 10: Key Performance Metrics

### Trading Metrics
- **Win Rate**: % of profitable trades (target: ≥50%)
- **Profit Factor**: Gross profit / Gross loss (target: ≥1.5)
- **Average Risk/Reward**: Average win / Average loss (target: ≥2:1)
- **Maximum Drawdown**: Peak-to-trough decline (target: ≤15%)
- **Sharpe Ratio**: Risk-adjusted return (target: ≥1.0)
- **Sortino Ratio**: Downside risk-adjusted return (target: ≥1.5)

### System Metrics
- **Model Accuracy**: % of correct model predictions (target: ≥60%)
- **Signal Quality**: % of signals that result in profitable trades (target: ≥55%)
- **False Positive Rate**: % of trades that should not have been taken (target: ≤20%)
- **Confidence Calibration**: How well confidence predicts actual success (target: ≥0.7 correlation)
- **Strategy Rotation**: How often strategies are benched/activated (target: 1-2 changes/week)

### Operational Metrics
- **Uptime**: % of time bot is operational (target: ≥99.5%)
- **API Latency**: Average time for API calls (target: <500ms)
- **Order Fill Rate**: % of orders that execute (target: ≥95%)
- **Slippage**: Average price deviation from expected (target: <0.1%)
- **Error Rate**: % of failed operations (target: <1%)

---

## Part 11: Cost Optimization

### AI Model Usage
**Primary Recommendation: DeepSeek**
- Cost: ~$1-2 per 1M tokens (vs $30+ for GPT-4)
- Performance: Excellent for trading scenarios
- Use for: Technical analysis, pattern recognition, decision-making

**Secondary: OpenAI GPT-4o**
- Cost: ~$2.50 per 1M tokens
- Performance: Superior for complex reasoning
- Use for: News analysis, sentiment interpretation, strategy refinement

**Local Models (for cost savings):**
- Llama 3 (8B) for simple classifications
- Mistral (7B) for quick technical analysis
- Use Ollama for easy local deployment

### Data API Optimization
- **CoinGecko**: Free tier sufficient for basic price/volume data
- **CryptoCompare**: Free tier for sentiment and social metrics
- **LunarCrush**: Paid only if social intelligence is critical
- **On-chain data**: Start with free Dune queries, upgrade to Nansen if needed

### Infrastructure Costs
- **Hosting**: $5-20/month (VPS or cloud)
- **Database**: $0-25/month (PostgreSQL managed)
- **Vector DB**: $0-70/month (Pinecone tiered)
- **Monitoring**: $0-15/month (Grafana Cloud free tier)

**Estimated Total Cost**: $50-150/month for small-scale operation

---

## Part 12: Conclusion

This comprehensive strategy combines the best practices from multiple Hyperliquid trading repositories into a unified, self-improving architecture. Key innovations include:

1. **Market-Aware Trading**: Only trade when market structure shifts, not 24/7
2. **Multi-Model Consensus**: AI models specialize and vote on decisions
3. **RAG-Based Memory**: Learn from past wins/losses to avoid repeating mistakes
4. **Dynamic Strategy Scoring**: Automatically weight successful strategies higher
5. **Strict Risk Management**: Hard-coded limits prevent catastrophic losses
6. **News & Alpha Integration**: Real-time sentiment, narrative detection, macro monitoring

The system is designed to be:
- **Survivable**: Risk-first approach prevents blowouts
- **Adaptive**: Multi-model switching and strategy rotation
- **Intelligent**: Market-aware, not noise-reactive
- **Self-Improving**: Every trade feeds into decision engine
- **Transparent**: Full logging and explanation of decisions

**Success Criteria:**
- Positive risk-adjusted returns (Sharpe ≥1.0)
- Max drawdown ≤15% per month
- Win rate ≥50%
- System uptime ≥99.5%
- Model accuracy ≥60%

This architecture provides a solid foundation for building a sophisticated, profitable, and continuously improving trading agent on Hyperliquid.

---

## Appendix A: Configuration Templates

### Environment Variables (.env)
```bash
# Hyperliquid Configuration
HYPERLIQUID_API_URL=https://api.hyperliquid.xyz
HYPERLIQUID_WS_URL=wss://api.hyperliquid.xyz/ws
HYPERLIQUID_PRIVATE_KEY=your_private_key_here
HYPERLIQUID_TESTNET=false

# Risk Management
MAX_POSITION_SIZE_PCT=2.0
STOP_LOSS_PCT=1.0
TAKE_PROFIT_PCT=2.0
MAX_DRAWDOWN_PCT=10.0
MAX_POSITIONS=3
MAX_LEVERAGE=10

# AI Models
DEEPSEEK_API_KEY=your_deepseek_key
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key

# Database
POSTGRES_URL=postgresql://user:password@localhost:5432/trading
VECTOR_DB_URL=your_vector_db_url

# Notifications
TELEGRAM_BOT_TOKEN=your_telegram_token
TELEGRAM_CHAT_ID=your_chat_id
SLACK_WEBHOOK_URL=your_slack_webhook

# Sentiment APIs
TWITTER_BEARER_TOKEN=your_twitter_token
REDDIT_CLIENT_ID=your_reddit_client_id
LUNARCRUSH_API_KEY=your_lunarcrush_key
```

### Strategy Configuration (YAML)
```yaml
strategy:
  name: "momentum_scalping"
  active: true

entry:
  price_move_pct: 0.5
  volume_multiplier: 1.5
  min_confidence: 0.8

exit:
  take_profit_pct: 2.0
  stop_loss_pct: 1.0
  max_hold_hours: 4
  momentum_dead_volume_threshold: 1.0

risk:
  position_size_pct: 2.0
  max_positions: 3
  max_drawdown_pct: 10.0
  daily_loss_limit_pct: 5.0

market_structure:
  order_flow_imbalance_enabled: true
  oi_surge_threshold: 0.2
  funding_rate_long_threshold: 0.001
  funding_rate_short_threshold: -0.001

multi_timeframe:
  short_term: 1h
  medium_term: 4h
  long_term: 6h

models:
  news:
    enabled: true
    provider: "openai"
    model: "gpt-4o"
  
  technical:
    enabled: true
    provider: "deepseek"
    model: "deepseek-chat"
  
  onchain:
    enabled: true
    provider: "qwen"
    model: "qwen-max"
  
  risk:
    enabled: true
    provider: "anthropic"
    model: "claude-3.5-sonnet"
```

---

## Appendix B: Glossary

- **Alpha**: Returns above the market benchmark; information that provides an edge
- **CVD**: Cumulative Volume Delta - difference between buy and sell volume
- **Drawdown**: Peak-to-trough decline in account value
- **Funding Rate**: Periodic payment between long and short traders to keep perp prices aligned with spot
- **Hyperliquid**: Decentralized perpetual exchange for crypto, stocks, forex
- **LLM**: Large Language Model (GPT, Claude, DeepSeek, etc.)
- **Market Structure**: The underlying flow and order dynamics of a market
- **OI**: Open Interest - total number of outstanding derivative contracts
- **RAG**: Retrieval-Augmented Generation - AI system that retrieves relevant information from a database
- **Risk/Reward (RR)**: Ratio of potential profit to potential loss
- **Sentiment**: The overall attitude of market participants (bullish/bearish)
- **SLM**: Small Language Model - lighter-weight AI models for classification tasks
- **Stop Loss**: Order to close a position at a specific price to limit losses
- **Take Profit**: Order to close a position at a specific price to lock in gains
- **Volatility**: Degree of price variation in a market over time

---

**END OF DOCUMENT**
