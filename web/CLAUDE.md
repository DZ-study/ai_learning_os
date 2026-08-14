Responsibilities:

- components: UI rendering and interaction
- hooks: business logic
- services: API communication
- types: shared type definitions

Pages only compose features. Do not put complex business logic in pages.

---

## Components

- One component has one responsibility.
- Prefer composition over large components.
- Extract reusable components when the same pattern appears multiple times.
- Do not create abstractions without real usage.
- Keep components readable and focused.

---

## State Management

### useState

Use for component-level state only.

Examples:

- Modal
- Dropdown
- Tabs
- Temporary UI state

### Context API

Only use for stable application configuration:

- Theme
- Locale
- Global Config

Do not store business data in Context.

### Zustand

Use for global business state:

- User
- Authentication
- Workspace
- Application settings

Do not store:

- Form state
- Temporary UI state

---

## API

Never call API directly inside components.

Use:

Component → Hook → Service → API

Business logic belongs in hooks.

---

## TypeScript

- Shared types should not be defined inside components.
- Put feature-level types in feature/types.
- Put global types in shared/types.
- Avoid any.
- Avoid duplicate type definitions.

---

## Styling

Use:

- Tailwind CSS
- shadcn/ui

Prefer:

- Flex
- Grid
- Responsive layout
- Design tokens

Avoid:

- Inline styles
- Hardcoded colors
- Fixed layouts that break on resize
- Unnecessary custom CSS

UI should adapt to different screen sizes.

---

## React

Avoid unnecessary:

- useMemo
- useCallback
- React.memo

Prefer simple and readable code.

Only optimize after identifying real performance issues.

---

## Code Reuse

Rule:

- Duplicate once: acceptable.
- Duplicate multiple times: consider extraction.

Extract:

- Components
- Hooks
- Utilities

Avoid premature abstraction.

---

## AI Coding Rules

When generating code:

- Follow existing project patterns.
- Reuse existing components first.
- Do not introduce new libraries without approval.
- Do not refactor unrelated code.
- Do not create unnecessary files.
- Prefer simple solutions over complex designs.
