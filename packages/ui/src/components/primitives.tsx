import * as React from 'react';

export type CardProps = React.HTMLAttributes<HTMLDivElement>;
export const Card = React.forwardRef<HTMLDivElement, CardProps>(function Card({ className, ...props }, ref) { return <div ref={ref} className={`sc-ui-card${className ? ` ${className}` : ''}`} {...props}/>; });
export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> { tone?: 'primary' | 'neutral' | 'success' | 'warning' | 'danger'; }
export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(function Badge({ tone = 'primary', className, ...props }, ref) { return <span ref={ref} className={`sc-ui-badge${className ? ` ${className}` : ''}`} data-tone={tone} {...props}/>; });
export interface TypographyProps extends React.HTMLAttributes<HTMLElement> { as?: 'h1'|'h2'|'h3'|'p'|'span'; }
export function Typography({ as: Tag = 'p', className, ...props }: TypographyProps) { return <Tag className={`sc-ui-typography sc-ui-${Tag}${className ? ` ${className}` : ''}`} {...props}/>; }
export const H1 = (props: Omit<TypographyProps,'as'>) => <Typography as="h1" {...props}/>;
export const H2 = (props: Omit<TypographyProps,'as'>) => <Typography as="h2" {...props}/>;
export const H3 = (props: Omit<TypographyProps,'as'>) => <Typography as="h3" {...props}/>;
export const Paragraph = (props: Omit<TypographyProps,'as'>) => <Typography as="p" {...props}/>;
export interface SkeletonProps extends React.HTMLAttributes<HTMLSpanElement> { width?: React.CSSProperties['width']; height?: React.CSSProperties['height']; circle?: boolean; }
export function Skeleton({ width, height, circle = false, className, style, ...props }: SkeletonProps) { return <span aria-hidden="true" className={`sc-ui-skeleton${className ? ` ${className}` : ''}`} style={{ width, height, borderRadius: circle ? '50%' : undefined, ...style }} {...props}/>; }
export interface TooltipProps extends React.HTMLAttributes<HTMLSpanElement> { content: string; children: React.ReactNode; }
export function Tooltip({ content, children, className, ...props }: TooltipProps) { return <span className={`sc-ui-tooltip${className ? ` ${className}` : ''}`} data-tooltip={content} title={content} tabIndex={0} {...props}>{children}</span>; }
export interface PopoverProps { trigger: React.ReactNode; children: React.ReactNode; className?: string; label?: string; }
export function Popover({ trigger, children, className, label }: PopoverProps) { return <details className={`sc-ui-popover${className ? ` ${className}` : ''}`}><summary aria-label={label}>{trigger}</summary><div className="sc-ui-popover-panel">{children}</div></details>; }
export interface ThemeProviderProps extends React.HTMLAttributes<HTMLDivElement> { mode?: 'light'|'dark'; brand?: string; }
export function ThemeProvider({ mode = 'light', brand, className, ...props }: ThemeProviderProps) { return <div className={`sc-ui-theme${className ? ` ${className}` : ''}`} data-mode={mode} data-brand={brand} {...props}/>; }
export type Theme = ThemeProviderProps['mode'];

export interface NotchCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  /** Text on the tab that rises out of the card's top-left corner. Without it, a plain rounded card. */
  title?: React.ReactNode;
  /** Shown at the right of the tab row, e.g. a small button. */
  action?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}
/**
 * A card with a tab: the title sits on a tab joined to the card by a curved
 * notch. Colours come from --sc-notch-bg and --sc-notch-fg (default: the UI
 * surface and text), so callers can paint it in any brand. The body can
 * take a gradient through --sc-notch-body-bg, as long as its top edge is
 * --sc-notch-bg, where the solid tab joins it.
 */
export function NotchCard({ title, action, size = 'md', className, children, ...props }: NotchCardProps) {
  return (
    <div className={`sc-ui-notch-card${className ? ` ${className}` : ''}`} data-size={size} data-tab={title ? '' : undefined} {...props}>
      {(title || action) && (
        <div className="sc-ui-notch-tab-row">
          {title ? (
            <div className="sc-ui-notch-tab-wrap">
              <div className="sc-ui-notch-tab"><span>{title}</span></div>
              <svg className="sc-ui-notch-curve" width="60" height="30" viewBox="0 0 60 42" preserveAspectRatio="none" aria-hidden="true">
                <path d="M0 0H7.0783C14.772 0 21.7836 4.4132 25.111 11.3501L33.8889 29.6498C37.2164 36.5868 44.228 41 51.9217 41H60V42H0V0Z" />
              </svg>
            </div>
          ) : <span />}
          {action && <div className="sc-ui-notch-action">{action}</div>}
        </div>
      )}
      <div className="sc-ui-notch-body">{children}</div>
    </div>
  );
}
