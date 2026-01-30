# Mews Booking Engine API & Connector API Research Report

**Date:** January 28, 2026
**Task:** Research and analyze Mews Booking Engine API and Mews Connector for Next.js + Convex integration

---

## Executive Summary

Mews provides two distinct APIs:
1. **Booking Engine API** - Designed for public-facing booking flows (frontend clients)
2. **Connector API** - General-purpose server-to-server API for internal/admin operations

For a Next.js + Convex custom booking engine, the **Booking Engine API** is the primary choice for availability/pricing/booking operations, while the **Connector API** may be useful for backend data synchronization.

---

## 1. Mews Booking Engine API

### Overview
- **Purpose:** Enable external applications (booking widgets, custom booking engines) to interact with Mews
- **Design:** Intended for direct consumption by front-end clients
- **Base URL:** `https://api.mews.com`
- **API Format:** REST (OpenAPI 3.0.4 spec available)
- **Documentation:** https://docs.mews.com/booking-engine-guide
- **OpenAPI Spec:** https://api.mews.com/swagger/distributor/swagger.json

### Key Characteristics
- **All endpoints use HTTP POST** with JSON request body
- **Built-in anti-scraping protection** - NOT suitable for continuous polling by a single server
- **Designed for real-time booking flows** (availability checking, pricing, reservation creation)
- **Response format:** JSON with structured data (rates, categories, pricing)

### Authentication (Booking Engine API)
The Booking Engine API uses a simpler authentication model than the Connector API:

**Required Parameters:**
```typescript
{
  Client: string;      // Name of your application (e.g., "MyBookingEngine 1.0.0")
  LanguageCode?: string; // Optional (e.g., "en-US")
  CultureCode?: string;  // Optional
  FullAmounts: boolean; // Whether to include full breakdown of amounts
}
```

**Note:** The Booking Engine API is designed to work directly from the browser. For public booking flows, you typically authenticate via Configuration ID rather than tokens.

---

### Key Endpoints for Room Listing & Booking Flow

#### 1. Configuration & Setup
**Endpoint:** `POST /api/distributor/v1/configuration/get`

**Purpose:** Fetch initial configuration, currencies, languages, age categories for the booking engine

**Request:**
```json
{
  "Client": "MyBookingEngine 1.0.0",
  "FullAmounts": true,
  "ConfigurationId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"  // Optional
}
```

**Response Includes:**
- `Configurations[]` - Booking engine configurations
- `CurrencyCodes[]` - Available currencies
- `Languages[]` - Supported languages
- `AgeCategories[]` - Adult/Child age categories
- `Cities[]` - Property cities
- `Services[]` - Available services
- `ImageBaseUrl` - Base URL for images
- `NowUtc` - Server timestamp

---

#### 2. Get Hotel Details
**Endpoint:** `POST /api/distributor/v1/hotels/get`

**Purpose:** Retrieve hotel/property information (name, address, categories, rates, products)

**Request:**
```json
{
  "Client": "MyBookingEngine 1.0.0",
  "HotelId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "FullAmounts": true,
  "LanguageCode": "en-US"
}
```

**Response (SingleHotelResult):**
```json
{
  "Hotel": {
    "Id": "...",
    "Name": { "en-US": "Hotel Name" },
    "Description": { "en-US": "Hotel description" },
    "Address": { /* ... */ },
    "DefaultCurrencyCode": "USD",
    "DefaultLanguageCode": "en-US",
    "AcceptedCurrencyCodes": ["USD", "EUR"],
    "Categories": [
      {
        "Id": "...",
        "Name": { "en-US": "Standard Room" },
        "Description": { "en-US": "Room description" },
        "NormalBedCount": 2,
        "ExtraBedCount": 1,
        "Ordering": 1
      }
    ],
    "Rates": [ /* Rate configurations */ ],
    "Products": [ /* Additional products/services */ ]
  }
}
```

**Use case for /slug page:** Display room categories, names, descriptions, capacity

---

#### 3. Check Availability & Pricing
**Endpoint:** `POST /api/distributor/v1/hotels/getAvailability`

**Purpose:** Get available rooms and rates for specific dates

**Request:**
```json
{
  "Client": "MyBookingEngine 1.0.0",
  "HotelId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "ConfigurationId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",  // Optional
  "StartUtc": "2024-03-01T00:00:00Z",
  "EndUtc": "2024-03-05T00:00:00Z",
  "OccupancyData": [
    {
      "AgeCategoryId": "...",  // Adult or child category ID
      "PersonCount": 2
    }
  ],
  "CurrencyCodes": ["USD", "EUR"],  // Optional - get pricing in multiple currencies
  "CategoryIds": ["xxx", "yyy"],  // Optional - filter by room categories
  "RateIds": ["aaa", "bbb"],  // Optional - filter by rates
  "VoucherCode": "PROMO123",  // Optional
  "FullAmounts": true
}
```

