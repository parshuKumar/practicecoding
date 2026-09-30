import { redirect } from 'next/navigation';
import { getUser } from '@/server/auth';
import { getReadingSheet, warmTracks } from '@/server/reading';
import { warmSheetContent } from '@/server/sheet';
import { SdClient } from '@/components/system-design/SdClient';

export const dynamic = 'force-dynamic';

export default async function SqlPage() {
  const user = await getUser();
  if (!user) redirect('/');

  const view = await getReadingSheet('sql', user.id);
  warmTracks('sql');
  warmSheetContent();

  return <SdClient view={view} />;
}
