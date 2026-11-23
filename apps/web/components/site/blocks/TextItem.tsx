import { Button } from '@/components/primitives/Button';
import { Heading } from '@/components/primitives/Heading';
import { resolveHref } from '@/lib/links';
import type { ItemProps } from './types';

/** Paragraphs split on empty lines; "## " starts a subheading. */
function Paragraphs({ text, story }: { text: string; story: boolean }) {
  return text
    .split(/\n\s*\n/)
    .filter((part) => part.trim())
    .map((part, index) =>
      part.startsWith('## ') ? (
        <h3
          key={index}
          className="site-heading m-0 mt-4 text-2xl leading-tight font-bold @xl/page:text-3xl"
        >
          {part.slice(3)}
        </h3>
      ) : (
        <p
          key={index}
          className={`m-0 ${story ? 'text-[1.0625rem] leading-[1.75]' : `leading-[1.7] opacity-90 ${index === 0 ? 'text-lg' : 'text-base'}`}`}
        >
          {part}
        </p>
      ),
    );
}

/** Text colour is inherited, so it reads on any Section background. */
export function TextItem({ item, style, siteSlug }: ItemProps<'text'>) {
  const text = item.text ?? '';
  const href = item.link && resolveHref(item.link.href, siteSlug);
  const action = item.link && href && (
    <div className="pt-1">
      <Button href={href}>{item.link.label}</Button>
    </div>
  );

  switch (style.variant) {
    // A pull quote: the text is the quote, the heading says who said it.
    case 'quote':
      return (
        <figure className="m-0 mx-auto flex max-w-3xl flex-col items-center gap-site-sm py-site-sm text-center">
          <span
            aria-hidden
            className="site-heading text-8xl leading-none opacity-40"
          >
            “
          </span>
          <blockquote className="site-heading m-0 flex flex-col gap-site-xs text-2xl leading-snug font-semibold @xl/page:text-3xl">
            {text
              .split(/\n\s*\n/)
              .filter((part) => part.trim())
              .map((part, index) => (
                <p key={index} className="m-0">
                  {part}
                </p>
              ))}
          </blockquote>
          {item.title && (
            <figcaption className="text-sm opacity-80">
              — {item.title}
            </figcaption>
          )}
          {action}
        </figure>
      );
    // The top of an article: a small line, a large title, the summary.
    case 'headline':
      return (
        <header className="flex max-w-3xl flex-col gap-site-xs">
          {item.eyebrow && (
            <p className="m-0 text-sm font-semibold tracking-wide uppercase opacity-70">
              {item.eyebrow}
            </p>
          )}
          {item.title && (
            <Heading level={1} as="h2">
              {item.title}
            </Heading>
          )}
          <p className="m-0 text-xl leading-relaxed opacity-75">{text}</p>
          {action}
        </header>
      );
    default: {
      const centred = style.variant === 'centered';
      return (
        <div
          className={`flex max-w-3xl flex-col gap-site-xs ${centred ? 'mx-auto items-center text-center' : 'items-start'} ${style.variant === 'story' ? 'gap-site-sm' : ''}`}
        >
          {item.title && <Heading level={2}>{item.title}</Heading>}
          <Paragraphs text={text} story={style.variant === 'story'} />
          {action}
        </div>
      );
    }
  }
}
