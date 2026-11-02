export const BOARD_SIZE = 100;

/** Fill only vacant places, then rank the first hundred eligible candidates. */
export function rankedHundred<T extends { rank: number }>(rows: T[], create: () => T, compare: (a: T, b: T) => number): T[] {
  while (rows.length < BOARD_SIZE) rows.push(create());
  return rows.sort(compare).slice(0, BOARD_SIZE).map((row, i) => ({ ...row, rank: i + 1 }));
}
