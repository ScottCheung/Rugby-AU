import type { ComponentInstance, Theme } from '@/lib/model';

function resolveCardHref(href: string, siteSlug: string) {
  if (href.startsWith('#')) return href;
  if (/^https?:\/\//i.test(href)) return href;
  if (href.startsWith('/')) return `/s/${siteSlug}${href}`;
  if (/^[a-z0-9-]+(?:\/[a-z0-9-]+)*$/i.test(href))
    return `/s/${siteSlug}/${href}`;
  return '#';
}

export function RenderTree({
  components,
  theme,
  siteSlug,
}: {
  components: ComponentInstance[];
  theme: Theme;
  siteSlug: string;
}) {
  return (
    <div className="component-tree">
      {components.map((component) => (
        <RenderedComponent
          key={component.id}
          component={component}
          theme={theme}
          siteSlug={siteSlug}
        />
      ))}
    </div>
  );
}

function RenderedComponent({
  component,
  theme,
  siteSlug,
}: {
  component: ComponentInstance;
  theme: Theme;
  siteSlug: string;
}) {
  if (component.type === 'section') {
    const background = component.props.background;
    const style =
      background === 'brand' ? { backgroundColor: theme.brand } : undefined;
    const className = `site-section ${background === 'light' ? 'site-section-light' : ''} ${background === 'brand' ? 'site-section-brand' : ''} ${component.props.layout === 'two-column' ? 'site-section-columns' : ''}`;
    return (
      <section className={className} style={style}>
        <RenderTree
          components={component.children ?? []}
          theme={theme}
          siteSlug={siteSlug}
        />
      </section>
    );
  }

  const cards = Array.isArray(component.props.cards)
    ? (component.props.cards as {
        image?: { url?: string; alt?: string };
        heading?: string;
        link?: { label?: string; href?: string };
      }[])
    : [];
  return (
    <section
      className="card-grid-block"
      id={component.props.title === 'Explore the team' ? 'team' : component.id}
    >
      {typeof component.props.title === 'string' && (
        <div className="block-heading">
          <h2>{component.props.title}</h2>
          <span className="heading-rule" />
        </div>
      )}
      <div className="site-card-grid">
        {cards.map((card, index) => (
          <article className="site-card" key={`${card.heading}-${index}`}>
            <div className="site-card-image">
              <img
                src={
                  card.image?.url ||
                  'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=900&q=85'
                }
                alt={card.image?.alt || ''}
              />
              <span className="card-index">0{index + 1}</span>
            </div>
            <div className="site-card-content">
              <h3>{card.heading || 'Untitled card'}</h3>
              {card.link?.href && (
                <a
                  href={resolveCardHref(card.link.href, siteSlug)}
                >
                  {card.link.label || 'Read more'} <span>↗</span>
                </a>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
