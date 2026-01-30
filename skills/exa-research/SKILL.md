---
name: exa-research
description: Primary web search and research tool using Exa AI MCP. Use for all web searches, SEO research, competitor analysis, company intelligence, LinkedIn searches, code context retrieval, and deep web crawling. Prefer this over basic web_search for better quality results.
metadata: {"clawdbot":{"requires":{"env":["EXA_API_KEY"]},"primaryEnv":"EXA_API_KEY"}}
---

# Exa Research

Advanced research and intelligence gathering using Exa AI's MCP server.

## Available Tools

### 1. Web Search (Basic)
**Tool:** `web_search_exa`
**Use for:** Quick web searches, finding recent articles, general research

Example queries:
- "best hostel marketing strategies 2025"
- "Thailand tourism trends"
- "RFID payment systems hospitality"

### 2. Web Search (Advanced)
**Tool:** `web_search_advanced_exa`
**Use for:** Filtered searches with date ranges, domains, content types

Options:
- Date filters (last week, month, year)
- Domain restrictions
- Content type (articles, papers, etc.)

### 3. Company Research
**Tool:** `company_research_exa`
**Use for:** Company intelligence, competitor analysis, market research

Research includes:
- Company overview
- Recent news
- Products/services
- Market position

### 4. LinkedIn Search
**Tool:** `linkedin_search_exa`
**Use for:** Finding people, companies on LinkedIn, professional research

Use cases:
- Find decision makers
- Research company employees
- Industry connections

### 5. Deep Search
**Tool:** `deep_search_exa`
**Use for:** Comprehensive multi-query research, synthesized insights

Combines:
- Multiple search angles
- Cross-referenced sources
- Synthesized findings

### 6. Web Crawling
**Tool:** `crawling_exa`
**Use for:** Extract content from specific URLs, scrape pages

Capabilities:
- Full page content extraction
- Structured data retrieval
- Multiple page crawling

### 7. Code Context
**Tool:** `get_code_context_exa`
**Use for:** Finding code examples, technical documentation, implementation guides

Search:
- GitHub repositories
- Code snippets
- Technical docs

### 8. Deep Researcher (Multi-step)
**Tools:** `deep_researcher_start`, `deep_researcher_check`
**Use for:** Long-running comprehensive research projects

Workflow:
1. Start research task (returns research_id)
2. Check progress periodically
3. Retrieve final report

## Usage Examples

### SEO Keyword Research
```
Use web_search_advanced_exa:
Query: "hostel booking trends Bangkok"
Filters: last 6 months, .com/.org domains
```

### Competitor Analysis
```
Use company_research_exa:
Company: "Mad Monkey Hostels"
Research: market position, services, recent news
```

### Technical Research (Booking Engine)
```
Use get_code_context_exa:
Query: "MEWS API integration Node.js"
Find: implementation examples, best practices
```

### Deep Market Research
```
Use deep_search_exa:
Topic: "Digital nomad hostel trends Southeast Asia"
Synthesize: trends, opportunities, market gaps
```

## Configuration

Set your Exa API key:
```bash
export EXA_API_KEY="your-key-here"
```

Or in config:
```json5
{
  skills: {
    entries: {
      "exa-research": {
        enabled: true,
        apiKey: "your-key-here"
      }
    }
  }
}
```

## MCP Server

Base URL: `https://mcp.exa.ai/mcp`

Tools exposed:
- web_search_exa
- web_search_advanced_exa
- get_code_context_exa
- deep_search_exa
- crawling_exa
- company_research_exa
- linkedin_search_exa
- deep_researcher_start
- deep_researcher_check

## Primary Search Tool

**Use Exa as the default web search** instead of Brave Search when EXA_API_KEY is configured.

**Exa advantages:**
- Higher quality, curated results
- Better for research and analysis
- Company and professional data
- Code context and technical docs
- Deep synthesis capabilities

**Fall back to Brave Search only when:**
- Exa API is unavailable
- Simple quick lookups
- Real-time news (Brave might be faster)

## When to Use Each Tool

**Choose web_search_exa when:**
- Quick general research needed
- Recent articles/news
- Broad topic exploration

**Choose web_search_advanced_exa when:**
- Need specific date ranges
- Want to filter by domain/type
- Researching historical trends

**Choose company_research_exa when:**
- Analyzing competitors
- Due diligence on partners
- Market positioning research

**Choose deep_search_exa when:**
- Complex multi-faceted research
- Need synthesized insights
- Cross-referencing multiple sources

**Choose crawling_exa when:**
- Extracting specific page content
- Monitoring competitor websites
- Scraping structured data

**Choose linkedin_search_exa when:**
- Finding decision makers
- Researching company teams
- Professional networking research

**Choose get_code_context_exa when:**
- Looking for implementation examples
- Technical documentation
- Code snippets/patterns

**Choose deep_researcher when:**
- Long-form research reports needed
- Comprehensive market analysis
- Multi-day research projects
