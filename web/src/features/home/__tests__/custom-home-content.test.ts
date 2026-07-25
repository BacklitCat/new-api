import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

import { parsePlainHomeHero } from '../components/sections/custom-home-content-parser'

describe('parsePlainHomeHero', () => {
  test('returns up to three non-empty plain-text lines', () => {
    assert.deepEqual(
      parsePlainHomeHero('Gateway\nFast and reliable\nFor internal use'),
      ['Gateway', 'Fast and reliable', 'For internal use']
    )
  })

  test('leaves Markdown content to the standard rich-content renderer', () => {
    assert.equal(parsePlainHomeHero('# Gateway\nDetails'), null)
  })

  test('leaves content longer than three lines to the standard renderer', () => {
    assert.equal(parsePlainHomeHero('One\nTwo\nThree\nFour'), null)
  })
})
