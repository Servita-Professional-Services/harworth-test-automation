import type { TestInfo } from '@playwright/test';

export async function cleanupWithReport(
  testInfo: TestInfo,
  tasks: Array<{ name: string; run: () => Promise<unknown> }>,
) {
  const results = await Promise.allSettled(tasks.map(t => t.run()));
  const failures = results
    .map((r, i) => ({ r, name: tasks[i].name }))
    .filter(x => x.r.status === 'rejected') as Array<{ name: string; r: PromiseRejectedResult }>;

  if (!failures.length) return;

  const text = failures
    .map(f => `${f.name} failed:\n${String(f.r.reason)}`)
    .join('\n\n');

  await testInfo.attach('cleanup-failures', {
    body: text,
    contentType: 'text/plain',
  });

  testInfo.annotations.push({
    type: 'cleanup-failed',
    description: failures.map(f => f.name).join(', '),
  });
}