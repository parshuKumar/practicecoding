import { redirect } from 'next/navigation';
import { getUser, signOut } from '@/server/auth';
import { NavTabs } from '@/components/NavTabs';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  if (!user) redirect('/');

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-[--color-border] bg-[--color-bg]/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-6">
            <span className="font-semibold tracking-tight text-white">DSA Sheet</span>
            <NavTabs />
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-[--color-muted] sm:inline">{user.email}</span>
            <form
              action={async () => {
                'use server';
                await signOut({ redirectTo: '/' });
              }}
            >
              <button
                type="submit"
                className="rounded-md border border-[--color-border] px-3 py-1.5 text-sm text-[--color-muted] transition hover:border-[--color-hard] hover:text-white"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}
