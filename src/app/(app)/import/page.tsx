import { redirect } from 'next/navigation';
import { getUser } from '@/server/auth';
import { countDone } from '@/server/sheet';
import { ImportClient } from '@/components/ImportClient';
import bundled from '@legacy/legacy-progress.json';

export const dynamic = 'force-dynamic';

export default async function ImportPage() {
  const user = await getUser();
  if (!user) redirect('/');

  const alreadyDone = await countDone(user.id);
  const bundledTicks = Object.values(bundled as Record<string, string>).filter(
    (v) => v === 'true',
  ).length;

  return (
    <ImportClient
      bundled={bundled as Record<string, string>}
      bundledTicks={bundledTicks}
      alreadyDone={alreadyDone}
    />
  );
}
