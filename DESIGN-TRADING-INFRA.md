# Trading Infrastructure Design
## 24/7 Automated Trading System Architecture

**Version:** 1.0  
**Last Updated:** 2025-01-21  
**Status:** Design Document

---

## Executive Summary

This document outlines a production-grade, high-availability trading infrastructure designed for 24/7 automated cryptocurrency trading operations. The architecture emphasizes fault tolerance, real-time risk management, comprehensive monitoring, and automated recovery procedures.

### Key Design Principles

1. **Zero Single Points of Failure** - Every component has redundancy
2. **Defense in Depth** - Multiple layers of risk controls
3. **Observability First** - Everything is measured, logged, and alerted
4. **Automated Recovery** - Self-healing systems minimize human intervention
5. **Immutable Infrastructure** - Infrastructure as Code (IaC) for reproducibility

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              GLOBAL LOAD BALANCER                               │
│                     (Cloudflare / AWS Route 53 Health Checks)                   │
└─────────────────────────────────────────────────────────────────────────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        │                           │                           │
        ▼                           ▼                           ▼
┌───────────────┐         ┌───────────────┐         ┌───────────────┐
│   TOKYO DC    │         │   LONDON DC   │         │    US-EAST    │
│  (Primary)    │◄───────►│  (Secondary)  │◄───────►│  (Disaster)   │
└───────┬───────┘         └───────┬───────┘         └───────┬───────┘
        │                         │                         │
        └─────────────────────────┼─────────────────────────┘
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           KUBERNETES CLUSTER                                     │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ │
│  │ Trading     │ │ Risk        │ │ Monitoring  │ │ Alerting    │ │ Recovery    │ │
│  │ Engine      │ │ Manager     │ │ Stack       │ │ Service     │ │ Controller  │ │
│  │ (Pods x3)   │ │ (Pod x1)    │ │ (Pods x3)   │ │ (Pod x1)    │ │ (Pod x1)    │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────┘
                                  │
        ┌─────────────────────────┼─────────────────────────┐
        ▼                         ▼                         ▼
┌───────────────┐         ┌───────────────┐         ┌───────────────┐
│   Primary     │         │   Redis       │         │   TimescaleDB │
│   PostgreSQL  │         │   Cluster     │         │   (Metrics)   │
│   (R/W)       │         │   (Cache)     │         │   (TSDB)      │
└───────────────┘         └───────────────┘         └───────────────┘
        │                           ▲                         │
        │                           │                         │
        └───────────────────────────┴─────────────────────────┘
                                    │
                          ┌─────────┴─────────┐
                          ▼                   ▼
                   ┌─────────────┐     ┌─────────────┐
                   │   Primary   │     │  Secondary  │
                   │   RPC Node  │     │   RPC Node  │
                   │  (QuickNode)│     │  (Alchemy)  │
                   └─────────────┘     └─────────────┘
```

---

## 1. System Components

### 1.1 Uptime & Health Monitoring

#### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    HEALTH MONITORING LAYER                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────┐ │
│  │  Service Health │    │  Infrastructure │    │  External   │ │
│  │    Probes       │    │    Metrics      │    │   APIs      │ │
│  └────────┬────────┘    └────────┬────────┘    └──────┬──────┘ │
│           │                      │                    │        │
│           └──────────────────────┼────────────────────┘        │
│                                  ▼                              │
│                    ┌─────────────────────────┐                  │
│                    │    Blackbox Exporter    │                  │
│                    │  (Endpoint Monitoring)  │                  │
│                    └───────────┬─────────────┘                  │
│                                │                                │
│                                ▼                                │
│                    ┌─────────────────────────┐                  │
│                    │      Prometheus         │                  │
│                    │    (Metrics Storage)    │                  │
│                    └───────────┬─────────────┘                  │
│                                │                                │
└────────────────────────────────┼────────────────────────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │    AlertManager         │
                    │   (Alert Routing)       │
                    └─────────────────────────┘
```

#### Implementation

**Tools:**
- **Prometheus** - Metrics collection and storage
- **Grafana** - Visualization and dashboards
- **Blackbox Exporter** - Endpoint probing
- **Node Exporter** - System metrics
- **cAdvisor** - Container metrics

**Health Check Configuration:**

```yaml
# prometheus/health-checks.yml
groups:
  - name: trading_health
    interval: 15s
    rules:
      # Service heartbeat - alert if silent >5 minutes
      - alert: TradingEngineDown
        expr: up{job="trading-engine"} == 0
        for: 5m
        labels:
          severity: critical
          team: trading
        annotations:
          summary: "Trading engine is down"
          description: "Trading engine has been down for more than 5 minutes"
          runbook_url: "https://wiki.internal/runbooks/trading-engine-down"

      # Wallet balance monitoring
      - alert: LowWalletBalance
        expr: wallet_balance_usd < 1000
        for: 1m
        labels:
          severity: warning
          team: trading
        annotations:
          summary: "Low wallet balance detected"
          description: "Wallet {{ $labels.wallet }} balance is ${{ $labels.value }}"

      # API connection health
      - alert: APIConnectionDegraded
        expr: rate(api_errors_total[5m]) > 0.1
        for: 2m
        labels:
          severity: warning
          team: infrastructure
        annotations:
          summary: "API connection experiencing errors"
          description: "Error rate is {{ $value }} errors/sec"

      # RPC endpoint failover
      - alert: PrimaryRPCDown
        expr: up{job="rpc-primary"} == 0
        for: 30s
        labels:
          severity: critical
          action: failover
        annotations:
          summary: "Primary RPC endpoint down"
```

**Automated Restart Configuration:**

```yaml
# kubernetes/health-checks.yml
apiVersion: v1
kind: Pod
metadata:
  name: trading-engine
  labels:
    app: trading-engine
spec:
  containers:
    - name: trading-engine
      image: trading-engine:v1.2.3
      livenessProbe:
        httpGet:
          path: /health/live
          port: 8080
        initialDelaySeconds: 30
        periodSeconds: 10
        failureThreshold: 3
      readinessProbe:
        httpGet:
          path: /health/ready
          port: 8080
        initialDelaySeconds: 5
        periodSeconds: 5
      startupProbe:
        httpGet:
          path: /health/startup
          port: 8080
        initialDelaySeconds: 10
        periodSeconds: 5
        failureThreshold: 30
      resources:
        requests:
          memory: "512Mi"
          cpu: "500m"
        limits:
          memory: "2Gi"
          cpu: "2000m"
      env:
        - name: PRIMARY_RPC
          valueFrom:
            secretKeyRef:
              name: rpc-endpoints
              key: primary
        - name: SECONDARY_RPC
          valueFrom:
            secretKeyRef:
              name: rpc-endpoints
              key: secondary
```

**RPC Failover Logic:**

```python
# src/infrastructure/rpc_manager.py
import asyncio
from dataclasses import dataclass
from typing import List, Optional
import aiohttp
from prometheus_client import Counter, Histogram

# Metrics
rpc_requests_total = Counter('rpc_requests_total', 'Total RPC requests', ['endpoint', 'status'])
rpc_latency_seconds = Histogram('rpc_latency_seconds', 'RPC latency', ['endpoint'])

@dataclass
class RPCEndpoint:
    url: str
    priority: int  # Lower = higher priority
    is_healthy: bool = True
    fail_count: int = 0
    last_failure: Optional[float] = None

class RPCManager:
    def __init__(self, endpoints: List[RPCEndpoint]):
        self.endpoints = sorted(endpoints, key=lambda e: e.priority)
        self.current_index = 0
        self.circuit_breaker_threshold = 5
        self.circuit_breaker_timeout = 60  # seconds
        
    async def get_healthy_endpoint(self) -> RPCEndpoint:
        """Get the highest priority healthy endpoint"""
        now = asyncio.get_event_loop().time()
        
        for endpoint in self.endpoints:
            if not endpoint.is_healthy:
                # Check if circuit breaker timeout has passed
                if endpoint.last_failure and (now - endpoint.last_failure) > self.circuit_breaker_timeout:
                    endpoint.is_healthy = True
                    endpoint.fail_count = 0
                else:
                    continue
            return endpoint
            
        # All endpoints down - try to use least recently failed
        raise Exception("All RPC endpoints are down")
    
    async def call(self, method: str, params: dict) -> dict:
        """Make RPC call with automatic failover"""
        endpoint = await self.get_healthy_endpoint()
        
        with rpc_latency_seconds.labels(endpoint=endpoint.url).time():
            try:
                async with aiohttp.ClientSession() as session:
                    async with session.post(
                        endpoint.url,
                        json={"jsonrpc": "2.0", "method": method, "params": params, "id": 1},
                        timeout=aiohttp.ClientTimeout(total=30)
                    ) as response:
                        result = await response.json()
                        rpc_requests_total.labels(endpoint=endpoint.url, status="success").inc()
                        return result
            except Exception as e:
                rpc_requests_total.labels(endpoint=endpoint.url, status="error").inc()
                await self._mark_endpoint_failed(endpoint)
                # Retry with next endpoint
                return await self.call(method, params)
    
    async def _mark_endpoint_failed(self, endpoint: RPCEndpoint):
        endpoint.fail_count += 1
        endpoint.last_failure = asyncio.get_event_loop().time()
        
        if endpoint.fail_count >= self.circuit_breaker_threshold:
            endpoint.is_healthy = False
            # Alert on primary endpoint failure
            if endpoint.priority == 1:
                await self._alert_primary_rpc_down(endpoint)
    
    async def _alert_primary_rpc_down(self, endpoint: RPCEndpoint):
        # Send alert to PagerDuty/Opsgenie
        pass
```

