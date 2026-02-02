# OpenClaw Sync Project

## Overview
Two-way sync between Obsidian vault and Clawdbot knowledge base.

## Status
🟡 **In Progress** - Server running, authentication configured, troubleshooting local sync

## Components
- **Sync Server**: `/home/desktop/clawd/skills/obsidian-sync/scripts/sync-server.mjs`
- **Storage**: `/home/desktop/openclaw/secondbrain/`
- **Endpoint**: `https://clawd-vps.tail8c6e6b.ts.net:18790`
- **Port**: 18790

## Configuration
- **Remote Path**: `openclaw/secondbrain`
- **Local Path**: `.` (vault root)
- **Authentication**: Gateway Token (same as chat)

## Current Issue
Sync completes successfully but files don't appear in Obsidian vault. May be syncing to a subfolder instead of vault root.

## Files Stored
335 files including:
- `00-Dashboard.md`
- `01-Daily-Notes/`
- `02-Projects/`
- `03-Areas/`
- `04-Tasks/`
- `Resources/`
- `Archives/`

## Started
2026-02-02 18:00 UTC
