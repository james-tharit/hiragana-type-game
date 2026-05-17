import { GROUPS } from '../src/constants/kanaGroups';

export async function getPrerenderRoutes(): Promise<string[]> {
  const staticRoutes = ['/', '/practice', '/arcade', '/about', '/kana'];
  const groupRoutes = GROUPS.map((group) => `/group/${group.id}`);

  return [...staticRoutes, ...groupRoutes];
}
