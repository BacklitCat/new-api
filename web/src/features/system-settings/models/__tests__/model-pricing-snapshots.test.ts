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
import { describe, test } from 'node:test'

import { buildModelSnapshots } from '../model-pricing-snapshots'

const buildSnapshots = (modelPrice: string, modelRatio: string) =>
  buildModelSnapshots({
    modelPrice,
    modelRatio,
    cacheRatio: '{}',
    createCacheRatio: '{}',
    completionRatio: '{}',
    imageRatio: '{}',
    audioRatio: '{}',
    audioCompletionRatio: '{}',
    billingMode: '{}',
    billingExpr: '{}',
  })

describe('buildModelSnapshots', () => {
  test('keeps fixed-price models per-request and ratio-only models per-token', () => {
    const snapshots = buildSnapshots(
      '{"fixed-image":0.08}',
      '{"token-model":1.5}'
    )

    assert.equal(
      snapshots.find((item) => item.name === 'fixed-image')?.billingMode,
      'per-request'
    )
    assert.equal(
      snapshots.find((item) => item.name === 'token-model')?.billingMode,
      'per-token'
    )
  })

  test('reports conflicting fixed-price and token-ratio configuration', () => {
    const [snapshot] = buildSnapshots('{"conflicted":0.08}', '{"conflicted":1}')

    assert.equal(snapshot.billingMode, 'per-request')
    assert.equal(snapshot.hasConflict, true)
  })
})
