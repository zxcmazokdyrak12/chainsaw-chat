import { test, expect } from '@playwright/test'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { newGuest, uniq, input, bubble, say } from './helpers'

const here = path.dirname(fileURLToPath(import.meta.url))

test('two people in the lobby: message, reply, reaction, picture, edit', async ({ browser }) => {
  const nA = uniq('DEN'), nB = uniq('POW')
  const a = await newGuest(browser, nA)
  const b = await newGuest(browser, nB)

  // a line goes across
  const hello = `hello from ${nA}`
  await say(a, hello)
  await expect(bubble(b, hello)).toBeVisible()

  // B replies with a quote
  await bubble(b, hello).click({ button: 'right' })
  await b.getByRole('menuitem', { name: /REPLY/ }).click()
  await say(b, 'right back at you')
  await expect(a.locator('button[title="Jump to the quoted line"]', { hasText: hello })).toBeVisible()

  // A puts a sticker on B's line, B sees it
  await bubble(a, 'right back at you').click({ button: 'right' })
  await a.getByRole('menuitem', { name: 'React: Like' }).click()
  await expect(b.locator('[id^="msg-"]').filter({ hasText: 'right back at you' }).locator('button[title^="Like:"]')).toBeVisible()

  // a picture: uploaded, sent, and actually loads on the other side
  await a.locator('input[type=file]').setInputFiles(path.join(here, '..', 'fixtures', 'panel.png'))
  const pic = b.locator('img[alt="picture"]').last()
  await expect(pic).toBeVisible()
  await expect.poll(() => pic.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true)

  // A edits the hello (Ctrl+↑ = your last text line)
  await input(a).click()
  await a.keyboard.press('Control+ArrowUp')
  await expect(input(a)).toHaveValue(hello)
  await input(a).fill(`${hello} (edited)`)
  await input(a).press('Enter')
  await expect(bubble(b, `${hello} (edited)`)).toBeVisible()
})

test('a private room: create, share the code, join, talk', async ({ browser }) => {
  const nA = uniq('AKI'), nB = uniq('KOB')
  const a = await newGuest(browser, nA)
  const b = await newGuest(browser, nB)

  await a.getByText('ROOMS', { exact: true }).click()
  await a.getByText('NEW CHAPTER', { exact: true }).click()
  await a.getByPlaceholder('CHAPTER TITLE (OPTIONAL)').fill('E2E SQUAD')
  await a.getByRole('button', { name: /CREATE/ }).click()
  const code = (await a.getByTestId('created-code').textContent())?.trim() ?? ''
  expect(code).toMatch(/^[A-Z]{6}\d{4}$/)

  await b.getByText('ROOMS', { exact: true }).click()
  await b.getByText('ENTER BY CODE', { exact: true }).click()
  await b.getByPlaceholder('KAIRYU4821').fill(code)
  await b.getByRole('button', { name: 'ENTER', exact: true }).click()
  await expect(input(b)).toBeVisible()

  await a.getByText('CHATS', { exact: true }).click()
  const line = `only for the squad ${nA}`
  await say(a, line)
  await expect(bubble(b, line)).toBeVisible()
})
