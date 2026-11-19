# Rugby Site Manager

A local foundation initialized from the Next.js App Router starter with strict TypeScript, Tailwind CSS v4, ESLint, Prettier, a small responsive dashboard shell, theme support, and the shared `@scottcheung/ui` library.

## Start a project

1. Use **Use this template** on the GitHub repository or clone it.
2. Rename the `name` in `package.json` and update the visible app name in `components/theme-shell.tsx` and metadata in `app/layout.tsx`.
3. Copy `.env.example` to `.env.local` and add only the variables your project needs.
4. Run `npm ci`, `npm run dev`, then open `/showcase`.

The checked in UI dependency is a packed `@scottcheung/ui` release in `vendor/` so installs stay reproducible before its first npm release. After the first approved public release, replace the `file:` dependency with the published semver (for example `^0.1.0`), run `npm install`, and commit the refreshed lockfile. The vendored tarball is a built package, not copied component source.

## Commands

```sh
npm ci
npm run dev
npm run lint
npm run typecheck
npm run build
npm start
```

## Theme

The dashboard shell stores light/dark preference in local storage. The UI library's token variables are scoped under `ThemeProvider`; customize the wrapper using `--ui-*` variables or a brand key. No authentication, database, CMS, or product domain behavior is included.

## Template maintenance

Keep the starter generic. Update Next.js, React, Tailwind, TypeScript, ESLint, and Prettier versions together; update `package-lock.json` with Node/npm versions used by CI. Run the CI commands after dependency upgrades. Upgrade `@scottcheung/ui` by changing its semver range and lockfile after a package release. Rename the project and visible labels when generating a new app.
