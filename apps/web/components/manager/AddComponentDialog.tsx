'use client';

import { Dialog } from '@scottcheung/ui/client';
import {
  componentDefinitions,
  type ComponentType,
} from '@/lib/components/registry';

/** Lists every registered component; nothing here is component-specific. */
export function AddComponentDialog({
  open,
  insideLabel,
  onPick,
  onClose,
}: {
  open: boolean;
  /** Set when adding inside a container, e.g. "Section". */
  insideLabel?: string;
  onPick: (type: ComponentType) => void;
  onClose: () => void;
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !next && onClose()}
      title={
        insideLabel
          ? `Add a component inside this ${insideLabel.toLowerCase()}`
          : 'Add a component'
      }
    >
      <div className="flex flex-col gap-2">
        {componentDefinitions.map((definition) => (
          <button
            key={definition.type}
            type="button"
            onClick={() => onPick(definition.type)}
            className="rounded-lg border border-slate-200 p-3 text-left hover:border-[var(--ui-primary)] hover:bg-slate-50 focus-visible:outline-2"
          >
            <span className="block font-semibold">{definition.label}</span>
            <span className="block text-sm text-slate-500">
              {definition.description}
            </span>
          </button>
        ))}
      </div>
    </Dialog>
  );
}
