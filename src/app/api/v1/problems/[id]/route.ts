import { withAuth } from '@/server/handler';
import { updateProblem } from '@/server/progress';
import { patchProblemSchema } from '@/lib/types';

export const PATCH = withAuth(async (user, req, ctx) => {
  const { id } = await ctx.params;
  const patch = patchProblemSchema.parse(await req.json());
  return updateProblem(user.id, Number(id), patch);
});
