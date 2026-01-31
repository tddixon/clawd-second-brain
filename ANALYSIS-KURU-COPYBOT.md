# Kuru Copy Trading Bot - Deep Dive Analysis

**Repository:** https://github.com/chainstacklabs/kuru-copy-trading-bot  
**Platform:** Kuru DEX on Monad blockchain  
**Framework:** Python 3.10+ with Web3.py  
**Analysis Date:** 2026-01-31

---

## 1. COPY TRADING MECHANICS

### 1.1 Wallet Tracking Architecture

**Event-Driven Subscription Model:**
```python
# Core subscription mechanism via WebSocket RPC
subscriber = BlockchainEventSubscriber(
    rpc_ws_url=rpc_ws_url,
    market_address=market_address,
    orderbook_abi=kuru_client.orderbook_abi,
    size_precision=market_params.size_precision,
    price_precision=market_params.price_precision,
)
```

**Key Design Pattern:** The bot uses `eth_subscribe` with `logs` filter to monitor specific market contract addresses. This is more efficient than polling.

**Monitored Events:**
1. **OrderCreated** - Primary signal for copying (limit orders)
2. **Trade** - Fill tracking only (not used for copying)
3. **OrdersCanceled** - Synchronize cancellations

### 1.2 Trade Detection Methods

**Critical Insight:** The bot ONLY copies via `OrderCreated` events, NOT `Trade` events.

```python
# From bot.py - Trade callback handles FILLS only, not copying
async def on_trade(trade_response: TradeResponse):
    # 1. Track fills on our own orders (for statistics)
    # 2. Log source wallet fills (informational only)
    # NOTE: We do NOT copy trades here - would duplicate orders
```

**Why This Matters:**
- Trade events fire when orders are FILLED
- By the time a trade event emits, the price opportunity may be gone
- OrderCreated events fire when orders are PLACED - better for mirroring

### 1.3 Execution Timing & Latency

**Current Architecture Latency Points:**
1. WebSocket event propagation from RPC node
2. Event parsing and signature matching
3. Callback dispatch and order processing
4. Position size calculation
5. Risk validation
6. Transaction submission via HTTP RPC

**Identified Optimization Gap (from README):**
> "Educational project with optimization opportunities. Multiple RPC calls per signal introduce latency between source order and bot execution."

**Our Whale Tracker Target (8-15s) vs Kuru Bot:**
- Kuru bot makes multiple sequential RPC calls per signal
- Each call adds network round-trip latency
- No caching of market parameters between orders
- Uses separate HTTP connection for order submission vs WebSocket for events

### 1.4 Position Sizing Logic

**PositionSizeCalculator class** (`risk/calculator.py`):

```python
def calculate(self, source_size, available_balance, price):
    # Step 1: Apply copy ratio
    target_size = source_size * self.copy_ratio
    
    # Step 2: Enforce minimum order size (early)
    if target_value < self.min_order_size:
        if self.enforce_minimum:
            target_size = self.min_order_size / price
        else:
            return Decimal("0")
    
    # Step 3: Apply maximum position size limit
    if target_value > self.max_position_size:
        target_size = self.max_position_size / price
    
    # Step 4: Check available balance
    if required_capital > available_balance:
        if self.respect_balance:
            # Scale down to fit available balance
            affordable_size = available_balance / price
            target_size = min(target_size, affordable_size)
        else:
            return Decimal("0")
    
    # Step 5: Final minimum check after balance adjustment
    # Return 0 if scaled below minimum
```

**Key Features:**
- Copy ratio (0.1 = 10% of source size)
- Min/max USD bounds
- Balance-aware scaling (`respect_balance=True`)
- Margin requirement support

---

## 2. WALLET ANALYSIS

### 2.1 Wallet Identification Strategy

**Configuration-Driven:**
```python
SOURCE_WALLETS=0xTraderAddress1,0xTraderAddress2
MARKET_ADDRESSES=0xMarketContract1,0xMarketContract2
```

**Limitation:** The bot does NOT include wallet discovery or performance scoring. It's purely reactive - you must pre-identify profitable wallets.

### 2.2 Performance Tracking Methodology

**Statistics Tracked (bot level):**
```python
{
    "orders_detected": int,           # From source wallets
    "orders_canceled_detected": int,  # Cancellation signals
    "successful_orders": int,         # Our placed orders
    "failed_orders": int,
    "rejected_orders": int,
    "orders_canceled": int,           # Our canceled orders
    "fill_rate": float,               # % of our orders filled
    "open_orders": int,
}
```

**Missing:** Per-wallet performance tracking, P&L calculation, win rate by source.

### 2.3 Risk Scoring of Targets

**NOT IMPLEMENTED** - The bot has no internal wallet risk scoring. Risk management is position-level only.

