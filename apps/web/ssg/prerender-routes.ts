// Relative, not '@wakana/core/kana': vite externalises bare specifiers when it
// bundles this config, leaving Node to import the raw .ts — which only a Node
// that strips types can do. A relative path gets bundled by esbuild instead.
import { GROUPS } from '../../../packages/core/src/kanaGroups';

export async function getPrerenderRoutes(): Promise<string[]> {
  const staticRoutes = ['/', '/practice', '/arcade', '/arcade/slider', '/about', '/kana', '/sentences'];
  const groupRoutes = GROUPS.map((group) => `/group/${group.id}`);

  return [...staticRoutes, ...groupRoutes];
}
