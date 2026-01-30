# Nomads Ops Center - Integration Plan

**Date:** January 29, 2025
**Based On:** Architecture Analysis v1.0

---

## 1. Overview

This document outlines the comprehensive plan for integrating two major systems:

1. **MEWS + Klaviyo Sync** - Lifecycle email automation (booking confirmation, pre-stay, post-stay)
2. **Poster POS to MEWS Sync** - Bar revenue sync from POS to hotel management

### Goals
- Modular, isolated integrations
- Property-specific configuration
- Real-time sync with webhook support
- Comprehensive audit trails
- User-friendly configuration UI

---

## 2. File Structure

### 2.1 Complete Proposed Structure

```
nomads-ops-dashboard/
├── app/
│   ├── (dashboard)/                              # Main dashboard
│   │   ├── properties/
│   │   │   ├── page.tsx                          # Property list
│   │   │   └── [slug]/                           # Property detail (NEW)
│   │   │       ├── layout.tsx                    # Property layout + sidebar (NEW)
│   │   │       ├── overview/                     # Property overview (NEW)
│   │   │       │   └── page.tsx
│   │   │       ├── tasks/
│   │   │       │   └── page.tsx
│   │   │       ├── inventory/
│   │   │       │   └── page.tsx
│   │   │       └── integrations/                # Integration hub (NEW)
│   │   │           ├── page.tsx                 # Integration list for property
│   │   │           └── [integrationSlug]/       # Integration detail (NEW)
│   │   │               └── layout.tsx           # Integration sidebar (NEW)
│   │   │
│   │   ├── (integration-mews-klaviyo)/          # Route Group 1 (NEW)
│   │   │   ├── properties/
│   │   │   │   └── [slug]/
│   │   │   │       ├── overview/                # MEWS+Klaviyo overview
│   │   │   │       │   └── page.tsx
│   │   │   │       ├── automation-rules/        # Configure automation rules
│   │   │   │       │   └── page.tsx
│   │   │   │       ├── email-templates/         # Manage email templates
│   │   │   │       │   └── page.tsx
│   │   │   │       ├── event-mapping/           # Map MEWS events to Klaviyo
│   │   │   │       │   └── page.tsx
│   │   │   │       ├── customer-sync/           # Customer data sync settings
│   │   │   │       │   └── page.tsx
│   │   │   │       └── sync-history/           # View sync logs
│   │   │   │           └── page.tsx
│   │   │   └── layout.tsx                      # Shared layout (optional)
│   │   │
│   │   ├── (integration-poster-mews)/           # Route Group 2 (NEW)
│   │   │   ├── properties/
│   │   │   │   └── [slug]/
│   │   │   │       ├── overview/                # Poster+MEWS overview
│   │   │   │       │   └── page.tsx
│   │   │   │       ├── revenue-mapping/        # Map Poster categories to MEWS
│   │   │   │       │   └── page.tsx
│   │   │   │       ├── sync-settings/           # Sync frequency, etc.
│   │   │   │       │   └── page.tsx
│   │   │   │       ├── accounts/                # Poster account setup
│   │   │   │       │   └── page.tsx
│   │   │   │       ├── revenue-reconciliation/ # Reconciliation reports
│   │   │   │       │   └── page.tsx
│   │   │   │       └── sync-history/           # View sync logs
│   │   │   │           └── page.tsx
│   │   │   └── layout.tsx                      # Shared layout (optional)
│   │   │
│   │   └── [other existing routes...]
│   │
│   └── api/
│       ├── webhooks/
│       │   ├── mews/route.ts                    # Existing
│       │   ├── klaviyo/route.ts                 # Existing
│       │   └── poster/route.ts                  # NEW - Poster webhooks
│       │
│       └── integrations/                        # NEW - Integration API routes
│           ├── mews-klaviyo/
│           │   ├── trigger-sync/route.ts        # Manual sync trigger
│           │   └── test-webhook/route.ts        # Webhook testing
│           └── poster-mews/
│               ├── trigger-sync/route.ts        # Manual sync trigger
│               └── reconcile/route.ts          # Revenue reconciliation
│
├── convex/
│   ├── _generated/                              # Convex generated
│   ├── schema.ts                                # Updated schema
│   │
│   ├── mews.ts                                  # Existing (extend)
│   ├── klaviyo.ts                               # NEW - Klaviyo API client
│   ├── poster.ts                                # NEW - Poster API client
│   ├── integrations/
│   │   ├── index.ts                             # Integration registry
│   │   ├── mews-klaviyo.ts                      # MEWS+Klaviyo sync logic
│   │   └── poster-mews.ts                       # Poster+MEWS sync logic
│   │
│   ├── properties/                              # NEW - Move property logic
│   │   ├── queries.ts
│   │   └── mutations.ts
│   │
│   ├── http.ts                                  # Updated (add Poster routes)
│   └── [other existing files...]
│
├── components/
│   ├── integrations/                            # NEW - Integration components
│   │   ├── mews-klaviyo/
│   │   │   ├── automation-rule-editor.tsx
│   │   │   ├── email-template-editor.tsx
│   │   │   ├── event-mapping-table.tsx
│   │   │   ├── sync-status-card.tsx
│   │   │   └── klaviyo-connection-status.tsx
│   │   └── poster-mews/
│   │       ├── revenue-mapping-editor.tsx
│   │       ├── sync-settings-form.tsx
│   │       ├── account-setup-form.tsx
│   │       ├── reconciliation-table.tsx
│   │       └── poster-connection-status.tsx
│   │
│   ├── property/                                # NEW - Property components
│   │   ├── property-sidebar.tsx
│   │   ├── property-header.tsx
│   │   └── property-navigation.tsx
│   │
│   └── dashboard/
│       └── [existing components...]
│
├── lib/
│   ├── integrations/                            # NEW - Integration utilities
│   │   ├── mews-klaviyo/
│   │   │   ├── email-triggers.ts                # Trigger calculation logic
│   │   │   ├── event-mapper.ts                  # MEWS → Klaviyo event mapping
│   │   │   ├── template-renderer.ts             # Email template rendering
│   │   │   └── sync-orchestrator.ts             # Sync orchestration
│   │   └── poster-mews/
│   │       ├── revenue-parser.ts               # Parse Poster revenue data
│   │       ├── mews-poster.ts                   # MEWS revenue posting
│   │       ├── category-mapper.ts              # Category mapping logic
│   │       └── sync-orchestrator.ts             # Sync orchestration
│   │
│   └── [other existing files...]
│
├── types/
│   ├── index.ts                                 # Extended types
│   ├── integrations.ts                         # NEW - Integration types
│   │   ├── mews-klaviyo.ts
│   │   └── poster-mews.ts
│   └── property.ts                              # NEW - Property types
│
└── [other existing files...]
```

