import { expect } from "@playwright/test";

export type Row = Record<string, unknown>;

export function idsOf(rows: Row[]): string[] {
  return rows
    .filter(r => Object.prototype.hasOwnProperty.call(r, 'id'))
    .map(r => String((r as any).id));
}

export function idStrings(rows: Row[]): string[] {
  return rows.map(r => String((r as any).id));
}

export function setOf<T>(a: T[]): Set<T> {
  return new Set(a);
}

export function isSuperset<T>(sup: Set<T>, sub: Set<T>): boolean {
  for (const v of sub) if (!sup.has(v)) return false;
  return true;
}

export function arraysEqualByIds(a: Row[], b: Row[]): boolean {
  const sa = idsOf(a).sort();
  const sb = idsOf(b).sort();
  if (sa.length !== sb.length) return false;
  for (let i = 0; i < sa.length; i++) if (sa[i] !== sb[i]) return false;
  return true;
}

export function expectNoDuplicateIds(rows: Row[], ctx?: string) {
  const withId = idsOf(rows);
  const uniq = new Set(withId);
  if (uniq.size !== withId.length) {
    throw new Error(`Duplicate ids detected${ctx ? ` in ${ctx}` : ''}`);
  }
}

export function expectIdsContain(rows: Row[], ...ids: Array<string | number>) {
  const got = new Set(idsOf(rows));
  for (const id of ids) {
    if (!got.has(String(id))) {
      throw new Error(`Expected ids to contain ${String(id)} but it did not`);
    }
  }
}

export function expectIdsNotContain(rows: Row[], ...ids: Array<string | number>) {
  const got = new Set(idsOf(rows));
  for (const id of ids) {
    if (got.has(String(id))) {
      throw new Error(`Expected ids NOT to contain ${String(id)} but it did`);
    }
  }
}

export function expectAtMostN<T>(rows: T[], n: number) {
  if (rows.length > n) {
    throw new Error(`Expected at most ${n} rows, got ${rows.length}`);
  }
}

export const INVALID_ID_CASES = [-1, 0, 1.5, 'foo'] as const;

export async function expectDeleted<T>(
  fetcher: (ids: number[]) => Promise<T[]>,
  id: number
): Promise<void> {
  try {
    const items = await fetcher([id]);
    if (Array.isArray(items) && items.length === 0) return;
    throw new Error(`Expected no results for id=${id}, but got ${JSON.stringify(items)}`);
  } catch (err: any) {
    const msg = String(err?.message ?? '');
    if (msg.includes('"statusCode":404') || msg.includes('Not Found')) return;
    throw err; 
  }
}


