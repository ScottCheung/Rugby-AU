# Editing model

What each level of the manager edits, and what it does not. New features
should fit these rules; a field that fits no level cleanly is a sign the model
needs another look.

> One sentence: **the site sets the style, the page sets identity, a Section
> sets structure, a block sets where its items come from, how they are laid
> out and what one looks like, an item holds its own words and pictures.**

## Two kinds of content

Ask of any piece of content: **will it appear in a second place, have its own
address, or keep growing?**

|             | Page content                                        | Site content (collections)                                                  |
| ----------- | --------------------------------------------------- | --------------------------------------------------------------------------- |
| When        | Belongs to one page and appears once                | Repeats, has its own page, or keeps growing                                 |
| Examples    | Hero copy, an introduction, navigation cards, stats | News, players; matches (fixtures service, read-only)                        |
| Edited      | On the page, in the editor                          | In the same panel: Site › News / Players, or by clicking one in the preview |
| Page stores | The content itself                                  | Only what to show: which entries, how many, which to hide                   |

Pages never copy site content, so there is nothing to sync: a new article
shows up by itself, and an edited one changes everywhere it appears.

## The levels

```
Site      identity, menu, header button, footer links; spacing; look, brand colour
└ Page    title, description, address, menu label / hidden
  └ Section   heading, intro and its blocks; how many side by side, width, padding; background
    └ Block     what goes here; how the items are arranged; what one item looks like
      └ Item      its own fields (manual items only)
```

Only a Section has a heading and an intro. A block has no title of its own:
it is one atom (text, hero, cards, photos, numbers, people, matches). A
Section's children (blocks, or other Sections) fill its columns (`1`, `1-1`,
`2-1`, `1-2`, `1-1-1`) in order and wrap to a new row; in the editor, a column
with nothing in it yet shows "Add a block".

### One selection, one form, three tabs

- The **Layers tree** is the only navigation, down to the deepest level. What
  is selected there is what the inspector edits, and the other way round.
- A **click in the preview** selects the deepest thing under the pointer (an
  item, else its block). The breadcrumb, **Esc** or the tree lead back up.
  Something is always selected (the page by default), so the inspector never
  opens or closes and the preview keeps its size.
