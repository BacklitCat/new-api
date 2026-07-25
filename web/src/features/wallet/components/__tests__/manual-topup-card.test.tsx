/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
import assert from 'node:assert/strict'
import { after, describe, test } from 'node:test'

import { Window } from 'happy-dom'

const domWindow = new Window()
for (const key of [
  'window',
  'document',
  'navigator',
  'HTMLElement',
  'SVGElement',
  'Node',
  'Element',
  'Event',
] as const) {
  Object.defineProperty(globalThis, key, {
    configurable: true,
    value: domWindow[key],
  })
}

const { act } = await import('react')
const { createRoot } = await import('react-dom/client')
const i18next = (await import('i18next')).default
const { initReactI18next } = await import('react-i18next')
await i18next.use(initReactI18next).init({
  lng: 'en',
  resources: {
    en: {
      translation: {
        'Xianyu Trading': 'Xianyu Trading',
        'Online topup is not enabled. Please trade on Xianyu or use a redemption code below.':
          'Online topup is not enabled. Please trade on Xianyu or use a redemption code below.',
        'Xianyu QR code': 'Xianyu QR code',
        'Please scan with Xianyu': 'Please scan with Xianyu',
        'WeChat support QR code': 'WeChat support QR code',
        WeChat: 'WeChat',
        'Technical Support': 'Technical Support',
      },
    },
  },
})
const { ManualTopupCard } = await import('../manual-topup-card')

const reactTestGlobals = globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT?: boolean
}
reactTestGlobals.IS_REACT_ACT_ENVIRONMENT = true

describe('ManualTopupCard', () => {
  after(() => domWindow.close())

  test('shows Xianyu and WeChat support QR codes without exposing an API key', async () => {
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)

    await act(async () => {
      root.render(
        <ManualTopupCard xianyuLink='https://2.taobao.com/item.htm?id=123' />
      )
    })

    assert.match(container.textContent ?? '', /Xianyu Trading/)
    assert.ok(
      container.querySelector('title')?.textContent === 'Xianyu QR code'
    )
    const supportImage = container.querySelector<HTMLImageElement>(
      'img[alt="WeChat support QR code"]'
    )
    assert.ok(supportImage)
    assert.equal(supportImage.getAttribute('src'), '/wechat.png')
    assert.equal(container.textContent?.includes('sk-'), false)

    await act(async () => root.unmount())
    container.remove()
  })
})
