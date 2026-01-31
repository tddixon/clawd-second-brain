# Deep Dive Analysis: Pump.fun / Bonk.fun Trading Bot
## GitHub: chainstacklabs/pumpfun-bonkfun-bot (887+ stars)

**Analysis Date:** 2026-01-31  
**Repository:** https://github.com/chainstacklabs/pumpfun-bonkfun-bot  
**Primary Use Case:** Solana meme coin sniping on pump.fun and letsbonk.fun

---

## Executive Summary

This is one of the most popular open-source Solana trading bots, designed specifically for sniping newly launched tokens on pump.fun and letsbonk.fun. Key differentiators:

- **Zero 3rd party APIs** - Pure direct RPC/WebSocket approach
- **Multiple data sources** - logsSubscribe, blockSubscribe, Geyser gRPC, PumpPortal
- **Extreme speed optimizations** - Cached blockhashes, compute unit optimization, minimal RPC calls
- **Risk management** - Take profit/stop loss, position tracking, time-based exits
- **Self-hosted architecture** - No external dependencies beyond Solana infrastructure

---

## 1. SNIPING STRATEGY

### 1.1 Token Detection Methods

The bot implements **FOUR different listeners** for redundancy and speed comparison:

| Listener | Speed | Reliability | Use Case |
|----------|-------|-------------|----------|
| **Geyser gRPC** | Fastest | Requires special node | Production sniping |
| **logsSubscribe** | Fast | Universal RPC support | Fallback sniping |
| **blockSubscribe** | Medium | Requires node support | Block-level detection |
| **PumpPortal WebSocket** | Variable | External service | Additional source |

**Key Detection Logic:**
- Monitors pump.fun program ID: `6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P`
- Listens for `CreateEvent` discriminator: `bytes([27, 114, 169, 77, 222, 235, 99, 118])`
- Supports both legacy `Create` and `CreateV2` (Token2022) instructions
- Calculates associated bonding curve PDA on-the-fly (no extra RPC call needed)

### 1.2 Buy Trigger Mechanisms

**Standard Mode:**
1. Detect token creation via WebSocket
2. Wait configurable time for pool stabilization (default: 15s)
3. Fetch bonding curve state via RPC
4. Calculate token amount based on current price
5. Build and send buy transaction

**Extreme Fast Mode (`extreme_fast_mode: true`):**
- Skips pool stabilization wait
- Skips RPC price fetch
- Uses pre-configured token amount: `extreme_fast_token_amount`
- Estimates price: `price = buy_amount / extreme_fast_token_amount`
- **Trade-off:** Speed vs. price accuracy

### 1.3 Sell Strategies

The bot supports **THREE exit strategies**:

**A. Time-Based Exit (Legacy)**
```yaml
exit_strategy: "time_based"
wait_time_after_buy: 15  # seconds
```
- Simple: Buy → Wait X seconds → Sell
- No price monitoring
- Fastest execution path

**B. Take Profit / Stop Loss**
```yaml
exit_strategy: "tp_sl"
take_profit_percentage: 0.5    # 50% profit target
stop_loss_percentage: 0.2      # 20% loss limit
max_hold_time: 300             # 5 min max hold
price_check_interval: 10       # Check price every 10s
```
- Continuous price monitoring
- Exit on any of three conditions:
  - Price ≥ take_profit_price
  - Price ≤ stop_loss_price
  - Time ≥ max_hold_time

**C. Manual Exit**
```yaml
exit_strategy: "manual"
```
- Position remains open
- Manual intervention required

### 1.4 Speed Optimization Techniques

**Critical Optimizations:**

1. **Cached Blockhash** (`client.py`)
   - Background task updates blockhash every 5 seconds
   - Eliminates `getLatestBlockhash` RPC call per transaction
   - Reduces latency by ~100-200ms per tx

2. **Pre-computed Addresses**
   - Associated bonding curve calculated via PDA derivation
   - No RPC calls to find token accounts
   ```python
   derived_address, _ = Pubkey.find_program_address(
       [bytes(bonding_curve), bytes(TOKEN_PROGRAM_ID), bytes(mint)],
       ASSOCIATED_TOKEN_PROGRAM_ID,
   )
   ```

