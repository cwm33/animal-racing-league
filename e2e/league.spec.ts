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
      .locator('.race-sprite .animal-sprite-motion')
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

test('the complete roster loads real responsive illustrations without emoji fallbacks', async ({
  page,
}) => {
  await page.getByRole('button', { name: /Add competitors/ }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog.locator('.animal-sprite img')).toHaveCount(36)
  const images = await dialog
    .locator('.animal-sprite img')
    .evaluateAll(async (elements) => {
      return Promise.all(
        elements.map(async (element) => {
          const image = element as HTMLImageElement
          image.loading = 'eager'
          try {
            await image.decode()
          } catch {
            /* Return a useful assertion below. */
          }
          return {
            loaded: image.naturalWidth > 0,
            source: image.currentSrc,
            width: image.naturalWidth,
          }
        }),
      )
    })
  expect(
    images.every(
      (image) =>
        image.loaded &&
        image.source.includes('/animal-racing-league/animals/') &&
        image.source.endsWith('.webp'),
    ),
  ).toBe(true)
  await expect(dialog.locator('[data-fallback]')).toHaveCount(0)
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true)
})

test('a failed illustration uses its emoji fallback inside the same reserved frame', async ({
  page,
}) => {
  await page.route('**/animals/cheetah-*.webp', (route) => route.abort())
  await page.reload()
  const cheetah = page.locator('.race-sprite[data-animal="cheetah"]')
  await expect(cheetah).toHaveAttribute('data-fallback', 'true')
  await expect(cheetah.locator('.animal-sprite-fallback')).toHaveText('🐆')
  const bounds = await cheetah.boundingBox()
  expect(bounds?.width).toBe(64)
  expect(bounds?.height).toBe(64)
  await expect(
    page.getByRole('button', { name: 'Play race', exact: true }),
  ).toBeEnabled()
})

test('gait animations follow moving species and stop on pause', async ({
  page,
}) => {
  await page.getByRole('button', { name: 'Play race', exact: true }).click()
  const cat = page.locator(
    '.race-sprite[data-animal="cheetah"] .animal-sprite-motion',
  )
  await expect
    .poll(() =>
      cat.evaluate((element) => getComputedStyle(element).animationName),
    )
    .toBe('sprite-run')
  const rabbit = page.locator(
    '.race-sprite[data-animal="rabbit"] .animal-sprite-motion',
  )
  await expect
    .poll(() =>
      rabbit.evaluate((element) => getComputedStyle(element).animationName),
    )
    .toBe('sprite-bound')
  const tortoise = page.locator(
    '.race-sprite[data-animal="tortoise"] .animal-sprite-motion',
  )
  await expect
    .poll(() =>
      tortoise.evaluate((element) => getComputedStyle(element).animationName),
    )
    .toBe('sprite-crawl')
  await page.getByRole('button', { name: 'Pause race', exact: true }).click()
  expect(
    await cat.evaluate((element) => getComputedStyle(element).animationName),
  ).toBe('none')
  await page.getByLabel('Choose a preset lineup').selectOption('chaos')
  await page.getByRole('button', { name: 'Play race', exact: true }).click()
  const penguin = page.locator(
    '.race-sprite[data-animal="penguin"] .animal-sprite-motion',
  )
  const seal = page.locator(
    '.race-sprite[data-animal="seal"] .animal-sprite-motion',
  )
  await expect
    .poll(() =>
      penguin.evaluate((element) => getComputedStyle(element).animationName),
    )
    .toBe('sprite-waddle')
  await expect
    .poll(() =>
      seal.evaluate((element) => getComputedStyle(element).animationName),
    )
    .toBe('sprite-undulate')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect
    .poll(() =>
      seal.evaluate((element) => getComputedStyle(element).animationName),
    )
    .toBe('none')
  await expect(page.locator('.race-sprite[data-animal="seal"]')).toHaveClass(
    /is-moving/,
  )
  await expect(
    page.getByRole('button', { name: 'Pause race', exact: true }),
  ).toBeVisible()
})

