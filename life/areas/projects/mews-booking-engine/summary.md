# MEWS Booking Engine Integration

**Entity Type:** Project
**Status:** Active
**Start Date:** 2026-01-28
**Priority:** High

## Summary

Custom MEWS booking engine integration for Nomads Asia Website. Building custom room listing functionality on hostel /slug pages to replace standard MEWS widget.

## Current Status

- Research phase completed (MEWS API + Booking Engine API documented)
- Report generated: `/home/desktop/clawd/mews-api-research-report.md`
- Repo: Not yet identified (Next.js + Convex site)

## Key Components

- **MEWS Booking Engine API** - Frontend-facing for real-time booking flows
- **Endpoints needed:** `/hotels/get`, `/hotels/getAvailability`, `/reservations/getPricing`, `/reservationGroups/create`
- **No official SDK** - Will use direct fetch calls or generate client from OpenAPI spec

## Next Steps

- Identify Next.js + Convex project location
- Set up API client
- Implement room listing on /slug page

---

*Last updated: 2026-01-29*
