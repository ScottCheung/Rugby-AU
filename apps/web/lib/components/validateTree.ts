import type { ComponentNode } from '../types';
import { getDefinition } from './registry';

export type TreeIssue = {
  /** The node the problem belongs to. */
  nodeId?: string;
  /** Path inside that node's props, e.g. ["cards", 0, "heading"]. Empty for node-level problems. */
  path: (string | number)[];
  message: string;
};

export type ValidateTreeResult =
  { ok: true; tree: ComponentNode[] } | { ok: false; issues: TreeIssue[] };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * Check an untrusted tree against the registry before it is saved. On
 * success returns a clean copy: props parsed by each schema (strings
 * trimmed, unknown props dropped).
 */
export function validateTree(input: unknown): ValidateTreeResult {
  const issues: TreeIssue[] = [];
  const seenIds = new Set<string>();

  function validateList(list: unknown): ComponentNode[] {
    if (!Array.isArray(list)) {
      issues.push({ path: [], message: 'Components must be a list.' });
      return [];
    }
    return list.flatMap((node) => validateNode(node) ?? []);
  }

  function validateNode(node: unknown): ComponentNode | null {
    if (!isRecord(node) || typeof node.id !== 'string' || node.id === '') {
      issues.push({ path: [], message: 'Every component needs an id.' });
      return null;
    }
    const id = node.id;
    if (seenIds.has(id))
      issues.push({ nodeId: id, path: [], message: 'Duplicate component id.' });
    seenIds.add(id);

    const definition =
      typeof node.type === 'string' ? getDefinition(node.type) : undefined;
    if (!definition) {
      issues.push({
        nodeId: id,
        path: [],
        message: `Unknown component type "${String(node.type)}".`,
      });
      return null;
    }

    const props = definition.schema.safeParse(node.props);
    if (!props.success) {
      for (const issue of props.error.issues)
        issues.push({
          nodeId: id,
          path: issue.path.map((key) =>
            typeof key === 'number' ? key : String(key),
          ),
          // A missing value usually means the page was saved before this
          // prop existed; Zod's own wording is meant for developers.
          message:
            issue.code === 'invalid_type' && issue.input === undefined
              ? 'This field is required.'
              : issue.message,
        });
    }

    if (!definition.acceptsChildren && node.children !== undefined) {
      issues.push({
        nodeId: id,
        path: [],
        message: `${definition.label} cannot contain other components.`,
      });
    }

    return {
      id,
      type: definition.type,
      props: props.success ? props.data : {},
      ...(definition.acceptsChildren
        ? { children: validateList(node.children ?? []) }
        : {}),
    };
  }

  const tree = validateList(input);
  return issues.length > 0 ? { ok: false, issues } : { ok: true, tree };
}
