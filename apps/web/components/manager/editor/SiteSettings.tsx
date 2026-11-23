'use client';

import { ArrowDown, ArrowUp } from 'lucide-react';
import { useState, useTransition } from 'react';
import { Button, IconButton, useToast } from '@scottcheung/ui/client';
import { saveSiteAction } from '@/app/manager/actions';
import { describeSchema } from '@/lib/forms/describe';
import {
  applySettings,
  settingsFromSite,
  siteSettingsSchema,
  type SiteSettings as Settings,
} from '@/lib/site/settings';
import type { Site } from '@/lib/types';
import { SchemaForm } from '../SchemaForm';

const fields = describeSchema(siteSettingsSchema);
/** Which tab each setting is on: spacing is layout; look and colour are style. */
/** The top-level pages in menu order: the site's order, then by path. */
function orderedMenu(
  pages: { id: string; title: string; path: string }[],
  order: string[],
) {
  const rank = (id: string) => {
    const at = order.indexOf(id);
    return at === -1 ? order.length : at;
  };
  return pages
    .filter((page) => page.path !== '/' && page.path.split('/').length === 2)
    .sort((a, b) => rank(a.id) - rank(b.id) || a.path.localeCompare(b.path));
}

/**
 * The site level: name, description, logo, menu order, header button,
 * footer links, look and colours. Changes show in the preview as you
 * make them; Save applies them to every page of the site at once (sites
 * have no draft).
 */
export function SiteSettings({
  part,
  site,
  pages,
  onPreview,
  onSaved,
}: {
  /** The tab shown; the unsaved settings are kept across tabs. */
  part: 'content' | 'layout' | 'style';
  /** The site as saved. */
  site: Site;
  /** The site's pages, for the menu order. */
  pages: { id: string; title: string; path: string }[];
  /** The site with the unsaved settings applied, for the preview. */
  onPreview: (site: Site) => void;
  onSaved: (site: Site) => void;
}) {
  const toast = useToast();
  const [saving, startSaving] = useTransition();
  const [settings, setSettings] = useState<Settings>(() =>
    settingsFromSite(site),
  );
  const [menu, setMenu] = useState(() =>
    orderedMenu(pages, site.menuOrder ?? []).map((page) => page.id),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const initial = JSON.stringify([
    settingsFromSite(site),
    orderedMenu(pages, site.menuOrder ?? []).map((page) => page.id),
  ]);
  const dirty = JSON.stringify([settings, menu]) !== initial;

  const preview = (nextSettings: Settings, nextMenu: string[]) => {
    // Half-typed values (a colour without its last digit) wait until valid.
    const parsed = siteSettingsSchema.safeParse(nextSettings);
    if (parsed.success)
      onPreview({ ...applySettings(site, parsed.data), menuOrder: nextMenu });
  };
  const change = (next: Settings) => {
    setSettings(next);
    setErrors({});
    preview(next, menu);
  };
  const move = (from: number, to: number) => {
    const next = [...menu];
    const [id] = next.splice(from, 1);
    next.splice(to, 0, id);
    setMenu(next);
    preview(settings, next);
  };

  const save = () =>
    startSaving(async () => {
      const result = await saveSiteAction(site.slug, {
        settings,
        menuOrder: menu,
      });
      if (!result.ok) {
        setErrors(result.errors);
        toast({ title: result.message, tone: 'danger' });
        return;
      }
      onSaved(result.site);
      toast({
        title: 'Site settings saved',
        description: 'Every page of the site now uses them.',
        tone: 'success',
      });
    });
  const reset = () => {
    const original = settingsFromSite(site);
    const originalMenu = orderedMenu(pages, site.menuOrder ?? []).map(
      (page) => page.id,
    );
    setSettings(original);
    setMenu(originalMenu);
    setErrors({});
    onPreview(site);
  };

  const titles = new Map(pages.map((page) => [page.id, page]));

  return (
    <div className="flex flex-col gap-5">
      <p className="m-0 text-xs leading-snug text-[var(--ui-muted)]">
        For every page of {site.name}. Saving updates the live site.
      </p>

      <SchemaForm
        fields={fields
          // Each field is on the tab its schema names (`group`).
          .filter((field) => field.group === part)}
        value={settings}
        onChange={(next) => change(next as Settings)}
        errors={errors}
      />

      {part === 'content' && (
        <fieldset className="m-0 flex flex-col gap-2 border-0 border-t border-[var(--ui-border)] p-0 pt-4">
          <legend className="sc-ui-overline mb-1">Menu order</legend>
          <p className="m-0 text-xs text-[var(--ui-muted)]">
            Home is always first. Each page sets its own menu label, or hides
            itself, in its page settings.
          </p>
          <ol className="m-0 flex list-none flex-col gap-1 p-0">
            {menu.map((id, index) => {
              const page = titles.get(id);
              return (
                <li
                  key={id}
                  className="flex items-center gap-2 rounded-lg bg-[var(--ui-glass)] py-1 pr-1 pl-3 text-sm"
                >
                  <span className="min-w-0 flex-1 truncate">
                    {page?.title}
                    <span className="ml-2 font-mono text-xs text-[var(--ui-muted)]">
                      {page?.path}
                    </span>
                  </span>
                  <IconButton
                    variant="ghost"
                    label={`Move ${page?.title} earlier`}
                    disabled={index === 0}
                    onClick={() => move(index, index - 1)}
                  >
                    <ArrowUp />
                  </IconButton>
                  <IconButton
                    variant="ghost"
                    label={`Move ${page?.title} later`}
                    disabled={index === menu.length - 1}
                    onClick={() => move(index, index + 1)}
                  >
                    <ArrowDown />
                  </IconButton>
                </li>
              );
            })}
          </ol>
        </fieldset>
      )}

      <div className="sticky -bottom-4 -mx-4 -mb-4 flex justify-end gap-2 border-t border-[var(--ui-border)] bg-[var(--ui-surface)] px-4 py-3">
        <Button variant="ghost" disabled={!dirty || saving} onClick={reset}>
          Reset
        </Button>
        <Button disabled={!dirty || saving} onClick={save}>
          Save site settings
        </Button>
      </div>
    </div>
  );
}
