'use client';
import { H1 } from '@scottcheung/ui';
import { Button } from '@scottcheung/ui/client';
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset(): void }) { return <div className="grid min-h-64 content-center justify-items-start gap-4"><H1>Something went wrong</H1><Button onClick={reset}>Try again</Button></div>; }
