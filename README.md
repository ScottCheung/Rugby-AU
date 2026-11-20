# Multi-Site Website Manager

One Next.js app that runs many rugby websites from a shared component library.
Editors compose pages in **`/manager`** from reusable components and edit their
content in forms generated from each component's schema. Public pages are
server-rendered at **`/sites/<site>/<path>`** from portable page JSON, each with
its own theme. Two fictional sites are seeded: **National XV** (deep green and
gold, dark) and **Coastal Union** (navy and white, light).

## The component library

| Component                | What it exercises                                                        | Props                                                                                                                       |
| ------------------------ | ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| **Section** (required)   | Nesting: a container whose children can include other Sections           | optional `heading` and `intro`; `layout`: full, two-column, two-column-wide, three-column; `background`: none, light, brand |
| **Card Grid** (required) | Rich props: a list of nested objects with an optional link, plus theming | `title`, `variant`: grid, carousel, masonry; `cards[]`: `{ image { url, alt }, heading, link? { label, href } }`            |
| **Image Slider**         | Adding a component after the fact; a small interactive (client) piece    | `slides[]`: `{ image, heading, text?, button? }`; `autoplay`                                                                |

Section keeps the two layouts and three backgrounds the brief asks for and adds a
couple more. Variety in how content looks lives in the content components, not in
Section: the same Card Grid data can be shown as a grid, a sideways-scrolling
carousel or a masonry photo wall. Section stays a pure layout container.

## 1. Run it

Requirements: Node 22+, npm, Docker.

```sh
cp .env.example .env.local
docker compose up -d      # MongoDB 7 on localhost:27017
npm install
npm run seed              # drops and recreates the two sites and their pages
npm run dev
```

- Manager: http://localhost:3000/manager
- Sites: http://localhost:3000/sites/national-xv and http://localhost:3000/sites/coastal-union

Checks, from the repository root: `npm test`, `npm run lint`, `npm run typecheck`,
`npm run build`.

## 2. Architecture

### Repository

An npm-workspaces monorepo with one reusable package and one app:

```
packages/ui/   @scottcheung/ui: my own generic, themeable React primitives (Button,
               Input, Select, Card, Dialog, Toast...). Nothing about rugby, pages or
               MongoDB, so it can be reused elsewhere. Built to dist/ and consumed
               like any npm package.
apps/web/      The task: one Next.js App Router app (manager + renderer).
```

The manager UI is built with `@scottcheung/ui` (its look is ported from my Jobby
design system: pill controls, soft gradient brand colour, large rounded panels)
plus Tailwind and Lucide icons. The public site components and their schemas are
separate and written for this task.

### The four layers (`apps/web`)

```
lib/types.ts, lib/db/      1. Page data: Site and Page documents. All MongoDB calls live in lib/db.
lib/components/            2. Component definitions: Zod schema, label, defaults, registry,
                              validateTree() and pure tree operations. No React.
app/manager/, components/manager/, lib/forms/
                           3. Manager: site list, page list, the visual editor
                              (components/manager/editor), schema-driven forms,
                              Server Actions for writes.
app/sites/, components/site/, components/primitives/
                           4. Renderer: server components that turn page JSON into HTML.
lib/theme/                 Default tokens, resolveTheme(), themeToCssVars().
```

They only meet through the registry. The manager imports definitions (schemas) and
never imports render code. The renderer maps each `type` to a React component.
Stored pages contain nothing but `type`, `props` and `children`, so they can be
rendered without the manager running, or by another app with the same library.

### The visual editor

Opening a page shows it as visitors will see it: the canvas renders the real site
components with the site's theme. Around it:

- **Click to select.** Hovering outlines a block; clicking selects it and shows a
  toolbar on the block (drag handle, move up, move down, duplicate, delete).
- **Edit in the side panel.** The selected block's fields are generated from its
  schema; with nothing selected the panel shows the page title and description.
- **Drag and drop** (dnd-kit). Drag blocks by their handle, or drag new ones from the
  component palette. A line shows where the block will land: before or after the
  block under the pointer, or into an empty Section. Clicking a palette item adds it
  inside the selected Section or after the selected block.
