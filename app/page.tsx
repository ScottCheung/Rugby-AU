import { Badge, Card, H1, Paragraph } from '@scottcheung/ui';
export default function HomePage() {
  return <div className="mx-auto max-w-5xl">
    <H1>Overview</H1>
    <Paragraph className="mt-3">Your project workspace is ready.</Paragraph>
    <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Card><Badge tone="success">Ready</Badge><h2 className="mt-4 text-lg font-semibold">App Router</h2><p className="mt-2 text-sm text-[var(--ui-muted)]">Pages and layouts start in the app directory.</p></Card>
      <Card><Badge>Shared UI</Badge><h2 className="mt-4 text-lg font-semibold">Design system</h2><p className="mt-2 text-sm text-[var(--ui-muted)]">Reusable components with scoped theme tokens.</p></Card>
    </div>
  </div>;
}
