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

## Page JSON format

Each page document is independent of the editor. It identifies the owning site and route, then stores an ordered tree of component instances. A Section can nest any number of component instances, including another Section.

```json
{
  "id": "wallabies-home",
  "siteId": "wallabies",
  "path": "/",
  "title": "Wallabies",
  "status": "published",
  "components": [
    {
      "id": "home-featured",
      "type": "section",
      "props": { "layout": "full", "background": "brand" },
      "children": [
        {
          "id": "featured-cards",
          "type": "card-grid",
          "props": {
            "title": "Meet the team",
            "cards": [
              {
                "image": {
                  "url": "https://example.com/team.jpg",
                  "alt": "Players training"
                },
                "heading": "Our squad",
                "link": { "label": "View players", "href": "/squad" }
              }
            ]
          }
        }
      ]
    }
  ]
}
```

MongoDB stores sites and pages in separate collections. The page `siteId` plus `path` pair is unique. The renderer resolves a public page from `/s/[siteSlug]/[...path]`, loads its site theme and published page on the server, then renders the component tree. Unknown site/path combinations return a 404.

## Adding a component

1. Add its typed content shape to `lib/model.ts` and a definition to `lib/definitions.ts`. Each definition supplies the editor label, description, editable field descriptors, default props, and whether it accepts children.
2. Add a renderer branch in `components/render-tree.tsx` and any associated CSS in `app/globals.css`.
3. Add a seed instance if the demo site should use it.

The manager loops over each definition's field descriptors to create its editor controls. The `cards` field uses a reusable list editor for nested image, heading, and optional link values. New standard fields can be added in the field renderer without building a separate form for each component.

## Decisions and trade-offs

- **Custom field descriptors over a general schema package:** the initial library has two components, so a small typed descriptor format keeps the form generator understandable. The API validates the current component tree and fields; a schema versioning strategy will matter as the library evolves.
- **Page documents stay portable:** renderer input contains only component types, props, and children. Theme tokens are resolved from the separately stored site when the server renders the page.
- **MongoDB official Node driver:** each page is a natural document, while sites are shared records. A unique compound index protects route identity. Connection reuse is cached for long-lived Next.js processes and Vercel functions.
- **Local Docker stack first:** Compose supplies MongoDB and the Next.js server. To deploy later, provision an Atlas cluster, set `MONGODB_URI` and `MONGODB_DB` in Vercel, and deploy the same Next.js app. Replace the local seed invocation with a one-off seed command or deployment job; do not run seed writes on every serverless request.
- **Scope:** single editor, published pages only, two seeded sites, Section and Card Grid. Authentication, draft/publish workflow, drag-and-drop ordering, live manager preview, and real content APIs are outside this first pass.
- **Build time / AI tools:** record total time spent before submission. OpenAI Codex was used for planning, implementation, and code review.

## Environment variables

| Variable      | Purpose                   | Local default               |
| ------------- | ------------------------- | --------------------------- |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017` |
| `MONGODB_DB`  | Database name             | `rugby_site_manager`        |

Keep Atlas credentials in Vercel environment variables. Never commit `.env.local` or credentials.
