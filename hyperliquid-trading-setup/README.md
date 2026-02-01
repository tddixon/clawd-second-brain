# Hyperliquid Paper Trading Setup

Complete infrastructure for running dual strategy paper trading bots on Hyperliquid testnet.

## 🚨 IMPORTANT SAFETY WARNING

**THIS IS FOR TESTNET ONLY - NO REAL MONEY IS AT RISK**

- All configurations use Hyperliquid testnet
- Trade sizes are conservative (25-50 USDC)
- Stop losses are enabled on both strategies
- Monitor positions and P&L closely
- Only use real money on mainnet after thorough testing

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Bot Descriptions](#bot-descriptions)
4. [Configuration](#configuration)
5. [Daily Operations](#daily-operations)
6. [Monitoring & Tracking](#monitoring--tracking)
7. [Troubleshooting](#troubleshooting)
8. [Emergency Procedures](#emergency-procedures)
9. [Next Steps](#next-steps)

---

## Prerequisites

### What You Need to Provide

Before starting, gather the following:

- [ ] **Testnet Wallet Private Key** - Generate a new wallet (never use mainnet keys!)
  - Use MetaMask or similar
  - Export private key
  - **NEVER share or commit to version control**

- [ ] **Test ETH from Faucet** - Get test ETH for gas fees
  - Visit: https://faucet.hyperliquid.xyz/
  - Connect your testnet wallet
  - Request test ETH

- [ ] **Test USDC from Drip** - Get test USDC for trading
  - Visit: https://faucet.hyperliquid.xyz/
  - Request test USDC

- [ ] **Docker Installed** - Docker and Docker Compose
  - The setup script can install Docker if needed

- [ ] **System Permissions** - Ability to run Docker and manage processes

### System Requirements

- Operating System: Linux/Ubuntu (preferred) or macOS/Windows with Docker Desktop
- RAM: 2GB minimum, 4GB recommended
- Disk Space: 10GB free space
- Internet Connection: Stable connection for trading

---

## Quick Start

### 1. Run the Setup Script

```bash
cd /home/desktop/clawd/hyperliquid-trading-setup

# Make script executable
chmod +x setup-hummingbot.sh

# Run setup (installs Docker, pulls images, creates volumes)
./setup-hummingbot.sh
```

**What this does:**
- Checks and installs Docker if needed
- Pulls the latest Hummingbot image
- Creates volume directories for both bots
- Sets up configuration files
- Creates helper scripts

### 2. Configure API Keys

Edit the `.env` files with your credentials:

```bash
# Funding Arbitrage bot
nano hummingbot-funding-arb/.env

# Meme Grid bot
nano hummingbot-meme-grid/.env
```

**Required fields to fill:**

```bash
# In both .env files:
HYPERLIQUID_TESTNET_PRIVATE_KEY="YOUR_PRIVATE_KEY_HERE"
HYPERLIQUID_TESTNET_WALLET_ADDRESS="YOUR_WALLET_ADDRESS"
```

**Save and exit:** `Ctrl+X`, then `Y`, then `Enter`

### 3. Start the Bots

```bash
./start-bots.sh
```

This starts both containers in the background.

### 4. Verify Bots are Running

```bash
./check-status.sh
```

You should see both containers listed and recent logs.

---

## Bot Descriptions

### Bot 1: Funding Arbitrage (`hummingbot-funding-arb`)

**Strategy:** Funding Rate Arbitrage

**How it works:**
- Monitors funding rates on Hyperliquid testnet
- Compares with Binance testnet rates
- Opens positions when funding rate differences exceed 1%
- Captures funding payments (not directional trading)

**Assets Traded:**
- BTC (Bitcoin)
- ETH (Ethereum)

**Risk Profile:** Low (captures funding, not price direction)

**Expected Behavior:**
- Small, consistent profits
- Low volatility exposure
- Frequent small trades

**Configuration File:** `funding_arb_config.yml`

### Bot 2: Meme Grid (`hummingbot-meme-grid`)

**Strategy:** Grid Trading

**How it works:**
- Places buy and sell orders in a grid pattern
- Captures price movements within a range
- Automatically rebalances when price moves
- Profits from volatility (meme coins are volatile!)

**Assets Traded:**
- PEPE
- WIF
- BONK

**Risk Profile:** Medium-High (meme coins are volatile)

**Expected Behavior:**
- More trades in volatile conditions
- Larger swings in P&L
- Higher potential returns (and losses)

**Configuration File:** `meme_grid_config.yml`

---

## Configuration

### Strategy Parameters

Both strategies are configured conservatively for learning:

#### Funding Arbitrage (`funding_arb_config.yml`)

```yaml
# Key parameters (in config file)
min_funding_diff: 0.01          # 1% difference to trigger
trade_size: 50                 # USDC per trade
max_position_per_asset: 100     # Max position size
stop_loss_pct: 0.05            # 5% stop loss
take_profit_pct: 0.03          # 3% take profit
leverage: 1                    # No leverage (safe mode)
```

#### Meme Grid (`meme_grid_config.yml`)

```yaml
# Key parameters (in config file)
grid_levels: 10                # Number of grid orders
price_range: 0.05              # ±5% from current price
allocation_per_asset: 25       # USDC per asset
stop_loss_pct: 0.15            # 15% stop loss (wider for volatility)
take_profit_pct: 0.10          # 10% take profit
leverage: 1                    # No leverage
```

### Adjusting Parameters

**To make it more conservative:**
- Reduce `trade_size` or `allocation_per_asset`
- Increase `stop_loss_pct` (wider stops)
- Decrease `min_funding_diff` or `price_range`
- Reduce `grid_levels`

**To make it more aggressive:**
- Increase `trade_size` or `allocation_per_asset`
- Decrease `stop_loss_pct` (tighter stops)
- Increase `price_range` (wider grids)
- Increase `grid_levels`
- **Never use leverage > 1 until experienced!**

### Changing Assets

**Funding Arbitrage:** Add more assets in `funding_arb_config.yml`:
```yaml
assets:
  - BTC
  - ETH
  - SOL    # Add this
  - DOGE   # Add this
```

**Meme Grid:** Add more assets in `meme_grid_config.yml`:
```yaml
assets:
  - PEPE
  - WIF
  - BONK
  - SHIB    # Add this
  - DOGE    # Add this
```

---

## Daily Operations

### Starting the Bots

```bash
./start-bots.sh
```

### Checking Status

```bash
./check-status.sh
```

This shows:
- Container status (running/stopped)
- Recent log entries
- Any errors

### Viewing Logs

**Recent logs (funding arb):**
```bash
./view-logs.sh funding tail
```

**Follow live logs (meme grid):**
```bash
./view-logs.sh meme follow
```

Press `Ctrl+C` to stop following logs.

### Stopping the Bots

```bash
./stop-bots.sh
```

This stops both containers. Data is preserved in volumes.

### Restarting a Single Bot

```bash
# Stop specific bot
docker stop hummingbot-funding-arb

# Start specific bot
docker start hummingbot-funding-arb

# Or restart
docker restart hummingbot-funding-arb
```

### Attaching to Bot CLI

To interact with a bot's command-line interface:

```bash
# Attach to funding arbitrage bot
docker attach hummingbot-funding-arb

# Attach to meme grid bot
docker attach hummingbot-meme-grid
```

**To detach without stopping:**
Press `Ctrl+P`, then `Ctrl+Q`

**To stop the bot:**
Press `Ctrl+C`

---

## Monitoring & Tracking

### Manual Tracking

Use the provided CSV template: `trading-tracker.csv`

Open in Excel, Google Sheets, or any spreadsheet software.

**Columns:**
- Date/Time
- Strategy (funding or meme)
- Asset/Pair (e.g., BTC-USDT, PEPE-USDC)
- Action (BUY or SELL)
- Entry Price
- Exit Price
- Position Size (USDC)
- P&L (USDC)
- P&L (%)
- Fees (USDC)
- Notes/Learnings

### Automated Daily Reports

Generate daily reports automatically:

```bash
# Run daily report
python3 daily-reporting.py

# Report on last 7 days
python3 daily-reporting.py --days 7

# Update tracker file automatically
python3 daily-reporting.py --update-tracker

# Report on specific bot only
python3 daily-reporting.py --bot funding
```

**What the report includes:**
- Total trades per strategy
- Total P&L
- Win rate
- Largest win/loss
- Average trade size
- Exported CSV files

### Report Files

Reports are saved to:
- `daily-report-YYYY-MM-DD.csv` - Daily summary
- `trades-YYYY-MM-DD.csv` - Detailed trade list
- `trading-tracker.csv` - Main tracker (if auto-updated)

### Key Metrics to Watch

**Daily:**
- Total P&L
- Number of trades
- Win rate

**Weekly:**
- P&L trends
- Strategy performance comparison
- Risk management effectiveness

**Monthly:**
- Overall profitability
- Lessons learned
- Strategy adjustments needed

---

## Troubleshooting

### Common Issues

#### 1. Bot won't start

**Check Docker status:**
```bash
docker ps -a
```

**Check logs:**
```bash
./view-logs.sh funding tail
```

**Common causes:**
- Missing API keys in `.env` file
- Docker not running
- Port conflicts (unlikely with testnet)

#### 2. Connection errors

**Check internet connection:**
```bash
ping api.hyperliquid-testnet.xyz
```

**Verify API endpoint in `.env`:**
```bash
HYPERLIQUID_TESTNET_API_URL="https://api.hyperliquid-testnet.xyz"
```

#### 3. Insufficient balance

**Check testnet balances:**
```bash
# Visit https://faucet.hyperliquid.xyz/
# Get more test ETH and USDC
```

#### 4. Trades not executing

**Check logs for errors:**
```bash
./view-logs.sh funding follow
```

**Verify strategy conditions:**
- Funding arb: Funding rate difference > 1%?
- Meme grid: Price within grid range?

#### 5. Docker permission errors

**Add user to docker group:**
```bash
sudo usermod -aG docker $USER
# Log out and back in
```

### Getting Help

1. Check logs first
2. Review configuration files
3. Check [Hummingbot documentation](https://docs.hummingbot.org/)
4. Review [Hyperliquid testnet docs](https://docs.hyperliquid.xyz/)

---

## Emergency Procedures

### Immediate Bot Shutdown

**Stop both bots immediately:**
```bash
./stop-bots.sh
```

**Force stop if unresponsive:**
```bash
docker kill hummingbot-funding-arb
docker kill hummingbot-meme-grid
```

### Emergency Balance Protection

If you suspect issues:

1. **Stop bots immediately**
2. **Close all positions manually:**
   - Visit Hyperliquid testnet dashboard
   - Close all open positions
   - Cancel all open orders

3. **Review logs for errors:**
   ```bash
   ./view-logs.sh funding tail -100
   ```

4. **Do not restart until issues are identified and resolved**

### Configuration Rollback

If a configuration change caused issues:

1. **Stop bots**
2. **Restore previous config from git or backup**
3. **Restart bots**

### Contact Support

If you encounter serious issues:
- Document the problem (logs, configs, steps taken)
- Contact Hummingbot community or Hyperliquid support

---

## Next Steps

### Week 1: Paper Trading & Learning

- [ ] Run both bots on testnet
- [ ] Monitor daily P&L
- [ ] Learn how the strategies behave
- [ ] Document observations in tracker
- [ ] Adjust parameters if needed

### Week 2: Optimization

- [ ] Analyze which strategy performs better
- [ ] Adjust risk parameters
- [ ] Consider adding new assets
- [ ] Fine-tune grid levels and ranges

### Week 3: Advanced Features

- [ ] Explore additional Hummingbot features
- [ ] Test different order types
- [ ] Implement custom risk rules
- [ ] Consider third-party tools for analysis

### When Ready for Mainnet

**⚠️ DO NOT rush to mainnet!**

Only consider mainnet when:
- [ ] Consistently profitable on testnet for 4+ weeks
- [ ] Understand both strategies deeply
- [ ] Have risk management in place
- [ ] Have emergency procedures documented
- [ ] Are willing to lose real money

**Mainnet recommendations:**
- Start with much smaller trade sizes
- Use tighter stop losses
- Monitor even more closely
- Never use leverage until experienced

---

## File Structure

```
hyperliquid-trading-setup/
├── setup-hummingbot.sh          # Main setup script
├── start-bots.sh                 # Start both bots
├── stop-bots.sh                  # Stop both bots
├── check-status.sh               # Check bot status
├── view-logs.sh                  # View bot logs
├── funding_arb_config.yml        # Funding arbitrage strategy config
├── meme_grid_config.yml          # Meme grid strategy config
├── funding-arb.env               # Funding arb environment variables
├── meme-grid.env                 # Meme grid environment variables
├── trading-tracker.csv           # Manual tracking template
├── daily-reporting.py            # Automated daily reports
├── docker-compose.yml            # Docker orchestration
├── README.md                     # This file
├── hummingbot-funding-arb/       # Data volume (created after setup)
│   ├── conf/                     # Configurations
│   ├── logs/                     # Log files
│   └── data/                     # Trade data
├── hummingbot-meme-grid/         # Data volume (created after setup)
│   ├── conf/
│   ├── logs/
│   └── data/
├── daily-report-YYYY-MM-DD.csv   # Generated daily reports
└── trades-YYYY-MM-DD.csv         # Generated trade lists
```

---

## Additional Resources

- [Hummingbot Documentation](https://docs.hummingbot.org/)
- [Hyperliquid Documentation](https://docs.hyperliquid.xyz/)
- [Hummingbot GitHub](https://github.com/hummingbot/hummingbot)
- [Hyperliquid Testnet Faucet](https://faucet.hyperliquid.xyz/)
- [Hummingbot Community](https://discord.gg/hummingbot)

---

## Support & Questions

If you have questions or encounter issues:

1. Check the troubleshooting section
2. Review logs for error messages
3. Consult the documentation links above
4. Join the Hummingbot Discord community

---

## License

This setup is provided as-is for educational purposes. Use at your own risk.

**Remember: Never invest more than you can afford to lose.**
