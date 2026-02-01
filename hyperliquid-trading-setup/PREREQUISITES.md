# Hyperliquid Trading Setup - Prerequisites Checklist

## ✅ Complete Before Starting

Use this checklist to ensure you have everything needed to run the paper trading bots.

---

## 1. Wallet & Testnet Funds

### Testnet Wallet Setup

- [ ] **Create a new wallet** (never use mainnet keys!)
  - Use MetaMask, Trust Wallet, or similar
  - Generate a fresh wallet for testnet only
  - Write down the seed phrase and store securely

- [ ] **Export private key**
  - In MetaMask: Account details → Export private key
  - Copy the private key (starts with 0x...)
  - **⚠️ NEVER share this key**
  - **⚠️ NEVER commit to git**

- [ ] **Get wallet address**
  - Copy your testnet wallet address
  - Example: `0x1234567890abcdef...`

### Testnet Faucets

- [ ] **Get test ETH** (for gas fees)
  - Visit: https://faucet.hyperliquid.xyz/
  - Connect your testnet wallet
  - Request test ETH
  - Verify balance in wallet

- [ ] **Get test USDC** (for trading)
  - Visit: https://faucet.hyperliquid.xyz/
  - Request test USDC
  - You'll need ~100-200 USDC for both bots
  - Verify balance in wallet

**Verification:**
- [ ] Test ETH balance > 0.01
- [ ] Test USDC balance > 100

---

## 2. Docker Environment

### Docker Installation

- [ ] **Check if Docker is installed**
  ```bash
  docker --version
  docker-compose --version
  ```

- [ ] **If not installed, the setup script will install it**
  - Run: `./setup-hummingbot.sh`
  - Follow prompts
  - **⚠️ You may need to re-login after installation**

### Docker Permissions

- [ ] **Add user to docker group** (if needed)
  ```bash
  sudo usermod -aG docker $USER
  ```
  - Log out and back in for changes to take effect

- [ ] **Test Docker access**
  ```bash
  docker ps
  ```
  - Should run without sudo errors

**Verification:**
- [ ] Docker runs without sudo
- [ ] Can list containers successfully

---

## 3. System Requirements

### Operating System

- [ ] **Supported OS**
  - Linux (Ubuntu/Debian) ✅ Recommended
  - macOS
  - Windows (with Docker Desktop)

### Hardware

- [ ] **RAM**
  - Minimum: 2GB
  - Recommended: 4GB or more
  - Check with: `free -h` (Linux) or Activity Monitor (macOS)

- [ ] **Disk Space**
  - Minimum: 10GB free
  - Recommended: 20GB+ for logs and data
  - Check with: `df -h`

- [ ] **Internet Connection**
  - Stable connection required
  - Low latency preferred for trading
  - Test with: `ping api.hyperliquid-testnet.xyz`

**Verification:**
- [ ] Sufficient RAM available
- [ ] Sufficient disk space available
- [ ] Stable internet connection

---

## 4. Software & Tools

### Required Software

- [ ] **Git** (for cloning/updating)
  ```bash
  git --version
  ```

- [ ] **Python 3** (for reporting scripts)
  ```bash
  python3 --version
  ```

- [ ] **Curl** (for API calls)
  ```bash
  curl --version
  ```

### Optional but Recommended

- [ ] **Text editor** (nano, vim, VS Code, etc.)
  ```bash
  nano --version
  ```

- [ ] **Spreadsheet software**
  - Excel, Google Sheets, LibreOffice Calc
  - For manual tracking

**Verification:**
- [ ] All required software installed
- [ ] Commands run without errors

---

## 5. Access & Permissions

### File Permissions

- [ ] **Write access to setup directory**
  - Can create files in `/home/desktop/clawd/hyperliquid-trading-setup/`
  - Test with: `touch test.txt`

### Network Access

- [ ] **Outbound internet access**
  - Can reach Hyperliquid testnet API
  - Can reach Docker Hub
  - Test with: `curl https://api.hyperliquid-testnet.xyz`

### Process Management

