'use client';

import { useDraggable } from '@dnd-kit/core';
import {
  componentDefinitions,
  type AnyComponentDefinition,
} from '@/lib/components/registry';
import { ComponentIcon } from './componentIcons';
import type { DragData } from './dnd';
import { useEditor } from './editorContext';

/** Every registered component, ready to drag onto the canvas or click to add. */
export function Palette() {
  return (
    <div className="flex flex-col gap-2">
      <span className="sc-ui-overline">Add components</span>
      <div className="grid grid-cols-2 gap-2">
        {componentDefinitions.map((definition) => (
          <PaletteItem key={definition.type} definition={definition} />
        ))}
      </div>
      <p className="m-0 text-xs text-[var(--ui-faint)]">
        Drag onto the page, or click to add after the selection.
      </p>
    </div>
  );
}

function PaletteItem({ definition }: { definition: AnyComponentDefinition }) {
  const editor = useEditor();
  const { setNodeRef, listeners, attributes, isDragging } = useDraggable({
    id: `new:${definition.type}`,
    data: {
      kind: 'new',
      type: definition.type,
      label: definition.label,
    } satisfies DragData,
  });

  return (
    <button
      ref={setNodeRef}
      type="button"
      title={definition.description}
      onClick={() => editor.addNew(definition.type)}
      {...listeners}
      {...attributes}
      className={`flex cursor-grab flex-col items-center gap-1.5 rounded-2xl bg-[var(--ui-glass)] px-2 py-3 text-xs font-semibold text-[var(--ui-fg)] transition hover:text-[var(--ui-primary)] hover:ring-1 hover:ring-[var(--ui-primary)] active:cursor-grabbing ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <ComponentIcon type={definition.type} className="size-5" />
      {definition.label}
    </button>
  );
}
