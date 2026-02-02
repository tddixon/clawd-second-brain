# OpenClaw Obsidian Sync Configuration

## Status: ✅ INSTALLED

### 1. Obsidian Plugin
**Location:** `/home/desktop/obsidian-second-brain/.obsidian/plugins/openclaw/`
- main.js ✅
- manifest.json ✅  
- styles.css ✅

**To enable in Obsidian:**
1. Open Obsidian Settings → Community plugins
2. Enable "OpenClaw" plugin
3. Configure settings (see below)

### 2. Clawdbot Sync Skill
**Location:** `/home/desktop/clawd/skills/obsidian-sync/`
- SKILL.md ✅
- scripts/sync-server.mjs ✅

### 3. Sync Token
```
44d58250c0f4772f9ebea3caeb7e8f5bb2911272f7259cb0dd05208aaa42dfc3
```

### 4. Sync Server Status
**Local:** http://localhost:18790 ✅ Running
**Tailscale:** https://clawd-vps.tail8c6e6b.ts.net (pending verification)

### 5. Sync Paths Created
- `/home/desktop/clawd/notes/` - For shared notes
- `/home/desktop/clawd/memory/` - For agent memory

---

## Obsidian Plugin Configuration

Open Obsidian Settings → OpenClaw:

| Setting | Value |
|---------|-------|
| Gateway URL | `https://clawd-vps.tail8c6e6b.ts.net` |
| Gateway Token | `e072fde4da4f16b77f4982d9dd830e39940fee01d59c8668` (from Clawdbot config) |
| Enable sync | ✅ Checked |
| Sync server URL | `https://clawd-vps.tail8c6e6b.ts.net:18790` or `http://127.0.0.1:18790` (local) |

**Sync paths to configure:**
| Remote Path | Local Path |
|-------------|------------|
| `notes` | `OpenClaw/Notes` |
| `memory` | `OpenClaw/Memory` |
| `life/areas` | `OpenClaw/Knowledge` |

---

## Tailscale Security

The sync server is exposed via Tailscale serve:
- Only accessible to devices on your tailnet
- HTTPS encryption end-to-end
- Requires valid sync token for all operations

**Tailscale nodes on your network:**
- clawd-vps (this machine) - 100.111.53.107
- trevors-macbook-pro - 100.110.4.128
- xiaomi-25069ptebg (Android) - offline

---

## Manual Control

**Start sync server:**
```bash
~/clawd/scripts/start-openclaw-sync.sh
```

**Start as systemd service:**
```bash
systemctl --user start openclaw-sync
```

**Check status:**
```bash
systemctl --user status openclaw-sync
tailscale serve status
```

**Test connection:**
```bash
curl -H "Authorization: Bearer 44d58250c0f4772f9ebea3caeb7e8f5bb2911272f7259cb0dd05208aaa42dfc3" \
  http://localhost:18790/sync/status
```

---

## Next Steps

1. **Open Obsidian** and enable the OpenClaw plugin
2. **Configure the plugin** with the settings above
3. **Test connection** - Click "Test Connection" in plugin settings
4. **Create sync folders** in your vault: `OpenClaw/Notes`, `OpenClaw/Memory`
5. **Start syncing!**

---

*Installed: 2026-02-02*
