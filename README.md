# Multi-Site Website Manager

One Next.js app that runs many rugby websites from a shared component library.
Editors compose pages in **`/manager`** from reusable components and edit their
content in forms generated from each component's schema. Public pages are
server-rendered at **`/sites/<site>/<path>`** from portable page JSON, each with
its own theme. Editors work on a **draft** with a **live preview** (an iframe of the
real renderer) and **publish** when ready; every publish is kept as a version. The seed creates **15 sites modelled on Australian rugby**: Rugby
Australia, the Wallabies, Wallaroos and Australia Sevens, the four Australian Super
Rugby clubs and seven state and territory unions, each with two pages and its own
colours (for example the Wallabies dark green and gold, the Reds maroon on white).

## The component library

| Component                | What it exercises                                                        | Props                                                                                                                                                       |
| ------------------------ | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Section** (required)   | Nesting: a container whose children can include other Sections           | `heading?`, `intro?`; `layout`: one column, two columns (even, wide left, wide right), three columns; `background`: none, light, brand; `padding?`; `width` |
| **Card Grid** (required) | Rich props: a list of nested objects with an optional link, plus theming | `title`, `variant`: grid, list, featured, overlay, carousel, masonry; `cards[]`: `{ image { url, alt }, heading, text?, link? { label, href } }`            |
| **Image Slider**         | Adding a component after the fact; a small interactive (client) piece    | `slides[]`: `{ image, heading, text?, button? }`; `autoplay`                                                                                                |
| **Text**                 | Long-form copy: paragraphs from one multiline field                      | `heading?`, `body` (an empty line starts a paragraph), `button?`, `style`: plain, centred, quote                                                            |
| **Stats**                | A list of small objects without images                                   | `stats[]`: `{ value, label }`                                                                                                                               |
| **Article**              | A story page: reading layout, date field                                 | `category`, `date` (date picker), `headline`, `standfirst`, `image`, `body` (`## ` starts a subheading)                                                     |
| **Latest news**          | A data-driven component (stretch goal)                                   | `title`, `category?`, `limit`, `display`: grid, list, featured. The cards come from the site's article pages at render time                                 |
| **Fixture list**         | A data-driven component fed by a mock API                                | `title`, `team?` (an Australian team), `show`: upcoming, results, both; `limit`. Matches come from the fixtures API at render time                          |
| **Profile cards**        | People: cut-out over own photo, colour picked from it; or initials       | `title`, `display`: carousel, grid; `rows`: one, two; `profiles[]`: `{ name, role?, text?, cutout?, background?, link? }`                                   |

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
column unless `rootBlockWidth()` (`lib/components/pageWidth.ts`) says otherwise; the
editor's preview is the same renderer, so it shows exactly what the site will. Nested Sections follow their parent; the renderer passes `nested` to every
component alongside `siteSlug`. `width` has a `.default('contained')`, so pages saved
before it existed render as before.

**Section style: three independent layers.** Each style option of a Section
changes one thing, and none of them reads another:

- **Background** is colour only (`surfaces` in `Section.tsx`). On a Section in
  the page column, a background turns it into a panel (`.section-panel` in
  `app/globals.css`) that pads its sides _and_ reaches out by the same amount,
  so adding or removing a background never moves the content off the page column.
- **Padding** is the space inside the section, above and below. Left out, it
  follows the width only (`sectionPadding()` in `lib/components/section.ts`:
  Medium, or None for Edge to edge), never the background.
- **Space between blocks** belongs to the page, not to any block:
  `PageColumnBlock` gives every page-column block the same spacing, whatever its
  type, on the public page and in the editor's preview alike. Full-width blocks sit
  flush, so coloured bands and a hero meet without gaps.

Editors choose named steps (`sm`, `md`, `lg`; `light`, `brand`), never pixel
values or colours: the site theme decides what each step looks like, so 30 sites
stay on brand and an editor cannot break a layout.

On public pages, a card with a link is clickable as a whole (one link per card,
stretched over it) and lifts on hover; a masonry photo without a link opens full size
in a viewer: the photo grows out of its place in the gallery (a Motion `layoutId`
shared by the gallery photo and the full-size one). On close the viewer's photo flies
back itself, on the top layer, while the background fades: its box is set to the
gallery spot and Motion animates the change, and it is removed only once it has
landed. Handing the return to the gallery photo instead would clip it (its card has
`overflow: hidden`) and hide it under the fading background. A strip
of thumbnails, the arrow buttons and the arrow keys switch photos with a crossfade, so
only one photo ever moves across the screen; after switching, closing simply fades. In the editor both are switched off, so a click only
selects the block.

