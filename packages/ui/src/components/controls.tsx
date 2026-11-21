'use client';
import * as React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading = false, disabled, children, className, ...props }, ref,
) {
  return <button ref={ref} className={`sc-ui-button${className ? ` ${className}` : ''}`} data-variant={variant} data-size={size} disabled={disabled || loading} aria-busy={loading || undefined} {...props}>{loading ? <><span aria-hidden="true">◌</span><span>{children}</span></> : children}</button>;
});

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  children: React.ReactNode;
}
export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton({ label, variant = 'secondary', children, className, ...props }, ref) {
  return <button ref={ref} className={`sc-ui-icon-button${className ? ` ${className}` : ''}`} data-variant={variant} aria-label={label} title={label} {...props}>{children}</button>;
});

export interface FieldProps extends React.HTMLAttributes<HTMLDivElement> { label?: string; hint?: string; error?: string; required?: boolean; }
function Field({ label, hint, error, required, children, className, ...props }: FieldProps) {
  const id = React.useId();
  const describedBy = [hint ? `${id}-hint` : '', error ? `${id}-error` : ''].filter(Boolean).join(' ') || undefined;
  const child = React.isValidElement<{ id?: string; 'aria-describedby'?: string }>(children)
    ? React.cloneElement(children, { id: children.props.id ?? id, 'aria-describedby': [children.props['aria-describedby'], describedBy].filter(Boolean).join(' ') || undefined })
    : children;
  return <div className={`sc-ui-field${className ? ` ${className}` : ''}`} {...props}>{label && <label className="sc-ui-field-label" htmlFor={id}>{label}{required && <span aria-hidden="true"> *</span>}</label>}{child}{hint && <span id={`${id}-hint`} className="sc-ui-field-hint">{hint}</span>}{error && <span id={`${id}-error`} className="sc-ui-error" role="alert">{error}</span>}</div>;
}
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> { label?: string; hint?: string; error?: string; }
export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input({ label, hint, error, required, className, ...props }, ref) {
  const input = <input ref={ref} className={`sc-ui-input${className ? ` ${className}` : ''}`} required={required} aria-invalid={Boolean(error) || undefined} {...props} />;
  return label || hint || error ? <Field label={label} hint={hint} error={error} required={required}>{input}</Field> : input;
});
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> { label?: string; hint?: string; error?: string; }
export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea({ label, hint, error, required, className, ...props }, ref) {
  const input = <textarea ref={ref} className={`sc-ui-textarea${className ? ` ${className}` : ''}`} required={required} aria-invalid={Boolean(error) || undefined} {...props} />;
  return label || hint || error ? <Field label={label} hint={hint} error={error} required={required}>{input}</Field> : input;
});
export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> { label?: string; hint?: string; error?: string; }
export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(function Select({ label, hint, error, required, className, children, ...props }, ref) {
  const input = <select ref={ref} className={`sc-ui-select${className ? ` ${className}` : ''}`} required={required} aria-invalid={Boolean(error) || undefined} {...props}>{children}</select>;
  return label || hint || error ? <Field label={label} hint={hint} error={error} required={required}>{input}</Field> : input;
});
export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> { label?: React.ReactNode; }
export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox({ label, className, ...props }, ref) {
  const input = <input ref={ref} type="checkbox" className={`sc-ui-check-input${className ? ` ${className}` : ''}`} {...props} />;
  return label ? <label className="sc-ui-check-label">{input}<span>{label}</span></label> : input;
});
export interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> { label?: React.ReactNode; }
export const Radio = React.forwardRef<HTMLInputElement, RadioProps>(function Radio({ label, className, ...props }, ref) {
  const input = <input ref={ref} type="radio" className={`sc-ui-radio-input${className ? ` ${className}` : ''}`} {...props} />;
  return label ? <label className="sc-ui-radio-label">{input}<span>{label}</span></label> : input;
});
export interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> { label?: React.ReactNode; }
export const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(function Switch({ label, className, ...props }, ref) {
  const toggle = <span className={`sc-ui-switch${className ? ` ${className}` : ''}`}><input ref={ref} type="checkbox" role="switch" className="sc-ui-switch-input" {...props} /><span className="sc-ui-switch-track"/><span className="sc-ui-switch-thumb"/></span>;
  return label ? <label className="sc-ui-check-label">{toggle}<span>{label}</span></label> : toggle;
});
export interface SegmentedControlProps { options: Array<{ value: string; label: React.ReactNode; disabled?: boolean }>; value: string; onValueChange(value: string): void; ariaLabel: string; className?: string; }
export function SegmentedControl({ options, value, onValueChange, ariaLabel, className }: SegmentedControlProps) {
 return <div role="group" aria-label={ariaLabel} className={`sc-ui-segmented${className ? ` ${className}` : ''}`}>{options.map(option => <button key={option.value} type="button" disabled={option.disabled} aria-pressed={value === option.value} onClick={() => onValueChange(option.value)}>{option.label}</button>)}</div>;
}