#### Dashboards

**Grafana Dashboard - System Health:**

```json
{
  "dashboard": {
    "title": "Trading System Health",
    "panels": [
      {
        "title": "Service Status",
        "type": "stat",
        "targets": [
          {
            "expr": "up{job=~\"trading-engine|risk-manager|alerting-service\"}",
            "legendFormat": "{{ job }}"
          }
        ],
        "thresholds": {
          "steps": [
            {"color": "red", "value": 0},
            {"color": "green", "value": 1}
          ]
        }
      },
      {
        "title": "RPC Endpoint Health",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(rpc_requests_total[5m])",
            "legendFormat": "{{ endpoint }} - {{ status }}"
          }
        ]
      },
      {
        "title": "Heartbeat Latency",
        "type": "graph",
        "targets": [
          {
            "expr": "heartbeat_last_seen_seconds",
            "legendFormat": "{{ service }}"
          }
        ],
        "alert": {
          "name": "Heartbeat Stale",
          "condition": "last() > 300",
          "message": "Service heartbeat is stale (>5 min)"
        }
      }
    ]
  }
}
```

---

### 1.2 Risk Monitoring

#### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     RISK MONITORING LAYER                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────────────────┐│
│  │ Real-Time   │   │ Position    │   │     Circuit Breakers    ││
│  │ P&L Engine  │──►│  Monitor    │──►│  ┌─────┐ ┌─────┐ ┌────┐ ││
│  │             │   │             │   │  │Daily│ │Wkly │ │Abnl│ ││
│  └─────────────┘   └─────────────┘   │  │ 2%  │ │ 5%  │ │Act │ ││
│                                      │  └─────┘ └─────┘ └────┘ ││
│  ┌─────────────┐   ┌─────────────┐   └─────────────────────────┘│
│  │  Exposure   │   │ Drawdown    │              │               │
│  │   Limits    │   │  Tracker    │              ▼               │
│  └──────┬──────┘   └──────┬──────┘   ┌─────────────────────────┐│
│         │                 │          │   Risk Action Engine    ││
│         └─────────────────┴─────────►│  - Liquidate positions  ││
│                                      │  - Pause trading        ││
│                                      │  - Alert operators      ││
└──────────────────────────────────────┴─────────────────────────┘
```

#### Implementation

**Risk Manager Service:**

```python
# src/risk/risk_manager.py
from dataclasses import dataclass
from typing import Dict, List, Optional
from decimal import Decimal
import asyncio
from datetime import datetime, timedelta
import redis.asyncio as redis
from prometheus_client import Gauge, Counter

# Metrics
pnl_gauge = Gauge('trading_pnl_usd', 'Current P&L in USD', ['strategy', 'timeframe'])
exposure_gauge = Gauge('position_exposure_usd', 'Position exposure', ['asset', 'direction'])
drawdown_gauge = Gauge('drawdown_percent', 'Current drawdown %', ['timeframe'])
circuit_breaker_triggered = Counter('circuit_breaker_triggered_total', 'Circuit breaker triggers', ['type'])

@dataclass
class RiskLimits:
    max_daily_drawdown: Decimal = Decimal("0.02")  # 2%
    max_weekly_drawdown: Decimal = Decimal("0.05")  # 5%
    max_position_exposure_usd: Decimal = Decimal("100000")
    max_total_exposure_usd: Decimal = Decimal("500000")
    max_single_trade_loss_usd: Decimal = Decimal("10000")
    max_failed_transactions: int = 3

@dataclass
class Position:
    asset: str
    direction: str  # 'long' or 'short'
    size: Decimal
    entry_price: Decimal
    current_price: Decimal
    unrealized_pnl: Decimal

class RiskManager:
    def __init__(self, limits: RiskLimits, redis_client: redis.Redis):
        self.limits = limits
        self.redis = redis_client
        self.positions: Dict[str, Position] = {}
        self.daily_pnl = Decimal("0")
        self.weekly_pnl = Decimal("0")
        self.peak_balance = Decimal("0")
        self.failed_transactions = 0
        self.circuit_breaker_active = False
        
    async def start_monitoring(self):
        """Start continuous risk monitoring"""
        tasks = [
            self._monitor_pnl(),
            self._monitor_exposure(),
            self._monitor_drawdown(),
            self._monitor_transactions(),
        ]
        await asyncio.gather(*tasks)
    
    async def _monitor_pnl(self):
        """Real-time P&L tracking"""
        while True:
            total_pnl = sum(p.unrealized_pnl for p in self.positions.values())
            realized_pnl = await self._get_realized_pnl_today()
            
            self.daily_pnl = total_pnl + realized_pnl
            
            # Update metrics
            pnl_gauge.labels(strategy='total', timeframe='daily').set(float(self.daily_pnl))
            
            # Check daily loss limit
            daily_return = self.daily_pnl / self._get_balance()
            if daily_return < -self.limits.max_daily_drawdown:
                await self._trigger_circuit_breaker(
                    f"Daily drawdown limit exceeded: {daily_return:.2%}",
                    'daily_drawdown'
                )
            
            await asyncio.sleep(5)  # 5-second intervals
    
    async def _monitor_exposure(self):
        """Position exposure monitoring"""
        while True:
            total_exposure = Decimal("0")
            
            for position in self.positions.values():
                exposure = position.size * position.current_price
                total_exposure += exposure
                
                # Update metrics per position
                exposure_gauge.labels(
                    asset=position.asset,
                    direction=position.direction
                ).set(float(exposure))
                
                # Check individual position limits
                if exposure > self.limits.max_position_exposure_usd:
                    await self._reduce_position(position, reason="Max exposure exceeded")
            
            # Check total exposure
            if total_exposure > self.limits.max_total_exposure_usd:
                await self._trigger_circuit_breaker(
                    f"Total exposure limit exceeded: ${total_exposure:,.2f}",
                    'total_exposure'
                )
            
            await asyncio.sleep(10)
    
    async def _monitor_drawdown(self):
        """Track drawdown from peak"""
        while True:
            current_balance = self._get_balance()
            
            if current_balance > self.peak_balance:
                self.peak_balance = current_balance
            
            drawdown = (self.peak_balance - current_balance) / self.peak_balance
            drawdown_gauge.labels(timeframe='current').set(float(drawdown))
            
            # Check weekly drawdown
            weekly_return = await self._get_weekly_return()
            if weekly_return < -self.limits.max_weekly_drawdown:
                await self._trigger_circuit_breaker(
                    f"Weekly drawdown limit exceeded: {weekly_return:.2%}",
                    'weekly_drawdown'
                )
            
            await asyncio.sleep(60)  # Check every minute
    
    async def _monitor_transactions(self):
        """Monitor for failed transactions"""
        while True:
            if self.failed_transactions >= self.limits.max_failed_transactions:
                await self._trigger_circuit_breaker(
                    f"Too many failed transactions: {self.failed_transactions}",
                    'failed_transactions'
                )
            
            await asyncio.sleep(30)
    
    async def _trigger_circuit_breaker(self, reason: str, alert_type: str):
        """Activate circuit breaker - halt trading"""
        if self.circuit_breaker_active:
            return
        
        self.circuit_breaker_active = True
        circuit_breaker_triggered.labels(type=alert_type).inc()
        
        # Immediate actions
        await asyncio.gather(
            self._liquidate_all_positions(),
            self._pause_trading(),
            self._send_critical_alert(f"🚨 CIRCUIT BREAKER ACTIVATED 🚨\nReason: {reason}"),
            self._page_oncall_engineer(reason)
        )
        
        # Log to audit trail
        await self._log_risk_event("CIRCUIT_BREAKER", reason)
    
    async def _reduce_position(self, position: Position, reason: str):
        """Reduce position size"""
        # Implementation: Place reduce-only orders
        pass
    
    async def _liquidate_all_positions(self):
        """Emergency liquidation"""
        # Implementation: Market close all positions
        pass
    
    async def _pause_trading(self):
        """Pause all trading activities"""
        await self.redis.set("trading:paused", "true", ex=3600)
    
    async def _send_critical_alert(self, message: str):
        """Send critical alert via all channels"""
        # Telegram + SMS + PagerDuty
        pass
    
    async def _page_oncall_engineer(self, reason: str):
        """Page the on-call engineer"""
        pass
