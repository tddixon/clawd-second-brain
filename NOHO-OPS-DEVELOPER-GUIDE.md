# Noho Ops Developer Guide

## Complete Integration Project Documentation

> This guide provides everything you need to understand the Noho Ops integration project, including current state, architecture, development workflow, and the Klaviyo integration plan.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Repository Architecture](#2-repository-architecture)
3. [Current State Deep Dive](#3-current-state-deep-dive)
4. [The 5-Week Integration Plan](#4-the-5-week-integration-plan)
5. [Technical Architecture](#5-technical-architecture)
6. [Development Workflow](#6-development-workflow)
7. [Key Files and Locations](#7-key-files-and-locations)
8. [Git Strategy](#8-git-strategy)
9. [Testing Checklist](#9-testing-checklist)
10. [Success Criteria](#10-success-criteria)

---

## 1. Executive Summary

### What is Noho Ops?

**Noho Ops** is a multi-property operations dashboard for Nomads hostels. It provides centralized management for:

- **Shift reconciliation** across multiple hostel locations
- **POS data sync** from Poster (point-of-sale system)
- **Payment processing** via MEWS PMS (Property Management System)
- **Deposit management** and Guardforce matching
- **Member management** with role-based access control
- **Financial reporting** and petty cash tracking

The system allows each hostel to have its own isolated data and credentials while sharing the same application infrastructure.

### Current Integration Status

| Integration | Status | Description |
|-------------|--------|-------------|
| **Poster POS** | ✅ Complete | Fully integrated - shifts, transactions, spot mappings |
| **MEWS PMS** | ✅ Complete | Fully integrated - payments, webhooks, Connector API |
| **Guardforce** | ✅ Complete | CSV upload and deposit matching |
| **Klaviyo** | ❌ Missing | Email marketing integration not yet built |

### The Goal

**Add Klaviyo email marketing integration** to enable:
- Guest segmentation based on booking history
- Automated email campaigns (pre-stay, post-stay, special offers)
- Event tracking for marketing automation
- Campaign performance analytics
- Lifecycle email management

---

## 2. Repository Architecture

### Main Repository

**Location:** `/home/desktop/nomads-ops-center`  
**Current Branch:** `mews-api`  
**Purpose:** Production codebase with Poster + MEWS fully integrated and working

#### What It Contains

The main repository is a Next.js 14 application with the following key components:

**Frontend (Next.js App Router):**
- `app/(app)/[hostelSlug]/` - Multi-tenant routes per hostel
- `app/(app)/[hostelSlug]/mews/payments/` - MEWS payment management
- `app/(app)/[hostelSlug]/settings/integrations/` - Integration credentials
- `app/(app)/[hostelSlug]/settings/spot-mappings/` - Poster terminal configuration
- `app/(app)/[hostelSlug]/shifts/` - Shift reconciliation UI
- `app/(app)/[hostelSlug]/deposits/` - Deposit management
- `app/(app)/[hostelSlug]/guardforce/` - Guardforce deposit matching

**Backend (Convex):**
- `convex/mews.ts` - MEWS payment processing (~89KB, ~2000 lines)
- `convex/mewsWebhook.ts` - Webhook event handlers (~42KB)
- `convex/mewsConnector.ts` - MEWS Connector API integration (~65KB)
- `convex/poster.ts` - Poster POS sync functions (~40KB)
- `convex/guardforce.ts` - Guardforce CSV matching
- `convex/schema.ts` - Database schema (~22KB)
- `convex/deposits.ts` - Deposit batch management
- `convex/shifts.ts` - Shift reconciliation logic (~88KB)

**Configuration:**
- `config/nav.ts` - Navigation menu structure
- `components/` - Reusable UI components
- Convex deployment with real-time database

### Worktrees (Git Worktrees Explained)

**What is a worktree?**
A Git worktree is a linked working directory that shares the same Git repository. It allows you to check out multiple branches at once without cloning the entire repository multiple times.

**Why do worktrees exist?**
- **Isolation:** Experiment on features without affecting main development branch
- **Parallel development:** Work on multiple features simultaneously
- **Safe testing:** Test integration changes while keeping stable code running
- **Context switching:** Switch between branches without committing/stashing

**Status Note:** As of now, there are **no active worktrees** in the repository. The `git worktree list` command only shows the main working directory.

#### Historical Worktrees (Not Currently Present)

**`nomads-ops-sync-poster-mews`**
- **History:** Originally created for Poster POS integration development
- **Purpose:** Isolated environment for Poster sync features
- **Current Status:** ❌ **OBSOLETE** - All Poster code is now in main repo
- **Why obsolete:** Poster integration is complete and merged to `mews-api` branch

**`nomads-ops-sync-mews-klaviyo`**
- **History:** Planned workspace for Klaviyo + MEWS integration
- **Purpose:** Clean slate for building Klaviyo features
- **Current Status:** ⏸️ **CLEAN SLATE** - Ready for Klaviyo development
- **Why important:** This should be the worktree used for Klaviyo work
- **Note:** Klaviyo integration does not exist yet in any repository

**`nomads-ops-sync-full-integration`**
- **History:** Planned for combining all integrations
- **Purpose:** Staging area for complete integration testing
- **Current Status:** ❌ **OBSOLETE** - No unique work in this worktree
- **Why obsolete:** Main repo already contains all integrated features

### Separate Repository

**`klaviyo-mews-integration`**
- **Location:** Not in main repo (separate project)
- **What this is:** A standalone Klaviyo + MEWS integration proof-of-concept
- **Branch Status:** `feature/marketing-automation-enhancement`
- **Relationship to Noho Ops:** This is **not** the same as Noho Ops Klaviyo integration
- **Purpose:** Reference implementation for Klaviyo + MEWS patterns
- **Note:** This is separate code, not directly integrated into Noho Ops

---

## 3. Current State Deep Dive

### What's Already Built ✅

#### 1. Poster POS Integration

**File:** `convex/poster.ts` (~40KB, ~1100 lines)

**Capabilities:**
- **Shift Synchronization:** Auto-fetches shifts from Poster POS API
- **Transaction Reconciliation:** Matches Poster transactions to MEWS payments
- **Deposit Tracking:** Tracks cash, card, and other payment types
- **Spot Mappings:** Maps Poster terminals to hostel locations
- **Accounting Categories:** Classifies transactions into expense categories
- **Variance Detection:** Identifies discrepancies between expected and actual
- **Multi-Hostel Support:** Each hostel has its own Poster credentials

**Key Functions:**
```typescript
// Sync shifts from Poster API
export const syncShifts = action({ ... });

// Get shift details with reconciliation
export const getShift = query({ ... });

// Update spot mappings
export const updateSpotMapping = mutation({ ... });
```

**UI Locations:**
- Settings: `/[hostelSlug]/settings/spot-mappings/`
- Dashboard: `/[hostelSlug]/shifts/`
- Reports: `/[hostelSlug]/reports/`

#### 2. MEWS PMS Integration

**File:** `convex/mews.ts` (~89KB, ~2400 lines)

**Capabilities:**
- **Payment Processing:** Syncs MEWS payments to local database
- **Order Management:** Tracks MEWS orders and charges
- **Tax Calculation:** Computes taxes and fees
- **Currency Support:** Handles multiple currencies
- **Guest Information:** Stores guest details for each payment
- **Refund Tracking:** Records refunds and adjustments
- **Multi-Property:** Supports multiple MEWS properties per hostel

**Key Functions:**
```typescript
// Fetch payments from MEWS API
export const fetchPayments = action({ ... });

// Process payment data
export const processPayment = action({ ... });

// Get payments for reconciliation
export const getPayments = query({ ... });
```

**UI Locations:**
- Payments: `/[hostelSlug]/mews/payments/`
- Settings: `/[hostelSlug]/settings/integrations/`

#### 3. MEWS Webhook Integration

**File:** `convex/mewsWebhook.ts` (~42KB, ~1200 lines)

**Capabilities:**
- **Webhook Endpoint:** Receives real-time MEWS event notifications
- **Event Processing:** Handles reservations, bookings, and payment events
- **Payload Storage:** Logs all webhook payloads for debugging
- **Event Mapping:** Maps MEWS events to Convex actions
- **Retry Logic:** Handles failed webhook deliveries
- **Security:** Validates webhook signatures

**Webhook Events Handled:**
- Reservation created/updated/cancelled
- Booking created/updated/cancelled
- Payment made/refunded
- Guest checked in/out

**API Route:** `app/api/mews-webhook/[slug]/route.ts`

#### 4. MEWS Connector API Integration

**File:** `convex/mewsConnector.ts` (~65KB, ~1800 lines)

**Capabilities:**
- **Connector API:** Uses MEWS Connector API for bulk operations
- **Report Generation:** Creates financial reports
- **Data Export:** Exports data for external systems
- **Synchronization:** Keeps MEWS data in sync with local database
- **Error Handling:** Robust error handling and logging
- **Rate Limiting:** Respects API rate limits

**Key Functions:**
```typescript
// Connect to MEWS Connector API
export const connectToConnector = action({ ... });

// Fetch report data
export const fetchReport = action({ ... });

// Sync connector data
export const syncConnectorData = action({ ... });
```

#### 5. Guardforce Integration

**File:** `convex/guardforce.ts` (~27KB)

**Capabilities:**
- **CSV Upload:** Parses Guardforce bank deposit CSV files
- **Deposit Matching:** Matches Guardforce deposits to Noho Ops deposits
- **Reconciliation:** Identifies unmatched deposits
- **User Prefix:** Configurable user prefix for deposit identification
- **Auto-Matching:** Automatically matches deposits when possible

**UI Locations:**
- Guardforce: `/[hostelSlug]/guardforce/`

#### 6. Multi-Hostel Support

**Architecture:**
- Each hostel has its own isolated data
- Per-hostel credentials stored in `hostels` table
- Route-based multi-tenancy (`/[hostelSlug]/`)
- Role-based access control per hostel

**Credentials Storage:**
- Poster access token (encrypted)
- MEWS client token (encrypted)
- MEWS access token (encrypted)
- Guardforce user prefix (plain text)

**Encryption:**
- Sensitive credentials encrypted before storage
- Decrypted only in Convex backend actions
- Never exposed to client-side code

### What's Missing ❌

#### Klaviyo Email Marketing Integration

**Not Yet Built:**

1. **Klaviyo API Client** - No integration with Klaviyo API
2. **Guest Segmentation** - No guest data sync to Klaviyo
3. **Campaign Management** - No UI for managing email campaigns
4. **Event Tracking** - No automatic event tracking for marketing automation
5. **Lifecycle Emails** - No automated email sequences (pre-stay, post-stay, etc.)
6. **Analytics Dashboard** - No campaign performance metrics

**What Needs to Be Built:**

**Backend (Convex):**
- `convex/klaviyo.ts` - Klaviyo integration functions
- `convex/lib/klaviyo.ts` - Klaviyo API client wrapper
- Database tables for Klaviyo sync logs, campaigns, guest profiles
- Encryption for Klaviyo API keys

**Frontend (Next.js):**
- `/[hostelSlug]/integrations/klaviyo/` - Klaviyo dashboard
- `/[hostelSlug]/integrations/klaviyo/campaigns/` - Campaign management
- `/[hostelSlug]/integrations/klaviyo/segments/` - Guest segmentation
- UI for connecting Klaviyo, syncing guests, viewing campaigns

**Schema Additions:**
```typescript
// Klaviyo tables needed
klaviyoSyncLog: defineTable({ ... });
klaviyoCampaigns: defineTable({ ... });
klaviyoGuestProfiles: defineTable({ ... });
```

---

## 4. The 5-Week Integration Plan

This plan is detailed in `NOHO-OPS-INTEGRATION-PLAN-V2.md`. Here's the executive summary:

### Week 1: Restructure to `/integrations/` Route + Klaviyo Schema

**Goals:**
1. Create new `/integrations/` route structure
2. Add Klaviyo database schema tables
3. Set up Klaviyo API client foundation
4. Update navigation configuration

**Tasks:**
- Create `app/(app)/[hostelSlug]/integrations/` directory
- Create integration hub page
- Add Klaviyo tables to `convex/schema.ts`
- Create `convex/lib/klaviyo.ts` API client skeleton
- Update `config/nav.ts` with new navigation

**Deliverables:**
- New route structure in place
- Klaviyo database schema deployed
- Navigation shows Integrations section
- Klaviyo API client library ready

### Week 2: Migrate Poster (Move Only, No New Code)

**Goals:**
1. Move Poster integration pages to `/integrations/poster/`
2. Update navigation links
3. Add redirects for backward compatibility
4. Test Poster functionality at new URLs

**Tasks:**
- Move `settings/spot-mappings/` → `integrations/poster/spot-mappings/`
- Create `integrations/poster/page.tsx` dashboard
- Update all references to Poster URLs
- Add temporary redirects from old URLs
- Test Poster sync at new location

**Deliverables:**
- Poster fully moved to `/integrations/poster/`
- All Poster functionality working at new URL
- Redirects in place for old URLs
- Navigation updated

### Week 3: Migrate MEWS (Move Only, No New Code)

**Goals:**
1. Move MEWS integration pages to `/integrations/mews/`
2. Create MEWS dashboard
3. Add webhook logs page
4. Test MEWS functionality at new URLs

**Tasks:**
- Move `mews/payments/` → `integrations/mews/payments/`
- Create `integrations/mews/page.tsx` dashboard
- Create `integrations/mews/webhook-logs/` page
- Update all references to MEWS URLs
- Add temporary redirects from old URLs
- Test MEWS webhooks and payments at new location

**Deliverables:**
- MEWS fully moved to `/integrations/mews/`
- All MEWS functionality working at new URL
- Webhook logs page functional
- Redirects in place for old URLs
- Navigation updated

### Week 4: BUILD Klaviyo Integration (NEW FEATURE - This Is the Work)

**Goals:**
1. Install Klaviyo SDK or API client
2. Build Klaviyo sync functions
3. Create Klaviyo UI pages
4. Implement guest sync to Klaviyo
5. Build campaign management UI

**Tasks:**
- Install `klaviyo-api` package
- Implement Klaviyo credential storage (encrypted)
- Build guest sync from MEWS/Poster to Klaviyo
- Create event tracking for bookings, check-ins, etc.
- Build campaigns listing page
- Build segments/guest list page
- Implement Klaviyo API call functions
- Add Klaviyo status to integration hub

**Deliverables:**
- Klaviyo fully integrated
- Guest sync working
- Campaign management UI complete
- Event tracking operational
- Klaviyo accessible at `/integrations/klaviyo/`

### Week 5: Testing & Deployment

**Goals:**
1. Comprehensive testing of all integrations
2. Bug fixes and polish
3. Remove temporary redirects
4. Deploy to production
5. Archive obsolete worktrees

**Tasks:**
- Test all Poster functionality at new URL
- Test all MEWS functionality at new URL
- Test Klaviyo integration end-to-end
- Verify permissions work correctly
- Test navigation and routing
- Remove temporary redirects
- Update documentation
- Deploy schema changes to production
- Deploy code to production
- Archive worktrees (if any exist)

**Deliverables:**
- All integrations working correctly
- No bugs or regressions
- Clean codebase ready for production
- Documentation updated
- Old worktrees archived

---

## 5. Technical Architecture

### Current Route Structure

```
app/(app)/[hostelSlug]/
├── adjustments/               # Manager adjustments UI
├── components/                # Dashboard components
├── deposits/                  # Deposit management
│   ├── ready/                 # Ready-to-deposit list
│   └── [depositId]/          # Individual deposit view
├── guardforce/                # Guardforce CSV upload
├── mews/
│   └── payments/              # MEWS payments page (WILL MOVE)
├── reports/                   # Financial reports
│   ├── petty-cash/            # Petty cash tracking
│   └── ...                    # Other reports
├── settings/
│   ├── integrations/          # Integration settings (WILL SIMPLIFY)
│   ├── members/               # Member management
│   ├── spot-mappings/         # Poster terminal config (WILL MOVE)
│   └── ...                    # Other settings
├── shifts/                    # Shift reconciliation
└── page.tsx                   # Dashboard home
```

### Target Route Structure

```
app/(app)/[hostelSlug]/
├── adjustments/               # Manager adjustments (unchanged)
├── deposits/                  # Deposit management (unchanged)
├── guardforce/                # Guardforce CSV upload (unchanged)
├── reports/                   # Financial reports (unchanged)
├── settings/
│   ├── integrations/          # Credential management only (SIMPLIFIED)
│   └── members/               # Member management (unchanged)
├── shifts/                    # Shift reconciliation (unchanged)
├── integrations/              # NEW: Integration hub
│   ├── page.tsx               # Integration overview/status
│   ├── layout.tsx             # Shared integration layout
│   ├── poster/                # NEW LOCATION
│   │   ├── page.tsx           # Poster dashboard
│   │   └── spot-mappings/     # Moved from settings
│   │       └── page.tsx
│   ├── mews/                  # NEW LOCATION
│   │   ├── page.tsx           # MEWS dashboard
│   │   ├── payments/          # Moved from /mews/payments
│   │   │   └── page.tsx
│   │   └── webhook-logs/      # NEW: Webhook debugging
│   │       └── page.tsx
│   └── klaviyo/               # NEW: Klaviyo integration
│       ├── page.tsx           # Klaviyo dashboard
│       ├── campaigns/        # NEW: Campaign management
│       │   └── page.tsx
│       ├── segments/         # NEW: Guest segmentation
│       │   └── page.tsx
│       └── settings/         # NEW: Klaviyo-specific settings
│           └── page.tsx
└── page.tsx                   # Dashboard home (unchanged)
```

### Database Schema Additions Needed

#### Klaviyo Tables to Add to `convex/schema.ts`

```typescript
// 1. Klaviyo Sync Log
klaviyoSyncLog: defineTable({
  hostelId: v.id("hostels"),
  syncedAt: v.number(),
  syncType: v.union(
    v.literal("full_guest_sync"),
    v.literal("campaign_sync"),
    v.literal("event_sync"),
    v.literal("segment_sync")
  ),
  recordsProcessed: v.number(),
  recordsSucceeded: v.number(),
  recordsFailed: v.number(),
  errorMessage: v.optional(v.string()),
  status: v.union(v.literal("success"), v.literal("partial"), v.literal("failed")),
  durationMs: v.optional(v.number()),
})
  .index("by_hostelId", ["hostelId"])
  .index("by_hostel_syncedAt", ["hostelId", "syncedAt"]),

// 2. Klaviyo Campaigns (cached from API)
klaviyoCampaigns: defineTable({
  hostelId: v.id("hostels"),
  klaviyoCampaignId: v.string(),
  name: v.string(),
  status: v.string(), // "Draft", "Sent", "Scheduled", "Queued"
  subject: v.optional(v.string()),
  createdAt: v.number(),
  sentAt: v.optional(v.number()),
  scheduledAt: v.optional(v.number()),
  recipientCount: v.optional(v.number()),
  openCount: v.optional(v.number()),
  clickCount: v.optional(v.number()),
  revenue: v.optional(v.number()),
  lastSyncedAt: v.number(),
})
  .index("by_hostelId", ["hostelId"])
  .index("by_hostel_campaignId", ["hostelId", "klaviyoCampaignId"]),

// 3. Klaviyo Guest Profiles (mapping)
klaviyoGuestProfiles: defineTable({
  hostelId: v.id("hostels"),
  guestEmail: v.string(),
  guestName: v.optional(v.string()),
  klaviyoProfileId: v.string(),
  isInList: v.boolean(),
  listIds: v.array(v.string()), // Multiple lists
  lastSyncedAt: v.number(),
  totalSpent: v.optional(v.number()), // Aggregated spend
  lastBookingAt: v.optional(v.number()),
  customProperties: v.optional(v.record(v.string(), v.any())),
})
  .index("by_hostelId", ["hostelId"])
  .index("by_hostel_email", ["hostelId", "guestEmail"])
  .index("by_klaviyoProfileId", ["klaviyoProfileId"]),

// 4. Klaviyo Events (event tracking)
klaviyoEvents: defineTable({
  hostelId: v.id("hostels"),
  eventName: v.string(), // "Booking Confirmed", "Check-in", "Post-stay", etc.
  guestEmail: v.string(),
  klaviyoProfileId: v.optional(v.string()),
  eventProperties: v.optional(v.record(v.string(), v.any())),
  timestamp: v.number(),
  syncedToKlaviyo: v.boolean(),
  errorMessage: v.optional(v.string()),
})
  .index("by_hostelId", ["hostelId"])
  .index("by_hostel_timestamp", ["hostelId", "timestamp"])
  .index("by_guest", ["guestEmail", "timestamp"]),
```

#### Update Hostel Schema for Klaviyo Credentials

```typescript
// In the hostels table definition, add:
hostels: defineTable({
  // ... existing fields ...
  
  // Klaviyo Integration (NEW)
  klaviyoPublicApiKey: v.optional(v.string()),
  klaviyoPrivateApiKey: v.optional(v.string()), // Encrypted
  klaviyoListId: v.optional(v.string()), // Default list for guests
  klaviyoEnabled: v.optional(v.boolean()), // Integration enabled flag
})
```

#### Add Permissions for Klaviyo

```typescript
// In vPermission union type, add:
export const vPermission = v.union(
  // ... existing permissions ...
  v.literal("Manage Integrations"),  // Manage all integrations (exists)
  v.literal("View Klaviyo"),         // NEW: View Klaviyo data
  v.literal("Manage Klaviyo"),       // NEW: Manage Klaviyo campaigns
);
```

### Navigation Structure Changes

**Current Navigation (`config/nav.ts`):**
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

**Target Navigation:**
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
    title: "Integrations",
    icon: IconPlug,
    url: `/${hostelSlug}/integrations`,
    items: [
      { title: "Overview", url: `/${hostelSlug}/integrations` },
      { title: "Poster POS", url: `/${hostelSlug}/integrations/poster` },
      { title: "MEWS PMS", url: `/${hostelSlug}/integrations/mews` },
      { title: "Klaviyo", url: `/${hostelSlug}/integrations/klaviyo` },
    ],
  },
  {
    title: "Settings",
    items: [
      "General",
      "Members", 
      "Integrations" // Simplified to credentials only
    ]
  }
]
```

---

## 6. Development Workflow

### Recommended Approach for Claude Code

You have two options for development:

#### Option A: Work Directly on `mews-api` Branch

**Pros:**
- Simple, no extra setup
- Changes immediately available
- No need to switch between directories

**Cons:**
- Risk of breaking main working branch
- Can't run two versions simultaneously
- Harder to isolate experimental changes

**How to do it:**
```bash
cd /home/desktop/nomads-ops-center
git checkout mews-api
# Work directly on this branch
```

#### Option B: Use Worktree for Isolation (Recommended) ⭐

**Pros:**
- Safe experimentation without affecting main branch
- Can run both versions simultaneously for comparison
- Easy to discard changes if things go wrong
- Separate Claude Code sessions for different contexts

**Cons:**
- Requires initial setup
- Need to manage multiple directories
- Extra step to merge changes back

**How to do it:**

```bash
# 1. Navigate to main repository
cd /home/desktop/nomads-ops-center

# 2. Create a new worktree for Klaviyo development
git worktree add ../nomads-ops-klaviyo-dev feature/klaviyo-integration

# 3. Navigate to the new worktree
cd ../nomads-ops-klaviyo-dev

# 4. Verify you're on the correct branch
git branch

# 5. Start development
# Work in this isolated environment
```

**Verify worktree creation:**
```bash
# From main repo, list worktrees
cd /home/desktop/nomads-ops-center
git worktree list

# Output should show:
# /home/desktop/nomads-ops-center  b918639 [mews-api]
# /home/desktop/nomads-ops-klaviyo-dev  b918639 [feature/klaviyo-integration]
```

### Why Use a Worktree?

1. **Isolation:** If Klaviyo integration breaks something, the main `mews-api` branch remains untouched
2. **Parallel Development:** You can keep the stable version running while testing new features
3. **Context Switching:** Easy to switch between stable and experimental code
4. **Safe Experimentation:** Can discard the worktree entirely if things go wrong
5. **Separate Sessions:** Each worktree can have its own Claude Code session with different context

### Workflow Summary

**Recommended:**
1. Create worktree: `git worktree add ../nomads-ops-klaviyo-dev feature/klaviyo-integration`
2. Work in worktree for all development
3. Test changes in isolation
4. Merge feature branch to `mews-api` when ready
5. Delete worktree after merge

**Alternative (not recommended):**
1. Work directly on `mews-api` branch
2. Make all changes in main branch
3. Risk of breaking stable code

### Installing Klaviyo SDK

When building the Klaviyo integration:

```bash
# Option 1: Use official Klaviyo SDK
npm install klaviyo-api

# Option 2: Use direct REST API (no additional dependency)
# Just use fetch() with proper headers
```

### Environment Setup

**Convex Development:**
```bash
# Start Convex development server
npx convex dev

# This will:
# - Start local Convex backend
# - Generate TypeScript types
# - Watch for schema changes
```

**Next.js Development:**
```bash
# Start Next.js development server
npm run dev

# App will be available at http://localhost:3000
```

### Testing Locally

1. **Start Convex:** `npx convex dev`
2. **Start Next.js:** `npm run dev`
3. **Open browser:** Navigate to `http://localhost:3000/[hostelSlug]/integrations`
4. **Test each integration:**
   - Poster: Sync shifts, view spot mappings
   - MEWS: View payments, check webhook logs
   - Klaviyo: Connect API, sync guests, view campaigns

---

## 7. Key Files and Locations

### Existing Poster/MEWS Code

#### Backend (Convex Functions)

**`convex/poster.ts`** (~40KB, ~1100 lines)
- Poster POS API integration
- Shift synchronization
- Transaction processing
- Spot mapping management

**`convex/mews.ts`** (~89KB, ~2400 lines)
- MEWS PMS integration
- Payment processing
- Order management
- Tax calculation

**`convex/mewsWebhook.ts`** (~42KB, ~1200 lines)
- Webhook event handlers
- Event mapping to Convex
- Payload logging
- Retry logic

**`convex/mewsConnector.ts`** (~65KB, ~1800 lines)
- MEWS Connector API client
- Report generation
- Data synchronization
- Rate limiting

**`convex/guardforce.ts`** (~27KB)
- CSV upload parsing
- Deposit matching
- Reconciliation
- User prefix configuration

**`convex/schema.ts`** (~22KB)
- All database table definitions
- Index definitions
- Validation rules
- Type definitions

**`convex/shifts.ts`** (~88KB)
- Shift reconciliation logic
- Transaction matching
- Variance calculation
- Shift adjustments

**`convex/deposits.ts`** (~28KB)
- Deposit batch management
- Deposit status tracking
- Deposit adjustments
- Petty cash transfers

#### Frontend (Next.js Pages)

**`app/(app)/[hostelSlug]/mews/payments/page.tsx`**
- MEWS payments list and details
- Payment reconciliation UI
- Filters and search
- **WILL MOVE TO:** `app/(app)/[hostelSlug]/integrations/mews/payments/page.tsx`

**`app/(app)/[hostelSlug]/settings/spot-mappings/page.tsx`**
- Poster terminal configuration
- Spot mapping UI
- Terminal to location mapping
- **WILL MOVE TO:** `app/(app)/[hostelSlug]/integrations/poster/spot-mappings/page.tsx`

**`app/(app)/[hostelSlug]/settings/integrations/page.tsx`**
- Integration credential management
- Poster, MEWS, Guardforce configuration
- **WILL SIMPLIFY TO:** Credentials only (move dashboards to `/integrations/`)

### Settings/Configuration

**`config/nav.ts`**
- Navigation menu structure
- Route definitions
- **WILL UPDATE:** Add Integrations section, move Poster/MEWS to new section

**`components/nav-main.tsx`**
- Sidebar navigation component
- Renders navigation from `config/nav.ts`
- **WILL UPDATE:** New Integrations menu styling

**`components/app-sidebar.tsx`**
- Application sidebar layout
- Navigation container
- **MAY UPDATE:** Integration menu improvements

**`app/(app)/[hostelSlug]/layout.tsx`**
- Hostel-specific layout
- Sidebar rendering
- Authentication checks

### API Routes

**`app/api/mews-webhook/[slug]/route.ts`**
- MEWS webhook endpoint
- Receives POST requests from MEWS
- Calls `convex/mewsWebhook.ts` handlers

### New Files to Create

**Backend:**
```
convex/
├── klaviyo.ts                    # Klaviyo integration functions
├── lib/
│   └── klaviyo.ts                # Klaviyo API client wrapper
└── schema.ts                     # UPDATE: Add Klaviyo tables
```

**Frontend:**
```
app/(app)/[hostelSlug]/integrations/
├── page.tsx                      # Integration hub
├── layout.tsx                    # Shared layout
├── poster/
│   ├── page.tsx                  # Poster dashboard (NEW)
│   └── spot-mappings/
│       └── page.tsx              # Moved from settings
├── mews/
│   ├── page.tsx                  # MEWS dashboard (NEW)
│   ├── payments/
│   │   └── page.tsx              # Moved from /mews/payments
│   └── webhook-logs/
│       └── page.tsx              # Webhook logs (NEW)
└── klaviyo/
    ├── page.tsx                  # Klaviyo dashboard (NEW)
    ├── campaigns/
    │   └── page.tsx              # Campaign management (NEW)
    ├── segments/
    │   └── page.tsx              # Guest segmentation (NEW)
    └── settings/
        └── page.tsx              # Klaviyo settings (NEW)
```

### Documentation

**`/home/desktop/clawd/NOHO-OPS-INTEGRATION-PLAN-V2.md`**
- Complete 5-week integration plan
- Detailed phase breakdown
- File modification summary

**`/home/desktop/nomads-ops-center/convex/README.md`**
- Convex backend documentation
- Function organization
- Development guidelines

**`/home/desktop/nomads-ops-center/MEWS_CONNECTOR_IMPROVEMENTS.md`**
- MEWS Connector API details
- Integration improvements
- Reference implementation

---

## 8. Git Strategy

### What NOT to Do ❌

1. **Don't Merge Obsolete Worktrees**
   - `sync/poster-mews` branch is obsolete - Poster is already in main
   - `sync/full-integration` branch is obsolete - no unique work
   - These branches are at same commit as main, nothing to merge

2. **Don't Delete Worktrees Until Klaviyo Is Complete**
   - Wait until Klaviyo integration is fully tested and deployed
   - Archive worktrees after merging to main
   - Keep them for reference if issues arise

3. **Don't Work on `main` Branch Directly**
   - Use `mews-api` branch as your working branch
   - `main` should remain stable
   - Create PR from `mews-api` to `main` when done

4. **Don't Ignore Schema Migrations**
   - Test schema changes in development first
   - Deploy schema updates before code that uses them
   - Verify data integrity after migration

5. **Don't Break Existing Functionality**
   - Test Poster and MEWS after each change
   - Ensure backward compatibility during migration
   - Keep redirects in place until verified

### What TO Do ✅

1. **Work on `mews-api` Branch (or Feature Branch)**
   ```bash
   # Option A: Work directly on mews-api
   git checkout mews-api
   git pull origin mews-api
   
   # Option B: Create feature branch from mews-api
   git checkout -b feature/klaviyo-integration mews-api
   ```

2. **Use Worktree for Isolation (Recommended)**
   ```bash
   cd /home/desktop/nomads-ops-center
   git worktree add ../nomads-ops-klaviyo-dev feature/klaviyo-integration
   cd ../nomads-ops-klaviyo-dev
   ```

3. **Commit Frequently with Clear Messages**
   ```bash
   git add .
   git commit -m "feat: create integrations route structure"
   git commit -m "feat: add Klaviyo database schema"
   git commit -m "refactor: move Poster to /integrations/poster"
   git commit -m "refactor: move MEWS to /integrations/mews"
   git commit -m "feat: implement Klaviyo guest sync"
   ```

4. **Test Before Merging**
   - Test all existing functionality
   - Test new Klaviyo features
   - Verify navigation works
   - Check permissions

5. **Create Pull Request When Ready**
   ```bash
   # Push to remote
   git push origin feature/klaviyo-integration
   
   # Create PR from GitHub UI
   # From: feature/klaviyo-integration
   # To: mews-api
   
   # Request review and merge
   ```

6. **Merge to `mews-api`, Then to `main`**
   ```bash
   # After PR is approved and merged to mews-api
   git checkout mews-api
   git pull origin mews-api
   
   # Then merge mews-api to main
   git checkout main
   git pull origin main
   git merge mews-api
   git push origin main
   ```

7. **Archive Worktrees After Klaviyo Complete**
   ```bash
   # Remove worktrees when done
   cd /home/desktop/nomads-ops-center
   git worktree remove ../nomads-ops-klaviyo-dev
   git worktree list  # Verify removal
   ```

### Git Branch Naming

**Recommended Naming:**
- `feature/klaviyo-integration` - Main Klaviyo development
- `feature/integrations-restructure` - Route restructuring
- `feature/poster-migration` - Moving Poster to new structure
- `feature/mews-migration` - Moving MEWS to new structure
- `fix/integration-navigation` - Navigation bug fixes
- `chore/update-schema` - Schema updates

### Git Workflow Summary

```
main (stable)
  └── mews-api (working branch)
      └── feature/klaviyo-integration (worktree - isolated)
```

**Flow:**
1. Develop in `feature/klaviyo-integration` (worktree)
2. Test thoroughly in isolation
3. Create PR to merge into `mews-api`
4. Review and merge
5. Test in `mews-api` branch
6. Merge `mews-api` to `main` when ready
7. Deploy to production

---

## 9. Testing Checklist

### Pre-Migration Testing

**Before Moving Routes:**
- [ ] Take database backup
- [ ] Document current URLs and their behavior
- [ ] Test all Poster functionality works currently
- [ ] Test all MEWS functionality works currently
- [ ] Note current navigation structure
- [ ] Verify permissions work correctly

### During Migration Testing

**After Creating `/integrations/` Structure:**
- [ ] Integration hub page renders correctly
- [ ] Navigation shows "Integrations" section
- [ ] Integration hub shows status cards
- [ ] Klaviyo tables created in database
- [ ] Schema deployed without errors

**After Moving Poster:**
- [ ] Poster sync still works at `/[hostelSlug]/integrations/poster/`
- [ ] Spot mappings accessible at new URL
- [ ] Old URL `/[hostelSlug]/settings/spot-mappings/` redirects
- [ ] Poster dashboard shows correct data
- [ ] Shift sync functions work
- [ ] Permissions respected for Poster pages

**After Moving MEWS:**
- [ ] MEWS payments accessible at `/[hostelSlug]/integrations/mews/payments/`
- [ ] Old URL `/[hostelSlug]/mews/payments/` redirects
- [ ] MEWS dashboard shows correct data
- [ ] Webhook logs page functional
- [ ] Webhooks still process correctly
- [ ] Permissions respected for MEWS pages

**After Building Klaviyo:**
- [ ] Klaviyo dashboard renders
- [ ] API credentials save correctly (encrypted)
- [ ] Guest sync completes successfully
- [ ] Events sync to Klaviyo
- [ ] Campaign list loads
- [ ] Campaign details show correctly
- [ ] Segments page functional
- [ ] Permissions respected for Klaviyo pages

### Post-Migration Testing

**After Completing All Migrations:**
- [ ] All Poster functionality works at new URLs
- [ ] All MEWS functionality works at new URLs
- [ ] Klaviyo integration fully functional
- [ ] Navigation works correctly
- [ ] No broken links in app
- [ ] Permissions work for all roles
- [ ] No data loss occurred
- [ ] Performance is acceptable
- [ ] Mobile responsive

### Edge Cases

- [ ] What happens if Klaviyo API is down?
- [ ] What happens if credentials are invalid?
- [ ] What happens if sync fails partway?
- [ ] What happens with large guest lists?
- [ ] What happens if webhook payload is malformed?
- [ ] What happens if user doesn't have permissions?

### Regression Testing

- [ ] Shift reconciliation still works
- [ ] Deposit management still works
- [ ] Guardforce matching still works
- [ ] Member management still works
- [ ] Reports still generate
- [ ] Petty cash still works
- [ ] Adjustments still work

### User Acceptance Testing (UAT)

**With Stakeholders:**
- [ ] Poster team verifies POS integration
- [ ] MEWS team verifies PMS integration
- [ ] Marketing team verifies Klaviyo integration
- [ ] Managers verify navigation and UX
- [ ] Finance verifies data accuracy

---

## 10. Success Criteria

### Must Have (Non-Negotiable)

1. **✅ All Existing Poster Functionality Works at New URL**
   - Shift sync: `/[hostelSlug]/integrations/poster/`
   - Spot mappings: `/[hostelSlug]/integrations/poster/spot-mappings/`
   - No data loss during migration
   - All features work exactly as before

2. **✅ All Existing MEWS Functionality Works at New URL**
   - Payments: `/[hostelSlug]/integrations/mews/payments/`
   - Webhooks still process correctly
   - All features work exactly as before
   - No data loss during migration

3. **✅ New Klaviyo Integration Connects and Syncs Guests**
   - Klaviyo credentials can be configured
   - Guest sync completes successfully
   - Events are tracked in Klaviyo
   - Campaigns can be viewed
   - Segments can be managed

4. **✅ Navigation Is Intuitive and Discoverable**
   - Users can easily find all integrations
   - Navigation structure makes sense
   - No broken links or dead ends
   - Mobile-friendly navigation

5. **✅ No Data Loss During Migration**
   - All Poster data intact
   - All MEWS data intact
   - No duplicate or orphaned records
   - Database schema migrated correctly

### Should Have (Important but Flexible)

6. **Klaviyo Campaign Management UI**
   - List campaigns with metrics
   - View campaign details
   - Create new campaigns (optional)
   - Edit existing campaigns (optional)

7. **Klaviyo Guest Segmentation**
   - Segment guests by booking history
   - Segment guests by spend
   - Export segments
   - Custom segment filters

8. **Webhook Logs Page**
   - View recent webhooks
   - See processing status
   - Reprocess failed webhooks
   - View raw payloads

9. **Integration Status Dashboard**
   - Real-time connection status
   - Last sync time for each integration
   - Sync health indicators
   - Quick actions

10. **Performance Optimization**
    - Page load times < 2 seconds
    - Efficient database queries
    - Optimized API calls
    - Minimal re-renders

### Nice to Have (Bonus Features)

11. **Klaviyo Event Analytics**
    - Track email opens/clicks
    - Revenue attribution
    - Conversion funnels
    - A/B testing insights

12. **Automated Email Sequences**
    - Pre-stay emails
    - Post-stay follow-ups
    - Special offers
    - Re-engagement campaigns

13. **Advanced Guest Profiling**
    - Predictive analytics
    - Churn prediction
    - Lifetime value calculation
    - Guest journey mapping

14. **Integration Monitoring**
    - Error notifications
    - Performance metrics
    - Usage analytics
    - Health checks

15. **Bulk Operations**
    - Bulk guest sync
    - Bulk campaign creation
    - Bulk segment updates
    - Bulk event tracking

### Definition of Done

**Project is considered complete when:**

- [ ] All "Must Have" criteria are met
- [ ] Most "Should Have" criteria are met (at least 6/10)
- [ ] No critical bugs remaining
- [ ] Code is peer-reviewed
- [ ] Documentation is updated
- [ ] Deployed to production successfully
- [ ] Stakeholders have signed off
- [ ] Training materials provided

### Sign-Off

**Required Approvals:**
- [ ] Technical Lead approval
- [ ] Product Owner approval
- [ ] Security approval (credential encryption verified)
- [ ] Performance approval (load testing passed)
- [ ] User acceptance (stakeholder testing passed)

---

## Appendix A: Quick Reference

### Essential Commands

```bash
# Start development
npx convex dev      # Start Convex backend
npm run dev         # Start Next.js frontend

# Git operations
git worktree add ../name branch    # Create worktree
git worktree list                  # List worktrees
git worktree remove ../name        # Remove worktree

# Convex operations
npx convex dev --once     # Run schema migrations once
npx convex dashboard      # Open Convex dashboard
npx convex function name  # Run function

# Testing
npm test                 # Run tests
npm run lint             # Run linter
npm run type-check       # TypeScript check
```

### File Locations Quick Reference

```
Main Repository: /home/desktop/nomads-ops-center
Documentation: /home/desktop/clawd/

Key Files:
- convex/schema.ts                    - Database schema
- convex/poster.ts                    - Poster integration
- convex/mews.ts                      - MEWS integration
- convex/mewsWebhook.ts               - Webhooks
- convex/mewsConnector.ts             - Connector API
- config/nav.ts                       - Navigation

Will Create:
- convex/klaviyo.ts                   - Klaviyo integration
- convex/lib/klaviyo.ts               - Klaviyo API client
- app/(app)/[hostelSlug]/integrations/*  - Integration pages
```

### Environment Variables

```bash
# Required
NEXT_PUBLIC_CONVEX_URL=
CONVEX_DEPLOYMENT=

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

ENCRYPTION_KEY=

# Optional (for Klaviyo development)
KLAVIYO_TEST_PUBLIC_API_KEY=
KLAVIYO_TEST_PRIVATE_API_KEY=
```

### Dependencies

```json
{
  "convex": "^1.13.2",
  "@clerk/nextjs": "^6.36.5",
  "date-fns": "^2.30.0",
  "zod": "^3.22.4",
  "@tabler/icons-react": "^2.x",
  "recharts": "^2.x",
  "klaviyo-api": "^0.x"  // Will add
}
```

---

## Appendix B: Troubleshooting

### Common Issues

**Issue: Convex schema deployment fails**
```
Solution: 
1. Check for syntax errors in schema.ts
2. Verify table names don't conflict
3. Run npx convex dev to see detailed error
4. Check Convex dashboard for migration logs
```

**Issue: Klaviyo API returns 401 Unauthorized**
```
Solution:
1. Verify API keys are correct
2. Check encryption/decryption of credentials
3. Test API keys in Klaviyo dashboard
4. Check if API key has required permissions
```

**Issue: Webhooks not processing**
```
Solution:
1. Check webhook logs in Convex dashboard
2. Verify webhook URL is accessible
3. Check MEWS webhook configuration
4. Verify webhook signature validation
```

**Issue: Navigation links broken after migration**
```
Solution:
1. Check config/nav.ts for correct URLs
2. Verify page files exist at correct paths
3. Check for typos in route parameters
4. Clear Next.js cache: rm -rf .next
```

### Getting Help

- **Convex Docs:** https://docs.convex.dev/
- **Next.js Docs:** https://nextjs.org/docs
- **Klaviyo API:** https://developers.klaviyo.com/
- **Clerk Auth:** https://clerk.com/docs

### Debug Mode

```bash
# Enable Convex debug logging
CONVEX_ENABLE_DEBUG_LOGGING=true npx convex dev

# Enable Next.js verbose logging
DEBUG=* npm run dev

# Check Convex function logs
npx convex logs
```

---

## Conclusion

This developer guide provides everything you need to understand and work on the Noho Ops integration project. The main goal is to add Klaviyo email marketing integration while restructuring existing Poster and MEWS integrations into a unified `/integrations/` route structure.

**Key Takeaways:**

1. **Main repository** (`nomads-ops-center`, branch `mews-api`) contains all working code
2. **Klaviyo integration** needs to be built from scratch
3. **Use a worktree** for safe, isolated development
4. **Follow the 5-week plan** for structured approach
5. **Test thoroughly** before deploying to production

**Next Steps:**

1. Create worktree: `git worktree add ../nomads-ops-klaviyo-dev feature/klaviyo-integration`
2. Start with Week 1: Restructure routes and add schema
3. Build Klaviyo integration in Weeks 3-4
4. Test and deploy in Week 5

Good luck with the integration! 🚀

---

*Document Version: 1.0*  
*Last Updated: January 31, 2025*  
*Author: AI Assistant*  
*Based on NOHO-OPS-INTEGRATION-PLAN-V2.md*