- Every level has the same three tabs, **Content · Layout · Style**, in that
  order. The open tab stays open as the selection changes, so restyling five
  Sections is five clicks on the Style tab. A tab a level has nothing for is
  not hidden: it says who owns it, with a link there ("Every item of a block
  looks the same, so this is set on the block").

| Level       | Content                                                      | Layout                                             | Style                                                            |
| ----------- | ------------------------------------------------------------ | -------------------------------------------------- | ---------------------------------------------------------------- |
| **Site**    | Name, description, logo, header, footer, menu                | Spacing                                            | Look, brand colour                                               |
| **Page**    | Title, description, address, menu label                      | (by its Sections)                                  | (the site's)                                                     |
| **Section** | Heading, intro; its blocks, one row each, and "Add a block"  | Columns and their ratio, alignment, width, padding | Background                                                       |
| **Block**   | `content`: where the items come from, its options, the items | `layout`: grid or carousel, and that one's options | `style`: the block type ("each item looks like") and its options |
| **Item**    | Its fields, hide / move / duplicate / delete                 | (the block's)                                      | (the block's)                                                    |

Rules:

1. **One owner per property.** Each thing is changed at exactly one level.
2. **Appearance moves up.** Values (colours, fonts, corners, spacing) are set
   only at the site; lower levels choose named steps.
3. **Content moves down.** Words and images belong to the smallest unit that
   holds them; headings belong to the Section.
4. **A page has no appearance settings.**
5. **Derived content is edited at its source, in the same panel.** Clicking a
   news card opens that article's own form (every page showing it updates);
   the block itself only stores which articles it shows.

## A block: content, layout, style

A block's props are three independent parts, one per tab, each edited by a
form generated from its own schema:

| Prop          | Question it answers           | Options                                                                                                                                                                                                                                                                             |
| ------------- | ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`content`** | Where do the items come from? | Written here, or a data source: the site's News, Players, the fixtures service, or (on the news template) the article shown                                                                                                                                                         |
| **`layout`**  | How are they laid out?        | One of six arrangements, each with only its own options: **Grid** (per row, wide and phone), **List**, **Featured** (the first one large), **Wall** (each keeps its own height), **Carousel** (several at once, one or two rows), **Slider** (one at a time, can move on by itself) |
| **`style`**   | What does one item look like? | The block type (cards, text, hero, photos, numbers, people, matches) and that type's own options                                                                                                                                                                                    |

**Any block type works in either arrangement**: numbers in a carousel, people
in a grid, quotes in a slider, photos as a wall. Each arrangement is a shape
of its own in the stored JSON (`{ "arrange": "slider", "autoplay": true }`),
so switching never leaves another arrangement's options behind.

Every item, whatever the block, has the same fields (**roles**): title,
subtitle, text, value, image, cut-out, background, link. A block type reads the
roles it needs and labels them its own way ("Heading", "Name", "Caption"), so
the form for one item shows only those fields. Data sources fill in the same
roles: an article's headline is a card's heading.

- **Any type can be tried.** "Each item looks like" switches the type and keeps
  the items. One that needs a field they lack (numbers without a value) shows a
  striped "Missing: number" placeholder, and cannot be published until filled.
- **Which data a block can show is a rule.** A source fits a block when it fills
  in every role the block requires. Matches need a match, so they only come
  from the fixtures service, read-only, with an eye on each to hide it.

## Spacing and type

Every gap and padding on the site is one of four steps from the theme (`xs`
inside a card, `sm` between cards, `md` between blocks, `lg` around a
Section), so no component carries its own numbers. The site's **Spacing**
setting (compact, standard, roomy) scales all four at once, on every page.

A Section is a band across the page, and its **Width** says how its content sits
in it: **Column** (in the page column, at most 72rem), **Wide** (across the whole
width, with the page's side padding) or **Full** (edge to edge, for a hero).

A Section owns its vertical space: its **Padding** (None, Small, Medium,
Large; Medium unless set) sits above and below it, and the page adds nothing
between Sections. A hero image that should sit flush is set to None.

Type is calm and in a fixed order: the only large type is a hero's headline
(h1: 36px, 60px on wide pages). A Section's heading (h2) is 30 / 36px, a
nested Section's (h3) 20 / 24px, an item's title (h4) 16 / 18px. Body text is
17px with a 1.65 line height; text on cards is 15px.

## Site content

News and players live in the site's `entries` collection, each with a slug that
is unique within the site and collection. They are edited in the editor's
panel (Site › News / Players: a list with "New", and a form generated from the
collection's schema, `lib/collections`), or by clicking one in the preview.

- An entry has no separate draft: **Save** stores it and, while it is
  published, it is live. **Unpublish** takes it off the site; visitors only see
  published entries.
- **News** entries also have an address, `/news/<slug>`. Every article is drawn
  by the site's one **article page template**, a normal page made of normal
  blocks whose items come from "This article", each role bound to one of the
  article's fields ("Heading ← Headline", "Text ← Standfirst"). Its layout, and what
  sits around the story ("More news"), are edited there; the editor previews
  the newest article. The template has no address of its own and cannot be
  deleted.
- An article's **Story** (its body) is a list of pieces in any order:
  paragraph, subheading, picture (text width or wider, with a caption),
  quote and list (`lib/components/story.ts`). The template draws it with a
  **Story** block bound to it ("Story ← Story"); the same block can be
  written by hand on any page. `npm run migrate` splits bodies stored as
  one text field into paragraphs and subheadings.
- **Players** have no page of their own yet.
- A block of news or players shows **the latest** (news by date, players as
  entered; a category or group and "at most" narrow it) or **ones chosen by
  hand**, in that order. An eye on each hides one in that block only. Slugs of
  deleted entries are dropped when a page is saved.

## Hiding

Whoever owns the data stores the flag:

| Item                             | Owned by   | Stored as                           |
| -------------------------------- | ---------- | ----------------------------------- |
| Hand-written card, slide, number | The block  | `hidden: true` on the item          |
| A news article, player or match  | Its source | `content.hidden: [id]` on the block |

- Visitors never see hidden items. The editor shows them ghosted with a
  "Hidden" tag, so they can be shown again.
- A block counts only visible items towards its limit: hide one and the next
  takes its place.
- Hiding is part of the page draft, so it is published and versioned with it.
- To take an entry off the whole site, unpublish or delete it.

## Saving

- **Page** changes (including menu label and hiding) go into the draft:
  Save draft, then Publish.
- **Entries** are saved directly (see above).
- **Site settings** have no draft: the preview follows them as you edit, and
  Save applies them to every page at once.

## Pages stored in an older shape

Pages stored before blocks were components of their own had `column` nodes:
one column type with a flat bag of props (source, style, arrange, perRow,
ratio, team...). `npm run migrate` upgrades every stored copy (draft,
published, past versions) with `lib/migrate/blocksFromColumns.ts`: each column
becomes the block type it drew, its props split into content / layout / style,
the old arrangement names mapped to grid or carousel. Empty columns are
dropped (blocks fill a Section's columns in order). The upgrade is pure,
idempotent and tested against a stored page (`tests/migrate.test.ts`).

## Not built yet

- Shared Sections, edited once and used on several pages.
- Editing text directly on the canvas, and dragging items on it.
- Player pages, and your own collection types (fields + a template page).
- Section-level SEO and share images.
- The preview's menu following the current page's unsaved menu label.
