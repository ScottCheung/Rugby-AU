import { Heading } from '@/components/primitives/Heading';
import { Image } from '@/components/primitives/Image';
import type { StoryPiece } from '@/lib/components/story';
import type { ItemProps } from './types';

/** The reading column: text pieces never run wider than this. */
const column = 'w-full max-w-3xl';

function Piece({ piece, large }: { piece: StoryPiece; large: boolean }) {
  switch (piece.kind) {
    case 'heading':
      return (
        <h3
          className={`site-heading m-0 mt-site-xs text-2xl leading-tight font-bold @xl/page:text-3xl ${column}`}
        >
          {piece.text}
        </h3>
      );
    case 'image':
      return (
        <figure
          className={`m-0 my-site-xs flex flex-col gap-site-xs ${piece.width === 'wide' ? 'w-full' : column}`}
        >
          <div className="overflow-hidden rounded-[var(--radius-card)] bg-surface-light">
            <Image src={piece.image.url} alt={piece.image.alt} fit="natural" />
          </div>
          {piece.caption && (
            <figcaption className="text-sm opacity-75">
              {piece.caption}
            </figcaption>
          )}
        </figure>
      );
    case 'quote':
      return (
        <figure
          className={`m-0 my-site-xs border-l-4 border-current/30 pl-site-sm ${column}`}
        >
          <blockquote className="site-heading m-0 text-xl leading-snug font-semibold @xl/page:text-2xl">
            {piece.text}
          </blockquote>
          {piece.by && (
            <figcaption className="mt-site-xs text-sm opacity-75">
              — {piece.by}
            </figcaption>
          )}
        </figure>
      );
    case 'list': {
      const List = piece.numbered ? 'ol' : 'ul';
      return (
        <List
          className={`m-0 flex flex-col gap-1 pl-6 ${piece.numbered ? 'list-decimal' : 'list-disc'} ${large ? 'text-lg' : 'text-[1.0625rem]'} leading-[1.75] ${column}`}
        >
          {piece.items.map((point, index) => (
            <li key={index}>{point}</li>
          ))}
        </List>
      );
    }
    default:
      return (
        <p
          className={`m-0 whitespace-pre-line ${large ? 'text-xl leading-[1.7]' : 'text-[1.0625rem] leading-[1.75]'} ${column}`}
        >
          {piece.text}
        </p>
      );
  }
}

/**
 * A story: its pieces in order. Text keeps to a reading width; a picture
 * set to "wide" takes the block's whole width. Text colour is inherited,
 * so it reads on any Section background.
 */
export function StoryItem({ item, style }: ItemProps<'story'>) {
  const large = style.size === 'large';
  return (
    <div className="flex flex-col items-start gap-site-sm">
      {item.title && (
        <div className={column}>
          <Heading level={2}>{item.title}</Heading>
        </div>
      )}
      {(item.story ?? []).map((piece, index) => (
        <Piece key={index} piece={piece} large={large} />
      ))}
    </div>
  );
}