```

**Risk Limits Configuration:**

```yaml
# config/risk-limits.yml
risk_limits:
  production:
    max_daily_drawdown: 0.02
    max_weekly_drawdown: 0.05
    max_monthly_drawdown: 0.10
    max_position_exposure_usd: 100000
    max_total_exposure_usd: 500000
    max_single_trade_loss_usd: 10000
    max_concentration_per_asset: 0.20  # 20% of portfolio
    max_leverage: 3.0
    max_failed_transactions: 3
    circuit_breaker_cooldown_minutes: 60
    
  staging:
    max_daily_drawdown: 0.05
    max_weekly_drawdown: 0.10
    max_position_exposure_usd: 10000
    max_total_exposure_usd: 50000
    max_single_trade_loss_usd: 1000
    max_concentration_per_asset: 0.30
    max_leverage: 2.0
    max_failed_transactions: 5
    circuit_breaker_cooldown_minutes: 30
    
  development:
    max_daily_drawdown: 1.0  # Effectively disabled
    max_weekly_drawdown: 1.0
    max_position_exposure_usd: 1000000
    max_total_exposure_usd: 5000000
    max_single_trade_loss_usd: 100000
```

**Unusual Activity Detection:**

```python
# src/risk/anomaly_detection.py
import numpy as np
from sklearn.ensemble import IsolationForest
from prometheus_client import Counter

anomaly_detected = Counter('anomaly_detected_total', 'Anomalies detected', ['type'])

class AnomalyDetector:
    def __init__(self):
        self.model = IsolationForest(contamination=0.01, random_state=42)
        self.window_size = 100
        self.trade_history = []
        
    def analyze_trade(self, trade_data: dict) -> bool:
        """Analyze trade for anomalies"""
        features = self._extract_features(trade_data)
        
        if len(self.trade_history) < self.window_size:
            self.trade_history.append(features)
            return False
        
        # Fit model and predict
        X = np.array(self.trade_history)
        self.model.fit(X)
        
        prediction = self.model.predict([features])
        is_anomaly = prediction[0] == -1
        
        if is_anomaly:
            anomaly_detected.labels(type='trade_pattern').inc()
            return True
        
        # Update history
        self.trade_history.pop(0)
        self.trade_history.append(features)
        
        return False
    
    def _extract_features(self, trade: dict) -> list:
        """Extract numerical features from trade"""
        return [
            float(trade['size']),
            float(trade['price']),
            float(trade.get('slippage', 0)),
            float(trade.get('latency_ms', 0)),
            trade['timestamp'].hour,
            trade['timestamp'].weekday(),
        ]
```

---

### 1.3 Performance Analytics

#### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                   PERFORMANCE ANALYTICS LAYER                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌───────────────┐    ┌───────────────┐    ┌─────────────────┐ │
│  │  Trade Logger │───►│  Metrics      │───►│  Strategy       │ │
│  │               │    │  Aggregator   │    │  Performance    │ │
│  └───────────────┘    └───────────────┘    └─────────────────┘ │
│         │                    │                       │          │
│         │                    ▼                       ▼          │
│         │           ┌───────────────┐    ┌─────────────────┐   │
│         │           │  TimescaleDB  │    │   Benchmark     │   │
│         │           │   (TSDB)      │    │   Comparison    │   │
│         │           └───────┬───────┘    └─────────────────┘   │
│         │                   │                                   │
│         ▼                   ▼                                   │
│  ┌───────────────┐    ┌───────────────┐                        │
│  │  Kafka Topic  │    │   Grafana     │                        │
│  │  trade-events │    │  Dashboards   │                        │
│  └───────────────┘    └───────────────┘                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### Implementation

**Trade Logger:**

```python
# src/analytics/trade_logger.py
from dataclasses import dataclass, asdict
from datetime import datetime
from decimal import Decimal
import json
import asyncpg
from kafka import KafkaProducer

@dataclass
class TradeRecord:
    trade_id: str
    timestamp: datetime
    strategy: str
    symbol: str
    side: str
    entry_price: Decimal
    exit_price: Optional[Decimal]
    size: Decimal
    fees: Decimal
    slippage: Decimal
    latency_ms: int
    pnl: Optional[Decimal]
    pnl_percent: Optional[Decimal]
    metadata: dict

class TradeLogger:
    def __init__(self, db_pool: asyncpg.Pool, kafka_producer: KafkaProducer):
        self.db = db_pool
        self.kafka = kafka_producer
        
    async def log_trade(self, trade: TradeRecord):
        """Log trade to database and Kafka"""
        # Persist to TimescaleDB
        await self.db.execute("""
            INSERT INTO trades (
                trade_id, timestamp, strategy, symbol, side,
                entry_price, exit_price, size, fees, slippage,
                latency_ms, pnl, pnl_percent, metadata
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        """, 
            trade.trade_id, trade.timestamp, trade.strategy, 
            trade.symbol, trade.side, trade.entry_price, trade.exit_price,
            trade.size, trade.fees, trade.slippage, trade.latency_ms,
            trade.pnl, trade.pnl_percent, json.dumps(trade.metadata)
        )
        
        # Publish to Kafka for real-time analytics
        self.kafka.send('trade-events', asdict(trade))
        
    async def calculate_metrics(self, strategy: str, timeframe: str) -> dict:
        """Calculate strategy performance metrics"""
        query = """
            SELECT 
                COUNT(*) as total_trades,
                SUM(CASE WHEN pnl > 0 THEN 1 ELSE 0 END) as winning_trades,
                SUM(CASE WHEN pnl < 0 THEN 1 ELSE 0 END) as losing_trades,
                SUM(pnl) as total_pnl,
                AVG(pnl) as avg_pnl,
                AVG(CASE WHEN pnl > 0 THEN pnl END) as avg_win,
                AVG(CASE WHEN pnl < 0 THEN pnl END) as avg_loss,
                AVG(latency_ms) as avg_latency,
                AVG(slippage) as avg_slippage,
                STDDEV(pnl) as pnl_std
            FROM trades
            WHERE strategy = $1
            AND timestamp >= NOW() - INTERVAL $2
        """
        
        row = await self.db.fetchrow(query, strategy, timeframe)
        
        if row['total_trades'] == 0:
            return {}
        
        # Calculate derived metrics
        win_rate = row['winning_trades'] / row['total_trades']
        profit_factor = abs(
            row['avg_win'] * row['winning_trades'] / 
            (row['avg_loss'] * row['losing_trades'])
        ) if row['losing_trades'] > 0 else float('inf')
        
        # Sharpe ratio (assuming risk-free rate = 0)
        returns = row['total_pnl'] / self._get_starting_capital(strategy)
        volatility = row['pnl_std'] / self._get_starting_capital(strategy)
        sharpe = (returns * 252) / (volatility * np.sqrt(252)) if volatility > 0 else 0
        
        # Expectancy
        expectancy = (win_rate * row['avg_win']) + ((1 - win_rate) * row['avg_loss'])
        
        return {
            'total_trades': row['total_trades'],
            'win_rate': win_rate,
            'profit_factor': profit_factor,
            'sharpe_ratio': sharpe,
            'expectancy': expectancy,
            'total_pnl': row['total_pnl'],
            'avg_pnl': row['avg_pnl'],
            'avg_latency_ms': row['avg_latency'],
            'avg_slippage_bps': row['avg_slippage'] * 10000,
        }
