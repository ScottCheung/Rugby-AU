import { Heading } from '@/components/primitives/Heading';
import type { PropsOf } from '@/lib/components/registry';
import { formatDate, selectArticles, type SiteData } from '@/lib/news';
import { Card } from './CardGrid';

/**
 * Fills itself from the site's article pages (SiteData), so editors only
 * choose options. Leaves out the page it is on, so "More news" under an
 * article never repeats that article.
 */
export function LatestNews({
  title,
  category,
  limit,
  display,
  siteSlug,
  data,
}: PropsOf<'latestNews'> & { siteSlug: string; data: SiteData }) {
  const articles = selectArticles(data.articles, {
    category,
    limit,
    exclude: data.pagePath,
  });
  return (
    <div className="@container flex min-w-0 flex-col gap-site-sm">
      {title && <Heading level={2}>{title}</Heading>}
      {articles.length === 0 ? (
        <p className="m-0 rounded-site bg-surface-light p-site-sm text-muted-text">
          No articles yet{category ? ` in ${category}` : ''}. Add a page with an
          Article block and it appears here.
        </p>
      ) : (
        <div className={`cards-${display}`}>
          {articles.map((article, index) => (
            <Card
              key={article.path}
              index={index}
              variant={display}
              siteSlug={siteSlug}
              eyebrow={`${article.category} · ${formatDate(article.date)}`}
              card={{
                image: article.image,
                heading: article.headline,
                text: article.standfirst,
                link: { label: 'Read more', href: article.path },
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
