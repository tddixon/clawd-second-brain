# NOHO-OPS Integration Plan v2

## Executive Summary

This document outlines the plan for integrating MEWS Poster and MEWS Klaviyo functionality into the main Noho-Ops repository. After analyzing all four repositories, the main `nomads-ops-center` (mews-api branch) already contains all Poster and MEWS functionality. The worktrees (`nomads-ops-sync-poster-mews`, `nomads-ops-sync-mews-klaviyo`, `nomads-ops-sync-full-integration`) are currently at the same commit level as main and serve as isolation environments for future development.

**Key Finding**: Klaviyo integration does not yet exist in any repository and would need to be built from scratch.

---

## Repository Analysis

### 1. Main Noho-Ops Repository (`/home/desktop/nomads-ops-center`)

**Current Branch**: `mews-api`

#### Folder Structure
```
app/
├── (app)/[hostelSlug]/
│   ├── adjustments/          # Manager adjustments UI
│   ├── components/           # Dashboard components
│   ├── deposits/             # Deposit management
│   ├── guardforce/           # Guardforce deposit matching
│   ├── mews/
│   │   └── payments/         # MEWS payments page
│   ├── reports/              # Daily reports, petty cash
│   ├── settings/
│   │   ├── integrations/     # Poster, MEWS, Guardforce settings
│   │   ├── members/          # Member management
│   │   └── spot-mappings/    # Poster spot configuration
│   └── shifts/               # Shift reconciliation
├── api/mews-webhook/[slug]/  # MEWS webhook endpoint
└── ...

convex/
├── schema.ts                 # Database schema
├── mews.ts                   # MEWS payment processing (~2800 lines)
├── mewsWebhook.ts            # Webhook handlers
├── mewsConnector.ts          # MEWS Connector API
├── poster.ts                 # Poster POS sync
├── lib/poster.ts             # Poster API client
├── shifts.ts                 # Shift management
├── users/hostels/settings.ts # Settings mutations/queries
└── ...

components/
├── nav-main.tsx              # Sidebar navigation
└── app-sidebar.tsx           # App sidebar

config/nav.ts                 # Navigation configuration
```

#### Convex Schema Tables

**Core Tables:**
- `hostels` - Hostel settings including encrypted credentials
- `users`, `members`, `roles`, `permissions` - Auth/RBAC
- `invites`, `messages` - Collaboration

**Shift Reconciliation Tables:**
- `shifts` - Poster shifts with reconciliation data
- `shiftTransactions` - Individual transactions within shifts
- `mewsPayments` - MEWS payment records
- `deposits` - Deposit batches
- `topUps`, `shiftAdjustments`, `pettyCashTransfers` - Corrections

**MEWS Integration Tables:**
- `mewsWebhooks` - Raw webhook payload storage
- `mewsReportUploads` - Manual upload tracking
- `mewsConnectorSyncLog` - API sync logging
- `mewsApiCallLog` - API call debugging

**Guardforce Integration:**
- `guardforceUploads` - CSV upload tracking
- `guardforceDeposits` - Individual deposits

**Configuration Tables:**
- `posterSpotMappings` - Terminal to location mapping
- `expenseCategories` - Transaction classification
- `activityLogs` - Audit trail

#### Configuration (Hostel Schema)
```typescript
// Poster POS
posterAccountId?: string
posterAccessToken?: string  // Encrypted

// MEWS PMS
mewsClientToken?: string    // Encrypted
mewsAccessToken?: string    // Encrypted

// Settings
varianceThreshold?: number
timezone?: string
guardforceUserPrefix?: string
autoCombineVariances?: {...}
shiftReportEmails?: {...}
```

#### Navigation Structure (config/nav.ts)
```typescript
[
  { title: "Dashboard", url: "/[hostelSlug]" },
  { 
    title: "Reports", 
    items: [
      "1 - Shift Checks",
      "2 - To Be Deposited", 
      "3 - Record Deposits",
      "4 - Guardforce Matching",
      "Petty Cash",
      "Manager Adjustments"
    ]
  },
  {
    title: "Settings",
    items: [
      "General",
      "Members", 
      "Integrations",
      "Spot Mappings",
      "MEWS Payments"
    ]
  }
]
```

