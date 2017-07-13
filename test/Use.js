import test from 'ava'
import Use from '../src/Use'

const useParentRuleMock = {use: () => new Use(this), rule: () => 'new rule'}

test('is Chainable', t => {
  const use = new Use(useParentRuleMock)

  t.is(use.end(), useParentRuleMock)
})

test.skip('shorthand methods', t => {
  const use = new Use(useParentRuleMock)
  const obj = {}

  use.shorthands.map(method => {
    obj[method] = 'alpha'
    t.is(use[method]('alpha'), use)
  })

  t.deepEqual(use.entries(), obj)
})

test('tap', t => {
  const use = new Use(useParentRuleMock)

  use.loader('babel-loader').options({presets: ['alpha']})

  use.tap(options => {
    t.deepEqual(options, {presets: ['alpha']})
    return {presets: ['beta']}
  })

  t.deepEqual(use.store.get('options'), {presets: ['beta']})
})
