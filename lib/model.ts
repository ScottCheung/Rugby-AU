export type Theme = {
  brand: string;
  accent: string;
  surface: string;
  background: string;
  text: string;
  muted: string;
};

export type Site = {
  id: string;
  name: string;
  slug: string;
  description: string;
  theme: Theme;
};

export type CardItem = {
  image: { url: string; alt: string };
  heading: string;
  link?: { label: string; href: string };
};

export type ComponentType = 'section' | 'card-grid';
export type ComponentInstance = {
  id: string;
  type: ComponentType;
  props: Record<string, unknown>;
  children?: ComponentInstance[];
};

export type PageDocument = {
  id: string;
  siteId: string;
  path: string;
  title: string;
  status: 'published';
  components: ComponentInstance[];
  updatedAt: string;
};

export function normalizePath(path: string) {
  const trimmed = path.trim().replace(/^\/+|\/+$/g, '');
  return trimmed ? `/${trimmed}` : '/';
}

export function isValidPagePath(path: string) {
  if (path === '/') return true;
  return path
    .slice(1)
    .split('/')
    .every((segment) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(segment));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isValidComponentTree(
  value: unknown,
): value is ComponentInstance[] {
  if (!Array.isArray(value)) return false;
  return value.every((item) => {
    if (!isRecord(item) || typeof item.id !== 'string' || !isRecord(item.props))
      return false;
    if (item.type === 'section') {
      const { layout, background } = item.props;
      return (
        (layout === 'full' || layout === 'two-column') &&
        (background === 'none' ||
          background === 'light' ||
          background === 'brand') &&
        isValidComponentTree(item.children)
      );
    }
    if (item.type !== 'card-grid') return false;
    if (
      typeof item.props.title !== 'string' ||
      !Array.isArray(item.props.cards)
    )
      return false;
    return item.props.cards.every((card) => {
      if (!isRecord(card) || !isRecord(card.image)) return false;
      if (
        typeof card.image.url !== 'string' ||
        typeof card.image.alt !== 'string' ||
        typeof card.heading !== 'string'
      )
        return false;
      if (card.link === undefined) return true;
      return (
        isRecord(card.link) &&
        typeof card.link.label === 'string' &&
        typeof card.link.href === 'string'
      );
    });
  });
}