**Profile cards.** A card for a person. The photo and a cut-out of the person
are the same 3:4 frame, so they line up exactly: the photo shows only below the
card's top third, the person is drawn whole, so the head rises out of the card,
and the card's colour fades up from the bottom over both and carries the text.
The colour is not a field: the server reads the bottom of each photo with `sharp`
(`lib/imageColor.ts`, cached per image) and `lib/color.ts` turns it into a shade that
keeps white text at a contrast of at least 4.5 (tested). The colours are worked out
before the page renders and passed in `data`, like Latest news, so the page arrives
with the right colours; in the editor a newly picked photo is read in the browser
with the same rule. Image fields accept site paths (`/players/x.webp`) as well as
https addresses. Without photos, the card keeps its shape and shows the player's
initials and a silhouette on the site's brand colour.

**Squads.** Every team site (the Wallabies, the Wallaroos, Australia Sevens and the
four Super Rugby clubs) has a Squad page listing every named player, 247 in all, and
its home page shows eight of them in a carousel. The names are in
`apps/web/scripts/seed/squads.ts`, each squad with its source and date, and the page
links to that source. Photos are the official squad photos from each team's squad
page on rugby.com.au or the club's site (list in `scripts/players/official.json`),
matched to players by name; a player without one (a new signing, a placeholder on
the club site) gets the plain card. `scripts/players/frame.py` cuts each person out
(rembg), cleans the edge (tightened slightly, softened, and the backdrop's colour
taken out of edge pixels, plus any patch of a green branded backdrop left beside
the head) and frames everyone the same way: official 3:4 headshots as they are,
other photos by the detected face. `publish.py` copies them into `public/players/` and
writes `scripts/seed/playerPhotos.ts`. Tests check each Squad page has exactly the
players in its source list and that every photo used exists with its backdrop.

**Motion.** Public pages use Motion (`motion` 14) for entrances: content settles in
the first time it scrolls into view, with a short rise, a fade and a light blur that
clears (12px, 4px blur, 1.2s, ease in and out). Cards and blocks side by side
arrive 0.15s apart. The timings, easing and entrance are a shared module in the UI package,
`@scottcheung/ui/motion`, so other products can move with the same rhythm. Only content animates: a Section, Card Grid or Latest news lets its items do
it, so nothing animates twice (`animatesAsWhole` in `apps/web/lib/motion.ts`, the one
rule specific to this app). Slider captions come in line by line
on each slide change. `Reveal` (`components/site/Reveal.tsx`) is a small client
wrapper, so the site components stay server-rendered. Choices:

- The first block on a page is not animated, so the top of the page is there before
  JavaScript runs; a `<noscript>` rule shows everything if it never does.
- The editor's preview keeps the same animations, since it is the public renderer:
  a newly added block animates in once.
- `MotionConfig reducedMotion="user"`: visitors who ask for less motion get fades
  only. Card hover uses CSS `translate`, which Motion's inline `transform` does not
  override.

**Articles and Latest news.** Cards that point to a section ("About us") are
navigation; stories are articles. An article is an ordinary page with an Article
block, under `/news/...`. Latest news is the data-driven component: the editor sets
only `title`, `category`, `limit` and `display`, and when a page renders the cards are
filled from the site's article pages, newest first (`lib/news.ts`, pure and tested).
The renderer reads the site's pages once per request and hands every component a
`data` object next to `siteSlug`; the preview route builds the same data
(`lib/render/pageData.ts`), so the preview shows real articles. Only published pages
count as articles. Under an article, Latest news leaves that article out, so "More
news" never repeats the page you are on.

Trade-off: summaries are worked out from the page trees on each request, which is fine
for dozens of articles per site. With thousands, I would store an article's summary
(date, category, headline) on the page document when it is saved, index
`{ siteSlug, date }`, and let Latest news query that.

**Fixture list and the mock fixtures API.** The stretch goal asks for data from a mock
API at render time, and fixture lists are one of the blocks the brief names. The
editor sets only `title`, `team`, `show` and `limit`; the matches come from
`lib/fixtures/mockApi.ts`, which stands in for a sports data provider:

