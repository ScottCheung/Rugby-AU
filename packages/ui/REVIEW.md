# Jobby extraction review

Reviewed `packages/ui`, `Apps/user`, the shared style sheets and the app theme/layout code. This package is a clean-room, dependency-light extraction of reusable API and visual patterns; it contains no Jobby business modules or source imports.

| Area reviewed | Decision | Reason |
|---|---|---|
| Button, input, textarea, select | Reimplemented as native React wrappers | General purpose; original implementation imported Jobby icon, tooltip, label, animation and `@/` utilities. |
| Checkbox, switch, radio | Reimplemented with native inputs | General purpose semantics with no Radix runtime dependency. |
| Card, badge, segmented control, typography, skeleton | Included | Useful visual primitives; CSS uses scoped tokens and no app layout imports. |
| Dialog, modal, drawer | Reimplemented as controlled overlays | General interaction; stripped Jobby gesture state, stores and layout dependencies. |
| Popover, tooltip, toast | Simplified | Native disclosure/CSS tooltip plus small context API; original toast and tooltip dependencies were tied to global application state and styles. |
| Design tokens | Rebuilt from the Jobby slate/emerald palette, spacing, radius and dark-mode direction | Uses `--ui-*` scoped variables for independent brands and does not import Tailwind configuration. |
| Resume, job analysis, interview, autofill, charts, i18n, browser extension and navigation | Excluded | Product-specific or heavy dependencies; not necessary for a general UI package. |

The upstream working tree was already modified before this work began. It was inspected read-only and remains unchanged by this task.
