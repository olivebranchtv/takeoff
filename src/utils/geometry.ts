export function distance(a: {x:number;y:number}, b: {x:number;y:number}) {
  const dx = a.x - b.x, dy = a.y - b.y;
  return Math.hypot(dx, dy);
}
export function pathLength(vertices: {x:number;y:number}[]) {
  let total = 0;
  for (let i = 1; i < vertices.length; i++) total += distance(vertices[i-1], vertices[i]);
  return total;
}
// Ramer–Douglas–Peucker
export function simplifyRDP(points: {x:number;y:number}[], epsilon = 1.5): {x:number;y:number}[] {
  if (points.length < 3) return points;
  const dmaxInfo = maxDistanceToSegment(points);
  if (dmaxInfo.dmax > epsilon) {
    const rec1 = simplifyRDP(points.slice(0, dmaxInfo.index+1), epsilon);
    const rec2 = simplifyRDP(points.slice(dmaxInfo.index), epsilon);
    return rec1.slice(0, -1).concat(rec2);
  } else return [points[0], points[points.length-1]];
}
function maxDistanceToSegment(points: {x:number;y:number}[]) {
  let dmax = 0, index = 0;
  const start = points[0], end = points[points.length-1];
  for (let i = 1; i < points.length-1; i++) {
    const d = pointToSegmentDistance(points[i], start, end);
    if (d > dmax) { dmax = d; index = i; }
  }
  return { dmax, index };
}
function pointToSegmentDistance(p:{x:number;y:number}, a:{x:number;y:number}, b:{x:number;y:number}) {
  const l2 = distance(a,b)**2;
  if (l2 === 0) return distance(p,a);
  let t = ((p.x-a.x)*(b.x-a.x)+(p.y-a.y)*(b.y-a.y))/l2;
  t = Math.max(0, Math.min(1, t));
  return distance(p, {x:a.x + t*(b.x-a.x), y:a.y + t*(b.y-a.y)});
}