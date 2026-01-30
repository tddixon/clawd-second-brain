# SEO Analyze - Comprehensive Site Audit + Keyword Opportunities

**Trigger:** "SEO analyze", "audit", "seo audit for [URL]"

## What This Does

Full SEO analysis of a URL or domain:
1. **Technical SEO audit** - Crawl and analyze the page/site
2. **Content analysis** - Evaluate content quality and structure
3. **Keyword discovery** - Find current keywords + opportunities (uses keyword-research skill)
4. **Competitor intelligence** - What's ranking for your target keywords
5. **Actionable recommendations** - Prioritized list of what to fix/improve

## Process

### Phase 1: Crawl & Extract
1. Fetch the URL with web_fetch
2. Extract:
   - Page title, meta description
   - H1, H2, H3 headings
   - Content structure
   - Internal/external links (sampled)
   - Images (check alt tags)
   - Word count
   - Core topics/themes

### Phase 2: Technical Audit
Analyze:
- **Title tag:** Length, keyword placement, uniqueness
- **Meta description:** Length, call-to-action, keyword usage
- **Heading structure:** H1 presence/uniqueness, H2-H6 hierarchy
- **Content quality:** Length, readability, topic coverage
- **Images:** Alt text usage, quantity
- **Links:** Internal linking, external authority links

### Phase 3: Keyword Research
Run keyword-research skill on the URL to identify:
- Current keywords being targeted
- Keyword opportunities being missed
- Competition analysis
- 15-20 keyword recommendations

### Phase 4: Competitor Analysis
For top 3-5 keyword opportunities:
- Search for each keyword
- Analyze what's ranking
- Identify content gaps
- Find angles to compete

### Phase 5: Recommendations
Output prioritized action items:
1. **Critical issues** (must fix immediately)
2. **High-impact improvements** (do this month)
3. **Content opportunities** (keywords to target)
4. **Long-term strategy** (6+ month plays)

## Output Format

```markdown
---
title: "SEO Analysis: [Domain]"
url: [URL]
analyzed: [Date]
overall_score: [0-100]
---

# SEO Analysis: [Domain/Page]

**Analysis Date:** [Date]  
**URL:** [URL]  
**Overall SEO Score:** X/100

## Executive Summary
- **Strengths:** [2-3 key strengths]
- **Critical Issues:** [Must-fix items]
- **Top Opportunities:** [Biggest wins available]
- **Recommended Keywords:** [Number] high-potential keywords identified

---

## Technical SEO Audit

### Page Structure
**Title Tag:** [Title]  
- Length: X characters [✓ Good / ✗ Too long/short]
- Keyword usage: [Analysis]
- Recommendation: [Specific suggestion]

**Meta Description:** [Description]  
- Length: X characters [✓/✗]
- CTA present: [Yes/No]
- Recommendation: [Specific suggestion]

**Headings:**
- H1: [Count] - [Content]
- H2: [Count]  
- H3-H6: [Count]
- Issues: [Any problems with hierarchy]
- Recommendation: [How to improve]

### Content Analysis
- **Word count:** X words [✓/✗ for target keyword]
- **Readability:** [Assessment]
- **Topic coverage:** [Comprehensive / Surface-level / Missing key points]
- **Content type:** [Blog post / Product page / Guide / etc.]
- **Recommendation:** [Content improvements]

### Images & Media
- **Image count:** X
- **Alt text usage:** X/X images have alt text
- **Issues:** [Missing alts, generic descriptions]
- **Recommendation:** [Specific improvements]

### Internal Linking
- **Internal links:** ~X links
- **External links:** ~X links
- **Authority sources:** [Yes/No - domains linked to]
- **Recommendation:** [Linking strategy]

---

## Keyword Analysis

### Currently Targeting
These keywords appear to be the current focus:
1. [Keyword] - [How it's being targeted]
2. [Keyword] - [How it's being targeted]

### Keyword Opportunities (Top 15-20)
[Include output from keyword-research skill]

See detailed keyword research in: `/keyword-research/[slug]-[date].md`

---

## Competitor Intelligence

### Top Competitors for Target Keywords

**Keyword: [Primary keyword]**
1. [Domain] - [What makes it rank]
2. [Domain] - [What makes it rank]
3. [Domain] - [What makes it rank]

**Content Gap:** [What these pages do that yours doesn't]

---

## Action Items

### 🔴 Critical (Fix Immediately)
1. [Issue] - [Why critical] - [How to fix]
2. [Issue] - [Why critical] - [How to fix]

### 🟡 High Impact (This Month)
1. [Improvement] - [Expected impact] - [How to implement]
2. [Improvement] - [Expected impact] - [How to implement]

### 🟢 Content Opportunities (Next 3 Months)
1. Target keyword: [Keyword] - [Content angle] - [Priority]
2. Target keyword: [Keyword] - [Content angle] - [Priority]

### 🔵 Long-term Strategy (6+ Months)
1. [Strategic initiative]
2. [Strategic initiative]

---

## SEO Score Breakdown

- **Technical SEO:** X/30
  - Title & meta: X/10
  - Headings: X/5
  - Content structure: X/10
  - Images: X/5

- **Content Quality:** X/40
  - Comprehensiveness: X/15
  - Readability: X/10
  - Keyword optimization: X/15

- **Opportunity:** X/30
  - Keyword potential: X/15
  - Content gaps: X/10
  - Competition level: X/5

**Total: X/100**

---

## Next Steps

1. **Week 1:** Fix critical issues
2. **Week 2-4:** Implement high-impact improvements
3. **Month 2+:** Start targeting keyword opportunities with new content
4. **Ongoing:** Monitor rankings, adjust strategy

---

**Need help implementing?**
- Run `/content-strategy` with these keywords to get article ideas
- Use `/write-article [topic]` to create optimized content
- Or run `/full-pipeline [url]` for complete automation
```

## Integration

This skill:
- **Uses** keyword-research skill for keyword analysis
- **References** marketing-skills/references/seo-audit/ for audit framework
- **Outputs to** `/seo-employee/output/seo-analysis/`
- **Links to** content-strategy and write-article skills for implementation

## Special Handling

**For Trevor's Hostels:**
- Flag missing location keywords (city, neighborhood)
- Check for hostel-specific features in content
- Verify booking CTAs are present
- Assess trust signals (reviews, safety info)

## Example Usage

```
SEO analyze https://madmonkeyhostels.com
```

```
Audit this page for SEO: https://competitor.com/blog/bangkok-guide
```

```
Do a full SEO analysis of https://nomadshostel.com/chiang-mai
```

---

**Status:** Ready to use. Automatically triggers keyword-research for comprehensive analysis.