- **Layers** outline for picking deeply nested blocks, **desktop / mobile** preview,
  **undo / redo** (⌘Z / ⇧⌘Z; typing in one field counts as one step), Delete to remove
  the selected block, ⌘S to save.

All edits go through one `useReducer` over the page draft and the pure functions in
`lib/components/tree.ts` (`insertNode`, `moveNode`, `removeNode`, `cloneWithNewIds`...),
so the drag and drop code only works out a drop location and dispatches. Two-column
Sections use a CSS container query, so the mobile preview stacks them exactly as a
phone would.

### Why one Next.js app

Reads are server components and writes are Server Actions, so there is no
separate API to version, deploy or secure. The manager and the sites share the
component definitions directly. Splitting the renderer into its own deployment
later is cheap because it only depends on `lib/components`, `lib/db` and
`components/site`.

### Scaling to 30+ sites

- A new site is one `sites` document (slug, name, logo, theme overrides). No code
  change and no deployment.
- Pages are looked up through the unique compound index `{ siteSlug, path }`; sites
  through the unique index on `slug`.
- Every site uses the same component library, so a fix or a new component reaches all
  sites at once. Visual differences live in data (theme tokens), not in code.

## 3. Page JSON format

A page is one MongoDB document. `tree` is the portable part: plain JSON, with no
ObjectIds and no Dates. Each node is `{ id, type, props, children? }`; only
components that accept children (Section) have `children`.

```json
{
  "_id": { "$oid": "6afef6e915066248f53d9de5" },
  "siteSlug": "national-xv",
  "path": "/about",
  "title": "About the National XV",
  "description": "Who we are and how to support the team.",
  "updatedAt": { "$date": "2026-11-19T13:17:29.560Z" },
  "tree": [
    {
      "id": "28436a45-fa99-42da-98ad-351705c967c1",
      "type": "section",
      "props": { "layout": "full", "background": "light" },
      "children": [
        {
          "id": "bdb3ad25-1904-43e7-bab4-110ce3f597bd",
          "type": "cardGrid",
          "props": {
            "title": "About the team",
            "variant": "grid",
            "cards": [
              {
                "image": {
                  "url": "https://picsum.photos/seed/national-xv-training/800/500",
                  "alt": "Placeholder photo (national xv training)"
                },
                "heading": "High performance programme"
              },
              {
                "image": {
                  "url": "https://picsum.photos/seed/national-xv-fans/800/500",
                  "alt": "Placeholder photo (national xv fans)"
                },
                "heading": "Join the supporters club",
                "link": { "label": "Back to home", "href": "/" }
              }
            ]
          }
        }
      ]
    }
  ]
}
```

Paths are normalised: `/` for home, otherwise a leading slash, lowercase and no
trailing slash. Links inside page JSON are site-relative (`/about`) and the renderer
prefixes them with `/sites/<slug>`, so the same JSON would work under a custom domain.

## 4. Adding a new component

**Image Slider was added this way**, after Section and Card Grid were finished: a
schema file (`lib/components/imageSlider.ts`, reusing the shared image and link
fields from `lib/components/fields.ts`), a render component
(`components/site/ImageSlider.tsx`) and two registry lines. The manager form, the
palette entry and the save validation came for free.

A second, smaller example: a "Call to action" with a heading, some text and an optional button. No
form code is written; the manager builds the form from the schema.

**1. Define it** in `apps/web/lib/components/callToAction.ts`:

```ts
import { z } from 'zod';
import { defineComponent } from './define';

export const callToActionSchema = z.object({
  heading: z.string().trim().min(1, 'Add a heading').meta({ label: 'Heading' }),
  body: z.string().trim().meta({ label: 'Text', multiline: true }),
  button: z
    .object({
      label: z.string().trim().min(1).meta({ label: 'Button text' }),
      href: z.string().trim().min(1).meta({ label: 'Button link' }),
    })
    .optional()
    .meta({ label: 'Button' }),
});

export const callToAction = defineComponent({
  type: 'callToAction',
  label: 'Call to action',
  description: 'A short message with an optional button.',
  schema: callToActionSchema,
  defaultProps: { heading: 'Join the club', body: '' },
  acceptsChildren: false,
});
```

