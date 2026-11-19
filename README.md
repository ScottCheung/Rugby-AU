# Rugby AU Site Manager

A small Next.js App Router application for composing portable page JSON and rendering it across multiple themed rugby websites. The editor and public renderer read from MongoDB; the local stack uses Docker Compose.

## Run locally

Requirements: Docker Desktop with Compose.

```sh
docker compose up --build
```

Open [http://localhost:3000](http://localhost:3000) for the manager. Public examples:

- [Wallabies](http://localhost:3000/s/wallabies)
- [Super Rugby Pacific](http://localhost:3000/s/super-rugby)

Compose starts MongoDB, waits for its health check, builds the app, seeds two sites and two home pages, then starts Next.js. Seed records use `$setOnInsert`, so restarting the app preserves editor changes. Stop the stack with `Ctrl+C`; remove the local database volume with `docker compose down -v` when you want a clean seed.

For app-only development, copy `.env.example` to `.env.local`, set `MONGODB_URI` and `MONGODB_DB`, start a MongoDB instance, then run `npm install`, `npm run seed`, and `npm run dev`.

Checks: `npm run lint`, `npm run typecheck`, `npm test` (Vitest, covering tree validation and schema defaults).

## Architecture

```
lib/components/        Component definitions: type, label, Zod props schema. No React.
  registry.ts          The list of components + parseComponentTree() (validation).
lib/schema.ts          Schema helpers: metadata, unwrap optional/default, default values.
components/site/       Renderer: one React component per type + RenderTree.
components/blocks/     Building blocks the site components use: Heading, ButtonLink, Image.
components/schema-form.tsx  Manager form generated from a Zod schema.
components/manager.tsx Manager UI: pages, component tree, save.
app/s/[siteSlug]/[[...path]]  Public pages, server-rendered, resolved by site + path.
app/api/pages          Create / update pages. Validates with the same registry.
```

Page data, component definitions, the manager and the renderer only meet through
the registry: the manager and API read definitions, the renderer maps each `type`
to a React component, and stored pages contain nothing but `type`, `props` and
`children`.

## Page JSON format

Each page document is independent of the editor. It identifies the owning site and route, then stores an ordered tree of component instances. A Section can nest any number of component instances, including another Section.

```json
{
  "id": "wallabies-about",
  "siteId": "wallabies",
  "path": "/about",
  "title": "About the Wallabies",
  "schemaVersion": 1,
  "status": "published",
  "updatedAt": "2026-11-19T00:00:00.000Z",
  "components": [
    {
      "id": "wallabies-about-columns",
      "type": "section",
      "props": { "layout": "two-column", "background": "none" },
      "children": [
        {
          "id": "wallabies-about-join",
          "type": "section",
          "props": { "layout": "full", "background": "brand" },
          "children": [
            {
              "id": "wallabies-about-join-grid",
              "type": "card-grid",
              "props": {
                "title": "Get involved",
                "cards": [
                  {
                    "image": {
                      "url": "https://images.unsplash.com/photo-1558151507-c1aa3d917dbb",
                      "alt": "A player carrying a rugby ball"
                    },
                    "heading": "Find a club near you",
                    "link": { "label": "Back to home", "href": "/" }
                  }
                ]
              }
            }
          ]
        }
      ]
    }
  ]
}
```

MongoDB stores sites and pages in separate collections. The page `siteId` plus `path` pair is unique. The renderer resolves a public page from `/s/[siteSlug]/[...path]`, loads its site theme and published page on the server, then renders the component tree. Unknown site/path combinations return a 404. Links inside page JSON are site-relative (`/about`) so the same page works under any domain or prefix.

## Adding a component

1. Create `lib/components/<name>.ts` with `defineComponent({ type, label, description, category, allowsChildren, props })`. `props` is a Zod object; add `.meta({ title, description, placeholder, optionLabels, itemLabel })` for editor labels and `.default()` for starting values.
2. Add it to `componentDefinitions` in `lib/components/registry.ts`.
3. Create its renderer in `components/site/<name>.tsx` (typed as `ComponentRenderer<'<type>'>`, so `props` are inferred from the schema) and add it to `renderers` in `components/site/render-tree.tsx`. TypeScript fails the build if a registered component has no renderer.

The manager form, API validation and the "Add" buttons are generated from the definition, so no form code is written. Adding a prop to an existing component is one line in its schema plus using it in its renderer. The form generator supports strings, numbers, booleans, enums, nested objects, lists (add, remove, reorder) and optional values.

## Decisions and trade-offs

- **Zod schemas as the single source of truth for props:** one schema per component gives runtime validation (API, seed, manager before save), TypeScript types (`z.infer`) for renderers and seed data, and the description the manager walks to build forms. A custom descriptor format would have needed its own validator and type inference; JSON Schema is still available via `z.toJSONSchema` if another app needs a portable description.
- **Definitions separate from renderers:** definitions contain no React, so the manager (client), API and seed script can import them without pulling in site components; each site renderer is typed from its definition.
- **Validation returns a normalised tree:** defaults are applied and unknown props dropped before saving, so stored JSON stays clean. The renderer validates again and skips components it cannot render instead of failing the page, and pages carry `schemaVersion` for future migrations.
- **Page documents stay portable:** renderer input contains only component types, props, and children. Theme tokens are resolved from the separately stored site when the server renders the page.
- **MongoDB official Node driver:** each page is a natural document, while sites are shared records. A unique compound index protects route identity, and lookups go through indexed `findOne` queries (by slug, by id, by site + path) rather than loading every site, which matters at 30+ sites.
- **Themes are design tokens mapped to CSS variables:** colours, heading font and radius per site, including the `--ui-*` tokens of the shared `@scottcheung/ui` primitives. Components never read the theme object directly.
- **Seed ownership:** sites are owned by the seed and always updated; pages are owned by editors, so the seed only fills empty routes. Connection reuse is cached for long-lived Next.js processes and Vercel functions.
- **Local Docker stack first:** Compose supplies MongoDB and the Next.js server. To deploy later, provision an Atlas cluster, set `MONGODB_URI` and `MONGODB_DB` in Vercel, and deploy the same Next.js app. Replace the local seed invocation with a one-off seed command or deployment job; do not run seed writes on every serverless request.
- **Scope:** single editor, published pages only, two seeded sites, Section and Card Grid. Authentication, draft/publish workflow, drag-and-drop ordering, live manager preview, and real content APIs are outside this first pass.
- **Build time / AI tools:** record total time spent before submission. OpenAI Codex was used for planning, implementation, and code review.

## Environment variables

| Variable      | Purpose                   | Local default               |
| ------------- | ------------------------- | --------------------------- |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017` |
| `MONGODB_DB`  | Database name             | `rugby_site_manager`        |

Keep Atlas credentials in Vercel environment variables. Never commit `.env.local` or credentials.