```

**Database Schema:**

```sql
-- timescale/init.sql
-- Enable TimescaleDB
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Trades table
CREATE TABLE trades (
    trade_id UUID PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL,
    strategy VARCHAR(50) NOT NULL,
    symbol VARCHAR(20) NOT NULL,
    side VARCHAR(10) NOT NULL,
    entry_price DECIMAL(20, 8) NOT NULL,
    exit_price DECIMAL(20, 8),
    size DECIMAL(20, 8) NOT NULL,
    fees DECIMAL(20, 8) NOT NULL DEFAULT 0,
    slippage DECIMAL(10, 6) NOT NULL DEFAULT 0,
    latency_ms INTEGER,
    pnl DECIMAL(20, 8),
    pnl_percent DECIMAL(10, 6),
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Convert to hypertable
SELECT create_hypertable('trades', 'timestamp', chunk_time_interval => INTERVAL '1 day');

-- Indexes for performance
CREATE INDEX idx_trades_strategy ON trades (strategy, timestamp DESC);
CREATE INDEX idx_trades_symbol ON trades (symbol, timestamp DESC);

-- Daily performance summary
CREATE TABLE daily_performance (
    date DATE NOT NULL,
    strategy VARCHAR(50) NOT NULL,
    total_trades INTEGER DEFAULT 0,
    winning_trades INTEGER DEFAULT 0,
    losing_trades INTEGER DEFAULT 0,
    gross_profit DECIMAL(20, 8) DEFAULT 0,
    gross_loss DECIMAL(20, 8) DEFAULT 0,
    net_pnl DECIMAL(20, 8) DEFAULT 0,
    avg_trade DECIMAL(20, 8) DEFAULT 0,
    max_drawdown DECIMAL(10, 6) DEFAULT 0,
    sharpe_ratio DECIMAL(10, 6),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (date, strategy)
);

-- System metrics
CREATE TABLE system_metrics (
    timestamp TIMESTAMPTZ NOT NULL,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DOUBLE PRECISION NOT NULL,
    labels JSONB,
    metadata JSONB
);
SELECT create_hypertable('system_metrics', 'timestamp', chunk_time_interval => INTERVAL '1 hour');
```

---

### 1.4 Alerting System

#### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      ALERTING LAYER                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────┐     ┌─────────────────────────────────────┐│
│  │  Alert Sources  │     │        Alert Router                  ││
│  │                 │     │  ┌─────────┐ ┌─────────┐ ┌────────┐ ││
│  │ • Prometheus    │────►│  │Severity │ │  Group  │ │Throttle│ ││
│  │ • Risk Manager  │     │  │ Filter  │ │  Rules  │ │  Rate  │ ││
│  │ • Health Checks │     │  └────┬────┘ └────┬────┘ └───┬────┘ ││
│  │ • Custom Apps   │     │       └─────────┬─────────┘        ││
│  └─────────────────┘     └─────────────────┼──────────────────┘│
│                                            │                    │
│                                            ▼                    │
│                          ┌─────────────────────────────────────┐│
│                          │      Notification Channels           ││
│                          │  ┌──────────┐ ┌──────────┐          ││
│                          │  │ Telegram │ │ Discord  │          ││
│                          │  │ (Trades) │ │ (Trades) │          ││
│                          │  └──────────┘ └──────────┘          ││
│                          │  ┌──────────┐ ┌──────────┐          ││
│                          │  │   SMS    │ │  Email   │          ││
│                          │  │(Critical)│ │(Critical)│          ││
│                          │  └──────────┘ └──────────┘          ││
│                          │  ┌────────────────────────┐          ││
│                          │  │   PagerDuty/Opsgenie   │          ││
│                          │  │     (24/7 On-Call)     │          ││
│                          │  └────────────────────────┘          ││
│                          └─────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

#### Implementation

**Alert Router:**

```python
# src/alerts/alert_router.py
from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import List, Dict
import asyncio
import redis.asyncio as redis
from enum import Enum

class AlertSeverity(Enum):
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"
    EMERGENCY = "emergency"

@dataclass
class Alert:
    id: str
    severity: AlertSeverity
    source: str
    title: str
    message: str
    timestamp: datetime
    labels: Dict[str, str]
    routing_key: str

class AlertRouter:
    def __init__(self, redis_client: redis.Redis):
        self.redis = redis_client
        self.alert_history = []
        self.throttle_window = timedelta(minutes=15)
        
        # Channel configurations
        self.channels = {
            AlertSeverity.INFO: ['telegram', 'discord'],
            AlertSeverity.WARNING: ['telegram', 'discord', 'email'],
            AlertSeverity.CRITICAL: ['telegram', 'discord', 'email', 'sms', 'pagerduty'],
            AlertSeverity.EMERGENCY: ['telegram', 'discord', 'email', 'sms', 'pagerduty', 'phone'],
        }
        
        # Grouping rules
        self.grouping_rules = {
            'trading_errors': {
                'window': timedelta(minutes=5),
                'max_alerts': 5,
                'group_template': '{count} trading errors in last 5 minutes'
            }
        }
    
    async def route_alert(self, alert: Alert):
        """Route alert to appropriate channels"""
        # Check throttling
        if await self._is_throttled(alert):
            return
        
        # Apply grouping
        grouped = await self._apply_grouping(alert)
        if grouped:
            alert = grouped
        
        # Get target channels
        channels = self.channels.get(alert.severity, ['telegram'])
        
        # Send to all channels concurrently
        tasks = []
        for channel in channels:
            tasks.append(self._send_to_channel(alert, channel))
        
        await asyncio.gather(*tasks, return_exceptions=True)
        
        # Record alert
        await self._record_alert(alert)
    
    async def _is_throttled(self, alert: Alert) -> bool:
        """Check if alert should be throttled"""
        key = f"alert:throttle:{alert.routing_key}"
        count = await self.redis.incr(key)
        
        if count == 1:
            await self.redis.expire(key, int(self.throttle_window.total_seconds()))
        
        # Allow max 5 alerts per window
        return count > 5
    
    async def _apply_grouping(self, alert: Alert) -> Alert:
        """Apply alert grouping rules"""
        # Check if alert matches grouping rule
        for rule_name, rule in self.grouping_rules.items():
            if alert.routing_key.startswith(rule_name):
                # Get recent alerts
                recent = await self._get_recent_alerts(rule['window'], alert.routing_key)
                
                if len(recent) >= rule['max_alerts']:
                    # Create grouped alert
                    return Alert(
                        id=f"grouped-{datetime.utcnow().timestamp()}",
                        severity=alert.severity,
                        source=alert.source,
                        title=f"Grouped: {alert.title}",
                        message=rule['group_template'].format(count=len(recent) + 1),
                        timestamp=datetime.utcnow(),
                        labels={**alert.labels, 'grouped': 'true', 'count': str(len(recent) + 1)},
                        routing_key=f"grouped:{alert.routing_key}"
                    )
        
        return alert
    
    async def _send_to_channel(self, alert: Alert, channel: str):
        """Send alert to specific channel"""
        if channel == 'telegram':
            await self._send_telegram(alert)
        elif channel == 'discord':
            await self._send_discord(alert)
        elif channel == 'email':
            await self._send_email(alert)
        elif channel == 'sms':
            await self._send_sms(alert)
        elif channel == 'pagerduty':
            await self._send_pagerduty(alert)
    
    async def _send_telegram(self, alert: Alert):
        """Send alert via Telegram"""
        emoji = {
            AlertSeverity.INFO: "ℹ️",
            AlertSeverity.WARNING: "⚠️",
            AlertSeverity.CRITICAL: "🚨",
            AlertSeverity.EMERGENCY: "🔥"
        }
        
        message = f"""
{emoji.get(alert.severity, 'ℹ️')} *{alert.title}*

{alert.message}

Source: `{alert.source}`
Time: `{alert.timestamp.isoformat()}`
        """
        
        # Send via Telegram Bot API
        # Implementation omitted
    
    async def _send_pagerduty(self, alert: Alert):
        """Send alert to PagerDuty"""
        if alert.severity in [AlertSeverity.CRITICAL, AlertSeverity.EMERGENCY]:
            # Create incident
            pass
```

**AlertManager Configuration:**

```yaml
# alertmanager/alertmanager.yml
global:
  smtp_smarthost: 'smtp.gmail.com:587'
  smtp_from: 'alerts@tradingbot.com'
  smtp_auth_username: 'alerts@tradingbot.com'
  smtp_auth_password: '${SMTP_PASSWORD}'
  
  pagerduty_url: 'https://events.pagerduty.com/v2/enqueue'
  opsgenie_api_url: 'https://api.opsgenie.com/'

templates:
  - '/etc/alertmanager/templates/*.tmpl'

route:
  receiver: 'default'
  group_by: ['alertname', 'severity', 'service']
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 4h
  
  routes:
    # Critical alerts - immediate paging
    - match:
        severity: critical
      receiver: 'critical-team'
      group_wait: 0s
      repeat_interval: 15m
      continue: true
    
    # Trading alerts - Telegram + Discord
    - match:
        category: trading
      receiver: 'trading-channels'
      group_interval: 1m
      
    # Infrastructure alerts
    - match:
        category: infrastructure
      receiver: 'infrastructure-team'
      group_interval: 5m

receivers:
  - name: 'default'
    email_configs:
      - to: 'oncall@tradingbot.com'
        
  - name: 'critical-team'
    pagerduty_configs:
      - service_key: '${PAGERDUTY_SERVICE_KEY}'
        severity: critical
    opsgenie_configs:
      - api_key: '${OPSGENIE_API_KEY}'
        priority: P1
    sms_configs:
      - to: '${ONCALL_PHONE}'
        
  - name: 'trading-channels'
    webhook_configs:
      - url: 'http://alert-router:8080/webhook/telegram'
        send_resolved: true
      - url: 'http://alert-router:8080/webhook/discord'
        send_resolved: true
        
  - name: 'infrastructure-team'
    slack_configs:
      - api_url: '${SLACK_WEBHOOK_URL}'
        channel: '#infrastructure'
        title: '{{ .GroupLabels.alertname }}'
        text: '{{ range .Alerts }}{{ .Annotations.summary }}{{ end }}'

inhibit_rules:
  # Suppress warning alerts if critical alert is firing
  - source_match:
      severity: 'critical'
    target_match:
      severity: 'warning'
    equal: ['alertname', 'service']
```

---

## 2. Automation Framework

### 2.1 Deployment

#### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     CI/CD PIPELINE                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌──────────────┐ │
│  │  GitHub │───►│  GitHub │───►│  Docker │───►│   ECR/ACR    │ │
│  │  Push   │    │ Actions │    │  Build  │    │  (Registry)  │ │
│  └─────────┘    └─────────┘    └─────────┘    └──────┬───────┘ │
│                                                      │          │
│  ┌───────────────────────────────────────────────────┘          │
│  │                                                              │
│  ▼                                                              │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │              KUBERNETES DEPLOYMENT                           ││
│  │  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌──────────┐ ││
│  │  │  ArgoCD   │  │  Helm     │  │  Kustomize│  │ Terraform │ ││
│  │  │(GitOps)   │  │(Charts)   │  │(Overlays) │  │  (Infra)  │ ││
│  │  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘  └────┬─────┘ ││
│  │        └──────────────┴──────────────┴─────────────┘       ││
│  │                            │                                ││
│  │                            ▼                                ││
│  │  ┌─────────────────────────────────────────────────────┐   ││
│  │  │           Kubernetes Cluster                         │   ││
│  │  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌───────────┐ │   ││
│  │  │  │ Trading │ │  Risk   │ │  Alert  │ │Monitoring │ │   ││
│  │  │  │ Engine  │ │ Manager │ │ Service │ │  Stack    │ │   ││
│  │  │  │ (Pod)   │ │  (Pod)  │ │  (Pod)  │ │  (Pods)   │ │   ││
│  │  │  └─────────┘ └─────────┘ └─────────┘ └───────────┘ │   ││
│  │  └─────────────────────────────────────────────────────┘   ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

#### Implementation

**GitHub Actions Workflow:**

```yaml
# .github/workflows/deploy.yml
name: Deploy Trading Infrastructure

on:
  push:
    branches: [main, staging]
  pull_request:
    branches: [main]

env:
  AWS_REGION: us-east-1
  ECR_REGISTRY: ${{ secrets.AWS_ACCOUNT_ID }}.dkr.ecr.us-east-1.amazonaws.com

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
          
      - name: Install dependencies
        run: |
          pip install -r requirements.txt
          pip install -r requirements-test.txt
          
      - name: Run tests
        run: pytest tests/ --cov=src --cov-report=xml
        
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}
          
      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v1
        
      - name: Build and push images
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          IMAGE_TAG: ${{ github.sha }}
        run: |
          # Build trading engine
          docker build -t $ECR_REGISTRY/trading-engine:$IMAGE_TAG -f docker/trading-engine.Dockerfile .
          docker push $ECR_REGISTRY/trading-engine:$IMAGE_TAG
          
          # Build risk manager
          docker build -t $ECR_REGISTRY/risk-manager:$IMAGE_TAG -f docker/risk-manager.Dockerfile .
          docker push $ECR_REGISTRY/risk-manager:$IMAGE_TAG
          
          # Build monitoring stack
          docker build -t $ECR_REGISTRY/monitoring:$IMAGE_TAG -f docker/monitoring.Dockerfile .
          docker push $ECR_REGISTRY/monitoring:$IMAGE_TAG

  deploy-staging:
    needs: build
    if: github.ref == 'refs/heads/staging'
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - uses: actions/checkout@v3
      
      - name: Configure kubectl
        run: |
          aws eks update-kubeconfig --region ${{ env.AWS_REGION }} --name trading-staging
          
      - name: Deploy to staging
        run: |
          # Update image tags
          kustomize edit set image trading-engine=$ECR_REGISTRY/trading-engine:${{ github.sha }}
          
          # Apply manifests
          kubectl apply -k k8s/overlays/staging/
          
          # Wait for rollout
          kubectl rollout status deployment/trading-engine -n staging --timeout=300s

  deploy-production:
    needs: build
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v3
      
      - name: Configure kubectl
        run: |
          aws eks update-kubeconfig --region ${{ env.AWS_REGION }} --name trading-production
          
      - name: Deploy to production
        run: |
          # Canary deployment - 10% traffic first
          kubectl apply -k k8s/overlays/production-canary/
          kubectl rollout status deployment/trading-engine-canary -n production --timeout=300s
          
          # Run smoke tests
          ./scripts/smoke-tests.sh
          
          # Full rollout if tests pass
          kubectl apply -k k8s/overlays/production/
          kubectl rollout status deployment/trading-engine -n production --timeout=300s
