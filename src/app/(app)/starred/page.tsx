import { redirect } from 'next/navigation';
import { getUser } from '@/server/auth';
import { getSheet } from '@/server/sheet';
import { SheetClient } from '@/components/sheet/SheetClient';

export const dynamic = 'force-dynamic';

export default async function StarredPage() {
  const user = await getUser();
  if (!user) redirect('/');

  const sheet = await getSheet(user.id);

  return <SheetClient sheet={sheet} starredOnly />;
}