#### Dependencies
- Next.js 14, React 18, TypeScript 5
- Convex (backend + database)
- Clerk (authentication)
- Radix UI + Tailwind CSS
- date-fns, recharts

---

### 2. MEWS Poster Repository (`/home/desktop/clawd/nomads-ops-sync-poster-mews`)

**Current Branch**: `sync/poster-mews`

#### Status
- Worktree is at same commit as main (no unique changes)
- Originally intended for Poster integration development
- All Poster functionality now exists in main repo

#### Files Present (identical to main)
- All app routes
- All convex functions
- Poster sync functionality in `convex/poster.ts`
- Spot mappings management

---

### 3. MEWS Klaviyo Repository (`/home/desktop/clawd/nomads-ops-sync-mews-klaviyo`)

**Current Branch**: `sync/mews-klaviyo`

#### Status
- Worktree is at same commit as main
- **Klaviyo integration does NOT exist yet**
- This is a clean slate for building Klaviyo integration

#### What Would Be Needed for Klaviyo
- Klaviyo API client library (`klaviyo-api` or direct REST)
- New database tables for:
  - Klaviyo credentials (encrypted)
  - Email campaign tracking
  - Guest segmentation data
  - Event tracking (booking, check-in, etc.)
- UI for:
  - Klaviyo settings/configuration
  - Campaign performance dashboard
  - Guest list sync

---

### 4. Full Integration Repository (`/home/desktop/clawd/nomads-ops-sync-full-integration`)

**Current Branch**: `sync/full-integration`

#### Status
- Worktree is at same commit as main
- No additional integration work present
- Can be used as staging area for combining features

---

## Integration Strategy

### Current State Assessment

| Feature | Status | Location |
|---------|--------|----------|
| Poster POS Sync | ✅ Complete | `convex/poster.ts` |
| MEWS Payments | ✅ Complete | `convex/mews.ts` |
| MEWS Webhook | ✅ Complete | `convex/mewsWebhook.ts` |
| MEWS Connector API | ✅ Complete | `convex/mewsConnector.ts` |
| Guardforce Matching | ✅ Complete | `convex/guardforce.ts` |
| Klaviyo Integration | ❌ Not Started | N/A |

### Goal Architecture

```
app/(app)/[hostelSlug]/
├── integrations/
│   ├── page.tsx              # Integration overview
│   ├── poster/               # Poster-specific pages
│   │   ├── page.tsx          # Poster dashboard
│   │   └── spot-mappings/    # Moved from settings
│   ├── mews/
│   │   ├── page.tsx          # MEWS overview
│   │   ├── payments/         # Existing payments page
│   │   └── webhook-logs/     # Webhook debugging
│   └── klaviyo/              # NEW: Klaviyo integration
│       ├── page.tsx          # Klaviyo dashboard
│       ├── campaigns/        # Campaign management
│       └── segments/         # Guest segmentation
├── settings/
│   └── integrations/         # Simplified to credential management
└── ...
```

---

## Detailed Integration Plan

### Phase 1: Restructure Existing Code (Week 1)

#### 1.1 Move Integration Pages to New Structure

**Create new routes:**
```
app/(app)/[hostelSlug]/integrations/
├── page.tsx                  # Integration hub
├── poster/
│   └── page.tsx              # Poster dashboard/analytics
├── mews/
│   ├── page.tsx              # MEWS dashboard
│   └── payments/
│       └── page.tsx          # Move from /mews/payments
└── layout.tsx                # Shared integration layout
```

**Update navigation** (`config/nav.ts`):
```typescript
{
  title: "Integrations",
  url: `/${hostelSlug}/integrations`,
  icon: IconPlug,
  items: [
    { title: "Overview", url: `/${hostelSlug}/integrations` },
    { title: "Poster POS", url: `/${hostelSlug}/integrations/poster` },
    { title: "MEWS PMS", url: `/${hostelSlug}/integrations/mews` },
    { title: "Klaviyo", url: `/${hostelSlug}/integrations/klaviyo` },
  ],
}
```

**Remove from Settings menu:**
- "Integrations" settings page becomes credential-only
- "MEWS Payments" moves to Integrations section
- "Spot Mappings" moves to Poster section

#### 1.2 Consolidate Settings

