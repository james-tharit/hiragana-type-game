import { GROUPS } from '../src/constants/kanaGroups';

export async function getPrerenderRoutes(): Promise<string[]> {
  const staticRoutes = ['/', '/about'];
  const groupRoutes = GROUPS.map((group) => `/group/${group.id}`);

  return [...staticRoutes, ...groupRoutes];
}
