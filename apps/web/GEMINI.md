# Project Mandates: Lisse UI

This project follows the **Lisse** design system. All future UI development and refactoring must adhere to these foundational mandates.

## 1. Aesthetic Mandates
- **Warm Sand Palette**: Never use pure grays or vibrant accent colors. Stick to the palette defined in `DESIGN.md`.
- **Zero Shadows**: Drop shadows are strictly forbidden. Create hierarchy through containerization, border management, and color shifts.
- **Radii Consistency**:
  - `16px` for main cards/surfaces.
  - `10px` for rows and inputs.
  - `100px` (pill) for buttons and interactive badges.
- **Physical Feedback**: All interactive elements (buttons, items, switches) MUST include a subtle `scale(0.98)` on `:active` to provide tactile response.

## 2. Technical Mandates
- **Base UI First**: Always prefer `@base-ui/react` primitives over external libraries.
- **Modern CSS**: Use Tailwind CSS v4 and native CSS features (like `@starting-style`) for animations to keep them off the main thread.
- **Inter Restraint**: Maintain typographical restraint. Use Inter (Variable) and never exceed `20px` font size for primary UI. **Avoid uppercase headlines and small metadata 'eyebrows'.** Use natural sentence case.

## 3. Architecture
- **Component Slots**: Use `data-slot` on all UI sub-components to allow for elegant parent-driven styling.
- **Polymorphism**: Use the `useRender` hook pattern from Base UI for components requiring polymorphic behavior.

---
Refer to `DESIGN.md` for the complete visual and interaction specifications.
