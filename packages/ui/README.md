# @scottcheung/ui

A small, themeable React component library with scoped CSS tokens. Components do not require Tailwind, an icon package, or Jobby application code.

> **License status:** Jobby has no declared license and the `@scottcheung` npm scope is not authenticated in the current environment. This package is marked `UNLICENSED` and is not ready for public distribution until its owner selects or confirms a license and verifies npm scope access.

## Install

After the package has been published:

```sh
npm install @scottcheung/ui
```

Load its CSS once from your application entry point:

```tsx
import '@scottcheung/ui/styles.css';
import { Card, ThemeProvider } from '@scottcheung/ui';
import { Button, Input } from '@scottcheung/ui/client';

export function App() {
  return <ThemeProvider mode="light" brand="rugby">
    <Card><Input label="Email" type="email" /><Button>Continue</Button></Card>
  </ThemeProvider>;
}
```

The root export contains server compatible primitives. Interactive components (Button, Input, Select, Checkbox, Switch, Radio, SegmentedControl, Dialog/Modal, Drawer, ToastProvider and `useToast`) are exported from `@scottcheung/ui/client`, which preserves the Next.js Client Component boundary. Import the client entry from a Client Component. Static typography, Card, Badge, Skeleton, Tooltip, Popover and ThemeProvider remain server compatible.

## Themes

`ThemeProvider` scopes variables to its child tree and accepts `mode="light" | "dark"` and an optional brand key. The look is ported from the Jobby design system: slate surfaces, an OKLCH brand colour with a soft gradient, pill-shaped controls, uppercase field labels and large card radii. Built-in brands: `green` (default, alias `rugby`), `blue`, `purple`, `orange`, `rose`. Consumers can also override tokens through CSS on a wrapper:

```css
.rugby-brand {
  --ui-primary: #00543c;
  --ui-primary-hover: #003d2c;
  --ui-on-primary: #fff;
  --ui-radius-lg: 0.5rem;
}
```

`@scottcheung/ui/tokens.css` exports the scoped tokens on their own; `@scottcheung/ui/styles.css` includes tokens and component styles. No global element styles or global dark mode selectors are used.

## Components

Button, IconButton, Input, Textarea, Select, Checkbox, Switch, Radio, Card, Badge, Dialog/Modal, Drawer, Popover, Tooltip, SegmentedControl, Typography (H1/H2/H3/Paragraph), Toast, ToastProvider/useToast, and Skeleton.

## Development

```sh
npm install
npm run typecheck
npm run lint
npm test
npm run build
npm pack --dry-run
```

The ESM entry and declaration files are generated under `dist/`. React and React DOM are peer dependencies. CSS is a separate export and is marked as a side effect for bundlers.

## Release

Use SemVer. Confirm the package license and npm account scope, update the version, review the generated tarball, then run `npm publish --access public`. A GitHub Actions workflow is prepared to publish tagged releases with npm provenance. Public publishing has not been run.
