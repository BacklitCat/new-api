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

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Window } from 'happy-dom'

const domWindow = new Window()
for (const key of [
  'window',
  'document',
  'navigator',
  'localStorage',
  'HTMLElement',
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
  resources: { en: { translation: {} } },
})
const { useTopNavLinks } = await import('../use-top-nav-links')
const { useAuthStore } = await import('@/stores/auth-store')

const reactTestGlobals = globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT?: boolean
}
reactTestGlobals.IS_REACT_ACT_ENVIRONMENT = true

function NavigationProbe() {
  return <pre>{JSON.stringify(useTopNavLinks())}</pre>
}

describe('top navigation links', () => {
  after(() => domWindow.close())

  test('places image generation after model square and requires authentication', async () => {
    const queryClient = new QueryClient()
    queryClient.setQueryData(['status'], {
      HeaderNavModules: JSON.stringify({
        pricing: { enabled: true, requireAuth: false },
      }),
    })
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)

    await act(async () => {
      root.render(
        <QueryClientProvider client={queryClient}>
          <NavigationProbe />
        </QueryClientProvider>
      )
    })

    const signedOutLinks = JSON.parse(container.textContent ?? '[]') as Array<{
      title: string
      href: string
      requiresAuth?: boolean
    }>
    const modelSquareIndex = signedOutLinks.findIndex(
      (link) => link.href === '/pricing'
    )
    assert.equal(
      signedOutLinks[modelSquareIndex + 1]?.href,
      '/image-generation'
    )
    assert.equal(signedOutLinks[modelSquareIndex + 1]?.requiresAuth, true)

    await act(async () => {
      useAuthStore.getState().auth.setUser({
        id: 1,
        username: 'signed-in-user',
        role: 1,
      })
    })

    const signedInLinks = JSON.parse(container.textContent ?? '[]') as Array<{
      href: string
      requiresAuth?: boolean
    }>
    const imageGeneration = signedInLinks.find(
      (link) => link.href === '/image-generation'
    )
    assert.equal(imageGeneration?.requiresAuth, false)

    await act(async () => root.unmount())
    useAuthStore.getState().auth.reset()
    queryClient.clear()
    container.remove()
  })
})
