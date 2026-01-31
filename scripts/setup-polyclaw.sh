#!/bin/bash
# PolyClaw Setup Script - Run this once to set up autonomous trading

set -e

echo "🦾 Setting up PolyClaw for autonomous trading..."

# 1. Create directories
mkdir -p ~/.openclaw/skills
mkdir -p ~/trading-data/polyclaw
mkdir -p ~/trading-data/logs
mkdir -p ~/trading-data/backups

# 2. Clone PolyClaw
cd ~/.openclaw/skills
if [ ! -d "polyclaw" ]; then
    echo "📦 Downloading PolyClaw..."
    git clone https://github.com/chainstacklabs/polyclaw.git
fi

cd polyclaw

# 3. Install dependencies
echo "📦 Installing dependencies..."
if command -v uv &> /dev/null; then
    uv sync
else
    pip install -r requirements.txt 2>/dev/null || pip install py-clob-client web3 requests python-dotenv
fi

# 4. Create environment file
echo "⚙️ Creating configuration..."
cat > ~/.openclaw/polyclaw.env << 'EOF'
# PolyClaw Configuration
# TRADING_MODE: paper | live
TRADING_MODE=paper

# Risk Limits
MAX_DAILY_LOSS=20
MAX_WEEKLY_LOSS=100
MAX_POSITION_SIZE=100
MIN_PROFIT_PCT=3

# Strategy Settings
MIN_COVERAGE_TIER=2  # 1=T1 (95%+), 2=T2 (90%+), 3=T3 (85%+)
AUTO_EXECUTE_MAX=50  # Auto-execute trades under this amount
ALERT_ABOVE=50       # Require approval above this amount

# Scanning Schedule
SCAN_INTERVAL_MINUTES=60
HEDGE_SCAN_LIMIT=20

# API Keys (TO BE FILLED BY USER)
CHAINSTACK_NODE=https://polygon-mainnet.core.chainstack.com/YOUR_KEY
OPENROUTER_API_KEY=sk-or-v1-YOUR_KEY
POLYCLAW_PRIVATE_KEY=0xYOUR_PRIVATE_KEY

# Optional: Proxy if needed for CLOB orders
# HTTPS_PROXY=http://user:pass@proxy:8080
EOF

echo ""
echo "✅ PolyClaw setup complete!"
echo ""
echo "⚠️  NEXT STEPS:"
echo "1. Edit ~/.openclaw/polyclaw.env with your API keys:"
echo "   - CHAINSTACK_NODE: Get free key at https://console.chainstack.com"
echo "   - OPENROUTER_API_KEY: Get at https://openrouter.ai/settings/keys"
echo "   - POLYCLAW_PRIVATE_KEY: Create new wallet (keep small amounts only)"
echo ""
echo "2. Fund wallet with:"
echo "   - 50 POL (for gas, ~$30)"
echo "   - 500-1000 USDC.e (for trading)"
echo ""
echo "3. Run wallet approval (one-time):"
echo "   cd ~/.openclaw/skills/polyclaw && uv run python scripts/polyclaw.py wallet approve"
echo ""
echo "4. Start paper trading:"
echo "   cd ~/.openclaw/skills/polyclaw && uv run python scripts/polyclaw.py hedge scan --limit 10"
echo ""
