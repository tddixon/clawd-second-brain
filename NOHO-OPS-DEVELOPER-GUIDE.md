# Noho Ops Developer Guide

Complete guide for working on the Noho Ops integration project, including Poster POS, MEWS PMS, and Klaviyo email marketing.

---

## Executive Summary

**Noho Ops** is the operations dashboard for Nomads hostels - a multi-property management system handling shift reconciliation, payment processing, and integrations with third-party services.

### Current Integration Status

| Integration | Status | Notes |
|-------------|--------|-------|
| **Poster POS** | ✅ Complete | Shift sync, accounting mapping, deposit reconciliation |
| **MEWS PMS** | ✅ Complete | Payments, webhooks, Connector API |
| **Klaviyo** | ❌ Not Built | This is the remaining work |

### The Goal

Add **Klaviyo email marketing integration** to Noho Ops, enabling:
- Guest segmentation based on booking/visit data
- Automated lifecycle email campaigns
- Campaign performance tracking
- Two-way sync with MEWS/Poster data

---

## Repository Architecture

### Main Repository

**Location:** `/home/desktop/nomads-ops-center`
**Current Branch:** `mews-api`
**Purpose:** Primary development branch containing all working integrations

The `mews-api` branch contains:
- ✅ Poster POS integration (shift reconciliation)
- ✅ MEWS PMS integration (payments, webhooks)
- ✅ Guardforce deposit matching
- ✅ Multi-hostel credential management
- ❌ Klaviyo (not yet built)

### Worktrees

Worktrees are Git's way of having multiple branches checked out simultaneously. They allow you to work on different features in isolation without switching branches or stashing changes.

#### Worktree 1: `nomads-ops-sync-poster-mews`
**Location:** `/home/desktop/clawd/nomads-ops-sync-poster-mews`
**Branch:** `sync/poster-mews`
**Status:** ⚠️ **OBSOLETE**

This worktree was created during the initial Poster integration development. It's now at the same commit as `mews-api` because all Poster code was merged there.

**Action:** Can be archived/deleted after Klaviyo is complete.

#### Worktree 2: `nomads-ops-sync-mews-klaviyo`
**Location:** `/home/desktop/clawd/nomads-ops-sync-mews-klaviyo`
**Branch:** `sync/mews-klaviyo`
**Status:** ✅ **CLEAN SLATE - Use for Klaviyo development**

This worktree was intended for Klaviyo development but was never used. It's at the same base commit as the others but contains no Klaviyo code. This makes it an ideal isolation environment for building the Klaviyo integration.

**Action:** Use this for Klaviyo development work.

#### Worktree 3: `nomads-ops-sync-full-integration`
**Location:** `/home/desktop/clawd/nomads-ops-sync-full-integration`
**Branch:** `sync/full-integration`
**Status:** ⚠️ **OBSOLETE**

This was a staging area for combining all features. Not needed now that everything is in `mews-api`.

**Action:** Can be archived/deleted.

### Separate Repository: Klaviyo MEWS Integration

**Location:** `/home/desktop/klaviyo-mews-integration`
**Repo:** `github.com/tddixon/klaviyo-mews-integration`
**Branch:** `feature/marketing-automation-enhancement`
**Status:** Active development (Phase 6)

This is a **separate project** - a standalone Klaviyo-MEWS integration with its own architecture. It includes:
- Marketing automation features
- Dashboard UI
- Analytics and segmentation
- A/B testing

**Relationship to Noho Ops:** This is a different codebase. Eventually, the Klaviyo functionality from here may inform or be integrated into Noho Ops, but they are currently separate projects.

---

## Current State Deep Dive

### What's Already Built

#### 1. Poster POS Sync (`convex/poster.ts`)

**Features:**
- **Shift Sync:** Automatically syncs Poster shifts to MEWS
- **Accounting Mapping:** Maps Poster workshops to MEWS accounting categories
  - Bar Sales → 4000 - Bar Revenue
  - Food Sales → 4100 - Food Revenue
  - Merchandise → 4200 - Retail Sales
- **Revenue Recognition:** Posts sales as revenue items in MEWS
- **Deposit Reconciliation:** Matches Poster revenue with bank deposits
- **Multi-Hostel:** Per-hostel credentials and spot mappings