**Update** `app/(app)/[hostelSlug]/settings/integrations/page.tsx`:
- Keep only credential management (Poster token, MEWS tokens, Guardforce prefix)
- Remove report upload (move to integration-specific pages)
- Add "Open Dashboard" links to integration pages

### Phase 2: Database Schema Additions (Week 1-2)

#### 2.1 Add Klaviyo Support to Hostel Schema

**Update** `convex/schema.ts`:

```typescript
hostels: defineTable({
  // ... existing fields ...
  
  // Klaviyo Integration (NEW)
  klaviyoPublicApiKey: v.optional(v.string()),
  klaviyoPrivateApiKey: v.optional(v.string()), // Encrypted
  klaviyoListId: v.optional(v.string()), // Default list for guests
})
```

#### 2.2 Create Klaviyo Tables

```typescript
// Klaviyo sync tracking
klaviyoSyncLog: defineTable({
  hostelId: v.id("hostels"),
  syncedAt: v.number(),
  syncType: v.union(
    v.literal("full_guest_sync"),
    v.literal("campaign_sync"),
    v.literal("event_sync")
  ),
  recordsProcessed: v.number(),
  recordsSucceeded: v.number(),
  recordsFailed: v.number(),
  errorMessage: v.optional(v.string()),
  status: v.union(v.literal("success"), v.literal("partial"), v.literal("failed")),
})
  .index("by_hostelId", ["hostelId"])
  .index("by_hostel_syncedAt", ["hostelId", "syncedAt"]),

// Klaviyo campaigns (cached from API)
klaviyoCampaigns: defineTable({
  hostelId: v.id("hostels"),
  klaviyoCampaignId: v.string(),
  name: v.string(),
  status: v.string(), // "Draft", "Sent", "Scheduled"
  createdAt: v.number(),
  sentAt: v.optional(v.number()),
  recipientCount: v.optional(v.number()),
  openCount: v.optional(v.number()),
  clickCount: v.optional(v.number()),
  revenue: v.optional(v.number()),
  lastSyncedAt: v.number(),
})
  .index("by_hostelId", ["hostelId"])
  .index("by_hostel_campaignId", ["hostelId", "klaviyoCampaignId"]),

// Guest-Klaviyo profile mapping
klaviyoGuestProfiles: defineTable({
  hostelId: v.id("hostels"),
  guestEmail: v.string(),
  klaviyoProfileId: v.string(),
  isInList: v.boolean(),
  lastSyncedAt: v.number(),
  customProperties: v.optional(v.record(v.string(), v.string())),
})
  .index("by_hostelId", ["hostelId"])
  .index("by_hostel_email", ["hostelId", "guestEmail"]),
```

#### 2.3 Add Permissions for Integrations

**Update** `convex/schema.ts`:

```typescript
export const vPermission = v.union(
  // ... existing permissions ...
  v.literal("Manage Integrations"),  // NEW: Manage all integrations
  v.literal("View Klaviyo"),         // NEW: View Klaviyo data
  v.literal("Manage Klaviyo"),       // NEW: Manage Klaviyo campaigns
);
```

### Phase 3: Poster Integration Module (Week 2)

#### 3.1 Create Poster Dashboard

**New file:** `app/(app)/[hostelSlug]/integrations/poster/page.tsx`

Features:
- Connection status card
- Recent sync status
- Spot mappings management (move from settings)
- Quick sync button
- Sync history/log viewer

#### 3.2 Move Spot Mappings

**Move:** `app/(app)/[hostelSlug]/settings/spot-mappings/page.tsx`
**To:** `app/(app)/[hostelSlug]/integrations/poster/spot-mappings/page.tsx`

Add redirect at old location for backward compatibility.

#### 3.3 Update Poster Convex Functions

**Update:** `convex/poster.ts`

Add new queries:
```typescript
// Get Poster sync status/history
export const getSyncStatus = query({
  args: { hostelId: v.id("hostels") },
  returns: v.object({
    lastSyncAt: v.optional(v.number()),
    totalShifts: v.number(),
    last7DaysShifts: v.number(),
    isConnected: v.boolean(),
  }),
  // ...
});
```

### Phase 4: MEWS Integration Module (Week 2-3)

#### 4.1 Create MEWS Dashboard

**New file:** `app/(app)/[hostelSlug]/integrations/mews/page.tsx`

