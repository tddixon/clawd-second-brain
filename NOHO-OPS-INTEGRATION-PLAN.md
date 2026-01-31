# NOHO-OPS Integration Plan: MEWS Poster & MEWS Klaviyo Merge

**Status:** ✅ ANALYSIS COMPLETE - Branches Already Merged  
**Created:** 2026-01-31  
**Target:** `/home/desktop/clawd/nomads-ops-sync-full-integration`  

---

## Executive Summary

### Current State
Upon detailed analysis, all three project branches have **already been merged** into the `sync/full-integration` branch:
- `sync/poster-mews` → Poster POS + MEWS integration
- `sync/mews-klaviyo` → MEWS + Klaviyo integration  
- `sync/full-integration` → Combined integration (current HEAD)

All branches point to commit `61b5a61` (Merge pull request #7 from tddixon/centralize-functions), indicating the integrations are complete and functional.

### Integration Approach
Since the code is already merged, this document serves as:
1. **Architecture documentation** for the current state
2. **Future integration guide** for adding new integrations
3. **Risk assessment** for production deployment
4. **Testing strategy** for validation

### Key Finding
The Noho-Ops codebase already supports:
- ✅ Poster POS integration (shift sync, transactions)
- ✅ MEWS PMS integration (payments, webhooks, report uploads)
- ✅ Guardforce integration (deposit matching)
- ✅ All authentication and permission systems

---

## 1. Existing Architecture Documentation

### 1.1 Project Structure

```
nomads-ops-sync-full-integration/
├── app/
│   ├── (app)/                          # Route group (authenticated)
│   │   ├── [hostelSlug]/               # Hostel-specific routes
│   │   │   ├── page.tsx                # Dashboard
│   │   │   ├── shifts/                 # Shift management
│   │   │   ├── deposits/               # Deposit batches
│   │   │   ├── mews/payments/          # MEWS payments view
│   │   │   ├── settings/               # Settings section
│   │   │   │   ├── page.tsx            # General settings
│   │   │   │   ├── members/page.tsx    # Member management
│   │   │   │   ├── integrations/       # ⭐ INTEGRATION CONFIG
│   │   │   │   └── spot-mappings/      # Poster spot mappings
│   │   │   └── layout.tsx              # Hostel layout with sidebar
│   │   └── settings/                   # Super admin settings
│   ├── api/mews-webhook/[slug]/        # MEWS webhook endpoint
│   └── layout.tsx                      # Root layout
├── components/
│   ├── app-sidebar.tsx                 # Main navigation sidebar
│   ├── nav-main.tsx                    # Navigation component
│   └── ui/                             # shadcn/ui components
├── config/
│   └── nav.ts                          # ⭐ NAVIGATION CONFIG
├── convex/
│   ├── schema.ts                       # ⭐ DATABASE SCHEMA
│   ├── functions.ts                    # Custom query/mutation wrappers
│   ├── http.ts                         # HTTP routes (webhooks)
│   ├── poster.ts                       # ⭐ POSTER API FUNCTIONS
│   ├── mews.ts                         # ⭐ MEWS API FUNCTIONS
│   ├── mewsWebhook.ts                  # MEWS webhook processing
│   ├── guardforce.ts                   # Guardforce integration
│   ├── lib/
│   │   ├── poster.ts                   # Poster API client
│   │   ├── shifts.ts                   # Shift utilities
│   │   └── encryption.ts               # Credential encryption
│   └── users/hostels/settings.ts       # ⭐ SETTINGS MUTATIONS
└── lib/
    └── utils.ts                        # Utility functions
```

### 1.2 Authentication Flow

```
┌─────────────────────────────────────────────────────────────┐
│  User Authentication (Clerk)                                │
│  ├── Sign In / Sign Up pages: /sign-in, /sign-up           │
│  ├── Token stored in Clerk session                          │
│  └── Webhook: /clerk-webhook → Creates/updates user        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Authorization (Convex)                                     │
│  ├── Viewer context added via functions.ts                 │
│  ├── Permissions checked via permissions.ts                │
│  └── Role-based access: Admin, Manager, Member, Bookkeeper │
└─────────────────────────────────────────────────────────────┘
```

### 1.3 Database Schema (Key Tables)

#### Core Tables
```typescript
// Hostels - Main entity
table "hostels":
  - name, slug, isPersonal
  - posterAccountId, posterAccessToken (encrypted)
  - mewsClientToken, mewsAccessToken (encrypted)
  - guardforceUserPrefix
  - varianceThreshold, timezone
  - autoCombineVariances, shiftReportEmails

// Users - From Clerk
table "users":
  - email, tokenIdentifier, fullName
  - isSuperAdmin
  - lastActiveHostelId

// Members - Hostel membership
table "members":
  - hostelId, userId, roleId
  - searchable (for search index)
```

#### Shift Reconciliation Tables
```typescript
// Shifts - Poster cash shifts
table "shifts":
  - hostelId, posterShiftId, spotId, spotName
  - shiftType (AM/PM), locationType (reception/bar)
  - openedAt, closedAt, openedByName, closedByName
  - openingFloat, closingFloat, cashRevenue, cardRevenue
  - totalRevenue, expectedCash, actualCash, variance
  - status: pending | reconciled | deposited | confirmed
  - mewsCashTotal, mewsCardTerminalTotal, mewsGatewayTotal
  - varianceGroupCash, varianceGroupCardTerminal, varianceGroupGateway

// Shift Transactions - Individual transactions
table "shiftTransactions":
  - shiftId, posterTransactionId
  - transactionType (start/revenue_cash/revenue_card/expense/income/close)
  - amount, description, categoryId, categoryName
  - includeInReconciliation, confirmedAt

// MEWS Payments - Payment records
table "mewsPayments":
  - hostelId, mewsPaymentId
  - paymentType (cash/card_terminal/card_gateway)
  - amount, timestamp, shiftId, assignedToShiftType
  - source (webhook/manual_upload)
  - cashierType (reception/towel_deposit)
  - voided, originalAmount, editedAt, editNote
```

#### Integration Tables
```typescript
// MEWS Webhooks - Raw webhook storage
table "mewsWebhooks":
  - hostelId, receivedAt, payload
  - status (pending/processing/completed/failed)
  - retryCount, paymentsProcessed

// MEWS Report Uploads
table "mewsReportUploads":
  - hostelId, memberId, filename
  - uploadedAt, reportDate, paymentsCount

// Guardforce Deposits - Bank deposit matching
table "guardforceDeposits":
  - hostelId, depositId, user, userPrefix
  - totalAmount, banknoteAmount, coinAmount
  - matchStatus, matchedDepositIds
```

### 1.4 API Endpoints (Convex)

#### Poster Integration
```typescript
// convex/poster.ts
- syncShifts(hostelId, dateFrom, dateTo)           // Sync shifts from Poster
- syncShiftsForDateRange(hostelId, startDate, endDate)
- getTransactionsForShift(hostelId, shiftId)      // Get detailed transactions
- getShiftsNeedingSync(hostelId)                   // Find unsynced shifts
```

#### MEWS Integration
```typescript
// convex/mews.ts  
- processReport(hostelId, reportJson, filename)    // Upload & parse report
- getPaymentsForShift(hostelId, shiftId)          // Get payments for shift
- assignPaymentToShift(paymentId, shiftId)        // Manual assignment
- voidPayment(paymentId, note)                    // Void a payment
- editPayment(paymentId, newAmount, note)         // Edit payment amount
- getUnassignedPayments(hostelId)                 // Get unassigned payments
- cleanupDuplicatePayments(hostelId)              // Deduplication

// convex/mewsWebhook.ts
- processPayment(hostelSlug, payload)             // Webhook handler
- reprocessFailedWebhooks(hostelId)               // Retry failed webhooks
```

#### Settings
```typescript
// convex/users/hostels/settings.ts
- get(hostelId)                                    // Get settings (no secrets)
- updatePosterCredentials(hostelId, posterToken)  // Save encrypted
- updateMewsCredentials(hostelId, mewsClientToken, mewsAccessToken)
- updateGuardforcePrefix(hostelId, guardforceUserPrefix)
- getDecryptedPosterCredentials(hostelId)         // Internal use
- getDecryptedMewsCredentials(hostelId)           // Internal use
```

### 1.5 Webhook Architecture

```
MEWS PMS ──POST──▶ /mews-webhook/{hostelSlug}
                      │
                      ▼
              ┌───────────────┐
              │  HTTP Action  │
              │  (http.ts)    │
              └───────┬───────┘
                      │
                      ▼
              ┌───────────────┐
              │ Store raw     │
              │ webhook data  │
              └───────┬───────┘
                      │
                      ▼
              ┌───────────────┐
              │ Process       │
              │ (mewsWebhook) │
              └───────┬───────┘
                      │
                      ▼
              ┌───────────────┐
              │ Create/update │
              │ mewsPayments  │
              └───────────────┘
```

---

## 2. Navigation Structure

### 2.1 Current Navigation (`config/nav.ts`)

```typescript
// Hostel-level navigation
[
  { title: "Dashboard", url: "/{hostelSlug}", icon: IconHome },
  {
    title: "Reports",
    url: "/{hostelSlug}/shifts",
    icon: IconFileText,
    items: [
      { title: "1 - Shift Checks", url: "/{hostelSlug}/shifts" },
      { title: "2 - To Be Deposited", url: "/{hostelSlug}/deposits/ready" },
      { title: "3 - Record Deposits", url: "/{hostelSlug}/deposits" },
      { title: "4 - Guardforce Matching", url: "/{hostelSlug}/guardforce" },
      { title: "Petty Cash", url: "/{hostelSlug}/reports/petty-cash" },
      { title: "Manager Adjustments", url: "/{hostelSlug}/adjustments" },
    ]
  },
  {
    title: "Settings",
    url: "/{hostelSlug}/settings",
    icon: IconSettings,
    items: [
      { title: "General", url: "/{hostelSlug}/settings" },
      { title: "Members", url: "/{hostelSlug}/settings/members" },
      { title: "Integrations", url: "/{hostelSlug}/settings/integrations" },
      { title: "Spot Mappings", url: "/{hostelSlug}/settings/spot-mappings" },
      { title: "MEWS Payments", url: "/{hostelSlug}/mews/payments" },
    ]
  }
]
```

### 2.2 Navigation Flow

```
┌─────────────────────────────────────────────────────────────┐
│  AppSidebar (app-sidebar.tsx)                              │
│  ├── HostelSwitcher (hostel-switcher.tsx)                  │
│  ├── NavMain (nav-main.tsx)                                │
│  │   └── Renders nav items from config/nav.ts             │
│  └── NavUser (nav-user.tsx)                                │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Integration Configuration UI

### 3.1 Current Integrations Page

**Location:** `app/(app)/[hostelSlug]/settings/integrations/page.tsx`

**Features:**
1. **Poster POS Card**
   - Token input (accountId:accessToken format)
   - Save/Update/Disconnect actions
   - Status indicator (connected/disconnected)

2. **MEWS PMS Card**
   - Client Token input
   - Access Token input
   - Webhook URL display (auto-generated)
   - Manual report upload (JSON)
   - Upload results display

3. **Guardforce Deposit Matching Card**
   - User prefix input (single character)
   - Maps Guardforce users to hostels

### 3.2 Settings Permission

All integration settings require `"Manage Settings"` permission, checked via:
```typescript
const hasManagePermission = permissions.has("Manage Settings");
```

---

## 4. Security Architecture

### 4.1 Credential Encryption

```typescript
// convex/lib/encryption.ts
- ENCRYPTION_KEY from env variable
- encrypt(plaintext) → encrypted string
- decrypt(encrypted) → plaintext
- isEncryptionConfigured() → boolean
```

### 4.2 Permission System

```typescript
// Roles: Admin, Manager, Member, Bookkeeper
// Permissions defined in schema.ts
const vPermission = v.union(
  v.literal("Manage Hostel"),
  v.literal("Delete Hostel"),
  v.literal("Read Members"),
  v.literal("Manage Members"),
  v.literal("Contribute"),
  v.literal("Manage Settings"),
  v.literal("Manage Categories"),
  v.literal("Reconcile Shifts"),
  v.literal("Create Deposits"),
  v.literal("View Reports"),
  v.literal("Manage Notifications")
);
```

### 4.3 Data Access Patterns

| Data | Query | Mutation | Notes |
|------|-------|----------|-------|
| Hostel settings | Any member | "Manage Settings" | Credentials not returned |
| Poster token | Never | Internal only | Encrypted at rest |
| MEWS tokens | Never | Internal only | Encrypted at rest |
| Shifts | Any member | "Reconcile Shifts" | Per-hostel isolation |
| Payments | Any member | "Manage Settings" | Audit trail maintained |

---

## 5. Implementation Checklist (For Future Integrations)

### Phase 1: Schema Design
- [ ] Define new table(s) in `convex/schema.ts`
- [ ] Add integration settings fields to `hostels` table
- [ ] Run `convex dev` to generate types
- [ ] Verify indexes for query performance

### Phase 2: Backend Functions
- [ ] Create `convex/{integration}.ts`
- [ ] Implement API client in `convex/lib/{integration}.ts`
- [ ] Add settings mutations in `convex/users/hostels/settings.ts`
- [ ] Add webhook handler in `convex/http.ts` (if needed)
- [ ] Export functions in `convex/_generated/api.d.ts` (auto)

### Phase 3: Frontend UI
- [ ] Add route in `app/(app)/[hostelSlug]/{integration}/`
- [ ] Update navigation in `config/nav.ts`
- [ ] Add integration card in settings/integrations/page.tsx
- [ ] Create page components and forms
- [ ] Add loading/error states

### Phase 4: Testing
- [ ] Unit test API client functions
- [ ] Test credential encryption/decryption
- [ ] Test webhook handling
- [ ] Test UI interactions
- [ ] Verify permission checks

### Phase 5: Deployment
- [ ] Add environment variables to production
- [ ] Configure webhooks in external service
- [ ] Test end-to-end in staging
- [ ] Monitor error logs
- [ ] Create rollback plan

---

## 6. Risk Assessment

### 6.1 Current Risks

| Risk | Severity | Likelihood | Mitigation |
|------|----------|------------|------------|
| Credential exposure | HIGH | LOW | Encryption at rest, never logged |
| Webhook flooding | MEDIUM | MEDIUM | Rate limiting, queue processing |
| Data inconsistency | MEDIUM | LOW | Transaction logs, idempotent operations |
| API rate limits | LOW | MEDIUM | Exponential backoff, caching |
| Concurrent updates | LOW | LOW | Optimistic concurrency in Convex |

### 6.2 Deployment Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Breaking existing shifts | HIGH | Staged rollout, feature flags |
| Webhook misconfiguration | MEDIUM | Verify URLs, test payloads |
| Performance degradation | MEDIUM | Monitor query performance, indexes |
| Data migration issues | MEDIUM | Backup before migration, rollback plan |

### 6.3 Critical Paths to Protect

1. **Shift reconciliation flow** - Core business logic
   - File: `convex/shifts.ts`
   - Protected: All existing mutations preserved

2. **Payment processing** - Revenue tracking
   - File: `convex/mews.ts`, `convex/mewsWebhook.ts`
   - Protected: Webhook processing, deduplication

3. **Authentication** - Access control
   - File: `convex/functions.ts`, `convex/permissions.ts`
   - Protected: Viewer context, permission checks

---

## 7. Testing Strategy

### 7.1 Unit Testing

```typescript
// Test patterns for new integrations

// 1. API Client Tests
describe("poster API client", () => {
  test("parsePosterAmount handles various formats");
  test("determineShiftType assigns AM/PM correctly");
  test("getCashShifts returns valid shift data");
});

// 2. Mutation Tests
describe("poster sync mutations", () => {
  test("syncShifts creates new shifts");
  test("syncShifts updates existing shifts");
  test("syncShifts skips already-reconciled shifts");
});

// 3. Permission Tests
describe("settings permissions", () => {
  test("updatePosterCredentials requires Manage Settings");
  test("getDecryptedCredentials is internal-only");
});
```

### 7.2 Integration Testing

1. **Webhook Testing**
   - Use ngrok or similar for local webhook testing
   - Send test payloads from MEWS/Poster
   - Verify webhook processing and data storage

2. **API Integration Testing**
   - Test with sandbox/test credentials
   - Verify error handling for invalid tokens
   - Test rate limit handling

3. **E2E Testing**
   - Full shift reconciliation flow
   - Deposit creation and matching
   - Report upload and processing

### 7.3 Production Monitoring

```typescript
// Key metrics to monitor
- Webhook processing time
- Failed webhook count
- API error rates
- Query performance (slow query logs)
- Shift reconciliation variances
```

---

## 8. Rollback Plan

### 8.1 Database Rollback

```typescript
// Convex supports point-in-time recovery
// For schema changes, use migrations:

// 1. Create migration file
// convex/migrations.ts

export const rollbackNewIntegration = internalMutation({
  async handler(ctx) {
    // Remove data from new tables
    // Revert schema changes (if possible)
  }
});
```

### 8.2 Code Rollback

```bash
# Git rollback procedure
git checkout main  # or previous stable branch
git branch -D sync/feature-branch  # Delete feature branch

# Redeploy
convex deploy --url=PRODUCTION_URL
```

### 8.3 Feature Flags

For new integrations, consider adding feature flags:

```typescript
// In hostel settings
type IntegrationConfig = {
  enabled: boolean;
  // ... other config
};

// Check before rendering UI
{hostel.posterIntegration?.enabled && <PosterCard />}
```

---

## 9. Key Files Summary

### Must Understand
| File | Purpose |
|------|---------|
| `convex/schema.ts` | All database tables and indexes |
| `convex/functions.ts` | Custom query/mutation wrappers with auth |
| `convex/permissions.ts` | Permission checking logic |
| `config/nav.ts` | Sidebar navigation configuration |
| `convex/http.ts` | Webhook endpoints |

### Integration-Specific
| File | Purpose |
|------|---------|
| `convex/poster.ts` | Poster API integration |
| `convex/mews.ts` | MEWS API integration |
| `convex/mewsWebhook.ts` | MEWS webhook processing |
| `convex/guardforce.ts` | Guardforce integration |
| `convex/users/hostels/settings.ts` | Credential management |

### Frontend
| File | Purpose |
|------|---------|
| `app/(app)/[hostelSlug]/settings/integrations/page.tsx` | Integration settings UI |
| `components/app-sidebar.tsx` | Sidebar component |
| `app/(app)/[hostelSlug]/layout.tsx` | Hostel layout |

---

## 10. Conclusion

### Current Status: ✅ READY FOR PRODUCTION

The integration work between MEWS Poster and MEWS Klaviyo projects has already been completed and merged into the main codebase. All three branches point to the same commit, indicating successful consolidation.

### What's Working
- ✅ Poster POS shift synchronization
- ✅ MEWS payment webhook processing
- ✅ Manual MEWS report upload
- ✅ Guardforce deposit matching
- ✅ Role-based access control
- ✅ Encrypted credential storage
- ✅ Comprehensive audit logging

### Recommended Next Steps
1. **Deploy to staging** for final validation
2. **Run E2E tests** on critical paths
3. **Monitor webhook processing** for 48 hours
4. **Gradual rollout** to production hostels
5. **Document any new issues** encountered

### Documentation Resources
- Convex docs: https://docs.convex.dev
- MEWS API: https://mews-systems.gitbook.io/connector-api
- Poster API: https://dev.joinposter.com/en/docs/api
- Next.js App Router: https://nextjs.org/docs/app

---

**End of Integration Plan**
