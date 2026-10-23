export class Todo {
  selectors = {
    root: '[data-js-todo]',
    newTaskForm: '[data-js-todo-new-task-form]',
    newTaskInput: '[data-js-todo-new-task-input]',
    searchTaskForm: '[data-js-todo-search-task-form]',
    searchTaskInput: '[data-js-todo-search-task-input]',
    totalTasks: '[data-js-todo-total-tasks]',
    deleteAllButton: '[data-js-todo-delete-all-button]',
    list: '[data-js-todo-list]',
    item: '[data-js-todo-item]',
    itemCheckbox: '[data-js-todo-item-checkbox]',
    itemLabel: '[data-js-todo-item-label]',
    itemDeleteButton: '[data-js-todo-item-delete-button]',
    emptyMessage: '[data-js-todo-empty-message]',
  }

  stateClasses = {
    isVisible: 'is-visible',
    isDisappearing: 'is-disappearing',
  }

  localStorageKey = 'todo-items'

  constructor() {
    this.rootElement = document.querySelector(this.selectors.root)
    this.newTaskFormElement = this.rootElement.querySelector(
      this.selectors.newTaskForm
    )
    this.newTaskInputElement = this.rootElement.querySelector(
      this.selectors.newTaskInput
    )
    this.searchTaskFormElement = this.rootElement.querySelector(
      this.selectors.searchTaskForm
    )
    this.searchTaskInputElement = this.rootElement.querySelector(
      this.selectors.searchTaskInput
    )
    this.totalTasksElement = this.rootElement.querySelector(
      this.selectors.totalTasks
    )
    this.deleteAllButtonElement = this.rootElement.querySelector(
      this.selectors.deleteAllButton
    )
    this.listElement = this.rootElement.querySelector(this.selectors.list)
    this.emptyMessageElement = this.rootElement.querySelector(
      this.selectors.emptyMessage
    )

    this.state = {
      items: this.getItemsFromLocalStorage(),
    }

    this.render()
    this.bindEvents()
  }

  getItemsFromLocalStorage() {
    const rawData = localStorage.getItem(this.localStorageKey)
    if (!rawData) return []
    try {
      const parsedData = JSON.parse(rawData)
      return Array.isArray(parsedData) ? parsedData : []
    } catch {
      console.error('parse error')
      return []
    }
  }

  saveItemsToLocalStorage() {
    localStorage.setItem(this.localStorageKey, JSON.stringify(this.state.items))
  }

  saveAndRender() {
    this.saveItemsToLocalStorage()
    this.render()
  }

  render() {
    this.totalTasksElement.textContent = this.state.items.length

    this.deleteAllButtonElement.classList.toggle(
      this.stateClasses.isVisible,
      this.state.items.length > 0
    )

    this.renderItems(this.state.items)

    this.emptyMessageElement.textContent =
      this.state.items.length === 0 ? 'There are no tasks yet' : ''
  }

  renderItems(items) {
    this.listElement.innerHTML = items
      .map(({ id, title, isChecked }) => `
      <li class="todo__item todo-item" data-js-todo-item>
        <input
          class="todo-item__checkbox"
          id="${id}"
          type="checkbox"
          ${isChecked ? 'checked' : ''}
          data-js-todo-item-checkbox
        />
        <label
          class="todo-item__label"
          for="${id}"
          data-js-todo-item-label
        >
          ${title}
        </label>
        <button
          class="todo-item__delete-button"
          data-js-todo-item-delete-button
          aria-label="Delete"
          title="Delete"
        >
          <svg width="20" height="20" viewBox="0 0 20 20">
            <path d="M15 5L5 15M5 5L15 15" stroke="#757575" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </li>
    `).join('')
  }

  renderSearchResults(query) {
    const matchingItems = this.state.items.filter((item) =>
      item.title.toLowerCase().includes(query)
    )

    this.renderItems(matchingItems)
  }

  addItem(title) {
    this.state.items.push({
      id: crypto?.randomUUID() ?? Date.now().toString(),
      title,
      isChecked: false,
    })
    this.saveAndRender()
  }

  deleteItem(id) {
    this.state.items = this.state.items.filter((item) => item.id !== id)
    this.saveAndRender()
  }

  toggleCheckedState(id) {
    this.state.items = this.state.items.map((item) =>
      item.id === id ? { ...item, isChecked: !item.isChecked } : item
    )
    this.saveAndRender()
  }

  onSearchTaskInputChange = ({ target }) => {
    const query = target.value.trim().toLowerCase()
    this.renderSearchResults(query)

    this.emptyMessageElement.textContent =
      query && this.listElement.children.length === 0 ? 'Tasks not found' : ''
  }

  onNewTaskFormSubmit = (event) => {
    event.preventDefault()
    const newTodoItemTitle = this.newTaskInputElement.value
    if (newTodoItemTitle.trim().length > 0) {
      this.addItem(newTodoItemTitle)
      this.newTaskInputElement.value = ''
      this.newTaskInputElement.focus()
    }
  }

  onSearchTaskFormSubmit = (event) => {
    event.preventDefault()
  }

  onDeleteAllButtonClick = () => {
    const isConfirmed = confirm('Do u want to delete all tasks, are you sure?')
    if (isConfirmed) {
      this.state.items = []
      this.saveAndRender()
    }
  }

  onClick = ({ target }) => {
    if (target.matches(this.selectors.itemDeleteButton)) {
      const itemElement = target.closest(this.selectors.item)
      const itemCheckboxElement = itemElement.querySelector(
        this.selectors.itemCheckbox
      )
      itemElement.classList.add(this.stateClasses.isDisappearing)
      setTimeout(() => {
        this.deleteItem(itemCheckboxElement.id)
      }, 400)
    }
  }

  onChange = ({ target }) => {
    if (target.matches(this.selectors.itemCheckbox)) {
      this.toggleCheckedState(target.id)
    }
  }

  bindEvents() {
    this.newTaskFormElement.addEventListener('submit', this.onNewTaskFormSubmit)
    this.searchTaskFormElement.addEventListener(
      'submit',
      this.onSearchTaskFormSubmit
    )
    this.searchTaskInputElement.addEventListener(
      'input',
      this.onSearchTaskInputChange
    )
    this.deleteAllButtonElement.addEventListener(
      'click',
      this.onDeleteAllButtonClick
    )
    this.listElement.addEventListener('click', this.onClick)
    this.listElement.addEventListener('change', this.onChange)
  }
}