**Available Risk Controls:**
- Market whitelist/blacklist
- Per-order min/max size limits
- Total exposure cap across all markets
- Minimum balance threshold

### 2.4 Multi-Wallet Portfolio Management

**Architecture:**
```python
class CopyTradingBot:
    def __init__(self, source_wallets: list[str], ...):
        self.source_wallets = [addr.lower() for addr in source_wallets]
```

**Order Mapping for Cancellation Sync:**
```python
# Maps source_order_id -> our_order_id
self._order_mapping: dict[int, str] = {}
```

**Aggregate Risk Application:**
- All source wallets share the same risk parameters
- No per-wallet copy ratio customization
- Total exposure tracked globally, not per-source

---

## 3. TECHNICAL IMPLEMENTATION

### 3.1 On-Chain Data Parsing

**Event Signature Computation:**
```python
# Dynamically compute event signatures from ABI
for event_name in ["OrderCreated", "Trade", "OrdersCanceled"]:
    event = getattr(self.contract.events, event_name)
    event_abi = event._get_event_abi()
    input_types = ",".join([inp["type"] for inp in event_abi["inputs"]])
    event_signature = f"{event_abi['name']}({input_types})"
    signature_hash = self.w3.keccak(text=event_signature).hex()
```

**Log Parsing Pattern:**
```python
async def _parse_log(self, log_entry):
    event_signature = log_entry["topics"][0]
    
    if event_signature == self.event_signatures["OrderCreated"]:
        await self._handle_order_created(log_entry)
    elif event_signature == self.event_signatures["Trade"]:
        await self._handle_trade(log_entry)
    # ...
```

### 3.2 Event Monitoring Architecture

**WebSocket Reconnection Logic:**
```python
async def _reconnect(self) -> bool:
    while self.running:
        self._reconnect_attempts += 1
        
        # Exponential backoff (max 60s)
        delay = min(self.reconnect_delay * (2 ** (attempts - 1)), 60)
        await asyncio.sleep(delay)
        
        try:
            self.ws = await connect(self.rpc_ws_url)
            # Re-subscribe to logs
            # ...
```

**Event Decoding Example (OrderCreated):**
```python
event = self.contract.events.OrderCreated().process_log(log_entry)
args = event["args"]

# Precision handling
size_decimal = args["size"] / self.size_precision  # 18 decimals
price_decimal = args["price"] / self.price_precision  # 6 decimals
```

### 3.3 Transaction Reconstruction

**Order Structure:**
```python
order_response = OrderResponse(
    order_id=args["orderId"],           # uint40
    market_address=self.market_address,
    owner=args["owner"],                 # address
    price=str(price_decimal),            # uint32 with precision
    size=str(size_decimal),              # uint96 with precision
    is_buy=args["isBuy"],                # bool
    transaction_hash=log_entry["transactionHash"],
    trigger_time=int(time.time()),
)
```

### 3.4 Slippage Protection

**NOT EXPLICITLY IMPLEMENTED** - The bot uses limit orders exclusively:
```python
order_id = self.kuru_client.place_limit_order(
    market=order.market,
    side=order.side,
    size=calculated_size,
    price=order.price,
    post_only=True,  # Maker-only orders
)
```

**Implicit Slippage Control:**
- Post-only orders (maker-only) - won't execute as taker
- Copies exact price from source order
- No market order support

---

## 4. INTEGRATION WITH WHALE TRACKER

### 4.1 Architectural Compatibility

**Kuru Bot Pattern:**
```
WebSocket RPC → Event Parse → Risk Check → HTTP RPC Submit
```

**Proposed Whale Tracker Pattern:**
```
Mempool/WS Stream → Filter Engine → Latency Optimized Submit
                         ↓
                   Intent Classifier
                   (Swap/Bridge/LP)
```

### 4.2 Latency Optimization Techniques from Kuru

**What Kuru Does Well:**
1. WebSocket subscription vs polling
2. Event signature pre-computation
3. Async callback architecture
4. Connection auto-reconnection
5. Parallel market subscriptions

**What Kuru Could Improve (for our target 8-15s):**
1. Cache market parameters (currently fetched per order)
2. Batch validation checks
3. Connection pooling for HTTP RPC
4. Pre-signed transactions
5. Parallel execution path

### 4.3 Code Patterns to Adopt

**Pattern 1: Event Signature Caching**
```python
# Pre-compute event signatures on init
self.event_signatures = {}
for event_name in ["OrderCreated", "Trade", "OrdersCanceled"]:
    # ... compute once, use forever
```

**Pattern 2: Structured Callback System**
```python
def _create_order_created_callback(self, market_address):
    async def on_order_created(order_response: OrderResponse):
        # Handler with captured context
    return on_order_created

subscriber.set_order_created_callback(
    self._create_order_created_callback(market_address)
)
```

