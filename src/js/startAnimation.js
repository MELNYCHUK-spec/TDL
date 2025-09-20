export const startAnimation = () => {
  const root = document.querySelector('[data-js-todo]')
  root.classList.add('introMove')

  const onAnimationEnd = (event) => {
    root.classList.remove('introMove')
    root.classList.add('wobble')
    root.removeEventListener('animationend', onAnimationEnd)
  }
  root.addEventListener('animationend', onAnimationEnd)
}
