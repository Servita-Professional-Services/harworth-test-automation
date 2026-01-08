import { expect, type Locator } from '@playwright/test';

export async function selectRandomOption(
  select: Locator,
  opts: { timeoutMs?: number } = {},
): Promise<string> {
  const { timeoutMs = 10_000 } = opts;

  await expect(select).toBeVisible({ timeout: timeoutMs });

  await expect
    .poll(
      async () => {
        return select.evaluate((el) => {
          const options = Array.from(el.querySelectorAll('option')) as HTMLOptionElement[];
          return options
            .filter(o => !!o.value)
            .filter(o => !(o.textContent ?? '').toLowerCase().includes('select'))
            .map(o => ({
              value: o.value,
              label: (o.textContent ?? '').trim(),
            }));
        });
      },
      { timeout: timeoutMs },
    )
    .not.toHaveLength(0);

  const candidates = await select.evaluate((el) => {
    const opts = Array.from(el.querySelectorAll('option')) as HTMLOptionElement[];

    return opts
      .filter(o => !!o.value)
      .filter(o => !(o.textContent ?? '').toLowerCase().includes('select'))
      .map(o => ({
        value: o.value,
        label: (o.textContent ?? '').trim(),
      }));
  });

  const random = candidates[Math.floor(Math.random() * candidates.length)];
  await select.selectOption(random.value);
  return random.value;
}