**Pattern 3: Order State Management**
```python
class OrderTracker:
    def register_order(self, order_id: str, size: Decimal)
    def on_fill(self, order_id: str, filled_size: Decimal)
    def get_fill_rate(self) -> float
```

**Pattern 4: Circuit Breaker Pattern**
```python
class RetryQueue:
    def is_circuit_open(self) -> bool
    def record_failure(self)
    def record_success(self)
```

### 4.4 Risk Management Integration

**Kuru's ValidationResult Pattern:**
```python
@dataclass
class ValidationResult:
    is_valid: bool
    reason: str | None = None

# Usage
validation_result = self.validator.validate_order(order, balance)
if not validation_result.is_valid:
    logger.warning("Rejected", reason=validation_result.reason)
    return None
```

**Integration Point:** Our whale tracker should adopt similar structured validation with clear rejection reasons for observability.

---

## 5. PROFITABILITY MODEL

### 5.1 Expected Returns

**No Built-in P&L Tracking** - The Kuru bot doesn't calculate profitability metrics.

**Key Variables Affecting Returns:**
1. **Copy ratio** - Higher = more exposure, more fees
2. **Fill rate** - Limit orders may not fill if price moves
3. **Latency** - Slower execution = worse prices
4. **Gas costs** - Monad gas fees (currently low on testnet)

### 5.2 Optimal Wallet Tracking

**Configuration:** Multiple wallets supported but no optimization guidance
```python
SOURCE_WALLETS=0xAddr1,0xAddr2,0xAddr3  # Unlimited
```

**Practical Limits:**
- Each wallet adds event processing overhead
- Aggregate exposure cap applies across all sources
- No per-wallet risk weighting

### 5.3 Capital Allocation

**Per-Order Limits:**
```python
COPY_RATIO=0.1              # 10% of source size
MIN_ORDER_SIZE=10.0         # $10 USD minimum
MAX_POSITION_SIZE=100.0     # $100 USD per order
MAX_TOTAL_EXPOSURE=5000.0   # $5k total across all markets
```

**Balance-Aware Scaling:**
```python
if required_capital > available_balance:
    if self.respect_balance:
        # Scale down proportionally
        affordable_size = available_balance / price
        target_size = min(target_size, affordable_size)
```

---

## 6. KEY FILES REFERENCE

| File | Purpose |
|------|---------|
| `bot.py` | Main orchestrator, event callback handlers |
| `main.py` | Entry point, component initialization |
| `event_subscriber.py` | WebSocket subscription, log parsing |
| `copier.py` | Trade execution, retry logic |
| `calculator.py` | Position sizing with risk constraints |
| `validator.py` | Trade validation rules |
| `order_tracker.py` | Fill tracking and statistics |
| `retry_queue.py` | Failed order retry with circuit breaker |
| `settings.py` | Configuration management with Pydantic |

---

## 7. RECOMMENDATIONS FOR AUTONOMOUS AGENT INTEGRATION

### 7.1 Adopt These Patterns

1. **Structured event parsing** with ABI-driven signature matching
2. **Async callback architecture** with captured context
3. **Order state tracking** for fill monitoring
4. **Circuit breaker** for failure protection
5. **ValidationResult pattern** for clean rejection handling

### 7.2 Improve Upon Kuru

1. **Cache market parameters** - Don't fetch per order
2. **Parallel validation** - Check multiple constraints concurrently
3. **Pre-compute transactions** - Prepare calldata before signal
4. **Mempool monitoring** - For earlier signal detection
5. **Per-wallet tracking** - Performance scoring per source
6. **PnL calculation** - Realized and unrealized tracking

### 7.3 Latency Optimizations for 8-15s Target

| Current Kuru | Optimized Approach |
|--------------|-------------------|
| Multiple RPC calls per order | Batch/cache parameters |
| HTTP POST for each order | Connection pooling |
| Sequential validation | Parallel checks |
| WebSocket only | Mempool + WS combo |
| Post-only limit orders | Smart order routing |

---

## 8. SUMMARY

The Kuru copy trading bot is a well-structured educational implementation demonstrating:
- **Solid event-driven architecture** using WebSocket subscriptions
- **Clean separation of concerns** (risk, execution, tracking)
- **Proper error handling** with retry and circuit breaker patterns
- **Async Python patterns** suitable for high-frequency monitoring

**For our autonomous agent:** Use Kuru as a reference for event handling patterns and risk management structure, but implement significant latency optimizations to hit the 8-15s target window.

**Key Takeaway:** The bot's "copy on OrderCreated, not Trade" pattern is critical insight for our whale tracker - we should monitor pending transactions (mempool) not just confirmed trades to minimize latency.