3. **Compute Unit Optimization**
   - Default CU limit: 85,000 (instead of 1.4M default)
   - `set_loaded_accounts_data_size_limit(512_000)` reduces overhead from 16k CU to ~128 CU
   - Configurable per operation (buy/sell)

4. **Transaction Detail Parsing**
   - Uses `preBalances/postBalances` from confirmed transaction
   - Extracts actual SOL spent and tokens received
   - Avoids separate token balance RPC calls

5. **Skip Preflight**
   - `skip_preflight=True` on all transactions
   - Eliminates simulation overhead
   - Risk: Invalid transactions burn fees

6. **Async Architecture**
   - `uvloop` for faster event loop
   - WebSocket connections with auto-reconnect
   - Separate token queue processor

---

## 2. NO 3RD PARTY APIs

### 2.1 Data Acquisition Architecture

**Pure Solana RPC/WebSocket - No external APIs:**

```
┌─────────────────────────────────────────────────────────────┐
│                    Data Sources                             │
├──────────────┬──────────────┬──────────────┬────────────────┤
│  Geyser gRPC │ logsSubscribe│ blockSubscribe│  PumpPortal   │
│  (Fastest)   │  (Universal) │  (Block-level)│  (External)   │
└──────────────┴──────────────┴──────────────┴────────────────┘
         │              │              │              │
         └──────────────┴──────────────┴──────────────┘
                            │
                    ┌───────▼───────┐
                    │  Token Parser │
                    └───────┬───────┘
                            │
                    ┌───────▼───────┐
                    │  Trader Bot   │
                    └───────────────┘
```

### 2.2 Direct RPC Usage Patterns

**WebSocket Subscriptions:**
```python
# logsSubscribe - Most compatible
{"method": "logsSubscribe", "params": [
    {"mentions": [PROGRAM_ID]},
    {"commitment": "processed"}
]}

# blockSubscribe - Requires node support
{"method": "blockSubscribe", "params": [
    {"mentionsAccountOrProgram": PROGRAM_ID}
]}
```

**Direct HTTP RPC Calls:**
```python
# GetRecentPrioritizationFees for dynamic fees
{"method": "getRecentPrioritizationFees", "params": [accounts]}

# getTransaction for post-trade verification
{"method": "getTransaction", "params": [signature, {"encoding": "jsonParsed"}]}

# getAccountInfo for curve state
{"method": "getAccountInfo", "params": [bonding_curve, {"encoding": "base64"}]}
```

### 2.3 Mempool Monitoring

**No traditional mempool monitoring** - Solana architecture differs from Ethereum:
- Uses `logsSubscribe` with `commitment: "processed"` for near-instant detection
- Geyser provides pre-confirmation transaction stream
- ShredStream (Jito) integration for MEV-level speed

### 2.4 Self-Hosted Infrastructure

**Required Infrastructure:**
- Solana RPC endpoint (HTTP)
- Solana WebSocket endpoint (WSS)
- Optional: Geyser gRPC endpoint (for premium speed)
- Optional: Trader node (for transaction propagation)

