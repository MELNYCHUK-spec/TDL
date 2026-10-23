import { beforeEach, describe, expect, it } from 'vitest'
import { startAnimation } from '../src/js/startAnimation.js'

describe('startAnimation', () => {
  beforeEach(() => {
    document.body.innerHTML = '<main data-js-todo></main>'
  })

  it('starts the intro animation and switches to wobble after animationend', () => {
    const root = document.querySelector('[data-js-todo]')

    startAnimation()
    expect(root.classList).toContain('introMove')
    expect(root.classList).not.toContain('wobble')

    root.dispatchEvent(new Event('animationend'))
    expect(root.classList).not.toContain('introMove')
    expect(root.classList).toContain('wobble')

    root.classList.remove('wobble')
    root.dispatchEvent(new Event('animationend'))
    expect(root.classList).not.toContain('wobble')
  })
})