export interface TreeItemProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onSelect'> {
  /** Nesting level, 0 for the top. Each level indents the row. */
  depth?: number;
  label: React.ReactNode;
  /** A short second line, e.g. a summary of the item's content. */
  description?: React.ReactNode;
  icon?: React.ReactNode;
  selected?: boolean;
  /** Marks the row as having a problem (a red dot and an accessible label). */
  invalid?: boolean;
  onSelect?(): void;
  /** Buttons shown at the end of the row: always when selected, on hover otherwise. */
  actions?: React.ReactNode;
}
/** One row of a tree outline: a select button plus optional row actions. */
export function TreeItem({ depth = 0, label, description, icon, selected = false, invalid = false, onSelect, actions, className, style, ...props }: TreeItemProps) {
  return (
    <div className={`sc-ui-tree-item${className ? ` ${className}` : ''}`} data-selected={selected || undefined} style={{ paddingLeft: `calc(${depth} * 1rem + 0.25rem)`, ...style }} {...props}>
      <button type="button" className="sc-ui-tree-item-main" aria-current={selected || undefined} onClick={onSelect}>
        {icon && <span className="sc-ui-tree-item-icon" aria-hidden="true">{icon}</span>}
        <span className="sc-ui-tree-item-text">
          <span className="sc-ui-tree-item-label">{label}</span>
          {description && <span className="sc-ui-tree-item-description">{description}</span>}
        </span>
        {invalid && <span className="sc-ui-tree-item-invalid" role="img" aria-label="Needs attention" />}
      </button>
      {actions && <span className="sc-ui-tree-item-actions">{actions}</span>}
    </div>
  );
}

export interface CollapsibleProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  /** The always-visible row; clicking it opens or closes the body. */
  summary: React.ReactNode;
  open: boolean;
  onOpenChange(open: boolean): void;
  /** Buttons beside the summary (e.g. move, remove). They do not toggle. */
  actions?: React.ReactNode;
  invalid?: boolean;
}
/** A controlled disclosure: one summary row that expands to show its body. */
export function Collapsible({ summary, open, onOpenChange, actions, invalid = false, children, className, ...props }: CollapsibleProps) {
  const bodyId = React.useId();
  return (
    <div className={`sc-ui-collapsible${className ? ` ${className}` : ''}`} data-open={open || undefined} data-invalid={invalid || undefined} {...props}>
      <div className="sc-ui-collapsible-header">
        <button type="button" className="sc-ui-collapsible-trigger" aria-expanded={open} aria-controls={bodyId} onClick={() => onOpenChange(!open)}>
          <span className="sc-ui-collapsible-chevron" aria-hidden="true" />
          <span className="sc-ui-collapsible-summary">{summary}</span>
          {invalid && <span className="sc-ui-tree-item-invalid" role="img" aria-label="Needs attention" />}
        </button>
        {actions && <span className="sc-ui-collapsible-actions">{actions}</span>}
      </div>
      {open && <div id={bodyId} className="sc-ui-collapsible-body">{children}</div>}
    </div>
  );
}
