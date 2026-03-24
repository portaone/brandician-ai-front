# Brand Creation API Request Schema

## Overview

This document provides comprehensive documentation for the **Create Brand** API endpoint. It details the request structure, field specifications, validation rules, and example payloads that the frontend sends to the backend.

## Endpoint

**Method:** `POST`
**Path:** `/api/v1.0/brands`
**Base URL:** `{VITE_API_URL}` (configured at runtime)

## Request Headers

```
Content-Type: application/json
Authorization: Bearer {access_token}
X-Request-ID: {unique_request_id}
```

**Notes:**

- `Authorization` header is automatically added by the frontend API client using JWT tokens stored in `localStorage`
- `X-Request-ID` is a unique identifier for request tracking and debugging

## Request Body

### Schema

```typescript
{
  name: string,              // Required
  description?: string,      // Optional
  brand_posture: string     // Required
}
```

### Field Specifications

| Field           | Type   | Required | Description                              | Constraints                                                                                                                          |
| --------------- | ------ | -------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `name`          | string | Yes      | Project name for internal identification | Non-empty string. This is NOT the final brand name—users will create the actual brand name later in the workflow.                    |
| `description`   | string | No       | Brief description of the brand/business  | Free-form text. Can be empty or omitted.                                                                                             |
| `brand_posture` | string | No       | Classification of the brand type         | Must be one of: `commercial`, `personal`, `purpose`, `knowledge`, `community`, `institutional` (see **Brand Posture Options** below) |

## Brand Posture Options

The `brand_posture` field categorizes the brand into one of six types. Each posture shapes how the brand strategy is framed throughout the entire workflow.

| Value           | Label                      | Description                                                                                                                           |
| --------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `commercial`    | Commercial & growth        | Startup, SME, scale-up, or D2C product business competing in a market. Branding focuses on differentiation, positioning, and scale.   |
| `personal`      | Personal brand             | Expert, creator, solopreneur, or freelancer. Branding focuses on personal story, credibility, and authentic voice.                    |
| `purpose`       | Purpose-driven             | NGO, non-profit, charity, or social enterprise with a mission at the center. Branding focuses on impact, values, and community trust. |
| `knowledge`     | Knowledge & influence      | Consultancy, agency, academy, or think tank. Branding focuses on intellectual authority and expertise depth.                          |
| `community`     | Community & membership     | Association, cooperative, or professional body. Branding focuses on shared identity and sense of belonging.                           |
| `institutional` | Institutional & enterprise | Corporation, multinational, or holding company. Branding focuses on stability, trust, and credibility at scale.                       |

## Example Requests

### Minimal Request (Only Required Field)

```json
{
  "name": "My Startup Project"
}
```

### Complete Request with All Fields

```json
{
  "name": "TechFlow Solutions",
  "description": "An AI-powered workflow automation platform for SMEs looking to streamline operations and reduce manual work.",
  "brand_posture": "commercial"
}
```

### Personal Brand Example

```json
{
  "name": "Sarah's Consulting Practice",
  "description": "Executive coaching and organizational development consultant with 15 years of experience.",
  "brand_posture": "personal"
}
```

### Non-Profit Example

```json
{
  "name": "Clean Water Initiative",
  "description": "NGO focused on providing sustainable water solutions to underserved communities in Southeast Asia.",
  "brand_posture": "purpose"
}
```

## Validation Rules

### Frontend Validation

The frontend enforces these validations before sending the request:

1. **`name` field:**
   - Must be provided and non-empty
   - Submit button is disabled until `name.trim()` has a length > 0
   - User receives tooltip: "Enter a project name to continue"

2. **`brand_posture` field:**
   - Must be selected (non-empty value)
   - Submit button is disabled until `brand_posture` has a value
   - User receives tooltip: "Select a brand posture to continue"
   - If both are missing: "Enter a project name and select a brand posture"

3. **`description` field:**
   - Completely optional
   - No validation enforced
   - Can remain empty

### Backend Validation

The backend should validate:

1. **`name` field:**
   - Must not be `null` or empty string
   - Should trim whitespace
   - Consider setting a maximum length (e.g., 255 characters)
   - Return 400 Bad Request if invalid

2. **`brand_posture` field:**
   - If provided, must be one of: `commercial`, `personal`, `purpose`, `knowledge`, `community`, `institutional`
   - If an invalid value is provided, return 400 Bad Request with error message
   - If omitted, can be stored as `NULL` or a default value

