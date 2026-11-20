import { Button } from '@/components/primitives/Button';
import { Heading } from '@/components/primitives/Heading';
import type { PropsOf } from '@/lib/components/registry';
import { resolveHref } from '@/lib/links';

/** Text colour is inherited, so it reads on any Section background. */
export function TextBlock({
  heading,
  body,
  button,
  siteSlug,
}: PropsOf<'textBlock'> & { siteSlug: string }) {
  const href = button && resolveHref(button.href, siteSlug);
  // An empty line in the text starts a new paragraph.
  const paragraphs = body.split(/\n\s*\n/).filter((text) => text.trim());
  return (
    <div className="flex max-w-3xl flex-col items-start gap-3">
      {heading && <Heading level={2}>{heading}</Heading>}
      {paragraphs.map((text, index) => (
        <p
          key={index}
          className={`m-0 leading-relaxed opacity-90 ${index === 0 ? 'text-lg' : 'text-base'}`}
        >
          {text}
        </p>
      ))}
      {button && href && (
        <div className="pt-1">
          <Button href={href}>{button.label}</Button>
        </div>
      )}
    </div>
  );
}
