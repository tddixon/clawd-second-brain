# Full Pipeline - Complete SEO Automation

**Trigger:** "full pipeline", "automate SEO for", "complete SEO workflow for"

## What This Does

End-to-end SEO automation from a single URL:
1. **SEO Analysis** - Comprehensive audit (seo-analyze skill)
2. **Keyword Research** - Find opportunities (keyword-research skill)
3. **Content Strategy** - Organize into clusters (content-strategy skill)
4. **Write 3 Articles** - Top-priority content (write-article skill)
5. **Implementation Plan** - Step-by-step next actions

**Input:** URL  
**Output:** Complete folder with analysis, strategy, and ready-to-publish articles

## Process Flow

```
URL Input
    ↓
[Phase 1] SEO Analysis
    ├─ Crawl & audit site/page
    ├─ Analyze technical SEO
    ├─ Discover current keywords
    └─ Identify issues
    ↓
[Phase 2] Keyword Research
    ├─ Generate 20-30 keywords
    ├─ Analyze competition
    ├─ Score & prioritize
    └─ Find quick wins
    ↓
[Phase 3] Content Strategy
    ├─ Cluster keywords by topic
    ├─ Generate 15-20 content ideas
    ├─ Prioritize by SEO value
    └─ Create 3-month calendar
    ↓
[Phase 4] Article Writing
    ├─ Select top 3 priority articles
    ├─ Research each topic
    ├─ Write 1500-2500 words each
    ├─ Humanize all content
    └─ Optimize for SEO
    ↓
[Output] Complete Package
    ├─ SEO analysis report
    ├─ Keyword research document
    ├─ Content strategy plan
    ├─ 3 ready-to-publish articles
    └─ Implementation checklist
```

## Execution Steps

### Phase 1: SEO Analysis (5-7 minutes)
Run seo-analyze skill:
- Fetch and parse the URL
- Conduct technical audit
- Trigger embedded keyword research
- Analyze competitors
- Generate recommendations
- Save to: `pipeline/[domain]-[date]/01-seo-analysis.md`

### Phase 2: Keyword Research (3-5 minutes)
Run keyword-research skill:
- Generate keyword candidates (from analysis)
- Research what's ranking
- Score each keyword
- Identify quick wins vs long-term plays
- Save to: `pipeline/[domain]-[date]/02-keyword-research.md`

**Note:** This may already be included in Phase 1 output. If so, extract and expand.

### Phase 3: Content Strategy (5-7 minutes)
Run content-strategy skill:
- Cluster keywords into topics
- Generate 15-20 content ideas
- Prioritize by SEO value + competition
- Create 3-month calendar
- Select top 3 articles to write
- Save to: `pipeline/[domain]-[date]/03-content-strategy.md`

### Phase 4: Article Creation (15-20 minutes × 3)
For each of the top 3 priority articles:
1. Research topic (top 5 ranking pages)
2. Create outline (better than competitors)
3. Write 1500-2500 words
4. **Humanize** (remove AI patterns)
5. Optimize for SEO
6. Save to: `pipeline/[domain]-[date]/articles/[slug].md`

### Phase 5: Package & Deliver (2 minutes)
Create implementation checklist:
- Summary of findings
- Article titles created
- Next 10 articles to write
- Technical fixes to implement
- Link building opportunities
- Timeline for execution

Save to: `pipeline/[domain]-[date]/00-implementation-checklist.md`

## Output Structure

```
/seo-employee/output/pipeline/[domain]-[date]/
├── 00-implementation-checklist.md
├── 01-seo-analysis.md
├── 02-keyword-research.md
├── 03-content-strategy.md
└── articles/
    ├── article-1-[slug].md
    ├── article-2-[slug].md
    └── article-3-[slug].md
```

## Implementation Checklist Template

