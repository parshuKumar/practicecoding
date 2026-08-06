import { withAuth } from '@/server/handler';
import { importLegacy } from '@/server/import';
import { importLegacySchema } from '@/lib/types';

export const POST = withAuth(async (user, req) => {
  const { entries, dryRun } = importLegacySchema.parse(await req.json());
  return importLegacy(user.id, entries, dryRun);
});
