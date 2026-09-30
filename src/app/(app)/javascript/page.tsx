import { redirect } from 'next/navigation';
import { getUser } from '@/server/auth';
import { getReadingSheet, warmTracks } from '@/server/reading';
import { warmSheetContent } from '@/server/sheet';
import { SdClient } from '@/components/system-design/SdClient';

export const dynamic = 'force-dynamic';

export default async function JavaScriptPage() {
  const user = await getUser();
  if (!user) redirect('/');

  const view = await getReadingSheet('javascript', user.id);
  warmTracks('javascript');
  warmSheetContent();

  return <SdClient view={view} />;
}
