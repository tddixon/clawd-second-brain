# Nomads Ops Center - Architecture Analysis

**Date:** January 29, 2025
**Codebase Path:** `/home/desktop/code/nomads-ops-dashboard/`

---

## 1. Current Architecture Overview

### Technology Stack
- **Framework:** Next.js 14.1.0 (App Router)
- **Backend:** Convex v1.10.0
- **UI:** React 18.2.0, Radix UI, Tailwind CSS
- **TypeScript:** Full type safety with strict mode
- **State Management:** Convex reactive queries

### Core Architecture Pattern
```
┌─────────────────────────────────────────────────────────────┐
│                     Next.js Frontend                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │          Route Groups: (dashboard)                    │  │
│  │  - Properties, Tasks, Inventory, Staff, Alerts, etc. │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                    React Query / Hooks
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Convex Backend                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Schema: 12+ tables with proper indexing              │  │
│  │  - Properties, Staff, Tasks, Inventory, Alerts, etc.   │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ▲
                            │
                    HTTP Actions
                            │
┌─────────────────────────────────────────────────────────────┐
│              External APIs (Webhooks)                       │
│  - MEWS API (hotel management)                             │
│  - Klaviyo (email marketing)                               │
│  - Telegram/WhatsApp (notifications)                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Existing Integrations

### 2.1 MEWS Integration

**Files:**
- `app/api/webhooks/mews/route.ts` - Next.js webhook endpoint
- `convex/mews.ts` - MEWS API client and sync logic
- `convex/http.ts` - Convex HTTP routes

**Pattern:**
```
Webhook (Next.js) → Convex HTTP Action → Process Event → Update Database
```

**Features:**
- Reservations sync (upsert pattern)
- Occupancy sync
- Property stats update
- Rate/resource sync (schema defined)
- Customer sync (schema defined)

**Schema:**
```typescript
// MEWS Sync tracking
mewsSync: {
  propertyId, syncType, lastSyncAt, status, errorMessage, recordsSynced
}

// Reservations (synced from MEWS)
reservations: {
  propertyId, mewsReservationId, customerName, customerEmail,
  checkInDate, checkOutDate, status, roomNumbers, numberOfGuests,
  totalAmount, source, notes
}
```

**API Pattern:**
```typescript
async function mewsApiCall(endpoint: string, body: Partial<MewsRequest>) {
  // Uses ClientToken + AccessToken
  // Returns JSON response
  // Throws error on failure
}
```

### 2.2 Klaviyo Integration

**Files:**
- `app/api/webhooks/klaviyo/route.ts` - Next.js webhook endpoint
- `convex/http.ts` - Convex HTTP route handler

**Pattern:**
```
Webhook (Next.js) → Convex HTTP Action → Log Event → Process
```

**Current State:**
- Only webhook logging implemented
- No Klaviyo API client yet
- No specific Klaviyo schema tables
- Events stored in `webhookEvents` table

---

## 3. Route Structure

### Current Route Hierarchy
```
app/
├── (dashboard)/              # Dashboard route group
│   ├── page.tsx              # Dashboard home
│   ├── layout.tsx            # Dashboard layout + sidebar
│   ├── properties/           # Properties management
│   ├── tasks/                # Task management
│   ├── inventory/            # Inventory management
│   ├── staff/                # Staff management
│   ├── alerts/               # Alerts dashboard
│   └── settings/             # Settings
├── api/webhooks/             # Webhook endpoints
│   ├── mews/
│   └── klaviyo/
└── layout.tsx                # Root layout
```

### Navigation Pattern
- **Sidebar-driven:** Fixed sidebar navigation in `(dashboard)/layout.tsx`
- **Flat structure:** No nested property-specific routes yet
- **No slug-based routes:** Properties are displayed as cards, not clickable to property pages

**Current Sidebar Navigation:**
```typescript
const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Properties", href: "/properties", icon: Building2 },
  { name: "Tasks", href: "/tasks", icon: ClipboardList },
  { name: "Inventory", href: "/inventory", icon: Package },
  { name: "Staff", href: "/staff", icon: Users },
  { name: "Alerts", href: "/alerts", icon: Bell },
  { name: "Settings", href: "/settings", icon: Settings },
];
```

---

## 4. Property Organization

### Data Model
```typescript
properties: {
  name, location, address, totalRooms, totalBeds, timezone,
  mewsPropertyId?, telegramChatId?, whatsappGroupId?,
  isActive, createdAt, updatedAt
}
```

### Access Patterns
1. **List all properties:** `api.properties.list`
2. **Get single property:** `api.properties.get(id)`
3. **Get with stats:** `api.properties.getWithStats` (joins stats, alerts, tasks)
4. **Dashboard summary:** `api.properties.getDashboardSummary`

### Property-Scoped Data
All major tables have `propertyId`:
- `staff` - linked to properties
- `tasks` - property-specific
- `inventoryItems` - property-specific
- `alerts` - property-specific
- `propertyStats` - daily metrics per property
- `reservations` - from MEWS, property-scoped

### Index Strategy
```typescript
// Properties
by_mews_id: [mewsPropertyId]
by_active: [isActive]

