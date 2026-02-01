# Quick Start Guide - Hyperliquid Paper Trading

Get your paper trading bots running in 10 minutes!

---

## 🎯 You're Here Because...

You want to run two automated trading bots on Hyperliquid testnet:
1. **Funding Arbitrage Bot** - Captures funding rate differences
2. **Meme Grid Bot** - Grid trades volatile meme coins

Both bots use TESTNET tokens only - no real money at risk!

---

## ⏱️ 10-Minute Setup

### Step 1: Get Testnet Wallet & Funds (3 minutes)

**Create a testnet wallet:**
1. Open MetaMask (or similar)
2. Create a NEW wallet (never use mainnet keys!)
3. Write down the seed phrase

**Get test tokens:**
1. Visit: https://faucet.hyperliquid.xyz/
2. Connect your testnet wallet
3. Request test ETH (for gas)
4. Request test USDC (for trading)
5. Wait for confirmation

**Export your private key:**
1. In MetaMask: Account details → Export private key
2. Copy the key (starts with 0x...)
3. **Keep it secret - never share!**

---

### Step 2: Run Setup Script (2 minutes)

```bash
# Navigate to setup directory
cd /home/desktop/clawd/hyperliquid-trading-setup

# Make script executable (first time only)
chmod +x setup-hummingbot.sh

# Run setup
./setup-hummingbot.sh
```

**What this does:**
- Checks/installs Docker
- Pulls Hummingbot image
- Creates bot volumes
- Generates helper scripts

---

### Step 3: Configure API Keys (2 minutes)

Edit both `.env` files with your credentials:

```bash
# Edit funding arbitrage config
nano hummingbot-funding-arb/.env
```

Replace these lines:
```bash
HYPERLIQUID_TESTNET_PRIVATE_KEY="YOUR_TESTNET_PRIVATE_KEY_HERE"
HYPERLIQUID_TESTNET_WALLET_ADDRESS="YOUR_TESTNET_WALLET_ADDRESS"
```

With your actual values:
```bash
HYPERLIQUID_TESTNET_PRIVATE_KEY="0x1234567890abcdef..."
HYPERLIQUID_TESTNET_WALLET_ADDRESS="0x1234567890abcdef..."
```

**Save and exit:** `Ctrl+X`, then `Y`, then `Enter`

Repeat for meme grid:
```bash
nano hummingbot-meme-grid/.env
```

Paste the same values and save.

---

### Step 4: Start the Bots (30 seconds)

```bash
./start-bots.sh
```

You should see:
```
Starting Hummingbot containers...
Creating hummingbot-funding-arb... done
Creating hummingbot-meme-grid... done
```

---

### Step 5: Verify Bots are Running (30 seconds)

```bash
./check-status.sh
```

You should see:
```
========================================
Hummingbot Status
========================================

Funding Arb Bot:
abc123  hummingbot-funding-arb  Up 2 minutes

Meme Grid Bot:
def456  hummingbot-meme-grid  Up 2 minutes

Recent Logs - Funding Arb:
2025-01-15 10:00:00 Starting Hummingbot...
```

If both containers show "Up X minutes" - you're done! 🎉

---

## 📊 Monitor Your Bots

### Check Status Anytime
```bash
./check-status.sh
```

### View Logs
```bash
# Recent logs (funding arb)
./view-logs.sh funding tail

# Live logs (meme grid)
./view-logs.sh meme follow
```

Press `Ctrl+C` to stop following logs.

### Stop Bots
```bash
./stop-bots.sh
```

---

## 📝 Track Your Performance

### Option 1: Manual Tracking
Open `trading-tracker.csv` in Excel or Google Sheets.

Fill in:
- Date/Time
- Strategy (funding or meme)
- Asset (BTC, PEPE, etc.)
- Entry/Exit prices
- P&L

### Option 2: Automated Reports
```bash
# Generate daily report
python3 daily-reporting.py
```

This creates:
- `daily-report-YYYY-MM-DD.csv` - Daily summary
- `trades-YYYY-MM-DD.csv` - Detailed trades

---

## 🎓 What to Expect

### Funding Arbitrage Bot
- **Behavior:** Monitors funding rates, opens positions when differences > 1%
- **Assets:** BTC, ETH
- **Trade Size:** 50 USDC per trade
- **Frequency:** Moderate (depends on funding rates)
- **Risk:** Low (captures funding, not direction)

### Meme Grid Bot
- **Behavior:** Places buy/sell orders in a grid, captures volatility
- **Assets:** PEPE, WIF, BONK
- **Trade Size:** 25 USDC per asset
- **Frequency:** High in volatile conditions
- **Risk:** Medium-High (meme coins are volatile!)

---

## ⚠️ Important Reminders

1. **This is TESTNET** - No real money at risk
2. **Monitor daily** - Check status and P&L
3. **Start conservative** - Don't increase sizes yet
4. **Learn first** - Understand how strategies behave
5. **Keep learning** - Read logs, analyze trades

---

## 🆘 Troubleshooting

### Bots won't start?
```bash
# Check Docker
docker ps -a

# Check logs
./view-logs.sh funding tail
```

### Connection errors?
- Check internet connection
- Verify API URL: `https://api.hyperliquid-testnet.xyz`
- Ensure wallet has test ETH and USDC

### Need more test tokens?
- Visit: https://faucet.hyperliquid.xyz/
- Request more test ETH and USDC

---

## 📚 Learn More

### Full Documentation
- **Complete Guide:** `README.md`
- **Prerequisites:** `PREREQUISITES.md`
- **Config Files:** `funding_arb_config.yml`, `meme_grid_config.yml`

### External Resources
- [Hummingbot Docs](https://docs.hummingbot.org/)
- [Hyperliquid Docs](https://docs.hyperliquid.xyz/)
- [Hummingbot Discord](https://discord.gg/hummingbot)

---

## 🎉 You're Trading!

Your bots are now running on Hyperliquid testnet. They will:
- Automatically find trading opportunities
- Execute trades according to your configs
- Log all activity

**What to do now:**
1. Check status daily: `./check-status.sh`
2. Review logs: `./view-logs.sh funding tail`
3. Track trades in spreadsheet
4. Learn from the data
5. Adjust configs as you learn

---

## 📅 First Week Checklist

**Day 1:**
- [ ] Complete setup
- [ ] Verify both bots running
- [ ] Check logs for any errors

**Day 2-7:**
- [ ] Check bot status daily
- [ ] Review trades in tracker
- [ ] Note any patterns
- [ ] Read documentation
- [ ] Generate daily reports

**Week 1 Review:**
- [ ] Which strategy performed better?
- [ ] What did you learn?
- [ ] Any adjustments needed?

---

## 🚀 Ready to Optimize?

After running for a week, you can:
- Adjust trade sizes
- Add new assets
- Fine-tune parameters
- Test different strategies

**Always make small changes and monitor closely!**

---

## 🤝 Need Help?

1. Check `README.md` troubleshooting section
2. Review logs for error messages
3. Ask in [Hummingbot Discord](https://discord.gg/hummingbot)
4. Refer to documentation links above

---

**Happy Trading! 📈**

Remember: Paper trade first, learn lots, then consider real trading.
