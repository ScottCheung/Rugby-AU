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
    /** Render a string as a date picker (the value is YYYY-MM-DD). */
    format?: 'date';
    /** Human labels for enum values, keyed by value. */
    optionLabels?: Record<string, string>;
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
     */
    widget?: 'image';
  }
}

export {};
