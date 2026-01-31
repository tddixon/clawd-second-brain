# RPC Monitoring Analysis: Chainstack Compare Dashboard

**Source:** https://github.com/chainstacklabs/compare-dashboard-functions  
**Analysis Date:** 2026-01-31  
**Purpose:** Trading infrastructure optimization for arbitrage execution

---

## Executive Summary

The Chainstack Compare Dashboard is an open-source, serverless RPC monitoring system that measures blockchain node performance across multiple providers, regions, and chains. It provides real-time latency metrics, success rates, and specialized transaction landing metrics critical for high-frequency trading operations.

**Key Value for Trading:**
- Sub-second RPC latency monitoring from 4 global regions
- Real-time provider performance ranking
- Solana transaction landing rate metrics (critical for MEV)
- WebSocket vs HTTP latency comparison
- 14-day historical performance data
- Completely free and self-hostable

---

## 1. Latency Measurement Methodology

### 1.1 Core Metrics Collected

| Metric | Description | Collection Frequency | Critical for Trading |
|--------|-------------|---------------------|---------------------|
| **HTTP Response Latency** | Time to execute RPC methods (eth_blockNumber, eth_call, eth_getLogs) | Every 3 minutes | Yes - Direct execution speed |
| **WebSocket Block Latency** | Time from block creation to WebSocket notification | Every 3 minutes | Yes - MEV timing |
| **Transaction Landing Time** | Solana: slot latency + confirmation rate | Every 15 minutes | Critical - Execution confirmation |
| **Success Rate** | Percentage of successful requests | Every 3 minutes | Yes - Reliability |
| **Blocks Per Second (BPS)** | Data throughput during bulk fetch | On-demand | Medium - Backfill speed |

### 1.2 Measurement Implementation

```
┌─────────────────────────────────────────────────────────────────┐
│                    Vercel Serverless Functions                   │
├─────────────────────────────────────────────────────────────────┤
│  Region: Frankfurt (fra1)                                        │
│    ├─ State Updater (every 15 min)                              │
│    │   └─ Fetches latest block + tx hashes                      │
│    │   └─ Stores in Vercel Blob Storage                         │
│    │                                                            │
│    ├─ Metric Collectors (every 3 min)                           │
│    │   └─ HTTP latency: eth_blockNumber, eth_call               │
│    │   └─ WebSocket latency: block subscription                   │
│    │   └─ Pushes to Grafana Cloud (Influx format)               │
│    │                                                            │
│    └─ Solana TX Landing (every 15 min)                          │
│        └─ Sends memo transactions (200k microlamports/CU)       │
│        └─ Measures slot latency + landing rate                  │
│                                                                 │
│  Region: San Francisco (sfo1) - Same collectors                 │
│  Region: Singapore (sin1) - Same collectors                     │
│  Region: Tokyo (hnd1) - Same collectors                         │
└─────────────────────────────────────────────────────────────────┘
```

### 1.3 Technical Measurement Details

**HTTP RPC Latency Measurement:**
- **Timeout threshold:** 55 seconds (requests exceeding this marked as failed)
- **Methods tested:**
  - `eth_blockNumber` - Lightweight, always fresh
  - `eth_call` - Contract simulation (uses dummy contracts)
  - `eth_getLogs` - Historical data fetch
  - `debug_traceBlockByNumber` - Advanced tracing (select providers)
- **State management:** Uses stored block numbers offset by 7,200-10,000 blocks to ensure data availability
- **Retry logic:** Built-in retry for RPC errors, invalid data, timeouts

**WebSocket Latency Measurement (EVM only):**
- **Method:** Subscription-based `eth_subscribe` for new blocks
- **Measurement:** Time from block timestamp to WebSocket notification receipt
- **Block delay threshold:** 55 seconds (exceeding = failure)
- **Supported chains:** Ethereum, Base

**Solana Transaction Landing (Critical for MEV):**
- **Transaction type:** Solana Memo Program (lightweight, consistent)
- **Priority fee:** 200,000 microlamports/CU (fixed for consistency)
- **Timeout:** 55 seconds
- **Metrics collected:**
  - **Slot Latency:** Time in slots from send to confirmation
  - **Landing Rate:** % of transactions confirming within parameters
- **Endpoint variants:** Tests both default and enhanced endpoints (Chainstack Warp, Helius Staked)