Features:
- Connection status
- Webhook health status
- Recent payments summary
- Connector API sync status
- Link to payments page

#### 4.2 Move MEWS Payments

**Move:** `app/(app)/[hostelSlug]/mews/payments/page.tsx`
**To:** `app/(app)/[hostelSlug]/integrations/mews/payments/page.tsx`

Update imports and navigation references.

#### 4.3 Create Webhook Logs Page

**New file:** `app/(app)/[hostelSlug]/integrations/mews/webhook-logs/page.tsx`

Features:
- List recent webhooks received
- Show processing status
- Reprocess failed webhooks
- View raw payload

### Phase 5: Klaviyo Integration (Week 3-4) [NEW FEATURE]

#### 5.1 Install Dependencies

```bash
npm install klaviyo-api
```

#### 5.2 Create Klaviyo API Client

**New file:** `convex/lib/klaviyo.ts`

```typescript
// Klaviyo API client with credential management
interface KlaviyoCredentials {
  publicApiKey: string;
  privateApiKey: string;
}

export async function getKlaviyoClient(ctx: any, hostelId: string) {
  // Get and decrypt credentials
  // Return configured API client
}

export async function syncGuestsToKlaviyo(
  credentials: KlaviyoCredentials,
  guests: Guest[]
) {
  // Batch import guests to Klaviyo
}

export async function getCampaignMetrics(
  credentials: KlaviyoCredentials,
  campaignId: string
) {
  // Fetch campaign performance
}
```

#### 5.3 Create Klaviyo Convex Functions

**New file:** `convex/klaviyo.ts`

```typescript
import { action, query, mutation } from "./functions";
import { internal } from "./_generated/api";

// Sync guests from MEWS/Poster to Klaviyo
export const syncGuests = action({
  args: {
    hostelId: v.id("hostels"),
    syncType: v.union(v.literal("all"), v.literal("recent")),
  },
  handler: async (ctx, { hostelId, syncType }) => {
    // Get credentials
    // Fetch guests from recent shifts/bookings
    // Sync to Klaviyo
    // Log results
  },
});

// Fetch campaigns
export const listCampaigns = query({
  args: { hostelId: v.id("hostels") },
  returns: v.array(v.object({
    id: v.string(),
    name: v.string(),
    status: v.string(),
    sentAt: v.optional(v.number()),
    metrics: v.optional(v.object({
      recipients: v.number(),
      opens: v.number(),
      clicks: v.number(),
    })),
  })),
  handler: async (ctx, { hostelId }) => {
    // Check permission
    // Return cached campaigns
  },
});

// Update credentials
export const updateCredentials = mutation({
  args: {
    hostelId: v.id("hostels"),
    publicApiKey: v.string(),
    privateApiKey: v.string(),
    listId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Encrypt and store credentials
  },
});
```

#### 5.4 Create Klaviyo UI

**New files:**
```
app/(app)/[hostelSlug]/integrations/klaviyo/
├── page.tsx                  # Klaviyo dashboard
├── campaigns/
│   └── page.tsx              # Campaign list
├── segments/
│   └── page.tsx              # Guest segments
└── settings/
    └── page.tsx              # Klaviyo-specific settings
```

### Phase 6: Settings Consolidation (Week 4)

#### 6.1 Update Settings Integrations Page

**Update:** `app/(app)/[hostelSlug]/settings/integrations/page.tsx`

Simplify to credential management only:
- Poster: Token input only
- MEWS: Client/Access tokens only
- Guardforce: Prefix only
- Klaviyo: API keys only

Add "Manage →" buttons that link to integration-specific pages.

#### 6.2 Create Integration Hub

**New file:** `app/(app)/[hostelSlug]/integrations/page.tsx`

Cards for each integration:
- Status indicator (connected/disconnected)
- Last sync time
- Quick actions
- Link to detailed page

### Phase 7: Testing & Migration (Week 5)

#### 7.1 Database Migration

Convex handles schema changes automatically, but need to:
1. Deploy new schema to dev environment
2. Test with sample data
3. Deploy to production

#### 7.2 Route Redirects

Add temporary redirects for moved pages:
```typescript
// app/(app)/[hostelSlug]/mews/payments/page.tsx
import { redirect } from "next/navigation";

export default function RedirectPage({ params }: { params: { hostelSlug: string } }) {
  redirect(`/${params.hostelSlug}/integrations/mews/payments`);
}
```

