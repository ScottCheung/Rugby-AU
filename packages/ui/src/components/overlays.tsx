'use client';
import * as React from 'react';

interface OverlayProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  open: boolean;
  onOpenChange(open: boolean): void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  closeOnOutsideClick?: boolean;
}
function useEscape(open: boolean, onClose: () => void) {
  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);
}
export function Dialog({ open, onOpenChange, title, description, children, className, closeOnOutsideClick = true, ...props }: OverlayProps) {
  const titleId = React.useId();
  const close = React.useCallback(() => onOpenChange(false), [onOpenChange]);
  useEscape(open, close);
  if (!open) return null;
  return <div className="sc-ui-dialog-backdrop" onMouseDown={event => { if (closeOnOutsideClick && event.target === event.currentTarget) close(); }}><div role="dialog" aria-modal="true" aria-labelledby={title ? titleId : undefined} className={`sc-ui-dialog${className ? ` ${className}` : ''}`} {...props}>{title && <h2 id={titleId} className="sc-ui-dialog-title">{title}</h2>}{description && <p>{description}</p>}{children}</div></div>;
}
export const Modal = Dialog;
export interface DrawerProps extends OverlayProps { side?: 'left'|'right'; }
export function Drawer({ open, onOpenChange, title, description, children, className, closeOnOutsideClick = true, side = 'right', ...props }: DrawerProps) {
  const titleId = React.useId();
  const close = React.useCallback(() => onOpenChange(false), [onOpenChange]);
  useEscape(open, close);
  if (!open) return null;
  return <><div className="sc-ui-drawer-backdrop" onMouseDown={event => { if (closeOnOutsideClick && event.target === event.currentTarget) close(); }}/><section role="dialog" aria-modal="true" aria-labelledby={title ? titleId : undefined} className={`sc-ui-drawer${className ? ` ${className}` : ''}`} data-side={side} {...props}>{title && <h2 id={titleId} className="sc-ui-dialog-title">{title}</h2>}{description && <p>{description}</p>}{children}</section></>;
}
export interface ToastOptions { title: string; description?: string; tone?: 'default'|'success'|'danger'; duration?: number; }
interface ToastRecord extends ToastOptions { id: number; }
interface ToastContextValue { toast(options: ToastOptions): void; dismiss(id: number): void; }
const ToastContext = React.createContext<ToastContextValue | null>(null);
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<ToastRecord[]>([]);
  const nextId = React.useRef(1);
  const dismiss = React.useCallback((id: number) => setItems(current => current.filter(item => item.id !== id)), []);
  const toast = React.useCallback((options: ToastOptions) => {
    const id = nextId.current++;
    setItems(current => [...current, { ...options, id }]);
    if (options.duration !== 0) window.setTimeout(() => dismiss(id), options.duration ?? 4000);
  }, [dismiss]);
  const value = React.useMemo(() => ({ toast, dismiss }), [toast, dismiss]);
  return <ToastContext.Provider value={value}>{children}<div className="sc-ui-toast-region" aria-live="polite" aria-relevant="additions text">{items.map(item => <div key={item.id} className="sc-ui-toast" data-tone={item.tone === 'danger' ? 'danger' : item.tone} role={item.tone === 'danger' ? 'alert' : 'status'}><span><strong>{item.title}</strong>{item.description && <span> — {item.description}</span>}</span><button type="button" aria-label="Dismiss notification" onClick={() => dismiss(item.id)}>×</button></div>)}</div></ToastContext.Provider>;
}
export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside ToastProvider');
  return context.toast;
}
export interface ToastProps extends React.HTMLAttributes<HTMLDivElement> { title: string; description?: string; tone?: 'default'|'success'|'danger'; }
export function Toast({ title, description, tone = 'default', className, ...props }: ToastProps) { return <div role={tone === 'danger' ? 'alert' : 'status'} className={`sc-ui-toast${className ? ` ${className}` : ''}`} data-tone={tone} {...props}><span><strong>{title}</strong>{description && <span> — {description}</span>}</span></div>; }