**Response (Availability):**
```json
{
  "RoomCategoryAvailabilities": [
    {
      "CategoryId": "...",
      "Availabilities": [5, 5, 5, 5, 4]  // Available count per day
    }
  ],
  "Rates": [
    {
      "Id": "...",
      "Name": { "en-US": "Best Available Rate" },
      "CategoryId": "...",
      "Prices": [
        {
          "DateUtc": "2024-03-01",
          "Currency": "USD",
          "GrossValue": 150.00,
          "NetValue": 125.00
        }
      ]
    }
  ],
  "RateGroups": [ /* Grouped rates */ ],
  "ViolatedRestrictions": [ /* Any restrictions preventing booking */ ]
}
```

**Use case for /slug page:** Real-time availability display with pricing

---

#### 4. Get Reservation Pricing
**Endpoint:** `POST /api/distributor/v1/reservations/getPricing`

**Purpose:** Get detailed pricing for a specific reservation configuration before creating it

**Request:**
```json
{
  "Client": "MyBookingEngine 1.0.0",
  "HotelId": "...",
  "StartUtc": "2024-03-01T00:00:00Z",
  "EndUtc": "2024-03-05T00:00:00Z",
  "ProductId": "...",  // Room/product ID
  "OccupancyData": [
    { "AgeCategoryId": "...", "PersonCount": 2 }
  ],
  "VoucherCode": "...",  // Optional
  "CurrencyCodes": ["USD"],
  "FullAmounts": true
}
```

---

#### 5. Create Reservation
**Endpoint:** `POST /api/distributor/v1/reservationGroups/create`

**Purpose:** Create a booking/reservation group

**Request:**
```json
{
  "Client": "MyBookingEngine 1.0.0",
  "HotelId": "...",
  "ConfigurationId": "...",  // Optional
  "AvailabilityBlockId": "...",  // Optional
  "Customer": {
    "FirstName": "John",
    "LastName": "Doe",
    "Email": "john@example.com",
    "Telephone": "+1234567890",
    "NationalityCode": "US"
  },
  "Booker": { /* Optional - if booker differs from customer */ },
  "Reservations": [
    {
      "ProductId": "...",  // Room ID
      "StartUtc": "2024-03-01T00:00:00Z",
      "EndUtc": "2024-03-05T00:00:00Z",
      "OccupancyData": [
        { "AgeCategoryId": "...", "PersonCount": 2 }
      ],
      "RateId": "...",  // Specific rate ID
      "AdditionalServices": [ /* Optional extras */ ]
    }
  ],
  "CreditCardData": {
    "PaymentGatewayData": "...",  // Tokenized card data from payment gateway
    "Expiration": "2025-12-01",
    "HolderName": "John Doe"
  }
}
```

**Response (ReservationGroup):**
```json
{
  "Id": "...",  // Reservation group ID
  "Reservations": [
    {
      "Id": "...",
      "State": "Confirmed",
      "Customer": { /* ... */ }
    }
  ]
}
```

---

### Other Useful Endpoints

#### Payment Configuration
`POST /api/distributor/v1/hotels/getPaymentConfiguration`
- Get payment gateway settings, supported cards, public key
- Essential for integrating payment flows

#### Exchange Rates
`POST /api/distributor/v1/exchangeRates/getAll`
- Currency conversion rates
- Useful for multi-currency display

#### Voucher Validation
`POST /api/distributor/v1/vouchers/validate`
- Check if promo/discount code is valid
- Apply to pricing before booking

---

## 2. Mews Connector API

### Overview
- **Purpose:** General-purpose server-to-server API for data access and Mews Operations integration
- **Base URL:** `https://api.mews.com` (same as Booking Engine)
- **Documentation:** https://docs.mews.com/connector-api
- **OpenAPI Spec:** https://api.mews.com/Swagger/connector/swagger.yaml

### Authentication (Connector API)
**Required Parameters for ALL requests:**

```typescript
{
  ClientToken: string;   // Unique to your app - issued by Mews
  AccessToken: string; // Identifies the enterprise/property
  Client: string;       // App name and version (e.g., "MyApp 1.0.0")
}
```

