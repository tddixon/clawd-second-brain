# Keyword Research - AI-Powered Keyword Discovery & Recommendations

**Trigger:** When user says "keyword research", "find keywords", "research keywords for", or provides URL/topic for keyword analysis

## What This Does

Takes a URL or topic and:
1. **Discovers keywords** - Generates 20-30 relevant keyword ideas
2. **Analyzes competition** - Researches what's ranking for each keyword
3. **Scores & prioritizes** - Recommends which keywords to target based on:
   - Search volume potential
   - Competition level
   - Relevance to your business
   - Content gap opportunities
4. **Outputs organized list** - Easy-to-scan recommendations with reasoning

## Usage

User provides either:
- **URL:** "Do keyword research for https://example.com"
- **Topic:** "Keyword research for Bangkok hostels"
- **Business context:** "Find keywords for my Thailand hostel chain"

## Process

### Phase 1: Discovery
1. **If URL provided:**
   - Scrape the page content
   - Extract main topics and themes
   - Identify existing keywords being targeted
   - Check competitor pages ranking for similar content

2. **If topic provided:**
   - Generate seed keyword list
   - Expand with related terms, questions, comparisons
   - Include long-tail variations
   - Consider search intent (informational, commercial, transactional)

### Phase 2: Research
For each keyword candidate:
- Search Google to see what's ranking (use web search)
- Analyze top 3-5 results
- Note content type (blog, product page, guide, etc.)
- Assess difficulty (who's ranking - big brands vs small sites)
- Identify content gaps (what's missing from current results)

### Phase 3: Analysis & Scoring

Score each keyword on:
- **Relevance** (0-10) - How well it matches user's business/topic
- **Opportunity** (0-10) - How beatable the competition is
- **Value** (0-10) - Likely traffic + conversion potential

**Competition indicators:**
- Low: Small blogs, niche sites, thin content
- Medium: Established blogs, some authority sites
- High: Major brands, Wikipedia, government sites, very comprehensive content

### Phase 4: Recommendations

Output organized as:

```markdown
# Keyword Research: [Topic/Domain]

## Executive Summary
- Total keywords analyzed: XX
- High-priority targets: XX
- Quick wins: XX
- Long-term plays: XX

## Top 10 Priority Keywords

### 1. [Keyword]
**Search Intent:** [Informational/Commercial/Transactional]
**Competition:** [Low/Medium/High]
**Content Type:** [What's ranking]
**Recommendation:** Target this immediately - [specific reasoning]
**Content Angle:** [Suggested approach]

### 2. [Next keyword...]
...

## Quick Wins (Low Competition, Good Relevance)
- keyword 1 - why it's a quick win
- keyword 2 - why it's a quick win

## Long-Tail Opportunities
- specific question keywords
- "near me" / location variants
- comparison keywords

## Content Gaps
Things competitors aren't covering well that you could own:
- Gap 1
- Gap 2

## Avoid These (Too Competitive Right Now)
- keyword - why to skip
- keyword - why to skip

## Implementation Plan
1. Month 1: Target [these 3-5 keywords]
2. Month 2-3: Build out [these topics]
3. Long-term: Work toward [competitive keywords]
```

## Integration with Marketing Skills

Use these references:
- `marketing-skills/references/seo-audit/SKILL.md` - SEO analysis framework
- `marketing-skills/references/programmatic-seo/SKILL.md` - Keyword clustering
- `workflows/seo-research-planning-workflow.md` - Research methodology

## Special Handling for Trevor's Hostels

When keywords relate to hostels/Thailand/accommodation:
- Include location variants (Bangkok, Chiang Mai, Phuket, etc.)
- Consider backpacker/digital nomad search terms
- Add hostel-specific features (dorms, private rooms, social spaces)
- Include travel planning keywords (visa, transport, budget)

## Output

Save to: `/home/desktop/clawd/seo-employee/output/keyword-research/[slug]-[date].md`

Always include:
- Frontmatter with metadata
- Executive summary for quick scanning
- Detailed analysis for each keyword
- Actionable next steps

## Example Prompts

"Do keyword research for https://madmonkeyhostels.com"
"Find keywords for a Bangkok hostel"
"Keyword research: Thailand backpacker hostels"
"What keywords should I target for my Chiang Mai accommodation business?"

## Notes

- Use web_search to analyze what's actually ranking
- Don't guess at search volume - indicate it's estimated/qualitative
- Focus on actionable recommendations, not data dumps
- Prioritize keywords the user can actually rank for
- Consider user's authority level (new site vs established)
- Include content format recommendations (blog, guide, comparison page, etc.)

---

**This is a standalone skill** - doesn't require the full SEO Employee implementation. Ready to use immediately.
