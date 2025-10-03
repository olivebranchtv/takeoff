import type { XY } from '@/types';

export function pathLength(vertices: XY[]): number {
  if (vertices.length < 2) return 0;
  let total = 0;
  for (let i = 0; i < vertices.length - 1; i++) {
    const dx = vertices[i + 1].x - vertices[i].x;
    const dy = vertices[i + 1].y - vertices[i].y;
    total += Math.sqrt(dx * dx + dy * dy);
  }
  return total;
}
