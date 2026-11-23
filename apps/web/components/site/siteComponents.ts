import type { ComponentType as ReactComponentType, ReactNode } from 'react';
import type { ComponentType } from '@/lib/components/registry';
import type { SiteData } from '@/lib/components/blocks/siteData';
import { blockRenderer } from './blocks/Block';
import { CardItem } from './blocks/CardItem';
import { HeroItem } from './blocks/HeroItem';
import { MatchItem } from './blocks/MatchItem';
import { PersonItem } from './blocks/PersonItem';
import { PhotoItem } from './blocks/PhotoItem';
import { PhotosFrame } from './blocks/PhotosFrame';
import { StatItem } from './blocks/StatItem';
import { StoryItem } from './blocks/StoryItem';
import { TextItem } from './blocks/TextItem';
import { Section } from './Section';

/**
 * Besides its own props, every site component gets the render context:
 * the site (for links), the site's data (news, players, matches) and
 * whether it is drawn in the editor's preview.
 */
export type RenderContext = {
  /** The node's id: the editor's preview marks empty slots with it. */
  nodeId: string;
  siteSlug: string;
  /** Inside another Section (a Section's band and width then do not apply). */
  nested: boolean;
  /**
   * Items play their entrance as they scroll into view. Not in the first
   * Section, which is on screen when the page opens: hiding it until
   * JavaScript runs would leave the top of the page blank.
   */
  animate: boolean;
  data: SiteData;
  /**
   * In the editor's preview: items are marked for selection and hidden
   * ones are drawn ghosted instead of left out.
   */
  editing: boolean;
};

/** Props are typed loosely here: callers pass props already parsed by the type's schema. */
export type AnySiteComponent = ReactComponentType<
  Record<string, unknown> & { children?: ReactNode } & RenderContext
>;

/**
 * Component type -> React component, shared by the public renderer and the
 * editor's preview. Kept apart from the definitions so schemas can be
 * imported without render code. A block is given by the component that
 * draws one of its items. Typed by ComponentType, so the build fails if a
 * registered component has no renderer.
 */
const siteComponents: Record<ComponentType, unknown> = {
  section: Section,
  text: blockRenderer('text', TextItem),
  story: blockRenderer('story', StoryItem),
  hero: blockRenderer('hero', HeroItem),
  cards: blockRenderer('cards', CardItem),
  photos: blockRenderer('photos', PhotoItem, PhotosFrame),
  stats: blockRenderer('stats', StatItem),
  people: blockRenderer('people', PersonItem),
  matches: blockRenderer('matches', MatchItem),
};

export function getSiteComponent(type: ComponentType): AnySiteComponent {
  return siteComponents[type] as AnySiteComponent;
}
