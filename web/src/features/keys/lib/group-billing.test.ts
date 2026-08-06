import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

import { getGroupPerRequestPrices } from './group-billing'

describe('group per-request billing display', () => {
  test('applies the effective group ratio and removes duplicate prices', () => {
    assert.deepEqual(
      getGroupPerRequestPrices({
        desc: 'Pro',
        ratio: 1.5,
        per_request_prices: {
          'image-2': 0.2,
          'image-2-edit': 0.2,
          'image-3': 0.4,
        },
      }),
      [0.3, 0.6]
    )
  })

  test('keeps legacy ratio display when no per-request prices are returned', () => {
    assert.deepEqual(
      getGroupPerRequestPrices({ desc: 'Default', ratio: 1 }),
      []
    )
  })
})