- It behaves like a live feed. Status and score depend on the time of the request:
  a match has no score until it is over (two hours after kick-off for XVs, half an
  hour for sevens), so the same page shows "upcoming" one week and a result the next.
  Scores are sample data, made up from a stable hash of the match, so they never
  change between requests.
- The same API is served over HTTP at `GET /api/fixtures?team=wallabies`. The
  renderer calls `getFixtures()` directly instead (same process, no round trip);
  replacing the mock with a real provider means swapping that one function for a
  `fetch` returning the same `Fixture` shape.
- While a page renders, `fixturesForTree()` (`lib/fixtures/forTree.ts`) finds the
  page's Fixture lists, including ones nested in Sections, and makes one call per
  team they ask for, or none if the page has no Fixture list. The preview loads
  every fixture instead, so switching a list to another team updates the preview
  straight away.
- `selectFixtures()` is pure and used by the component itself: upcoming
  matches soonest first, results newest first. Kick-off times are shown in Sydney
  time (`Sun, 8 Nov, 2:10 am AEDT`) with a fixed time zone, so server and browser
  render the same text.
- The block is atomic: one column of match cards and nothing else. It lays out
  no columns of its own; the Section around it does. The seed's fixtures band is
  a two-column Section holding two Fixture lists, Upcoming and Results.
- The block has no background of its own: borders and secondary text use the current
  colour, so it reads on a plain, light or brand Section and on dark sites alike.

The seed puts a Fixture list on the Rugby Australia home page (every team), on each
national team's Matches page and on each Super Rugby club's home page.

The seeded articles are evergreen explainers, history and guides built from public
facts. None reports an invented event or quotes anyone.

## 1. Run it

Requirements: Node 22+, npm, Docker.

```sh
cp .env.example .env.local
docker compose up -d      # MongoDB 7 on localhost:27017
npm install
npm run seed              # drops and recreates the 15 sample sites and 130 pages (46 of them articles), all published as version 1
npm run dev
```

A database seeded before draft/publish existed can be kept instead of re-seeded:
`npm run migrate` turns each `{ title, tree }` page into `draft` = `published` =
that content (version 1). It skips pages already migrated, so it is safe to re-run.

- Manager: http://localhost:3000/manager
- Sites: for example http://localhost:3000/sites/wallabies, http://localhost:3000/sites/reds,
  http://localhost:3000/sites/rugby-australia (all of them are listed in the manager)

Checks, from the repository root: `npm test`, `npm run lint`, `npm run typecheck`,
`npm run build`. The publish-flow tests (`tests/publish.test.ts`) use MongoDB in a
throwaway `rugby_site_manager_test` database; without MongoDB running they are
skipped with a warning.

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
lib/types.ts, lib/db/      1. Page data: Site, Page (draft + published) and page_versions.
                              All MongoDB calls live in lib/db; lib/versions holds the
                              retention rule.
lib/components/            2. Component definitions: Zod schema, label, defaults, registry,
                              validateTree() and pure tree operations. No React.
app/manager/, components/manager/, lib/forms/
                           3. Manager: site list, page list, the page editor
                              (components/manager/editor), schema-driven forms,
                              Server Actions for writes.
app/sites/, app/preview/, components/site/, components/primitives/
                           4. Renderer: SitePage + RenderTree turn page JSON into HTML.
                              /sites renders published content on the server; /preview
                              renders the same SitePage inside the editor's iframe.