### 1.4 Regional Performance Differences

**Deployment Regions:**
| Region | Vercel ID | Geographic Focus | Best For |
|--------|-----------|------------------|----------|
| Germany | fra1 | Europe | European markets, CEX arbitrage |
| US West | sfo1 | US West Coast | US markets, Coinbase/Binance US |
| Singapore | sin1 | Asia-Pacific | Asian markets, Binance/OKX |
| Tokyo | hnd1 | Japan | Japanese markets, local CEX |

**How They Use Regional Data:**
- Each region runs identical measurement functions
- Metrics are tagged with region identifier
- Grafana dashboards allow filtering by region
- Provider ranking considers all regions equally

**For Trading Infrastructure:**
- Deploy collectors in the region closest to your execution servers
- Compare latency from YOUR region (not just global averages)
- Use regional data to select provider + region combinations
- Example: If your bot runs in AWS us-east-1, prioritize US West metrics

---

## 2. RPC Provider Analysis

### 2.1 Currently Monitored Providers

| Provider | Ethereum | Base | Solana | TON | Arbitrum | BNB |
|----------|----------|------|--------|-----|----------|-----|
| **Alchemy** | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| **Chainstack** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Helius** | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ |
| **QuickNode** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **TonCenter** | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |

### 2.2 Performance Ranking Methodology

**Scoring Formula:**
```
Score = 1 ÷ ((1/ResponseTime) × (SuccessRate³))
```

**Key Insights:**
- **Lower score = better provider**
- Success rate is CUBED - even small drops (99% vs 97%) significantly impact ranking
- Response time is inversely weighted (faster = better)
- All regions weighted equally in global ranking
- Transaction landing metrics NOT included in ranking (Solana-specific)

**Example Scoring:**
| Provider | Avg Response | Success Rate | Score |
|----------|--------------|--------------|-------|
| Provider A | 150ms | 99.9% | 0.225 |
| Provider B | 100ms | 97.0% | 1.059 |
| Provider C | 200ms | 99.9% | 0.401 |

Provider A wins despite slower response time due to higher reliability.

### 2.3 Reliability Metrics

**Failure Conditions:**
- Response time > 55 seconds
- Non-200 HTTP status codes
- JSON-RPC error responses (per spec)
- WebSocket block delays > 55 seconds
- Transaction landing timeout > 55 seconds

**What Gets Tracked:**
- Success rate % (per provider, per method, per region)
- Error rate breakdown (timeout, HTTP error, RPC error)
- Historical trend (14-day retention)

### 2.4 Free vs Paid Tier Differences

**Observable Differences in Dashboard:**

| Aspect | Free Tier | Paid Tier | How to Spot |
|--------|-----------|-----------|-------------|
| **Rate Limits** | Aggressive throttling | Higher/None | BPS drops under load; error spikes |
| **Response Time** | Higher during peak | Consistent | Latency variance patterns |
| **Success Rate** | May drop under load | Stable | Success rate < 99% |
| **Enhanced Endpoints** | Not available | Available | Solana: better landing rates |

**Solana Enhanced Endpoints:**
| Provider | Default | Enhanced | Technology |
|----------|---------|----------|------------|
| Chainstack | ✅ | ✅ | bloXroute Warp |
| Helius | ✅ | ✅ | Staked connection |
| Alchemy | ✅ | ❌ | N/A |
| QuickNode | ✅ | ❌ | N/A |

**Enhanced endpoints show measurably better:**
- Lower slot latency (faster confirmation)
- Higher landing rates (better MEV success)

---

## 3. Infrastructure Optimization for Trading

### 3.1 How to Choose Best RPC for Trading

**Step-by-Step Selection Process:**

1. **Filter by Your Region**
   - Use dashboard region selector for your deployment region
   - Latency from Singapore ≠ Latency from US

2. **Check Current Rankings**
   - Lower score = better
   - Prioritize top 2 providers in your region

3. **Analyze Response Time Distribution**
   - Look for providers with tight latency distribution (low variance)
   - Avoid providers with high p99 latency spikes

4. **Verify Success Rate > 99.5%**
   - Anything lower introduces execution risk
   - Check 24h trend, not just current reading

5. **For Solana: Check Transaction Landing**
   - Enhanced endpoints significantly outperform
   - Landing rate > 95% required for MEV
   - Slot latency < 5 slots ideal

