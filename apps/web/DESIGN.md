# Lisse Design System

> **/lēs/ adj. [F. lisse, smooth]**  
> 1. having an even, unbroken surface; smooth to the touch.  
> 2. sleek; without break or rough patch.  
> 3. fig. polished, frictionless; flowing without interruption.

## Core Philosophy
Lisse is built on the concept of **invisible correctness**. It favors warmth over clinical neutrality and restraint over complexity. The identity is defined by its sand-toned palette, typographical thinness, and the complete absence of drop shadows.

---

## Typography
Restraint at the weight level is our primary tool for sophistication.

- **Typeface**: Inter (Variable)
- **Scale**: No size should exceed **20px**.
- **Weights**:
  - `300 (Light)`: Primary body text.
  - `400 (Regular)`: UI elements, labels, buttons.
  - `500 (Medium)`: Headings and active states only.
- **Casing**: **No uppercase headlines or eyebrow labels.** Use sentence case for all titles and metadata to maintain a natural, clean aesthetic.
- **Leading**: `1.75` to `1.8` for readability.
- **Tracking**: `-0.03em` for display/headings; `0.01em` to `0.04em` for small metadata.

---

## Color Palette
Every shade has a **warm sand undertone**. There are no pure grays, no vibrant accent colors, and no high-contrast blacks.

| Token | Hex | Role |
| :--- | :--- | :--- |
| **Page** | `#EDEBE5` | Main background color. |
| **Card** | `#F8F7F3` | Surface color for cards, popovers, and dialogs. |
| **Hover** | `#E8E4DC` | Background for hover states and secondary buttons. |
| **Border** | `#DEDAD2` | All structural lines and separators. |
| **Muted** | `#AAA49A` | Metadata, disabled text, and placeholder icons. |
| **Secondary**| `#6E6760` | Secondary text and high-contrast metadata. |
| **Primary** | `#3A3530` | Primary text and main action colors. |
| **Shape** | `#8A8078` | Decorative shapes and visual anchors. |

---

## Tokens & Constraints

### Borders & Radii
We use semantic radii to maintain consistency. All values scale from a base `--radius` of `8px`.

- **Card Radius**: `rounded-lg` (8px - The foundation for large surfaces).
- **Row Radius**: `rounded-md` (6.4px - For list items, inputs, and grouped elements).
- **UI Radius**: `rounded-sm` (4.8px - For badges and small controls).
- **Border Width**: `1px` solid (standardized across the entire system).

### Motion & Easing
Transitions should feel physical and "liquid."

- **Duration**: `180ms` (standard for UI changes).
- **Timing Function**: `ease` or `cubic-bezier(0.34, 1, 0.64, 1)` for shape changes.
- **Interactions**: Always include `scale(0.98)` on press/active states to provide physical feedback.

### Spacing & Layout
- **Max Content Width**: `440px` (centered) for primary documentation/prose sections.
- **Hierarchy**: Large sections are separated by `3.5rem` margins and `1px` solid dividers.
- **Shadows**: **None — ever.** Hierarchy is created through color shifts and border containment, never through depth.

---

## Component Visuals

### Buttons & Tabs
- Buttons and Tabs use the **Pill (100px)** radius.
- Active states use a `1px` border or a subtle color shift to `#F8F7F3`.

### Inputs & Groups
- Inputs use the **Row (10px)** radius.
- Groups (like `InputGroup` or `ButtonGroup`) should have unbroken internal borders where possible.

### Cards & Overlays
- Cards use the **Card (16px)** radius.
- Overlays (Dialogs, Popovers) follow the card styling but may include a subtle blur backdrop.