3. **`description` field:**
   - If provided, consider a maximum length (e.g., 2000 characters)
   - Can be empty string or `NULL`

4. **User Authorization:**
   - Extract `user_id` from JWT token in Authorization header
   - Ensure user is authenticated
   - Return 401 Unauthorized if token is invalid or missing

## Response Structure

### Success Response (200/201 Created)

```json
{
  "id": "brand_123abc",
  "user_id": "user_456def",
  "name": "TechFlow Solutions",
  "description": "An AI-powered workflow automation platform...",
  "brand_posture": "commercial",
  "current_status": "explanation",
  "created_at": "2026-03-24T10:30:00Z",
  "updated_at": "2026-03-24T10:30:00Z",
  "survey_id": null,
  "brand_name": null,
  "payment_complete": 0,
  "status_description": "Understanding the brand..."
}
```

**Expected Response Fields:**

- `id`: Unique brand identifier (UUID or similar)
- `user_id`: ID of the user who created the brand
- `name`: Echoed from request
- `description`: Echoed from request
- `brand_posture`: Echoed from request (or default if not provided)
- `current_status`: Should be set to `"explanation"` to move user to the next step
- `created_at`: ISO 8601 timestamp
- `updated_at`: ISO 8601 timestamp
- `survey_id`: Null initially
- `brand_name`: Null initially (set later in workflow)
- `payment_complete`: 0 for new brands (not yet paid)
- `status_description`: Human-readable status message

### Error Responses

**400 Bad Request** (Invalid Input)

```json
{
  "detail": "Brand name is required",
  "error": "INVALID_REQUEST"
}
```

**401 Unauthorized** (Missing/Invalid Token)

```json
{
  "detail": "Authentication credentials were not provided.",
  "error": "UNAUTHORIZED"
}
```

**409 Conflict** (Duplicate Name)

```json
{
  "detail": "A brand with this name already exists for this user.",
  "error": "DUPLICATE_BRAND"
}
```

**500 Internal Server Error**

```json
{
  "detail": "An unexpected error occurred while creating the brand.",
  "error": "INTERNAL_ERROR"
}
```

## Frontend Flow After Request

1. Frontend sends POST request to `/api/v1.0/brands` with validated data
2. Upon successful response:
   - Frontend stores the returned `brand` object in Zustand store (`currentBrand`)
   - Adds brand to `brands` array in store
   - User is navigated to `/brands/{brandId}/explanation` page
   - Loading state is cleared
3. Upon error:
   - Error message is displayed to user
   - Loading state is cleared
   - User remains on the create form to retry

## Request Details

### Request Origin

- **File:** `/home/rebbbellion/projects/brandician/brandician-ai-front/src/components/brands/CreateBrand.tsx`
- **API Client:** `/home/rebbbellion/projects/brandician/brandician-ai-front/src/lib/api.ts`
- **Store:** `/home/rebbbellion/projects/brandician/brandician-ai-front/src/store/brand.ts`

### Data Flow

```
User Form Input
    ↓
CreateBrand Component State
    ↓
useBrandStore.createBrand()
    ↓
brands.create() API Client
    ↓
axios POST /api/v1.0/brands
    ↓
Backend Processing
    ↓
Response → Store Update → Route Navigation
```

## Implementation Checklist for Backend

- [ ] Validate `name` is provided and non-empty
- [ ] Validate `brand_posture` is one of the six allowed values (if provided)
- [ ] Validate `description` length if set
- [ ] Extract `user_id` from JWT token
- [ ] Create brand record with `current_status` = `"explanation"`
- [ ] Return complete brand object with all required fields
- [ ] Set proper HTTP status code (201 Created)
- [ ] Handle duplicate brand names appropriately
- [ ] Log request/response for debugging (use X-Request-ID)
- [ ] Implement proper error handling with appropriate status codes
- [ ] Ensure response includes `id` field for client navigation

## Notes

- The `name` field is intentionally distinct from the final brand name (created later)
- The `brand_posture` helps personalize the brand strategy questionnaire and recommendations
- The frontend handles all basic validation; backend should validate again for security
- The workflow progresses through status: `explanation` → `questionnaire` → `jtbd` → etc.
- All timestamps should be in ISO 8601 format