// Property Stats
by_property_date: [propertyId, date]
by_date: [date]

// Staff
by_property: [propertyId]
by_email: [email]

// Tasks
by_property: [propertyId]
by_property_status: [propertyId, status]
by_assigned: [assignedTo]
by_due_date: [dueDate]
```

---

## 5. Sidebar Navigation Structure

### Current Implementation
- **Fixed layout:** Sidebar is part of `(dashboard)/layout.tsx`
- **Top-level only:** No nested navigation groups
- **Hardcoded navigation:** Array defined in component
- **Icon-based:** Each nav item has a Lucide icon

### Navigation State
```typescript
const pathname = usePathname();
const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
```

### User Profile Section
Bottom of sidebar shows:
- Avatar with initials
- Name and role
- Currently hardcoded (John Doe / Manager)

---

## 6. Current Limitations & Gaps

### 6.1 No Property-Specific Pages
**Issue:** Properties are displayed as cards but don't have dedicated pages

**Impact:**
- No property-specific task views
- No property-specific inventory views
- No property-specific integration settings
- Hard to add property-level navigation

**Required for Integration:**
- Need to create `/properties/[slug]/` route structure
- Need property-level sidebar navigation

### 6.2 No Route Groups for Integrations
**Issue:** Integration code mixed with core features

**Impact:**
- Hard to isolate integration logic
- Difficult to test integrations independently
- Risk of coupling integrations to core features

**Required for Integration:**
- Need separate route groups for each integration
- Need clear boundaries between integrations

### 6.3 Klaviyo Integration Incomplete
**Issue:** Only webhook receiver, no API client or sync logic

**Impact:**
- Can't send events to Klaviyo
- No lifecycle email automation
- Can't sync customer data

**Required for Integration:**
- Full Klaviyo API client
- Event sending logic
- Klaviyo-specific schema tables

### 6.4 No Poster POS Integration
**Issue:** No Poster POS integration exists

**Impact:**
- No bar revenue tracking
- No POS data in MEWS
- Manual revenue reconciliation

**Required for Integration:**
- Poster API client
- Bar revenue sync logic
- Poster-specific schema tables

---

## 7. Data Flow Patterns

### 7.1 MEWS Sync Flow
```
┌─────────────┐
│ MEWS API    │
└──────┬──────┘
       │
       ▼
┌──────────────────┐
│ Convex Action    │
│ (api.mews.sync)  │
└──────┬───────────┘
       │
       ├─→ Internal Mutation (upsert data)
       │
       ├─→ Internal Mutation (update sync status)
       │
       └─→ Internal Mutation (update property stats)
```

### 7.2 Webhook Flow
```
┌──────────────┐
│ External API │
│ (MEWS/Klaviyo)│
└──────┬───────┘
       │
       ▼