**Environment-specific tokens:**
- **Demo environment:** Public tokens available for testing
- **Production environment:** Requires certification - unique ClientToken + per-property AccessToken

**Portfolio Access Tokens:**
- Some tokens allow multi-property access
- Grants access to multiple enterprises with a single token

### Request Format
- **Only HTTP POST** with `Content-Type: application/json`
- URL pattern: `/api/connector/v1/[Resource]/[Action]`
- Examples:
  - `/api/connector/v1/reservations/getAll`
  - `/api/connector/v1/customers/getAll`
  - `/api/connector/v1/bills/getAll`

### Rate Limits
- **429 Too Many Requests** - API enforces request limits
- **Retry-After header** included in 429 responses
- **Strategy:** Implement exponential backoff for retries
- **Limits vary** by environment and usage patterns

**Recommendation:** Don't use Connector API for continuous polling. Use Booking Engine API for real-time availability checking.

### Key Operations

#### Reservations
- `POST /api/connector/v1/reservations/getAll` - Query existing reservations
- `POST /api/connector/v1/reservations/update` - Modify reservations
- `POST /api/connector/v1/reservations/cancel` - Cancel reservations

#### Customers
- `POST /api/connector/v1/customers/getAll` - Get customer data
- `POST /api/connector/v1/customers/add` - Create customers

#### Bills & Payments
- `POST /api/connector/v1/bills/getAll` - Get billing information
- `POST /api/connector/v1/payments/getAll` - Get payment records

#### Pagination
Many operations support pagination with cursor-based navigation:
```json
{
  "Limitation": {
    "Cursor": "optional-start-cursor",
    "Count": 100
  }
}
```

---

## 3. Mews Booking Engine Widget

### Integration Approach

The Booking Engine Widget is the **simplest way to integrate Mews booking** into a website without building a custom engine.

### Installation
Add to `<head>` of your page:
```html
<script src="https://api.mews.com/distributor/distributor.min.js"></script>
```

### Initialization
```html
<script>
  Mews.Distributor({
    configurationIds: ['your-configuration-id'],
    openElements: '.book-now-btn',  // CSS selector for trigger elements
  });
</script>
```

### Customization via Callback API
```javascript
Mews.Distributor(
  {
    configurationIds: ['your-config-id'],
    openElements: '.book-btn'
  },
  function(distributor) {
    // API instance for custom control
    distributor.setStartDate(new Date(2024, 2, 1));
    distributor.setEndDate(new Date(2024, 2, 5));
    distributor.setCurrencyCode('USD');
    distributor.setLanguageCode('en-US');

    // Manually open
    distributor.open();
  }
);
```

### Supported API Functions
- `open()` - Open booking overlay
- `close()` - Close overlay
- `setLanguageCode(code)` - Set language
- `setCurrencyCode(code)` - Set currency
- `setStartDate(date)` - Pre-fill check-in date
- `setEndDate(date)` - Pre-fill check-out date
- `setAdultCount(count)` - Set number of adults
- `setChildCount(count)` - Set number of children
- `setVoucherCode(code)` - Apply promo code
- `showRooms(hotelId)` - Show rooms for hotel
- `showRates(roomId)` - Show rates for room
- `showHotels()` - Show hotel selection (multi-property mode)

### Requirements
- **HTTPS required** - Widget won't work on HTTP sites
- **CSP domains** to allow:
  - `*.mews.com`
  - `*.recaptcha.net`
  - `*.google.com`
  - `*.gstatic.com`
  - `pay.datatrans.com` (PCI Proxy for payments)

---

## 4. SDK & npm Packages

### Official Status
**No official npm package or SDK** exists for the Mews Booking Engine API or Connector API.

### Available Options

#### 1. JavaScript Widget (For Simple Integration)
- **Script:** `https://api.mews.com/distributor/distributor.min.js`
- **Size:** ~11KB gzipped
- **Purpose:** Quick iframe-based widget integration
- **No npm package needed** - load directly from CDN

#### 2. OpenAPI Spec (For Custom Clients)
- **Booking Engine:** https://api.mews.com/swagger/distributor/swagger.json
- **Connector:** https://api.mews.com/Swagger/connector/swagger.yaml

**Recommended approach:** Use OpenAPI generators like `openapi-generator` or `swagger-codegen` to create TypeScript/JavaScript client libraries for your stack.

#### 3. GitHub Repositories
- https://github.com/MewsSystems/gitbook-open-api - Booking Engine docs source
- https://github.com/MewsSystems/gitbook-connector-api - Connector API docs source

### For Next.js + Convex
Create a custom API client using the OpenAPI spec. Example stack:

