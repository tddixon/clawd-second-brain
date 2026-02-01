---
name: qmd
description: Local hybrid search for markdown notes and docs. Use when searching notes, finding related content, or retrieving documents from indexed collections.
homepage: https://github.com/tobi/qmd
metadata: {"clawdbot":{"emoji":"🔍","os":["darwin","linux"],"requires":{"bins":["qmd"]},"install":[{"id":"bun-qmd","kind":"shell","command":"bun install -g https://github.com/tobi/qmd","bins":["qmd"],"label":"Install qmd via Bun"}]}}
---

# qmd - Quick Markdown Search

Local search engine for Markdown notes, docs, and knowledge bases. Index once, search fast.

## When to use (trigger phrases)

- "search my notes / docs / knowledge base"
- "find related notes"
- "retrieve a markdown document from my collection"
- "search local markdown files"

## Default behavior (important)

- Prefer `qmd search` (BM25). It's typically instant and should be the default.
- Use `qmd vsearch` only when keyword search fails and you need semantic similarity (can be very slow on a cold start).
- Avoid `qmd query` unless the user explicitly wants the highest quality hybrid results and can tolerate long runtimes/timeouts.

## Prerequisites

- Bun >= 1.0.0
- macOS: `brew install sqlite` (SQLite extensions)
- Ensure PATH includes: `$HOME/.bun/bin`

## Install

`bun install -g https://github.com/tobi/qmd`

## Setup

```bash
qmd collection add /path/to/notes --name notes --mask "**/*.md"
qmd context add qmd://notes "Description of this collection"  # optional
qmd embed  # one-time to enable vector + hybrid search
```

## Search modes

- `qmd search` (default): fast keyword match (BM25)
- `qmd vsearch` (last resort): semantic similarity (vector)
- `qmd query` (generally skip): hybrid search + LLM reranking

## Common commands

```bash
qmd search "query"             # default
qmd vsearch "query"
qmd query "query"
qmd search "query" -c notes     # Search specific collection
qmd search "query" -n 10        # More results
qmd search "query" --json       # JSON output
qmd search "query" --all --files --min-score 0.3
```

## Retrieve

```bash
qmd get "path/to/file.md"       # Full document
qmd get "#docid"                # By ID from search results
qmd multi-get "journals/2025-05*.md"
```

## Maintenance

```bash
qmd status                      # Index health
qmd update                      # Re-index changed files
qmd embed                       # Update embeddings
```
