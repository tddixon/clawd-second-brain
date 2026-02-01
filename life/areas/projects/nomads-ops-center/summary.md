# Nomads Ops Center

**Type:** projects
**Last Updated:** 2026-02-01

## Current Context

### Projects

- 5-week integration plan documented in NOHO-OPS-INTEGRATION-PLAN-V2.md (2026-01-31 20:12 UTC): Week 1 - Restructure to /integrations/ route + Klaviyo schema, Week 2-3 - Migrate Poster/MEWS to new structure (no new code), Week 4 - BUILD Klaviyo integration (new feature), Week 5 - Testing & deployment. 8 ClickUp tasks created with specific IDs for tracking. (01/31/2026)
- Developer guide created at NOHO-OPS-DEVELOPER-GUIDE.md (2026-01-31 20:30 UTC): 19,000+ word comprehensive guide covering repository architecture, worktree strategy, 5-week integration plan, technical architecture (current vs target route structure), development workflow options (direct vs worktree), key files and locations, git strategy (what to do/not do), testing checklist, and quick reference commands. Committed to /home/desktop/clawd/ repository. (01/31/2026)
- Worktree strategy for Klaviyo development clarified (2026-01-31 20:30 UTC): Recommended to use /home/desktop/clawd/nomads-ops-sync-mews-klaviyo worktree as isolation environment for building Klaviyo integration. Worktree at same commit as mews-api (no new code yet), provides clean slate for Klaviyo development. Allows running both versions simultaneously (different ports) with separate Claude Code sessions. When complete, merge back to mews-api, then archive obsolete worktrees. (01/31/2026)
- Repository architecture clarification (2026-01-31 19:22 UTC): Three worktrees (nomads-ops-sync-poster-mews, nomads-ops-sync-mews-klaviyo, nomads-ops-sync-full-integration) are at same commit level (61b5a61) as main mews-api branch. These are obsolete isolation environments from past development. Poster and MEWS code already merged into mews-api. Klaviyo was never built in worktree - it's a clean slate for new development. (01/31/2026)
- Merge strategy recommendation (2026-01-31 19:39 UTC): Do NOT merge worktrees - they're obsolete and already at same commit as mews-api. Recommended approach: (1) Stay on mews-api branch (already has Poster + MEWS), (2) Build Klaviyo integration on top of mews-api, (3) Archive/delete worktrees when done. Worktrees are isolation environments for feature development, not integration sources. (01/31/2026)

### Integrations

- Poster POS sync functionality confirmed (2026-01-31 20:00 UTC): Poster sync pushes bar sales (shifts, food, merchandise) to MEWS with proper accounting category mapping. Maps Poster workshops to MEWS accounting categories (Bar Sales → 4000, Restaurant → 4100, Merchandise → 4200). Revenue recognized in MEWS financial reports with deposit reconciliation. Multi-hostel support with per-hostel credentials and spot mappings. Status: Already working in mews-api branch. (01/31/2026)

### Market

- GitHub repository verification completed (2026-01-31 19:03 UTC): klaviyo-mews-integration repo confirmed pushed at feature/marketing-automation-enhancement branch (commit fd31cc6). Main repo nomads-ops-center has branches mews-api, sync/poster-mews, sync/mews-klaviyo, sync/full-integration all pushed. User was looking at wrong branch (master) instead of feature branch. (01/31/2026)

### General

- Poster sync workflow detailed (2026-01-31 20:00 UTC): Confirmed Poster POS shift sales are pushed to MEWS and synced with MEWS accounting codes. Flow: Poster POS Shifts → Bar Sales/Food/Merchandise → Mapped to MEWS Accounting Categories → Posted to MEWS as Revenue Items → Financial Reports. Key features: Automatic shift sync, accounting category mapping (workshops to categories), revenue recognition, deposit reconciliation, per-hostel spot mappings. (01/31/2026)

## Recent Activity (Last 3 Months)