### 2.2 Key Files Breakdown

#### Route Groups

**`app/(integration-mews-klaviyo)/`**
- Purpose: Isolate MEWS+Klaviyo integration
- Contains: Property-specific MEWS+Klaviyo pages
- Shared layout for consistent UI

**`app/(integration-poster-mews)/`**
- Purpose: Isolate Poster+MEWS integration
- Contains: Property-specific Poster+MEWS pages
- Shared layout for consistent UI

#### Property Detail Routes

**`app/(dashboard)/properties/[slug]/`**
- `layout.tsx` - Property-specific sidebar with grouped navigation
- `overview/page.tsx` - Property dashboard
- `integrations/page.tsx` - Integration hub
- `integrations/[integrationSlug]/` - Individual integration pages

#### Convex Files

**`convex/klaviyo.ts`** (NEW)
- Klaviyo API client (authenticate, send events, manage profiles)
- Sync actions (sync customers, sync events)
- Internal mutations (store Klaviyo IDs, track sync status)

**`convex/poster.ts`** (NEW)
- Poster API client (authenticate, fetch orders, fetch products)
- Sync actions (sync revenue, sync products)
- Internal mutations (store revenue data, track sync status)

**`convex/integrations/mews-klaviyo.ts`** (NEW)
- Orchestrate MEWS → Klaviyo sync
- Handle automation rules
- Process MEWS webhooks → trigger Klaviyo events