**2. Register it**: add `callToAction` to `componentDefinitions` in
`apps/web/lib/components/registry.ts`. It now appears in the manager's "Add
component" dialog, with a text input, a textarea and an "Add button" toggle, and
saves are validated against the schema.

**3. Render it** in `apps/web/components/site/CallToAction.tsx`. The props type comes
from the schema:

```tsx
export function CallToAction({
  heading,
  body,
  button,
  siteSlug,
}: PropsOf<'callToAction'> & { siteSlug: string }) {
  const href = button && resolveHref(button.href, siteSlug);
  return (
    <div className="flex flex-col items-start gap-3 rounded-site bg-surface-light p-site-md">
      <Heading level={2}>{heading}</Heading>
      {body && <p className="text-muted-text">{body}</p>}
      {button && href && <Button href={href}>{button.label}</Button>}
    </div>
  );
}
```

**4. Map it**: add `callToAction: CallToAction` to `siteComponents` in
`apps/web/components/site/RenderTree.tsx`. If you forget, `npm run typecheck` fails
with "Property 'callToAction' is missing", so a registered component can never be
unrenderable.

Adding a prop to an existing component is the same idea: one line in its schema,
then use it in its render component. The form updates by itself.

The form generator (`lib/forms/describe.ts`) supports strings (text, textarea, URL),
numbers, booleans, enums, nested objects, lists (add, remove, reorder) and optional
values (Add / Remove toggle; omitted from props when absent). Labels and hints come
from `.meta()`, falling back to the humanised prop name.

## 5. Theming

- `lib/theme/defaultTheme.ts` defines the full token set: colours (`brand`,
  `brandContrast`, `background`, `surfaceLight`, `text`, `mutedText`), `radius`,
  `fontFamily` and a `spacing` scale (`sm`, `md`, `lg`).
- A site stores only `ThemeOverrides`, a deep-partial of the theme.
- `resolveTheme(defaults, overrides)` is a pure deep merge that returns a complete
  theme (unit-tested).
- `themeToCssVars(theme)` turns it into CSS variables on the site's wrapper element
  (`--color-brand`, `--radius-site`, `--font-site`, `--spacing-site-md`...).
  `app/globals.css` registers the same names as Tailwind theme variables, so site
  components use plain utilities such as `bg-brand text-brand-contrast rounded-site`.

For this version the two sites override **colours only**; radius, font and spacing
come from the defaults so the brand family stays consistent. Overriding any other
token already works the same way: add, for example, `radius: '0'` or
`fontFamily: 'Georgia, serif'` to a site's `theme` (covered by the tests).

## 6. Key decisions and trade-offs

- **Variants before new components.** A carousel and a masonry wall show the same data
  as a grid, so they are a `variant` on Card Grid (one enum in the schema) rather than
  three components with duplicated card fields. A new component is added when the
  data is different, as with Image Slider. Adding `variant` later was safe for stored
  pages: it has a `.default('grid')`, so pages saved before it existed still validate.
- **Server first, small client islands.** Site components are server components. Only
  the Image Slider (current slide, autoplay) and the carousel's arrow buttons run in the
  browser; the carousel itself is CSS scroll snapping and works without JavaScript.

- **Zod vs JSON Schema.** One Zod schema per component gives the TypeScript prop type
  (`z.infer`), runtime validation on save and on render, and the description the form
  generator walks. JSON Schema is more portable across languages, but would need a
  separate validator and generated types. If another stack ever needs the
  description, `z.toJSONSchema()` can export it.
- **Form generation in two steps.** `describeSchema()` turns a schema into plain field
  descriptors (pure and unit-tested); `SchemaForm` only draws descriptors. Zod
  internals are touched in one small file.
- **Official MongoDB driver vs Mongoose.** Pages are already validated by Zod, so a
  second schema layer would duplicate it. The driver is thin and explicit, and all
  calls sit in `lib/db`.
