export const tagAssemblyMapping: Record<string, string> = {};

export function autoAssignAssembly(tag: { code: string; category?: string; assemblyId?: string }) {
  return { ...tag, assemblyId: tag.assemblyId || undefined };
}

export function getAssemblyIdForTag(code: string, category?: string): string | undefined {
  return undefined;
}
