import { redirect } from 'next/navigation';
import { getUser } from '@/server/auth';
import { getSheet } from '@/server/sheet';
import { warmTracks } from '@/server/reading';
import { SheetClient } from '@/components/sheet/SheetClient';

export const dynamic = 'force-dynamic';

export default async function SheetPage() {
  const user = await getUser();
  if (!user) redirect('/');

  const sheet = await getSheet(user.id);
  // Pre-warm every reading sheet so the other tabs open without the content join.
  warmTracks();

  return <SheetClient sheet={sheet} />;
}
