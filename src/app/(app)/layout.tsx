import { redirect } from 'next/navigation';
import { getUser, signOut } from '@/server/auth';
import { Logout } from '@/components/icons';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  if (!user) redirect('/');

  return (
    <div className="relative z-10 min-h-screen">
      <header className="sticky top-0 z-30 border-b border-[--color-line] bg-[--color-base]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-2.5">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-linear-to-br from-[--color-accent] to-[--color-accent-2] text-[13px] font-bold text-white">
              D
            </span>
            <span className="text-sm font-semibold tracking-tight text-[--color-hi]">
              DSA Sheet
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden text-xs text-[--color-dim] sm:inline">{user.email}</span>
            <form
              action={async () => {
                'use server';
                await signOut({ redirectTo: '/' });
              }}
            >
              <button
                type="submit"
                title="Sign out"
                aria-label="Sign out"
                className="rounded-lg border border-[--color-line] bg-[--color-surface] p-2 text-[--color-dim] transition hover:border-[--color-hard] hover:text-[--color-hard]"
              >
                <Logout size={15} />
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-5">{children}</main>
    </div>
  );
}