```

**Helm Chart:**

```yaml
# helm/trading-engine/Chart.yaml
apiVersion: v2
name: trading-engine
description: Trading engine deployment
type: application
version: 1.0.0
appVersion: "1.2.3"

dependencies:
  - name: postgresql
    version: 12.x.x
    repository: https://charts.bitnami.com/bitnami
    condition: postgresql.enabled
  - name: redis
    version: 17.x.x
    repository: https://charts.bitnami.com/bitnami
    condition: redis.enabled
```

```yaml
# helm/trading-engine/values.yaml
# Default values for trading-engine
replicaCount: 3

image:
  repository: trading-engine
  pullPolicy: IfNotPresent
  tag: "latest"

service:
  type: ClusterIP
  port: 8080

resources:
  limits:
    cpu: 2000m
    memory: 4Gi
  requests:
    cpu: 1000m
    memory: 2Gi

autoscaling:
  enabled: true
  minReplicas: 3
  maxReplicas: 10
  targetCPUUtilizationPercentage: 70
  targetMemoryUtilizationPercentage: 80

env:
  - name: ENVIRONMENT
    value: "production"
  - name: LOG_LEVEL
    value: "INFO"

secrets:
  - name: api-keys
    keys:
      - EXCHANGE_API_KEY
      - EXCHANGE_SECRET
  - name: rpc-endpoints
    keys:
      - PRIMARY_RPC
      - SECONDARY_RPC
      - FALLBACK_RPC

livenessProbe:
  httpGet:
    path: /health/live
    port: 8080
  initialDelaySeconds: 30
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /health/ready
    port: 8080
  initialDelaySeconds: 5
  periodSeconds: 5

persistence:
  enabled: true
  storageClass: "fast-ssd"
  size: 100Gi

networkPolicy:
  enabled: true
  ingress:
    - from:
        - namespaceSelector:
            matchLabels:
              name: monitoring
  egress:
    - to:
        - namespaceSelector:
            matchLabels:
              name: database
```

**Terraform Infrastructure:**

```hcl
# terraform/main.tf
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.23"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# EKS Cluster
module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 19.0"

  cluster_name    = "trading-${var.environment}"
  cluster_version = "1.28"

  cluster_endpoint_public_access  = true
  cluster_endpoint_private_access = true

  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets

  # Managed node groups
  eks_managed_node_groups = {
    trading = {
      desired_size = 3
      min_size     = 3
      max_size     = 20

      instance_types = ["m6i.2xlarge"]
      capacity_type  = "ON_DEMAND"

      labels = {
        workload = "trading"
      }

      taints = [{
        key    = "dedicated"
        value  = "trading"
        effect = "NO_SCHEDULE"
      }]
    }

    monitoring = {
      desired_size = 2
      min_size     = 2
      max_size     = 5

      instance_types = ["m6i.xlarge"]
      capacity_type  = "ON_DEMAND"

      labels = {
        workload = "monitoring"
      }
    }
  }
}

# RDS PostgreSQL
module "db" {
  source  = "terraform-aws-modules/rds/aws"
  version = "~> 6.0"

  identifier = "trading-${var.environment}"

  engine         = "postgres"
  engine_version = "15.4"
  instance_class = var.environment == "production" ? "db.r6g.2xlarge" : "db.t3.medium"

  allocated_storage     = 100
  max_allocated_storage = 1000

  db_name  = "trading"
  username = "trading_admin"
  port     = 5432

  multi_az               = var.environment == "production"
  deletion_protection    = var.environment == "production"
  create_random_password = true

  vpc_security_group_ids = [aws_security_group.database.id]
  db_subnet_group_name   = module.vpc.database_subnet_group_name

  backup_retention_period = var.environment == "production" ? 35 : 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "Mon:04:00-Mon:05:00"

  performance_insights_enabled = true
  monitoring_interval          = 60

  tags = {
    Environment = var.environment
    Service     = "trading"
  }
}

