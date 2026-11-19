import Link from 'next/link';
import { H1 } from '@scottcheung/ui';
export default function NotFound() { return <div className="grid min-h-64 content-center justify-items-start gap-4"><H1>Page not found</H1><Link className="sc-ui-button" href="/">Back to overview</Link></div>; }
