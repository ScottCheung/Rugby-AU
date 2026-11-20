'use client';

import { Layers as LayersIcon, Plus, SlidersHorizontal } from 'lucide-react';
import { createElement, useState, type ReactNode } from 'react';
import { getDefinition } from '@/lib/components/registry';
import { findNode } from '@/lib/components/tree';
import { useEditor } from './editorContext';
import { Layers } from './Layers';
import { Palette } from './Palette';

type Panel = 'add' | 'layers' | 'edit';

const panels = [
  { id: 'add', label: 'Add', icon: Plus },
  { id: 'layers', label: 'Layers', icon: LayersIcon },
  { id: 'edit', label: 'Edit', icon: SlidersHorizontal },
] as const;

/**
 * The editor's one sidebar: add components, the layers outline, and the
 * selected block's (or the page's) settings, one at a time. Selecting a
 * block, on the canvas, in Layers or by adding one, opens Edit.
 */
export function Sidebar({ edit }: { edit: ReactNode }) {
  const editor = useEditor();
  const [panel, setPanel] = useState<Panel>('edit');
  // Switch to Edit when the selection changes (adjusting state during
  // render, rather than in an effect, avoids an extra render pass).
  const [seen, setSeen] = useState(editor.selectedId);
  if (editor.selectedId !== seen) {
    setSeen(editor.selectedId);
    if (editor.selectedId) setPanel('edit');
  }

  const selected = editor.selectedId
    ? findNode(editor.tree, editor.selectedId)
    : undefined;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div
        role="tablist"
        aria-label="Sidebar"
        className="flex gap-1 border-b border-[var(--ui-border)] p-2"
      >
        {panels.map(({ id, label, icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={panel === id}
            onClick={() => setPanel(id)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold transition ${
              panel === id
                ? 'bg-[image:var(--ui-primary-gradient)] text-[var(--ui-on-primary)]'
                : 'text-[var(--ui-muted)] hover:bg-[var(--ui-glass)] hover:text-[var(--ui-fg)]'
            }`}
          >
            {createElement(icon, { className: 'size-4', 'aria-hidden': true })}
            {label}
          </button>
        ))}
      </div>

      <div role="tabpanel" className="min-h-0 flex-1 overflow-y-auto p-5">
        {panel === 'add' && <Palette />}
        {panel === 'layers' && <Layers />}
        {panel === 'edit' && (
          <div className="flex flex-col gap-4">
            {/* Where you are: the page, or a block on it. */}
            <nav
              aria-label="Editing"
              className="flex items-center gap-1.5 text-xs font-semibold text-[var(--ui-muted)]"
            >
              {selected ? (
                <>
                  <button
                    type="button"
                    className="hover:text-[var(--ui-primary)] hover:underline"
                    onClick={() => editor.select(null)}
                  >
                    Page settings
                  </button>
                  <span aria-hidden>›</span>
                  <span className="text-[var(--ui-fg)]">
                    {getDefinition(selected.type)?.label ?? selected.type}
                  </span>
                </>
              ) : (
                <span className="text-[var(--ui-fg)]">Page settings</span>
              )}
            </nav>
            {edit}
          </div>
        )}
      </div>
    </div>
  );
}
