'use client';

import { createContext, useContext } from 'react';
import type { ComponentType } from '@/lib/components/registry';
import type { Location } from '@/lib/components/tree';
import type { TreeIssue } from '@/lib/components/validateTree';
import type { ComponentNode } from '@/lib/types';

/** Where a dragged item would land, shown as a line or a highlighted zone. */
export type DropTarget = {
  at: Location;
  nodeId?: string;
  edge?: 'before' | 'after';
};

/** Shared by the canvas, layers and panels so they don't pass props through every level. */
export type EditorContextValue = {
  tree: ComponentNode[];
  siteSlug: string;
  selectedId: string | null;
  hoveredId: string | null;
  issues: TreeIssue[];
  dropTarget: DropTarget | null;
  dragging: boolean;
  select: (id: string | null) => void;
  hover: (id: string | null) => void;
  moveUp: (id: string) => void;
  moveDown: (id: string) => void;
  duplicate: (id: string) => void;
  remove: (id: string) => void;
  /** Click-to-add: inside the selected Section, after the selected block, or at the end. */
  addNew: (type: ComponentType) => void;
};

export const EditorContext = createContext<EditorContextValue | null>(null);

export function useEditor() {
  const context = useContext(EditorContext);
  if (!context)
    throw new Error('useEditor must be used inside the page editor');
  return context;
}