**`convex/integrations/poster-mews.ts`** (NEW)
- Orchestrate Poster → MEWS sync
- Map revenue categories
- Process Poster webhooks → post to MEWS

#### Components

**`components/integrations/mews-klaviyo/`**
- Reusable components for MEWS+Klaviyo configuration
- Automation rule editor (if/then logic)
- Email template editor
- Event mapping table
- Sync status indicators

**`components/integrations/poster-mews/`**
- Reusable components for Poster+MEWS configuration
- Revenue mapping editor (Poster category → MEWS service)
- Account setup forms
- Reconciliation reports
- Sync status indicators

**`components/property/`**
- Property-level UI components
- Sidebar with grouped navigation
- Property header with status

---

## 3. Route Group Organization

### 3.1 Route Group Naming Convention

```
app/(route-group-name)/
```

### 3.2 Proposed Route Groups

| Route Group | Purpose | Scope | Status |
|-------------|---------|-------|--------|
| `(dashboard)` | Main dashboard UI | All users | ✅ Existing |
| `(integration-mews-klaviyo)` | MEWS + Klaviyo integration | Property-specific | 🆕 New |
| `(integration-poster-mews)` | Poster POS + MEWS integration | Property-specific | 🆕 New |

### 3.3 Route Group Benefits

**1. Isolation**
- Each integration is self-contained
- No coupling between integrations
- Easy to enable/disable per property

**2. Shared Layouts**
- Consistent UI within each integration
- Integration-specific sidebar navigation
- Shared components and utilities

**3. Code Organization**
- Clear separation of concerns
- Easy to find integration code
- Testable in isolation

**4. Performance**
- Route-level code splitting
- Only load integration code when needed
- Better tree-shaking

### 3.4 URL Structure

```
/properties/[slug]                              # Property overview
/properties/[slug]/integrations                  # Integration hub
/properties/[slug]/integrations/mews-klaviyo     # MEWS+Klaviyo integration
/properties/[slug]/integrations/poster-mews      # Poster+MEWS integration

# OR (direct URLs via route groups)
/properties/[slug]/integrations/mews-klaviyo/automation-rules
/properties/[slug]/integrations/mews-klaviyo/email-templates
/properties/[slug]/integrations/mews-klaviyo/sync-history

/properties/[slug]/integrations/poster-mews/revenue-mapping
/properties/[slug]/integrations/poster-mews/sync-settings
/properties/[slug]/integrations/poster-mews/sync-history
```

---

## 4. Schema Extensions

### 4.1 New Tables

#### MEWS + Klaviyo Sync Tables

