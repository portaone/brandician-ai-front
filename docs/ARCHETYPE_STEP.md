# Archetype Step — API & Frontend Integration Guide

## Overview

A new **Archetype** step has been added to the brand creation workflow between **JTBD** and **Create Survey**.

```
... → JBTD → ARCHETYPE → CREATE_SURVEY → ...
```

Status value: `"archetype"`

The user generates (or manually provides) a brand archetype at this step, reviews it, and then advances to survey creation. The archetype must be set before the survey can be generated.

---

## API Endpoints

All endpoints require `Authorization: Bearer <token>` header.

### 1. Get Current Archetype

```
GET /api/v1.0/brands/{brand_id}/archetype/
```

Returns the current archetype for the brand.

**Response** `200 OK`:
```json
{
  "primary": "The Explorer – Freedom & Discovery ...",
  "secondary": "The Creator – Innovation & Expression ...",
  "comment": "This combination balances ...",
  "archetype": "The Explorer – Freedom & Discovery ...\n\nThe Creator – ..."
}
```

- `primary` — Primary archetype description (may be null if not yet set)
- `secondary` — Secondary archetype description (may be null)
- `comment` — Commentary on the archetype combination (may be null)
- `archetype` — Computed field: all non-null parts joined with `\n\n` (backward-compatible)

**Response** `404 Not Found` — archetype has not been generated yet.

---

### 2. Generate Archetype (AI)

```
POST /api/v1.0/brands/{brand_id}/archetype/
```

Calls the LLM to suggest a primary and secondary brand archetype based on the brand's summary and questionnaire answers. **Saves the result to the database automatically.**

No request body required.

**Response** `200 OK`: Same `BrandArchetype` shape as GET above.

**Response** `500` — LLM generation failed.

---

### 3. Update Archetype (Manual Edit)

```
PUT /api/v1.0/brands/{brand_id}/archetype/
```

Saves a user-edited archetype. Supports two request body formats:

**Structured format** (preferred):
```json
{
  "primary": "The Explorer – ...",
  "secondary": "The Creator – ...",
  "comment": "This pairing works because ..."
}
```

**Legacy format** (also accepted):
```json
{
  "archetype": "Full archetype text as a single string"
}
```

**Response** `204 No Content` — saved successfully.

---

### 4. Advance to Next Step

```
POST /api/v1.0/brands/{brand_id}/progress/
```

Advances the brand from `archetype` to `create_survey`. No request body.

**Response** `200 OK`:
```json
{
  "status": "create_survey"
}
```

---

### 5. Revert to Archetype Step

```
POST /api/v1.0/brands/{brand_id}/revert/
```

**Request body**:
```json
{
  "target_status": "archetype"
}
```

Reverting **to** `archetype` preserves the existing archetype (user can re-generate or edit).
Reverting **before** `archetype` (e.g. to `jtbd`) clears the archetype.

---

## Frontend Changes Required

### 1. Status-to-Route Mapping

Add `"archetype"` to the mapping that resolves a brand status string to a frontend route/page.

### 2. Stepper / Progress Bar

Insert an "Archetype" step between "JTBD" and "Survey" in the workflow stepper component. The step index shifts all subsequent steps by one.

### 3. Archetype Page

Create a page/view for the `archetype` status. Recommended flow:

```
Page loads
  │
  ├─ GET /archetype/ → 200? Show existing archetype for review
  │
  └─ GET /archetype/ → 404? Show "Generate" button
                              │
                              └─ User clicks "Generate"
                                   │
                                   POST /archetype/ → Show result
```

**Page elements:**
- Display primary archetype, secondary archetype, and comment as separate sections
- "Generate" / "Regenerate" button → `POST /archetype/`
- Editable fields for primary, secondary, comment → save via `PUT /archetype/`
- "Next" / "Continue" button → `POST /progress/` to advance to `create_survey`

### 4. Deployment Order

Deploy the frontend **before or simultaneously** with the backend. If the backend deploys first, users completing the JTBD step will land on status `"archetype"` which the old frontend won't recognize.
