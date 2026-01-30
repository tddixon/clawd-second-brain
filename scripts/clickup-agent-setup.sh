#!/bin/bash
# Clawd ClickUp Agent Setup
# Run this once to configure the agent

set -e

echo "🦎 Clawd ClickUp Agent Setup"
echo "============================"
echo ""

# Check for Node/TypeScript
if ! command -v ts-node &> /dev/null; then
    echo "❌ ts-node not found. Installing..."
    npm install -g ts-node typescript
fi

# Get ClickUp credentials
echo "Step 1: ClickUp API Token"
echo "Get your token from: https://app.clickup.com/settings/apps"
read -p "Enter your ClickUp API token: " API_TOKEN

echo ""
echo "Step 2: Team ID Discovery"

# Create temp script to discover
cat > /tmp/discover-clickup.ts << 'TSEOF'
import { ClickUpAPI } from '/home/desktop/clawd/projects/pkm-system/scripts/clickup-api';

async function discover() {
  const token = process.env.CLICKUP_API_TOKEN!;
  
  // Try to get teams (requires different endpoint)
  const response = await fetch('https://api.clickup.com/api/v2/team', {
    headers: { Authorization: token }
  });
  
  if (!response.ok) {
    console.error('Failed to fetch teams:', await response.text());
    process.exit(1);
  }
  
  const data = await response.json();
  
  console.log('\n📋 Available Teams:');
  for (const team of data.teams) {
    console.log(`  • ${team.name} (ID: ${team.id})`);
  }
}

discover();
TSEOF

export CLICKUP_API_TOKEN="$API_TOKEN"
echo ""
echo "Discovering teams..."

cd /home/desktop/clawd
npx ts-node /tmp/discover-clickup.ts

echo ""
read -p "Enter your Team ID: " TEAM_ID

# Get user IDs
echo ""
echo "Step 3: User Configuration"
echo "You need the user IDs for Clawd and Trevor"
echo ""

# Create script to list users
cat > /tmp/list-users.ts << 'TSEOF'
import { ClickUpAPI } from '/home/desktop/clawd/projects/pkm-system/scripts/clickup-api';

async function listUsers() {
  const token = process.env.CLICKUP_API_TOKEN!;
  const teamId = process.env.CLICKUP_TEAM_ID!;
  
  const response = await fetch(`https://api.clickup.com/api/v2/team/${teamId}`, {
    headers: { Authorization: token }
  });
  
  if (!response.ok) {
    console.error('Failed:', await response.text());
    process.exit(1);
  }
  
  const data = await response.json();
  
  console.log('\n👥 Team Members:');
  for (const member of data.team.members) {
    console.log(`  • ${member.user.username} (ID: ${member.user.id}) - ${member.user.email}`);
  }
}

listUsers();
TSEOF

export CLICKUP_TEAM_ID="$TEAM_ID"
echo ""
echo "Fetching team members..."
npx ts-node /tmp/list-users.ts

echo ""
read -p "Enter Clawd's User ID: " CLAWD_USER_ID
read -p "Enter Trevor's User ID: " TREVOR_USER_ID

# Save configuration
echo ""
echo "Step 4: Saving Configuration"

CONFIG_FILE="$HOME/.clawdsync/clickup-agent-config"
mkdir -p "$(dirname "$CONFIG_FILE")"

cat > "$CONFIG_FILE" << EOF
# Clawd ClickUp Agent Configuration
export CLICKUP_API_TOKEN="$API_TOKEN"
export CLICKUP_TEAM_ID="$TEAM_ID"
export CLAWD_CLICKUP_USER_ID="$CLAWD_USER_ID"
export CLAWD_TREVOR_USER_ID="$TREVOR_USER_ID"
EOF

echo "✅ Configuration saved to: $CONFIG_FILE"
echo ""

# Add to .bashrc
read -p "Add to ~/.bashrc for persistence? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "" >> ~/.bashrc
    echo "# Clawd ClickUp Agent" >> ~/.bashrc
    echo "source $CONFIG_FILE" >> ~/.bashrc
    echo "✅ Added to ~/.bashrc"
fi

# Source for current session
echo ""
echo "Loading configuration..."
source "$CONFIG_FILE"

# Test
echo ""
echo "Step 5: Testing Connection..."
cd /home/desktop/clawd
npx ts-node scripts/clickup-agent.ts --status

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Run agent manually: ./scripts/clickup-agent.sh --run-now"
echo "2. Check status: ./scripts/clickup-agent.sh --status"
echo "3. Add to cron for auto-run: ./scripts/clickup-agent.sh --setup-cron"
echo ""
echo "In ClickUp, assign tasks to 'Clawd' or tag @Clawd in comments"
