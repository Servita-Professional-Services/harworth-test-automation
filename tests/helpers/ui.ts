import type { Locator } from '@playwright/test';

export async function selectRandomOption(select: Locator): Promise<string> {
  const candidates = await select.evaluate((el) => {
    const opts = Array.from(
      el.querySelectorAll('option')
    ) as HTMLOptionElement[];

    return opts
      .filter(o => !!o.value)
      .filter(o => !(o.textContent ?? '').toLowerCase().includes('select'))
      .map(o => ({
        value: o.value,
        label: (o.textContent ?? '').trim(),
      }));
  });

  if (!candidates.length) {
    throw new Error('selectRandomOption: no valid options found');
  }

  const random = candidates[Math.floor(Math.random() * candidates.length)];
  await select.selectOption(random.value);
  return random.value;
}
