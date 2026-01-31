# Hybrid Memory Setup Status

## ✅ Installed

### ClawdHub Skill
- **Skill:** hybrid-memory v1.0.1
- **Location:** `/home/desktop/clawd/skills/hybrid-memory/`

### Scripts
- `graphiti-search.sh` - Search temporal knowledge graph
- `graphiti-log.sh` - Log facts manually
- `graphiti-import-files.py` - Import existing memory files

### Configuration
- **AGENTS.md** updated with hybrid memory instructions
- **docker-compose.yml** downloaded to `~/services/graphiti/`

## ⏳ Pending (Requires Docker)

The Graphiti temporal knowledge graph requires Docker:

```bash
# Start the Graphiti stack
cd ~/services/graphiti
export OPENAI_API_KEY="your-key-here"
docker compose up -d

# Verify it's running
curl http://localhost:8001/healthcheck
```

### Memory Search Embedding Provider

Also need to configure an embedding provider for `memory_search`:

**Option 1: Gemini (Recommended - Free)**
```bash
export GEMINI_API_KEY="your-key-here"
```

Then update `~/.clawdbot/config.json`:
```json
{
  "agents": {
    "defaults": {
      "memorySearch": {
        "enabled": true,
        "provider": "gemini",
        "model": "text-embedding-004"
      }
    }
  }
}
```

**Option 2: OpenAI**
```json
{
  "agents": {
    "defaults": {
      "memorySearch": {
        "enabled": true,
        "provider": "openai",
        "model": "text-embedding-3-small"
      }
    }
  }
}
```

## Next Steps

1. Add user to docker group or run Docker commands with sudo
2. Set OPENAI_API_KEY for Graphiti entity extraction
3. Configure Gemini or OpenAI for memory search embeddings
4. Start Graphiti: `cd ~/services/graphiti && docker compose up -d`
5. Import existing memory: `python3 ~/clawd/scripts/graphiti-import-files.py`

## Usage

Once running, use both systems:

**Temporal questions:**
```bash
~/clawd/scripts/graphiti-search.sh "When did we discuss X?" main-agent 10
```

**Document search:**
```
memory_search query="project goals"
```
