# Nomads

**Type:** companies
**Last Updated:** 2026-02-01

## Current Context

### Market

- Ao Nang Properties Market Position (2026-02-01 02:01 UTC): Base Ao Nang Beachfront rank #2 of 30 listings for Feb 2, 2026 check-in. Price ฿809/night (was ฿899, -10% off). Rating 9.4 Superb (1,932 reviews). Strong visibility with top positioning. Nomads Ao Nang Beach not appearing in search results despite highest rating (9.6 Superb, 2,977 reviews) - requires investigation. (02/01/2026)
- Base Ao Nang Beachfront property update (2026-02-01 02:01 UTC): Hostelworld rank #2 of 30 for Feb 2, 2026. Price ฿809 (10% discount from ฿899 original). Rating 9.4 Superb with 1,932 reviews. Maintained strong position with discounted pricing. (02/01/2026)
- Hostelworld price monitoring discrepancy discovered (2026-01-31 05:45 UTC): Scraper reported THB 350 for Nomads Ao Nang Beach, but actual Hostelworld price confirmed via screenshot as THB 1,125 for Jan 31 → Feb 1, 2026 (775 THB difference, 69% underreporting) (01/31/2026)
- Hostelworld scraper JavaScript rendering issue identified (2026-01-31 05:44 UTC): Current price monitor fails to capture dynamic JavaScript pricing. Hostelworld loads prices via JavaScript after page load, requiring browser automation that handles rendering (Playwright/Selenium). Browser attempts failed due to unavailable browser profiles. (01/31/2026)
- Playwright price monitor script created (2026-01-31 06:20 UTC): /home/desktop/clawd/scripts/hostelworld-price-monitor.cjs working with full JavaScript rendering. Script handles direct property page scraping for accurate pricing. (01/31/2026)

### Tasks

- Nomads Ao Nang Beach search visibility clarified (2026-02-01 04:22 UTC): Property not appearing in Hostelworld search results for Feb 2, 2026 is due to being sold out for that date. This is expected behavior - sold out listings are filtered from search results. No listing issue or suspension. (02/01/2026)
- Klaviyo MEWS integration codebase review session launched (2026-01-31 05:44 UTC): Claude Code wingman session 'klaviyo-mews' opened via tmux. Task: Review current state and identify what's complete vs pending for guest lifecycle email automation sync. Path: /home/desktop/klaviyo-mews-integration (01/31/2026)

### Projects

- Price monitoring rebuild decision (2026-01-31 05:52 UTC): Trevor approved both fixes - (1) Rebuild script with Playwright for real-time JavaScript pricing, (2) Set up daily cron at 6 AM Thailand time with Telegram notifications. Script will target today → tomorrow dates for real-time data. (01/31/2026)
- Price monitoring sub-agents deployed (2026-01-31 05:52 UTC): 'fix-hostelworld-monitor' to rebuild script with Playwright headless browser, 'setup-hostelworld-cron' to configure daily 6 AM Thailand schedule with Telegram alerts. Both running with 5-minute timeout. (01/31/2026)
- Noho Ops integration requested (2026-01-31 12:37 UTC): Trevor requested sub-agent to plan integration of Mews Poster and Mews Klaviyo projects into Noho Ops. Requirements: build as different route groups within hostel slug route, add nav route groups to sidebar, single login for all features. Need deep dive to identify existing features to avoid breaking anything. (01/31/2026)
- Noho Ops integration correction (2026-01-31 14:45 UTC): Trevor corrected that Noho Ops integration has NOT been done. The three projects (MEWS Poster, MEWS Klaviyo, full integration) are separate repositories, not branches in the same repo. Integration still needs to be planned and executed. (01/31/2026)
- ClickUp project structure organized (2026-01-30 16:51 UTC): 4 main development projects created as ClickUp Lists in Nomads space (01/30/2026)

### General

- Hostelworld property IDs confirmed (2026-01-31 06:15 UTC): Nomads Ao Nang Beach (property id 316736, slug 'Nomads-Ao-Nang-Beach'), Base Ao Nang Beachfront (property id 322541, slug 'Base-Ao-Nang-Beachfront-by-Nomads') (01/31/2026)
- Product ideas brainstorming session (2026-01-31 18:59 UTC): Trevor requested product ideas for MRR and one-time payments. 10 ideas generated across Hospitality SaaS, Developer Tools, Thailand/Digital Nomad, and Workflow Automation. Top 3 recommendations: POS-PMS Sync Service, Hostel Operations Dashboard, Next.js + Convex Starter Kit. (01/31/2026)
- Hoscars Awards won (2026-01-31): Nomads won Best Hostel Thailand and Best Hostel Australia at Hoscars awards. Social media thank-you posts created for Instagram targeting 20-25 year olds. Posts emphasize community-built success with hundreds of thousands of guests from 80+ countries. (01/31/2026)
- Social media deliverables completed (2026-01-31): 5 initial Instagram post options created for Hoscars awards, followed by humanized version removing AI patterns, combined version with Trevor's preferred elements, and final version without 'bad beds' comments. (01/31/2026)
- Code audit completed (2026-01-30): Identified 8 critical improvements, 5 consolidation opportunities, 4 error scenarios. CODE_AUDIT_REPORT.md generated. (01/30/2026)

