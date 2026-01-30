# SEO Research & Planning Workflow 2026
## Complete Guide to Rank #1 on Google & AI/LLM Search

**Version:** 1.0  
**Last Updated:** January 26, 2026  
**Purpose:** Input a domain and target demographic → Output actionable SEO strategy with keywords, content plan, and headlines  
**Target:** Google traditional search + AI/LLM search (ChatGPT, Perplexity, Claude, Gemini)

---

## Table of Contents

1. [Executive Overview](#executive-overview)
2. [Workflow Architecture](#workflow-architecture)
3. [Input Parameters](#input-parameters)
4. [Phase 1: Foundation & Audit](#phase-1-foundation--audit)
5. [Phase 2: Keyword Research & Strategy](#phase-2-keyword-research--strategy)
6. [Phase 3: Competitor Analysis](#phase-3-competitor-analysis)
7. [Phase 4: Content Planning](#phase-4-content-planning)
8. [Phase 5: Implementation Roadmap](#phase-5-implementation-roadmap)
9. [2026 SEO Best Practices](#2026-seo-best-practices)
10. [AI/LLM Search Optimization](#aillm-search-optimization)
11. [Tools & MCPs](#tools--mcps)
12. [Output Templates](#output-templates)
13. [Cost Analysis](#cost-analysis)
14. [Marketing Skills Integration](#marketing-skills-integration)

---

## Executive Overview

This workflow transforms domain + demographic inputs into a comprehensive SEO action plan optimized for both traditional Google search and emerging AI/LLM search engines (ChatGPT, Perplexity, etc.).

### Key Differentiators for 2026
- **Dual optimization:** Google + AI search engines
- **E-E-A-T focused:** Experience, Expertise, Authoritativeness, Trustworthiness
- **Cost-effective:** Prioritizes free/freemium tools
- **Actionable:** Ready-to-execute content briefs and headlines
- **Agent-ready:** Structured for automation

### Workflow Duration
- **Quick audit:** 30-60 minutes
- **Full strategy:** 4-6 hours
- **Automated (agent):** 20-30 minutes

---

## Workflow Architecture

```
INPUT
├─ Domain (e.g., nomads.com)
├─ Target Demographic (e.g., digital nomads 25-40, Thailand)
└─ Business Goals (e.g., bookings, brand awareness)
    │
    ▼
PHASE 1: FOUNDATION & AUDIT
├─ Technical SEO Audit
├─ Current Rankings Analysis
├─ Site Health Check
└─ E-E-A-T Assessment
    │
    ▼
PHASE 2: KEYWORD RESEARCH
├─ Seed Keyword Generation
├─ Search Volume Analysis
├─ Keyword Difficulty Scoring
├─ Search Intent Mapping
└─ Long-tail Opportunities
    │
    ▼
PHASE 3: COMPETITOR ANALYSIS
├─ Top 10 Competitor Identification
├─ Gap Analysis (keywords they rank for, you don't)
├─ Content Gap Analysis
├─ Backlink Analysis
└─ SERP Feature Analysis
    │
    ▼
PHASE 4: CONTENT PLANNING
├─ Content Topic Clusters
├─ Programmatic SEO Opportunities
├─ Headline Generation
├─ Content Briefs (structure, word count, H2s)
└─ Internal Linking Strategy
    │
    ▼
PHASE 5: IMPLEMENTATION ROADMAP
├─ Priority Matrix (impact vs. effort)
├─ 90-Day Action Plan
├─ Content Calendar
├─ Technical Fixes Checklist
└─ Success Metrics & KPIs
    │
    ▼
OUTPUT
├─ SEO Strategy Document
├─ Keyword Target List (200-500 keywords)
├─ Content Calendar (30+ topics)
├─ Implementation Roadmap
└─ Performance Dashboard Template
```

---

## Input Parameters

### Required Inputs

```yaml
domain: nomads.com
target_demographic:
  age_range: "25-40"
  profession: "digital nomads, remote workers"
  location: "Thailand, Southeast Asia"
  psychographics: "adventurous, budget-conscious, community-oriented"
  
business_model:
  type: "hostel chain"
  primary_goal: "increase bookings"
  secondary_goals: ["brand awareness", "community building"]
  
current_state:
  monthly_traffic: 50000  # if known
  domain_authority: 35    # if known
  top_keywords: ["bangkok hostel", "chiang mai backpacker"]  # if known
  main_competitors: ["Slumber Party", "Mad Monkey", "Bodega"]  # if known
```

### Optional Context

```yaml
existing_content:
  blog_posts: 50
  location_pages: 10
  
team_resources:
  content_writers: 2
  developers: 1
  budget_monthly: "$500"
  
technical_stack:
  cms: "WordPress / Custom"
  booking_system: "MEWS / Custom"
  
constraints:
  no_link_building: false
  content_only: false
  timeline: "6 months"
```

---

## Phase 1: Foundation & Audit

### 1.1 Technical SEO Audit

**Objective:** Identify and fix technical issues blocking rankings

**Using:** `seo-audit` skill + free tools

#### Checklist

**Crawlability & Indexation**
- [ ] Submit sitemap to Google Search Console
- [ ] Submit sitemap to Bing Webmaster Tools (for AI search)
- [ ] Check robots.txt for unintentional blocks
- [ ] Verify all important pages are indexable
- [ ] Check for orphan pages (no internal links)

**Site Speed & Core Web Vitals**
- [ ] Run PageSpeed Insights for mobile + desktop
- [ ] Target: LCP < 2.5s, INP < 200ms, CLS < 0.1
- [ ] Optimize images (WebP format, lazy loading)
- [ ] Enable browser caching
- [ ] Use CDN for static assets

**Mobile-Friendliness**
- [ ] Test on Mobile-Friendly Test tool
- [ ] Responsive design (not separate m. subdomain)
- [ ] Tap targets 48px+ (finger-friendly)

**HTTPS & Security**
- [ ] Entire site on HTTPS
- [ ] Valid SSL certificate
- [ ] No mixed content warnings

**URL Structure**
- [ ] Clean, readable URLs
- [ ] Keywords in URLs where natural
- [ ] No unnecessary parameters
- [ ] Consistent structure

**Tools:**
- Google Search Console (free)
- Bing Webmaster Tools (free)
- PageSpeed Insights (free)
- Mobile-Friendly Test (free)
- Screaming Frog (free tier: 500 URLs)

#### Output Template

```markdown
## Technical SEO Audit Results

### Critical Issues (Fix Immediately)
1. [Issue] - Impact: High - Fix: [specific action]
2. [Issue] - Impact: High - Fix: [specific action]

### High Priority (Fix This Month)
1. [Issue] - Impact: Medium-High - Fix: [specific action]
2. [Issue] - Impact: Medium-High - Fix: [specific action]

### Medium Priority (Fix This Quarter)
1. [Issue] - Impact: Medium - Fix: [specific action]

### Low Priority (Nice to Have)
1. [Issue] - Impact: Low - Fix: [specific action]

### Core Web Vitals Status
- LCP: 2.1s ✅ (target: <2.5s)
- INP: 180ms ✅ (target: <200ms)
- CLS: 0.05 ✅ (target: <0.1)
```

### 1.2 E-E-A-T Assessment

**E-E-A-T = Experience, Expertise, Authoritativeness, Trustworthiness**

This is THE most important ranking factor in 2026.

#### Experience Signals
- [ ] First-hand experience demonstrated (photos, stories, details)
- [ ] Original content (not rehashed from competitors)
- [ ] Real examples and case studies
- [ ] User-generated content (reviews, testimonials)

#### Expertise Signals
- [ ] Author credentials visible (About page, author bios)
- [ ] Accurate, detailed information
- [ ] Properly sourced claims
- [ ] Industry recognition or awards

#### Authoritativeness Signals
- [ ] Mentioned/cited by other sites
- [ ] Social proof (follower counts, engagement)
- [ ] Industry partnerships or associations
- [ ] Media coverage

#### Trustworthiness Signals
- [ ] Contact information easily findable
- [ ] Privacy policy and terms of service
- [ ] Transparent about business practices
- [ ] Customer reviews visible and genuine
- [ ] HTTPS security

**Tools:**
- Manual review (qualitative)
- Google "site:domain.com" to see what's indexed
- Brand search volume in Google Trends

---

## Phase 2: Keyword Research & Strategy

### 2.1 Seed Keyword Generation

**Objective:** Generate 20-50 seed keywords to expand from

**Method:**

1. **Brainstorm Core Topics**
   - What are your main services/offerings?
   - What problems do you solve?
   - What do customers call your product/service?

2. **Competitor Research**
   - Google your main competitors
   - Check their page titles, H1s, URLs
   - Note patterns

3. **Use Autocomplete**
   - Google search bar autocomplete
   - "People also ask" boxes
   - "Related searches" at bottom of SERP

**Example for Nomads.com:**

```
Core seeds:
- hostel bangkok
- backpacker hostel thailand
- cheap accommodation chiang mai
- digital nomad hostel
- party hostel bangkok
- co-working hostel

Service seeds:
- hostel booking thailand
- hostel with coworking
- hostel monthly stay

Problem seeds:
- where to stay as digital nomad thailand
- best hostels for remote workers
- cheap long-term stay bangkok
```

### 2.2 Keyword Expansion

**Tools (Free/Freemium):**

1. **Google Keyword Planner** (free with Google Ads account)
   - Get search volume
   - Related keyword suggestions
   - Historical trends

2. **Google Trends** (free)
   - Compare keyword popularity
   - Geographic interest
   - Related queries

3. **AnswerThePublic** (freemium: 3 searches/day free)
   - Question-based keywords
   - Prepositions (with, for, to, etc.)
   - Comparisons (vs, or, like)

4. **AlsoAsked** (freemium)
   - "People also ask" expansion
   - Question clusters

5. **Keywords Everywhere** (Chrome extension, freemium)
   - Search volume overlay on Google
   - Related keywords sidebar

6. **Ubersuggest** (freemium: 3 searches/day)
   - Keyword suggestions
   - Difficulty scores
   - Content ideas

**Process:**

1. Input each seed keyword into tools
2. Export related keywords
3. Combine and deduplicate
4. Target: 200-500 keyword list

### 2.3 Keyword Difficulty & Priority Scoring

**Objective:** Focus on winnable keywords first

**Formula:**

```
Keyword Priority Score = (Search Volume × Relevance) / (Difficulty × 10)

Where:
- Search Volume: monthly searches
- Relevance: 1-10 (10 = perfect fit)
- Difficulty: 0-100 (Ahrefs/Moz scale)
```

**Simplified Classification:**

| Difficulty | Description | Strategy |
|------------|-------------|----------|
| 0-20 | Easy | Target immediately |
| 21-40 | Moderate | Target soon |
| 41-60 | Hard | Long-term target |
| 61-100 | Very Hard | Avoid unless brand term |

**Focus Areas for New/Small Sites:**
- **Long-tail keywords** (3-5+ words)
- **Low difficulty** (< 30)
- **Question keywords** (who, what, where, when, why, how)
- **"Best [X] for [Y]"** patterns
- **Location-specific** keywords

**Tools:**
- Moz Keyword Explorer (freemium)
- Ubersuggest (freemium)
- KWFinder by Mangools (freemium)
- LowFruits (paid but cheap, $28/mo for low-difficulty focus)

### 2.4 Search Intent Mapping

**Critical:** Match content to search intent or you won't rank.

**4 Types of Search Intent:**

1. **Informational** - User wants to learn
   - Keywords: "what is", "how to", "guide to"
   - Content type: Blog post, guide, tutorial
   - Example: "what is a hostel dormitory"

2. **Navigational** - User wants a specific site
   - Keywords: Brand names, "[brand] login"
   - Content type: Homepage, login page
   - Example: "nomads hostel bangkok"

3. **Commercial** - User is researching before buying
   - Keywords: "best", "top", "review", "vs"
   - Content type: Comparison, review, listicle
   - Example: "best hostels bangkok 2026"

4. **Transactional** - User ready to buy/book
   - Keywords: "book", "buy", "discount", "cheap"
   - Content type: Product/service page, booking page
   - Example: "book hostel bangkok tonight"

**Intent Mapping Process:**

1. Google each keyword
2. Look at top 10 results
3. Identify dominant content type
4. Match your content to that type

**Example:**

```yaml
keyword: "best hostels in bangkok"
search_volume: 2400
intent: commercial_investigation
current_top_results:
  - Listicle (Hostelworld): "10 Best Hostels in Bangkok"
  - Listicle (TripAdvisor): "Top 15 Bangkok Hostels"
  - Guide (Blog): "Bangkok's Best Hostels by Neighborhood"
content_type_to_create: listicle_or_guide
recommended_format: "15 Best Hostels in Bangkok (2026 Guide by Neighborhood)"
```

### 2.5 Keyword Grouping & Topic Clusters

**Objective:** Group related keywords into content clusters

**Pillar-Cluster Model:**

```
PILLAR PAGE: "Hostels in Thailand" (broad, high-volume)
    │
    ├─ CLUSTER: "Bangkok Hostels" (city-specific)
    │   ├─ Sub: "Best Bangkok Hostels for Digital Nomads"
    │   ├─ Sub: "Cheap Bangkok Hostels Under $10"
    │   └─ Sub: "Bangkok Party Hostels"
    │
    ├─ CLUSTER: "Chiang Mai Hostels"
    │   ├─ Sub: "Best Chiang Mai Hostels for Remote Work"
    │   └─ Sub: "Chiang Mai Hostels with Coworking"
    │
    └─ CLUSTER: "Phuket Hostels"
        └─ Sub: "Best Beach Hostels Phuket"
```

**Internal Linking Strategy:**
- All cluster pages link to pillar page
- Cluster pages link to related clusters
- Use descriptive anchor text (not "click here")

---

## Phase 3: Competitor Analysis

### 3.1 Identify Top Competitors

**Method 1: Google Search**
- Search your top 5 seed keywords
- Note who ranks in positions 1-10
- Compile list of recurring domains

**Method 2: Similar Tools**
- SimilarWeb (free tier)
- Alexa (if still available)
- Manual observation

**Output:**

```yaml
primary_competitors:
  - domain: "madmonkeyhostels.com"
    estimated_traffic: "high"
    strengths: ["strong brand", "multiple locations", "good content"]
  
  - domain: "slumberpartyhostel.com"
    estimated_traffic: "medium"
    strengths: ["excellent reviews", "social media presence"]
  
  - domain: "bodegabangkok.com"
    estimated_traffic: "medium"
    strengths: ["local SEO", "strong Bangkok presence"]
```

### 3.2 Keyword Gap Analysis

**Objective:** Find keywords competitors rank for that you don't

**Tools:**
- Ubersuggest (free tier: competitor analysis)
- Ahrefs (if budget allows: $99/mo)
- Manual method (see below)

**Manual Method:**

1. Go to Google Search Console
2. Export your current ranking keywords
3. For each competitor:
   - site:competitor.com "hostel"
   - site:competitor.com "bangkok"
   - Note their indexed pages
4. Identify topics/keywords they cover that you don't

**Example Output:**

```markdown
## Keyword Gaps

### High-Priority Gaps (High volume, low difficulty)
- "bangkok hostel monthly rate" (competitor ranks #3, we don't rank)
- "chiang mai digital nomad hostel" (competitor ranks #5, we don't rank)
- "best hostel for couples bangkok" (competitor ranks #8, we don't rank)

### Medium-Priority Gaps
- "hostel with gym bangkok"
- "vegetarian friendly hostel thailand"

### Content Type Gaps
- Competitor has neighborhood guides (we don't)
- Competitor has "Things to Do" content (we have 2, they have 20)
- Competitor has hostel comparison pages (we don't)
```

### 3.3 Content Gap Analysis

**Using:** `competitor-alternatives` skill

**Objective:** Identify content formats/topics you're missing

**Competitor Content Audit:**

For each top competitor:
1. List all their content types (blog, guides, comparison pages, etc.)
2. Count content pieces per type
3. Identify patterns

**Example:**

```markdown
## Competitor Content Analysis

### Mad Monkey Hostels
- Blog posts: 120+ (travel tips, city guides, cultural content)
- Location pages: 15 (one per hostel)
- Comparison pages: 0
- Resource/tools: 0

### Slumber Party
- Blog posts: 40 (party scene focus)
- Location pages: 3
- Comparison pages: 2 ("Slumber Party vs Other Bangkok Hostels")
- Instagram-heavy strategy

### Content We're Missing
1. Neighborhood guides (detailed, 2000+ words)
2. "Things to do in [city]" guides
3. Comparison content (us vs competitors)
4. Packing lists / travel tips
5. Digital nomad resources (visa guides, coworking spots)
```

### 3.4 SERP Feature Analysis

**Objective:** Identify opportunities to win featured snippets, PAA boxes, etc.

**SERP Features to Target:**

1. **Featured Snippets** (position 0)
   - Question-based queries
   - "How to", "What is", "Best way to"
   - Format: Paragraph, list, table

2. **People Also Ask (PAA)**
   - Related questions
   - Opportunity to appear multiple times

3. **Local Pack** (for location-based queries)
   - Google Business Profile optimization
   - Reviews, photos, NAP consistency

4. **Image Pack**
   - High-quality images with alt text
   - Descriptive file names

5. **Video Results**
   - YouTube integration
   - Video schema markup

**How to Win Snippets:**

1. Identify snippet opportunities:
   ```
   For each target keyword:
   - Google it
   - Note if there's a featured snippet
   - If yes, analyze format
   - If no, opportunity exists
   ```

2. Format content to match:
   - **Paragraph snippet:** 40-60 word direct answer
   - **List snippet:** Numbered or bulleted list
   - **Table snippet:** Comparison table

3. Use schema markup (FAQ, HowTo)

---

## Phase 4: Content Planning

### 4.1 Content Topic Generation

**Using:** `copywriting` + `programmatic-seo` skills

**Method 1: Topic Clusters (Manual)**

Based on keyword research, create content clusters:

```
PILLAR: Digital Nomad Guide to Thailand
│
├─ Visas & Legalities
│   ├─ Thailand Digital Nomad Visa Complete Guide
│   ├─ How to Get Thai Tourist Visa
│   └─ Visa Extension in Bangkok
│
├─ Best Cities for Digital Nomads
│   ├─ Bangkok vs Chiang Mai for Remote Work
│   ├─ Best Neighborhoods in Bangkok for Digital Nomads
│   └─ Is Phuket Good for Digital Nomads?
│
├─ Cost of Living
│   ├─ Cost of Living in Bangkok as Digital Nomad
│   ├─ How Much Does Chiang Mai Cost Per Month?
│   └─ Budget Breakdown: Living in Thailand Under $1000/mo
│
└─ Finding Accommodation
    ├─ Best Hostels for Digital Nomads Thailand
    ├─ Monthly Hostel vs Apartment Bangkok
    └─ Coliving Spaces vs Hostels: Which is Better?
```

**Method 2: Programmatic SEO (Scale)**

**Using:** `programmatic-seo` skill

Identify patterns that can scale:

**Playbook 1: Location Pages**
- Pattern: "[Service] in [City]"
- Example: "Hostel in Bangkok", "Hostel in Chiang Mai"
- Scale: 50+ cities in Thailand
- Template: Standard location page with unique data per city

**Playbook 2: Comparison Pages**
- Pattern: "[Place A] vs [Place B] for [Audience]"
- Example: "Bangkok vs Chiang Mai for Digital Nomads"
- Scale: 20+ city pairs
- Template: Standard comparison with city-specific data

**Playbook 3: "Best X" Pages**
- Pattern: "Best [Category] in [Location]"
- Example: "Best Hostels in Bangkok", "Best Coworking Hostels Chiang Mai"
- Scale: [10 categories] × [20 cities] = 200 pages
- Template: Listicle format with data-driven rankings

**Playbook 4: Resource/Glossary**
- Pattern: "What is [Term]" or "[Term] Guide"
- Example: "What is a Hostel Dormitory", "Capsule Hostel Explained"
- Scale: 50+ hostel/travel terms
- Template: Definition + context + examples

### 4.2 Content Brief Generation

**For each content piece, create a brief:**

```markdown
## Content Brief Template

**Title:** [SEO-optimized headline]
**Target Keyword:** [primary keyword]
**Secondary Keywords:** [3-5 related keywords]
**Search Intent:** [informational/commercial/transactional]
**Target Audience:** [specific persona]

**Word Count:** 1500-2500 words (based on competitor analysis)

**Structure:**

**H1:** [Main headline]

**Introduction (150-200 words)**
- Hook: [engaging opening]
- Promise: [what reader will learn]
- Preview: [section overview]

**H2:** [First main section]
- Talking points: [bullet list]
- Include keyword: [naturally in first 100 words]

**H2:** [Second main section]
- Talking points: [bullet list]

**H2:** [FAQ Section]
- 5-8 questions from "People Also Ask"
- Direct, concise answers (40-60 words each)
- Target featured snippet

**Conclusion (100 words)**
- Recap main points
- Call to action: [book now / read more / etc.]

**Internal Links:**
- Link to: [related article 1]
- Link to: [related article 2]
- Link to: [booking page]

**External Links:**
- 2-3 authoritative sources
- Government sites, research, reputable publications

**Media:**
- Featured image: [description]
- 3-5 supporting images
- Alt text: [keyword-rich descriptions]

**Meta:**
- Meta Title (60 chars): [optimized for CTR]
- Meta Description (160 chars): [include keyword + CTA]

**E-E-A-T Signals:**
- [ ] Author bio with credentials
- [ ] First-hand experience mentioned
- [ ] Original photos/data
- [ ] Sources cited
- [ ] Last updated date visible
```

### 4.3 Headline Formulas

**Using:** `copywriting` skill frameworks

**High-Performing Headline Patterns:**

1. **Number + Adjective + Keyword + Promise**
   - "15 Best Hostels in Bangkok (2026 Guide for Digital Nomads)"
   - "10 Cheap Chiang Mai Hostels Under $10/Night"

2. **How to + Desired Outcome**
   - "How to Find Cheap Long-Term Accommodation in Thailand"
   - "How to Choose the Right Hostel for Remote Work"

3. **Question**
   - "Is Bangkok or Chiang Mai Better for Digital Nomads?"
   - "What's the Best Neighborhood in Bangkok for Backpackers?"

4. **Ultimate Guide**
   - "The Ultimate Guide to Hostels in Thailand (2026)"
   - "Complete Guide to Living in Bangkok as a Digital Nomad"

5. **Comparison**
   - "Hostel vs Hotel vs Airbnb in Bangkok: Which is Cheapest?"
   - "Private Room vs Dorm: What's Better for Solo Travelers?"

6. **Location + Qualifier**
   - "Bangkok Hostels with the Best Coworking Spaces"
   - "Chiang Mai's Most Social Hostels for Solo Travelers"

**Power Words to Include:**
- Best, top, ultimate, complete, essential
- Free, cheap, affordable, budget
- Easy, simple, quick, fast
- Proven, expert, insider, secret
- New, updated, latest, 2026

### 4.4 Content Calendar (90 Days)

**Priority Framework:**

```
Priority = (Keyword Difficulty^-1 × Search Volume × Relevance) + Strategic_Bonus

Where Strategic_Bonus:
+50: Supports conversion (booking pages, location pages)
+30: Fills major gap vs competitors
+20: Programmatic SEO opportunity (can template)
+10: Builds E-E-A-T (expert content)
```

**Month 1: Quick Wins + Foundation**

Week 1-2:
- [ ] Fix critical technical SEO issues
- [ ] Optimize existing high-traffic pages
- [ ] Create/optimize Google Business Profiles for each location
- [ ] Set up Bing Webmaster Tools

Week 3-4:
- [ ] 4 blog posts (low-difficulty, high-relevance keywords)
- [ ] 2 comparison pages (competitors)
- [ ] Update all location pages with better content

**Month 2: Content Expansion**

- [ ] 8 blog posts (mix of difficulties)
- [ ] Launch programmatic location pages (10 cities)
- [ ] Create glossary/resource section (20 terms)
- [ ] Optimize for 10 featured snippet opportunities

**Month 3: Scale & Optimize**

- [ ] 8 blog posts
- [ ] Expand programmatic pages (20 more cities)
- [ ] Create topic cluster hub pages
- [ ] Backlink outreach campaign
- [ ] Content refresh: update old posts with new data

---

## Phase 5: Implementation Roadmap

### 5.1 Priority Matrix

**Impact vs. Effort Framework:**

| Impact | Effort | Priority | Examples |
|--------|--------|----------|----------|
| High | Low | **DO FIRST** | Fix broken internal links, optimize existing pages, claim Google Business Profile |
| High | High | **SCHEDULE** | Create 50 programmatic pages, content hub launch, site redesign |
| Low | Low | **DO WHEN FREE** | Social media optimization, minor content updates |
| Low | High | **DON'T DO** | Complex features with unclear ROI |

### 5.2 90-Day Action Plan

**Month 1: Foundation**

**Week 1:**
- [ ] Complete technical SEO audit
- [ ] Fix critical issues (indexation, HTTPS, mobile)
- [ ] Set up Google Search Console + Bing Webmaster Tools
- [ ] Set up Google Analytics 4
- [ ] Claim/optimize all Google Business Profiles

**Week 2:**
- [ ] Conduct keyword research (200+ keywords)
- [ ] Map search intent for top 50 keywords
- [ ] Competitor analysis (top 5 competitors)
- [ ] Create content calendar

**Week 3:**
- [ ] Write & publish 2 high-priority blog posts
- [ ] Optimize 5 existing pages (on-page SEO)
- [ ] Create 2 comparison pages

**Week 4:**
- [ ] Write & publish 2 more blog posts
- [ ] Launch glossary section (10 terms)
- [ ] Internal linking optimization pass

**Month 2: Content Expansion**

**Week 5-6:**
- [ ] Write & publish 4 blog posts
- [ ] Create 10 programmatic location pages
- [ ] Optimize for 5 featured snippets

**Week 7-8:**
- [ ] Write & publish 4 blog posts
- [ ] Create 5 comparison pages
- [ ] Start backlink outreach (10 prospects)

**Month 3: Scale & Measurement**

**Week 9-10:**
- [ ] Write & publish 4 blog posts
- [ ] Expand programmatic pages (20 more)
- [ ] Create 3 topic cluster hub pages

**Week 11-12:**
- [ ] Write & publish 4 blog posts
- [ ] Content refresh: update 10 old posts
- [ ] Backlink outreach (10 more prospects)
- [ ] Performance review & adjust strategy

### 5.3 Success Metrics & KPIs

**Track Weekly:**
- Indexed pages (Google Search Console)
- Average position for target keywords
- Crawl errors

**Track Monthly:**
- Organic traffic (sessions)
- Ranking keywords (total)
- Top 3 rankings (count)
- Top 10 rankings (count)
- Impressions & CTR
- Conversions from organic (bookings, inquiries)

**Track Quarterly:**
- Domain authority / Domain Rating
- Backlinks (total, referring domains)
- Content published (count)
- Featured snippets won (count)

**Benchmarks (Month 3 targets):**
- +50% organic traffic vs. Month 0
- 20+ keywords in top 10
- 5+ featured snippets won
- 30+ new content pieces published

**Dashboard Template:**

```yaml
Month: January 2026

Traffic:
  organic_sessions: 12,500 (+35% vs Dec)
  pageviews: 28,000
  avg_session_duration: "2m 15s"

Rankings:
  total_keywords: 450 (+120)
  top_3: 15 (+8)
  top_10: 65 (+25)
  top_20: 120 (+40)

Conversions:
  organic_bookings: 85 (+40%)
  booking_value: "$8,500"
  conversion_rate: "0.68%"

Content:
  published_this_month: 8
  updated_this_month: 5
  total_content_pieces: 95

Technical:
  indexed_pages: 320 (+45)
  crawl_errors: 2 (-15)
  avg_page_speed: 1.8s

Backlinks:
  total_backlinks: 1,250
  referring_domains: 85 (+12)
```

---

## 2026 SEO Best Practices

### Core Ranking Factors (Prioritized)

**1. E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness)**
- Most important factor in 2026
- See Phase 1.2 for implementation

**2. Content Quality & Originality**
- Original insights and data
- First-hand experience
- Comprehensive coverage
- NOT AI-generated slop

**3. Search Intent Match**
- Content type matches SERP
- Answers the actual question
- Satisfies user journey stage

**4. User Experience Signals**
- Core Web Vitals (LCP, INP, CLS)
- Mobile-friendliness
- Page speed
- Low bounce rate, high dwell time

**5. Backlinks & Authority**
- Quality over quantity
- Relevant, authoritative sources
- Natural link profile

**6. On-Page Optimization**
- Title tags, meta descriptions
- Header structure (H1-H6)
- Keyword placement (natural)
- Internal linking

**7. Technical SEO**
- Crawlability, indexability
- Site structure
- Schema markup
- HTTPS, security

### What's Changed in 2026

**More Important:**
- E-E-A-T signals (experience is new)
- Content depth and originality
- User engagement metrics
- Structured data for AI parsing

**Less Important:**
- Exact keyword matching
- Keyword density
- Meta keywords (still irrelevant)
- Quantity of content (quality wins)

**New Considerations:**
- Optimization for AI search (ChatGPT, Perplexity, etc.)
- LLM-friendly content structure
- Citations and quotable content
- Semantic relationships over keywords

---

## AI/LLM Search Optimization

### Why This Matters

AI search engines (ChatGPT, Perplexity, Claude, Gemini, Bing Chat) are becoming primary research tools. They cite sources differently than Google.

**Key Differences:**

| Traditional SEO | AI/LLM SEO |
|-----------------|------------|
| Rank in top 10 | Get cited in AI responses |
| Optimize for keywords | Optimize for concepts & entities |
| Backlinks matter most | Content quality & structure matter most |
| User visits your site | AI summarizes your content |

### 10 Strategies to Get Cited by AI

**1. Implement Structured Data (Schema Markup)**

AI models LOVE structured data. It's easy to parse.

Priority schema types:
- Organization
- LocalBusiness (for each hostel location)
- FAQPage (Q&A content)
- Article
- BreadcrumbList
- Review / AggregateRating

**Using:** `schema-markup` skill

**2. Create Clear, Direct Answers**

AI models extract direct answers. Format for this:

```markdown
## What is a Hostel Dormitory?

A hostel dormitory (or dorm room) is a shared sleeping space with multiple beds, typically ranging from 4 to 12 beds per room. Travelers book individual beds rather than entire rooms, making it the most affordable accommodation option for backpackers and budget travelers.

Key features:
- Shared sleeping space with bunk beds
- Individual lockers for belongings
- Shared bathrooms
- Average cost: $5-$15 per night
```

AI can extract this cleanly.

**3. Use Q&A Format (FAQ Sections)**

Add FAQ sections to every page:

```markdown
## Frequently Asked Questions

### How much does a hostel in Bangkok cost?
Bangkok hostels typically cost $8-$15 per night for a bed in a dormitory, and $25-$50 for a private room. Prices vary by neighborhood, with Khao San Road being the cheapest and Sukhumvit being more expensive.

### Is it safe to stay in a hostel?
Yes, hostels are generally safe. Most provide lockers for valuables, 24/7 reception, and security cameras. Choose hostels with good reviews and high safety ratings.
```

**4. Optimize for Bing (Powers ChatGPT Search)**

- Submit sitemap to Bing Webmaster Tools
- Optimize for Bing-specific factors (user engagement, social signals)
- Bing IndexNow API for instant indexing

**5. Keep Publish Dates Current**

AI models favor recent content.

- Show "Last Updated" dates prominently
- Actually update content regularly (not fake dates)
- Use "2026" in titles where relevant

**6. Create Quotable, Citation-Worthy Content**

Format content so AI can cite it easily:

```markdown
According to [Your Brand], [statistic or fact]. This is supported by [evidence].
```

Example:
```markdown
According to Nomads Hostel's 2025 traveler survey of 1,500 digital nomads, 78% prefer hostels with dedicated coworking spaces over traditional backpacker hostels.
```

**7. Use Natural Language & Semantic Relationships**

AI understands concepts, not just keywords.

Instead of:
```
"hostel Bangkok cheap"
```

Write naturally:
```
"For budget-conscious travelers, Bangkok offers numerous affordable hostels. Here's how to find cheap accommodation in Thailand's capital city."
```

Use related terms naturally:
- Hostel → accommodation, lodging, guesthouse, backpacker
- Bangkok → Thai capital, Krung Thep, Bangkok city

**8. Earn Off-Site Mentions**

AI models train on and cite diverse sources.

Get mentioned on:
- Review platforms (TripAdvisor, Hostelworld, Google Reviews)
- Travel blogs and forums
- News sites and press coverage
- Reddit, Quora discussions
- Social media

**9. Build Branded Search Volume**

AI models recognize and prioritize brands with high search volume.

Tactics:
- Social media presence
- Influencer partnerships
- PR and media coverage
- Encourage "Nomads Hostel" branded searches

**10. Structured, Scannable Content**

AI parses structured content better.

Best practices:
- Clear headings (H2, H3 hierarchy)
- Bullet points and numbered lists
- Tables for comparisons
- Short paragraphs (2-3 sentences)
- Bold key points

### Testing AI Visibility

**How to check if AI cites you:**

1. **ChatGPT (with search enabled):**
   - Ask: "What are the best hostels in Bangkok?"
   - Check if your site is cited

2. **Perplexity AI:**
   - Same question
   - Check sources

3. **Bing Chat:**
   - Same question
   - Check if cited

**Track:**
- Which queries cite you
- Which pages are cited
- Citation frequency

---

## Tools & MCPs

### Free Tools (Priority)

**Keyword Research:**
1. **Google Keyword Planner** - free, need Google Ads account
2. **Google Trends** - free, compare keywords
3. **AnswerThePublic** - freemium, 3/day free
4. **Keywords Everywhere** - Chrome extension, freemium
5. **Ubersuggest** - freemium, 3 searches/day

**Technical SEO:**
1. **Google Search Console** - free, essential
2. **Bing Webmaster Tools** - free, essential for AI search
3. **PageSpeed Insights** - free
4. **Mobile-Friendly Test** - free
5. **Screaming Frog** - freemium, 500 URLs free

**Analytics:**
1. **Google Analytics 4** - free
2. **Google Tag Manager** - free
3. **Bing Webmaster Tools** - free

**SERP Analysis:**
1. **Manual Google searches** - free
2. **AlsoAsked** - freemium
3. **People Also Ask** - free (built into Google)

### Freemium Tools (Generous Free Tiers)

**Keyword Research:**
1. **Ubersuggest** ($12/mo paid, 3 searches/day free)
2. **KWFinder by Mangools** ($29/mo paid, limited free searches)
3. **Moz Keyword Explorer** ($99/mo paid, 10 queries/mo free)

**SEO Suite:**
1. **Ubersuggest** - keyword research, site audit, competitor analysis
2. **Moz** - keyword research, link analysis, site audits

### Paid Tools (Worth It If Budget Allows)

**Best Value:**
1. **LowFruits** - $28/mo - focuses on low-difficulty keywords (great for new sites)
2. **Mangools Suite** - $29/mo - keyword research, SERP analysis, backlink checker
3. **Ubersuggest** - $12/mo - solid all-rounder

**Professional Tier (if scaling):**
1. **Ahrefs** - $99/mo - industry standard, best backlink data
2. **Semrush** - $119/mo - comprehensive SEO suite
3. **Surfer SEO** - $59/mo - content optimization

### MCP Servers for SEO

**Currently Available:**

**1. Exa Research MCP** (Already installed)
- Web search and deep research
- Company and competitor research
- Use for competitor analysis and content research
- Cost: Requires EXA_API_KEY

**2. Brave Search MCP** (Available)
- Web search API
- Free tier: 2,000 queries/month
- Good for automated keyword research
- Cost: Free tier available

**3. Web Scraping MCPs**
- Use for competitor content analysis
- Extract structured data from SERPs
- Monitor competitor changes

**Potential SEO-Specific MCPs (To Build or Find):**

**Keyword Research MCP:**
- Integrate Google Keyword Planner API
- Batch keyword expansion
- Search volume data

**SERP Analysis MCP:**
- Automated SERP scraping
- Featured snippet detection
- Competitor position tracking

**Technical SEO MCP:**
- Site crawl integration (Screaming Frog API)
- PageSpeed monitoring
- Broken link detection

**Backlink MCP:**
- Monitor new backlinks
- Analyze competitor backlinks
- Identify link opportunities

**Note:** As of January 2026, SEO-specific MCPs are still emerging. Priority is using existing free tools + Exa Research MCP for competitor intelligence.

### Tool Recommendation by Budget

**$0/month:**
- Google Search Console
- Bing Webmaster Tools
- Google Analytics 4
- Google Keyword Planner
- AnswerThePublic (3/day)
- Manual SERP analysis
- Screaming Frog (500 URLs)

**$30/month:**
- All free tools +
- LowFruits ($28/mo) - best for finding easy wins

**$60/month:**
- All above +
- Mangools Suite ($29/mo)
- Surfer SEO ($59/mo) - content optimization

**$150/month:**
- All above +
- Ahrefs ($99/mo) - backlink analysis and competitive research

---

## Output Templates

### Final Deliverable: SEO Strategy Document

```markdown
# SEO Strategy Document: [Domain]
**Target Demographic:** [Description]
**Date:** January 26, 2026
**Prepared by:** [Agent/Team]

---

## Executive Summary

**Current State:**
- Organic Traffic: [X] sessions/month
- Ranking Keywords: [X]
- Domain Authority: [X]
- Primary Competitors: [List]

**Opportunity:**
- Addressable search volume: [X] monthly searches
- Keyword gaps identified: [X] keywords
- Content gaps identified: [X] topic areas

**Strategy:**
Focus on [1-2 sentence strategy summary]

**90-Day Goals:**
- Increase organic traffic by 50%
- Rank in top 10 for 20+ target keywords
- Publish 30+ content pieces
- Win 5+ featured snippets

---

## 1. Technical SEO Audit Results

[Use Phase 1 audit output template]

---

## 2. Keyword Research

**Total Keywords Identified:** [X]

**Top 20 Priority Keywords:**

| Keyword | Volume | Difficulty | Intent | Priority Score |
|---------|--------|------------|--------|----------------|
| [keyword 1] | [vol] | [diff] | [intent] | [score] |
| [keyword 2] | [vol] | [diff] | [intent] | [score] |
| ... |

**Keyword Clusters:**

1. **[Cluster Name]** - [X] keywords
   - Pillar keyword: [keyword]
   - Supporting keywords: [list]

2. **[Cluster Name]** - [X] keywords
   - Pillar keyword: [keyword]
   - Supporting keywords: [list]

---

## 3. Competitor Analysis

**Primary Competitors:**

1. **[Competitor 1]**
   - Domain Authority: [X]
   - Estimated Organic Traffic: [X]
   - Content Strengths: [list]
   - Content Gaps we can exploit: [list]

2. **[Competitor 2]**
   - [same format]

**Keyword Gap Opportunities:**
- [X] keywords competitors rank for that we don't
- Priority gaps: [top 10 list]

**Content Gap Opportunities:**
- [Content type 1] - Competitor has [X], we have [Y]
- [Content type 2] - Competitor has [X], we have [Y]

---

## 4. Content Plan

**Content Themes:**
1. [Theme 1] - [X] pieces
2. [Theme 2] - [X] pieces
3. [Theme 3] - [X] pieces

**90-Day Content Calendar:**

**Month 1:**
- Week 1: [Content 1], [Content 2]
- Week 2: [Content 3], [Content 4]
- Week 3: [Content 5], [Content 6]
- Week 4: [Content 7], [Content 8]

**Month 2:**
- [Same format]

**Month 3:**
- [Same format]

**Programmatic SEO Opportunities:**
- [Playbook 1]: [X] pages
- [Playbook 2]: [X] pages
- Total programmatic pages: [X]

---

## 5. Implementation Roadmap

**Month 1 Priorities:**
1. [Priority 1]
2. [Priority 2]
3. [Priority 3]

**Month 2 Priorities:**
1. [Priority 1]
2. [Priority 2]

**Month 3 Priorities:**
1. [Priority 1]
2. [Priority 2]

**Resource Requirements:**
- Content writers: [X] hours/week
- Developers: [X] hours/week
- Budget: $[X]/month

---

## 6. Success Metrics

**Weekly KPIs:**
- [KPI 1]
- [KPI 2]

**Monthly KPIs:**
- [KPI 1]
- [KPI 2]

**Quarterly Goals:**
- [Goal 1]
- [Goal 2]

---

## 7. Risks & Mitigation

**Risk 1:** [Description]
- Likelihood: [Low/Medium/High]
- Impact: [Low/Medium/High]
- Mitigation: [Strategy]

**Risk 2:** [Description]
- Likelihood: [Low/Medium/High]
- Impact: [Low/Medium/High]
- Mitigation: [Strategy]

---

## Appendices

**A. Full Keyword List (CSV)**
**B. Content Briefs (separate documents)**
**C. Competitor Deep-Dives**
**D. Technical Audit Details**
```

---

## Cost Analysis

### Monthly Cost Breakdown by Strategy

**Strategy 1: Free Tools Only**

| Tool/Service | Cost |
|--------------|------|
| Google Search Console | $0 |
| Bing Webmaster Tools | $0 |
| Google Analytics | $0 |
| Google Keyword Planner | $0 |
| AnswerThePublic | $0 (3/day) |
| Screaming Frog | $0 (500 URLs) |
| Manual research | $0 |
| **Total** | **$0/month** |

**Limitations:**
- Manual research time-intensive
- Limited competitor insights
- No backlink data
- Basic keyword data

**Best for:** New sites, tight budgets, manual workflow

---

**Strategy 2: Low-Cost Optimizer**

| Tool/Service | Cost |
|--------------|------|
| All free tools | $0 |
| LowFruits | $28 |
| **Total** | **$28/month** |

**Benefits:**
- All free tool capabilities +
- Low-difficulty keyword focus
- Better keyword suggestions
- SERP analysis

**Best for:** New sites wanting quick wins

---

**Strategy 3: Growth Mode**

| Tool/Service | Cost |
|--------------|------|
| All free tools | $0 |
| Mangools Suite | $29 |
| Surfer SEO | $59 |
| **Total** | **$88/month** |

**Benefits:**
- Comprehensive keyword research
- Content optimization
- SERP analysis
- Basic backlink data

**Best for:** Growing sites, active content production

---

**Strategy 4: Professional**

| Tool/Service | Cost |
|--------------|------|
| All free tools | $0 |
| Ahrefs | $99 |
| Surfer SEO | $59 |
| **Total** | **$158/month** |

**Benefits:**
- Best-in-class backlink analysis
- Comprehensive competitor research
- Content optimization
- Rank tracking

**Best for:** Established sites, competitive niches, agencies

---

### ROI Calculation

**Assumptions:**
- Average booking value: $100
- Conversion rate: 0.5% (organic traffic)
- Cost per tool: varies

**Break-Even Analysis:**

| Strategy | Monthly Cost | Bookings Needed to Break Even | Organic Sessions Needed |
|----------|--------------|-------------------------------|-------------------------|
| Free | $0 | 0 | 0 |
| Low-Cost | $28 | 0.28 (~1) | 56 |
| Growth | $88 | 0.88 (~1) | 176 |
| Professional | $158 | 1.58 (~2) | 316 |

**Expected ROI:**

If workflow increases organic traffic by 50% over 90 days:
- Starting traffic: 5,000 sessions/month
- Ending traffic: 7,500 sessions/month
- New bookings: 12.5/month
- New revenue: $1,250/month
- ROI vs. Professional tier: 691% ($1,250 / $158)

---

## Marketing Skills Integration

This workflow leverages the marketing skills in `/home/desktop/clawd/skills/marketing-skills/references/`.

### Skill Usage Map

**Phase 1: Foundation & Audit**
- Use: `seo-audit` skill
- Purpose: Technical SEO audit framework and checklist

**Phase 2: Keyword Research**
- Use: `marketing-ideas` skill (SEO section)
- Purpose: Content ideas and SEO tactics

**Phase 3: Competitor Analysis**
- Use: `competitor-alternatives` skill
- Purpose: Competitor comparison page strategy and content architecture

**Phase 4: Content Planning**
- Use: `programmatic-seo` skill
- Purpose: Template-based page generation at scale
- Use: `copywriting` skill
- Purpose: Headline formulas and content frameworks
- Use: `schema-markup` skill
- Purpose: Structured data implementation for AI/LLM optimization

**Phase 5: Optimization**
- Use: `page-cro` skill
- Purpose: Optimize pages for conversion after ranking

### Workflow Handoffs

**From SEO Workflow → Other Skills:**

**To `copywriting` skill:**
```
Input: Content brief from Phase 4.2
Output: Full article copy with headlines
```

**To `programmatic-seo` skill:**
```
Input: Keyword pattern (e.g., "hostel in [city]")
Output: 50+ templated pages with unique data
```

**To `competitor-alternatives` skill:**
```
Input: List of competitors
Output: Comparison and alternative pages
```

**To `page-cro` skill:**
```
Input: Ranking page with traffic but low conversion
Output: Optimized page with higher conversion rate
```

---

## Agent Implementation Notes

### For Claude Code / Agent Implementation

**Input Format:**

```json
{
  "domain": "nomads.com",
  "target_demographic": {
    "age": "25-40",
    "profession": "digital nomads, remote workers",
    "location": "Thailand, Southeast Asia",
    "interests": ["travel", "coworking", "community"]
  },
  "business_model": "hostel chain",
  "goals": ["increase bookings", "brand awareness"],
  "current_traffic": 50000,
  "budget": "low"
}
```

**Output Format:**

```json
{
  "strategy_document": "path/to/seo-strategy.md",
  "keyword_list": "path/to/keywords.csv",
  "content_calendar": "path/to/content-calendar.md",
  "technical_audit": "path/to/technical-audit.md",
  "priority_actions": [
    {
      "action": "Fix broken internal links",
      "impact": "high",
      "effort": "low",
      "priority": 1
    },
    {
      "action": "Create 10 comparison pages",
      "impact": "high",
      "effort": "medium",
      "priority": 2
    }
  ],
  "metrics": {
    "keywords_identified": 450,
    "content_pieces_planned": 35,
    "programmatic_pages": 50,
    "estimated_traffic_increase": "50%"
  }
}
```

### Automation Opportunities

**Automatable Tasks:**
1. Technical SEO audit (Screaming Frog + custom scripts)
2. Keyword research (Google Keyword Planner API + scraping)
3. SERP analysis (automated Google searches + parsing)
4. Competitor content analysis (web scraping)
5. Content brief generation (template + data)
6. Programmatic page generation (template + data)
7. Internal linking suggestions (graph analysis)
8. Performance tracking (Search Console API + GA4 API)

**Manual/Human Tasks:**
1. Content writing (high-quality, E-E-A-T content)
2. Strategic decisions (which keywords to prioritize)
3. Link outreach (relationship building)
4. Content updates (keeping content fresh and accurate)

---

## Conclusion

This workflow provides a complete, actionable framework for SEO research and planning in 2026. Key takeaways:

1. **Dual optimization:** Optimize for both Google traditional search and AI/LLM search engines
2. **E-E-A-T first:** Experience, Expertise, Authoritativeness, Trustworthiness is the #1 ranking factor
3. **Cost-effective:** Free tools can accomplish 80% of what paid tools do
4. **Actionable:** Clear steps, templates, and examples throughout
5. **Agent-ready:** Structured for automation and programmatic execution

**Next Steps:**
1. Fill in input parameters for your domain
2. Execute Phase 1 (Foundation & Audit)
3. Execute Phase 2 (Keyword Research)
4. Create content calendar
5. Start publishing!

**Questions or Need Help?**
- Review marketing skills in `/home/desktop/clawd/skills/marketing-skills/references/`
- Use Exa Research skill for competitive intelligence
- Refer to specific skill documentation for detailed frameworks

---

**Document Version:** 1.0  
**Last Updated:** January 26, 2026  
**Maintained by:** Clawd / Agent: Main