**Recommended Provider:** Chainstack (the bot's creator)
- Trader nodes for sub-second transaction propagation
- Yellowstone gRPC Geyser plugin support
- Jito ShredStream enabled by default

---

## 3. RISK MANAGEMENT

### 3.1 Rug Pull Detection

**Current Limitations:**
- Bot focuses on speed, not deep analysis
- No built-in rug pull detection
- Relies on quick entry/exit rather than token vetting

**Available Mitigations:**
- `max_token_age`: Skip tokens older than X seconds
- `match_string`: Only trade tokens matching name/symbol pattern
- `bro_address`: Only trade tokens from specific creator

### 3.2 Liquidity Checks

**Bonding Curve State Validation:**
```python
pool_state = await curve_manager.get_pool_state(pool_address)
token_price_sol = pool_state.get("price_per_token")
if token_price_sol is None or token_price_sol <= 0:
    raise ValueError(f"Invalid price_per_token: {token_price_sol}")
```

**Price Validation Before Buy:**
- Validates price exists and is positive
- Prevents buying into failed launches

### 3.3 Position Sizing

**Fixed Amount Strategy:**
```yaml
trade:
  buy_amount: 0.01  # SOL per trade
```

**Slippage Protection:**
```yaml
trade:
  buy_slippage: 0.01   # 1% max slippage
  sell_slippage: 0.25  # 25% max slippage (higher for exit)
```

### 3.4 Emergency Exits

**Multiple Exit Triggers:**
1. **Take Profit** - Lock in gains
2. **Stop Loss** - Limit downside
3. **Max Hold Time** - Time-based exit
4. **Manual Override** - Immediate exit capability

**Cleanup After Failures:**
```python
await handle_cleanup_after_failure(
    solana_client, wallet, token_mint, 
    token_program_id, priority_fee_manager,
    cleanup_mode, with_priority_fee, force_close_with_burn
)
```
- Closes Associated Token Accounts (ATA) after failed trades
- Prevents ATA rent accumulation
- Optional force close with burn

---

## 4. TECHNICAL IMPLEMENTATION

### 4.1 Language and Libraries

**Primary Language:** Python 3.11+

**Key Dependencies:**
```python
# Solana ecosystem
solders          # Transaction building, keypairs
solana-py        # Async RPC client
base58           # Address encoding/decoding

# WebSocket/Networking
websockets       # WebSocket client
grpcio           # Geyser gRPC connection
aiohttp          # HTTP RPC requests

# Async optimization
uvloop           # Fast event loop replacement
asyncio          # Core async framework

# Utilities
struct           # Binary data parsing
dataclasses      # Position management
```

### 4.2 Wallet Management

**Simple Keypair Model:**
```python
class Wallet:
    def __init__(self, private_key: str):
        self.keypair = Keypair.from_base58_string(private_key)
        self.pubkey = self.keypair.pubkey()
```

**Security Considerations:**
- Private key loaded from environment variable
- No encryption at rest (developer responsibility)
- Single-wallet design (no multi-wallet support)

### 4.3 Transaction Building

**Modular Instruction Builder Pattern:**
```python
# Platform-agnostic instruction building
instructions = await instruction_builder.build_buy_instruction(
    token_info,
    wallet.pubkey,
    max_amount_lamports,
    minimum_token_amount_raw,
    address_provider,
)
```

**Transaction Structure:**
1. `set_loaded_accounts_data_size_limit` (optional)
2. `set_compute_unit_limit` (85,000 default)
3. `set_compute_unit_price` (priority fee)
4. Platform-specific instructions (buy/sell)

### 4.4 Gas Optimization

**Priority Fee Strategy:**

**Dynamic Fees:**
```python
# 70th percentile of recent fees
prior_fee = int(statistics.quantiles(fees, n=10)[-3])
```

**Fixed Fees:**
```yaml
priority_fees:
  enable_fixed: true
  fixed_amount: 500000  # microlamports
```

**Compute Unit Configuration:**
```yaml
compute_units:
  buy: 85000
  sell: 85000
  account_data_size: 512000  # bytes
```

**Cost Breakdown:**
- Base transaction: 5,000 lamports
- Priority fee: Variable (configurable)
- Compute units: 85,000 CU default
- Account data limit: Saves ~16k CU overhead

---

## 5. ADAPTATION FOR POLYMARKET

### 5.1 Technique Applicability Matrix

| Pump.fun Technique | Polymarket Applicable | Notes |
|-------------------|----------------------|-------|
| **logsSubscribe** | ✅ YES | Monitor ConditionalTokens/CTFExchange |
| **Geyser gRPC** | ✅ YES | Premium speed for market detection |
| **Cached blockhash** | ✅ YES | Critical for speed |
| **PDA pre-computation** | ⚠️ PARTIAL | Different derivation patterns |
| **Extreme fast mode** | ⚠️ PARTIAL | Skip validation at your own risk |
| **TP/SL exit strategy** | ✅ YES | Price-based exits |
| **Time-based exit** | ✅ YES | Market expiration handling |
| **Compute unit optimization** | ✅ YES | Always applicable |
| **Dynamic priority fees** | ✅ YES | Essential during congestion |

### 5.2 Detecting "New Markets" Like New Tokens

**Polymarket Market Creation Flow:**

```
1. Question created on oracle
2. ConditionalTokens contract deploys outcome tokens
3. CTFExchange creates market for trading
4. Liquidity added via AMM
```

**Detection Strategies:**

**A. Event Log Monitoring (Recommended)**
```python
# Monitor ConditionalTokens for market creation
CONDITIONAL_TOKENS = "0x..."  # Contract address

# Listen for ConditionPreparation event
event_sig = "ConditionPreparation(bytes32,address,bytes32,uint256,uint256[])"
```

**B. Subgraph Polling (Backup)**
- Polymarket maintains a subgraph
- Query for markets created in last X blocks
- Higher latency but more data

**C. Block Monitoring**
- Scan transactions to CTFExchange
- Detect `createMarket` calls
- Parse market parameters

**Implementation Pattern:**
```python
class PolymarketListener:
    async def listen_for_markets(self, callback):
        # Primary: WebSocket event monitoring
        # Secondary: Subgraph polling for missed markets
        # Tertiary: Block scanning as fallback
```

### 5.3 Speed Optimizations We Can Use

**1. Blockhash Caching (CRITICAL)**
```python
# Already implemented - port directly
async def start_blockhash_updater(self, interval: float = 5.0):
    while True:
        blockhash = await self.get_latest_blockhash()
        async with self._blockhash_lock:
            self._cached_blockhash = blockhash
        await asyncio.sleep(interval)
```

**2. Multi-Source Listener Architecture**
```python
class PolymarketListenerFactory:
    LISTENERS = {
        "websocket": WebSocketEventListener,    # Fastest
        "subgraph": SubgraphPollListener,       # Reliable
        "block": BlockScanListener,             # Fallback
    }
```

**3. Pre-computed Contract Addresses**
- Cache factory contract addresses
- Pre-compute router paths
- Store token → market mappings

**4. Gas Optimization**
```python
# EVM equivalent of CU optimization
gas_limit = 150000  # Instead of default 3M
gas_price = await self.get_gas_price()  # EIP-1559 style
```

### 5.4 Self-Hosted Infrastructure Patterns

**Recommended Architecture for Polymarket:**

```
┌──────────────────────────────────────────────────────────────┐
│                    Data Layer                                │
├──────────────┬──────────────┬────────────────┬───────────────┤
│  WebSocket   │  Subgraph    │   RPC Node     │  IPFS/Arweave │
│  (Events)    │  (Query)     │  (Raw calls)   │  (Metadata)   │
└──────────────┴──────────────┴────────────────┴───────────────┘
         │              │              │              │
         └──────────────┴──────────────┴──────────────┘
                            │
                    ┌───────▼────────┐
                    │  Market Filter │
                    └───────┬────────┘
                            │
         ┌──────────────────┼──────────────────┐
         │                  │                  │
   ┌─────▼─────┐     ┌──────▼─────┐    ┌──────▼─────┐
   │  Trader   │     │  Position  │    │   Risk     │
   │  Engine   │     │  Manager   │    │  Manager   │
   └───────────┘     └────────────┘    └────────────┘
```

**Key Infrastructure Requirements:**

1. **RPC Node**
   - Polygon (primary) or Polygon zkEVM
   - WebSocket support for event streaming
   - High rate limits for competitive speed

2. **Subgraph Access**
   - Polymarket's official subgraph
   - Fallback: Self-hosted if needed

3. **IPFS/Arweave Gateway**
   - Market metadata resolution
   - Image/question text retrieval

4. **Blockhash/Nonce Management**
   - Similar to Solana's cached blockhash
   - Track pending nonces for rapid-fire transactions

---

## 6. KEY TAKEAWAYS & RECOMMENDATIONS

### 6.1 What Makes This Bot Effective

1. **Speed-First Design** - Every millisecond matters
2. **Redundant Listeners** - Multiple data sources for reliability
3. **Minimal RPC Calls** - Pre-compute everything possible
4. **Configurable Exit Strategies** - TP/SL/time-based options
5. **No External Dependencies** - Pure blockchain interaction

### 6.2 Limitations to Note

1. **No Rug Pull Detection** - Speed over safety
2. **Single Wallet** - No multi-account strategy
3. **No Position Sizing Logic** - Fixed amounts only
4. **Limited Analytics** - No historical performance tracking
5. **Solana-Specific** - Patterns don't directly translate to EVM

### 6.3 Recommendations for Polymarket Adaptation

**Priority Implementations:**

1. **✅ MUST HAVE:**
   - Blockhash/nonce caching
   - Multi-source listener (WebSocket + Subgraph)
   - Async transaction pipeline
   - Dynamic gas pricing

2. **⚡ HIGH VALUE:**
   - TP/SL position management
   - Compute/gas optimization
   - Cleanup after failed trades
   - Position tracking and PnL calculation

3. **🔧 NICE TO HAVE:**
   - Extreme fast mode (pre-computed values)
   - Multiple listener types (Geyser equivalent)
   - Advanced filtering (creator, market category)

### 6.4 Code Patterns Worth Reusing

**Position Management (`position.py`):**
```python
@dataclass
class Position:
    entry_price: float
    quantity: float
    take_profit_price: float | None
    stop_loss_price: float | None
    
    def should_exit(self, current_price: float) -> tuple[bool, ExitReason | None]:
        # Clean, testable exit logic
```

**Priority Fee Manager (`priority_fee/manager.py`):**
```python
class PriorityFeeManager:
    async def calculate_priority_fee(self, accounts: list[Pubkey]) -> int | None:
        # Plugin architecture for dynamic/fixed fees
        # Hard cap enforcement
        # Percentage boost application
```

**Listener Factory (`listener_factory.py`):**
```python
class ListenerFactory:
    @staticmethod
    def create_listener(listener_type: str, ...) -> BaseTokenListener:
        # Clean factory pattern for multiple data sources
        # Platform-agnostic design
```

---

## 7. TECHNICAL REFERENCE

### 7.1 Key Files Mapping

| File | Purpose | Reuse for Polymarket |
|------|---------|---------------------|
| `core/client.py` | Solana RPC wrapper | Create EVM equivalent |
| `core/priority_fee/manager.py` | Fee calculation | Port to EIP-1559 |
| `trading/position.py` | Position tracking | Direct reuse |
| `trading/platform_aware.py` | Buy/sell execution | Adapt for CTF |
| `monitoring/listener_factory.py` | Listener creation | Direct pattern reuse |
| `monitoring/universal_*_listener.py` | Data source impls | Create EVM versions |

### 7.2 Configuration Schema

```yaml
name: "pump_fun_bot"
platform: "pump_fun"  # or "lets_bonk"
enabled: true
separate_process: false

rpc_endpoint: "..."
wss_endpoint: "..."
private_key: "..."

trade:
  buy_amount: 0.01
  buy_slippage: 0.01
  sell_slippage: 0.25
  exit_strategy: "tp_sl"  # or "time_based" or "manual"
  take_profit_percentage: 0.5
  stop_loss_percentage: 0.2
  max_hold_time: 300
  price_check_interval: 10
  extreme_fast_mode: false
  extreme_fast_token_amount: 30

filters:
  listener_type: "logs"  # "logs", "blocks", "geyser", "pumpportal"
  match_string: null
  bro_address: null
  marry_mode: false
  yolo_mode: false
  max_token_age: 0.001

priority_fees:
  enable_dynamic: false
  enable_fixed: true
  fixed_amount: 500000
  extra_percentage: 0.0
  hard_cap: 500000

retries:
  max_attempts: 10
  wait_after_creation: 15
  wait_after_buy: 15
  wait_before_new_token: 15

timing:
  token_wait_timeout: 120

cleanup:
  mode: "disabled"  # "disabled", "after_failure", "after_sell", "always"
  force_close_with_burn: false
  with_priority_fee: false
```

---

## Conclusion

The pump.fun bot demonstrates a **speed-optimized, self-hosted trading architecture** that prioritizes:
1. Minimal latency through caching and pre-computation
2. Reliability through redundant data sources
3. Flexibility through configurable exit strategies

For Polymarket adaptation, the core patterns (**cached nonces, multi-source listeners, position management, gas optimization**) are directly applicable, while the Solana-specific implementations (PDA derivation, bonding curves) require EVM equivalents.

The bot's popularity (887+ stars) validates its approach to low-latency trading infrastructure.