**Key Files:**
- `convex/poster.ts` - Main sync functions
- `convex/lib/poster.ts` - API client
- `app/(app)/[hostelSlug]/settings/spot-mappings/` - UI for terminal mappings

#### 2. MEWS PMS Integration

**Features:**
- **Payment Processing:** Polls and processes MEWS payments
- **Webhook Handling:** Real-time updates from MEWS
- **Connector API:** Direct API integration for payment collection
- **Towel Deposit Filtering:** Special handling for towel deposits
- **Manual Controls:** "Poll MEWS Now" button for debugging

**Key Files:**
- `convex/mews.ts` - Payment processing (~2800 lines)
- `convex/mewsWebhook.ts` - Webhook handlers
- `convex/mewsConnector.ts` - Connector API
- `app/(app)/[hostelSlug]/mews/payments/` - Payments UI

#### 3. Guardforce Integration

**Features:**
- CSV upload for deposit tracking
- Automatic deposit matching
- Variance detection and reporting

**Key Files:**
- `convex/guardforce.ts`

#### 4. Shift Reconciliation System

**Database Tables:**
- `shifts` - Poster shifts with reconciliation data
- `shiftTransactions` - Individual transactions
- `mewsPayments` - MEWS payment records
- `deposits` - Deposit batches
- `topUps`, `shiftAdjustments`, `pettyCashTransfers` - Corrections

### What's Missing

#### Klaviyo Email Marketing Integration

**Features to Build:**
- **Guest Sync:** Sync guest data from MEWS/Poster to Klaviyo
- **Segmentation:** Create segments based on visit history, booking data
- **Campaign Management:** Create, send, track email campaigns
- **Lifecycle Automation:** Welcome emails, review requests, re-engagement
- **Performance Dashboard:** Open rates, click rates, revenue attribution

**Required Database Tables:**
```typescript
// Klaviyo credentials
klaviyoPublicApiKey?: string
klaviyoPrivateApiKey?: string  // Encrypted
klaviyoListId?: string

// Klaviyo sync tracking
klaviyoSyncLog: {
  hostelId: v.id("hostels"),
  syncedAt: v.number(),
  syncType: v.union(v.literal("full_guest_sync"), v.literal("campaign_sync")),
  recordsProcessed: v.number(),
  recordsSucceeded: v.number(),
  status: v.union(v.literal("success"), v.literal("partial"), v.literal("failed"))
}

// Klaviyo campaigns cache
klaviyoCampaigns: {
  hostelId: v.id("hostels"),
  klaviyoCampaignId: v.string(),
  name: v.string(),
  status: v.string(),
  sentAt: v.optional(v.number()),
  recipientCount: v.optional(v.number()),
  openCount: v.optional(v.number()),
  clickCount: v.optional(v.number())
}

// Guest-Klaviyo profile mapping
klaviyoGuestProfiles: {
  hostelId: v.id("hostels"),
  guestEmail: v.string(),
  klaviyoProfileId: v.string(),
  isInList: v.boolean(),
  lastSyncedAt: v.number()
}
```

---

## The 5-Week Integration Plan

Based on `NOHO-OPS-INTEGRATION-PLAN-V2.md`:

### Week 1: Restructure + Klaviyo Schema
**Goal:** Create new `/integrations/` route structure and database schema

**Tasks:**
- Create `app/(app)/[hostelSlug]/integrations/` route
- Add Klaviyo tables to `convex/schema.ts`
- Add "Manage Integrations" permission
- Update navigation in `config/nav.ts`

**New Files:**
- `app/(app)/[hostelSlug]/integrations/page.tsx`
- `app/(app)/[hostelSlug]/integrations/layout.tsx`
- `app/(app)/[hostelSlug]/integrations/klaviyo/page.tsx`
- `convex/klaviyo.ts`
- `convex/lib/klaviyo.ts`

### Week 2: Migrate Poster
**Goal:** Move Poster pages to new structure (no new code, just relocation)

**Tasks:**
- Move spot mappings: `settings/spot-mappings/` → `integrations/poster/spot-mappings/`
- Create Poster dashboard at `integrations/poster/page.tsx`
- Add redirect at old location for backward compatibility
- Update all navigation references

### Week 3: Migrate MEWS
**Goal:** Move MEWS pages to new structure

