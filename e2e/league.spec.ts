import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
async function navigate(page: Page, name: string) {
  const menu = page.getByRole('button', { name: 'Open navigation' })
  if (await menu.isVisible()) await menu.click()
  await page
    .getByRole('navigation')
    .getByRole('button', { name, exact: true })
    .click()
}
test.beforeEach(async ({ page }) => {
  await page.goto('./')
})
test('a complete race supports pause, reset, replay and graphs', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.getByLabel('Playback speed').selectOption('10')
  await page.getByRole('button', { name: 'Play race', exact: true }).click()
  await expect(
    page.getByRole('button', { name: 'Pause race', exact: true }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Pause race', exact: true }).click()
  await page.getByRole('button', { name: 'Reset race', exact: true }).click()
  await expect(page.getByLabel('Race playback position')).toHaveValue('0')
  await page.getByRole('button', { name: 'Play race', exact: true }).click()
  await expect(
    page.getByRole('heading', { name: 'The finishing order' }),
  ).toBeVisible({ timeout: 8000 })
  await expect(page.getByRole('table').getByRole('row')).toHaveCount(6)
  await expect(page.getByRole('table').getByRole('row').nth(1)).toContainText(
    'Cheetah',
  )
  await page.getByRole('button', { name: 'Distance', exact: true }).click()
  await expect(
    page.getByRole('img', { name: /Distance in metres over/ }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Replay race', exact: true }).click()
  await expect(
    page.getByRole('button', { name: 'Pause race', exact: true }),
  ).toBeVisible()
  expect(errors).toEqual([])
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true)
})
test('roster search and six-distance comparisons work', async ({ page }) => {
  await page.getByRole('button', { name: /Add competitors/ }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByRole('searchbox').fill('snail')
  await dialog.getByRole('button', { name: /Garden snail/ }).click()
  await expect(dialog.getByText('6 competitors selected')).toBeVisible()
  await dialog.getByRole('button', { name: /Meet me at the start/ }).click()
  await expect(page.getByTitle('Edit Garden snail')).toBeVisible()
  await navigate(page, 'Distance showdown')
  await expect(
    page.getByRole('heading', { name: 'Sprinter or survivor?' }),
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Race this distance' }),
  ).toHaveCount(6)
  await expect(page.locator('.comparison-table tbody tr')).toHaveCount(6)
  await page.getByRole('button', { name: 'Race this distance' }).last().click()
  await expect(page.getByLabel('Custom distance in metres')).toHaveValue(
    '10000',
  )
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true)
})
test('a monster can be edited, saved, restored and raced after reload', async ({
  page,
}) => {
  await page.getByTitle('Edit Hippopotamus').click()
  const dialog = page.getByRole('dialog')
  await dialog.getByRole('button', { name: 'Make a monster' }).click()
  await dialog.getByLabel('Competitor name').fill('Hippo With A Turbo')
  await dialog.getByLabel('Launch acceleration').fill('15')
  await dialog.getByRole('button', { name: 'Save to stable' }).click()
  await expect(page.getByRole('dialog')).not.toBeVisible()
  await expect(page.getByTitle('Edit Hippo With A Turbo')).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Unrestricted nonsense' }),
  ).toBeVisible()
  await page.reload()
  await expect(page.getByTitle('Edit Hippo With A Turbo')).toBeVisible()
  await navigate(page, 'Animal lab')
  await expect(page.locator('.saved-animal')).toHaveCount(1)
  await page
    .locator('.saved-animal')
    .getByRole('button', { name: /^Hippo With A Turbo/ })
    .click()
  await expect(page.getByLabel('Competitor name')).toHaveValue(
    'Hippo With A Turbo',
  )
  await page.getByLabel('Estimated mass effects').uncheck()
  await expect(page.getByText('Mass effects are disabled')).toBeVisible()
})
test('custom distance entry, keyboard dialog close and safe reset work', async ({
  page,
}) => {
  const distance = page.getByLabel('Custom distance in metres')
  await distance.fill('725')
  await distance.press('Enter')
  await expect(distance).toBeFocused()
  await expect(page.getByRole('heading', { name: /725 m ·/ })).toBeVisible()
  await page.getByRole('button', { name: /Add competitors/ }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).not.toBeVisible()
  await expect(
    page.getByRole('button', { name: /Add competitors/ }),
  ).toBeFocused()
  await page
    .getByRole('button', { name: 'Reset settings', exact: true })
    .click()
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Reset settings', exact: true })
    .click()
  await expect(page.getByLabel('Custom distance in metres')).toHaveValue('100')
})
test('all-DNF experiments and reduced motion stay usable', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  for (const name of [
    'Horse',
    'Hippopotamus',
    'European rabbit',
    'Hermann’s tortoise',
  ])
    await page
      .getByRole('button', { name: `Remove ${name}`, exact: true })
      .click()
  await page.getByTitle('Edit Cheetah').click()
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('Launch acceleration').fill('0')
  await dialog.getByRole('button', { name: 'Apply to lineup' }).click()
  await page.getByLabel('Playback speed').selectOption('10')
  await page.getByRole('button', { name: 'Play race', exact: true }).click()
  await expect(
    page.getByRole('heading', { name: 'The finishing order' }),
  ).toBeVisible({ timeout: 8000 })
  await expect(
    page.getByRole('cell', { name: 'DNF', exact: true }),
  ).toBeVisible()
  await expect(page.locator('.confetti')).toHaveCount(0)
  expect(
    await page
      .locator('.runner-emoji')
      .evaluate((el) => getComputedStyle(el).animationName),
  ).toBe('none')
})
test('core screens and modal pass automated accessibility checks', async ({
  page,
}) => {
  for (const name of [
    'Race day',
    'Animal lab',
    'Distance showdown',
    'Field notes',
  ]) {
    await navigate(page, name)
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      `${name} has no page overflow`,
    ).toBe(true)
    const result = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze()
    expect(
      result.violations.map((v) => ({
        id: v.id,
        targets: v.nodes.map((n) => n.target),
      })),
      name,
    ).toEqual([])
  }
  await navigate(page, 'Race day')
  await page.getByRole('button', { name: /Add competitors/ }).click()
  const result = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze()
  expect(
    result.violations.map((v) => ({
      id: v.id,
      targets: v.nodes.map((n) => n.target),
    })),
  ).toEqual([])
})
