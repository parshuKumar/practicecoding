import { redirect } from 'next/navigation';
import { getUser } from '@/server/auth';
import { getSheet } from '@/server/sheet';
import { warmSystemDesignContent } from '@/server/system-design';
import { SheetClient } from '@/components/sheet/SheetClient';

export const dynamic = 'force-dynamic';

export default async function SheetPage() {
  const user = await getUser();
  if (!user) redirect('/');

  const sheet = await getSheet(user.id);
  warmSystemDesignContent();

  return <SheetClient sheet={sheet} />;
}