test('biological and pace filters assemble a matched crowd while mixed races remain available', async ({
  page,
}) => {
  await page.getByRole('button', { name: /Add competitors/ }).click()
  const dialog = page.getByRole('dialog')
  const group = dialog.getByLabel('Biological group', { exact: true })
  await group.selectOption('big-cats')
  await expect(dialog.locator('.roster-card')).toHaveCount(3)
  await expect(dialog.locator('.roster-card').first()).toContainText('Cheetah')
  await group.selectOption('amphibians')
  await expect(dialog.locator('.roster-card')).toHaveCount(0)
  await expect(dialog.getByText(/No competitors match/)).toBeVisible()
  await dialog.getByRole('button', { name: 'Clear filters' }).click()
  await dialog.getByRole('searchbox').fill('Canidae')
  await expect(dialog.locator('.roster-card')).toHaveCount(3)
  await dialog.getByRole('searchbox').fill('')
  await dialog.getByLabel('Roster race distance').selectOption('250')
  await dialog
    .getByLabel('Competitive division', { exact: true })
    .selectOption('elite')
  const count = Math.min(6, await dialog.locator('.roster-card').count())
  await dialog.locator('.matching-tools > summary').click()
  await dialog
    .getByRole('button', { name: `Race matched ${count}`, exact: true })
    .click()
  await expect(dialog).not.toBeVisible()
  await expect(page.locator('.lineup-row')).toHaveCount(count)
  for (const row of await page.locator('.lineup-row').all())
    await expect(row).toContainText('Elite pace')
  await expect(page.getByLabel('Custom distance in metres')).toHaveValue('250')
  await page.getByRole('button', { name: /Add competitors/ }).click()
  await dialog.getByRole('searchbox').fill('snail')
  await dialog.locator('.roster-card').click()
  await dialog.getByRole('button', { name: /Meet me at the start/ }).click()
  await expect(page.getByTitle('Edit Garden snail')).toBeVisible()
  await expect(page.locator('.lineup-row')).toHaveCount(count + 1)
  await expect(page.getByTitle('Edit Garden snail')).toContainText(
    'Geological time',
  )
  await page.reload()
  await expect(page.locator('.lineup-row')).toHaveCount(count + 1)
})

test('divisions update across distances and edited racing parameters without changing species identity', async ({
  page,
}) => {
  await page.getByRole('button', { name: /Add competitors/ }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByRole('searchbox').fill('cheetah')
  const card = dialog.locator('.roster-card')
  await dialog.getByLabel('Roster race distance').selectOption('25')
  await expect(card).toContainText('Elite pace')
  await dialog.getByLabel('Roster race distance').selectOption('10000')
  await expect(card).toContainText('Club racers')
  await dialog.getByRole('button', { name: 'Close animal roster' }).click()
  await page.getByTitle('Edit Cheetah').click()
  await dialog.getByLabel('Competitor name').fill('Turbo Bird')
  await dialog.getByLabel('Launch acceleration').fill('0')
  await dialog.getByRole('button', { name: 'Apply to lineup' }).click()
  await page.getByRole('button', { name: /Add competitors/ }).click()
  await dialog.getByRole('searchbox').fill('cheetah')
  await dialog
    .getByLabel('Biological group', { exact: true })
    .selectOption('big-cats')
  await expect(card).toContainText('Turbo Bird')
  await expect(card).toContainText('No predicted finish · DNF')
  await dialog
    .getByLabel('Competitive division', { exact: true })
    .selectOption('dnf')
  await expect(card).toHaveCount(1)
  await dialog.locator('.matching-tools > summary').click()
  await expect(
    dialog.getByRole('button', { name: 'Race matched crowd' }),
  ).toBeDisabled()
})

test('legacy saved stable configurations paginate, filter and load with their original statistics', async ({
  page,
}) => {
  await page.evaluate(() => {
    const settings = JSON.parse(localStorage.getItem('arl:settings:v1')!)
    const hippo = settings.entrants.find(
      (a: { id: string }) => a.id === 'hippo',
    )
    localStorage.setItem(
      'arl:library:v1',
      JSON.stringify(
        Array.from({ length: 100 }, (_, i) => ({
          id: `legacy-${i}`,
          savedAt: '2026-01-01',
          animal: {
            ...hippo,
            custom: true,
            name: `Stable hippo ${i}`,
            stats: { ...hippo.stats, delay: i },
          },
        })),
      ),
    )
  })
  await page.reload()
  await page.getByRole('button', { name: /Add competitors/ }).click()
  const dialog = page.getByRole('dialog')
  await dialog
    .getByRole('button', { name: 'Saved stable (100)', exact: true })
    .click()
  await expect(dialog.locator('.roster-card')).toHaveCount(36)
  await expect(dialog.locator('.animal-sprite img')).toHaveCount(36)
  await dialog.getByRole('button', { name: 'Next page' }).click()
  await expect(dialog.getByText('Page 2 of 3')).toBeVisible()
  await dialog.getByRole('searchbox').fill('Stable hippo 99')
  await expect(dialog.locator('.roster-card')).toHaveCount(1)
  await expect(
    dialog.getByRole('navigation', { name: 'Roster pages' }),
  ).not.toBeVisible()
  await dialog.locator('.roster-card').click()
  await dialog.getByRole('button', { name: /Meet me at the start/ }).click()
  await expect(
    page.getByRole('button', { name: 'Unrestricted nonsense' }),
  ).toBeVisible()
  await page.getByTitle('Edit Stable hippo 99').click()
  await expect(dialog.getByLabel('Launch delay')).toHaveValue('99')
  await dialog.getByRole('button', { name: 'Close animal editor' }).click()
  await page.reload()
  await expect(page.getByTitle('Edit Stable hippo 99')).toBeVisible()
})
