# Sub-Second Arbitrage Detection & Execution System

## Executive Summary

This document outlines the architecture for a high-frequency arbitrage detection and execution system designed to identify and capitalize on market inefficiencies across prediction markets, crypto exchanges, and DEXs. The system targets **<100ms detection latency** and **<500ms end-to-end execution latency**.

---

## Table of Contents

1. [System Architecture Overview](#1-system-architecture-overview)
2. [Arbitrage Types & Detection Logic](#2-arbitrage-types--detection-logic)
3. [Data Ingestion Layer](#3-data-ingestion-layer)
4. [Opportunity Detection Engine](#4-opportunity-detection-engine)
5. [Execution Engine](#5-execution-engine)
6. [Risk Management System](#6-risk-management-system)
7. [Monitoring & Observability](#7-monitoring--observability)
8. [Latency Budget & Benchmarks](#8-latency-budget--benchmarks)
9. [Implementation Roadmap](#9-implementation-roadmap)
10. [Code Architecture](#10-code-architecture)
11. [Security Considerations](#11-security-considerations)

---

## 1. System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ARBITRAGE ENGINE ARCHITECTURE                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌───────────┐  │
│  │   WebSocket  │    │   WebSocket  │    │   WebSocket  │    │   DEX     │  │
│  │ Polymarket   │    │    Kalsi     │    │  CEX Price   │    │  Events   │  │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘    └─────┬─────┘  │
│         │                   │                   │                   │       │
│         └───────────────────┴───────────────────┴───────────────────┘       │
│                                 │                                           │
│                    ┌────────────▼────────────┐                               │
│                    │   INGESTION LAYER       │                               │
│                    │  (ZeroMQ/Kafka Bridge)  │                               │
│                    └────────────┬────────────┘                               │
│                                 │                                           │
│                    ┌────────────▼────────────┐                               │
│                    │  OPPORTUNITY DETECTOR   │                               │
│                    │  (Rust/C++ Core Engine) │                               │
│                    └────────────┬────────────┘                               │
│                                 │                                           │
│                    ┌────────────▼────────────┐                               │
│                    │   EXECUTION ORCHESTRATOR│                               │
│                    │   (Go/Python Bridge)    │                               │
│                    └────────────┬────────────┘                               │
│                                 │                                           │
│         ┌───────────────────────┼───────────────────────┐                   │
│         │                       │                       │                   │
│  ┌──────▼──────┐        ┌───────▼───────┐      ┌───────▼───────┐            │
│  │ Polymarket  │        │ Flashbots RPC │      │    Kalsi      │            │
│  │   Orders    │        │  (MEV-Share)  │      │    Orders     │            │
│  └─────────────┘        └───────────────┘      └───────────────┘            │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                         ┌──────────▼──────────┐
                         │   MONITORING STACK  │
                         │ (Prometheus/Grafana)│
                         └─────────────────────┘
```

### Core Components

| Component | Technology | Latency Target |
|-----------|------------|----------------|
| Data Ingestion | Rust + ZeroMQ | <10ms processing |
| Price Matrix | Rust (lock-free) | <50ns lookup |
| Opportunity Detection | Rust + SIMD | <1ms calculation |
| Execution Engine | Go + EVM | <200ms transaction |
| Risk Controls | Rust (in-path) | <5ms validation |

---

## 2. Arbitrage Types & Detection Logic

### 2.1 Polymarket Internal Arbitrage

**Opportunity Definition:**
```
Condition: YES_price + NO_price < 1.00 - fees - gas
Profit % = (1.00 - (YES + NO) - 0.002) / (YES + NO) * 100
Minimum: 0.2% after all costs
```

**Detection Algorithm:**
```rust
pub struct PolymarketArbDetector {
    markets: DashMap<MarketId, MarketState>,
    fee_rate: f64, // 0.001 (0.1%)
    min_profit: f64, // 0.002 (0.2%)
}

impl PolymarketArbDetector {
    pub fn check_arbitrage(&self, market_id: &MarketId) -> Option<ArbOpportunity> {
        let state = self.markets.get(market_id)?;
        
        let yes_price = state.yes_best_ask;
        let no_price = state.no_best_ask;
        let total = yes_price + no_price;
        
        if total >= 1.0 {
            return None;
        }
        
        let gross_profit = 1.0 - total;
        let fees = total * self.fee_rate * 2.0; // Buy both sides
        let net_profit = gross_profit - fees;
        let profit_pct = net_profit / total;
        
        if profit_pct > self.min_profit {
            let size = self.calculate_max_size(&state);
            return Some(ArbOpportunity {
                market_id: market_id.clone(),
                opp_type: ArbType::PolymarketInternal,
                expected_profit: net_profit * size,
                profit_pct,
                size,
                leg1: OrderLeg::BuyYes(yes_price, size),
                leg2: OrderLeg::BuyNo(no_price, size),
                ttl_ms: 500,
                confidence: self.calculate_confidence(&state),
            });
        }
        
        None
    }
}
```

**Market State Tracking:**
```rust
pub struct MarketState {
    pub market_id: MarketId,
    pub yes_best_bid: f64,
    pub yes_best_ask: f64,
    pub yes_depth: [Level; 10], // Top 10 levels
    pub no_best_bid: f64,
    pub no_best_ask: f64,
    pub no_depth: [Level; 10],
    pub last_update: Instant,
    pub update_count: u64,
    pub spread_history: RingBuffer<f64>,
}
```

### 2.2 Cross-Exchange Arbitrage

**Polymarket vs Kalsi Arbitrage:**
```rust
pub fn check_cross_exchange_arb(
    &self,
    asset: &str,
    polymarket_price: f64,
    kalsi_price: f64,
) -> Option<CrossExchangeArb> {
    let spread = (polymarket_price - kalsi_price).abs();
    let avg_price = (polymarket_price + kalsi_price) / 2.0;
    let spread_pct = spread / avg_price;
    
    // Account for fees on both sides
    let polymarket_fee = 0.001; // 0.1% taker
    let kalsi_fee = self.config.kalsi_taker_fee;
    let total_fees = polymarket_fee + kalsi_fee;
    
    let net_profit_pct = spread_pct - total_fees - self.config.min_profit_threshold;
    
    if net_profit_pct > 0.0 {
        let (buy_venue, sell_venue, buy_price, sell_price) = if polymarket_price < kalsi_price {
            (Venue::Polymarket, Venue::Kalsi, polymarket_price, kalsi_price)
        } else {
            (Venue::Kalsi, Venue::Polymarket, kalsi_price, polymarket_price)
        };
        
        return Some(CrossExchangeArb {
            asset: asset.to_string(),
            buy_venue,
            sell_venue,
            buy_price,
            sell_price,
            expected_profit_pct: net_profit_pct,
            max_size: self.calculate_cross_exchange_size(asset),
        });
    }
    
    None
}
```

**Crypto Spot vs Perp Funding Arbitrage:**
```rust
pub struct FundingArbOpportunity {
    pub spot_exchange: Exchange,
    pub perp_exchange: Exchange,
    pub funding_rate: f64, // 8-hour rate
    pub position_size_usd: f64,
    pub daily_profit: f64,
    pub annualized_return: f64,
    pub risk_score: f64,
}

impl FundingArbDetector {
    pub fn detect_opportunities(&self) -> Vec<FundingArbOpportunity> {
        let mut opportunities = Vec::new();
        
        for (symbol, rates) in &self.funding_rates {
            // Get spot price
            let spot_price = self.spot_prices.get(symbol).unwrap_or(&0.0);
            
            for (exchange, rate) in rates {
                // Funding is paid every 8 hours (3x per day)
                let daily_funding = rate * 3.0;
                
                // Annualized return
                let annualized = daily_funding * 365.0;
                
                // Check if profitable after costs
                let borrow_cost = self.get_borrow_cost(symbol);
                let net_return = annualized - borrow_cost;
                
                if net_return > self.config.min_annualized_return {
                    opportunities.push(FundingArbOpportunity {
                        spot_exchange: self.get_cheapest_spot(symbol),
                        perp_exchange: *exchange,
                        funding_rate: *rate,
                        position_size_usd: self.calculate_position_size(symbol, net_return),
                        daily_profit: daily_funding,
                        annualized_return: net_return,
                        risk_score: self.calculate_risk_score(symbol, exchange),
                    });
                }
            }
        }
        
        opportunities.sort_by(|a, b| b.annualized_return.partial_cmp(&a.annualized_return).unwrap());
        opportunities
    }
}
```

**Stablecoin Depeg Detection:**
```rust
pub struct StablecoinMonitor {
    /// Track USDC across chains/exchanges
    pub usdc_prices: DashMap<(Chain, Exchange), f64>,
    pub alert_threshold: f64, // 0.005 (0.5%)
    pub trade_threshold: f64, // 0.002 (0.2%)
}

impl StablecoinMonitor {
    pub fn check_depeg_opportunities(&self) -> Vec<StablecoinArb> {
        let mut opportunities = Vec::new();
        let base_price = 1.0; // USD target
        
        // Compare all pairs
        for ((chain_a, ex_a), price_a) in self.usdc_prices.iter() {
            for ((chain_b, ex_b), price_b) in self.usdc_prices.iter() {
                if chain_a == chain_b && ex_a == ex_b {
                    continue;
                }
                
                let spread = (price_a - price_b).abs();
                let spread_pct = spread / base_price;
                
                if spread_pct > self.trade_threshold {
                    let (buy_chain, buy_ex, buy_price) = if price_a < price_b {
                        (*chain_a, *ex_a, *price_a)
                    } else {
                        (*chain_b, *ex_b, *price_b)
                    };
                    
                    opportunities.push(StablecoinArb {
                        buy: (buy_chain, buy_ex),
                        sell: if buy_chain == *chain_a { (*chain_b, *ex_b) } else { (*chain_a, *ex_a) },
                        buy_price,
                        sell_price: if buy_price == *price_a { *price_b } else { *price_a },
                        spread_pct,
                        bridges: self.find_bridges(buy_chain, if buy_chain == *chain_a { *chain_b } else { *chain_a }),
                    });
                }
            }
        }
        
        opportunities
    }
}
```

### 2.3 Triangular Arbitrage (DEX)

**Path Finding Algorithm:**
```rust
pub struct TriangularArbDetector {
    graph: PriceGraph,
    flash_loan_pools: Vec<Pool>,
}

impl TriangularArbDetector {
    /// Find profitable 3-hop cycles: USDC -> A -> B -> USDC
    pub fn find_triangular_arbs(&self, start_token: Token) -> Vec<TriangularArb> {
        let mut opportunities = Vec::new();
        
        // Get all pools involving start_token
        let pools = self.graph.get_pools_for_token(&start_token);
        
        for pool_a in &pools {
            let token_a = if pool_a.token0 == start_token { &pool_a.token1 } else { &pool_a.token0 };
            
            // Get pools for token_a (excluding the one we came from)
            let pools_b = self.graph.get_pools_for_token_excluding(token_a, pool_a);
            
            for pool_b in &pools_b {
                let token_b = if pool_b.token0 == *token_a { &pool_b.token1 } else { &pool_b.token0 };
                
                // Find path back to start_token
                if let Some(pool_c) = self.graph.find_pool(token_b, &start_token) {
                    // Calculate output for 1 unit input
                    let amount = U256::from(10u128.pow(start_token.decimals as u32));
                    
                    let amount_a = self.calculate_output(pool_a, &start_token, amount);
                    let amount_b = self.calculate_output(pool_b, token_a, amount_a);
                    let amount_c = self.calculate_output(pool_c, token_b, amount_b);
                    
                    // Account for fees (typically 0.3% per hop)
                    let fees = 1.0 - (0.997f64.powi(3)); // ~0.9% total
                    let profit = (amount_c.as_u128() as f64 / amount.as_u128() as f64) - 1.0 - fees;
                    
                    if profit > self.config.min_profit_threshold {
                        opportunities.push(TriangularArb {
                            path: vec![pool_a.clone(), pool_b.clone(), pool_c.clone()],
                            tokens: vec![start_token.clone(), token_a.clone(), token_b.clone()],
                            input_amount: amount,
                            expected_output: amount_c,
                            profit_pct: profit * 100.0,
                            flash_loan_available: self.check_flash_loan_availability(&start_token, amount),
                        });
                    }
                }
            }
        }
        
        opportunities
    }
    
    fn calculate_output(&self, pool: &Pool, input_token: &Token, amount_in: U256) -> U256 {
        match pool.pool_type {
            PoolType::UniswapV2 => self.calc_uniswap_v2_output(pool, input_token, amount_in),
            PoolType::UniswapV3 { fee } => self.calc_uniswap_v3_output(pool, input_token, amount_in, fee),
            PoolType::Curve => self.calc_curve_output(pool, input_token, amount_in),
            PoolType::Balancer => self.calc_balancer_output(pool, input_token, amount_in),
        }
    }
}
```

**Flash Loan Integration:**
```rust
pub struct FlashLoanExecutor {
    aave_pool: Address,
    balancer_vault: Address,
    flashbots_relay: FlashbotsRelay,
}

impl FlashLoanExecutor {
    pub async fn execute_flash_loan_arb(
        &self,
        opportunity: &TriangularArb,
    ) -> Result<TxHash, ArbError> {
        // Build flash loan transaction
        let flash_loan_call = self.build_flash_loan_call(opportunity);
        
        // Bundle with MEV protection
        let bundle = self.flashbots_relay.create_bundle()
            .add_transaction(flash_loan_call)
            .set_revert_protection(true)
            .set_priority_fee(opportunity.priority_fee());
        
        // Simulate first
        let simulation = bundle.simulate().await?;
        if simulation.success && simulation.profit > 0 {
            // Submit to Flashbots
            let receipt = bundle.submit().await?;
            Ok(receipt.tx_hash)
        } else {
            Err(ArbError::SimulationFailed)
        }
    }
}
```

---

## 3. Data Ingestion Layer

### 3.1 WebSocket Architecture

```rust
use tokio::net::TcpStream;
use tokio_tungstenite::{connect_async, tungstenite::Message};
use futures::{StreamExt, SinkExt};

pub struct WebSocketManager {
    connections: DashMap<Venue, WebSocketConnection>,
    message_tx: broadcast::Sender<MarketDataEvent>,
    health_checker: Arc<HealthChecker>,
}

pub struct WebSocketConnection {
    venue: Venue,
    stream: WebSocketStream,
    last_message: AtomicInstant,
    reconnect_count: AtomicU64,
    message_count: AtomicU64,
    latency_ns: AtomicU64,
}

impl WebSocketManager {
    pub async fn connect_polymarket(&self) -> Result<(), ConnectionError> {
        let ws_url = "wss://ws.polymarket.com/v1/stream";
        let (ws_stream, _) = connect_async(ws_url).await?;
        
        // Subscribe to all markets
        let subscribe_msg = json!({
            "type": "subscribe",
            "channels": ["market_prices", "order_book", "trades"],
            "markets": "all_active"
        });
        
        let conn = WebSocketConnection {
            venue: Venue::Polymarket,
            stream: ws_stream,
            last_message: AtomicInstant::now(),
            reconnect_count: AtomicU64::new(0),
            message_count: AtomicU64::new(0),
            latency_ns: AtomicU64::new(0),
        };
        
        self.connections.insert(Venue::Polymarket, conn);
        
        // Spawn handler task
        tokio::spawn(self.handle_polymarket_messages());
        
        Ok(())
    }
    
    async fn handle_polymarket_messages(&self) {
        while let Some(msg) = self.connections.get(&Venue::Polymarket).unwrap().stream.next().await {
            let start = Instant::now();
            
            match msg {
                Ok(Message::Text(text)) => {
                    let event: PolymarketEvent = serde_json::from_str(&text)
                        .expect("Failed to parse Polymarket event");
                    
                    // Update market state (lock-free)
                    self.process_polymarket_event(event);
                    
                    // Record latency
                    let latency = start.elapsed().as_nanos() as u64;
                    self.record_latency(Venue::Polymarket, latency);
                }
                Ok(Message::Ping(ping)) => {
                    // Respond with pong immediately
                    if let Some(mut conn) = self.connections.get_mut(&Venue::Polymarket) {
                        let _ = conn.stream.send(Message::Pong(ping)).await;
                    }
                }
                Err(e) => {
                    error!("Polymarket WebSocket error: {}", e);
                    self.schedule_reconnect(Venue::Polymarket);
                }
                _ => {}
            }
        }
    }
}
```

### 3.2 Order Book Reconstruction

```rust
pub struct OrderBook {
    pub symbol: String,
    pub venue: Venue,
    pub bids: BTreeMap<Decimal, Decimal>, // Price -> Quantity
    pub asks: BTreeMap<Decimal, Decimal>,
    pub last_sequence: u64,
    pub last_update: Instant,
}

impl OrderBook {
    /// Apply L2 update (top 10 levels)
    pub fn apply_update(&mut self, update: OrderBookUpdate) -> Result<(), BookError> {
        // Sequence validation
        if update.sequence <= self.last_sequence {
            return Err(BookError::OutOfOrder);
        }
        
        // Apply bid updates
        for level in update.bids {
            if level.quantity.is_zero() {
                self.bids.remove(&level.price);
            } else {
                self.bids.insert(level.price, level.quantity);
            }
        }
        
        // Apply ask updates
        for level in update.asks {
            if level.quantity.is_zero() {
                self.asks.remove(&level.price);
            } else {
                self.asks.insert(level.price, level.quantity);
            }
        }
        
        // Trim to top 10 levels
        self.bids = self.bids.iter().rev().take(10).map(|(k, v)| (*k, *v)).collect();
        self.asks = self.asks.iter().take(10).map(|(k, v)| (*k, *v)).collect();
        
        self.last_sequence = update.sequence;
        self.last_update = Instant::now();
        
        Ok(())
    }
    
    pub fn best_bid(&self) -> Option<(Decimal, Decimal)> {
        self.bids.iter().next_back().map(|(p, q)| (*p, *q))
    }
    
    pub fn best_ask(&self) -> Option<(Decimal, Decimal)> {
        self.asks.iter().next().map(|(p, q)| (*p, *q))
    }
    
    /// Calculate fill price for a given size
    pub fn get_fill_price(&self, side: Side, size: Decimal) -> Option<Decimal> {
        let levels = match side {
            Side::Buy => &self.asks,
            Side::Sell => &self.bids,
        };
        
        let mut remaining = size;
        let mut total_cost = Decimal::ZERO;
        
        for (price, quantity) in levels.iter() {
            let fill_qty = remaining.min(*quantity);
            total_cost += fill_qty * *price;
            remaining -= fill_qty;
            
            if remaining.is_zero() {
                return Some(total_cost / size);
            }
        }
        
        None // Insufficient liquidity
    }
}
```

### 3.3 DEX Event Monitoring

```rust
pub struct DEXEventMonitor {
    provider: Arc<Provider<Ws>>,
    filters: Vec<EventFilter>,
    block_subscription: SubscriptionStream<Block<H256>>,
}

impl DEXEventMonitor {
    pub async fn subscribe_to_swaps(&self) -> Result<(), ArbError> {
        // Uniswap V2/V3 Swap events
        let swap_signature = H256::from_slice(&keccak256("Swap(address,uint256,uint256,uint256,uint256,address)"));
        
        let filter = Filter::new()
            .from_block(BlockNumber::Latest)
            .topic0(swap_signature);
        
        let mut stream = self.provider.subscribe_logs(&filter).await?;
        
        while let Some(log) = stream.next().await {
            let start = Instant::now();
            
            // Parse swap event
            if let Ok(swap) = self.parse_swap_event(&log) {
                // Update pool state immediately
                self.update_pool_from_swap(&swap);
                
                // Trigger opportunity recalculation
                self.opportunity_tx.send(OpportunityTrigger::PoolUpdate(swap.pool_address));
            }
            
            metrics::histogram!("dex_event_processing_ns", start.elapsed().as_nanos() as f64);
        }
        
        Ok(())
    }
    
    pub async fn subscribe_to_new_blocks(&self) {
        while let Some(block) = self.block_subscription.next().await {
            // New block = new prices, new opportunities
            // Flashbots bundles can be submitted here
            let block_number = block.number.unwrap_or_default().as_u64();
            
            self.opportunity_tx.send(OpportunityTrigger::NewBlock(block_number));
            
            // Update base fee for gas estimation
            if let Some(base_fee) = block.base_fee_per_gas {
                self.gas_oracle.update_base_fee(base_fee);
            }
        }
    }
}
```

---

## 4. Opportunity Detection Engine

### 4.1 In-Memory Price Matrix

```rust
use dashmap::DashMap;
use crossbeam::queue::ArrayQueue;

pub struct PriceMatrix {
    /// Asset -> Venue -> Price
    prices: DashMap<Asset, DashMap<Venue, PricePoint>>,
    
    /// For fast triangular arb detection
    token_graph: TokenGraph,
    
    /// Opportunity queue (lock-free)
    opportunity_queue: ArrayQueue<ArbOpportunity>,
    
    /// Last update timestamps for staleness detection
    last_updates: DashMap<(Asset, Venue), Instant>,
}

#[derive(Clone, Debug)]
pub struct PricePoint {
    pub bid: f64,
    pub ask: f64,
    pub bid_size: f64,
    pub ask_size: f64,
    pub timestamp: Instant,
    pub confidence: f64, // 0.0 - 1.0 based on data quality
}

impl PriceMatrix {
    /// Update price (called from WebSocket handlers)
    pub fn update_price(&self, asset: Asset, venue: Venue, point: PricePoint) {
        let entry = self.prices.entry(asset.clone()).or_default();
        entry.insert(venue, point.clone());
        
        self.last_updates.insert((asset, venue), Instant::now());
        
        // Trigger opportunity detection
        self.check_opportunities(asset);
    }
    
    fn check_opportunities(&self, updated_asset: Asset) {
        // Check all opportunity types involving this asset
        
        // 1. Cross-exchange opportunities
        if let Some(venues) = self.prices.get(&updated_asset) {
            for (v1, p1) in venues.iter() {
                for (v2, p2) in venues.iter() {
                    if v1 != v2 {
                        self.check_cross_exchange_arb(updated_asset.clone(), *v1, p1.clone(), *v2, p2.clone());
                    }
                }
            }
        }
        
        // 2. Triangular opportunities (for tokens)
        if updated_asset.is_token() {
            self.check_triangular_arbs(&updated_asset);
        }
        
        // 3. Polymarket internal (if applicable)
        if updated_asset.market_id().is_some() {
            self.check_polymarket_internal(&updated_asset);
        }
    }
    
    /// SIMD-accelerated price comparison for multiple pairs
    #[cfg(target_arch = "x86_64")]
    pub fn batch_compare_prices(&self, pairs: &[PricePair]) -> Vec<ArbSignal> {
        use std::arch::x86_64::*;
        
        let mut results = Vec::with_capacity(pairs.len());
        
        unsafe {
            // Process 4 pairs at a time using AVX2
            for chunk in pairs.chunks(4) {
                let v1 = _mm256_loadu_pd(&chunk[0].price_a as *const f64);
                let v2 = _mm256_loadu_pd(&chunk[0].price_b as *const f64);
                
                // Calculate spread
                let diff = _mm256_sub_pd(v1, v2);
                let spread = _mm256_div_pd(diff, _mm256_mul_pd(_mm256_add_pd(v1, v2), _mm256_set1_pd(0.5)));
                
                // Store results
                let mut spreads = [0f64; 4];
                _mm256_storeu_pd(spreads.as_mut_ptr(), spread);
                
                for (i, pair) in chunk.iter().enumerate() {
                    if spreads[i].abs() > pair.threshold {
                        results.push(ArbSignal {
                            pair: pair.clone(),
                            spread_pct: spreads[i].abs(),
                        });
                    }
                }
            }
        }
        
        results
    }
}
```

### 4.2 P&L Calculation Engine

```rust
pub struct PLCalculator {
    fee_schedule: FeeSchedule,
    gas_oracle: Arc<GasOracle>,
}

impl PLCalculator {
    /// Calculate expected profit for an arbitrage opportunity
    pub fn calculate_expected_pl(&self, opp: &ArbOpportunity) -> PLResult {
        match opp.opp_type {
            ArbType::PolymarketInternal => self.calc_polymarket_internal_pl(opp),
            ArbType::CrossExchange => self.calc_cross_exchange_pl(opp),
            ArbType::Triangular => self.calc_triangular_pl(opp),
            ArbType::Funding => self.calc_funding_pl(opp),
        }
    }
    
    fn calc_polymarket_internal_pl(&self, opp: &ArbOpportunity) -> PLResult {
        let leg1 = &opp.leg1; // Buy YES
        let leg2 = &opp.leg2; // Buy NO
        
        // Gross profit from buying both sides
        let gross_profit = opp.size * (1.0 - (leg1.price + leg2.price));
        
        // Fees (0.1% taker fee per leg)
        let leg1_cost = opp.size * leg1.price;
        let leg2_cost = opp.size * leg2.price;
        let fees = (leg1_cost + leg2_cost) * 0.001;
        
        // Gas costs (ERC-20 approvals + 2 orders)
        let gas_estimate = self.gas_oracle.estimate_gas(GasOperation::PolymarketTwoLeg);
        let gas_cost_eth = gas_estimate.as_u128() as f64 * self.gas_oracle.get_effective_gas_price();
        let gas_cost_usd = gas_cost_eth * self.gas_oracle.eth_price_usd();
        
        // Net profit
        let net_profit = gross_profit - fees - gas_cost_usd;
        let net_profit_pct = net_profit / (leg1_cost + leg2_cost);
        
        PLResult {
            gross_profit,
            fees,
            gas_cost: gas_cost_usd,
            net_profit,
            net_profit_pct,
            break_even_size: self.calculate_break_even(opp),
            confidence: opp.confidence * self.market_liquidity_score(opp),
        }
    }
    
    fn calc_triangular_pl(&self, opp: &ArbOpportunity) -> PLResult {
        let path = opp.triangular_path.as_ref().unwrap();
        
        // Calculate output through path
        let input = opp.size;
        let mut amount = input;
        let mut total_fees = 0.0;
        
        for (i, pool) in path.iter().enumerate() {
            let fee = match pool.pool_type {
                PoolType::UniswapV2 => 0.003,
                PoolType::UniswapV3(fee_tier) => fee_tier.as_f64(),
                PoolType::Curve => pool.fee,
                PoolType::Balancer => pool.swap_fee,
            };
            
            // Apply fee
            total_fees += amount * fee;
            amount = amount * (1.0 - fee);
            
            // Apply price impact (simplified)
            amount = self.apply_price_impact(pool, amount);
        }
        
        let gross_profit = amount - input;
        
        // Flash loan fee (if used)
        let flash_loan_fee = if opp.use_flash_loan {
            input * 0.0009 // Aave: 0.09%
        } else {
            0.0
        };
        
        // Gas costs (single transaction with flash loan)
        let gas_estimate = self.gas_oracle.estimate_gas(GasOperation::FlashLoanTriangular);
        let gas_cost = self.gas_oracle.gas_to_usd(gas_estimate);
        
        let net_profit = gross_profit - total_fees - flash_loan_fee - gas_cost;
        
        PLResult {
            gross_profit,
            fees: total_fees + flash_loan_fee,
            gas_cost,
            net_profit,
            net_profit_pct: net_profit / input,
            break_even_size: 0.0,
            confidence: self.assess_triangular_confidence(path),
        }
    }
}
```

### 4.3 False Positive Filtering

```rust
pub struct FalsePositiveFilter {
    /// Historical opportunity tracking
    opportunity_history: DashMap<ArbKey, OpportunityHistory>,
    
    /// Success rate per pattern
    pattern_success_rates: DashMap<Pattern, f64>,
    
    /// Minimum confidence threshold
    min_confidence: f64,
}

impl FalsePositiveFilter {
    pub fn should_execute(&self, opp: &ArbOpportunity) -> FilterDecision {
        let key = opp.to_key();
        
        // 1. Check if we've seen this opportunity before
        if let Some(history) = self.opportunity_history.get(&key) {
            // If failed recently, skip
            if history.recent_failure_count > 2 {
                return FilterDecision::Reject(RejectReason::RecentFailures);
            }
            
            // If success rate is too low
            if history.success_rate() < 0.3 {
                return FilterDecision::Reject(RejectReason::LowSuccessRate);
            }
        }
        
        // 2. Liquidity check
        if !self.verify_liquidity(opp) {
            return FilterDecision::Reject(RejectReason::InsufficientLiquidity);
        }
        
        // 3. Price staleness check
        if self.is_price_stale(opp) {
            return FilterDecision::Reject(RejectReason::StaleData);
        }
        
        // 4. Slippage simulation
        let simulated_slippage = self.simulate_slippage(opp);
        if simulated_slippage > opp.max_allowed_slippage {
            return FilterDecision::Reject(RejectReason::ExcessiveSlippage);
        }
        
        // 5. Front-running risk assessment
        let front_run_risk = self.assess_front_run_risk(opp);
        if front_run_risk > 0.7 {
            return FilterDecision::Defer(Duration::from_millis(100));
        }
        
        FilterDecision::Accept
    }
    
    fn verify_liquidity(&self, opp: &ArbOpportunity) -> bool {
        // Check that the order book depth supports the intended size
        for leg in &opp.legs {
            let available_liquidity = self.get_available_liquidity(&leg.venue, &leg.asset, leg.side);
            if available_liquidity < leg.size * 1.5 { // 50% buffer
                return false;
            }
        }
        true
    }
    
    fn simulate_slippage(&self, opp: &ArbOpportunity) -> f64 {
        // Simulate execution at current market conditions
        let mut total_expected_slippage = 0.0;
        
        for leg in &opp.legs {
            let order_book = self.get_order_book(&leg.venue, &leg.asset);
            let fill_price = order_book.get_fill_price(leg.side, leg.size);
            
            if let Some(fill_price) = fill_price {
                let slippage = (fill_price - leg.target_price).abs() / leg.target_price;
                total_expected_slippage += slippage;
            } else {
                return 1.0; // Cannot fill
            }
        }
        
        total_expected_slippage
    }
}
```

---

## 5. Execution Engine

### 5.1 Transaction Pre-signing

```rust
pub struct PreSignedTransactionManager {
    wallet: LocalWallet,
    nonce_manager: NonceManager,
    tx_cache: DashMap<TxTemplate, Vec<PreSignedTx>>,
}

#[derive(Hash, Eq, PartialEq, Clone)]
pub enum TxTemplate {
    PolymarketBuyYes { market_id: String },
    PolymarketBuyNo { market_id: String },
    UniswapV2Swap { path: Vec<Address> },
    UniswapV3Swap { pool: Address, zero_for_one: bool },
    AaveFlashLoan { assets: Vec<Address> },
}

#[derive(Clone)]
pub struct PreSignedTx {
    pub template: TxTemplate,
    pub tx: TypedTransaction,
    pub signature: Signature,
    pub max_fee_per_gas: U256,
    pub max_priority_fee_per_gas: U256,
    pub valid_until: Instant,
}

impl PreSignedTransactionManager {
    /// Pre-sign common transactions with current gas parameters
    pub async fn pre_sign_common_transactions(&self) -> Result<(), ArbError> {
        let base_fee = self.gas_oracle.get_base_fee();
        let priority_fee = self.gas_oracle.get_priority_fee();
        
        let max_fee = base_fee * 2 + priority_fee; // EIP-1559
        
        // Pre-sign Polymarket orders
        for market in self.active_markets.iter() {
            let yes_tx = self.build_polymarket_buy_yes(&market, max_fee, priority_fee).await?;
            let no_tx = self.build_polymarket_buy_no(&market, max_fee, priority_fee).await?;
            
            self.tx_cache.entry(TxTemplate::PolymarketBuyYes { market_id: market.id.clone() })
                .or_default()
                .push(PreSignedTx {
                    template: TxTemplate::PolymarketBuyYes { market_id: market.id.clone() },
                    tx: yes_tx,
                    signature: self.wallet.sign_transaction(&yes_tx).await?,
                    max_fee_per_gas: max_fee,
                    max_priority_fee_per_gas: priority_fee,
                    valid_until: Instant::now() + Duration::from_secs(60),
                });
        }
        
        Ok(())
    }
    
    /// Get pre-signed transaction and update with current parameters if needed
    pub fn get_transaction(&self, template: &TxTemplate) -> Option<PreSignedTx> {
        let cache = self.tx_cache.get(template)?;
        
        // Find valid transaction
        for tx in cache.iter() {
            if tx.valid_until > Instant::now() {
                // Check if gas parameters are still acceptable
                let current_base = self.gas_oracle.get_base_fee();
                if tx.max_fee_per_gas > current_base * 12 / 10 { // Within 20%
                    return Some(tx.clone());
                }
            }
        }
        
        None
    }
}
```

### 5.2 Flashbots Integration

```rust
use flashbots::{FlashbotsClient, BundleRequest, SimulationRequest};

pub struct FlashbotsExecutor {
    client: FlashbotsClient,
    relay_endpoints: Vec<String>,
    auth_wallet: LocalWallet,
}

impl FlashbotsExecutor {
    pub async fn submit_bundle(&self, opportunity: &ArbOpportunity) -> Result<BundleResult, ArbError> {
        let bundle = self.build_bundle(opportunity).await?;
        
        // 1. Simulate bundle
        let simulation = self.simulate_bundle(&bundle).await?;
        
        if !simulation.success {
            return Err(ArbError::SimulationFailed(simulation.error_message.unwrap_or_default()));
        }
        
        // 2. Check profitability after simulation
        let simulated_profit = self.extract_profit_from_simulation(&simulation);
        if simulated_profit < opportunity.min_acceptable_profit {
            return Err(ArbError::InsufficientProfit);
        }
        
        // 3. Submit to multiple builders for redundancy
        let mut results = Vec::new();
        
        for endpoint in &self.relay_endpoints {
            match self.client.send_bundle(&bundle, endpoint).await {
                Ok(result) => results.push(result),
                Err(e) => warn!("Bundle submission failed to {}: {}", endpoint, e),
            }
        }
        
        // 4. Wait for inclusion
        if let Some(hash) = results.first().map(|r| r.bundle_hash) {
            let inclusion = self.wait_for_inclusion(hash, 3).await?;
            
            // 5. Record result
            self.record_execution(opportunity, &inclusion);
            
            Ok(inclusion)
        } else {
            Err(ArbError::NoBuildersAvailable)
        }
    }
    
    async fn build_bundle(&self, opp: &ArbOpportunity) -> Result<BundleRequest, ArbError> {
        let mut bundle = BundleRequest::new()
            .set_block_target(self.get_next_block_number());
        
        // Add transactions
        for leg in &opp.legs {
            let tx = match leg {
                OrderLeg::Polymarket { side, market, size } => {
                    self.build_polymarket_tx(side, market, *size).await?
                }
                OrderLeg::OnChainSwap { router, path, amount } => {
                    self.build_swap_tx(router, path, *amount).await?
                }
                OrderLeg::FlashLoan { provider, asset, amount } => {
                    self.build_flash_loan_tx(provider, asset, *amount).await?
                }
            };
            
            bundle = bundle.add_transaction(tx);
        }
        
        // Set revert protection for first transaction
        bundle = bundle.set_revert_protection(true);
        
        // Set target block(s)
        let current_block = self.provider.get_block_number().await?.as_u64();
        bundle = bundle
            .set_target_block(current_block + 1)
            .set_min_timestamp(self.get_block_timestamp(current_block + 1))
            .set_max_timestamp(self.get_block_timestamp(current_block + 3));
        
        Ok(bundle)
    }
}
```

### 5.3 Multi-Venue Execution

```rust
pub struct ExecutionOrchestrator {
    polymarket_executor: PolymarketExecutor,
    kalsi_executor: KalsiExecutor,
    dex_executor: DEXExecutor,
    flashbots_executor: FlashbotsExecutor,
    
    /// In-flight executions
    active_executions: DashMap<ExecutionId, ExecutionState>,
}

impl ExecutionOrchestrator {
    pub async fn execute_opportunity(&self, opp: ArbOpportunity) -> Result<ExecutionResult, ArbError> {
        let execution_id = ExecutionId::new();
        let start = Instant::now();
        
        // 1. Pre-execution validation
        self.validate_opportunity(&opp).await?;
        
        // 2. Lock capital
        let capital_lock = self.reserve_capital(&opp).await?;
        
        // 3. Route to appropriate executor
        let result = match opp.execution_strategy {
            ExecutionStrategy::Flashbots => {
                self.execute_via_flashbots(&opp).await
            }
            ExecutionStrategy::Sequential => {
                self.execute_sequential(&opp).await
            }
            ExecutionStrategy::Parallel => {
                self.execute_parallel(&opp).await
            }
            ExecutionStrategy::Atomic => {
                self.execute_atomic(&opp).await
            }
        };
        
        // 4. Record execution metrics
        let duration = start.elapsed();
        metrics::histogram!("execution_duration_ms", duration.as_millis() as f64);
        
        // 5. Update risk controls
        match &result {
            Ok(_) => self.risk_manager.record_success(&opp),
            Err(_) => {
                self.risk_manager.record_failure(&opp).await;
                self.check_circuit_breaker().await;
            }
        }
        
        // 6. Release capital
        drop(capital_lock);
        
        result
    }
    
    async fn execute_sequential(&self, opp: &ArbOpportunity) -> Result<ExecutionResult, ArbError> {
        let mut executed_legs = Vec::new();
        let mut total_filled = 0.0;
        
        for (i, leg) in opp.legs.iter().enumerate() {
            // Execute leg
            let leg_result = match &leg.venue {
                Venue::Polymarket => self.polymarket_executor.execute(leg).await,
                Venue::Kalsi => self.kalsi_executor.execute(leg).await,
                Venue::Uniswap | Venue::Curve | Venue::Balancer => {
                    self.dex_executor.execute(leg).await
                }
            };
            
            match leg_result {
                Ok(filled) => {
                    executed_legs.push(LegExecution {
                        leg: leg.clone(),
                        filled,
                        timestamp: Instant::now(),
                    });
                    total_filled += filled;
                }
                Err(e) => {
                    // Partial execution - decide whether to hedge or abort
                    if i > 0 && !executed_legs.is_empty() {
                        self.handle_partial_execution(opp, &executed_legs).await?;
                    }
                    return Err(e);
                }
            }
        }
        
        Ok(ExecutionResult {
            opportunity: opp.clone(),
            legs: executed_legs,
            total_filled,
            execution_time: opp.detection_time.elapsed(),
        })
    }
    
    async fn execute_parallel(&self, opp: &ArbOpportunity) -> Result<ExecutionResult, ArbError> {
        let mut futures = Vec::new();
        
        for leg in &opp.legs {
            let fut = match &leg.venue {
                Venue::Polymarket => self.polymarket_executor.execute(leg),
                Venue::Kalsi => self.kalsi_executor.execute(leg),
                _ => self.dex_executor.execute(leg),
            };
            futures.push(fut);
        }
        
        // Execute all legs concurrently
        let results = futures::future::join_all(futures).await;
        
        // Check results
        let mut all_success = true;
        let mut executed_legs = Vec::new();
        
        for (i, result) in results.iter().enumerate() {
            match result {
                Ok(filled) => {
                    executed_legs.push(LegExecution {
                        leg: opp.legs[i].clone(),
                        filled: *filled,
                        timestamp: Instant::now(),
                    });
                }
                Err(_) => {
                    all_success = false;
                }
            }
        }
        
        if !all_success {
            // Hedge any filled positions
            self.hedge_partial_fill(opp, &executed_legs).await?;
            return Err(ArbError::PartialExecution);
        }
        
        Ok(ExecutionResult {
            opportunity: opp.clone(),
            legs: executed_legs,
            total_filled: executed_legs.iter().map(|l| l.filled).sum(),
            execution_time: opp.detection_time.elapsed(),
        })
    }
}
```

### 5.4 Gas Price Optimization

```rust
pub struct GasOracle {
    provider: Arc<Provider<Http>>,
    base_fee_history: RingBuffer<U256>,
    priority_fee_percentiles: PriorityFeePercentiles,
    eth_price: AtomicF64,
}

impl GasOracle {
    /// Get optimal gas price for arbitrage execution
    pub fn get_optimal_gas_params(&self, urgency: Urgency) -> GasParams {
        let base_fee = self.get_base_fee();
        
        let max_priority_fee = match urgency {
            Urgency::Low => self.priority_fee_percentiles.p20,
            Urgency::Normal => self.priority_fee_percentiles.p50,
            Urgency::High => self.priority_fee_percentiles.p80,
            Urgency::Critical => self.priority_fee_percentiles.p95,
        };
        
        // For MEV bundles, we can pay higher priority fee since it's back-running
        let max_fee_per_gas = base_fee * 2 + max_priority_fee;
        
        GasParams {
            max_fee_per_gas,
            max_priority_fee_per_gas: max_priority_fee,
            base_fee,
        }
    }
    
    /// Calculate gas cost in USD
    pub fn gas_cost_usd(&self, gas_units: U256, gas_params: &GasParams) -> f64 {
        let total_gas_eth = gas_params.max_fee_per_gas * gas_units;
        let eth_amount = total_gas_eth.as_u128() as f64 / 1e18;
        eth_amount * self.eth_price.load(Ordering::Relaxed)
    }
    
    /// Check if transaction is profitable after gas costs
    pub fn is_profitable_after_gas(&self, expected_profit_usd: f64, gas_estimate: U256, urgency: Urgency) -> bool {
        let gas_params = self.get_optimal_gas_params(urgency);
        let gas_cost = self.gas_cost_usd(gas_estimate, &gas_params);
        
        expected_profit_usd > gas_cost * 1.5 // 50% buffer
    }
    
    /// Update base fee on each new block
    pub async fn update_on_new_block(&self, block: &Block<H256>) {
        if let Some(base_fee) = block.base_fee_per_gas {
            self.base_fee_history.push(base_fee);
            
            // Calculate moving average
            let avg_base_fee = self.base_fee_history.iter().sum::<U256>() 
                / self.base_fee_history.len();
            
            metrics::gauge!("base_fee_gwei", avg_base_fee.as_u128() as f64 / 1e9);
        }
    }
}
```

---

## 6. Risk Management System

### 6.1 Position Limits & Controls

```rust
pub struct RiskManager {
    /// Maximum position size per opportunity
    max_position_usd: AtomicF64,
    
    /// Maximum daily exposure
    max_daily_exposure: AtomicF64,
    
    /// Current positions
    positions: DashMap<Asset, Position>,
    
    /// Daily P&L tracking
    daily_pnl: AtomicF64,
    
    /// Consecutive failure tracking
    consecutive_failures: AtomicU64,
    
    /// Circuit breaker state
    circuit_breaker: AtomicBool,
    
    /// Lock for sequential execution
    execution_lock: Arc<Mutex<()>>,
}

impl RiskManager {
    pub async fn validate_opportunity(&self, opp: &ArbOpportunity) -> Result<(), RiskError> {
        // 1. Check circuit breaker
        if self.circuit_breaker.load(Ordering::SeqCst) {
            return Err(RiskError::CircuitBreakerOpen);
        }
        
        // 2. Check position size
        if opp.size > self.max_position_usd.load(Ordering::Relaxed) {
            return Err(RiskError::PositionTooLarge);
        }
        
        // 3. Check daily exposure
        let current_exposure = self.calculate_total_exposure();
        if current_exposure + opp.size > self.max_daily_exposure.load(Ordering::Relaxed) {
            return Err(RiskError::DailyExposureExceeded);
        }
        
        // 4. Check minimum profit threshold
        if opp.expected_profit_pct < 0.002 { // 0.2%
            return Err(RiskError::InsufficientProfit);
        }
        
        // 5. Check slippage limits
        if opp.estimated_slippage > 0.003 { // 0.3%
            return Err(RiskError::SlippageTooHigh);
        }
        
        // 6. Validate market conditions
        if !self.validate_market_conditions(opp).await {
            return Err(RiskError::MarketConditionsInvalid);
        }
        
        Ok(())
    }
    
    pub async fn record_failure(&self, opp: &ArbOpportunity) {
        let count = self.consecutive_failures.fetch_add(1, Ordering::SeqCst) + 1;
        
        warn!("Execution failed for {:?}, consecutive failures: {}", opp.opp_type, count);
        
        // Trigger circuit breaker after 2 consecutive failures
        if count >= 2 {
            self.trigger_circuit_breaker().await;
        }
    }
    
    pub fn record_success(&self, _opp: &ArbOpportunity) {
        self.consecutive_failures.store(0, Ordering::SeqCst);
    }
    
    async fn trigger_circuit_breaker(&self) {
        warn!("Circuit breaker triggered! Halting trading for cooldown period.");
        
        self.circuit_breaker.store(true, Ordering::SeqCst);
        
        // Alert operators
        self.alert_operator(AlertType::CircuitBreakerTriggered).await;
        
        // Schedule auto-reset
        tokio::spawn(async move {
            tokio::time::sleep(Duration::from_secs(300)).await; // 5 minute cooldown
            self.circuit_breaker.store(false, Ordering::SeqCst);
            self.consecutive_failures.store(0, Ordering::SeqCst);
            info!("Circuit breaker reset");
        });
    }
}
```

### 6.2 Slippage Protection

```rust
pub struct SlippageProtector {
    /// Maximum allowed slippage per venue
    venue_limits: DashMap<Venue, f64>,
    
    /// Dynamic slippage based on market volatility
    volatility_adjustment: AtomicBool,
}

impl SlippageProtector {
    pub fn calculate_max_slippage(&self, opp: &ArbOpportunity) -> f64 {
        let base_slippage = self.venue_limits.get(&opp.primary_venue)
            .map(|l| *l)
            .unwrap_or(0.003); // Default 0.3%
        
        if self.volatility_adjustment.load(Ordering::Relaxed) {
            // Adjust based on recent volatility
            let volatility = self.calculate_volatility(&opp.asset);
            let adjusted = base_slippage * (1.0 + volatility * 2.0);
            adjusted.min(0.01) // Cap at 1%
        } else {
            base_slippage
        }
    }
    
    /// Calculate expected slippage based on order book depth
    pub fn estimate_execution_slippage(&self, leg: &OrderLeg) -> f64 {
        let book = self.get_order_book(&leg.venue, &leg.asset);
        
        let mut remaining = leg.size;
        let mut weighted_price = 0.0;
        let mut total_filled = 0.0;
        
        let levels = match leg.side {
            Side::Buy => book.asks.iter(),
            Side::Sell => book.bids.iter().rev(),
        };
        
        for (price, qty) in levels {
            let fill_qty = remaining.min(*qty);
            weighted_price += price * fill_qty;
            total_filled += fill_qty;
            remaining -= fill_qty;
            
            if remaining <= 0.0 {
                break;
            }
        }
        
        if total_filled < leg.size {
            return 1.0; // Cannot fill completely
        }
        
        let avg_fill_price = weighted_price / total_filled;
        (avg_fill_price - leg.target_price).abs() / leg.target_price
    }
}
```

---

## 7. Monitoring & Observability

### 7.1 Real-Time P&L Dashboard

```rust
pub struct PnLTracker {
    /// Current unrealized P&L
    unrealized_pnl: AtomicF64,
    
    /// Realized P&L by day
    daily_realized: DashMap<Date, f64>,
    
    /// Trade history (ring buffer for memory efficiency)
    trade_history: RingBuffer<ExecutedTrade>,
    
    /// Metrics exporter
    metrics: Arc<MetricsExporter>,
}

impl PnLTracker {
    pub fn record_trade(&self, trade: ExecutedTrade) {
        // Update daily P&L
        let today = Utc::now().date_naive();
        self.daily_realized.entry(today).and_modify(|v| *v += trade.net_profit).or_insert(trade.net_profit);
        
        // Store in history
        self.trade_history.push(trade.clone());
        
        // Export metrics
        self.metrics.record_trade(&trade);
        
        // Log significant events
        if trade.net_profit.abs() > 100.0 {
            info!("Significant trade: Profit=${:.2}, Strategy={:?}", trade.net_profit, trade.strategy);
        }
    }
    
    pub fn get_dashboard_data(&self) -> DashboardData {
        let today = Utc::now().date_naive();
        
        DashboardData {
            current_unrealized: self.unrealized_pnl.load(Ordering::Relaxed),
            today_realized: self.daily_realized.get(&today).map(|v| *v).unwrap_or(0.0),
            week_realized: self.calculate_period_pnl(today - Duration::days(7), today),
            month_realized: self.calculate_period_pnl(today - Duration::days(30), today),
            total_trades_today: self.count_trades_today(),
            success_rate: self.calculate_success_rate_today(),
            avg_profit_per_trade: self.calculate_avg_profit(),
            active_opportunities: self.get_active_opportunity_count(),
        }
    }
}
```

### 7.2 Latency Metrics

```rust
pub struct LatencyMonitor {
    /// Event ingestion latency
    ingestion_histogram: Histogram,
    
    /// Detection latency (event → opportunity identified)
    detection_histogram: Histogram,
    
    /// Execution latency (decision → on-chain)
    execution_histogram: Histogram,
    
    /// End-to-end latency (event → confirmation)
    e2e_histogram: Histogram,
    
    /// WebSocket latency per venue
    venue_latency: DashMap<Venue, Histogram>,
}

impl LatencyMonitor {
    pub fn record_event(&self, event: MarketDataEvent) -> EventContext {
        EventContext {
            event_id: event.id,
            received_at: Instant::now(),
            venue: event.venue,
        }
    }
    
    pub fn record_detection(&self, ctx: &EventContext, opp: &ArbOpportunity) {
        let detection_latency = ctx.received_at.elapsed();
        self.detection_histogram.record(detection_latency.as_micros() as f64);
        
        // Track venue-specific latency
        if let Some(hist) = self.venue_latency.get(&ctx.venue) {
            hist.record(detection_latency.as_micros() as f64);
        }
        
        // Alert if latency exceeds threshold
        if detection_latency > Duration::from_millis(100) {
            warn!("High detection latency: {:?} for {:?}", detection_latency, opp.opp_type);
        }
    }
    
    pub fn record_execution(&self, opp: &ArbOpportunity, receipt: &TransactionReceipt) {
        let execution_latency = opp.detected_at.elapsed();
        self.execution_histogram.record(execution_latency.as_millis() as f64);
        
        // End-to-end latency
        let e2e_latency = opp.original_event_time.elapsed();
        self.e2e_histogram.record(e2e_latency.as_millis() as f64);
        
        metrics::histogram!("execution_latency_ms", execution_latency.as_millis() as f64);
        metrics::histogram!("e2e_latency_ms", e2e_latency.as_millis() as f64);
    }
}
```

### 7.3 Missed Opportunity Logging

```rust
pub struct MissedOpportunityLogger {
    /// Missed opportunities queue
    missed_queue: ArrayQueue<MissedOpportunity>,
    
    /// Pattern analysis
    pattern_analyzer: Arc<PatternAnalyzer>,
}

impl MissedOpportunityLogger {
    pub fn log_missed(&self, opp: &ArbOpportunity, reason: MissReason) {
        let missed = MissedOpportunity {
            opportunity: opp.clone(),
            reason,
            timestamp: Instant::now(),
            expected_profit: opp.expected_profit,
        };
        
        // Queue for later analysis
        let _ = self.missed_queue.push(missed);
        
        // Immediate analysis for pattern detection
        if reason == MissReason::ExecutionTimeout {
            self.pattern_analyzer.record_timeout_pattern(opp);
        }
        
        // Metrics
        metrics::counter!("missed_opportunities", 1, "reason" => reason.to_string());
    }
    
    pub fn generate_missed_opportunity_report(&self, period: Duration) -> MissedOpportunityReport {
        let cutoff = Instant::now() - period;
        
        let missed: Vec<_> = self.missed_queue.iter()
            .filter(|m| m.timestamp > cutoff)
            .collect();
        
        let total_missed_profit: f64 = missed.iter().map(|m| m.expected_profit).sum();
        
        MissedOpportunityReport {
            period,
            total_missed: missed.len(),
            total_missed_profit,
            by_reason: self.categorize_by_reason(&missed),
            by_type: self.categorize_by_type(&missed),
            top_missed: missed.iter().take(10).cloned().collect(),
        }
    }
}
```

---

## 8. Latency Budget & Benchmarks

### 8.1 Target Latency Budget

| Stage | Target | Max Acceptable | Measurement Point |
|-------|--------|----------------|-------------------|
| Network Ingestion | 5ms | 15ms | Packet → Parser |
| Market Data Parsing | 2ms | 5ms | Raw → Structured |
| Price Matrix Update | <1μs | 10μs | Update → Available |
| Opportunity Detection | 10ms | 50ms | Update → Signal |
| P&L Calculation | 5ms | 20ms | Signal → Validated |
| Risk Validation | 5ms | 15ms | Validated → Approved |
| Transaction Build | 10ms | 30ms | Approved → Signed |
| Bundle Submission | 20ms | 100ms | Signed → Relay |
| On-Chain Inclusion | 12s | 60s | Relay → Mined |
| **Total (Detection)** | **<100ms** | **<200ms** | Event → Decision |
| **Total (Execution)** | **<500ms** | **<1s** | Decision → Mined |

### 8.2 Performance Benchmarks

```rust
#[cfg(test)]
mod benchmarks {
    use test::Bencher;
    
    #[bench]
    fn bench_price_matrix_update(b: &mut Bencher) {
        let matrix = PriceMatrix::new();
        let update = create_sample_update();
        
        b.iter(|| {
            matrix.update_price(Asset::ETH, Venue::Uniswap, update.clone());
        });
        
        // Target: <1 microsecond
    }
    
    #[bench]
    fn bench_opportunity_detection(b: &mut Bencher) {
        let detector = PolymarketArbDetector::new();
        let state = create_sample_market_state();
        
        b.iter(|| {
            detector.check_arbitrage(&state.market_id);
        });
        
        // Target: <10 microseconds
    }
    
    #[bench]
    fn bench_triangular_path_finding(b: &mut Bencher) {
        let detector = TriangularArbDetector::with_sample_graph();
        
        b.iter(|| {
            detector.find_triangular_arbs(&Token::USDC);
        });
        
        // Target: <1 millisecond for 1000+ pools
    }
    
    #[bench]
    fn bench_pl_calculation(b: &mut Bencher) {
        let calc = PLCalculator::new();
        let opp = create_sample_opportunity();
        
        b.iter(|| {
            calc.calculate_expected_pl(&opp);
        });
        
        // Target: <5 microseconds
    }
}
```

### 8.3 Infrastructure Requirements

| Component | Spec | Purpose |
|-----------|------|---------|
| Primary Node | 16 vCPU, 64GB RAM | Core engine, detection |
| Execution Node | 8 vCPU, 32GB RAM | Transaction signing, submission |
| RPC Node | 8 vCPU, 32GB RAM | Local Ethereum node (Geth/Erigon) |
| Network | 10Gbps, <1ms to exchanges | WebSocket data feeds |
| Location | AWS us-east-1 / eu-west-1 | Proximity to venues |

---

## 9. Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2)

- [ ] Set up development environment (Rust, Go)
- [ ] Implement WebSocket connection manager
- [ ] Build order book reconstruction engine
- [ ] Create price matrix data structure
- [ ] Basic Polymarket integration

**Deliverable:** Real-time price feed for 100+ markets

### Phase 2: Detection Engine (Weeks 3-4)

- [ ] Polymarket internal arbitrage detector
- [ ] Cross-exchange price comparison
- [ ] P&L calculation engine
- [ ] False positive filtering
- [ ] Unit test suite with 90%+ coverage

**Deliverable:** Opportunity detection with <10ms latency

### Phase 3: Execution (Weeks 5-6)

- [ ] Pre-signed transaction system
- [ ] Flashbots integration
- [ ] Basic execution engine (sequential)
- [ ] Gas price oracle
- [ ] Paper trading mode

**Deliverable:** Simulated execution with full pipeline

### Phase 4: Risk & Monitoring (Weeks 7-8)

- [ ] Risk management system
- [ ] Position tracking
- [ ] Circuit breaker implementation
- [ ] Prometheus metrics
- [ ] Grafana dashboards

**Deliverable:** Production-ready risk controls

### Phase 5: Advanced Strategies (Weeks 9-10)

- [ ] DEX integration (Uniswap, Curve)
- [ ] Triangular arbitrage detection
- [ ] Flash loan integration
- [ ] Parallel execution
- [ ] Performance optimization

**Deliverable:** Multi-strategy arbitrage engine

### Phase 6: Production (Weeks 11-12)

- [ ] Production deployment
- [ ] Monitoring and alerting
- [ ] Documentation
- [ ] Gradual capital deployment
- [ ] Performance tuning

**Deliverable:** Live trading with full safeguards

---

## 10. Code Architecture

### 10.1 Project Structure

```
arbitrage-engine/
├── Cargo.toml
├── src/
│   ├── main.rs
│   ├── lib.rs
│   ├── config/
│   │   ├── mod.rs
│   │   ├── settings.rs
│   │   └── venues.rs
│   ├── ingestion/
│   │   ├── mod.rs
│   │   ├── websocket.rs
│   │   ├── orderbook.rs
│   │   └── dex_monitor.rs
│   ├── detection/
│   │   ├── mod.rs
│   │   ├── price_matrix.rs
│   │   ├── polymarket.rs
│   │   ├── cross_exchange.rs
│   │   ├── triangular.rs
│   │   └── funding.rs
│   ├── execution/
│   │   ├── mod.rs
│   │   ├── orchestrator.rs
│   │   ├── flashbots.rs
│   │   ├── polymarket.rs
│   │   ├── presigner.rs
│   │   └── gas.rs
│   ├── risk/
│   │   ├── mod.rs
│   │   ├── manager.rs
│   │   ├── limits.rs
│   │   └── circuit_breaker.rs
│   ├── monitoring/
│   │   ├── mod.rs
│   │   ├── pnl.rs
│   │   ├── latency.rs
│   │   ├── missed.rs
│   │   └── metrics.rs
│   ├── types/
│   │   ├── mod.rs
│   │   ├── primitives.rs
│   │   ├── events.rs
│   │   └── opportunities.rs
│   └── utils/
│       ├── mod.rs
│       ├── ringbuffer.rs
│       └── simd.rs
├── tests/
│   ├── integration_tests.rs
│   └── benchmarks.rs
└── config/
    ├── default.toml
    ├── production.toml
    └── venues.yaml
```

### 10.2 Key Dependencies

```toml
[dependencies]
# Async runtime
tokio = { version = "1.0", features = ["full", "parking_lot"] }

# Web3/ethers
ethers = { version = "2.0", features = ["ws", "rustls"] }

# WebSocket
tokio-tungstenite = "0.20"

# Data structures
dashmap = "5.0"
crossbeam = "0.8"
parking_lot = "0.12"

# Serialization
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"

# Math/decimals
rust_decimal = "1.32"
primitive-types = "0.12"

# Metrics
metrics = "0.22"
metrics-exporter-prometheus = "0.13"

# Logging
tracing = "0.1"
tracing-subscriber = "0.3"

# Testing
tokio-test = "0.4"
criterion = { version = "0.5", features = ["async_tokio"] }

# Flashbots
flashbots = "0.10"

# Error handling
thiserror = "1.0"
anyhow = "1.0"
```

### 10.3 Configuration Example

```toml
# config/production.toml
[engine]
mode = "production" # or "paper_trading"
log_level = "info"
metrics_port = 9090

[latency]
target_detection_ms = 100
target_execution_ms = 500
max_ingestion_ms = 15

[polymarket]
ws_url = "wss://ws.polymarket.com/v1/stream"
api_key = "${POLYMARKET_API_KEY}"
api_secret = "${POLYMARKET_API_SECRET}"
taker_fee = 0.001

[risk]
max_position_usd = 5000.0
max_daily_exposure_usd = 50000.0
min_profit_threshold = 0.002
max_slippage = 0.003
circuit_breaker_failures = 2

[flashbots]
relay_endpoints = [
    "https://relay.flashbots.net",
    "https://rpc.titanbuilder.xyz",
    "https://relay.edennetwork.io"
]
auth_key = "${FLASHBOTS_AUTH_KEY}"

[gas]
max_priority_fee_gwei = 50
base_fee_multiplier = 2.0
```

---

## 11. Security Considerations

### 11.1 Key Management

```rust
pub struct SecureKeyManager {
    /// Hardware Security Module integration
    hsm: Option<HSMClient>,
    
    /// Encrypted key store
    keystore: Arc<RwLock<KeyStore>>,
    
    /// Key rotation schedule
    rotation_policy: RotationPolicy,
}

impl SecureKeyManager {
    /// Load keys from secure storage
    pub async fn load_keys(&self) -> Result<Vec<LocalWallet>, KeyError> {
        match &self.hsm {
            Some(hsm) => hsm.load_signing_keys().await,
            None => self.load_from_encrypted_keystore().await,
        }
    }
    
    /// Sign transaction with HSM or secure enclave
    pub async fn sign_transaction(&self, tx: &TypedTransaction) -> Result<Signature, KeyError> {
        // Prefer HSM if available
        if let Some(hsm) = &self.hsm {
            return hsm.sign(tx).await;
        }
        
        // Fallback to encrypted in-memory key (ephemeral)
        let wallet = self.get_ephemeral_wallet().await?;
        Ok(wallet.sign_transaction(tx).await?)
    }
}
```

### 11.2 Access Controls

```rust
pub struct AccessControl {
    /// Multi-sig requirements for large trades
    multi_sig_threshold: U256,
    
    /// IP whitelist for RPC access
    allowed_ips: Arc<RwLock<Vec<IpAddr>>>,
    
    /// Rate limiting
    rate_limiter: RateLimiter,
}

impl AccessControl {
    pub async fn validate_trade_request(&self, request: &TradeRequest) -> Result<(), AccessError> {
        // Check size against multi-sig threshold
        if request.total_value() > self.multi_sig_threshold {
            return Err(AccessError::MultiSigRequired);
        }
        
        // Validate IP
        if !self.allowed_ips.read().await.contains(&request.source_ip) {
            return Err(AccessError::UnauthorizedIP);
        }
        
        // Check rate limit
        if !self.rate_limiter.check(request.source_ip).await {
            return Err(AccessError::RateLimitExceeded);
        }
        
        Ok(())
    }
}
```

### 11.3 MEV Protection

```rust
pub struct MEVProtection {
    /// Flashbots Protect RPC
    protect_rpc: String,
    
    /// Bundle simulation before submission
    simulate_before_submit: bool,
    
    /// Private mempool connections
    private_relays: Vec<String>,
}

impl MEVProtection {
    /// Execute with MEV protection
    pub async fn execute_protected(&self, bundle: BundleRequest) -> Result<TxHash, ArbError> {
        // 1. Simulate bundle to check for frontrunning
        if self.simulate_before_submit {
            let simulation = self.simulate_bundle(&bundle).await?;
            
            // Check for sandwich risk
            if self.detect_sandwich_risk(&simulation) {
                warn!("Sandwich attack risk detected, deferring execution");
                return Err(ArbError::MEVRiskDetected);
            }
        }
        
        // 2. Submit to private relays only
        for relay in &self.private_relays {
            match self.submit_to_relay(&bundle, relay).await {
                Ok(hash) => return Ok(hash),
                Err(e) => warn!("Relay {} failed: {}", relay, e),
            }
        }
        
        Err(ArbError::AllRelaysFailed)
    }
}
```

---

## Appendix A: API Reference

### A.1 Polymarket WebSocket Messages

```typescript
// Subscribe to market data
{
  "type": "subscribe",
  "channel": "market_prices",
  "markets": ["0x...", "0x..."] // or "all_active"
}

// Price update message
{
  "type": "price_update",
  "market": "0x...",
  "timestamp": 1699900000000,
  "yes": {
    "bid": 0.65,
    "ask": 0.66,
    "bid_size": 5000,
    "ask_size": 3000
  },
  "no": {
    "bid": 0.34,
    "ask": 0.35,
    "bid_size": 3000,
    "ask_size": 5000
  }
}

// Order book update (L2)
{
  "type": "orderbook",
  "market": "0x...",
  "side": "yes",
  "sequence": 12345,
  "bids": [[0.65, 5000], [0.64, 10000]],
  "asks": [[0.66, 3000], [0.67, 8000]]
}
```

### A.2 Flashbots Bundle Format

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "eth_sendBundle",
  "params": [{
    "txs": ["0x1234...", "0x5678..."],
    "blockNumber": "0x1234567",
    "minTimestamp": 1699900000,
    "maxTimestamp": 1699900060,
    "revertingTxHashes": []
  }]
}
```

---

## Appendix B: Testing Strategy

### B.1 Unit Tests

- Price matrix operations
- Order book reconstruction
- P&L calculations
- Risk validation logic

### B.2 Integration Tests

- WebSocket connection lifecycle
- End-to-end paper trading
- Flashbots bundle submission (testnet)
- Circuit breaker functionality

### B.3 Load Tests

- 1000+ concurrent WebSocket connections
- 100,000+ price updates per second
- 1000+ opportunity evaluations per second

### B.4 Chaos Testing

- Network partition simulation
- Exchange API failure
- RPC node failure
- Memory pressure testing

---

## Appendix C: Operational Runbook

### C.1 Startup Procedure

1. Verify RPC node sync status
2. Load configuration and validate
3. Connect to WebSocket feeds
4. Wait for order book synchronization
5. Enable detection (dry-run mode)
6. Verify metrics pipeline
7. Enable execution (if production)

### C.2 Monitoring Checklist

- [ ] WebSocket connection health
- [ ] Price update latency < 10ms
- [ ] Detection latency < 100ms
- [ ] Execution success rate > 90%
- [ ] No circuit breaker triggers
- [ ] Gas prices within expected range
- [ ] Daily P&L tracking

### C.3 Emergency Procedures

**Circuit Breaker Triggered:**
1. Check recent logs for error patterns
2. Verify exchange connectivity
3. Review recent trades for anomalies
4. Manual reset after investigation

**Flashbots Relay Failure:**
1. Switch to backup relay
2. Consider public mempool submission
3. Reduce position sizes
4. Monitor for MEV attacks

**Exchange API Outage:**
1. Disable affected strategies
2. Hedge any open positions
3. Wait for service restoration
4. Verify price synchronization before re-enabling

---

*Document Version: 1.0*
*Last Updated: 2025-01-21*
*Author: AI Systems Design*
