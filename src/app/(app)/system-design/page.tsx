import { redirect } from 'next/navigation';
import { getUser } from '@/server/auth';
import { getSystemDesign } from '@/server/system-design';
import { warmSheetContent } from '@/server/sheet';
import { SdClient } from '@/components/system-design/SdClient';

export const dynamic = 'force-dynamic';

export default async function SystemDesignPage() {
  const user = await getUser();
  if (!user) redirect('/');

  const view = await getSystemDesign(user.id);
  warmSheetContent();

  return <SdClient view={view} />;
}
