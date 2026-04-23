import type { WorkspaceAccessProfile } from "@/lib/workspace-api";

export function hasAbility(abilities: string[], ability: string) {
  return abilities.includes("*") || abilities.includes(ability);
}

export function hasAnyAbility(abilities: string[], expected: string[] = []) {
  return ! expected.length || expected.some((ability) => hasAbility(abilities, ability));
}

export function canAccessWorkspaceArea(
  access: WorkspaceAccessProfile | null,
  requirements?: {
    platform?: string[];
    company?: string[];
  },
) {
  const platformAbilities = access?.platformAbilities ?? [];
  const companyAbilities = access?.membership?.abilities ?? [];

  return hasAnyAbility(platformAbilities, requirements?.platform)
    && hasAnyAbility(companyAbilities, requirements?.company);
}