**Tasks:**
- Move payments: `mews/payments/` → `integrations/mews/payments/`
- Create MEWS dashboard at `integrations/mews/page.tsx`
- Create webhook logs viewer at `integrations/mews/webhook-logs/`
- Update imports and navigation

### Week 4: BUILD Klaviyo Integration
**Goal:** This is where the real work happens - building Klaviyo from scratch

**Tasks:**
- Install `klaviyo-api` dependency: `npm install klaviyo-api`
- Create Klaviyo API client with credential management
- Build Klaviyo dashboard UI
- Implement guest sync from MEWS/Poster data
- Create campaign management interface
- Build guest segmentation tools
- Add credential management to settings

**Key Implementation:**
```typescript
// convex/lib/klaviyo.ts
interface KlaviyoCredentials {
  publicApiKey: string;
  privateApiKey: string;
}

export async function syncGuestsToKlaviyo(
  credentials: KlaviyoCredentials,
  guests: Guest[]
) {
  // Batch import guests to Klaviyo
}
```

### Week 5: Testing & Deployment
**Goal:** Ensure everything works, no data loss

**Testing Checklist:**
- [ ] Poster sync still works at new URL
- [ ] MEWS webhooks still process
- [ ] Payments page accessible at new location
- [ ] Settings credentials save correctly
- [ ] Navigation works correctly
- [ ] Permissions respected
- [ ] Klaviyo connects and syncs guests
- [ ] Campaigns can be created and sent

**Deployment:**
- Deploy new schema to dev environment
- Test with sample data
- Deploy to production
- Archive obsolete worktrees

---

## Technical Architecture

### Current Route Structure

```
app/(app)/[hostelSlug]/
├── (app)/
│   ├── components/           # Shared components
│   ├── adjustments/          # Manager adjustments UI
│   ├── deposits/             # Deposit management
│   ├── guardforce/           # Guardforce matching
│   ├── mews/
│   │   └── payments/         # MEWS payments ← WILL MOVE
│   ├── reports/              # Daily reports, petty cash
│   ├── settings/
│   │   ├── integrations/     # Credential management ← WILL SIMPLIFY
│   │   ├── members/          # Member management
│   │   └── spot-mappings/    # Poster mappings ← WILL MOVE
│   └── shifts/               # Shift reconciliation
├── api/mews-webhook/[slug]/  # MEWS webhook endpoint
└── ...

convex/
├── schema.ts                 # Database schema ← WILL ADD KLAVIYO TABLES
├── poster.ts                 # Poster sync
├── mews.ts                   # MEWS payments
├── mewsWebhook.ts            # Webhook handlers
├── mewsConnector.ts          # Connector API
└── ...

config/nav.ts                 # Navigation ← WILL UPDATE
```

### Target Route Structure

```
app/(app)/[hostelSlug]/
├── (app)/
│   ├── components/
│   ├── adjustments/
│   ├── deposits/
│   ├── guardforce/
│   ├── integrations/         # NEW: Integration hub
│   │   ├── page.tsx          # Overview of all integrations
│   │   ├── layout.tsx
│   │   ├── poster/           # NEW: Poster-specific
│   │   │   ├── page.tsx      # Poster dashboard
│   │   │   └── spot-mappings/
│   │   ├── mews/             # NEW: MEWS-specific
│   │   │   ├── page.tsx      # MEWS dashboard
│   │   │   ├── payments/
│   │   │   └── webhook-logs/ # NEW: Webhook debugging
│   │   └── klaviyo/          # NEW: Klaviyo integration
│   │       ├── page.tsx      # Klaviyo dashboard
│   │       ├── campaigns/
│   │       └── segments/
│   ├── reports/
│   ├── settings/
│   │   └── integrations/     # SIMPLIFIED: Credentials only
│   └── shifts/
└── ...

convex/
├── schema.ts                 # UPDATED: Klaviyo tables
├── poster.ts
├── mews.ts
├── mewsWebhook.ts
├── mewsConnector.ts
├── klaviyo.ts                # NEW: Klaviyo functions
└── lib/
    ├── poster.ts
    └── klaviyo.ts            # NEW: Klaviyo API client
```

### Navigation Changes

**Current (`config/nav.ts`):**
```typescript
[
  { title: "Dashboard", url: "/[hostelSlug]" },
  { 
    title: "Reports", 
    items: ["Shift Checks", "To Be Deposited", ...]
  },
  {
    title: "Settings",
    items: ["General", "Members", "Integrations", "Spot Mappings", "MEWS Payments"]
  }
]
```

