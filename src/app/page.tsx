import { redirect } from 'next/navigation';
import { getUser, signIn } from '@/server/auth';

export default async function LandingPage() {
  if (await getUser()) redirect('/sheet');

  return (
    <main className="relative z-10 flex min-h-screen items-center justify-center px-6">
      <div className="animate-rise w-full max-w-sm text-center">
        <span className="mx-auto mb-6 grid h-12 w-12 place-items-center rounded-2xl bg-linear-to-br from-[--color-accent] to-[--color-accent-2] text-lg font-bold text-white">
          D
        </span>

        <h1 className="text-3xl font-bold tracking-tight text-[--color-hi]">
          DSA <span className="gradient-text">Sheet</span>
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-[--color-dim]">
          353 DSA problems across 35 patterns, and 140 system design articles from foundations to
          case studies. Tick them off, count your re-reads, star what needs another pass, keep
          your notes where you left them.
        </p>

        <form
          className="mt-8"
          action={async () => {
            'use server';
            await signIn('google', { redirectTo: '/sheet' });
          }}
        >
          <button
            type="submit"
            className="glass flex w-full items-center justify-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-[--color-hi] transition hover:border-[--color-accent]"
          >
            <GoogleMark />
            Continue with Google
          </button>
        </form>

        <p className="mt-5 text-xs text-[--color-dim]">Your progress follows you to any device.</p>
      </div>
    </main>
  );
}

function GoogleMark() {
  return (
    <svg width="17" height="17" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z"
      />
      <path
        fill="#34A853"
        d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z"
      />
      <path
        fill="#FBBC05"
        d="M11.69 28.18c-.44-1.32-.69-2.73-.69-4.18s.25-2.86.69-4.18v-5.7H4.34A21.99 21.99 0 0 0 2 24c0 3.55.85 6.91 2.34 9.88l7.35-5.7z"
      />
      <path
        fill="#EA4335"
        d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z"
      />
    </svg>
  );
}