**Option 1: Fetch-based client**
```typescript
// lib/mews-client.ts
const MEWS_API_BASE = 'https://api.mews.com';

export async function getAvailability(params: AvailabilityParams) {
  const response = await fetch(`${MEWS_API_BASE}/api/distributor/v1/hotels/getAvailability`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      Client: 'MyBookingEngine 1.0.0',
      FullAmounts: true,
      ...params
    })
  });
  return response.json();
}
```

**Option 2: Use openapi-typescript-codegen**
```bash
npm install -g @openapitools/openapi-generator-cli
openapi-generator generate -i https://api.mews.com/swagger/distributor/swagger.json \
  -g typescript-axios -o ./mews-api-client
```

**Option 3: Use Convex for backend proxy**
```typescript
// convex/functions.ts
import { mutation } from './_generated/server';

export const getMewsAvailability = mutation({
  args: {
    hotelId: v.string(),
    startDate: v.string(),
    endDate: v.string()
  },
  handler: async (ctx, args) => {
    const response = await fetch(
      `https://api.mews.com/api/distributor/v1/hotels/getAvailability`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          Client: 'MyBookingEngine 1.0.0',
          HotelId: args.hotelId,
          StartUtc: args.startDate,
          EndUtc: args.endDate,
          FullAmounts: true
        })
      }
    );
    return response.json();
  }
});
```

---

## 5. Integration Recommendations for Next.js + Convex

### Architecture Pattern

```
┌─────────────────┐
│   Next.js     │  ← Frontend (User interaction)
│   (App Router) │
└───────┬───────┘
        │
        ├─→ Direct API calls (Booking Engine API)
        │   - Availability
        │   - Pricing
        │   - Create Reservation
        │
        ▼
┌─────────────────┐
│    Convex     │  ← Backend/state (if needed)
│  (Functions)   │  - User sessions
│                │  - Booking state
└─────────────────┘
        │
        └─→ Connector API (for admin/data sync)
            - Customer data
            - Reservation history
```

### Recommended Flow

#### Step 1: Use Booking Engine API Directly from Next.js
The Booking Engine API is designed for frontend consumption. Call it directly from Next.js:
- **Availability:** `POST /api/distributor/v1/hotels/getAvailability`
- **Pricing:** `POST /api/distributor/v1/reservations/getPricing`
- **Booking:** `POST /api/distributor/v1/reservationGroups/create`

#### Step 2: Use Convex for Session/State Management
Store booking progress in Convex:
- User-selected dates
- Room selections
- Pricing calculations
- Booking confirmation data

#### Step 3: Use Connector API from Convex (if needed)
For backend operations:
- Retrieve customer profiles
- Sync reservation history
- Handle webhooks (if Mews provides them)

### Environment Setup

**Demo Environment:**
```typescript
const MEWS_API_BASE = 'https://api.mews-demo.com';
// Use demo Configuration ID and tokens from docs
```

**Production Environment:**
```typescript
const MEWS_API_BASE = 'https://api.mews.com';
// Requires certification credentials from Mews
```

### Certification Required
To use production Connector API or Booking Engine API:
1. Register in Mews Marketplace
2. Complete certification process
3. Receive `ClientToken` and `AccessToken` for each property
4. Implement best practices (rate limits, error handling)

---

## 6. Rate Limits & Best Practices

### Rate Limits
- **Booking Engine API:** Not specified in docs (designed for frontend, anti-scraping protection)
- **Connector API:** Enforces limits, returns 429 with `Retry-After` header

### Best Practices

#### Booking Engine API
✅ **DO:** Call directly from Next.js frontend
✅ **DO:** Use for real-time availability checking
✅ **DO:** Implement proper date/time handling (UTC)
❌ **DON'T:** Poll continuously from a single server (anti-scraping)
❌ **DON'T:** Modify the widget script
❌ **DON'T:** Pack script files into your bundle

#### Connector API
✅ **DO:** Use for server-to-server operations
✅ **DO:** Implement exponential backoff on 429 errors
✅ **DO:** Use pagination for large datasets
✅ **DO:** Cache configuration data (categories, rates don't change often)
❌ **DON'T:** Use for real-time availability (use Booking Engine API instead)
❌ **DON'T:** Ignore 429 responses - always respect `Retry-After`

#### General
✅ **DO:** Handle all error codes (400, 401, 403, 408, 429, 500)
✅ **DO:** Validate required fields before sending requests
✅ **DO:** Use LanguageCode and CultureCode for localization
✅ **DO:** Test against demo environment first
✅ **DO:** Implement request timeouts (heavy requests may return 408)

### Request Timeout Handling
- **408 Request Timeout:** Occurs on heavy requests (e.g., getAll reservations)
- **Solution:** Break large queries into smaller batches
- **Example:** Query by day instead of week

---

## 7. Key API Base URLs

| API | Environment | Base URL |
|------|-------------|------------|
| Booking Engine | Production | `https://api.mews.com` |
| Booking Engine | Demo | `https://api.mews-demo.com` |
| Connector | Production | `https://api.mews.com/api/connector/v1` |
| Connector | Demo | `https://api.mews-demo.com/api/connector/v1` |

