/**
 * Editor hints a component schema can attach with Zod's `.meta({...})`.
 * They are read only by the manager's form generator (lib/forms).
 */
declare module 'zod' {
  interface GlobalMeta {
    /** Field label. Falls back to the humanised prop name. */
    label?: string;
    /** Help text shown under the field. */
    hint?: string;
    placeholder?: string;
    /** Render a string as a multi-line textarea. */
    multiline?: boolean;
    /**
     * Which of the editor's three tabs the field sits in: what the
     * component says (content, the default), how it is arranged (layout)
     * or how it looks (style).
     */
    group?: 'content' | 'layout' | 'style';
    /**
     * Show the field only while sibling fields have these values, e.g.
     * { mode: 'latest' }: an option that means nothing otherwise.
     */
    showIf?: Record<string, string | boolean>;
    /**
     * Kept by the editor itself rather than typed into the form, e.g. the
     * articles a block hides (the eye toggle on each one).
     */
    managed?: boolean;
    /**
     * Render a string as a date picker (the value is YYYY-MM-DD), a
     * colour picker (#rrggbb) or an image address with a thumbnail.
     */
    format?: 'date' | 'color' | 'image';
    /** Human labels for enum values, keyed by value. */
    optionLabels?: Record<string, string>;
    /** A short line under each option's label, keyed by value. */
    optionDescriptions?: Record<string, string>;
    /**
     * A type sample ("Aa") for each option, keyed by value: the font, its
     * case and the corner it is drawn in. For choices of type (a look).
     */
    optionSamples?: Record<
      string,
      { font: string; uppercase?: boolean; radius?: string }
    >;
    /** An optional enum's "nothing chosen" card, e.g. "As many as fit". */
    emptyLabel?: string;
    /**
     * For an optional enum whose absence means one of its options (the
     * original look): that option. The form shows no "not set" card and
     * picks this one while the value is absent; choosing it clears the value.
     */
    emptyIs?: string;
    /**
     * A sketch name per enum value (see components/manager/Sketch.tsx). When
     * given, the form shows the options as small skeleton pictures instead
     * of a dropdown. Plain names, so schemas stay free of UI code.
     */
    optionSketches?: Record<string, string>;
    /** Singular name for one item of a list, e.g. "Card". */
    itemLabel?: string;
    /**
     * A richer control for an object field. 'image' marks an { url, alt }
     * object: the form adds a preview and a picker of the site's images.
     * 'story' marks a list of story pieces (lib/components/story.ts): the
     * list adds one button per kind of piece.
     */
    widget?: 'image' | 'story';
    /**
     * Marks a list item's `hidden` flag: drawn as an eye toggle on the item
     * instead of a field in its form.
     */
    visibility?: boolean;
    /**
     * For an optional on/off option: absent means on (the original look),
     * so older pages keep it. Turning it off stores `false`.
     */
    onByDefault?: boolean;
  }
}

export {};
