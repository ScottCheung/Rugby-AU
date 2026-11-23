import type { ComponentType as ReactComponentType, ReactNode } from 'react';
import type { BlockProps } from '@/lib/components/blocks/defineBlock';
import { blockItems } from '@/lib/components/blocks/resolve';
import { sourceOf } from '@/lib/components/blocks/sources';
import { itemMark } from '@/lib/components/items';
import { getBlock, type BlockType } from '@/lib/components/registry';
import type { SiteData } from '@/lib/components/blocks/siteData';
import type { DrawnItem } from '@/lib/components/blocks/resolve';
import { Arrangement } from './Arrangement';
import type { ItemProps } from './types';

type Context = {
  siteSlug: string;
  data: SiteData;
  editing?: boolean;
  animate?: boolean;
};

/**
 * The renderer of a block type, from the component that draws one item
 * (and, optionally, a frame around the whole block). Everything else is
 * the same for every block: which items to draw, the arrangement, the
 * editor's item markers and the empty state.
 */
export function blockRenderer<Type extends BlockType>(
  type: Type,
  Item: ReactComponentType<ItemProps<Type>>,
  Frame?: ReactComponentType<{ items: DrawnItem[]; children: ReactNode }>,
) {
  function Block(props: BlockProps & Context) {
    const { siteSlug, data, editing = false, animate = true } = props;
    const definition = getBlock(type)!;
    const items = blockItems(definition, props, data, editing);

    if (items.length === 0)
      return (
        <Empty {...props} label={definition.itemsLabel} editing={editing} />
      );

    const arrangement = (
      <Arrangement
        layout={props.layout}
        size={definition.cell}
        label={definition.itemsLabel}
        editing={editing}
        animate={animate}
        cells={items.map(({ key, ref, item, hidden }, index) => ({
          key,
          mark: itemMark({
            editing,
            field: ref.field,
            ...('index' in ref ? { index: ref.index } : { ref: ref.ref }),
            hidden,
          }),
          node: (
            <Item
              item={item}
              style={props.style as ItemProps<Type>['style']}
              index={index}
              siteSlug={siteSlug}
              now={data.now}
            />
          ),
        }))}
      />
    );
    return Frame ? <Frame items={items}>{arrangement}</Frame> : arrangement;
  }
  Block.displayName = `Block(${type})`;
  return Block;
}

/**
 * Nothing to draw. Visitors see nothing for an empty written block, and a
 * quiet line for a data source with nothing to show; the editor gets a
 * placeholder saying what to do.
 */
function Empty({
  content,
  label,
  editing,
}: BlockProps & { label: string; editing: boolean }) {
  const source = sourceOf(content.from);
  if (!editing && !source) return null;
  const message = source
    ? `No ${source.itemLabel.toLowerCase()}s to show yet.`
    : `No ${label.toLowerCase()} yet.`;
  return (
    <div
      className={
        editing
          ? 'flex min-h-32 flex-col items-center justify-center gap-1 rounded-site border-2 border-dashed border-current/25 p-site-sm text-center text-sm opacity-75'
          : 'rounded-site border border-dashed border-current/25 p-site-sm text-sm opacity-75'
      }
    >
      <p className="m-0 font-semibold">{message}</p>
      {editing && (
        <p className="m-0 opacity-80">
          {source
            ? 'Change the options under Content, or add some in the site manager.'
            : 'Add one under Content in the panel.'}
        </p>
      )}
    </div>
  );
}