### Demo Credentials (Connector API)
From documentation example:
```
ClientToken: E0D439EE522F44368DC78E1BFB03710C-D24FB11DBE31D4621C4817E028D9E1D
AccessToken: 7059D2C25BF64EA681ACAB3A00B859CC-D91BFF2B1E3047A3E0DEC1D57BE1382
```

---

## 8. Summary Checklist for /slug Page Implementation

### Room Listing Page
- [ ] Fetch configuration: `POST /api/distributor/v1/configuration/get`
- [ ] Fetch hotel details: `POST /api/distributor/v1/hotels/get`
- [ ] Display categories from `Hotel.Categories`
- [ ] Use `ImageBaseUrl + Category.ImageId` for room images
- [ ] Show default currency (`Hotel.DefaultCurrencyCode`)

### Availability & Pricing
- [ ] On date change, call: `POST /api/distributor/v1/hotels/getAvailability`
- [ ] Pass `OccupancyData` with adult/child counts
- [ ] Display prices from `Rates[].Prices[]`
- [ ] Show availability count from `RoomCategoryAvailabilities[]`
- [ ] Handle multiple currencies with `CurrencyCodes[]`

### Booking Flow
- [ ] Get detailed pricing: `POST /api/distributor/v1/reservations/getPricing`
- [ ] Collect customer information
- [ ] Get payment config: `POST /api/distributor/v1/hotels/getPaymentConfiguration`
- [ ] Create reservation: `POST /api/distributor/v1/reservationGroups/create`
- [ ] Handle credit card via payment gateway (PCI Proxy)
- [ ] Show confirmation with `ReservationGroup.Id`

### Convex Integration
- [ ] Store user's booking progress in Convex documents
- [ ] Cache availability responses to reduce API calls
- [ ] Implement optimistic updates for better UX
- [ ] Use Convex functions for any Connector API calls needed

---

## 9. Next Steps & Resources

### Documentation Links
- **Booking Engine Guide:** https://docs.mews.com/booking-engine-guide
- **Connector API Guide:** https://docs.mews.com/connector-api
- **Booking Engine API Spec:** https://api.mews.com/swagger/distributor/swagger.json
- **Connector API Spec:** https://api.mews.com/Swagger/connector/swagger.yaml

### Getting Started
1. **Demo Testing:** Use demo credentials to test all flows
2. **Certification:** Apply for production access via Mews Marketplace
3. **Client Generation:** Use OpenAPI spec to generate TypeScript client
4. **Convex Setup:** Configure functions for API proxying
5. **Build:** Implement /slug page with availability/pricing/booking

### Support
- Email: partnersuccess@mews.com
- GitHub Issues: https://github.com/MewsSystems/gitbook-connector-api

---

## Appendix: Data Models

### Category (Room Type)
```typescript
interface Category {
  Id: string;                    // UUID
  Name: { [langCode: string]: string };  // Localized names
  Description: { [langCode: string]: string };
  NormalBedCount: number;           // Standard beds
  ExtraBedCount: number;            // Additional beds
  Ordering: number;                // Display order
}
```

### Rate (Pricing)
```typescript
interface Rate {
  Id: string;
  Name: { [langCode: string]: string };
  CategoryId: string;
  Prices: Price[];
}
```

### Availability
```typescript
interface Availability {
  RoomCategoryAvailabilities: CategoryAvailability[];
  Rates: Rate[];
  RateGroups: RateGroup[];
  ViolatedRestrictions?: Restriction[];
}

interface CategoryAvailability {
  CategoryId: string;
  Availabilities: number[];  // One per day in range
}
```

### Reservation
```typescript
interface Reservation {
  Id: string;
  ProductId: string;           // Room ID
  StartUtc: string;            // ISO 8601 datetime
  EndUtc: string;
  OccupancyData: OccupancyData[];
  RateId: string;
  AdditionalServices?: AdditionalService[];
}
```

---

**End of Report**