```markdown
---
title: "SEO Implementation Plan: [Domain]"
url: [URL]
created: [Date]
articles_created: 3
next_articles: 10
estimated_timeline: 3 months
---

# SEO Implementation Plan: [Domain]

**Analysis Date:** [Date]  
**URL:** [URL]  
**Overall SEO Score:** X/100

## What We Built

✅ **SEO Analysis** - Complete technical audit + recommendations  
✅ **Keyword Research** - 25 keywords analyzed, 15 high-priority targets  
✅ **Content Strategy** - 3-month plan with 18 article ideas  
✅ **3 Articles Created** - Ready to publish immediately

## Immediate Actions (Week 1)

### 1. Publish the 3 Articles
- [ ] Upload `article-1-[slug].md` to CMS
- [ ] Upload `article-2-[slug].md` to CMS
- [ ] Upload `article-3-[slug].md` to CMS
- [ ] Add 3-5 images per article (see image recommendations)
- [ ] Add internal links between articles
- [ ] Submit sitemap to Google Search Console

### 2. Fix Critical Technical Issues
[List from SEO analysis - Phase 1 critical items]
- [ ] Issue 1
- [ ] Issue 2

### 3. Optimize Existing Pages
[List from SEO analysis - Phase 1 high-impact items]
- [ ] Improvement 1
- [ ] Improvement 2

## Short-Term Actions (Weeks 2-4)

### Content Production
Write and publish 3 more articles from the strategy:
- [ ] [Article title 4] - Target: [keyword]
- [ ] [Article title 5] - Target: [keyword]
- [ ] [Article title 6] - Target: [keyword]

### Technical Improvements
- [ ] Implement FAQ schema on all articles
- [ ] Set up Google Analytics events for booking CTAs
- [ ] Improve site speed (if flagged in analysis)

## Medium-Term Actions (Months 2-3)

### Complete Priority Cluster
- [ ] [Article title 7]
- [ ] [Article title 8]
- [ ] [Article title 9]
- [ ] [Article title 10]

### Link Building
- [ ] Internal link audit (link all related articles)
- [ ] Guest post on 2-3 travel blogs
- [ ] Get listed in hostel directories

### Monitor & Adjust
- [ ] Track rankings for target keywords
- [ ] Update top-performing articles
- [ ] Identify new keyword opportunities from search console

## Expected Results

**Month 1:**
- 3 articles indexed
- 500-1000 organic impressions
- 50-100 organic clicks
- Rankings for 5-10 target keywords (top 50)

**Month 2:**
- 6 articles indexed
- 2000-3000 organic impressions
- 200-500 organic clicks
- Rankings for 10-15 keywords (top 20)

**Month 3:**
- 10+ articles indexed
- 5000-7000 organic impressions
- 500-1000 organic clicks
- Rankings for 15-20 keywords (top 10)

## Files Created

1. **SEO Analysis** (`01-seo-analysis.md`)
   - Overall score: X/100
   - Critical issues: X
   - Keyword opportunities: 15+

2. **Keyword Research** (`02-keyword-research.md`)
   - Keywords analyzed: 25
   - High priority: 8
   - Quick wins: 5

3. **Content Strategy** (`03-content-strategy.md`)
   - Topic clusters: 4
   - Content ideas: 18
   - 3-month calendar: ✓

4. **Articles** (`articles/`)
   - Article 1: [Title] (XXXX words) - Target: [keyword]
   - Article 2: [Title] (XXXX words) - Target: [keyword]
   - Article 3: [Title] (XXXX words) - Target: [keyword]

## Next 10 Articles to Write

[Pull from content-strategy Month 1-2 calendar]

1. [Title] - [Keyword] - Priority: High
2. [Title] - [Keyword] - Priority: High
3. [Title] - [Keyword] - Priority: Medium
...

## Questions or Need Help?

- Run `/write-article [topic]` to create more articles from the strategy
- Run `/seo-analyze [url]` to audit another page
- Run `/content-strategy [keywords]` to expand into new topics
- Run `/keyword-research [topic]` to explore additional keyword opportunities

---

**Total Time Investment:**
- Analysis & Planning: ~1 hour (automated)
- Article Creation: ~3 hours (automated + humanization)
- Implementation: ~2 hours (your time to upload + configure)
- **Total: ~6 hours for complete SEO foundation**

**ROI Timeline:** Start seeing traffic in 30-60 days, significant growth by month 3
```

## Special Handling

**For Trevor's Hostels:**
When analyzing hostel URLs, the pipeline automatically:
- Prioritizes location-based keywords (city, neighborhood)
- Includes traveler-type segmentation (solo, nomad, backpacker)
- Suggests hostel feature content (pool, rooftop, social spaces)
- Adds Thailand travel context to articles
- Includes booking CTAs in all content

## Example Usage

```
Full pipeline for https://madmonkeyhostels.com
```

```
Automate SEO for https://competitor-hostel.com (analyze and create content)
```

```
Complete SEO workflow for: https://nomadshostel.com/chiang-mai
```

## Integration

This skill orchestrates all other SEO skills:
- seo-analyze
- keyword-research
- content-strategy
- write-article
- humanizer (via write-article)

All marketing-skills references are used through these integrations.

## Time Expectations

**Total pipeline execution time:** ~45-60 minutes

Breakdown:
- Phase 1 (SEO Analysis): 5-7 min
- Phase 2 (Keyword Research): 3-5 min (may be embedded in Phase 1)
- Phase 3 (Content Strategy): 5-7 min
- Phase 4 (Write 3 Articles): 45-60 min total (15-20 min each)
- Phase 5 (Package): 2 min

**User time required:** ~2 hours to upload articles and implement technical fixes

**Total investment:** ~3 hours from input URL to published content

## Success Criteria

Pipeline is considered successful if it delivers:
- ✅ Actionable SEO analysis with specific fixes
- ✅ 15-20 prioritized keyword targets
- ✅ 3-month content strategy with 15+ ideas
- ✅ 3 publication-ready articles (1500-2500 words each, humanized)
- ✅ Clear implementation checklist
- ✅ Realistic timeline and expectations

## Notes

- All articles go through humanization (non-negotiable)
- Each article is researched against top-ranking competitors
- Output is organized in dated folders for easy reference
- Can run multiple pipelines for different competitors to compare strategies
- Rerun pipeline quarterly to refresh strategy and identify new opportunities

---

**This is the flagship feature** - complete SEO automation from URL to published content.

Run once per quarter per competitor or once per topic area to stay ahead.

---

**Status:** Ready to use. Chains together all other skills for end-to-end automation.
