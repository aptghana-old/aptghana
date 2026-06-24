/** Modulo that always returns a non-negative result. */
export function modAbs(n: number, m: number): number {
  return ((n % m) + m) % m;
}