# ElastiCache Redis
module "redis" {
  source  = "terraform-aws-modules/elasticache/aws"
  version = "~> 1.0"

  cluster_id = "trading-${var.environment}"

  engine_version       = "7.0"
  node_type            = var.environment == "production" ? "cache.r6g.xlarge" : "cache.t3.micro"
  num_cache_clusters   = var.environment == "production" ? 3 : 2
  automatic_failover_enabled = var.environment == "production"

  at_rest_encryption_enabled = true
  transit_encryption_enabled = true

  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets

  tags = {
    Environment = var.environment
    Service     = "trading"
  }
}

# CloudWatch Alarms
resource "aws_cloudwatch_metric_alarm" "high_cpu" {
  alarm_name          = "trading-${var.environment}-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors EC2 CPU utilization"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    AutoScalingGroupName = module.eks.eks_managed_node_groups["trading"].name
  }
}
```

---

### 2.2 Configuration Management

#### Implementation

```yaml
# config/environments/production.yml
environment: production
log_level: INFO

# Trading Engine
trading:
  max_concurrent_trades: 100
  order_timeout_seconds: 30
  retry_attempts: 3
  
  # Strategy parameters (can be updated dynamically)
  strategies:
    momentum:
      enabled: true
      position_size_pct: 0.05
      entry_threshold: 0.02
      exit_threshold: 0.01
      stop_loss_pct: 0.02
      take_profit_pct: 0.05
      
    mean_reversion:
      enabled: true
      position_size_pct: 0.03
      lookback_period: 20
      zscore_threshold: 2.0

# Risk Management
risk:
  limits:
    max_daily_drawdown: 0.02
    max_weekly_drawdown: 0.05
    max_position_exposure_usd: 100000
    max_total_exposure_usd: 500000
    
  circuit_breakers:
    enabled: true
    auto_reset_minutes: 60
    require_manual_approval: true

# Monitoring
monitoring:
  prometheus:
    enabled: true
    scrape_interval: 15s
    retention_days: 30
    
  grafana:
    enabled: true
    dashboards:
      - trading-overview
      - risk-metrics
      - system-health
      
  alerting:
    telegram:
      enabled: true
      chat_id: "${TELEGRAM_CHAT_ID}"
    
    pagerduty:
      enabled: true
      service_key: "${PAGERDUTY_SERVICE_KEY}"
      
    sms:
      enabled: true
      phone_number: "${ONCALL_PHONE}"

# External Services
connections:
  rpc:
    primary: "${PRIMARY_RPC_URL}"
    secondary: "${SECONDARY_RPC_URL}"
    fallback: "${FALLBACK_RPC_URL}"
    timeout_ms: 30000
    
  exchanges:
    binance:
      api_key: "${BINANCE_API_KEY}"
      secret: "${BINANCE_SECRET}"
      testnet: false
      rate_limit: 1200  # requests per minute
      
# Feature Flags (for A/B testing)
features:
  new_execution_engine:
    enabled: false
    rollout_pct: 0  # Start at 0%, increase gradually
    
  improved_slippage_model:
    enabled: true
    rollout_pct: 100
```

**Secret Management:**

```bash
#!/bin/bash
# scripts/manage-secrets.sh

# Using AWS Secrets Manager for production secrets

ENVIRONMENT=${1:-staging}
ACTION=${2:-list}

case $ACTION in
  create)
    # Create/update secrets from .env file
    aws secretsmanager create-secret \
      --name "trading/${ENVIRONMENT}/api-keys" \
      --description "API keys for ${ENVIRONMENT}" \
      --secret-string file://secrets/${ENVIRONMENT}.json
    ;;
    
  update)
    aws secretsmanager put-secret-value \
      --secret-id "trading/${ENVIRONMENT}/api-keys" \
      --secret-string file://secrets/${ENVIRONMENT}.json
    ;;
    
  get)
    aws secretsmanager get-secret-value \
      --secret-id "trading/${ENVIRONMENT}/api-keys" \
      --query SecretString --output text | jq .
    ;;
    
  rotate)
    # Rotate API keys automatically
    echo "Rotating API keys for ${ENVIRONMENT}..."
    # Implementation: Generate new keys, update exchanges, update secrets
    ;;
    
  *)
    echo "Usage: $0 <environment> <create|update|get|rotate>"
    ;;
esac
```

**Dynamic Configuration:**

```python
# src/config/dynamic_config.py
import asyncio
import json
import watchfiles
from dataclasses import dataclass
from typing import Any, Callable
import redis.asyncio as redis

class DynamicConfig:
    """Configuration that can be updated at runtime"""
    
    def __init__(self, redis_client: redis.Redis, config_path: str):
        self.redis = redis_client
        self.config_path = config_path
        self.config = {}
        self.subscribers: list[Callable] = []
        
    async def load(self):
        """Load initial configuration"""
        with open(self.config_path) as f:
            self.config = yaml.safe_load(f)
        
        # Store in Redis for distributed access
        await self.redis.set('config:current', json.dumps(self.config))
        
    async def start_watching(self):
        """Watch for configuration changes"""
        async for changes in watchfiles.awatch(self.config_path):
            print(f"Configuration changed: {changes}")
            await self._reload()
    
    async def _reload(self):
        """Reload configuration and notify subscribers"""
        old_config = self.config.copy()
        await self.load()
        
        # Find changed values
        changes = self._get_changes(old_config, self.config)
        
        # Notify subscribers
        for callback in self.subscribers:
            await callback(changes)
        
        # Publish to Redis pub/sub
        await self.redis.publish('config:changes', json.dumps(changes))
    
    def subscribe(self, callback: Callable):
        """Subscribe to configuration changes"""
        self.subscribers.append(callback)
    
    def get(self, key: str, default=None) -> Any:
        """Get configuration value"""
        keys = key.split('.')
        value = self.config
        for k in keys:
            value = value.get(k, default)
            if value is None:
                return default
        return value
    
    async def update(self, key: str, value: Any):
        """Update configuration at runtime"""
        keys = key.split('.')
        config = self.config
        for k in keys[:-1]:
            config = config.setdefault(k, {})
        config[keys[-1]] = value
        
        # Save to file
        with open(self.config_path, 'w') as f:
            yaml.dump(self.config, f)
        
        # Update Redis
        await self.redis.set('config:current', json.dumps(self.config))
```

---

### 2.3 Disaster Recovery

#### Implementation

**Backup Procedures:**

```yaml
# kubernetes/cronjobs/backup.yml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: database-backup
  namespace: backup
spec:
  schedule: "0 */6 * * *"  # Every 6 hours
  concurrencyPolicy: Forbid
  jobTemplate:
    spec:
      template:
        spec:
          containers:
            - name: backup
              image: postgres:15-alpine
              command:
                - /bin/sh
                - -c
                - |
                  pg_dump $DATABASE_URL | gzip > /backups/trading-$(date +%Y%m%d-%H%M%S).sql.gz
                  # Upload to S3
                  aws s3 cp /backups/ s3://trading-backups-${ENVIRONMENT}/database/ --recursive
                  # Keep only last 30 days
                  aws s3 ls s3://trading-backups-${ENVIRONMENT}/database/ | \
                    awk '$1 < "'$(date -d '30 days ago' +%Y-%m-%d)'" {print $4}' | \
                    xargs -I {} aws s3 rm s3://trading-backups-${ENVIRONMENT}/database/{}
              env:
                - name: DATABASE_URL
                  valueFrom:
                    secretKeyRef:
                      name: database-credentials
                      key: url
                - name: AWS_ACCESS_KEY_ID
                  valueFrom:
                    secretKeyRef:
                      name: aws-credentials
                      key: access-key-id
                - name: AWS_SECRET_ACCESS_KEY
                  valueFrom:
                    secretKeyRef:
                      name: aws-credentials
                      key: secret-access-key
              volumeMounts:
                - name: backups
                  mountPath: /backups
          volumes:
            - name: backups
              emptyDir: {}
          restartPolicy: OnFailure
---
apiVersion: batch/v1
kind: CronJob
metadata:
  name: wallet-backup
  namespace: backup
spec:
  schedule: "0 0 * * *"  # Daily at midnight
  jobTemplate:
    spec:
      template:
        spec:
          containers:
            - name: backup
              image: trading-backup:latest
              command:
                - /app/backup-wallets.sh
              env:
                - name: ENCRYPTION_KEY
                  valueFrom:
                    secretKeyRef:
                      name: backup-encryption
                      key: key
          restartPolicy: OnFailure
```

**Recovery Playbooks:**

```markdown
# runbooks/DISASTER-RECOVERY.md

## Disaster Recovery Playbook

### RTO (Recovery Time Objective): 15 minutes
### RPO (Recovery Point Objective): 5 minutes

---

## Scenario 1: Complete Region Failure

### Detection
- PagerDuty alert: "All health checks failing in region X"
- Multiple services unreachable
- Geographic failover triggered