**Target:**
```typescript
[
  { title: "Dashboard", url: "/[hostelSlug]" },
  { 
    title: "Reports", 
    items: ["Shift Checks", "To Be Deposited", ...]
  },
  {
    title: "Integrations",  // NEW TOP-LEVEL MENU
    url: "/[hostelSlug]/integrations",
    items: [
      { title: "Overview", url: "/[hostelSlug]/integrations" },
      { title: "Poster POS", url: "/[hostelSlug]/integrations/poster" },
      { title: "MEWS PMS", url: "/[hostelSlug]/integrations/mews" },
      { title: "Klaviyo", url: "/[hostelSlug]/integrations/klaviyo" }
    ]
  },
  {
    title: "Settings",
    items: ["General", "Members"]  // SIMPLIFIED
  }
]
```

---

## Development Workflow

### Option 1: Work Directly on `mews-api` Branch

**Pros:**
- Simple, no extra setup
- Changes immediately visible

**Cons:**
- Risk of breaking working code
- Can't easily run both versions
- Harder to isolate Klaviyo work

**Commands:**
```bash
cd /home/desktop/nomads-ops-center
git checkout mews-api
# Make changes, commit, push
```

### Option 2: Use Worktree (Recommended)

**Why Use Worktree:**
- **Isolation:** Klaviyo work separate from main branch
- **Testing:** Can run both versions simultaneously (different ports)
- **Safety:** Won't break working `mews-api` branch
- **Parallel Development:** Claude Code can work in worktree while you use main app

**Setup:**

```bash
# Option A: Use existing mews-klaviyo worktree
cd /home/desktop/clawd/nomads-ops-sync-mews-klaviyo
git checkout -b feature/klaviyo-integration

# Option B: Create fresh worktree from mews-api
cd /home/desktop/nomads-ops-center
git worktree add ../nomads-ops-klaviyo-dev feature/klaviyo-integration
cd ../nomads-ops-klaviyo-dev
```

**Workflow:**
```bash
# Terminal 1: Main app (working)
cd /home/desktop/nomads-ops-center
npm run dev  # Runs on localhost:3000

# Terminal 2: Klaviyo worktree (development)
cd /home/desktop/clawd/nomads-ops-sync-mews-klaviyo
npm run dev  # Runs on localhost:3001 (or different port)
```

**When Work is Complete:**
```bash
# In worktree directory
git add -A
git commit -m "feat: Add Klaviyo integration"
git push origin feature/klaviyo-integration

# Create PR to merge into mews-api
# After merge, archive worktree
cd /home/desktop/nomads-ops-center
git worktree remove ../nomads-ops-sync-mews-klaviyo
rm -rf ../nomads-ops-sync-mews-klaviyo
```

---

## Key Files and Locations

### Existing Poster/MEWS Code

| File | Purpose |
|------|---------|
| `convex/poster.ts` | Poster sync functions (~1500 lines) |
| `convex/lib/poster.ts` | Poster API client |
| `convex/mews.ts` | MEWS payment processing (~2800 lines) |
| `convex/mewsWebhook.ts` | MEWS webhook handlers |
| `convex/mewsConnector.ts` | MEWS Connector API |
| `convex/guardforce.ts` | Guardforce deposit matching |
| `convex/schema.ts` | Database schema definition |
| `app/(app)/[hostelSlug]/mews/payments/page.tsx` | MEWS payments UI |
| `app/(app)/[hostelSlug]/settings/spot-mappings/page.tsx` | Poster spot mappings |
| `config/nav.ts` | Navigation configuration |

### Settings/Configuration

| File | Purpose |
|------|---------|
| `app/(app)/[hostelSlug]/settings/integrations/page.tsx` | Integration credential management |
| `convex/users/hostels/settings.ts` | Settings mutations/queries |

### Documentation

| File | Purpose |
|------|---------|
| `/home/desktop/clawd/NOHO-OPS-INTEGRATION-PLAN-V2.md` | Complete 5-week implementation plan |
| `/home/desktop/clawd/NOHO-OPS-DEVELOPER-GUIDE.md` | This file |

---

## Git Strategy

### What NOT to Do

