# SEO Employee - Automated SEO & Content Creation

AI-powered SEO analysis and content generation for Trevor's Thailand hostel chain.

## Commands

This skill provides 4 slash commands for SEO automation:

### `/seo-analyze <url>`
Full SEO audit + 15-20 keyword recommendations

**What it does:**
1. Crawls the target URL
2. Analyzes on-page SEO (titles, meta, headers, content quality)
3. Researches competitor keywords
4. Identifies content gaps
5. Generates 15-20 keyword recommendations with search volume + difficulty

**Output:** `seo-analysis/[domain]-[date].md`

### `/content-strategy <input>`
Content ideas and topic clusters from keywords or URL

**Input:** Either keywords (comma-separated) OR a competitor URL

**What it does:**
1. Takes keywords or analyzes competitor content
2. Groups into topic clusters
3. Generates 10-15 content ideas per cluster
4. Suggests article types (blog, guide, comparison, location page)
5. Prioritizes by search volume + competition

**Output:** `content-strategy/[date]-strategy.md`

### `/write-article <topic>`
Complete 1500-2500 word human-sounding article

**What it does:**
1. Researches the topic + related keywords
2. Analyzes top 3 ranking pages
3. Creates comprehensive outline
4. Writes 1500-2500 word article
5. **Runs through humanizer** to remove AI patterns
6. Optimizes for target keywords
7. Adds meta title + description

**Output:** `articles/[slug].md`

**Special handling:**
- Hostel-specific content gets Thailand context automatically
- Travel content includes practical tips
- Location pages follow programmatic SEO best practices

### `/full-pipeline <url>`
End-to-end: analyze → strategy → write 3 articles

**What it does:**
1. Runs `/seo-analyze` on the URL
2. Generates `/content-strategy` from findings
3. Writes 3 top-priority articles with `/write-article`
4. Outputs full report with next steps

**Output:** `pipeline/[domain]-[date]/` folder with:
- SEO analysis
- Content strategy
- 3 finished articles
- Implementation checklist

## Configuration

**Output location:** All files saved to `/home/desktop/clawd/seo-employee/output/`

**Article length:** Always 1500-2500 words (optimized for SEO)

**Keyword source:** AI-generated via competitor research + web search

**Humanization:** Built-in pass for every article (mandatory)

**Content types supported:**
- SEO blog posts
- City/neighborhood guides (Bangkok, Chiang Mai, Phuket, etc.)
- Comparison articles ("Best hostels in X")
- Travel tips and guides

## Integration

This skill integrates with:
- **Marketing Skills** (`/home/desktop/clawd/skills/marketing-skills/references/`)
  - SEO audit framework
  - Copywriting guidelines
  - Programmatic SEO patterns
- **Humanizer** (`/home/desktop/clawd/skills/humanizer/SKILL.md`)
  - Removes AI writing patterns
  - Makes content sound natural
- **DataForSEO MCP** (optional, when API credentials configured)
  - Real keyword data
  - Search volume
  - Competition metrics

## Thailand Hostel Presets

When content is related to hostels/accommodation/Thailand, automatically applies:
- Target audience: Backpackers, digital nomads, budget travelers
- Tone: Friendly, practical, authentic
- Context: Thailand travel (visa, transport, culture, safety)
- Local SEO: City-specific keywords
- Features: Dorms, private rooms, social spaces, location

## Usage Examples

```bash
# Analyze a competitor
/seo-analyze https://madmonkeyhostels.com

# Generate content strategy from keywords
/content-strategy bangkok hostels, chiang mai accommodation, thailand backpacking

# Generate content strategy from competitor URL
/content-strategy https://example-hostel.com/blog

# Write a specific article
/write-article Best Hostels in Bangkok for Solo Travelers 2024

# Full automation (analyze → strategy → 3 articles)
/full-pipeline https://competitor-hostel.com
```

## Implementation Notes

**For developers extending this skill:**

1. **SEO Analysis** leverages:
   - `marketing-skills/references/seo-audit/SKILL.md`
   - Web scraping for competitor analysis
   - DataForSEO MCP (if configured) for keyword metrics

2. **Content Strategy** follows:
   - `workflows/seo-research-planning-workflow.md`
   - Topic clustering methodology
   - Search intent analysis

3. **Article Writing** uses:
   - `marketing-skills/references/copywriting/SKILL.md`
   - `marketing-skills/references/programmatic-seo/SKILL.md` (for location pages)
   - `skills/humanizer/SKILL.md` (mandatory post-processing)

4. **Humanization Pass:**
   ```
   Write draft → Run through humanizer → Final output
   ```
   Never skip humanization. It's what makes the difference between "AI content" and "human-quality content."

## File Structure

```
/home/desktop/clawd/seo-employee/
├── SKILL.md (this file)
├── README.md
├── DATAFORSEO-SETUP.md
└── output/
    ├── seo-analysis/
    │   └── [domain]-[date].md
    ├── content-strategy/
    │   └── [date]-strategy.md
    ├── articles/
    │   └── [slug].md
    └── pipeline/
        └── [domain]-[date]/
            ├── analysis.md
            ├── strategy.md
            ├── article-1.md
            ├── article-2.md
            ├── article-3.md
            └── checklist.md
```

## Future Enhancements

- [ ] Integrate DataForSEO API for real keyword data
- [ ] Add `/competitor-spy` command
- [ ] Bulk article generation from CSV
- [ ] Internal linking suggestions
- [ ] Schema markup generation
- [ ] Meta tag optimization
- [ ] Image alt text suggestions

## Notes

- All commands run in bypass-permissions mode (safe for this workspace)
- Articles are markdown files ready for CMS import
- Metadata included in frontmatter (title, description, keywords, date)
- Each command can be used independently or as part of `/full-pipeline`

---

**Ready to use:** All commands are now available in Claude Code.

**Next step:** Run `/seo-analyze <competitor-url>` to start.
