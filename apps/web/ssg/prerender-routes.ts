import { GROUPS } from '@wakana/core/kana';

export async function getPrerenderRoutes(): Promise<string[]> {
  const staticRoutes = ['/', '/practice', '/arcade', '/about', '/kana', '/sentences'];
  const groupRoutes = GROUPS.map((group) => `/group/${group.id}`);

  return [...staticRoutes, ...groupRoutes];
}