┌─────────────────┐
│ Next.js Route   │
│ /api/webhooks/* │
└──────┬──────────┘
       │
       ▼
┌──────────────────┐
│ Convex HTTP      │
│ /webhooks/*      │
└──────┬───────────┘
       │
       ▼
┌────────────────────┐
│ processWebhookEvent│
│ (mutation)         │
└──────┬─────────────┘
       │
       ▼
┌────────────────┐
│ webhookEvents  │
│ (log table)    │
└────────────────┘
```

---

## 8. Code Quality & Best Practices

### 8.1 Type Safety
- Full TypeScript strict mode
- Zod for runtime validation
- Convex schema validation with `v.*`

### 8.2 Error Handling
```typescript
try {
  const data = await mewsApiCall(...);
  // process data
} catch (error: any) {
  console.error("Operation failed:", error);
  // update sync record with error status
}
```

### 8.3 Index Strategy
- All foreign keys indexed
- Composite indexes for common queries
- Time-based indexes for date range queries

### 8.4 Modular Structure
```
convex/
├── schema.ts          # Database schema
├── properties.ts      # Property queries/mutations
├── staff.ts           # Staff operations
├── tasks.ts           # Task management
├── inventory.ts       # Inventory tracking
├── alerts.ts          # Alert system
├── mews.ts            # MEWS integration
├── integrations.ts    # Integration utilities
├── http.ts            # HTTP routes
└── seed.ts            # Demo data
```

---

## 9. Migration to Next.js 15 Considerations

### Current Version
- Next.js 14.1.0
- App Router (stable)
- Server Components (using)

### Next.js 15 Changes to Consider
- Turbopack (faster dev, optional)
- Improved Server Actions
- Better caching strategies
- Enhanced type safety

**Migration Path:**
1. Update package.json to Next.js 15
2. Test all routes
3. Update any deprecated APIs
4. Leverage new features where beneficial

---

## 10. Recommendations for Integration

### 10.1 Create Property-Specific Route Structure
```
app/
├── properties/
│   ├── page.tsx              # Property list
│   └── [slug]/               # Property detail
│       ├── layout.tsx        # Property layout + sidebar
│       ├── overview/         # Property dashboard
│       ├── tasks/            # Property tasks
│       └── integrations/     # Integration management
```

### 10.2 Create Integration Route Groups
```
app/
├── (integrations-mews-klaviyo)/   # MEWS + Klaviyo Sync
│   └── [slug]/
│       ├── overview/
│       ├── automation-rules/
│       ├── email-templates/
│       └── sync-history/
│
└── (integrations-poster-mews)/    # Poster POS → MEWS
    └── [slug]/
        ├── overview/
        ├── revenue-mapping/
        ├── sync-settings/
        └── sync-history/
```

### 10.3 Add Navigation Groups
```typescript
// Property-level navigation groups
const propertyNavGroups = [
  {
    title: "Operations",
    items: [
      { name: "Overview", href: "overview", icon: LayoutDashboard },
      { name: "Tasks", href: "tasks", icon: ClipboardList },
      { name: "Inventory", href: "inventory", icon: Package },
    ],
  },
  {
    title: "Integrations",
    items: [
      {
        title: "MEWS + Klaviyo",
        items: [
          { name: "Automation Rules", href: "integrations/mews-klaviyo/automation-rules" },
          { name: "Email Templates", href: "integrations/mews-klaviyo/email-templates" },
        ],
      },
      {
        title: "Poster POS",
        items: [
          { name: "Revenue Mapping", href: "integrations/poster-mews/revenue-mapping" },
          { name: "Sync Settings", href: "integrations/poster-mews/sync-settings" },
        ],
      },
    ],
  },
];
```

---

## 11. Summary

**Strengths:**
- Clean, modern architecture
- Strong type safety
- Good indexing strategy
- Modular Convex structure
- Existing MEWS integration pattern

**Gaps to Fill:**
- No property-specific pages (needs slug-based routes)
- Incomplete Klaviyo integration
- No Poster POS integration
- No integration-specific route groups
- No grouped navigation

**Integration Readiness:**
- ✅ MEWS API pattern exists
- ✅ Webhook handling pattern exists
- ✅ Convex schema can extend
- ✅ Property data model is solid
- ❌ Need property-level navigation
- ❌ Need integration route groups
- ❌ Need Klaviyo API client
- ❌ Need Poster API client
