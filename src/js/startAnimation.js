export const startAnimation = () => {
  const root = document.querySelector('[data-js-todo]')
  root.classList.add('introMove')
  root.addEventListener('animationend', onAnimationEnd)

  function onAnimationEnd() {
    root.classList.remove('introMove')
    root.classList.add('wobble')
    root.removeEventListener('animationend', onAnimationEnd)
  }
}
