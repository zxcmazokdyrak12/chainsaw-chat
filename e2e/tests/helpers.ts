import { expect, type Browser, type Page } from '@playwright/test'

export const uniq = (p: string) => `${p}${Math.random().toString(36).slice(2, 7).toUpperCase()}`.slice(0, 14)

// a fresh browser profile that already saw the cold open and the tour, in English
export async function newGuest(browser: Browser, nick: string): Promise<Page> {
  const context = await browser.newContext()
  await context.addInitScript(() => {
    localStorage.setItem('chainsaw_intro_seen', '1')
    localStorage.setItem('chainsaw_tutorial_done', '1')
    localStorage.setItem('chainsaw_lang', 'en')
  })
  const page = await context.newPage()
  await page.goto('/')
  await page.getByText('JUST START ›').click()
  const name = page.getByLabel('Nickname')
  await expect(name).toBeVisible()
  await name.fill(nick)
  await page.getByRole('button', { name: 'SIGN IN BLOOD' }).click()
  await expect(input(page)).toBeVisible({ timeout: 25_000 })
  return page
}

export const input = (page: Page) => page.locator('textarea[data-tour="input"]')
export const bubble = (page: Page, text: string) => page.locator('[data-tour="bubble"]', { hasText: text })

export async function say(page: Page, text: string) {
  await input(page).fill(text)
  await input(page).press('Enter')
}
