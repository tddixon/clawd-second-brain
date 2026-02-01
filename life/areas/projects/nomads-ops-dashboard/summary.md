# Nomads Ops Dashboard

**Type:** projects
**Last Updated:** 2026-02-01

## Current Context

### General

- Location: /home/desktop/nomads-ops-center (renamed/consolidated 2026-01-30) (01/30/2026)
- Code audit completed (2026-01-30) - generated CODE_AUDIT_REPORT.md with 8 critical improvements, 5 consolidation opportunities, 4 error scenarios (01/30/2026)
- UI components created: Button, Input, Label, Badge, Card, DropdownMenu, Tooltip, Separator, Progress (01/29/2026)

### Integrations

- MEWS Connector API integration completed Phase 1 (2026-01-30). Branch: mews-api. PR #8 created. (01/30/2026)
- MEWS Connector API features: polling-based payment collection, 15-minute cron schedule, manual 'Poll MEWS Now' button for debugging, per-hostel credentials, AccessToken-only auth (01/30/2026)
- MEWS improvements planned (2026-01-30): N+1 query fixes, duplicate payment race condition fix, transaction isolation, merge webhook + API modules, soft delete standardization (01/30/2026)
- Phase 2 in progress (2026-01-30): Consolidating mewsWebhook.ts into mewsConnector.ts, ensuring both webhook and API polling work simultaneously with shared deduplication logic (01/30/2026)

### Decisions

- Git identity decision (2026-01-30): Trevor wants separate git identity for Clawd/subagent commits to distinguish from his own commits (01/30/2026)

### Projects

- Integration plan document created (2026-01-30 18:53 UTC): NOMADS-OPS-INTEGRATION-PLAN.md at /home/desktop/clawd/. 4-phase implementation plan for MEWS+Klaviyo+Poster sync into ops center as modular Next.js Route Groups. 3 isolated worktrees created for parallel development: nomads-ops-sync-mews-klaviyo, nomads-ops-sync-poster-mews, nomads-ops-sync-full-integration (01/30/2026)
- Integration decision (2026-01-30 18:53 UTC): Trevor decided to save integration plan only, not execute - still finishing development on MEWS-Klaviyo sync and does not want to combine until it's done (01/30/2026)
- Project created 2026-01-29 - Operations Dashboard for Nomads Hostels (01/29/2026)

### Tasks

- Features: Real-time property overview, task management, inventory tracking, staff management (01/29/2026)
- Convex backend with properties, propertyStats, tasks, inventory, staff, alerts tables (01/29/2026)

## Recent Activity (Last 3 Months)

- **01/30/2026:** Location: /home/desktop/nomads-ops-center (renamed/consolidated 2026-01-30)
- **01/30/2026:** MEWS Connector API integration completed Phase 1 (2026-01-30). Branch: mews-api. PR #8 created.
- **01/30/2026:** MEWS Connector API features: polling-based payment collection, 15-minute cron schedule, manual 'Poll MEWS Now' button for debugging, per-hostel credentials, AccessToken-only auth
- **01/30/2026:** Code audit completed (2026-01-30) - generated CODE_AUDIT_REPORT.md with 8 critical improvements, 5 consolidation opportunities, 4 error scenarios
- **01/30/2026:** MEWS improvements planned (2026-01-30): N+1 query fixes, duplicate payment race condition fix, transaction isolation, merge webhook + API modules, soft delete standardization
- **01/30/2026:** Phase 2 in progress (2026-01-30): Consolidating mewsWebhook.ts into mewsConnector.ts, ensuring both webhook and API polling work simultaneously with shared deduplication logic
- **01/30/2026:** Git identity decision (2026-01-30): Trevor wants separate git identity for Clawd/subagent commits to distinguish from his own commits
- **01/30/2026:** Integration plan document created (2026-01-30 18:53 UTC): NOMADS-OPS-INTEGRATION-PLAN.md at /home/desktop/clawd/. 4-phase implementation plan for MEWS+Klaviyo+Poster sync into ops center as modular Next.js Route Groups. 3 isolated worktrees created for parallel development: nomads-ops-sync-mews-klaviyo, nomads-ops-sync-poster-mews, nomads-ops-sync-full-integration
- **01/30/2026:** Integration decision (2026-01-30 18:53 UTC): Trevor decided to save integration plan only, not execute - still finishing development on MEWS-Klaviyo sync and does not want to combine until it's done
- **01/29/2026:** Project created 2026-01-29 - Operations Dashboard for Nomads Hostels

---

**Fact Summary:** 13 recent, 0 older, 0 historical
**Total Facts:** 14