```typescript
// Klaviyo integration configuration per property
klaviyoConfig: defineTable({
  propertyId: v.id("properties"),
  isEnabled: v.boolean(),
  apiKey: v.string(), // Encrypted at rest
  listId: v.string(), // Default Klaviyo list
  publicApiKey: v.string(), // For client-side events
  lastSyncAt: v.number(),
  syncStatus: v.union(v.literal("success"), v.literal("error"), v.literal("in_progress")),
  errorMessage: v.optional(v.string()),
})
  .index("by_property", ["propertyId"])

// MEWS → Klaviyo customer mappings
customerMappings: defineTable({
  propertyId: v.id("properties"),
  mewsCustomerId: v.string(),
  klaviyoProfileId: v.string(),
  mewsReservationId: v.string(), // For reference
  lastSyncAt: v.number(),
})
  .index("by_mews_customer", ["mewsCustomerId"])
  .index("by_property", ["propertyId"])

// Automation rules for lifecycle emails
automationRules: defineTable({
  propertyId: v.id("properties"),
  name: v.string(),
  description: v.optional(v.string()),
  triggerType: v.union(
    v.literal("reservation_confirmed"),
    v.literal("check_in_scheduled"),
    v.literal("check_in_completed"),
    v.literal("check_out_completed"),
    v.literal("post_stay"),
    v.literal("custom")
  ),
  triggerDelay: v.number(), // Hours after trigger
  klaviyoFlowId: v.string(),
  klaviyoMessageId: v.optional(v.string()), // For one-time messages
  emailTemplateId: v.optional(v.string()),
  conditions: v.optional(v.object({
    minBookingValue: v.optional(v.number()),
    maxBookingValue: v.optional(v.number()),
    guestType: v.optional(v.union(v.literal("new"), v.literal("returning"))),
    nightsStaying: v.optional(v.object({
      min: v.optional(v.number()),
      max: v.optional(v.number()),
    })),
    roomType: v.optional(v.string()),
  })),
  isEnabled: v.boolean(),
  priority: v.number(),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_property_enabled", ["propertyId", "isEnabled"])
  .index("by_property_trigger", ["propertyId", "triggerType"])

// Email templates
emailTemplates: defineTable({
  propertyId: v.id("properties"),
  name: v.string(),
  subject: v.string(),
  body: v.string(), // HTML or Markdown
  variables: v.array(v.string()), // Available template variables
  klaviyoTemplateId: v.optional(v.string()),
  isDefault: v.boolean(),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_property", ["propertyId"])

// Sync history for MEWS+Klaviyo
mewsKlaviyoSyncHistory: defineTable({
  propertyId: v.id("properties"),
  syncType: v.union(
    v.literal("customers"),
    v.literal("events"),
    v.literal("profiles"),
    v.literal("automation")
  ),
  startedAt: v.number(),
  completedAt: v.optional(v.number()),
  status: v.union(v.literal("success"), v.literal("error"), v.literal("in_progress")),
  recordsProcessed: v.number(),
  recordsSucceeded: v.number(),
  recordsFailed: v.number(),
  errorMessage: v.optional(v.string()),
  triggeredBy: v.union(v.literal("webhook"), v.literal("manual"), v.literal("scheduled")),
})
  .index("by_property", ["propertyId"])
  .index("by_created", ["startedAt"])
```

#### Poster POS + MEWS Sync Tables

