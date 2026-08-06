/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

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

import type { PricingModel } from '../../types'
import { getEffectiveBilling, isTokenBasedModel } from '../model-helpers'

function makeModel(overrides: Partial<PricingModel> = {}): PricingModel {
  return {
    id: 1,
    model_name: 'image-2',
    quota_type: 0,
    model_ratio: 10,
    completion_ratio: 1,
    enable_groups: ['per-token', 'per-request'],
    ...overrides,
  }
}

describe('group-specific pricing helpers', () => {
  test('uses an override for the selected group and legacy pricing otherwise', () => {
    const model = makeModel({
      group_pricing: {
        'per-request': { quota_type: 1, model_price: 0.2 },
        'per-token': { quota_type: 0 },
      },
      quota_types: [0, 1],
    })

    assert.equal(getEffectiveBilling(model, 'per-request').quotaType, 1)
    assert.equal(getEffectiveBilling(model, 'per-request').modelPrice, 0.2)
    assert.equal(isTokenBasedModel(model, 'per-request'), false)
    assert.equal(isTokenBasedModel(model, 'per-token'), true)
    assert.equal(getEffectiveBilling(model, 'unknown').quotaType, 0)
  })
})