### Recovery Steps

1. **Verify failover has triggered (1 min)**
   ```bash
   kubectl get ingress -n production
   # Should show traffic routing to healthy region
   ```

2. **Verify database replication (2 min)**
   ```bash
   # Check replication lag
   psql -h $DR_DATABASE_HOST -c "SELECT EXTRACT(EPOCH FROM (now() - pg_last_xact_replay_timestamp())) AS lag_seconds;"
   # Lag should be < 60 seconds
   ```

3. **Verify trading engine is running (2 min)**
   ```bash
   kubectl get pods -n production -l app=trading-engine
   # All pods should be Running and Ready
   ```

4. **Verify positions are intact (5 min)**
   ```bash
   # Check position reconciliation
   curl http://trading-engine:8080/api/v1/positions/reconcile
   # Should return: {"status": "ok", "mismatches": 0}
   ```

5. **Resume trading (5 min)**
   ```bash
   # Clear circuit breaker if active
   redis-cli DEL trading:paused
   
   # Verify trading resumes
   curl http://trading-engine:8080/api/v1/status
   ```

---

## Scenario 2: Database Corruption

### Detection
- PostgreSQL errors in logs
- Data integrity check failures

### Recovery Steps

1. **Stop trading immediately (1 min)**
   ```bash
   kubectl set env deployment/trading-engine TRADING_ENABLED=false
   ```

2. **Identify last good backup (2 min)**
   ```bash
   aws s3 ls s3://trading-backups-production/database/ | tail -5
   ```

3. **Restore database (10 min)**
   ```bash
   # Create new database instance
   aws rds restore-db-instance-to-point-in-time \
     --source-db-instance trading-production \
     --target-db-instance trading-production-restored \
     --restore-time $(date -d '30 minutes ago' --iso-8601=seconds)
   
   # Wait for restore
   aws rds wait db-instance-available --db-instance-identifier trading-production-restored
   ```

4. **Verify data integrity (5 min)**
   ```bash
   psql -h trading-production-restored -c "SELECT COUNT(*) FROM trades WHERE timestamp > NOW() - INTERVAL '1 hour';"
   ```

5. **Switch to restored database (2 min)**
   ```bash
   kubectl set env deployment/trading-engine DATABASE_URL=$RESTORED_DATABASE_URL
   kubectl rollout restart deployment/trading-engine
   ```

---

## Scenario 3: Wallet Key Compromise

### Detection
- Unauthorized transactions
- Unexpected balance changes

### Immediate Actions (5 minutes)

1. **Emergency stop**
   ```bash
   # Global circuit breaker
   redis-cli SET trading:emergency_stop true
   
   # Revoke API keys
   ./scripts/revoke-api-keys.sh
   ```

2. **Assess damage**
   ```bash
   # Check balances
   ./scripts/check-balances.sh
   
   # Check recent transactions
   ./scripts/audit-transactions.sh --since="1 hour ago"
   ```

3. **Transfer funds to cold wallet**
   ```bash
   # Use pre-signed emergency transaction
   ./scripts/emergency-withdraw.sh --to-cold-wallet
   ```

4. **Generate new keys**
   ```bash
   # Generate new wallet
   ./scripts/generate-wallet.sh --environment=production
   
   # Update exchange API keys
   ./scripts/rotate-exchange-keys.sh
   ```

---

## Emergency Contacts

| Role | Name | Phone | PagerDuty |
|------|------|-------|-----------|
| Primary On-Call | On-Call Engineer | - | P1 |
| Trading Lead | Trading Manager | +1-xxx-xxxx | P2 |
| Infrastructure | Infra Lead | +1-xxx-xxxx | P2 |
| Security | Security Team | +1-xxx-xxxx | P1 |

---

## Post-Incident

1. Document timeline in incident tracker
2. Conduct post-mortem within 24 hours
3. Update runbooks based on learnings
4. Schedule disaster recovery drill
```

---

## 3. Scaling Considerations

### 3.1 Horizontal Scaling

```yaml
# kubernetes/hpa/trading-engine-hpa.yml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: trading-engine-hpa
  namespace: production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: trading-engine
  minReplicas: 3
  maxReplicas: 50
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
    - type: Pods
      pods:
        metric:
          name: trading_requests_per_second
        target:
          type: AverageValue
          averageValue: "100"
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
        - type: Percent
          value: 100
          periodSeconds: 60
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
        - type: Percent
          value: 10
          periodSeconds: 60
```

### 3.2 Multi-Region Deployment

```hcl
# terraform/multi-region.tf
# Primary region - Tokyo (closest to exchange servers)
module "eks_tokyo" {
  source = "./modules/eks-cluster"
  
  region = "ap-northeast-1"
  name   = "trading-production-tokyo"
  
  # Trading workload optimized
  node_instance_types = ["m6i.2xlarge"]
  
  # Latency-optimized networking
  enable_placement_groups = true
}

# Secondary region - London
module "eks_london" {
  source = "./modules/eks-cluster"
  
  region = "eu-west-1"
  name   = "trading-production-london"
  
  # Smaller capacity for failover
  node_instance_types = ["m6i.xlarge"]
  min_size = 2
  max_size = 10
}

# DR region - US East
module "eks_us_east" {
  source = "./modules/eks-cluster"
  
  region = "us-east-1"
  name   = "trading-production-dr"
  
  # Minimal for cost, can scale up
  node_instance_types = ["m6i.large"]
  min_size = 1
  max_size = 20
}

# Global load balancer with health-based routing
resource "aws_globalaccelerator_accelerator" "trading" {
  name            = "trading-production"
  ip_address_type = "DUAL_STACK"
  enabled         = true
  
  attributes {
    flow_logs_enabled   = true
    flow_logs_s3_bucket = aws_s3_bucket.flow_logs.id
  }
}

# Endpoint groups per region
resource "aws_globalaccelerator_endpoint_group" "tokyo" {
  listener_arn = aws_globalaccelerator_listener.trading.arn
  
  endpoint_group_region = "ap-northeast-1"
  
  endpoint_configuration {
    endpoint_id                    = module.eks_tokyo.service_endpoint
    weight                         = 100
    client_ip_preservation_enabled = true
    health_check_port              = 8080
    health_check_protocol          = "HTTP"
    health_check_path              = "/health"
  }
  
  health_check_interval_seconds = 10
  threshold_count               = 2
  traffic_dial_percentage       = 100
}

resource "aws_globalaccelerator_endpoint_group" "london" {
  listener_arn = aws_globalaccelerator_listener.trading.arn
  
  endpoint_group_region = "eu-west-1"
  
  endpoint_configuration {
    endpoint_id                    = module.eks_london.service_endpoint
    weight                         = 0  # Standby
    client_ip_preservation_enabled = true
  }
  
  traffic_dial_percentage = 0  # No traffic unless failover
}
```

### 3.3 Caching Strategy

```python
# src/cache/redis_cache.py
import json
import pickle
from typing import Optional, Any
import redis.asyncio as redis
from prometheus_client import Counter, Histogram

cache_hits = Counter('cache_hits_total', 'Cache hits', ['cache_name'])
cache_misses = Counter('cache_misses_total', 'Cache misses', ['cache_name'])
cache_latency = Histogram('cache_operation_seconds', 'Cache operation latency', ['operation'])

class RedisCache:
    """Multi-tier caching for trading data"""
    
    def __init__(self, redis_client: redis.Redis):
        self.redis = redis_client
        
    @cache_latency.labels(operation='get').time()
    async def get(self, key: str, cache_name: str = "default") -> Optional[Any]:
        """Get value from cache"""
        value = await self.redis.get(key)
        
        if value:
            cache_hits.labels(cache_name=cache_name).inc()
            return pickle.loads(value)
        
        cache_misses.labels(cache_name=cache_name).inc()
        return None
    
    @cache_latency.labels(operation='set').time()
    async def set(
        self, 
        key: str, 
        value: Any, 
        ttl: int = 300,
        cache_name: str = "default"
    ):
        """Set value in cache with TTL"""
        serialized = pickle.dumps(value)
        await self.redis.setex(key, ttl, serialized)
    
    async def get_or_set(
        self,
        key: str,
        factory: callable,
        ttl: int = 300,
        cache_name: str = "default"
    ) -> Any:
        """Get from cache or compute and store"""
        value = await self.get(key, cache_name)
        
        if value is None:
            value = await factory()
            await self.set(key, value, ttl, cache_name)
        
        return value