6. **Test Under Load**
   - Dashboard shows baseline performance
   - Your actual load may trigger rate limits
   - Use Chainbench (Chainstack's load testing tool) for validation

### 3.2 Failover Strategies

**Recommended Failover Architecture:**

```
┌─────────────────────────────────────────────────────────────┐
│                     Trading Bot                             │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Primary    │───▶│  Secondary   │───▶│   Tertiary   │
│   Provider   │fail│   Provider   │fail│   Provider   │
│  (Best RTT)  │over│(Next Best)   │over│(Most Reliable)│
└──────────────┘    └──────────────┘    └──────────────┘
        │                   │                   │
        └───────────────────┴───────────────────┘
                            │
                    ┌───────▼────────┐
                    │  Fallback:     │
                    │  Public RPC    │
                    │  (Read-only)   │
                    └────────────────┘
```

**Failover Triggers:**
- Response time > 2x baseline (p95)
- Success rate < 98%
- 3 consecutive request failures
- WebSocket connection drop (if using WS)

**Implementation Pattern:**
```python
class RPCFailoverManager:
    def __init__(self, providers):
        self.providers = providers  # Ordered by priority
        self.current_index = 0
        self.failure_counts = {p: 0 for p in providers}
    
    async def call(self, method, params):
        for attempt in range(len(self.providers)):
            provider = self.providers[(self.current_index + attempt) % len(self.providers)]
            try:
                result = await provider.call(method, params)
                self.failure_counts[provider] = 0
                self.current_index = (self.current_index + attempt) % len(self.providers)
                return result
            except Exception as e:
                self.failure_counts[provider] += 1
                if self.failure_counts[provider] >= 3:
                    log_alert(f"Provider {provider.name} failing, failing over")
        raise Exception("All providers failed")
```

### 3.3 Load Balancing Between Providers

**Strategy 1: Round-Robin with Health Check**
```python
class LoadBalancer:
    def __init__(self, providers):
        self.providers = providers
        self.healthy = set(providers)
        self.index = 0
    
    def get_provider(self):
        healthy = list(self.healthy)
        if not healthy:
            raise Exception("No healthy providers")
        provider = healthy[self.index % len(healthy)]
        self.index += 1
        return provider
    
    def mark_unhealthy(self, provider):
        self.healthy.discard(provider)
```

**Strategy 2: Latency-Based Weighting**
```python
class LatencyWeightedBalancer:
    def __init__(self, providers):
        self.providers = providers
        self.latencies = {p: 100 for p in providers}  # Default 100ms
    
    def update_latency(self, provider, latency):
        # Exponential moving average
        self.latencies[provider] = 0.7 * self.latencies[provider] + 0.3 * latency
    
    def get_provider(self):
        # Inverse weight: lower latency = higher probability
        total = sum(1/l for l in self.latencies.values())
        weights = [(1/l)/total for l in self.latencies.values()]
        return random.choices(self.providers, weights=weights)[0]
```

**Strategy 3: Request-Type Routing**
- **Fast queries** (eth_blockNumber): Any provider
- **State queries** (eth_call): Lowest latency provider
- **Historical queries** (eth_getLogs): Provider with best BPS
- **Send transaction**: Provider with best landing rate (Solana)

### 3.4 Regional Optimization

**Which Regions Are Fastest?**

The dashboard shows real-time data, but general patterns:

| Your Location | Best Regions | Notes |
|---------------|--------------|-------|
| US East | US West (sfo1), Germany (fra1) | Cross-country latency |
| US West | US West (sfo1) | Local advantage |
| Europe | Germany (fra1) | Local advantage |
| Asia | Singapore (sin1), Tokyo (hnd1) | Local advantage |
| Global Bot | All 4 regions | Run region-specific instances |

**Regional Deployment Strategy:**

```
┌──────────────────────────────────────────────────────────────┐
│                   Global Trading Network                     │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────┐      ┌─────────────┐      ┌─────────────┐  │
│  │   US Bot    │◄────►│  EU Bot     │◄────►│  Asia Bot   │  │
│  │  (sfo1)     │      │  (fra1)     │      │  (sin1)     │  │
│  └──────┬──────┘      └──────┬──────┘      └──────┬──────┘  │
│         │                    │                    │          │
│         ▼                    ▼                    ▼          │
│  ┌─────────────┐      ┌─────────────┐      ┌─────────────┐  │
│  │Best US RPC  │      │Best EU RPC  │      │Best Asia RPC│  │
│  │(per dashboard)      │(per dashboard)      │(per dashboard)  │
│  └─────────────┘      └─────────────┘      └─────────────┘  │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Optimization Tips:**
1. **Deploy collectors in same region as your bots** - Use the same cloud provider/region
2. **Test provider endpoints from your actual infrastructure** - Dashboard is baseline; your network path matters
3. **Consider provider infrastructure location** - Some providers have better presence in certain regions
4. **Use WebSocket for real-time data** - Lower latency than polling for block updates
5. **For arbitrage: colocate with CEX** - Your RPC region matters less than CEX API latency

---

## 4. Integration for Trading Systems

### 4.1 Automated RPC Selection

**Dynamic Provider Selection System:**

```python
class RPCSelector:
    """Automatically selects best RPC provider based on real-time metrics"""
    
    def __init__(self, grafana_client):
        self.grafana = grafana_client
        self.provider_scores = {}
        self.last_update = 0
    
    async def update_scores(self):
        """Fetch latest metrics from Grafana/Prometheus"""
        # Query for recent metrics
        metrics = await self.grafana.query('''
            response_latency_seconds{job="rpc-monitor"}
        ''')
        
        for metric in metrics:
            provider = metric['metric']['provider']
            region = metric['metric']['region']
            latency = float(metric['value'][1])
            
            # Calculate composite score
            self.provider_scores[(provider, region)] = {
                'latency': latency,
                'score': self._calculate_score(metric)
            }
        
        self.last_update = time.time()
    
    def get_best_provider(self, region, min_success_rate=0.99):
        """Get best provider for specified region"""
        if time.time() - self.last_update > 60:
            asyncio.create_task(self.update_scores())
        
        candidates = [
            (p, s) for (p, r), s in self.provider_scores.items()
            if r == region and s['success_rate'] >= min_success_rate
        ]
        
        if not candidates:
            return self._get_fallback_provider(region)
        
        return min(candidates, key=lambda x: x[1]['score'])[0]
```

**Integration with Chainstack Dashboard:**

The dashboard exposes public Grafana dashboards, but for programmatic access:

1. **Self-host the monitoring system** - Fork the repo, deploy to your Vercel
2. **Access Prometheus directly** - Query your own metrics
3. **Build custom alerting** - Use Grafana alerting webhooks

### 4.2 Real-Time Latency Monitoring

**Implementation for Trading Bot:**

```python
class RPCLatencyMonitor:
    def __init__(self, providers):
        self.providers = providers
        self.metrics = defaultdict(lambda: {
            'latencies': deque(maxlen=100),
            'errors': 0,
            'total': 0
        })
    
    async def monitor_loop(self):
        """Continuously monitor all providers"""
        while True:
            for provider in self.providers:
                start = time.time()
                try:
                    await provider.eth.block_number
                    latency = (time.time() - start) * 1000  # ms
                    self.metrics[provider]['latencies'].append(latency)
                    self.metrics[provider]['total'] += 1
                except Exception:
                    self.metrics[provider]['errors'] += 1
                    self.metrics[provider]['total'] += 1
            
            await asyncio.sleep(10)  # Check every 10s
    
    def get_stats(self, provider):
        """Get current latency statistics"""
        m = self.metrics[provider]
        latencies = list(m['latencies'])
        return {
            'p50': np.percentile(latencies, 50) if latencies else None,
            'p95': np.percentile(latencies, 95) if latencies else None,
            'p99': np.percentile(latencies, 99) if latencies else None,
            'success_rate': (m['total'] - m['errors']) / m['total'] if m['total'] else 0
        }
```

**Prometheus Metrics Export:**
```python
from prometheus_client import Histogram, Counter, Gauge

# Define metrics
rpc_latency = Histogram(
    'trading_rpc_latency_seconds',
    'RPC call latency',
    ['provider', 'method', 'region']
)

rpc_errors = Counter(
    'trading_rpc_errors_total',
    'RPC error count',
    ['provider', 'error_type']
)

provider_score = Gauge(
    'trading_provider_score',
    'Current provider quality score',
    ['provider', 'region']
)
```

### 4.3 Alerting for RPC Degradation

**Alert Conditions:**

| Alert | Condition | Severity | Action |
|-------|-----------|----------|--------|
| **Latency Spike** | p99 latency > 2x baseline | Warning | Log + notify |
| **High Error Rate** | Error rate > 2% | Critical | Failover + alert |
| **Provider Down** | Success rate = 0% for 2 min | Critical | Emergency failover |
| **Solana Landing** | Landing rate < 90% | Critical | Switch to enhanced endpoint |
| **WebSocket Lag** | Block delay > 30s | Warning | Reconnect WS |

**Grafana Alerting Example:**
```yaml
# alert_rules.yml
groups:
  - name: rpc_alerts
    rules:
      - alert: RPCHighLatency
        expr: histogram_quantile(0.99, rpc_latency_seconds) > 0.5
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "High RPC latency for {{ $labels.provider }}"
          
      - alert: RPCErrorRate
        expr: rate(rpc_errors_total[5m]) / rate(rpc_total[5m]) > 0.02
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "High error rate for {{ $labels.provider }}"
```

**PagerDuty/Slack Integration:**
```python
async def send_alert(provider, condition, severity):
    message = f"""
    🚨 RPC Alert: {provider}
    
    Condition: {condition}
    Severity: {severity}
    Time: {datetime.utcnow().isoformat()}
    Region: {os.getenv('REGION', 'unknown')}
    
    Auto-failover: {'ENABLED' if severity == 'critical' else 'MANUAL'}
    """
    
    await slack_client.chat_postMessage(
        channel="#trading-alerts",
        text=message
    )
    
    if severity == 'critical':
        await pager_client.send_event(
            routing_key=os.getenv('PAGERDUTY_KEY'),
            event_action='trigger',
            payload={
                'summary': f'RPC Degradation: {provider}',
                'severity': 'critical'
            }
        )
```

### 4.4 Cost Optimization (Free Tiers)

**Free Tier Monitoring Strategy:**

| Provider | Free Tier Limits | Monitoring Strategy |
|----------|------------------|---------------------|
| **Alchemy** | 300M compute units/month | Good for moderate volume |
| **Chainstack** | 3M requests/month + 50 credits | Excellent for testing |
| **Helius** | 500 requests/day | Too limited for production |
| **QuickNode** | Trial only | Not suitable for ongoing |

**Cost-Optimized Setup:**

```python
class CostOptimizedRPC:
    """Uses free tiers efficiently for monitoring + fallback"""
    
    def __init__(self):
        # Primary: Best free tier provider
        self.primary = ChainstackRPC(
            endpoint=os.getenv('CHAINSTACK_FREE_URL')
        )
        
        # Backup: Different provider's free tier
        self.backup = AlchemyRPC(
            endpoint=os.getenv('ALCHEMY_FREE_URL')
        )
        
        # Emergency: Public RPC (read-only)
        self.emergency = PublicRPC()
    
    async def call(self, method, params, priority='normal'):
        """
        Priority levels:
        - 'critical': Always use primary (transaction sending)
        - 'normal': Use primary, failover on error
        - 'background': Use cheapest provider (historical sync)
        """
        if priority == 'critical':
            return await self.primary.call(method, params)
        
        try:
            return await self.primary.call(method, params)
        except Exception as e:
            logger.warning(f"Primary failed: {e}, using backup")
            return await self.backup.call(method, params)
```

**Rate Limit Management:**
```python
class RateLimitManager:
    def __init__(self, requests_per_second):
        self.rate_limiter = asyncio.Semaphore(requests_per_second)
        self.daily_counts = defaultdict(int)
    
    async def call(self, provider, method):
        # Check daily limits
        if self.daily_counts[provider] >= FREE_TIER_LIMITS[provider]:
            raise RateLimitExceeded(f"Daily limit for {provider}")
        
        async with self.rate_limiter:
            result = await provider.call(method)
            self.daily_counts[provider] += 1
            return result
```

**Hybrid Paid/Free Strategy:**
1. **Paid tier for execution** - One reliable paid provider for transactions
2. **Free tier for monitoring** - Multiple free providers for comparison/backup
3. **Public RPC for reads** - Fallback for non-critical reads
4. **Self-hosted node for critical** - Consider running own node for MEV

---

## 5. Implementation Guide

### 5.1 Quick Start: Fork and Deploy

```bash
# 1. Fork the repository
git clone https://github.com/YOUR_USERNAME/compare-dashboard-functions.git
cd compare-dashboard-functions

# 2. Install dependencies
pip install -r requirements.txt

# 3. Configure endpoints
cp endpoints.json.example endpoints.json
# Edit endpoints.json with your RPC URLs

# 4. Configure environment
cp .env.local.example .env.local
# Add your Grafana credentials

# 5. Deploy to Vercel
vercel link --project your-rpc-monitor
vercel --prod
```

### 5.2 Custom Metrics for Trading

Add custom metrics to track trading-specific performance:

```python
# metrics/trading.py
from common.base_metric import MetricBase

class ArbitrageLatencyMetric(MetricBase):
    """Measure end-to-end arbitrage execution latency"""
    
    @property
    def method(self):
        return "eth_sendRawTransaction"
    
    async def measure(self, provider, state_data):
        # Time full arbitrage cycle
        start = time.time()
        
        # 1. Get opportunity
        opportunity = await self.detect_opportunity()
        
        # 2. Send transaction
        tx_hash = await provider.send_transaction(opportunity.tx)
        
        # 3. Wait for confirmation
        receipt = await provider.wait_for_confirmation(tx_hash)
        
        latency = time.time() - start
        return {
            'latency': latency,
            'success': receipt.status == 1,
            'gas_used': receipt.gasUsed
        }
```

### 5.3 Integration Checklist

- [ ] **Deploy monitoring** in your region(s)
- [ ] **Add your RPC endpoints** to configuration
- [ ] **Set up Grafana dashboard** with trading-specific panels
- [ ] **Configure alerting** (Slack/PagerDuty)
- [ ] **Implement failover logic** in trading bot
- [ ] **Add latency tracking** to all RPC calls
- [ ] **Test failover scenarios** manually
- [ ] **Monitor costs** across providers
- [ ] **Review provider rankings** weekly
- [ ] **Optimize based on data** monthly

---

## 6. Key Takeaways for Trading

### Critical Insights

1. **Latency varies significantly by region** - Always monitor from your deployment region
2. **Success rate > speed** - 99.9% success at 200ms beats 95% at 100ms
3. **Solana enhanced endpoints matter** - Landing rate is critical for MEV
4. **WebSocket faster than HTTP** - For block updates, use WebSocket subscriptions
5. **Free tiers work for monitoring** - But paid tiers needed for production execution

### Performance Targets

| Metric | Acceptable | Good | Excellent |
|--------|------------|------|-----------|
| HTTP Latency (p50) | < 300ms | < 150ms | < 100ms |
| HTTP Latency (p99) | < 1000ms | < 500ms | < 300ms |
| Success Rate | > 98% | > 99% | > 99.9% |
| Solana Landing Rate | > 80% | > 90% | > 95% |
| WebSocket Latency | < 2s | < 1s | < 500ms |

### Recommended Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Production Trading Setup                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Monitoring Layer (Chainstack Dashboard)                        │
│  ├─ Self-hosted in your region                                  │
│  ├─ Tracks 3+ providers                                         │
│  └─ Alerts on degradation                                       │
│                                                                  │
│  Execution Layer (Your Trading Bot)                             │
│  ├─ Primary: Best provider (paid tier)                          │
│  ├─ Failover: Second-best provider                              │
│  ├─ Emergency: Public RPC / self-hosted                         │
│  └─ Latency tracking on every call                              │
│                                                                  │
│  Data Flow:                                                     │
│  Dashboard ──► Bot selects provider ◄──► Executions             │
│              based on real-time          tracked                │
│              metrics                     and logged             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. References

- **GitHub Repository:** https://github.com/chainstacklabs/compare-dashboard-functions
- **Live Dashboard:** https://chainstack.grafana.net/public-dashboards/65c0fcb02f994faf845d4ec095771bd0
- **Documentation:** https://docs.chainstack.com/docs/chainstack-compare-dashboard
- **Performance Tool:** https://compare.chainstack.com/
- **Chainbench (Load Testing):** https://github.com/chainstack/chainbench

---

*Analysis compiled for trading infrastructure optimization. Directly impacts arbitrage execution speed and reliability.*
