import type { PatchProblem } from './types';

/** Throws on a non-2xx so callers can roll back an optimistic update. */
export async function patchProblem(id: number, patch: PatchProblem) {
  const res = await fetch(`/api/v1/problems/${id}`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(patch),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? `request failed (${res.status})`);
  }

  return res.json();
}

import type { PatchArticle } from './types';

/** Same contract as patchProblem, for the System Design sheet. */
export async function patchArticle(id: number, patch: PatchArticle) {
  const res = await fetch(`/api/v1/articles/${id}`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(patch),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? `request failed (${res.status})`);
  }

  return res.json();
}
