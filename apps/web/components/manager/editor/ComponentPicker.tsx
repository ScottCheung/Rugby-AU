'use client';

import { Button, Dialog } from '@scottcheung/ui/client';
import {
  componentDefinitions,
  type ComponentType,
} from '@/lib/components/registry';
import { ComponentIcon } from './componentIcons';

/**
 * "Add a component": every registered component with its one-line
 * description, straight from the registry, so a new component shows up
 * here without any editor change.
 */
export function ComponentPicker({
  open,
  where,
  onPick,
  onClose,
}: {
  open: boolean;
  /** Where the new component goes, e.g. "to the page" or "inside Section". */
  where: string;
  onPick: (type: ComponentType) => void;
  onClose: () => void;
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !next && onClose()}
      title="Add a component"
      description={`It will be added ${where}.`}
    >
      <ul className="m-0 flex list-none flex-col gap-1 p-0">
        {componentDefinitions.map((definition) => (
          <li key={definition.type}>
            <Button
              type="button"
              variant="ghost"
              // A two-line row instead of the default one-line pill. Inline
              // styles, because the ui stylesheet outranks utility classes.
              style={{
                width: '100%',
                height: 'auto',
                justifyContent: 'flex-start',
                padding: '0.5rem 0.75rem',
                borderRadius: '1rem',
                textAlign: 'left',
                whiteSpace: 'normal',
              }}
              onClick={() => onPick(definition.type)}
            >
              <ComponentIcon
                type={definition.type}
                className="size-5 shrink-0 text-[var(--ui-primary)]"
              />
              <span className="flex min-w-0 flex-col">
                <span className="font-semibold text-[var(--ui-fg)]">
                  {definition.label}
                </span>
                <span className="text-xs font-normal text-[var(--ui-muted)]">
                  {definition.description}
                </span>
              </span>
            </Button>
          </li>
        ))}
      </ul>
    </Dialog>
  );
}
