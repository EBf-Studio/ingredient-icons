import { GENERIC_ID } from '@ingredient-icons/core';

/**
 * The ids an ingredient goes through to find its icon, the walk the docs recommend: the id
 * itself, then each parent in catalog.json up to its family, stopping at the first that has
 * an icon. Ends on GENERIC_ID when none has one (or the id is not in the catalog).
 */
export function fallbackSteps(
  id: string,
  parentOf: (id: string) => string | undefined,
  hasIcon: (id: string) => boolean,
): string[] {
  const steps: string[] = [];
  const seen = new Set<string>();
  for (let at: string | undefined = id; at !== undefined && !seen.has(at); at = parentOf(at)) {
    steps.push(at);
    if (hasIcon(at)) return steps;
    seen.add(at);
  }
  return [...steps, GENERIC_ID];
}

/** Where a walk ended: the ingredient's own icon, an ancestor's, its family's, or the generic one. */
export type FallbackKind = 'own' | 'ancestor' | 'family' | 'generic';

export function fallbackKind(steps: string[], isFamily: (id: string) => boolean): FallbackKind {
  const target = steps.at(-1)!;
  if (target === GENERIC_ID) return 'generic';
  if (steps.length === 1) return 'own';
  return isFamily(target) ? 'family' : 'ancestor';
}

/** "spice-blends" → "spice blends": how the site names a family, whose catalog name is often a Wikidata label. */
export const familyLabel = (id: string) => id.replaceAll('-', ' ');
