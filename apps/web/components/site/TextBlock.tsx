import { Button } from '@/components/primitives/Button';
import { Heading } from '@/components/primitives/Heading';
import type { PropsOf } from '@/lib/components/registry';
import { resolveHref } from '@/lib/links';

/** Text colour is inherited, so it reads on any Section background. */
export function TextBlock({
  heading,
  body,
  button,
  style = 'plain',
  siteSlug,
}: PropsOf<'textBlock'> & { siteSlug: string }) {
  const href = button && resolveHref(button.href, siteSlug);
  // An empty line in the text starts a new paragraph.
  const paragraphs = body.split(/\n\s*\n/).filter((text) => text.trim());
  const action = button && href && (
    <div className="pt-1">
      <Button href={href}>{button.label}</Button>
    </div>
  );

  // A pull quote: the text is the quote, the heading says who said it.
  if (style === 'quote')
    return (
      <figure className="m-0 mx-auto flex max-w-3xl flex-col items-center gap-4 py-site-sm text-center">
        <span
          aria-hidden
          className="site-heading text-6xl leading-none opacity-40"
        >
          “
        </span>
        <blockquote className="site-heading m-0 flex flex-col gap-3 text-2xl leading-snug font-bold sm:text-3xl">
          {paragraphs.map((text, index) => (
            <p key={index} className="m-0">
              {text}
            </p>
          ))}
        </blockquote>
        {heading && (
          <figcaption className="text-sm opacity-80">— {heading}</figcaption>
        )}
        {action}
      </figure>
    );

  const centred = style === 'centered';
  return (
    <div
      className={`flex max-w-3xl flex-col gap-3 ${centred ? 'mx-auto items-center text-center' : 'items-start'}`}
    >
      {heading && <Heading level={2}>{heading}</Heading>}
      {paragraphs.map((text, index) => (
        <p
          key={index}
          className={`m-0 leading-relaxed opacity-90 ${index === 0 ? 'text-lg' : 'text-base'}`}
        >
          {text}
        </p>
      ))}
      {action}
    </div>
  );
}
