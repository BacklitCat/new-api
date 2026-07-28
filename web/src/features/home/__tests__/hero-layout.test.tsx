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
import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router'
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
        'AI,': 'AI,',
        'Connect the models you need through one clean, compatible API. Less setup, less switching, more creating.':
          'Connect the models you need through one clean, compatible API. Less setup, less switching, more creating.',
        'Get Started': 'Get Started',
        'Simple and easy': 'Simple and easy',
        'Unified AI access': 'Unified AI access',
        'made simple.': 'made simple.',
      },
    },
  },
})
const { Hero } = await import('../components/sections/hero')

const reactTestGlobals = globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT?: boolean
}
reactTestGlobals.IS_REACT_ACT_ENVIRONMENT = true

describe('home hero layout', () => {
  after(() => domWindow.close())

  test('keeps the bilingual blueprint decorative and exposes one accessible description', async () => {
    const rootRoute = createRootRoute()
    const homeRoute = createRoute({
      getParentRoute: () => rootRoute,
      path: '/',
      component: () => <Hero />,
    })
    const signUpRoute = createRoute({
      getParentRoute: () => rootRoute,
      path: '/sign-up',
      component: () => null,
    })
    const router = createRouter({
      routeTree: rootRoute.addChildren([homeRoute, signUpRoute]),
      history: createMemoryHistory({ initialEntries: ['/'] }),
    })
    const queryClient = new QueryClient()
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)

    await router.load()
    await act(async () => {
      root.render(
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
        </QueryClientProvider>
      )
    })

    const heading = container.querySelector('h1')
    const artwork = container.querySelector('[role="img"]')
    const startLink =
      container.querySelector<HTMLAnchorElement>('a[href="/sign-up"]')

    assert.deepEqual(
      [...(heading?.children ?? [])].map((line) => line.textContent),
      ['AI,', 'made simple.']
    )
    assert.equal(artwork?.getAttribute('aria-label'), 'Simple and easy')
    assert.match(artwork?.textContent ?? '', /简单/)
    assert.match(artwork?.textContent ?? '', /easy/)
    assert.equal(startLink?.textContent?.trim(), 'Get Started')
    assert.equal(container.textContent?.includes('Docs'), false)
    assert.equal(container.textContent?.includes('GPT'), false)
    assert.equal(container.textContent?.includes('Claude'), false)
    assert.equal(container.textContent?.includes('Gemini'), false)
    assert.equal(container.textContent?.includes('Qwen'), false)

    await act(async () => root.unmount())
    queryClient.clear()
    container.remove()
  })
})