lib/theme/                 Default tokens, resolveTheme(), themeToCssVars().
```

They only meet through the registry. The manager imports definitions (schemas) and
never imports render code; the preview is a separate page in an iframe. The renderer
maps each `type` to a React component. Stored pages contain nothing but `type`,
`props` and `children`, so they can be rendered without the manager running, or by
another app with the same library.

### The page editor

```
┌ site ▾ │ page ▾ │ ↶ ↷ │ desktop/mobile │ full screen │ status │ Discard  History  Save draft  Publish ┐
├───────────────┬──────────────────────────────────────────────┬──────────────────────┤
│ Components    │                                              │ Inspector            │
│ ▸ Page        │   live preview: an <iframe> of               │ (only while          │
│   Section   + │   /preview/<site>/<path>                     │  something is        │
│     Card Grid │                                              │  selected; ~400 px,  │
│   Text        │                                              │  or "wide" overlay)  │
│ + Add         │                                              │                      │
└───────────────┴──────────────────────────────────────────────┴──────────────────────┘
```

- **Top bar.** Site and page switchers, undo / redo (⌘Z / ⇧⌘Z; typing in one field is
  one step), desktop / mobile width, full-screen preview (hides both panels), a status
  badge (**Unsaved changes**, **Unpublished changes** or **Published**), and Discard
  changes, History, Save draft (⌘S) and Publish.
- **Left: the component tree**, at any depth, collapsible to a thin rail. Each row
  selects its component and has move up / down (within its own list), duplicate and
  delete; deleting a Section that has components inside asks first. The page row and
  each Section have a **+** that opens a picker of every registered component with its
  one-line description (read from the registry); the new component goes at the end of
  that Section, or of the page. An always-visible **Add component** button does the
  same for the page.
- **Right: the inspector**, hidden until something is selected. It shows the form
  generated from the selected component's schema (Content / Style tabs), or the page
  settings (title, description, address, delete) when the page row is selected. A
  **wide** toggle turns it into an overlay over most of the preview for heavy editing.
  In list fields (Card Grid cards, slides...) each item collapses to one summary row and
  expands on click; items can be added, removed and reordered.
- **Validation runs on every change** with the same `validateTree()` the server uses,
  so an error shows next to the exact field and as a red dot on the tree node (and the
  collapsed list item) that contains it, before anyone presses Save.
- **Unsaved work is protected**: closing or reloading the tab warns, and switching
  page or site asks first.

All edits go through one `useReducer` over the draft and the pure functions in
`lib/components/tree.ts` (`insertNode`, `moveBy`, `duplicateNode`, `removeNode`...).
The shared panels are built from `@scottcheung/ui` (`TreeItem` and `Collapsible` were
added to it for this editor).

**Why the preview is an iframe of the real renderer.** An imitation of the public page
inside the manager drifts: different CSS, different wrappers, manager styles leaking
in. Here there is nothing to drift: `/preview/<site>/<path>` renders the same
`SitePage` component as `/sites/<site>/<path>`, with the same `RenderTree`, theme
variables and site stylesheet. The design system's CSS is only imported under
`/manager`, so it never reaches either page.

- The iframe loads **once**. The editor posts the in-memory draft to it with
  `postMessage`, debounced 150 ms, and the preview re-renders from React state. It is
  never reloaded on an edit, so scroll position and loaded images stay. Both sides
  check that a message comes from the other window on the same origin
  (`lib/preview/messages.ts`).
- **Click to select.** In preview mode only, `RenderTree` wraps each component in a
  `display: contents` element carrying `data-component-id`, which adds no box, so the
  layout is unchanged. A click finds the innermost id, the preview posts it, and the
  editor selects it in the tree and opens the inspector. The selection is drawn as an
  outline overlay in the preview. Public pages get no wrappers and no attributes.
- **Desktop / mobile** only changes the iframe's width (390 px for mobile), so the
  site's own CSS breakpoints and container queries apply exactly as on a phone.
- Edits show before saving; saving and publishing are about persistence only.
- Clicks in the preview select instead of following links, so carousels and the photo
  viewer are not interactive there. Data that the server works out (colours picked from
  a new Profile card photo) appears after the next save and reload.

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

A page is one MongoDB document with two copies of its content: `draft` (what the
editor saves) and `published` (what visitors see, or `null` if the page was never
published). `components` is the portable part: plain JSON, with no ObjectIds and no
Dates. Each node is `{ id, type, props, children? }`; only components that accept
children (Section) have `children`. Shortened example:

```json
{
  "_id": { "$oid": "6affae335bf06984678bcf3a" },
  "siteSlug": "wallaroos",
  "path": "/history",
  "updatedAt": { "$date": "2026-11-21T04:12:09.120Z" },
  "draft": {
    "title": "History",
    "description": "Where the team comes from.",
    "components": [
      {
        "id": "dc0c9323-9032-4b4a-a731-25d3e3701275",
        "type": "section",
        "props": {
          "heading": "Our history",
          "layout": "full",
          "background": "brand"
        },
        "children": [
          {
            "id": "9d38f378-5d94-4243-b1cb-1c99dca70836",
            "type": "cardGrid",
            "props": {
              "title": "Milestones",
              "variant": "grid",
              "cards": [
                {
                  "image": {
                    "url": "https://images.unsplash.com/photo-1496224027003-38fc92be458c?auto=format&fit=crop&w=1600&q=80",
                    "alt": "Black and white photo of women playing rugby"
                  },
                  "heading": "1998: first World Cup",
                  "link": { "label": "Read more", "href": "/news" }
                }
              ]
            }
          }
        ]
      }
    ]
  },
  "published": {
    "title": "History",
    "description": "Where the team comes from.",
    "components": ["... the content as it was at the last publish ..."],
    "version": 3,
    "publishedAt": { "$date": "2026-11-20T02:19:31.695Z" }
  }
}
```

Each publish is also stored in `page_versions` as
`{ pageId, version, title, description?, components, publishedAt }`, with a unique
index on `{ pageId: 1, version: -1 }`.

Paths are normalised: `/` for home, otherwise a leading slash, lowercase and no
trailing slash. The path lives outside `draft` / `published`: changing it is saved
straight away (see trade-offs). Links inside page JSON are site-relative (`/about`)
and the renderer prefixes them with `/sites/<slug>`, so the same JSON would work under
a custom domain.

## 4. Adding a new component

**Image Slider was added this way**, after Section and Card Grid were finished: a
schema file (`lib/components/imageSlider.ts`, reusing the shared image and link
fields from `lib/components/fields.ts`), a render component
(`components/site/ImageSlider.tsx`) and two registry lines. The manager form, the
entry in the "+" picker and the save validation came for free. **Text** was added the same way later
(`lib/components/textBlock.ts` and `components/site/TextBlock.tsx`), plus an
optional picker icon and a block in the stored-page fixture. **Stats** followed the same
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
`apps/web/lib/components/registry.ts`. It now appears in the editor's "+" picker
(label and description from the definition), with a text input, a textarea and an
"Add button" toggle, and saves and publishes are validated against the schema. Also add a `callToAction` block to
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
make them invalid: the renderer skips invalid blocks (the page still renders; the
editor's preview and development builds show a note where), and the editor marks
them with "This field is required" as soon as the page is opened. `tests/storedPages.test.ts` guards the
rule: it validates `tests/fixtures/stored-page-v1.json`, a page in the oldest stored
shape, and fails if a schema change breaks it. That is how Card Grid's `variant`
(`.default('grid')`) and card `text` (`.optional()`) were added. A breaking change
would need a migration script that rewrites the stored pages.

**Tabs.** `.meta({ group: 'content' | 'layout' | 'style' })` puts a field on a tab of
the editing form (layout fields share the Style tab); `groupFields()` in `lib/forms/describe.ts` does the split.

**Visual choices.** An enum can name a sketch for each option
(`optionSketches: { grid: 'grid', list: 'list' }` in `.meta()`); the form then shows
small skeleton pictures to pick from instead of a dropdown. The schema only holds the
names; the drawings live in the manager (`components/manager/Sketch.tsx`), and a test
checks every name has one. Card Grid's "Display as", Section's layout and width, and
Text's style use it.

The form generator (`lib/forms/describe.ts`) supports strings (text, textarea, URL),
numbers, booleans, enums, nested objects, lists (collapsible items; add, remove,
reorder) and optional
values (Add / Remove toggle; omitted from props when absent). Labels and hints come
from `.meta()`, falling back to the humanised prop name.

## 5. Draft, publish and versions

- **Save draft** validates the page (`validateTree()`) and writes `draft` and the
  address only. Visitors see no change.
- **The public route reads only `published`** (`getPublishedPage()` returns nothing
  else), so a page never published is a 404, and the public menu and Latest news
  list published pages only. The preview reads the draft.
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
- The seed publishes every page as version 1; `npm run migrate` does the same for a
  database from before this change.

## 6. Theming

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

## 7. Key decisions and trade-offs

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
- **Preview as an iframe of the real renderer vs an in-manager canvas.** An earlier
  version drew the page inside the manager with editing chrome and drag and drop. It
  looked close, but it was a second rendering path that had to be kept in step with
  the public one, and the manager's CSS was on the same page. The iframe costs a
  postMessage protocol and gives up drag and drop on the page; in exchange the preview
  is the public renderer, at real breakpoints, by construction.
- **Tree panel with buttons vs drag and drop.** Up / down, duplicate, delete and "+" are
  plain buttons: easy to discover, keyboard-accessible, and each is one pure tree
  function with a test. Drag and drop in the tree is in "What's missing".
- **Fields in a panel, not inline text editing.** Text is edited in generated form
  fields rather than typed on the page. That keeps "no form code per component" true;
  inline editing could be added later with a `.meta({ inline: true })` flag.
- **Explicit save and publish vs autosave.** Two clear steps: Save draft stores work in
  progress, Publish makes it public. Both are obvious to an editor and easy to reason
  about in the code. Save draft validates too, so a stored draft can always be rendered.
- **Path outside draft / published.** Changing a page's address takes effect on save,
  not on publish. Versioning the path would mean resolving public URLs through
  `published.path` and handling clashes at publish time; for a small team the simpler
  rule is acceptable, and the address field warns that old links stop working.
- **Whole page as one document vs normalised components.** A page is read and written
  as one unit, which matches how it is rendered and keeps it portable. The cost is
  that a component cannot be shared between pages, and two editors saving the same
  draft at once means the last save wins (publish itself cannot double-number a
  version, see above).
- **Path-prefix routing vs domain routing.** `/sites/<slug>/...` works locally with no
  DNS setup. Domains would be a `domains` field on each site plus a Next.js middleware
  that rewrites `rugby.example.com/about` to `/sites/<slug>/about`; the renderer would
  not change.
- **Monorepo for the UI library.** My own `@scottcheung/ui` lives in `packages/ui` so
  it can be reused and published separately; the app consumes it like an external
  package.
- **No authentication**, as allowed by the brief: there is a single editor.

## 8. Assumptions

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
  files supplied by each organisation and store them with the site. Player names on the Squad
  pages are from each team's published squad (sources in `scripts/seed/squads.ts`)
  and will go out of date as squads change.
- Player photos are the official squad photos of Rugby Australia and the clubs
  (rugby.com.au, reds.rugby, brumbies.rugby, waratahs.rugby, westernforce.rugby),
  cut out and cropped for the cards. They belong to their owners and are used here
  for a demonstration only; a public site would use photos supplied by each team.
- Photos come from Unsplash (free to use under the Unsplash License; Unsplash+
  photos were excluded). I looked at each one and wrote its alt text to describe
  what is actually in it; none is presented as a specific Australian venue, team
  or player. The list is in `apps/web/scripts/seed/images.ts`; `photos.ts` groups
  them by subject and gives each site its own starting point, so pages rarely
  repeat a photo.

## 9. What's missing and how I would build it

- **Authentication:** Auth.js (or the organisation's SSO) on `/manager` and the Server
  Actions, with per-site roles stored on the user.
- **Drag and drop in the tree:** the up / down buttons call `moveBy()`; dragging would
  call the existing `moveNode(tree, id, { parentId, index })`, which already handles
  moving into and out of Sections and refuses to drop a Section into itself.
- **Insert between components:** "+" adds at the end of a Section or the page today; a
  "+" between rows would pass that row's index to the same `insertNode()`.
- **Version diff:** compare two versions' trees by component id (added, removed,
  moved, props changed) and highlight those components in two previews side by side.
- **Scheduled publish and approvals:** a `scheduledFor` on the page and a cron job
  that calls `publishPage()`; an approval step would be a `review` state between
  draft and published.
- **Asset upload and cleanup:** see "Images stay external URLs" in section 5.
- **Inline text editing in the preview:** mark string fields with `.meta({ inline: true })`;
  the preview makes those elements editable and posts the text back.
- **Vercel and MongoDB Atlas:** set `MONGODB_URI` / `MONGODB_DB` in Vercel, run the
  seed once as a manual job, and deploy `apps/web` with the workspace build command.
- **Per-site radius and type overrides:** already supported by `resolveTheme`; the work
  is choosing the values and checking contrast and layout per site.
- **Site editing UI:** a form for name, logo, favicon and theme colours that writes the
  `sites` document, with a contrast check for `brand` / `brandContrast`.
- **Menu control:** the public menu lists a site's top-level pages, home first, then by
  path. A `nav { label, order, hidden }` field on the page document would let editors
  rename, reorder or hide entries.
- **Concurrent editing:** send the page's `updatedAt` with each save and publish, and
  reject them if it changed in the meantime.

## 10. Time and tools

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
