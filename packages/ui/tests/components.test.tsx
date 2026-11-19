import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ThemeProvider } from '../src/index.js';
import { Button, Drawer, Input, Select } from '../src/client.js';

describe('public UI components', () => {
  it('handles button clicks and loading disabled state', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Save</Button>);
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('labels input fields and exposes validation errors', () => {
    render(<Input label="Email" type="email" error="Enter a valid email" />);
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a valid email');
  });

  it('supports native select changes', () => {
    render(<Select aria-label="Team" defaultValue="one"><option value="one">One</option><option value="two">Two</option></Select>);
    const select = screen.getByRole('combobox', { name: 'Team' });
    fireEvent.change(select, { target: { value: 'two' } });
    expect(select).toHaveValue('two');
  });

  it('closes a drawer on Escape and keeps it accessible', () => {
    const onOpenChange = vi.fn();
    render(<Drawer open onOpenChange={onOpenChange} title="Details">Dialog content</Drawer>);
    expect(screen.getByRole('dialog', { name: 'Details' })).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('scopes theme configuration to its wrapper', () => {
    render(<ThemeProvider mode="dark" brand="rugby"><span>Content</span></ThemeProvider>);
    expect(screen.getByText('Content').parentElement).toHaveAttribute('data-mode', 'dark');
    expect(screen.getByText('Content').parentElement).toHaveAttribute('data-brand', 'rugby');
  });
});
