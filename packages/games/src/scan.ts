export function stepScan(index: number, count: number, direction: 1 | -1): number {
  if (count <= 0) return 0;
  return (index + direction + count) % count;
}