❌ **Don't merge `sync/poster-mews`** - Already merged into `mews-api`, obsolete
❌ **Don't merge `sync/full-integration`** - Obsolete staging area
❌ **Don't delete worktrees until Klaviyo is complete** - You might need them for reference
❌ **Don't commit to `main` directly** - Use feature branches and PRs

### What TO Do

✅ **Work on `mews-api` branch** (or feature branch from it)
✅ **Use worktrees for isolation** - Especially for Klaviyo development
✅ **Create feature branches:** `feature/klaviyo-integration`
✅ **Create PRs for review** - Don't push directly to `mews-api`
✅ **Archive worktrees after Klaviyo complete** - Clean up when done

### Branch Workflow

```
main (production)
  ↑
mews-api (integration branch) ← Create PR here when done
  ↑
feature/klaviyo-integration (your work)
```

### Pushing Changes

```bash
# Regular commits on feature branch
git add -A
git commit -m "feat: Add Klaviyo credential management"
git push origin feature/klaviyo-integration

# When ready to merge
git checkout mews-api
git merge feature/klaviyo-integration
git push origin mews-api

# Eventually merge to main
git checkout main
git merge mews-api
git push origin main
```

---

## Testing Checklist

Before considering any phase complete:

### Poster Migration (Week 2)
- [ ] Poster sync still works at `/integrations/poster`
- [ ] Spot mappings accessible at new URL
- [ ] All Poster settings save correctly
- [ ] Old `/settings/spot-mappings` redirects to new location
- [ ] No console errors

### MEWS Migration (Week 3)
- [ ] MEWS payments page at `/integrations/mews/payments`
- [ ] Webhook logs viewer at `/integrations/mews/webhook-logs`
- [ ] Manual "Poll MEWS Now" button works
- [ ] Payments display correctly
- [ ] Old `/mews/payments` redirects to new location

### Klaviyo Integration (Week 4)
- [ ] Klaviyo credentials save and encrypt correctly
- [ ] Connection test to Klaviyo API succeeds
- [ ] Guest sync runs without errors
- [ ] Campaigns can be created in UI
- [ ] Campaigns sync to Klaviyo
- [ ] Segments can be created based on guest data
- [ ] Dashboard shows campaign metrics
- [ ] Permissions work (only authorized users can access)

### Cross-Cutting
- [ ] Navigation works correctly in all sections
- [ ] Mobile responsive
- [ ] No TypeScript errors
- [ ] All tests pass (if any exist)
- [ ] Database migrations work in dev environment

---

## Success Criteria

The integration is complete when:

1. **All existing Poster functionality works at new `/integrations/poster` URL**
   - Shift sync continues to work
   - Spot mappings editable
   - No data loss

2. **All existing MEWS functionality works at new `/integrations/mews` URL**
   - Payments display correctly
   - Webhooks process normally
   - Manual polling works

3. **New Klaviyo integration connects and syncs guests**
   - Credentials encrypt/decrypt properly
   - Guest sync runs on schedule
   - Campaigns can be created and sent
   - Metrics tracked accurately

4. **Navigation is intuitive and discoverable**
   - Users can find all integrations easily
   - Settings simplified to credential-only
   - Clear status indicators for each integration

5. **No data loss during migration**
   - All existing settings preserved
   - Historical data intact
   - Seamless transition for users

---

## Quick Reference Commands

```bash
# Check current branch
git branch

# Check all branches (local and remote)
git branch -a

# Check worktrees
git worktree list

# Create new worktree
git worktree add ../new-worktree-name branch-name

# Remove worktree
git worktree remove ../worktree-name

# Check status of all repos
cd /home/desktop/nomads-ops-center && git status
cd /home/desktop/clawd/nomads-ops-sync-mews-klaviyo && git status
cd /home/desktop/klaviyo-mews-integration && git status

# Push current branch
git push origin $(git branch --show-current)

# View commit history
git log --oneline -10

# See what's changed
git diff

# Stage all changes
git add -A

# Commit with message
git commit -m "feat: Description of changes"
```

---

## Getting Help

If stuck:
1. Read `NOHO-OPS-INTEGRATION-PLAN-V2.md` for detailed technical specs
2. Check existing code in `convex/poster.ts` and `convex/mews.ts` for patterns
3. Reference the Klaviyo API documentation
4. Ask Claude Code with specific context about what you're building

---

*Last updated: January 31, 2026*
