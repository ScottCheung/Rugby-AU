# Multi-Site Website Manager

One Next.js app that runs many rugby websites from a shared component library.
Editors compose pages in **`/manager`** and edit everything in one panel whose
forms are generated from each component's schema. Public pages are
server-rendered at **`/sites/<site>/<path>`** from portable page JSON, each with
its own theme. Editors work on a **draft** with a **live preview** (an iframe of
the real renderer) and **publish** when ready; every publish is kept as a version.

The seed creates **15 sites modelled on Australian rugby** (Rugby Australia, the
Wallabies, Wallaroos and Australia Sevens, the four Australian Super Rugby clubs
and seven state and territory unions), about 100 pages, 46 news articles and 247
players, each site in its own colours and type.

## 1. Run it

Requirements: Node 22+, npm, Docker.

```sh
cp .env.example .env.local
docker compose up -d      # MongoDB 7 on localhost:27017
npm install
npm run seed              # drops and recreates the sample sites, pages, articles and players
npm run dev
```

- Manager: http://localhost:3000/manager
- Sites: for example http://localhost:3000/sites/wallabies,
  http://localhost:3000/sites/reds, http://localhost:3000/sites/rugby-australia

Checks, from the repository root: `npm test`, `npm run lint`, `npm run typecheck`,
`npm run build`. The publish-flow tests use MongoDB in a throwaway
`rugby_site_manager_test` database and are skipped (with a warning) without it.

A database from before blocks were components of their own can be kept instead of
re-seeded: `npm run migrate` upgrades every stored page and past version
(`lib/migrate/blocksFromColumns.ts`, tested). It is idempotent.

## 2. The component library

A page is a tree of two kinds of component:

- **Section** (the required container). An optional heading and intro, then its
  children laid out in `columns`: one, two (even, wide left, wide right) or three.
  Children are blocks **or other Sections**; they fill the columns in order and
  wrap to a new row. `background`: none, light or brand (resolved from the site
  theme); plus `align`, `padding` and `width` (page column, wide, edge to edge).
- **Blocks**: a list of items, laid out one way, each item drawn the block's way.
  Every block has the same three props, one per editor tab:

| Prop      | Tab     | What it says                                                                                                                                                                                                                                               |
| --------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `content` | Content | Where the items come from: `{ from: 'items', items: [...] }` written here, or a data source with its options (`{ from: 'news', mode: 'latest', limit: 3 }`)                                                                                                |
| `layout`  | Layout  | One of six arrangements, each with only its own options: `grid` (per row), `list`, `featured` (first one large), `wall` (each keeps its height), `carousel` (one or two rows), `slider` (one at a time, autoplay). Shared by every block, implemented once |
| `style`   | Style   | The block type's own options: a card's photo shape, a number's size                                                                                                                                                                                        |