- **01/31/2026:** 5-week integration plan documented in NOHO-OPS-INTEGRATION-PLAN-V2.md (2026-01-31 20:12 UTC): Week 1 - Restructure to /integrations/ route + Klaviyo schema, Week 2-3 - Migrate Poster/MEWS to new structure (no new code), Week 4 - BUILD Klaviyo integration (new feature), Week 5 - Testing & deployment. 8 ClickUp tasks created with specific IDs for tracking.
- **01/31/2026:** Developer guide created at NOHO-OPS-DEVELOPER-GUIDE.md (2026-01-31 20:30 UTC): 19,000+ word comprehensive guide covering repository architecture, worktree strategy, 5-week integration plan, technical architecture (current vs target route structure), development workflow options (direct vs worktree), key files and locations, git strategy (what to do/not do), testing checklist, and quick reference commands. Committed to /home/desktop/clawd/ repository.
- **01/31/2026:** Worktree strategy for Klaviyo development clarified (2026-01-31 20:30 UTC): Recommended to use /home/desktop/clawd/nomads-ops-sync-mews-klaviyo worktree as isolation environment for building Klaviyo integration. Worktree at same commit as mews-api (no new code yet), provides clean slate for Klaviyo development. Allows running both versions simultaneously (different ports) with separate Claude Code sessions. When complete, merge back to mews-api, then archive obsolete worktrees.
- **01/31/2026:** Poster POS sync functionality confirmed (2026-01-31 20:00 UTC): Poster sync pushes bar sales (shifts, food, merchandise) to MEWS with proper accounting category mapping. Maps Poster workshops to MEWS accounting categories (Bar Sales → 4000, Restaurant → 4100, Merchandise → 4200). Revenue recognized in MEWS financial reports with deposit reconciliation. Multi-hostel support with per-hostel credentials and spot mappings. Status: Already working in mews-api branch.
- **01/31/2026:** Repository architecture clarification (2026-01-31 19:22 UTC): Three worktrees (nomads-ops-sync-poster-mews, nomads-ops-sync-mews-klaviyo, nomads-ops-sync-full-integration) are at same commit level (61b5a61) as main mews-api branch. These are obsolete isolation environments from past development. Poster and MEWS code already merged into mews-api. Klaviyo was never built in worktree - it's a clean slate for new development.
- **01/31/2026:** GitHub repository verification completed (2026-01-31 19:03 UTC): klaviyo-mews-integration repo confirmed pushed at feature/marketing-automation-enhancement branch (commit fd31cc6). Main repo nomads-ops-center has branches mews-api, sync/poster-mews, sync/mews-klaviyo, sync/full-integration all pushed. User was looking at wrong branch (master) instead of feature branch.
- **01/31/2026:** Merge strategy recommendation (2026-01-31 19:39 UTC): Do NOT merge worktrees - they're obsolete and already at same commit as mews-api. Recommended approach: (1) Stay on mews-api branch (already has Poster + MEWS), (2) Build Klaviyo integration on top of mews-api, (3) Archive/delete worktrees when done. Worktrees are isolation environments for feature development, not integration sources.
- **01/31/2026:** Worktree usage for Claude Code confirmed (2026-01-31 19:47 UTC): Trevor asked about using worktree for Claude Code to work on this project more. Confirmed that using worktree for Klaviyo development is smart approach - provides isolation, can run both versions simultaneously, safe experimentation, and allows separate Claude Code sessions. Recommended existing worktree nomads-ops-sync-mews-klaviyo or creating fresh one from mews-api.
- **01/31/2026:** Poster sync project status clarification (2026-01-31 19:55 UTC): Trevor asked about poster sync project. Clarified that Poster POS → MEWS sync is COMPLETE and working in mews-api branch. The nomads-ops-sync-poster-mews worktree is obsolete - same commit as mews-api because work was already merged. Poster sync functionality finished: shift reconciliation, accounting mapping, deposit reconciliation, multi-hostel support. No more work needed.
- **01/31/2026:** Poster sync workflow detailed (2026-01-31 20:00 UTC): Confirmed Poster POS shift sales are pushed to MEWS and synced with MEWS accounting codes. Flow: Poster POS Shifts → Bar Sales/Food/Merchandise → Mapped to MEWS Accounting Categories → Posted to MEWS as Revenue Items → Financial Reports. Key features: Automatic shift sync, accounting category mapping (workshops to categories), revenue recognition, deposit reconciliation, per-hostel spot mappings.

---

**Fact Summary:** 10 recent, 0 older, 0 historical
**Total Facts:** 10
