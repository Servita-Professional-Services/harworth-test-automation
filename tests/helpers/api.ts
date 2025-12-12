import type { APIRequestContext, APIResponse, expect as ExpectType } from '@playwright/test';

export type Id = number | string;

export const OK_STATUSES = [200, 201, 204] as const;

export async function readTextSafe(res: APIResponse): Promise<string> {
  return res.text().catch(() => '');
}

export async function readJsonSafe<T = unknown>(res: APIResponse): Promise<T | undefined> {
  try {
    return (await res.json()) as T;
  } catch {
    return undefined;
  }
}

export async function expectStatus(
  res: APIResponse,
  ok: readonly number[],
  errorContext: { action: string; url?: string; requestBody?: unknown } = { action: 'request' },
): Promise<void> {
  const status = res.status();
  if (ok.includes(status)) return;

  const bodyText = await readTextSafe(res);
  const { action, url, requestBody } = errorContext;

  throw new Error(
    `Unexpected status from ${action}${url ? ` ${url}` : ''}: ${status}\n` +
      (requestBody !== undefined
        ? `Request body: ${JSON.stringify(requestBody, null, 2)}\n`
        : '') +
      `Response body: ${bodyText}`,
  );
}

export async function postJsonOrThrow(
  api: APIRequestContext,
  url: string,
  body: unknown,
  ok: readonly number[] = OK_STATUSES,
  actionLabel = `POST ${url}`,
): Promise<APIResponse> {
  const res = await api.post(url, { data: body as any });
  await expectStatus(res, ok, { action: actionLabel, url, requestBody: body });
  return res;
}

export async function pollForSingleRowOrThrow<T>(
  expect: typeof ExpectType,
  fetchRows: () => Promise<T[]>,
  opts: { timeoutMs?: number; message: string; intervalsMs?: number[] } = { message: 'Expected exactly one row' },
): Promise<T> {
  const timeoutMs = opts.timeoutMs ?? 15_000;
  const intervalsMs = opts.intervalsMs ?? [250, 500, 1000];

  await expect
    .poll(fetchRows, {
      timeout: timeoutMs,
      intervals: intervalsMs,
      message: opts.message,
    })
    .toHaveLength(1);

  const final = await fetchRows();
  if (!final?.length) throw new Error(opts.message);
  return final[0];
}

export { getSchemeStatusId } from './lookups-helper';