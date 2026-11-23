'use client';

import { Dialog } from '@scottcheung/ui/client';
import {
  starterGroups,
  starters,
  type Starter,
} from '@/lib/components/starters';
import { Sketch } from '../Sketch';

/**
 * "Add a block": every block type, the blocks that fill themselves from
 * the site's content, and (inside a Section) another Section. A tile shows
 * what one item of the block looks like. Whatever is picked lands where
 * the editor asked for it and is selected, ready to fill in.
 */
export function AddBlockDialog({
  open,
  onOpenChange,
  title = 'Add a block',
  allowSection,
  onPick,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  /** Offer a Section too (only inside another Section). */
  allowSection: boolean;
  onPick: (starter: Starter) => void;
}) {
  const groups = (
    Object.keys(starterGroups) as (keyof typeof starterGroups)[]
  ).filter((group) => allowSection || group !== 'layout');
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description="Everything can be changed afterwards: its content, its layout and how each item looks."
      style={{ width: 'min(44rem, 100%)' }}
    >
      <div className="flex flex-col gap-5">
        {groups.map((group) => (
          <section key={group} className="flex flex-col gap-2">
            <div>
              <h3 className="m-0 text-sm font-semibold">
                {starterGroups[group].label}
              </h3>
              <p className="m-0 text-xs text-[var(--ui-muted)]">
                {starterGroups[group].hint}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {starters
                .filter((starter) => starter.group === group)
                .map((starter) => (
                  <button
                    key={starter.id}
                    type="button"
                    onClick={() => onPick(starter)}
                    className="flex flex-col items-stretch gap-2 rounded-xl border border-[var(--ui-border)] p-3 text-left transition hover:border-[var(--ui-primary)] hover:bg-[var(--ui-primary-soft)]"
                  >
                    <span className="block rounded-lg bg-[var(--ui-glass)] px-6 py-2 text-[var(--ui-muted)]">
                      <Sketch name={starter.sketch} />
                    </span>
                    <span className="text-sm font-semibold">
                      {starter.label}
                    </span>
                    <span className="text-xs text-[var(--ui-muted)]">
                      {starter.description}
                    </span>
                  </button>
                ))}
            </div>
          </section>
        ))}
      </div>
    </Dialog>
  );
}