| Block       | One item is                               | Its style options                                   | Items can come from                            |
| ----------- | ----------------------------------------- | --------------------------------------------------- | ---------------------------------------------- |
| **Cards**   | a photo card (the brief's Card Grid)      | photo above / text on photo, photo shape, show text | written, News, This article                    |
| **Text**    | a heading, paragraphs and a button        | plain, centred, quote, headline, story              | written, News, Players, This article           |
| **Hero**    | a large photo with its caption on it      | banner or tall                                      | written, News, This article                    |
| **Photos**  | a photo at its own shape; opens full size | show the caption                                    | written, News, This article                    |
| **Numbers** | a big number and a label                  | medium or large                                     | written, This article                          |
| **People**  | a person card: cut-out photo or initials  | (none)                                              | written, News, Players, Fixtures, This article |
| **Matches** | a match card                              | show the venue                                      | Fixtures only                                  |

**Items have one shared vocabulary of fields** (`title`, `subtitle`, `text`,
`value`, `image`, `cutout`, `background`, `link`: "roles",
`lib/components/blocks/roles.ts`). A block type says which roles it reads and
how it labels them ("Heading", "Name"); a data source says which roles it fills
in. Two consequences:

- **The same items can be drawn another way.** "Each item looks like" on the Style
  tab switches a block between types; its items and layout stay. A type that
  needs a field the items lack says so and shows a striped placeholder until it
  is filled in (and cannot be published before).
- **Which data a block can show is a rule, not a list.** A source fits a block
  when it fills in every role the block requires (`sourceFits`): news fills a
  heading, text, an image and a link, so it can be cards, a hero carousel or a
  list of headlines; numbers need a value, so they cannot show news; matches need
  a match, which only the fixtures service provides, so they are never written by
  hand. The editor only offers what fits, and validation enforces it.

**Data sources** (`lib/components/blocks/sources.ts`) are the stretch goal's
data-driven components, generalised: the site's **News** and **Players**
(collections stored in MongoDB, edited in the manager), the **Fixtures** service
(a mock API, `lib/fixtures/mockApi.ts`, also served at `GET /api/fixtures`), and
**This article** (on the news template: each role bound to one of the article's
fields, "Heading ← Headline"). Each turns its records into items with the shared
roles; the renderer, the preview and the editor's Layers tree all use the same
function (`blockItems`), so they always agree.

**Nothing outside a definition names a block type or a data source.** A source's
definition holds everything about it: its options, how its records become items,
how a block of it is named in Layers, which collection its records are edited in
(so clicking one in the preview opens that entry's form), what can be picked by
hand, and the ready-made block "Add a block" offers. What it loads on the server
is one function in `lib/render/sourceData.ts` (typed by source id, so it cannot
be forgotten; kept apart so the definitions stay browser-safe). An item renderer
gets only the item and its block's style: a match carries the team it is seen
from and a person card the colour picked from its photo, filled in when items
are resolved. The editor treats any component that `acceptsChildren` as a
container (child list, "Add a block", drag rules), not Sections by name.

**Arrangements are implemented once** (`components/site/blocks/Arrangement.tsx`):
an item is drawn into a cell and never knows whether the cell is in a grid or a
carousel. Cells are CSS size containers, so an item adapts to the room it gets
(a card in a one-per-row list puts its photo beside the text). A block type only
tunes sizes: how narrow a cell may get and how many a carousel shows.

**Articles are data, not a component.** A news article is an entry with fixed
fields (category, date, headline, standfirst, image, body) because lists, filters
and cards read them. How an article page looks is the site's **news template**: a
page made of the same Sections and blocks as any other, whose blocks take their
items from "This article". Changing the template changes every article page.

## 3. Architecture

```
packages/ui/   @scottcheung/ui: my own generic, themeable React primitives (Button,
               Input, Dialog, Toast...). Nothing about rugby, pages or MongoDB.
apps/web/      The task: one Next.js App Router app (manager + renderer).
```

Inside `apps/web`, four layers that only meet through the component registry:

```
lib/types.ts, lib/db/          1. Page data: sites, pages (draft + published), page
                                  versions and collection entries. All MongoDB calls
                                  live in lib/db.
lib/components/                2. Component definitions: Zod schemas, the registry,
  section.ts                      validateTree() and pure tree operations. No React.
  blocks/                         Block types, roles, layouts, data sources and
                                  blockItems(), which turns a block into items.
app/manager/, components/manager/, lib/forms/
                               3. Manager: site list, the page editor, schema-driven
                                  forms, Server Actions for writes.
app/sites/, app/preview/, components/site/, components/primitives/
                               4. Renderer: RenderTree turns page JSON into HTML.
                                  /sites renders published content on the server;
                                  /preview renders the same page in the editor's iframe.
lib/theme/                     Default tokens, resolveTheme(), themeToCssVars().
```

The manager imports definitions (schemas) and never render code; the preview is
a separate page in an iframe. Stored pages contain nothing but `type`, `props`
and `children`, so they render without the manager running.

### The editor: one selection, one form

```
┌ site ▾ │ page ▾ │ ↶ ↷ │ desktop/tablet/mobile │ status │ Discard  History  Save draft  Publish ┐
├───────────────┬────────────────────────────────────┬────────────────────────────┤
│ Site          │                                    │ Site › Home › Our teams    │
│  Settings     │   live preview: an <iframe> of     │ › Cards · 4                │
│  News      5  │   /preview/<site>/<path>           │ ┌Content┬Layout┬Style┐    │
│  Players  40  │                                    │ │ generated form      │    │
│ Layers        │                                    │                            │
│  ▾ Our teams  │                                    │                            │
│    ▾ Cards    │                                    │                            │
│       · item  │                                    │                            │
└───────────────┴────────────────────────────────────┴────────────────────────────┘
```

- **One panel edits everything**: site settings, the page, a Section, a block, one
  item, and the site's articles and players. Clicking a news card in the preview
  opens that article's form right there.
- **Three fixed tabs at every level.** For a block they are its three props; for
  a Section, its fields grouped by `.meta({ group })`. A tab with nothing at that
  level says who owns it, with a link.
- **Layers is the only navigation**, down to single items. A click in the preview
  selects the deepest thing under the pointer; Esc goes up one level.
- **Creating**: "Add a block" lists every block type and the ready-made "from the
  site" ones (News, Players, Fixtures), and a Section inside a Section. It opens
  from an empty column in the preview, a Section's panel or its row in Layers;
  "Add a section" does the same for the page.
- **Validation runs on every change** with the server's `validateTree()`; errors
  show by the field and as red dots on tabs and tree rows. Undo/redo covers every
  edit; unsaved work is protected.
- **Why an iframe of the real renderer.** An imitation inside the manager drifts.
  Here the preview is the public renderer by construction; the editor posts the
  in-memory draft to it with `postMessage` and it re-renders in place.

More detail on what each level edits: [docs/editing-model.md](docs/editing-model.md).

## 4. Page JSON format

A page is one MongoDB document with two copies of its content: `draft` (what the
editor saves) and `published` (what visitors see, or `null`). `components` is the
portable part: plain JSON, each node `{ id, type, props, children? }`. The Wallaroos
news page, as stored (`apps/web/scripts/seed/data/wallaroos.json`):

```json
{
  "siteSlug": "wallaroos",
  "path": "/news",
  "draft": {
    "title": "News",
    "description": "News, history and match-day guides from the Wallaroos.",
    "components": [
      {
        "id": "59c4b7e8-8a26-4084-9418-ce31b6ddd0e4",
        "type": "section",
        "props": {
          "columns": "1",
          "background": "none",
          "padding": "md",
          "width": "full-background"
        },
        "children": [
          {
            "id": "4863a060-7a5d-4b13-ac00-15e575149317",
            "type": "text",
            "props": {
              "content": {
                "from": "items",
                "items": [
                  {
                    "title": "News",
                    "text": "News, history and match-day guides from the Wallaroos."
                  }
                ]
              },
              "layout": { "arrange": "grid", "perRow": "1" },
              "style": { "variant": "centered" }
            }
          },
          {
            "id": "be53c5df-dab1-41ad-ac43-caa1913965a2",
            "type": "cards",
            "props": {
              "content": { "from": "news", "mode": "latest", "limit": 12 },
              "layout": { "arrange": "grid", "featured": true },
              "style": { "look": "card", "ratio": "wide", "showText": true }
            }
          }
        ]
      }
    ]
  },
  "published": { "...": "the same shape, plus version and publishedAt" }
}
```

Each publish is also stored in `page_versions`. Paths are normalised (`/`, or a
leading slash, lowercase, no trailing slash). Links in page JSON are
site-relative (`/about`) and the renderer prefixes `/sites/<slug>`, so the same
JSON would work under a custom domain. News articles and players are documents in
`entries` (`{ siteSlug, collection, slug, data, status }`).

The seed is this JSON: one file per site in `apps/web/scripts/seed/data/`, with
its pages and entries, checked against the component library before anything is
written.

## 5. Adding a new component

A block type is two small files and two registry lines. Example: **Quotes**, a
pull quote with who said it.

**1. Define it** (`apps/web/lib/components/blocks/quotes.ts`). Only what is its
own: the roles its items read, its style options, its defaults.

```ts
export const quotes = defineBlock({
  type: 'quotes',
  label: 'Quotes',
  description: 'What people said, large, with who said it.',
  itemLabel: 'Quote',
  itemsLabel: 'Quotes',
  sketch: 'text-quote',
  roles: { text: required('Quote'), title: required('Who said it') },
  style: z.object({ size: z.enum(['m', 'l']).meta({ label: 'Size' }) }),
  defaults: { layout: { arrange: 'slider' }, style: { size: 'l' } },
});
```

**2. Draw one item** (`apps/web/components/site/blocks/QuoteItem.tsx`); the
props are typed from the definition:

```tsx
export function QuoteItem({ item, style }: ItemProps<'quotes'>) {
  return (
    <figure className={style.size === 'l' ? 'text-3xl' : 'text-xl'}>
      <blockquote className="site-heading">{item.text}</blockquote>
      <figcaption>— {item.title}</figcaption>
    </figure>
  );
}
```

**3. Register it**: add `quotes` to `blockDefinitions` in
`lib/components/registry.ts`, and `quotes: blockRenderer('quotes', QuoteItem)` to
`components/site/siteComponents.ts` (the build fails if a registered type has
no renderer).

That is all. The editor's "Add a block" picker, the "Each item looks like"
switch, the three tabs and their forms, the item form, grid and carousel, data
sources (News fits it: it fills in a heading and text), validation on save and
the Layers tree all come from the definition. A container component (like
Section) uses `defineComponent` with `acceptsChildren: true`; its fields go on a
tab by `.meta({ group: 'content' | 'layout' | 'style' })`.

**Adding a prop** is one line in the schema plus its use in the renderer; the form
updates by itself. A new prop must be `.optional()` or have a `.default()`, since
stored pages were saved without it. A breaking change gets a migration like
`blocksFromColumns` (pure, idempotent, tested against a stored page in
`tests/fixtures/`), run with `npm run migrate`.

**Adding a data source** is the same idea: a definition in
`lib/components/blocks/sources.ts` (the roles it fills in, its options, how its
records become items) and its loader in `lib/render/sourceData.ts`. Every block
whose required roles it fills can use it at once, and the editor offers it
(and its ready-made block) without further code.

**The form generator** (`lib/forms/describe.ts` turns a Zod schema into plain field
descriptors, `SchemaForm` draws them) supports strings, numbers, booleans, enums
(drawn as pictures when `optionSketches` are given), nested objects, lists,
optional values, and discriminated unions (a picker for the shape, then that
shape's fields: how a block's content and layout are edited). `.meta()` adds
labels, hints, `showIf` (a field that only applies to some values) and `managed`
(kept by the editor itself, such as the articles a block hides).

## 6. Draft, publish and versions

- **Save draft** validates the page (`validateTree()`) and writes `draft` and the
  address only. Visitors see no change.
- **The public route reads only `published`** (`getPublishedPage()` returns nothing
  else), so a page never published is a 404, and the public menu lists published
  pages only. The preview reads the draft.
- **Publish** (`publishPage()` in `lib/db/pages.ts`) saves first if there are unsaved
  edits, validates the stored draft again (it may predate a schema change), copies it
  into `published` with `version + 1` and `publishedAt`, inserts the same into
  `page_versions`, then applies retention. The version record is inserted first: its
  unique `{ pageId, version }` index makes a second, racing publish of the same number
  fail before the page changes.
- **Discard changes** sets the draft back to `published` (after a confirmation).
- **History** (a drawer) lists the kept versions with their time. **View** loads that
  version's components into the preview, read-only, with a banner; **Restore to draft**
  copies it into the draft, and the editor publishes as usual. Restore is disabled
  while there are unsaved changes, so it can never overwrite them silently. There is
  no diff view.
- **Retention**: keep the latest **10** versions of each page, plus **every** version
  published in the last **30 days** (`KEEP_LATEST_VERSIONS` and `KEEP_RECENT_DAYS` in
  `lib/versions/retention.ts`, applied after each publish). The count means a page that
  rarely changes still has history to roll back to, however old; the time window
  means a busy launch day with twenty publishes cannot push out last week's version.
  Versions hold only JSON (a few KB each), so the cost is small either way.
- **Images stay external URLs.** There is no upload, so nothing to clean up yet. With
  uploads, cleanup would be a scheduled **mark-and-sweep**: mark every asset referenced
  by any page's draft, published content or a retained version (the `{ url, alt }`
  shape is already found by `lib/media.ts`), then delete unmarked assets only if they
  are older than a grace period (for example 7 days), so an image uploaded into an
  unsaved draft, or referenced by a version about to be restored, is not lost.
- The seed publishes every page as version 1.

## 7. Theming

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
a look shared by its kind of site (`lib/theme/looks.ts`). The same
components then look clearly different without a line of component code changing:

| Kind of site      | Headings                    | Corners          | Feel                 |
| ----------------- | --------------------------- | ---------------- | -------------------- |
| Governing body    | Montserrat                  | 0.75rem          | Modern, official     |
| National teams    | Oswald, uppercase           | 0.25rem, roomier | Test-match headlines |
| Super Rugby clubs | Barlow Condensed, uppercase | Square           | Match-day poster     |
| State unions      | Nunito (body too)           | 1.5rem           | Friendly, local      |

Components only use the tokens (`rounded-site`, `font-site`, the `site-heading`
class), so a site can still override any single token on top of its look.

## 8. Key decisions and trade-offs

- **Blocks are item type × arrangement × data source, not one component per
  combination.** The brief's Card Grid is "cards in a grid"; a carousel of cards,
  a list of headlines from news, or people from the squad are the same parts
  combined differently. Each part is defined once (an item renderer, two
  arrangements, four sources), so adding one of them multiplies, rather than adds
  to, what editors can build. The cost: a block's props are nested
  (`content / layout / style`) rather than flat, and a new block type has to
  express its fields as roles.
- **Only a Section has a heading.** Blocks are atomic: no title of their own, so
  there is one place for a heading and nested headings never compete. The page
  title is the page's one `<h1>`; a hero's or an article's headline is large
  but an `<h2>`. The brief's
  Card Grid `title` is the Section heading around it.
- **Section children fill columns in order** rather than sitting in fixed column
  slots: the page tree is exactly the brief's `section > children`, and any child
  can be another Section.
- **Articles as data plus a template made of blocks.** Fixed fields where lists
  need them, and the layout of every article page in one editable page. The body
  is still one text field (paragraphs and `## ` subheadings); a body made of
  blocks is in "What's missing".
- **Zod vs JSON Schema.** One Zod schema per component gives the TypeScript type
  (`z.infer`), runtime validation on save and on render, and the description the
  form generator walks. `z.toJSONSchema()` can export it if another stack needs it.
- **Official MongoDB driver vs Mongoose.** Data is already validated by Zod; the
  driver is thin and explicit, and all calls sit in `lib/db`.
- **Preview as an iframe of the real renderer.** It costs a small postMessage
  protocol and gives up dragging blocks around on the page itself (they are
  dragged in Layers); in exchange the preview cannot drift from the public site.
- **Explicit Save draft and Publish for pages; articles and players are live on
  save.** An article has no draft of its own yet: the panel says so next to the
  button. Unifying both on drafts is in "What's missing".
- **Whole page as one document.** Read and written as one unit, which matches how
  it renders and keeps it portable. The cost: a Section cannot be shared between
  pages yet, and the last of two concurrent saves wins.
- **Path-prefix routing.** `/sites/<slug>/...` works locally with no DNS; domains
  would be a field on the site and a middleware rewrite, with no renderer change.
- **No authentication**, as allowed by the brief.

## 9. Assumptions

- Section's two required layouts (full, two-column) are kept; two-column-wide and
  three-column are additions. Column counts react to the width a Section actually has
  (CSS container queries), so a Section nested in a column stacks earlier.
- The page title is used for `<title>` and is rendered as a visually hidden `<h1>`;
  visible headings come from the components.
- Paths are lowercase segments of letters, numbers and hyphens. A page's path can be
  changed in the editor (links to the old address then stop working) and a page can
  be deleted after a confirmation; neither was required by the brief.
- Image descriptions (alt text) are required. Image addresses must be `http(s)` URLs.
  Link addresses are site-relative (`/about`) or full `http(s)` URLs; anything else
  is not rendered.
- Strings are trimmed on save. Optional values are omitted from props when absent.
- On render, a node whose type is unknown or whose props no longer match the schema is
  skipped (with a note in the editor's preview and in development) instead of failing
  the whole page.
- `npm run seed` is destructive by design: it drops and recreates the `sites`,
  `pages` and `page_versions` collections. `npm run migrate` is the non-destructive
  path for an existing database.
- Sample content, not the real sites. The organisations are real and their names and
  colours are used as sample data, but the copy was written for this demo from a few
  public facts (first Test dates, titles, home grounds, the 2027 and 2029 World Cups),
  no text was copied from rugby.com.au or the club sites.
- Logos are the organisations' official logos, used here only to make the demo
  realistic. They are hotlinked from the files on their English Wikipedia articles
  (upload.wikimedia.org), not copied into this repository, and remain the property
  of their owners. If a logo fails to load, the site shows its initials instead
  (`components/primitives/SiteLogo.tsx`). For a public deployment I would use logo
  files supplied by each organisation and store them with the site. Player names are from each team's published squad and will go out of date as
  squads change.
- Player photos are the official squad photos of Rugby Australia and the clubs
  (rugby.com.au, reds.rugby, brumbies.rugby, waratahs.rugby, westernforce.rugby),
  cut out (rembg) and framed the same way for the cards by a one-off script, which
  lives in the git history (`scripts/players/`) now that the seed is plain JSON.
  They belong to their owners and are used here for a demonstration only; a public
  site would use photos supplied by each team.
- Photos come from Unsplash (free to use under the Unsplash License; Unsplash+
  photos were excluded). I looked at each one and wrote its alt text to describe
  what is actually in it; none is presented as a specific Australian venue, team
  or player.

## 10. What's missing and how I would build it

- **Shared Sections.** A Section saved at site level and referenced by pages
  (`{ type: 'shared', props: { ref } }`), edited in one place with a banner saying
  how many pages use it, and "detach" to make a page's own copy.
- **Article bodies made of blocks.** `body` as a list of block nodes (text,
  photos, quotes) rendered by the same `RenderTree`, edited in the article's panel.
- **User-defined collections.** News and players are two collections defined in
  code; the same shape (fields + a template page bound to them) could be created
  in the manager.
- **Drafts for articles and players**, like pages, and publish together.
- **Authentication:** Auth.js or the organisation's SSO, with per-site roles.
- **Version diff:** compare two versions by component id and highlight changes.
- **Asset upload and cleanup:** see "Images stay external URLs" above.
- **Concurrent editing:** send `updatedAt` with each save and reject stale ones.
- **Deployment:** Vercel with MongoDB Atlas; run the seed once as a manual job.

## 11. Time and tools

- Hours spent: about **TODO** hours in total. The draft / publish, live preview and
  editor layout work (stretch goals) came after the must-haves were working.
- AI tools used: **Codex** and **Claude** (Claude Code) for scaffolding,
  implementation and review. I reviewed and edited every change and can explain and
  change any line without them.

## Environment variables

| Variable      | Purpose                   | Default                     |
| ------------- | ------------------------- | --------------------------- |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017` |
| `MONGODB_DB`  | Database name             | `rugby_site_manager`        |

Put them in `.env.local` at the repository root (never committed).
