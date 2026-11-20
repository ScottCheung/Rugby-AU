import { Image } from '@/components/primitives/Image';
import type { PropsOf } from '@/lib/components/registry';
import { formatDate } from '@/lib/news';

/**
 * A story laid out for reading: a narrow column for the text, the photo a
 * little wider. Lines starting with "## " become subheadings.
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
    <article className="flex flex-col gap-site-md">
      <header className="mx-auto flex w-full max-w-3xl flex-col gap-3">
        <p className="m-0 flex flex-wrap items-center gap-2 text-sm">
          <span className="rounded-full bg-brand px-3 py-1 font-semibold text-brand-contrast">
            {category}
          </span>
          <time dateTime={date} className="text-muted-text">
            {formatDate(date)}
          </time>
        </p>
        <h1 className="site-heading m-0 text-4xl leading-tight font-bold @xl/page:text-5xl">
          {headline}
        </h1>
        <p className="m-0 text-xl leading-relaxed text-muted-text">
          {standfirst}
        </p>
      </header>
      <figure className="m-0 mx-auto w-full max-w-5xl">
        <div className="media-card overflow-hidden rounded-site bg-surface-light">
          <Image src={image.url} alt={image.alt} eager />
        </div>
      </figure>
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 text-lg leading-relaxed">
        {blocks.map((block, index) =>
          block.startsWith('## ') ? (
            <h2
              key={index}
              className="site-heading m-0 mt-4 text-2xl leading-snug font-bold"
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