#### 7.3 Testing Checklist

- [ ] Poster sync still works after move
- [ ] MEWS webhooks still process
- [ ] Payments page accessible at new URL
- [ ] Settings credentials save correctly
- [ ] Navigation works correctly
- [ ] Permissions respected

---

## File Modification Summary

### New Files to Create

```
app/(app)/[hostelSlug]/integrations/
├── page.tsx
├── layout.tsx
├── poster/
│   ├── page.tsx
│   └── spot-mappings/
│       └── page.tsx
├── mews/
│   ├── page.tsx
│   ├── payments/
│   │   └── page.tsx
│   └── webhook-logs/
│       └── page.tsx
└── klaviyo/
    ├── page.tsx
    ├── campaigns/
    │   └── page.tsx
    └── segments/
        └── page.tsx

convex/
├── klaviyo.ts                    # NEW
├── lib/klaviyo.ts                # NEW
└── schema.ts                     # UPDATE - add Klaviyo tables

config/nav.ts                     # UPDATE - new navigation
```

### Files to Move

| From | To |
|------|-----|
| `app/(app)/[hostelSlug]/mews/payments/page.tsx` | `app/(app)/[hostelSlug]/integrations/mews/payments/page.tsx` |
| `app/(app)/[hostelSlug]/settings/spot-mappings/page.tsx` | `app/(app)/[hostelSlug]/integrations/poster/spot-mappings/page.tsx` |

### Files to Update

```
app/(app)/[hostelSlug]/settings/integrations/page.tsx    # Simplify to credentials only
convex/schema.ts                                         # Add Klaviyo tables and permissions
convex/poster.ts                                         # Add sync status queries
convex/users/hostels/settings.ts                         # Add Klaviyo credential functions
components/app-sidebar.tsx                               # May need integration menu updates
config/nav.ts                                            # Update navigation structure
```

---

## Environment Variables

### Current (Already in Main)

```bash
# Convex
CONVEX_DEPLOYMENT=
NEXT_PUBLIC_CONVEX_URL=

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# Encryption
ENCRYPTION_KEY=

# MEWS (if using Connector API)
MEWS_CONNECTOR_CLIENT_TOKEN=
MEWS_CONNECTOR_ACCESS_TOKEN=
```

### New for Klaviyo

```bash
# Optional: Default Klaviyo credentials for testing
KLAVIYO_TEST_PUBLIC_API_KEY=
KLAVIYO_TEST_PRIVATE_API_KEY=
```

---

## Dependencies

### Current (package.json)

```json
{
  "convex": "^1.13.2",
  "@clerk/nextjs": "^6.36.5",
  "date-fns": "^2.30.0",
  "zod": "^3.22.4",
  // ... etc
}
```

### Add for Klaviyo

```bash
npm install klaviyo-api
# OR use direct REST API (no additional dependency)
```

---

## Risk Assessment & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Route changes break bookmarks | Medium | Add redirects, update internal links |
| Schema migration fails | High | Test in dev first, backup data |
| Klaviyo API changes | Low | Abstract behind client lib, monitor API |
| Feature bloat in navigation | Medium | Use collapsible sections, prioritize by usage |
| Permission regression | High | Thorough testing of all permission checks |

---

## Success Criteria

1. ✅ All existing Poster functionality works at new URL
2. ✅ All existing MEWS functionality works at new URL
3. ✅ Settings page simplified but credentials still work
4. ✅ New Klaviyo integration connects and syncs guests
5. ✅ Navigation is intuitive and discoverable
6. ✅ No data loss during migration
7. ✅ All permissions work correctly

---

## Appendix: Worktree Cleanup Recommendation

After integration is complete:

```bash
# Archive or delete worktrees (they're no longer needed)
cd /home/desktop/clawd
rm -rf nomads-ops-sync-poster-mews
rm -rf nomads-ops-sync-mews-klaviyo  
rm -rf nomads-ops-sync-full-integration

# Keep only the main repo
cd /home/desktop/nomads-ops-center
# Continue development on mews-api branch
```

---

*Document Version: 2.0*
*Last Updated: January 2025*
*Author: AI Assistant*
