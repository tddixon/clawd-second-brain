# PolyClaw Autonomous Trading System

## Quick Start

### 1. Setup (One-time, ~15 minutes)

```bash
# Run setup script
cd /home/desktop/clawd
chmod +x scripts/setup-polyclaw.sh
./scripts/setup-polyclaw.sh

# Edit configuration
nano ~/.openclaw/polyclaw.env
```

### 2. Get API Keys

**Chainstack (RPC Node)**
- Go to: https://console.chainstack.com
- Sign up with GitHub/Google
- Create free Polygon node
- Copy HTTPS endpoint

**OpenRouter (LLM for hedge analysis)**
- Go to: https://openrouter.ai/settings/keys
- Create API key
- Costs ~$0.01-0.05 per hedge scan

**Wallet (Create new - keep small amounts)**
```bash
# Generate new wallet
python3 -c "from web3 import Web3; w3 = Web3(); acc = w3.eth.account.create(); print(f'Address: {acc.address}'); print(f'Private Key: {acc.key.hex()}')"
```

### 3. Fund Wallet

Send to your new wallet:
- **50 POL** (~$30) for gas fees
- **500-1000 USDC.e** for trading

Get USDC.e on Polygon:
- Bridge from Ethereum: https://portal.polygon.technology/bridge
- Or buy directly on exchange and withdraw to Polygon

### 4. One-Time Approval

```bash
cd ~/.openclaw/skills/polyclaw
source ~/.openclaw/polyclaw.env
uv run python scripts/polyclaw.py wallet approve
```

This costs ~0.01 POL in gas (one-time setup).

### 5. Start Paper Trading

```bash
# Edit config to paper mode
sed -i 's/TRADING_MODE=live/TRADING_MODE=paper/' ~/.openclaw/polyclaw.env

# Start the autonomous agent
python3 /home/desktop/clawd/scripts/polyclaw-agent.py
```

## Configuration Options

Edit `~/.openclaw/polyclaw.env`:

```bash
# Trading Mode
TRADING_MODE=paper  # or 'live'

# Risk Limits (in USD)
MAX_DAILY_LOSS=20
MAX_WEEKLY_LOSS=100
MAX_POSITION_SIZE=100

# Strategy
MIN_PROFIT_PCT=3        # Minimum 3% expected profit
MIN_COVERAGE_TIER=2     # T2 = 90%+ coverage
AUTO_EXECUTE_MAX=50     # Auto-trade under $50
ALERT_ABOVE=50          # Need approval above $50

# Scanning
SCAN_INTERVAL_MINUTES=60
HEDGE_SCAN_LIMIT=20
```

## What the Agent Does

1. **Every hour**: Scans Polymarket for hedge opportunities
2. **Filters**: Only T1/T2 coverage (90%+), min 3% profit
3. **Auto-executes**: Trades under $50 within risk limits
4. **Alerts**: Requests approval for trades above $50
5. **Reports**: Daily P&L summary at 9 PM
6. **Stops**: Automatically if daily loss >$20 or weekly >$100

## Monitoring

```bash
# View live logs
tail -f ~/trading-data/logs/polyclaw-agent.log

# View paper trades
cat ~/trading-data/paper-trades.jsonl

# Check positions (manual)
cd ~/.openclaw/skills/polyclaw
uv run python scripts/polyclaw.py positions
```

## Going Live

After 7 days of profitable paper trading:

1. Edit config: `TRADING_MODE=live`
2. Reduce position sizes initially: `MAX_POSITION_SIZE=25`
3. Start with: `AUTO_EXECUTE_MAX=25`
4. Monitor closely for first week

## Emergency Stop

```bash
# Kill the agent
pkill -f polyclaw-agent.py

# Or pause trading (keeps monitoring)
echo 'MAX_DAILY_LOSS=0' >> ~/.openclaw/polyclaw.env
```

## Expected Returns

**Paper Trading Phase:**
- Learn system, validate strategies
- Zero risk

**Live Trading (Conservative):**
- Target: $100-200/week
- Capital: $500-1000
- Risk: Max $20/day loss

**Scaled Up:**
- With $5000 capital: $500-1000/week potential
- Still capped at same daily risk limits

## Support

- PolyClaw docs: https://github.com/chainstacklabs/polyclaw
- Polymarket help: https://help.polymarket.com
- Logs: `~/trading-data/logs/`
