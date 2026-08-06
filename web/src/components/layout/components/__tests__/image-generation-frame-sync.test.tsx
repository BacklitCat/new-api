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

const domWindow = new Window({ url: 'https://new-api.example.com' })
for (const key of [
  'window',
  'document',
  'navigator',
  'localStorage',
  'HTMLElement',
  'HTMLIFrameElement',
  'Node',
  'Element',
  'Event',
  'MessageEvent',
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
        'Image Generation': 'Image Generation',
      },
    },
  },
})
const { useAuthStore } = await import('@/stores/auth-store')
const { PersistentImageGenerationFrame } =
  await import('../persistent-image-generation-frame')

const reactTestGlobals = globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT?: boolean
}
reactTestGlobals.IS_REACT_ACT_ENVIRONMENT = true

describe('persistent image generation frame synchronization', () => {
  after(() => domWindow.close())

  test('resends hosted context when the persistent frame becomes active again', async () => {
    useAuthStore.getState().auth.setBundle({
      access_token: 'dashboard-token',
      token_type: 'Bearer',
      access_expires_at: Math.floor(Date.now() / 1000) + 3600,
      user: { id: 1, username: 'tester', role: 1 },
      session: {
        sid: 'session-id',
        current: true,
        login_method: 'password',
        ip: '127.0.0.1',
        user_agent: 'test',
        created_at: 1,
        last_active_at: 1,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
      },
    })
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)

    await act(async () => {
      root.render(<PersistentImageGenerationFrame active />)
    })

    const iframe = container.querySelector('iframe')
    assert.ok(iframe?.contentWindow)
    const messages: unknown[] = []
    iframe.contentWindow.postMessage = (message: unknown) => {
      messages.push(message)
    }

    await act(async () => {
      root.render(<PersistentImageGenerationFrame active={false} />)
    })
    assert.equal(messages.length, 0)

    await act(async () => {
      root.render(<PersistentImageGenerationFrame active />)
    })

    assert.deepEqual(messages, [
      {
        type: 'new-api:image-playground-context',
        accessToken: 'dashboard-token',
        theme: 'light',
      },
    ])

    await act(async () => root.unmount())
    useAuthStore.getState().auth.reset()
    container.remove()
  })

  test('hides the unloaded iframe behind a themed loading placeholder', async () => {
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)

    await act(async () => {
      root.render(<PersistentImageGenerationFrame active />)
    })

    const iframe = container.querySelector('iframe')
    assert.ok(iframe)
    assert.match(iframe.className, /opacity-0/)
    assert.ok(container.querySelector('.animate-spin'))

    await act(async () => {
      iframe.dispatchEvent(new domWindow.Event('load') as unknown as Event)
    })

    assert.match(iframe.className, /opacity-100/)
    assert.equal(container.querySelector('.animate-spin'), null)

    await act(async () => root.unmount())
    container.remove()
  })
})
