// Removes the build output. Not part of `build`: deleting dist while the
// web app's dev server is running breaks every page that imports the UI
// package until the build finishes. Run `npm run clean -w @scottcheung/ui`
// by hand when a component file has been removed.
import { rmSync } from 'node:fs';
rmSync('dist', { recursive: true, force: true });