# Usage patterns
class MarketDataCache:
    """Cache for market data with different TTLs by freshness requirement"""
    
    def __init__(self, cache: RedisCache):
        self.cache = cache
    
    async def get_price(self, symbol: str) -> float:
        """Prices: Very short TTL (1 second)"""
        return await self.cache.get_or_set(
            f"price:{symbol}",
            lambda: self._fetch_price(symbol),
            ttl=1,
            cache_name="prices"
        )
    
    async def get_orderbook(self, symbol: str) -> dict:
        """Orderbook: Short TTL (100ms)"""
        return await self.cache.get_or_set(
            f"orderbook:{symbol}",
            lambda: self._fetch_orderbook(symbol),
            ttl=0.1,
            cache_name="orderbook"
        )
    
    async def get_historical_data(self, symbol: str, timeframe: str) -> list:
        """Historical data: Longer TTL (1 hour)"""
        return await self.cache.get_or_set(
            f"historical:{symbol}:{timeframe}",
            lambda: self._fetch_historical(symbol, timeframe),
            ttl=3600,
            cache_name="historical"
        )
    
    async def get_position(self, position_id: str) -> dict:
        """Positions: Medium TTL (30 seconds)"""
        return await self.cache.get_or_set(
            f"position:{position_id}",
            lambda: self._fetch_position(position_id),
            ttl=30,
            cache_name="positions"
        )
```

---

## 4. Operational Runbooks

### 4.1 Daily Operations

```markdown
# runbooks/DAILY-OPS.md

## Daily Operations Checklist

### Morning Check (8:00 AM UTC)

- [ ] Check overnight alerts in PagerDuty
- [ ] Review Grafana dashboards for anomalies
- [ ] Verify all services are healthy (`kubectl get pods -n production`)
- [ ] Check wallet balances
- [ ] Review overnight P&L report
- [ ] Check error rates in logs

### Midday Check (12:00 PM UTC)

- [ ] Check system resource usage
- [ ] Review trading performance metrics
- [ ] Check for any stuck orders
- [ ] Verify backup jobs completed

### Evening Check (6:00 PM UTC)

- [ ] Generate daily trading report
- [ ] Review risk metrics
- [ ] Check tomorrow's scheduled maintenance
- [ ] Handoff notes for on-call

---

## Common Tasks

### Restart a Trading Engine Pod

```bash
# Graceful restart
kubectl rollout restart deployment/trading-engine -n production

# Check rollout status
kubectl rollout status deployment/trading-engine -n production
```

### Scale Up for High Volatility

```bash
# Increase replicas during high volatility
kubectl scale deployment trading-engine --replicas=10 -n production

# Increase resource limits temporarily
kubectl patch deployment trading-engine -n production -p '{"spec":{"template":{"spec":{"containers":[{"name":"trading-engine","resources":{"limits":{"cpu":"4000m","memory":"8Gi"}}}]}}}}'
```

### Clear Circuit Breaker

```bash
# Check status
redis-cli GET trading:circuit_breaker

# Clear after manual review
redis-cli DEL trading:circuit_breaker
redis-cli DEL trading:paused

# Verify trading resumes
curl http://trading-engine:8080/api/v1/status
```
```

### 4.2 Incident Response

```markdown
# runbooks/INCIDENT-RESPONSE.md

## Severity Levels

### SEV 1 - Critical (Trading halted, major loss potential)
- Immediate response required
- Page on-call engineer
- Escalate to leadership within 15 minutes

### SEV 2 - High (Degraded performance, elevated risk)
- Response within 30 minutes
- Slack alert to team
- Monitor closely

### SEV 3 - Medium (Minor issues, workarounds available)
- Response within 2 hours
- Create ticket for tracking

### SEV 4 - Low (Cosmetic issues, documentation updates)
- Response within 1 business day

---

## Incident Response Process

1. **Detect** (Alert fires or manual detection)
2. **Acknowledge** (Claim in PagerDuty)
3. **Assess** (Determine severity and scope)
4. **Mitigate** (Stop the bleeding)
5. **Resolve** (Fix the root cause)
6. **Post-mortem** (Learn and improve)

---

## Communication Templates

### SEV 1 Announcement

```
🚨 SEV 1 INCIDENT - Trading System

Status: Investigating
Impact: Trading paused
Started: {time}

Engineer: {on-call engineer}
Update channel: #incidents

Next update in 15 minutes
```

### All-Clear

```
✅ RESOLVED - {incident title}

Duration: {duration}
Root cause: {brief description}

Post-mortem scheduled: {date/time}
```
```

---

## Appendix A: Tool Reference

### Monitoring & Observability

| Tool | Purpose | Version |
|------|---------|---------|
| Prometheus | Metrics collection | v2.45+ |
| Grafana | Dashboards & visualization | v10.0+ |
| Loki | Log aggregation | v2.9+ |
| Tempo | Distributed tracing | v2.2+ |
| AlertManager | Alert routing | v0.25+ |
| PagerDuty | On-call management | SaaS |

### Infrastructure

| Tool | Purpose | Version |
|------|---------|---------|
| Kubernetes | Container orchestration | v1.28+ |
| Helm | Package management | v3.12+ |
| Terraform | Infrastructure as Code | v1.5+ |
| ArgoCD | GitOps deployment | v2.8+ |
| Docker | Containerization | v24.0+ |

### Data Storage

| Tool | Purpose | Notes |
|------|---------|-------|
| PostgreSQL + TimescaleDB | Trade data, time series | Primary DB |
| Redis | Caching, pub/sub, session store | Cluster mode |
| Kafka | Event streaming | For real-time analytics |
| S3 | Object storage, backups | Cross-region replication |

### Security

| Tool | Purpose |
|------|---------|
| AWS Secrets Manager | Secret storage |
| HashiCorp Vault | Dynamic secrets |
| cert-manager | TLS certificate management |
| Falco | Runtime security |

---

## Appendix B: Architecture Decision Records

### ADR-001: Kubernetes over ECS

**Decision:** Use EKS (Kubernetes) instead of ECS for container orchestration.

**Rationale:**
- Better ecosystem and tooling
- Portable across cloud providers
- More mature autoscaling capabilities
- Better support for complex networking

**Trade-offs:**
- Higher operational complexity
- Steeper learning curve

### ADR-002: TimescaleDB for Time Series

**Decision:** Use TimescaleDB (PostgreSQL extension) instead of InfluxDB.

**Rationale:**
- Single database for relational and time series data
- Familiar SQL interface
- Better integration with existing tools
- Compression reduces storage costs

**Trade-offs:**
- Lower ingestion rate than dedicated TSDB
- Requires careful partitioning

### ADR-003: Redis Cluster for Caching

**Decision:** Use Redis Cluster instead of Memcached.

**Rationale:**
- Persistence options
- Pub/sub capabilities
- Richer data structures
- Better high availability

---

## Appendix C: Network Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        VPC (10.0.0.0/16)                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   Public Subnets                          │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │   │
│  │  │   NAT GW    │  │  ALB/NLB   │  │  Bastion    │      │   │
│  │  │  (HA Pair)  │  │  (Multi-AZ)│  │    Host     │      │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘      │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                    │
│                              ▼                                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  Private Subnets                          │   │
│  │  ┌────────────────────────────────────────────────────┐  │   │
│  │  │              EKS Worker Nodes                       │  │   │
│  │  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐  │  │   │
│  │  │  │ Trading │ │  Risk   │ │  Alert  │ │Monitor- │  │  │   │
│  │  │  │ Engine  │ │ Manager │ │ Service │ │ ing     │  │  │   │
│  │  │  │ (Pods)  │ │  (Pod)  │ │  (Pod)  │ │(Pods)   │  │  │   │
│  │  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘  │  │   │
│  │  └────────────────────────────────────────────────────┘  │   │
│  │                                                           │   │
│  │  ┌─────────────────┐  ┌─────────────────┐                │   │
│  │  │   RDS Primary   │  │   RDS Standby   │                │   │
│  │  │  (Multi-AZ)     │  │  (Different AZ) │                │   │
│  │  └─────────────────┘  └─────────────────┘                │   │
│  │                                                           │   │
│  │  ┌────────────────────────────────────────────────────┐  │   │
│  │  │              ElastiCache Redis Cluster              │  │   │
│  │  │         (Multi-AZ with Auto-Failover)               │  │   │
│  │  └────────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Appendix D: Security Checklist

### Pre-Production

- [ ] All secrets stored in AWS Secrets Manager or Vault
- [ ] Database encryption at rest enabled
- [ ] TLS 1.3 for all external connections
- [ ] mTLS for internal service communication
- [ ] Network policies configured
- [ ] Pod security policies applied
- [ ] Falco runtime security enabled
- [ ] Audit logging configured
- [ ] Penetration testing completed
- [ ] Security review signed off

### Ongoing

- [ ] Weekly dependency vulnerability scans
- [ ] Monthly access reviews
- [ ] Quarterly penetration tests
- [ ] Annual security audit
- [ ] Real-time threat detection

---

*Document version: 1.0*  
*Last reviewed: 2025-01-21*  
*Next review: 2025-04-21*
