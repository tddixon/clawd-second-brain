---
name: desearch-ai
description: Decentralized AI-powered web search via Desearch.ai MCP. Alternative search engine for research, fact-checking, and information gathering. Use alongside Exa and Brave for comprehensive web coverage.
metadata: {"clawdbot":{"requires":{"bins":["npx"],"env":["DESEARCH_API_KEY"]},"primaryEnv":"DESEARCH_API_KEY"}}
---

# Desearch AI

Decentralized AI-powered search via Desearch.ai MCP server.

## About Desearch

Desearch is a decentralized search engine that provides:
- Privacy-focused searching
- AI-enhanced results
- Decentralized infrastructure
- Alternative to traditional search engines

## Installation

The MCP server is installed via Smithery CLI:

```bash
npx -y @smithery/cli@latest install @Desearch-ai/desearch --client claude-code
```

Already installed when this skill is present.

## Usage

### Via Skill
When you ask me to search or research, I can use Desearch as an alternative to Exa and Brave.

**Desearch is best for:**
- Privacy-focused searches
- Alternative perspectives
- Fact-checking across sources
- Decentralized data

### Testing/Playground
```bash
npx @smithery/cli@latest playground @Desearch-ai/desearch
```

## Search Strategy

**I use three search engines strategically:**

1. **Exa AI** (primary) - High-quality research, company intel, LinkedIn, code
2. **Desearch** (alternative) - Privacy-focused, decentralized, fact-checking
3. **Brave Search** (fallback) - Quick lookups, real-time news

**When to prefer Desearch:**
- Need privacy-focused results
- Cross-checking information
- Alternative viewpoints
- Decentralized data sources

## Integration

The skill integrates with Claude Code's MCP client. When I need to search via Desearch, I'll use the MCP protocol to call it.

## Commands

The MCP server provides search capabilities accessible through natural language:
- "search desearch for X"
- "use desearch to find Y"
- "cross-check with desearch: Z"

## Configuration

Get your Desearch API key from https://desearch.ai/

Set environment variable:
```bash
export DESEARCH_API_KEY="your-key-here"
```

Or configure in `~/.clawdbot/clawdbot.json`:
```json5
{
  skills: {
    entries: {
      "desearch-ai": {
        enabled: true,
        apiKey: "your-key-here"
      }
    }
  }
}
```

## Notes

- Desearch MCP runs via Smithery CLI
- Requires API key from https://desearch.ai/
- Privacy-focused by design
- Complements Exa and Brave
