import { AutoAlign } from './AutoAlign';
import type { ItemProps } from './types';

const aligns = {
  left: 'items-start text-left',
  center: 'items-center text-center',
  right: 'items-end text-right',
} as const;

/** A big number in the heading font; its colour comes from the Section. */
export function StatItem({ item, style }: ItemProps<'stats'>) {
  const content = (
    <>
      <p
        className={`site-heading m-0 ${style.size === 'm' ? 'text-3xl @xl/page:text-4xl' : 'text-4xl @xl/page:text-6xl'} leading-none font-bold tracking-tight`}
      >
        {item.value}
      </p>
      <p className="m-0 text-sm leading-snug opacity-80">{item.title}</p>
    </>
  );
  const align = style.align ?? 'center';
  return align === 'auto' ? (
    <AutoAlign className="flex flex-col gap-1">{content}</AutoAlign>
  ) : (
    <div className={`flex flex-col gap-1 ${aligns[align]}`}>{content}</div>
  );
}
