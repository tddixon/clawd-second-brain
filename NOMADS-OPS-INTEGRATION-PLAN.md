# Nomads Ops Center - External Integration Plan

**Status:** 📋 Planning Phase (MEWS-Klaviyo sync in progress)  
**Created:** 2026-01-30  
**For:** Ops Center Dashboard

---

## Overview

Goal: Integrate three external services into Nomads Ops Center dashboard as modular Next.js Route Groups:
1. **MEWS + Klaviyo Sync** — Guest lifecycle email automation
2. **Poster + MEWS Sync** — Revenue/POS data synchronization  
3. **Full Integration** — All three combined

### Current State

**Ops Center:** `/home/desktop/clawd/nomads-ops-center`
- Tech: Next.js 15 + Convex
- Navigation: Route Groups (dynamic sidebar)
- Existing: `mews/payments` section (MEWS PR #8 pending)
- PR #8: MEWS Connector API integration (awaiting merge)

**MEWS-Klaviyo Sync:** `/home/desktop/code/mews-klaviyo-integration`
- Status: Development phase, working on MEWS-Klaviyo sync

---

## Architecture

### File Structure

```
nomads-ops-center/
├── app/
│   └── (app)/[hostelSlug]/
│       ├── page.tsx                # Hostel main page
│       ├── settings/
│       │   └── integrations/page.tsx
│       ├── shifts/page.tsx         # Shift management
│       ├── deposits/page.tsx        # Deposit management
│       ├── reports/page.tsx         # Reports & analytics
│       └── mews/page.tsx          # MEWS integration (EXISTING)
│
├── components/
│   ├── app-sidebar.tsx           # Main navigation
│   └── [various]/
│
├── convex/
│   ├── mews/                    # MEWS functions
│   ├── poster/                   # NEW - Poster functions
│   ├── klaviyo/                   # NEW - Klaviyo functions
│   └── hostels/                  # Hostel data
│
└── config/
    └── nav.ts                    # Route configuration
```

### Module: MEWS + Klaviyo Sync (Route Group)

**Route:** `/integrations/klaviyo`  
**Location:** Sidebar nav group → Hostel integrations settings

**Convex Functions:**
```
convex/mews-klaviyo/
├── syncGuestToKlaviyo()          # Trigger on booking/check-in/out
├── fetchGuestEmailHistory()          # Query Klaviyo
├── mapKlaviyoEventsToMEWS()       # Lifecycle event mapping
└── klaviyoWebhook()                 # Handle Klaviyo webhooks
```

**Pages:**
- `/settings/integrations/page.tsx` — Add Klaviyo integration, configure API keys
- `/mews/page.tsx` — Show Klaviyo sync status in MEWS section

### Module: Poster + MEWS Sync (Route Group)

**Route:** `/integrations/poster`  
**Location:** Sidebar nav group → Hostel integrations settings

**Convex Functions:**
```
convex/poster-mews/
├── syncPosterRevenueToMEWS()        # Daily revenue sync
├── fetchPosterTransactions()          # Get sales data
├── mapPosterCategoriesToMEWS()       # Accounting category mapping
└── posterWebhook()                  # Handle Poster webhooks
```

**Pages:**
- `/settings/integrations/page.tsx` — Add Poster integration, configure API keys
- `/mews/page.tsx` — Show Poster sync status in MEWS section

### Module: Full Integration (Route Group)

**Route:** `/integrations/full`  
**Location:** Sidebar nav group → Hostel integrations settings

**Features:**
- Combined MEWS + Klaviyo + Poster sync dashboard
- Cross-service transaction reconciliation
- Guest lifecycle → Email → MEWS → Revenue pipeline
- Unified error handling and logging

---

## Implementation Plan

### Phase 1: Infrastructure (Week 1-2)

1. **Create worktrees** for parallel development:
   - ✅ `nomads-ops-sync-mews-klaviyo/`
   - ✅ `nomads-ops-sync-poster-mews/`
   - ✅ `nomads-ops-sync-full-integration/`

2. **Shared utilities** (`/home/desktop/clawd/scripts/lib/utils.js`):
   - retry() — Exponential backoff for API calls
   - log() — Structured logging with timestamps
   - readJSON() / writeJSON() — File I/O helpers

3. **Configuration** (`.env` file):
   - KLAVIYO_API_KEY
   - POSTER_API_KEY
   - CLICKUP_API_TOKEN (existing)
   - LOG_DIR

### Phase 2: MEWS + Klaviyo Sync (Week 3-4)

1. **Convex schema** for guest lifecycle:
   - `klaviyoSyncs` table — Track syncs (pending, success, error)
   - `klaviyoEvents` table — Audit log of all events sent

2. **Klaviyo integration** (clickup-agent.ts modification):
   - Add webhook handling functions
   - Add sync status tracking in Ops Center
   - Map MEWS events to Klaviyo triggers

3. **Pages created**:
   - `/settings/integrations/page.tsx` — Klaviyo settings panel
   - `/mews/page.tsx` — Klaviyo sync status indicator

**Milestone:** Guest booking → Klaviyo trigger → MEWS guest record updated → Ops Center shows status

### Phase 3: Poster + MEWS Sync (Week 5-6)

1. **Convex schema** for revenue sync:
   - `posterSyncs` table — Track daily sync runs
   - `revenueRecords` table — All synced revenue data
   - `syncErrors` table — Failed sync attempts

2. **Poster integration**:
   - Connect to Poster API for transaction data
   - Map Poster categories to MEWS accounting categories
   - Handle rate limiting and errors

3. **Pages created**:
   - `/settings/integrations/page.tsx` — Poster settings panel
   - `/mews/page.tsx` — Poster sync status indicator

**Milestone:** Daily revenue → MEWS accounting → Ops Center dashboard

### Phase 4: Full Integration & Testing (Week 7-8)

1. **Combined dashboard**:
   - Real-time sync status for all 3 services
   - Unified error handling across all integrations
   - Health monitoring per service

2. **Testing plan**:
   - Test each sync module independently
   - Test full integration workflow
   - Load testing with realistic data volumes

3. **Production rollout**:
   - Gradual rollout per hostel
   - Monitor for 2 weeks before full deployment
   - Rollback plan ready

---

## Key Decisions

✅ **Do NOT run convex deploy or push to GitHub** — Keep ops center isolated until integration is complete  
✅ **Use isolated worktrees** — Parallel development without conflicts  
✅ **Phase-based implementation** — Test before build  
✅ **Route Groups for modules** — Clean separation of concerns  
✅ **Sidebar nav** for integrations settings — Guest-facing UI for configuration  

---

## Dependencies

- Next.js 15 + Convex best practices
- MEWS API documentation
- Klaviyo API documentation  
- Poster API documentation
- ClickUp API (existing integration for task updates)

---

## Notes

- Wait for MEWS-Klaviyo sync to complete before starting Phases 2-4
- Each sync module should be independently testable
- Use `npm run worktree` command to work in specific module
- All changes tracked via ClickUp tasks in Ops Center project
