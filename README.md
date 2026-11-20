# Multi-Site Website Manager

One Next.js app that runs many rugby websites from a shared component library.
Editors compose pages in **`/manager`** from reusable components and edit their
content in forms generated from each component's schema. Public pages are
server-rendered at **`/sites/<site>/<path>`** from portable page JSON, each with
its own theme. The seed creates **15 sites modelled on Australian rugby**: Rugby
Australia, the Wallabies, Wallaroos and Australia Sevens, the four Australian Super
Rugby clubs and seven state and territory unions, each with two pages and its own
colours (for example the Wallabies dark green and gold, the Reds maroon on white).

## The component library

| Component                | What it exercises                                                        | Props                                                                                                                                            |
| ------------------------ | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Section** (required)   | Nesting: a container whose children can include other Sections           | `heading?`, `intro?`; `layout`: one column, two columns (even, wide left, wide right), three columns; `background`: none, light, brand; `width`  |
| **Card Grid** (required) | Rich props: a list of nested objects with an optional link, plus theming | `title`, `variant`: grid, list, featured, overlay, carousel, masonry; `cards[]`: `{ image { url, alt }, heading, text?, link? { label, href } }` |
| **Image Slider**         | Adding a component after the fact; a small interactive (client) piece    | `slides[]`: `{ image, heading, text?, button? }`; `autoplay`                                                                                     |
| **Text**                 | Long-form copy: paragraphs from one multiline field                      | `heading?`, `body` (an empty line starts a paragraph), `button?`, `style`: plain, centred, quote                                                 |
| **Stats**                | A list of small objects without images                                   | `stats[]`: `{ value, label }`                                                                                                                    |
| **Article**              | A story page: reading layout, date field                                 | `category`, `date` (date picker), `headline`, `standfirst`, `image`, `body` (`## ` starts a subheading)                                          |
| **Latest news**          | A data-driven component (stretch goal)                                   | `title`, `category?`, `limit`, `display`: grid, list, featured. The cards come from the site's article pages at render time                      |

Section keeps the two layouts and three backgrounds the brief asks for and adds more.
Variety in how content looks lives mostly in the content components: the same Card
Grid data can be a grid, a list (photo beside text), a featured layout (first card
large), overlay tiles (text on the photo), a sideways carousel or a masonry photo
wall. The arrangements are plain CSS with container queries (`cards-*` in
`app/globals.css`), so they follow the space a grid really has.

**Width.** A Section placed directly on the page chooses how wide it is:

- **Page column** (default): inside the centred page column, with rounded corners
  when it has a background.
- **Full-width background**: the colour runs to the screen edges; the content stays
  in the column. Used for bands such as Stats or a call to action.
- **Edge to edge**: the content runs to the edges too, e.g. a hero slider or a photo
  wall. Its heading stays in the column so it lines up with the page.

The page itself has no container: `RenderTree` puts each page-level block in the
column unless `rootBlockWidth()` (`lib/components/pageWidth.ts`) says otherwise, and
the editor canvas uses the same function, so the editor shows exactly what the site
will. Nested Sections follow their parent; the renderer passes `nested` to every
component alongside `siteSlug`. `width` has a `.default('contained')`, so pages saved
before it existed render as before.

On public pages, a card with a link is clickable as a whole (one link per card,
stretched over it) and lifts on hover; a masonry photo without a link opens full size
in a lightbox (arrow keys, Esc). In the editor both are switched off, so a click only
selects the block.

**Motion.** Public pages use Motion (`motion` 14) for entrances: blocks and cards
rise, fade and come into focus (y, opacity, blur) the first time they scroll into
view, and siblings arrive one after another. Slider captions come in line by line on
each slide change. `Reveal` (`components/site/Reveal.tsx`) is a small client wrapper,
so the site components stay server-rendered. Choices:

- The first block on a page is not animated, so the top of the page is there before
  JavaScript runs; a `<noscript>` rule shows everything if it never does.