- **Visual canvas, fields in a panel.** Editors see the real page and click what they
  want to change, but text is edited in generated form fields rather than typed on the
  page. That keeps "no form code per component" true and avoids per-component inline
  editing code; inline text editing could be added later with a `.meta({ inline: true })`
  flag.
- **dnd-kit for drag and drop.** A small, unopinionated drag library (allowed by the
  brief, unlike page builders). It only reports what is under the pointer; the drop
  rules live in `editor/dnd.ts` and the tree changes in `tree.ts`.
- **Explicit save vs autosave.** Simpler, and it is obvious when data reaches the
  database. The editor shows an "Unsaved changes" badge and warns before leaving.
- **Whole page as one document vs normalised components.** A page is read and written
  as one unit, which matches how it is rendered and keeps it portable. The cost is
  that a component cannot be shared between pages, and two editors saving the same
  page at once means the last save wins.
- **Path-prefix routing vs domain routing.** `/sites/<slug>/...` works locally with no
  DNS setup. Domains would be a `domains` field on each site plus a Next.js middleware
  that rewrites `rugby.example.com/about` to `/sites/<slug>/about`; the renderer would
  not change.
- **Monorepo for the UI library.** My own `@scottcheung/ui` lives in `packages/ui` so
  it can be reused and published separately; the app consumes it like an external
  package.
- **No authentication**, as allowed by the brief: there is a single editor.

## 7. Assumptions

- Section's two required layouts (full, two-column) are kept; two-column-wide and
  three-column are additions. Column counts react to the width a Section actually has
  (CSS container queries), so a Section nested in a column stacks earlier.
- The page title is used for `<title>` and is rendered as a visually hidden `<h1>`;
  visible headings come from the components.
- Paths are lowercase segments of letters, numbers and hyphens. A page's path cannot
  be changed after creation, and pages cannot be deleted (neither was in scope).
- Image descriptions (alt text) are required. Image addresses must be `http(s)` URLs.
  Link addresses are site-relative (`/about`) or full `http(s)` URLs; anything else
  is not rendered.
- Strings are trimmed on save. Optional values are omitted from props when absent.
- On render, a node whose type is unknown or whose props no longer match the schema is
  skipped (with a warning box in development) instead of failing the whole page.
- `npm run seed` is destructive by design: it drops and recreates both collections.
- Mock content only: fictional teams, placeholder images from picsum.photos and
  placehold.co.

## 8. What's missing and how I would build it

- **Authentication:** Auth.js (or the organisation's SSO) on `/manager` and the Server
  Actions, with per-site roles stored on the user.
- **Keyboard drag and drop:** blocks can be moved with the toolbar buttons today; dnd-kit's
  keyboard sensor would add arrow-key dragging.
- **Draft and publish:** store `draftTree` and `publishedTree` (or a `versions`
  collection); the editor saves drafts, "Publish" copies the draft, and the renderer
  reads only published content.
- **Inline text editing on the canvas:** mark string fields with `.meta({ inline: true })`
  and let the canvas make those elements editable.
- **Data-driven "Latest news" component:** schema `{ source, limit }`, and an async
  server component that fetches from a mock API at render time.
- **Vercel and MongoDB Atlas:** set `MONGODB_URI` / `MONGODB_DB` in Vercel, run the
  seed once as a manual job, and deploy `apps/web` with the workspace build command.
- **Per-site radius and type overrides:** already supported by `resolveTheme`; the work
  is choosing the values and checking contrast and layout per site.
- **Site editing UI:** a form for name, logo, favicon and theme colours that writes the
  `sites` document, with a contrast check for `brand` / `brandContrast`.
- **Concurrent editing:** send the page's `updatedAt` with each save and reject the save
  if it changed in the meantime.

## 9. Time and tools

- Hours spent: TODO: fill in
- AI tools used: Claude (Claude Code) for scaffolding and implementation, reviewed and
  edited by me.

## Environment variables

| Variable      | Purpose                   | Default                     |
| ------------- | ------------------------- | --------------------------- |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017` |
| `MONGODB_DB`  | Database name             | `rugby_site_manager`        |

Put them in `.env.local` at the repository root (never committed).
