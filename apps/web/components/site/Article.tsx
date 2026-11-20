import { Image } from '@/components/primitives/Image';
import type { PropsOf } from '@/lib/components/registry';
import { formatDate } from '@/lib/news';

/**
 * A story laid out for reading. Header, photo and body share one column,
 * so everything lines up on the same left edge. Lines starting with "## "
 * become subheadings.
 */
export function Article({
  category,
  date,
  headline,
  standfirst,
  image,
  body,
}: PropsOf<'article'>) {
  const blocks = body.split(/\n\s*\n/).filter((text) => text.trim());
  return (
    <article className="flex w-full max-w-3xl flex-col gap-site-md">
      <header className="flex flex-col gap-3">
        <p className="m-0 flex flex-wrap items-center gap-2 text-sm">
          <span className="rounded-full bg-brand px-3 py-1 font-semibold text-brand-contrast">
            {category}
          </span>
          <time dateTime={date} className="text-muted-text">
            {formatDate(date)}
          </time>
        </p>
        <h1 className="site-heading m-0 text-6xl leading-[0.95] tracking-tight font-bold @xl/page:text-7xl">
          {headline}
        </h1>
        <p className="m-0 text-2xl leading-relaxed text-muted-text">
          {standfirst}
        </p>
      </header>
      <figure className="m-0">
        <div className="media-card overflow-hidden rounded-site bg-surface-light">
          <Image src={image.url} alt={image.alt} eager />
        </div>
      </figure>
      <div className="flex flex-col gap-4 text-lg leading-relaxed">
        {blocks.map((block, index) =>
          block.startsWith('## ') ? (
            <h2
              key={index}
              className="site-heading m-0 mt-4 text-4xl leading-tight font-bold"
            >
              {block.slice(3)}
            </h2>
          ) : (
            <p key={index} className="m-0">
              {block}
            </p>
          ),
        )}
      </div>
    </article>
  );
}