- The editor canvas turns animation off (`NoMotion`): blocks should just be there
  while editing.
- `MotionConfig reducedMotion="user"`: visitors who ask for less motion get fades
  only. Card hover uses CSS `translate`, which Motion's inline `transform` does not
  override.

**Articles and Latest news.** Cards that point to a section ("About us") are
navigation; stories are articles. An article is an ordinary page with an Article
block, under `/news/...`. Latest news is the data-driven component: the editor sets
only `title`, `category`, `limit` and `display`, and when a page renders the cards are
filled from the site's article pages, newest first (`lib/news.ts`, pure and tested).
The renderer reads the site's pages once per request and hands every component a
`data` object next to `siteSlug`; the editor canvas gets the same data, so the preview
shows real articles. Under an article, Latest news leaves that article out, so "More
news" never repeats the page you are on.

Trade-off: summaries are worked out from the page trees on each request, which is fine
for dozens of articles per site. With thousands, I would store an article's summary
(date, category, headline) on the page document when it is saved, index
`{ siteSlug, date }`, and let Latest news query that.

The seeded articles are evergreen explainers, history and guides built from public
facts. None reports an invented event or quotes anyone.

## 1. Run it

Requirements: Node 22+, npm, Docker.

```sh
cp .env.example .env.local
docker compose up -d      # MongoDB 7 on localhost:27017
npm install
npm run seed              # drops and recreates the 15 sample sites and 123 pages (46 of them articles)
npm run dev
```

- Manager: http://localhost:3000/manager
- Sites: for example http://localhost:3000/sites/wallabies, http://localhost:3000/sites/reds,
  http://localhost:3000/sites/rugby-australia (all of them are listed in the manager)

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
  schema; with nothing selected the panel shows the page settings: title,
  description, address (changeable except for the home page) and Delete page, with a
  confirmation.
- **Image fields** show a preview and a "Choose image" picker of the images already
  used on the site (`lib/media.ts` finds them by their `{ url, alt }` shape), so
  editors rarely need to paste an address.
- **Drag and drop** (dnd-kit). Drag blocks by their handle, or drag new ones from the
  component palette. A line shows where the block will land: before or after the
  block under the pointer, or into an empty Section. Clicking a palette item adds it
  inside the selected Section or after the selected block.
- **Layers** outline for picking deeply nested blocks, **desktop / tablet / mobile**
  preview,
  **undo / redo** (⌘Z / ⇧⌘Z; typing in one field counts as one step), Delete to remove
  the selected block, ⌘S to save.

All edits go through one `useReducer` over the page draft and the pure functions in
`lib/components/tree.ts` (`insertNode`, `moveNode`, `removeNode`, `cloneWithNewIds`...),
so the drag and drop code only works out a drop location and dispatches.

**The preview matches the live site.** The canvas lays the page out at the device's
real width and scales it down to fit the editor (`devices.ts`): desktop uses the
browser window the editor is open in, so it matches opening the live site in that
window; tablet is 768 px and phone 390 px. It shows the zoom
("Desktop · 1440px · 51%"). Layouts respond to container width, not
the browser window: Sections and Card Grids are CSS containers, and heading sizes
follow a `page` container on the site wrapper and the canvas. So a desktop preview has
desktop columns even in a narrow editor, and the phone preview stacks exactly as a
phone would. Clicks and drag and drop work on the scaled page (the browser hit-tests
transformed elements), and the selected block's toolbar is scaled back up so it stays
readable. The canvas also uses the live page's spacing rules (no hidden drop zones
taking up space), so a block measures the same in both.

### Why one Next.js app

Reads are server components and writes are Server Actions, so there is no
separate API to version, deploy or secure. The manager and the sites share the
component definitions directly. Splitting the renderer into its own deployment
later is cheap because it only depends on `lib/components`, `lib/db` and
`components/site`.

