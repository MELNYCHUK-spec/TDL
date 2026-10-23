import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Todo } from '../src/js/todo.js'

const fixture = () => {
  document.body.innerHTML = `
    <main data-js-todo>
      <form data-js-todo-new-task-form>
        <input data-js-todo-new-task-input />
      </form>
      <form data-js-todo-search-task-form>
        <input data-js-todo-search-task-input />
      </form>
      <span data-js-todo-total-tasks></span>
      <button data-js-todo-delete-all-button></button>
      <ul data-js-todo-list></ul>
      <p data-js-todo-empty-message></p>
    </main>
  `
  return new Todo()
}

describe('Todo', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    vi.useRealTimers()
    document.body.innerHTML = ''
  })

  it('renders an empty state when storage has no tasks', () => {
    const app = fixture()

    expect(app.state.items).toEqual([])
    expect(
      document.querySelector('[data-js-todo-total-tasks]').textContent
    ).toBe('0')
    expect(
      document.querySelector('[data-js-todo-empty-message]').textContent
    ).toBe('There are no tasks yet')
    expect(
      document.querySelector('[data-js-todo-delete-all-button]').classList
    ).not.toContain('is-visible')
  })

  it('loads and renders saved tasks with checked state', () => {
    localStorage.setItem(
      'todo-items',
      JSON.stringify([
        { id: 'one', title: 'Buy milk', isChecked: true },
        { id: 'two', title: 'Read', isChecked: false },
      ])
    )
    const app = fixture()

    expect(app.state.items).toHaveLength(2)
    expect(document.querySelectorAll('[data-js-todo-item]')).toHaveLength(2)
    expect(document.querySelector('#one').checked).toBe(true)
    expect(document.querySelector('#two').checked).toBe(false)
    expect(
      document.querySelector('[data-js-todo-total-tasks]').textContent
    ).toBe('2')
    expect(
      document.querySelector('[data-js-todo-delete-all-button]').classList
    ).toContain('is-visible')
    expect(
      document.querySelector('[data-js-todo-empty-message]').textContent
    ).toBe('')
  })

  it('recovers from invalid JSON and ignores non-array storage values', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    localStorage.setItem('todo-items', '{invalid')
    expect(fixture().state.items).toEqual([])
    expect(error).toHaveBeenCalledWith('parse error')

    localStorage.setItem('todo-items', JSON.stringify({ title: 'not a list' }))
    expect(fixture().state.items).toEqual([])
  })

  it('adds tasks, persists them, and clears the form after submit', () => {
    const app = fixture()
    const input = document.querySelector('[data-js-todo-new-task-input]')
    input.value = 'Write tests'
    const event = new Event('submit', { bubbles: true, cancelable: true })

    document.querySelector('[data-js-todo-new-task-form]').dispatchEvent(event)

    expect(event.defaultPrevented).toBe(true)
    expect(app.state.items[0]).toMatchObject({
      title: 'Write tests',
      isChecked: false,
    })
    expect(JSON.parse(localStorage.getItem('todo-items'))).toEqual(
      app.state.items
    )
    expect(input.value).toBe('')
    expect(document.activeElement).toBe(input)
  })

  it('does not add a blank task', () => {
    const app = fixture()
    const input = document.querySelector('[data-js-todo-new-task-input]')
    input.value = '   '
    const event = new Event('submit', { bubbles: true, cancelable: true })

    document.querySelector('[data-js-todo-new-task-form]').dispatchEvent(event)

    expect(event.defaultPrevented).toBe(true)
    expect(app.state.items).toEqual([])
    expect(input.value).toBe('   ')
  })

  it('uses the timestamp if randomUUID returns no id', () => {
    const app = fixture()
    vi.stubGlobal('crypto', { randomUUID: () => null })
    vi.spyOn(Date, 'now').mockReturnValue(12345)

    app.addItem('Fallback id')

    expect(app.state.items[0].id).toBe('12345')
  })

  it('filters tasks case-insensitively and shows the no-results message', () => {
    const app = fixture()
    app.state.items = [
      { id: 'one', title: 'Buy Milk', isChecked: false },
      { id: 'two', title: 'Read book', isChecked: false },
    ]
    app.render()
    const search = document.querySelector('[data-js-todo-search-task-input]')

    search.value = '  MILK  '
    search.dispatchEvent(new Event('input', { bubbles: true }))
    expect(document.querySelectorAll('[data-js-todo-item]')).toHaveLength(1)
    expect(
      document.querySelector('[data-js-todo-item-label]').textContent.trim()
    ).toBe('Buy Milk')
    expect(
      document.querySelector('[data-js-todo-empty-message]').textContent
    ).toBe('')

    search.value = 'missing'
    search.dispatchEvent(new Event('input', { bubbles: true }))
    expect(document.querySelectorAll('[data-js-todo-item]')).toHaveLength(0)
    expect(
      document.querySelector('[data-js-todo-empty-message]').textContent
    ).toBe('Tasks not found')
  })

  it('clears filtered results when the search is empty and prevents search submit', () => {
    const app = fixture()
    app.state.items = [
      { id: 'one', title: 'Buy Milk', isChecked: false },
      { id: 'two', title: 'Read book', isChecked: false },
    ]
    app.render()
    const input = document.querySelector('[data-js-todo-search-task-input]')
    input.value = 'milk'
    input.dispatchEvent(new Event('input', { bubbles: true }))
    input.value = ''
    input.dispatchEvent(new Event('input', { bubbles: true }))

    expect(document.querySelectorAll('[data-js-todo-item]')).toHaveLength(2)
    expect(
      document.querySelector('[data-js-todo-empty-message]').textContent
    ).toBe('')

    const submit = new Event('submit', { bubbles: true, cancelable: true })
    document
      .querySelector('[data-js-todo-search-task-form]')
      .dispatchEvent(submit)
    expect(submit.defaultPrevented).toBe(true)
  })

  it('toggles a task checkbox and ignores changes to other controls', () => {
    const app = fixture()
    app.state.items = [
      { id: 'one', title: 'Check this', isChecked: false },
      { id: 'two', title: 'Leave unchanged', isChecked: false },
    ]
    app.render()
    const checkbox = document.querySelector('#one')
    checkbox.checked = true
    checkbox.dispatchEvent(new Event('change', { bubbles: true }))

    expect(app.state.items[0].isChecked).toBe(true)
    expect(app.state.items[1].isChecked).toBe(false)
    expect(JSON.parse(localStorage.getItem('todo-items'))[0].isChecked).toBe(
      true
    )

    app.onChange({
      target: document.querySelector('[data-js-todo-new-task-input]'),
    })
    expect(app.state.items[0].isChecked).toBe(true)
  })

  it('deletes a task after its disappearing animation and ignores other clicks', () => {
    vi.useFakeTimers()
    const app = fixture()
    app.addItem('Remove this')
    const item = document.querySelector('[data-js-todo-item]')
    const deleteButton = item.querySelector('[data-js-todo-item-delete-button]')

    app.onClick({
      target: document.querySelector('[data-js-todo-new-task-input]'),
    })
    expect(app.state.items).toHaveLength(1)

    deleteButton.click()
    expect(item.classList).toContain('is-disappearing')
    expect(app.state.items).toHaveLength(1)
    vi.advanceTimersByTime(400)

    expect(app.state.items).toEqual([])
    expect(localStorage.getItem('todo-items')).toBe('[]')
  })

  it('deletes all tasks only after confirmation', () => {
    const app = fixture()
    app.state.items = [
      { id: 'one', title: 'First', isChecked: false },
      { id: 'two', title: 'Second', isChecked: false },
    ]
    app.render()
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    document.querySelector('[data-js-todo-delete-all-button]').click()
    expect(app.state.items).toHaveLength(2)

    window.confirm.mockReturnValue(true)
    document.querySelector('[data-js-todo-delete-all-button]').click()
    expect(app.state.items).toEqual([])
    expect(localStorage.getItem('todo-items')).toBe('[]')
    expect(
      document.querySelector('[data-js-todo-empty-message]').textContent
    ).toBe('There are no tasks yet')
  })
})
