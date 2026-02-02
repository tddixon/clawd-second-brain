#!/bin/bash
# Start OpenClaw sync with Tailscale exposure

# Kill existing processes
pkill -f "sync-server.mjs" 2>/dev/null
pkill -f "tailscale serve" 2>/dev/null
sleep 1

# Start sync server
export SYNC_TOKEN="44d58250c0f4772f9ebea3caeb7e8f5bb2911272f7259cb0dd05208aaa42dfc3"
export SYNC_WORKSPACE=/home/desktop/clawd
export SYNC_ALLOWED_PATHS=notes,memory,life,areas
export SYNC_PORT=18790
export SYNC_BIND=127.0.0.1

node /home/desktop/clawd/skills/obsidian-sync/scripts/sync-server.mjs &
SYNC_PID=$!

sleep 2

# Expose via Tailscale (HTTPS)
tailscale serve --bg https://localhost:18790

echo "OpenClaw Sync Server started"
echo "Sync Server: http://localhost:18790"
echo "Tailscale URL: https://clawd-vps.tail8c6e6b.ts.net (or check with 'tailscale serve status')"
echo "Token: 44d58250c0f4772f9ebea3caeb7e8f5bb2911272f7259cb0dd05208aaa42dfc3"
