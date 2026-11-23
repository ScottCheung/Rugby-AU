import { storyFromText } from '../components/story';
import type { ComponentNode } from '../types';

type Props = Record<string, unknown>;

/**
 * An article template stored when an article's body was one text field:
 * its story is a Text block (style "Story") whose text comes from the
 * article's body. Article bodies are now made of pieces, drawn by the
 * Story block, so that block becomes a Story block reading the same field.
 * The same node back when there is nothing to change.
 */
function storyBlock(node: ComponentNode): ComponentNode {
  if (node.type !== 'text') return node;
  const content = node.props.content as Props | undefined;
  if (content?.from !== 'entry' || content.text !== 'body') return node;
  const { text: _text, ...rest } = content;
  void _text;
  return {
    ...node,
    type: 'story',
    props: {
      content: { ...rest, story: 'body' },
      layout: node.props.layout ?? { arrange: 'list' },
      style: { size: 'standard' },
    },
  };
}

/** Every such block of a tree upgraded. Pure and idempotent. */
export function storyBlocks(tree: ComponentNode[]): ComponentNode[] {
  let changed = false;
  const next = tree.map((node) => {
    const children = node.children && storyBlocks(node.children);
    const upgraded = storyBlock(node);
    if (upgraded === node && children === node.children) return node;
    changed = true;
    return { ...upgraded, ...(children ? { children } : {}) };
  });
  return changed ? next : tree;
}

/**
 * An article's data with its body as pieces (a body stored as plain text
 * is split into paragraphs and subheadings). The same object back when it
 * is already in pieces.
 */
export function articleWithStory(data: Props): Props {
  if (typeof data.body !== 'string') return data;
  return { ...data, body: storyFromText(data.body) };
}