```typescript
// Poster integration configuration per property
posterConfig: defineTable({
  propertyId: v.id("properties"),
  isEnabled: v.boolean(),
  apiKey: v.string(), // Encrypted at rest
  accountUrl: v.string(), // Poster account URL
  spotId: v.string(), // Poster spot ID
  mewsServiceCode: v.string(), // MEWS service code for posting revenue
  syncInterval: v.number(), // Minutes
  lastSyncAt: v.number(),
  syncStatus: v.union(v.literal("success"), v.literal("error"), v.literal("in_progress")),
  errorMessage: v.optional(v.string()),
})
  .index("by_property", ["propertyId"])

// Poster category → MEWS service mappings
posterRevenueMappings: defineTable({
  propertyId: v.id("properties"),
  posterCategoryId: v.string(),
  posterCategoryName: v.string(),
  mewsServiceId: v.string(),
  mewsServiceName: v.string(),
  mewsAccountingCategoryId: v.optional(v.string()),
  isEnabled: v.boolean(),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_property", ["propertyId"])
  .index("by_poster_category", ["posterCategoryId"])

// Imported Poster revenue data
posterRevenue: defineTable({
  propertyId: v.id("properties"),
  orderId: v.string(),
  orderDate: v.string(), // YYYY-MM-DD
  orderTime: v.string(), // HH:mm
  totalAmount: v.number(),
  currency: v.string(),
  posterCategoryId: v.string(),
  categoryName: v.string(),
  items: v.array(v.object({
    productId: v.string(),
    productName: v.string(),
    quantity: v.number(),
    price: v.number(),
    total: v.number(),
  })),
  syncedToMews: v.boolean(),
  mewsPostId: v.optional(v.string()),
  mewsPostedAt: v.optional(v.number()),
  mewsPostError: v.optional(v.string()),
  createdAt: v.number(),
})
  .index("by_property_date", ["propertyId", "orderDate"])
  .index("by_poster_order", ["orderId"])

// Sync history for Poster+MEWS
posterMewsSyncHistory: defineTable({
  propertyId: v.id("properties"),
  syncType: v.union(
    v.literal("revenue"),
    v.literal("products"),
    v.literal("categories")
  ),
  startDate: v.string(),
  endDate: v.string(),
  startedAt: v.number(),
  completedAt: v.optional(v.number()),
  status: v.union(v.literal("success"), v.literal("error"), v.literal("in_progress")),
  ordersProcessed: v.number(),
  ordersSynced: v.number(),
  ordersFailed: v.number(),
  totalRevenue: v.number(),
  errorMessage: v.optional(v.string()),
  triggeredBy: v.union(v.literal("webhook"), v.literal("manual"), v.literal("scheduled")),
})
  .index("by_property", ["propertyId"])
  .index("by_created", ["startedAt"])

// Reconciliation discrepancies
reconciliationDiscrepancies: defineTable({
  propertyId: v.id("properties"),
  date: v.string(),
  type: v.union(v.literal("missing_order"), v.literal("amount_mismatch"), v.literal("category_error")),
  posterOrderId: v.optional(v.string()),
  posterAmount: v.optional(v.number()),
  mewsPostId: v.optional(v.string()),
  mewsAmount: v.optional(v.number()),
  difference: v.optional(v.number()),
  description: v.string(),
  isResolved: v.boolean(),
  resolvedAt: v.optional(v.number()),
  resolvedBy: v.optional(v.id("staff")),
  notes: v.optional(v.string()),
  createdAt: v.number(),
})
  .index("by_property_date", ["propertyId", "date"])
  .index("by_resolved", ["isResolved"])
```

### 4.2 Modified Tables

```typescript
// Extend properties table
properties: defineTable({
  // ... existing fields
  // Add integration flags
  mewsIntegrationEnabled: v.boolean(),
  klaviyoIntegrationEnabled: v.boolean(),
  posterIntegrationEnabled: v.boolean(),
})
```

---

## 5. Component Architecture

### 5.1 Component Hierarchy

```
PropertyLayout
├── PropertySidebar
│   ├── PropertyOverviewLink
│   ├── NavGroup: Operations
│   │   ├── TasksLink
│   │   ├── InventoryLink
│   │   └── StaffLink
│   └── NavGroup: Integrations
│       ├── MewsKlaviyoLink
│       │   ├── OverviewLink
│       │   ├── AutomationRulesLink
│       │   ├── EmailTemplatesLink
│       │   └── SyncHistoryLink
│       └── PosterMewsLink
│           ├── OverviewLink
│           ├── RevenueMappingLink
│           ├── SyncSettingsLink
│           └── SyncHistoryLink
└── PropertyContent
    └── [Page Components]
```

### 5.2 Reusable Integration Components

**Base Components:**
- `IntegrationLayout` - Wrapper for integration pages
- `IntegrationSidebar` - Integration-specific navigation
- `ConnectionStatus` - API connection health indicator
- `SyncStatusCard` - Sync status overview
- `SyncHistoryTable` - Sync logs with filtering

**MEWS+Klaviyo Components:**
- `AutomationRuleEditor` - Create/edit automation rules
- `EmailTemplateEditor` - Email template editor
- `EventMappingTable` - MEWS → Klaviyo event mapping
- `KlaviyoConnectionStatus` - Klaviyo API status
- `TriggerTimeline` - Visual trigger timeline

**Poster+MEWS Components:**
- `RevenueMappingEditor` - Poster → MEWS category mapping
- `SyncSettingsForm` - Sync configuration
- `AccountSetupForm` - Poster account configuration
- `ReconciliationTable` - Revenue reconciliation
- `PosterConnectionStatus` - Poster API status

---

## 6. API Layer

### 6.1 Klaviyo API Client (`convex/klaviyo.ts`)