### Scaling to 30+ sites

The seed already has 15 sites, built from data: `scripts/seed/sites.ts` lists each
site (name, category, tagline, colours) and `scripts/seed/pages.ts` fills one page
template per kind of site (governing body, national team, Super Rugby club, state
union). The manager groups sites by category and has a search box, so it stays usable
as the list grows.

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
  "_id": {
    "$oid": "6affae335bf06984678bcf3a"
  },
  "siteSlug": "wallaroos",
  "path": "/history",
  "title": "History",
  "description": "Where the team comes from.",
  "updatedAt": {
    "$date": "2026-11-20T02:19:31.695Z"
  },
  "tree": [
    {
      "id": "dc0c9323-9032-4b4a-a731-25d3e3701275",
      "type": "section",
      "props": {
        "heading": "Our history",
        "intro": "The Wallaroos played their first Test on 2 September 1994 against the Black Ferns in Sydney.",
        "layout": "full",
        "background": "brand"
      },
      "children": [
        {
          "id": "9d38f378-5d94-4243-b1cb-1c99dca70836",
          "type": "cardGrid",
          "props": {
            "title": "",
            "variant": "grid",
            "cards": [
              {
                "image": {
                  "url": "https://images.unsplash.com/photo-1496224027003-38fc92be458c?auto=format&fit=crop&w=1600&q=80",
                  "alt": "Black and white photo of women playing rugby"
                },
                "heading": "1998: first World Cup"
              },
              {
                "image": {
                  "url": "https://images.unsplash.com/photo-1767190937750-d6aaf8ea99d0?auto=format&fit=crop&w=1600&q=80",
                  "alt": "Rugby stadium with goalposts and spectators in the stands"
                },
                "heading": "2029: home World Cup",
                "link": {
                  "label": "Back to home",
                  "href": "/"
                }
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
palette entry and the save validation came for free. **Text** was added the same way later
(`lib/components/textBlock.ts` and `components/site/TextBlock.tsx`), plus an
optional palette icon and a block in the stored-page fixture. **Stats** followed the same
steps.

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
`apps/web/lib/components/registry.ts`. It now appears in the editor's component
palette, with a text input, a textarea and an "Add button" toggle, and saves are
validated against the schema. Also add a `callToAction` block to
`tests/fixtures/stored-page-v1.json`; a test checks that the fixture covers every
component (see below).

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
`apps/web/components/site/siteComponents.ts`. If you forget, `npm run typecheck` fails
with "Property 'callToAction' is missing", so a registered component can never be
unrenderable.

Adding a prop to an existing component is the same idea: one line in its schema,
then use it in its render component. The form updates by itself.

**Rule: a new prop must be `.optional()` or have a `.default()`.** Pages already in
MongoDB were saved without it and nothing migrates them. A new required prop would
make them invalid: the renderer skips invalid blocks (the page still renders; in
development a warning box shows where), and the editor outlines them with "This field
is required" as soon as the page is opened. `tests/storedPages.test.ts` guards the
rule: it validates `tests/fixtures/stored-page-v1.json`, a page in the oldest stored
shape, and fails if a schema change breaks it. That is how Card Grid's `variant`
(`.default('grid')`) and card `text` (`.optional()`) were added. A breaking change
would need a migration script that rewrites the stored pages.

**Visual choices.** An enum can name a sketch for each option
(`optionSketches: { grid: 'grid', list: 'list' }` in `.meta()`); the form then shows
small skeleton pictures to pick from instead of a dropdown. The schema only holds the
names; the drawings live in the manager (`components/manager/Sketch.tsx`), and a test
checks every name has one. Card Grid's "Display as", Section's layout and width, and
Text's style use it.

The form generator (`lib/forms/describe.ts`) supports strings (text, textarea, URL),
numbers, booleans, enums, nested objects, lists (add, remove, reorder) and optional
values (Add / Remove toggle; omitted from props when absent). Labels and hints come
from `.meta()`, falling back to the humanised prop name.

## 5. Theming

- `lib/theme/defaultTheme.ts` defines the full token set: colours (`brand`,
  `brandContrast`, `background`, `surfaceLight`, `text`, `mutedText`), `radius`,
  `fonts` (`body`, `heading`), `headingCase` (`normal` or `uppercase`) and a
  `spacing` scale (`sm`, `md`, `lg`).
- Fonts are named, not CSS stacks: `lib/theme/fonts.ts` lists the fonts the app
  ships (self-hosted from `@fontsource` packages, imported in `app/layout.tsx`), and
  a theme picks one by name (`'oswald'`). Stored themes stay short and cannot point
  at a font that isn't loaded; an unknown name falls back to Inter.
- A site stores only `ThemeOverrides`, a deep-partial of the theme.
- `resolveTheme(defaults, overrides)` is a pure deep merge that returns a complete
  theme (unit-tested).
- `themeToCssVars(theme)` turns it into CSS variables on the site's wrapper element
  (`--color-brand`, `--radius-site`, `--font-site`, `--spacing-site-md`...).
  `app/globals.css` registers the same names as Tailwind theme variables, so site
  components use plain utilities such as `bg-brand text-brand-contrast rounded-site`.

Each seeded site sets its own colours, and takes its fonts, radius and spacing from
a look shared by its kind of site (`looks` in `scripts/seed/sites.ts`). The same
components then look clearly different without a line of component code changing:

| Kind of site      | Headings                    | Corners          | Feel                 |
| ----------------- | --------------------------- | ---------------- | -------------------- |
| Governing body    | Montserrat                  | 0.75rem          | Modern, official     |
| National teams    | Oswald, uppercase           | 0.25rem, roomier | Test-match headlines |
| Super Rugby clubs | Barlow Condensed, uppercase | Square           | Match-day poster     |
| State unions      | Nunito (body too)           | 1.5rem           | Friendly, local      |

Components only use the tokens (`rounded-site`, `font-site`, the `site-heading`
class), so a site can still override any single token on top of its look.

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
- Sample content, not the real sites. The organisations are real and their names and
  colours are used as sample data, but the copy was written for this demo from a few
  public facts (first Test dates, titles, home grounds, the 2027 and 2029 World Cups),
  no text was copied from rugby.com.au or the club sites.
- Logos are the organisations' official logos, used here only to make the demo
  realistic. They are hotlinked from the files on their English Wikipedia articles
  (upload.wikimedia.org), not copied into this repository, and remain the property
  of their owners. If a logo fails to load, the site shows its initials instead
  (`components/primitives/SiteLogo.tsx`). For a public deployment I would use logo
  files supplied by each organisation and store them with the site. Player names are deliberately
  not used, because squads change.
- Photos come from Unsplash (free to use under the Unsplash License; Unsplash+
  photos were excluded). I looked at each one and wrote its alt text to describe
  what is actually in it; none is presented as a specific Australian venue, team
  or player. The list is in `apps/web/scripts/seed/images.ts`; `photos.ts` groups
  them by subject and gives each site its own starting point, so pages rarely
  repeat a photo.

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
- **Vercel and MongoDB Atlas:** set `MONGODB_URI` / `MONGODB_DB` in Vercel, run the
  seed once as a manual job, and deploy `apps/web` with the workspace build command.
- **Per-site radius and type overrides:** already supported by `resolveTheme`; the work
  is choosing the values and checking contrast and layout per site.
- **Site editing UI:** a form for name, logo, favicon and theme colours that writes the
  `sites` document, with a contrast check for `brand` / `brandContrast`.
- **Menu control:** the public menu lists a site's top-level pages, home first, then by
  path. A `nav { label, order, hidden }` field on the page document would let editors
  rename, reorder or hide entries.
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
