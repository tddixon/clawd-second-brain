# DataForSEO MCP Setup

DataForSEO MCP server installed globally. Provides SEO data APIs for keyword research, SERP analysis, backlinks, and more.

## Installation

✅ Installed globally via: `npm install -g dataforseo-mcp-server`

## Configuration Required

Set these environment variables:

```bash
export DATAFORSEO_USERNAME=your_username
export DATAFORSEO_PASSWORD=your_password
```

**To get credentials:**
1. Sign up at https://dataforseo.com
2. Get API credentials from dashboard
3. Add to `/home/desktop/.clawdbot/clawdbot.json` env section:

```json
{
  "env": {
    "DATAFORSEO_USERNAME": "your_username",
    "DATAFORSEO_PASSWORD": "your_password"
  }
}
```

## Available APIs

DataForSEO MCP provides:

- **AI_OPTIMIZATION** - Keyword discovery, conversational optimization, LLM benchmarking
- **SERP** - Real-time SERP data (Google, Bing, Yahoo)
- **KEYWORDS_DATA** - Keyword research, search volume, CPC
- **ONPAGE** - Website crawling and on-page SEO metrics
- **DATAFORSEO_LABS** - Keyword/SERP/domain data from DataForSEO databases
- **BACKLINKS** - Backlink analysis, referring domains, link quality
- **BUSINESS_DATA** - Business reviews and information (Google, Trustpilot)
- **DOMAIN_ANALYTICS** - Website traffic, technologies, Whois data
- **CONTENT_ANALYSIS** - Brand monitoring, sentiment analysis, citations

## Cost

DataForSEO uses pay-as-you-go pricing:
- Keyword data: $0.001-0.01 per request
- SERP data: $0.001-0.02 per request
- Very cost-effective for SEO research

Free tier: $1 credit on signup (test before committing)

## Usage in SEO Employee

Once configured, the SEO employee can use DataForSEO for:

1. **Keyword Research** (Phase 3)
   - Search volume data
   - Keyword difficulty scoring
   - Related keywords
   - Question keywords

2. **Competitor Analysis** (Phase 3)
   - SERP positions
   - Competitor rankings
   - Keyword gaps

3. **Site Audit** (Phase 2)
   - Technical SEO data
   - On-page metrics
   - Backlink analysis

## Integration Status

- [ ] API credentials configured
- [ ] Tested basic keyword query
- [ ] Integrated into seo-analyze command
- [ ] Integrated into content-strategy command

## Next Steps

1. Get DataForSEO API credentials
2. Add to Clawdbot config
3. Test with: `npx dataforseo-mcp-server` (requires credentials)
4. Integrate into SEO employee commands