**Key Functions:**
```typescript
// Authentication
testConnection(apiKey: string): Promise<boolean>

// Profile Management
getProfile(email: string): Promise<Profile | null>
createProfile(email: string, properties: Record<string, any>): Promise<Profile>
updateProfile(profileId: string, properties: Record<string, any>): Promise<Profile>

// Event Tracking
trackEvent(profileId: string, eventName: string, properties: Record<string, any>): Promise<void>
trackEventByEmail(email: string, eventName: string, properties: Record<string, any>): Promise<void>

// Flow/Messaging
triggerFlow(flowId: string, email: string, properties: Record<string, any>): Promise<void>
sendMessage(messageId: string, email: string, properties: Record<string, any>): Promise<void>

// Templates
getTemplates(): Promise<Template[]>
getTemplate(templateId: string): Promise<Template>
```

### 6.2 Poster API Client (`convex/poster.ts`)

**Key Functions:**
```typescript
// Authentication
testConnection(apiKey: string, accountUrl: string): Promise<boolean>

// Orders
getOrders(spotId: string, startDate: string, endDate: string): Promise<Order[]>
getOrder(orderId: string): Promise<Order>

// Products
getProducts(spotId: string): Promise<Product[]>
getCategories(spotId: string): Promise<Category[]>
```

### 6.3 Integration Orchestration

**`convex/integrations/mews-klaviyo.ts`**
```typescript
// Main sync action
syncCustomers(propertyId: string): Promise<SyncResult>
syncEvents(propertyId: string): Promise<SyncResult>

// Webhook processing
processReservationCreated(propertyId: string, reservation: Reservation): Promise<void>
processCheckIn(propertyId: string, reservation: Reservation): Promise<void>
processCheckOut(propertyId: string, reservation: Reservation): Promise<void>

// Automation
triggerAutomationRules(propertyId: string, triggerType: string, reservation: Reservation): Promise<void>
```

**`convex/integrations/poster-mews.ts`**
```typescript
// Main sync action
syncRevenue(propertyId: string, startDate: string, endDate: string): Promise<SyncResult>

// Webhook processing
processOrderCreated(propertyId: string, order: Order): Promise<void>

// Reconciliation
reconcileRevenue(propertyId: string, date: string): Promise<ReconciliationResult>
```

---

## 7. Implementation Phases

### Phase 1: Foundation (Week 1-2)
- [ ] Create property-specific route structure
- [ ] Implement property-level navigation
- [ ] Set up route groups
- [ ] Extend Convex schema
- [ ] Create base integration components

### Phase 2: MEWS + Klaviyo (Week 3-5)
- [ ] Implement Klaviyo API client
- [ ] Create MEWS webhook → Klaviyo event mapping
- [ ] Build automation rules system
- [ ] Implement email template management
- [ ] Create sync history tracking
- [ ] Build UI components

### Phase 3: Poster + MEWS (Week 6-8)
- [ ] Implement Poster API client
- [ ] Create revenue sync logic
- [ ] Build category mapping system
- [ ] Implement reconciliation engine
- [ ] Create sync history tracking
- [ ] Build UI components

### Phase 4: Polish & Testing (Week 9-10)
- [ ] End-to-end testing
- [ ] Performance optimization
- [ ] Error handling improvements
- [ ] Documentation
- [ ] User acceptance testing

---

## 8. Summary

This integration plan provides:

✅ **Modular Architecture** - Isolated route groups and components
✅ **Property-Specific** - Each property can configure integrations independently
✅ **Scalable Schema** - Extensible database design
✅ **Reusable Components** - Shared UI components reduce duplication
✅ **Clear Data Flow** - Well-defined sync patterns
✅ **Comprehensive Tracking** - Full audit trails via sync history tables

The plan builds on the existing codebase patterns (MEWS API, webhook handling) and extends them to support:
- Full Klaviyo integration for lifecycle emails
- Complete Poster POS integration for bar revenue
- Property-specific configuration and navigation
- Modular, maintainable code structure
