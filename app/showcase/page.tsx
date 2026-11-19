'use client';
import * as React from 'react';
import { Badge, Card, H1, Skeleton } from '@scottcheung/ui';
import { Button, Checkbox, Drawer, Input, Radio, Select, SegmentedControl, Switch, Textarea, ToastProvider, useToast } from '@scottcheung/ui/client';
function ShowcaseContent() {
  const [choice, setChoice] = React.useState('one');
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const toast = useToast();
  return <div className="mx-auto max-w-5xl space-y-8">
    <H1>UI Showcase</H1>
    <Card><h2 className="text-lg font-semibold">Actions and feedback</h2><div className="mt-4 flex flex-wrap gap-3"><Button onClick={() => toast({ title: 'Changes saved', tone: 'success' })}>Show toast</Button><Button variant="secondary" onClick={() => setDrawerOpen(true)}>Open drawer</Button><Badge>Reusable</Badge><Badge tone="warning">Review</Badge></div></Card>
    <Card><h2 className="text-lg font-semibold">Form controls</h2><div className="mt-4 grid gap-4 md:grid-cols-2"><Input label="Email" placeholder="name@example.com"/><Select label="Team" defaultValue="platform"><option value="platform">Platform</option><option value="design">Design</option></Select><Textarea label="Notes" placeholder="Write a note"/><div className="grid content-start gap-4"><Checkbox label="Receive updates"/><Switch label="Enable feature" defaultChecked/><Radio name="example" label="Option A" defaultChecked/></div></div></Card>
    <Card><h2 className="text-lg font-semibold">Selection and loading</h2><div className="mt-4 grid gap-4"><SegmentedControl ariaLabel="Example options" value={choice} onValueChange={setChoice} options={[{ value: 'one', label: 'One' }, { value: 'two', label: 'Two' }]}/><Skeleton width="100%" height="1.25rem"/></div></Card>
    <Drawer open={drawerOpen} onOpenChange={setDrawerOpen} title="Drawer example"><p>This panel uses the shared Drawer component.</p><Button className="mt-5" onClick={() => setDrawerOpen(false)}>Close drawer</Button></Drawer>
  </div>;
}
export default function ShowcasePage() { return <ToastProvider><ShowcaseContent/></ToastProvider>; }
