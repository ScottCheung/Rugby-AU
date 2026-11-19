import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-4 p-8">
      <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
        404
      </p>
      <h1 className="text-3xl font-bold text-slate-900">Page not found</h1>
      <p className="text-slate-600">There is no page at this address.</p>
      <Link
        href="/manager"
        className="font-semibold text-emerald-700 underline"
      >
        Go to the site manager
      </Link>
    </main>
  );
}