- [ ] **Can run background processes**
  - Can start/stop Docker containers
  - Can manage running bots

**Verification:**
- [ ] Can create files in setup directory
- [ ] Can reach external APIs
- [ ] Can manage Docker processes

---

## 6. Security & Best Practices

### Security Checklist

- [ ] **Never share private key**
  - Keep it local only
  - Don't paste in public chats/forums
  - Don't commit to git

- [ ] **Never use mainnet funds**
  - This setup is for testnet only
  - Double-check all URLs end in "testnet"

- [ ] **Use strong passwords** (for system access)
  - If using SSH, use key-based auth
  - Keep system updated

### Backup Strategy

- [ ] **Backup configurations**
  - Copy `.env` files to secure location
  - Save custom config changes

- [ ] **Document any custom changes**
  - Note any parameter modifications
  - Track what works and what doesn't

**Verification:**
- [ ] Private key is secured locally only
- [ ] No mainnet connections configured
- [ ] Configuration backups created

---

## 7. Knowledge & Understanding

### Before Starting

- [ ] **Understand you're trading on testnet**
  - No real money is at risk
  - Funds are fake/test tokens

- [ ] **Understand the strategies**
  - Funding Arbitrage: Captures funding rates
  - Grid Trading: Captures volatility
  - Both can lose money (even on testnet)

- [ ] **Understand the risks**
  - Meme coins are volatile
  - Strategies may lose money
  - This is for learning, not profit

### Commitment

- [ ] **Willing to monitor daily**
  - Check bot status
  - Review P&L
  - Adjust if needed

- [ ] **Willing to learn**
  - Read documentation
  - Understand trading concepts
  - Start conservative

**Verification:**
- [ ] Understand testnet nature
- [ ] Understand strategy basics
- [ ] Committed to monitoring and learning

---

## 8. Quick Verification Commands

Run these to verify everything is ready:

```bash
# Check Docker
docker --version
docker ps

# Check Python
python3 --version

# Check internet to Hyperliquid
curl -I https://api.hyperliquid-testnet.xyz

# Check disk space
df -h

# Check RAM
free -h

# Check write permissions
cd /home/desktop/clawd/hyperliquid-trading-setup
touch verification-test.txt
rm verification-test.txt

echo "All checks passed!"
```

---

## 9. Ready to Start?

If you've completed all the above:

✅ You have a testnet wallet with funds
✅ Docker is installed and working
✅ Your system meets requirements
✅ You have necessary software
✅ You understand what you're doing
✅ You're committed to monitoring

**You're ready to run the setup script!**

```bash
cd /home/desktop/clawd/hyperliquid-trading-setup
./setup-hummingbot.sh
```

---

## 10. What If I'm Missing Something?

### Missing Docker?
- Run the setup script - it will install Docker automatically
- Or install manually from https://docs.docker.com/

### Missing Testnet Funds?
- Visit the faucet: https://faucet.hyperliquid.xyz/
- Wait for transaction to confirm
- Check wallet balance

### Missing Permissions?
- Contact your system administrator
- Ensure you have sudo access (or user added to docker group)

### Don't Understand the Strategies?
- Read the README.md thoroughly
- Start with just one bot
- Research funding arbitrage and grid trading
- Ask questions in Hummingbot Discord

---

## Need Help?

If you're unsure about any requirement:

1. Review the README.md
2. Check Hyperliquid documentation
3. Ask in Hummingbot Discord
4. Reach out for assistance

**Remember:** There's no rush! Take your time to understand everything before starting.

---

## Checklist Summary

- [ ] Testnet wallet created
- [ ] Private key secured
- [ ] Test ETH obtained
- [ ] Test USDC obtained
- [ ] Docker installed
- [ ] Docker permissions configured
- [ ] System requirements met
- [ ] Required software installed
- [ ] File access verified
- [ ] Internet connectivity verified
- [ ] Security practices understood
- [ ] Strategies understood
- [ ] Commitment to monitoring confirmed

**Total: 14/14** - Ready to start!

---

*Last updated: 2025-01-15*
