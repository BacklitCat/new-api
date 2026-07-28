import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

import { parsePlainHomeHero } from '../components/sections/custom-home-content-parser.ts'

describe('parsePlainHomeHero', () => {
  test('returns up to three non-empty plain-text lines', () => {
    assert.deepEqual(
      parsePlainHomeHero('Gateway\nFast and reliable\nFor internal use'),
      ['Gateway', 'Fast and reliable', 'For internal use']
    )
  })

  test('uses a single leading Markdown heading as the hero title', () => {
    assert.deepEqual(parsePlainHomeHero('# Gateway\nDetails'), [
      'Gateway',
      'Details',
    ])
  })

  test('leaves rich Markdown content to the standard renderer', () => {
    assert.equal(parsePlainHomeHero('# Gateway\n- First route'), null)
  })

  test('leaves content longer than three lines to the standard renderer', () => {
    assert.equal(parsePlainHomeHero('One\nTwo\nThree\nFour'), null)
  })
})
