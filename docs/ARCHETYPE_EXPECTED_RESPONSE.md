# Archetype API — Expected Response Format

## Endpoints

- `GET /api/v1.0/brands/{brand_id}/archetype/` — get current archetype
- `POST /api/v1.0/brands/{brand_id}/archetype/` — generate (or regenerate) archetype

Both return the same response shape.

## Response Shape

```json
{
  "primary": "<string | null>",
  "secondary": "<string | null>",
  "comment": "<string | null>",
  "archetype": "<string>"
}
```

## How the Frontend Parses Each Field

### `primary` and `secondary`

Each field is treated as a **two-part value** split by the first newline (`\n`):

```
<first line>  →  archetype name (rendered as markdown)
<rest>        →  archetype details (rendered as markdown)
```

**Example `primary`:**

```
**Hero**\nThe **Hero** archetype best reflects this brand's core promise. The target audience is motivated by **achievement, predictability, and reliable outcomes**.
```

Parsed as:

| Part    | Value |
|---------|-------|
| Name    | `**Hero**` (rendered as markdown → **Hero**) |
| Details | `The **Hero** archetype best reflects...` (rendered as markdown) |

**Example `secondary`:**

```
**Ruler**\nThe **Ruler** archetype supports the need for **control, order, structure, and status affirmation**.
```

Parsed as:

| Part    | Value |
|---------|-------|
| Name    | `**Ruler**` (rendered as markdown → **Ruler**) |
| Details | `The **Ruler** archetype supports...` (rendered as markdown) |

If `primary` or `secondary` is `null` or empty, the UI displays "Not yet generated" in that slot.

### `archetype`

Displayed as-is in the **"Combined Expression"** section. The entire value is rendered as markdown.

If empty or missing, the Combined Expression section is hidden.

**Example `archetype`:**

```
The **Hero** and **Ruler** archetypes combine to form a brand that **achieves results through structured excellence**. The Hero drives the aspiration for high performance, while the Ruler provides the authoritative consistency and control that makes success repeatable.
```

### `comment`

Currently unused by the frontend. Reserved for future use.

## Full Example Response

```json
{
  "primary": "**Hero**\nThe **Hero** archetype best reflects this brand's core promise. The target audience is motivated by **achievement, predictability, and reliable outcomes**, seeking solutions that ensure **competency and reliability** leading to **superior performance**.",
  "secondary": "**Ruler**\nThe **Ruler** archetype supports the need for **control, order, structure, and status affirmation** derived from superior tooling and predictable output.",
  "comment": null,
  "archetype": "The **Hero** and **Ruler** archetypes combine to form a brand that **achieves results through structured excellence**. The Hero drives the aspiration for high performance, while the Ruler provides the authoritative consistency that makes success repeatable."
}
```

### How This Renders

| UI Section           | Source Field  | Content |
|----------------------|---------------|---------|
| Primary name         | `primary` line 1 | **Hero** |
| Primary details      | `primary` lines 2+ | The **Hero** archetype best reflects... |
| Secondary name       | `secondary` line 1 | **Ruler** |
| Secondary details    | `secondary` lines 2+ | The **Ruler** archetype supports... |
| Combined Expression  | `archetype` (full) | The **Hero** and **Ruler** archetypes combine... |
