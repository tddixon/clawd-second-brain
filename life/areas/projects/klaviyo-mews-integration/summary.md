# Klaviyo-MEWS Integration

**Entity Type:** Project
**Status:** Active - Phase 2 Planning Complete
**Start Date:** 2026-01-28
**Repo:** `/home/desktop/klaviyo-mews-integration`
**Framework:** Get Shit Done (GSD)

## Summary

Self-hosted integration between MEWS (hostel PMS) and Klaviyo (email marketing) to replace expensive Zapier setup. Syncs guest reservation data to Klaviyo profiles for email flow triggers across multiple properties.

## Progress

**Phase 1: Foundation & Webhook Infrastructure** ✅ Completed
- Schema with 4 tables (properties, webhookEvents, processedWebhooks, syncLogs)
- HTTP webhook endpoint with auth + idempotent enqueue
- Async processor + status tracking
- 3 waves, all executed

**Phase 2: MEWS API Integration** 📋 Planned
- Wave 1: MEWS types, API client with rate limiting, reservation/customer fetch
- Wave 2: Enhanced webhook processor with MEWS API calls
- Ready to execute at 75% progress

**Remaining Phases:**
- Phase 3: Klaviyo Profile Sync
- Phase 4: Events Tracking
- Phase 5: Suppression & Scheduling
- Phase 6: Admin Dashboard

## Tech Stack

- **Backend:** Convex
- **Dashboard:** Next.js
- **Language:** TypeScript

## Claude Code Session

- **Session:** `klaviyo-mews` (tmux)
- **Model:** Opus 4.5
- **Mode:** YOLO, balanced profile

---

*Last updated: 2026-01-29*