### Integrations

- Noho Ops existing features (2026-01-31 12:37 UTC context): Noho Ops already uses Poster API and Convex, has by-hostel slug/config page structure. Integrates with MEWS PMS for booking and revenue management. (01/31/2026)
- MEWS/Poster integration branches pushed to GitHub (2026-01-31 17:50 UTC): All MEWS integration branches (mews-api, sync/poster-mews, sync/mews-klaviyo, sync/full-integration) successfully pushed to nomads-ops-center repository on GitHub. Repository: https://github.com/tddixon/nomads-ops-center (01/31/2026)
- GitHub push re-requested and completed (2026-01-31 18:57 UTC): User requested 'please push the mews poster projefct to github'. All branches (mews-api, sync/poster-mews, sync/mews-klaviyo, sync/full-integration) confirmed pushed to nomads-ops-center repository. Repository URL: https://github.com/tddixon/nomads-ops-center (01/31/2026)
- MEWS Connector API integration Phase 1 completed (2026-01-30). Branch: mews-api, PR #8 created. Includes polling-based payment collection, 15-minute cron, manual poll button. (01/30/2026)
- Ops Center improvements planned: N+1 query fixes, duplicate payment protection, transaction isolation, webhook + API consolidation, soft delete standardization (2026-01-30) (01/30/2026)

## Recent Activity (Last 3 Months)

- **02/01/2026:** Ao Nang Properties Market Position (2026-02-01 02:01 UTC): Base Ao Nang Beachfront rank #2 of 30 listings for Feb 2, 2026 check-in. Price ฿809/night (was ฿899, -10% off). Rating 9.4 Superb (1,932 reviews). Strong visibility with top positioning. Nomads Ao Nang Beach not appearing in search results despite highest rating (9.6 Superb, 2,977 reviews) - requires investigation.
- **02/01/2026:** Base Ao Nang Beachfront property update (2026-02-01 02:01 UTC): Hostelworld rank #2 of 30 for Feb 2, 2026. Price ฿809 (10% discount from ฿899 original). Rating 9.4 Superb with 1,932 reviews. Maintained strong position with discounted pricing.
- **02/01/2026:** Nomads Ao Nang Beach search visibility clarified (2026-02-01 04:22 UTC): Property not appearing in Hostelworld search results for Feb 2, 2026 is due to being sold out for that date. This is expected behavior - sold out listings are filtered from search results. No listing issue or suspension.
- **01/31/2026:** Hostelworld price monitoring discrepancy discovered (2026-01-31 05:45 UTC): Scraper reported THB 350 for Nomads Ao Nang Beach, but actual Hostelworld price confirmed via screenshot as THB 1,125 for Jan 31 → Feb 1, 2026 (775 THB difference, 69% underreporting)
- **01/31/2026:** Hostelworld scraper JavaScript rendering issue identified (2026-01-31 05:44 UTC): Current price monitor fails to capture dynamic JavaScript pricing. Hostelworld loads prices via JavaScript after page load, requiring browser automation that handles rendering (Playwright/Selenium). Browser attempts failed due to unavailable browser profiles.
- **01/31/2026:** Price monitoring rebuild decision (2026-01-31 05:52 UTC): Trevor approved both fixes - (1) Rebuild script with Playwright for real-time JavaScript pricing, (2) Set up daily cron at 6 AM Thailand time with Telegram notifications. Script will target today → tomorrow dates for real-time data.
- **01/31/2026:** Price monitoring sub-agents deployed (2026-01-31 05:52 UTC): 'fix-hostelworld-monitor' to rebuild script with Playwright headless browser, 'setup-hostelworld-cron' to configure daily 6 AM Thailand schedule with Telegram alerts. Both running with 5-minute timeout.
- **01/31/2026:** Klaviyo MEWS integration codebase review session launched (2026-01-31 05:44 UTC): Claude Code wingman session 'klaviyo-mews' opened via tmux. Task: Review current state and identify what's complete vs pending for guest lifecycle email automation sync. Path: /home/desktop/klaviyo-mews-integration
- **01/31/2026:** Hostelworld property IDs confirmed (2026-01-31 06:15 UTC): Nomads Ao Nang Beach (property id 316736, slug 'Nomads-Ao-Nang-Beach'), Base Ao Nang Beachfront (property id 322541, slug 'Base-Ao-Nang-Beachfront-by-Nomads')
- **01/31/2026:** Playwright price monitor script created (2026-01-31 06:20 UTC): /home/desktop/clawd/scripts/hostelworld-price-monitor.cjs working with full JavaScript rendering. Script handles direct property page scraping for accurate pricing.

## Historical Context

_Archived facts for reference:_

- Hostel chain in Thailand with 4+ properties (01/01/2024) [archived]
- Owner: Trevor Dixon (01/01/2024) [archived]
- Properties: Ao Nang, Bangkok, Koh Tao, Base Ao Nang (01/01/2024) [archived]

---

**Fact Summary:** 40 recent, 0 older, 3 historical
**Total Facts:** 57
