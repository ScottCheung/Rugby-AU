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
