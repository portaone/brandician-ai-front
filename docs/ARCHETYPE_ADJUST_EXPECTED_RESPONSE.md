# Archetype Adjustment API — Expected Response Format

## Endpoint

```
POST /api/v1.0/brands/{brand_id}/adjust/archetype
```

Generates an AI-suggested adjustment to the brand's archetype based on collected feedback. Returns a structured response with changes organized by archetype section.

## Response Shape

```json
{
  "new_text": "<string>",
  "primary_name": "<string>",
  "secondary_name": "<string>",
  "primary": [<ChangeSegment>, ...],
  "secondary": [<ChangeSegment>, ...],
  "combined": [<ChangeSegment>, ...],
  "footnotes": [<FootNote>, ...]
}
```

### ChangeSegment

```json
{
  "type": "<string>",
  "content": "<string>",
  "id": "<string | undefined>"
}
```

| Field     | Type     | Required | Description |
|-----------|----------|----------|-------------|
| `type`    | string   | yes      | `"text"` (unchanged content) or `"change"` (modified content, highlighted in UI) |
| `content` | string   | yes      | Markdown text for this segment |
| `id`      | string   | no       | Present only when `type` is `"change"`. References a footnote by `id` to provide an explanation for why this change was made |

### FootNote

```json
{
  "id": "<string>",
  "text": "<string>",
  "url": "<string | null>"
}
```

| Field  | Type          | Required | Description |
|--------|---------------|----------|-------------|
| `id`   | string        | yes      | Unique identifier, referenced by `ChangeSegment.id` |
| `text` | string        | yes      | Markdown explanation of why the change was made |
| `url`  | string / null | no       | Optional source URL supporting the explanation |

## Field-by-Field Explanation

| Field            | Type              | Description |
|------------------|-------------------|-------------|
| `new_text`       | string            | The full proposed archetype as a single markdown string. Used when the user accepts the adjustment — sent to `PUT /brands/{id}/archetype/` to save |
| `primary_name`   | string            | Display name of the primary archetype (e.g., "The Caregiver") |
| `secondary_name` | string            | Display name of the secondary archetype (e.g., "The Sage") |
| `primary`        | ChangeSegment[]   | Ordered array of segments for the **primary archetype** section. Concatenating all `content` fields reconstructs the primary section text |
| `secondary`      | ChangeSegment[]   | Ordered array of segments for the **secondary archetype** section |
| `combined`       | ChangeSegment[]   | Ordered array of segments for the **combined expression** section |
| `footnotes`      | FootNote[]        | Array of explanations. Each footnote is linked to a `"change"` segment via matching `id` |

## How the Frontend Renders Each Section

### Current Archetype (not from this endpoint)

The current archetype is fetched separately via `GET /brands/{id}/archetype/` which returns structured `BrandArchetypeData` with `primary`, `secondary`, and `archetype` fields. See `ARCHETYPE_EXPECTED_RESPONSE.md` for that format.

### Proposed Archetype (from this endpoint)

| UI Element                    | Source Field        |
|-------------------------------|---------------------|
| Primary archetype name        | `primary_name`      |
| Secondary archetype name      | `secondary_name`    |
| Primary section content       | `primary[]` segments rendered in order |
| Secondary section content     | `secondary[]` segments rendered in order |
| Combined Expression content   | `combined[]` segments rendered in order |
| Highlighted changes           | Segments where `type` is `"change"` — rendered with yellow background |
| "Why this change?" expandable | `footnotes[]` entry matching the change segment's `id` |
| "View source" link            | `footnotes[].url` (shown only when non-null) |

### Accept / Reject Flow

- **Accept New Archetype**: Frontend sends `PUT /brands/{id}/archetype/` with `{ "archetype": new_text }`
- **Keep Current Archetype**: No API call — frontend simply advances to the next step
- **Re-evaluate**: Frontend calls this endpoint again (`POST /brands/{id}/adjust/archetype`)

## Full Example Response

```json
{
  "new_text": "**The Caregiver**\nTo protect and care for others ensuring their safety and well-being through compassionate service.\n\nWhile the Sage lends the craft, the Ruler enforces the **standard**. This establishes the rules by which quality is measured. The brand's ambition to be the **definitive authority** and **uncompromising** force in the market.\n\n**The Sage**\nTo use intelligence and analysis to understand the world and discover the truth.\n\nThe Sage provides the necessary strategic balance by grounding the Caregiver's warmth in \"scientific groundwork\" and \"deep understanding.\"\n\nThis specific pairing creates a unique market positioning. **The Constructive thinker combined with empathetic settings.**\n\nWhile the brand maintains a rigid focus on the mechanics of verification, it projects supreme confidence and meticulous reasoning.\n\nThe narrative points that **measurement is the only safe harbor** and projects clinical precision.",
  "primary_name": "The Caregiver",
  "secondary_name": "The Sage",
  "primary": [
    {
      "type": "text",
      "content": "To protect and care for others ensuring their safety and well-being through compassionate service."
    },
    {
      "type": "change",
      "content": "While the Sage lends the craft, the Ruler enforces the **standard**.\n\nThis establishes the rules by which quality is measured. The brand's ambition to be the **definitive authority** and **uncompromising** force in the market.",
      "id": "1"
    }
  ],
  "secondary": [
    {
      "type": "text",
      "content": "To use intelligence and analysis to understand the world and discover the truth."
    },
    {
      "type": "text",
      "content": "The Sage provides the necessary strategic balance by grounding the Caregiver's warmth in \"scientific groundwork\" and \"deep understanding.\""
    }
  ],
  "combined": [
    {
      "type": "change",
      "content": "This specific pairing creates a unique market positioning. **The Constructive thinker combined with empathetic settings.**",
      "id": "2"
    },
    {
      "type": "text",
      "content": "While the brand maintains a rigid focus on the mechanics of verification, it projects supreme confidence and meticulous reasoning."
    },
    {
      "type": "change",
      "content": "The narrative points that **measurement is the only safe harbor** and projects clinical precision.",
      "id": "3"
    }
  ],
  "footnotes": [
    {
      "id": "1",
      "text": "Changed \"lends\" to \"enforces\" to strengthen the Ruler archetype's authority positioning. The brand needs to project decisive control, not passive contribution.",
      "url": null
    },
    {
      "id": "2",
      "text": "Enhanced the Combined Expression to emphasize \"Constructive thinker with empathetic settings\" — this unique pairing distinguishes the brand from competitors.",
      "url": null
    },
    {
      "id": "3",
      "text": "Added \"measurement is the only safe harbor\" metaphor to reinforce the brand's absolute positioning. This creates psychological safety for customers seeking definitive answers.",
      "url": "https://example.com/source"
    }
  ]
}
```

## Notes

- The `old_text` field from the previous response format has been removed. The current archetype is fetched separately via `GET /brands/{id}/archetype/`.
- Each section array (`primary`, `secondary`, `combined`) must contain at least one segment.
- A section with no changes should contain only `"text"` type segments (the unchanged content).
- The `id` field on a `"change"` segment must match exactly one entry in the `footnotes` array.
- All `content` fields support markdown formatting (bold, italic, links, etc.).
