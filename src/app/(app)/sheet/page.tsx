import { redirect } from 'next/navigation';
import { getUser } from '@/server/auth';
import { getSheet } from '@/server/sheet';
import { SheetClient } from '@/components/sheet/SheetClient';

export const dynamic = 'force-dynamic';

export default async function SheetPage() {
  const user = await getUser();
  if (!user) redirect('/');

  const sheet = await getSheet(user.id);

  // A fresh account almost certainly has a legacy file to import — but this is a
  // hint, not a redirect, so nobody gets trapped bouncing between the two pages.
  const showImportHint = sheet.stats.done === 0 && sheet.stats.starred === 0;

  return <SheetClient sheet={sheet} showImportHint={showImportHint} />;
}
