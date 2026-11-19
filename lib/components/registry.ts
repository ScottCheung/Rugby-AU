import type { z } from 'zod';
import type { ComponentInstance } from '../model';
import { defaultValueFor } from '../schema';
import { cardGrid } from './card-grid';
import { section } from './section';

/** Every component the manager can place and the renderer can draw. */
export const componentDefinitions = [section, cardGrid] as const;

export type AnyComponentDefinition = (typeof componentDefinitions)[number];
export type ComponentType = AnyComponentDefinition['type'];
/** Props after validation (defaults applied), keyed by component type. */
export type PropsOf<Type extends ComponentType> = z.output<
  Extract<AnyComponentDefinition, { type: Type }>['props']
>;
/** Props as an author writes them (defaults may be omitted). */
export type PropsInputOf<Type extends ComponentType> = z.input<
  Extract<AnyComponentDefinition, { type: Type }>['props']
>;

const byType = new Map<string, AnyComponentDefinition>(
  componentDefinitions.map((definition) => [definition.type, definition]),
);

export function getDefinition(type: string) {
  return byType.get(type);
}

export function createInstance(
  type: ComponentType,
  id: string = crypto.randomUUID(),
): ComponentInstance {
  const definition = byType.get(type)!;
  return {
    id,
    type,
    props: defaultValueFor(definition.props) as Record<string, unknown>,
    ...(definition.allowsChildren ? { children: [] } : {}),
  };
}

export type TreeIssue = {
  /** Component the problem belongs to, when there is one. */
  componentId?: string;
  /** Path inside that component's props, e.g. ["cards", 0, "heading"]. */
  path: PropertyKey[];
  message: string;
};

export type TreeParseResult =
  | { ok: true; components: ComponentInstance[] }
  | { ok: false; issues: TreeIssue[] };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * Validate an untrusted component tree against the registry. Returns a
 * normalised copy (defaults applied, unknown props dropped) so only clean
 * JSON is stored. Used by the API, the seed script and the manager.
 */
export function parseComponentTree(value: unknown): TreeParseResult {
  const issues: TreeIssue[] = [];
  const seenIds = new Set<string>();

  function parseList(list: unknown): ComponentInstance[] {
    if (!Array.isArray(list)) {
      issues.push({ path: [], message: 'Components must be a list.' });
      return [];
    }
    return list.flatMap((node) => {
      const parsed = parseNode(node);
      return parsed ? [parsed] : [];
    });
  }

  function parseNode(node: unknown): ComponentInstance | null {
    if (!isRecord(node) || typeof node.id !== 'string' || !node.id) {
      issues.push({ path: [], message: 'Every component needs an id.' });
      return null;
    }
    const id = node.id;
    if (seenIds.has(id))
      issues.push({ componentId: id, path: [], message: 'Duplicate id.' });
    seenIds.add(id);

    const definition =
      typeof node.type === 'string' ? byType.get(node.type) : undefined;
    if (!definition) {
      issues.push({
        componentId: id,
        path: [],
        message: `Unknown component type "${String(node.type)}".`,
      });
      return null;
    }

    const props = definition.props.safeParse(node.props ?? {});
    if (!props.success)
      for (const issue of props.error.issues)
        issues.push({
          componentId: id,
          path: issue.path,
          message: issue.message,
        });

    if (!definition.allowsChildren && node.children !== undefined)
      issues.push({
        componentId: id,
        path: [],
        message: `${definition.label} cannot contain other components.`,
      });

    return {
      id,
      type: definition.type,
      props: props.success ? props.data : {},
      ...(definition.allowsChildren
        ? { children: parseList(node.children ?? []) }
        : {}),
    };
  }

  const components = parseList(value);
  return issues.length ? { ok: false, issues } : { ok: true, components };
}
