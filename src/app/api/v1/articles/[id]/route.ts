import { withAuth } from '@/server/handler';
import { updateArticle } from '@/server/articles';
import { patchArticleSchema } from '@/lib/types';

export const PATCH = withAuth(async (user, req, ctx) => {
  const { id } = await ctx.params;
  const patch = patchArticleSchema.parse(await req.json());
  return updateArticle(user.id, Number(id), patch);
});
