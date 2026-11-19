'use client';

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-4 p-8">
      <h1 className="text-3xl font-bold text-slate-900">
        Something went wrong
      </h1>
      <p className="text-slate-600">
        If this keeps happening, check that MongoDB is running (
        <code>docker compose up -d</code>) and seeded (<code>npm run seed</code>
        ).
      </p>
      <button
        onClick={reset}
        className="self-start rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white"
      >
        Try again
      </button>
    </main>
  );
}
