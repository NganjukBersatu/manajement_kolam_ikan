import { ref, watchEffect } from 'vue'

const isDark = ref(localStorage.getItem('theme') === 'dark')

watchEffect(() => {
  document.documentElement.classList.toggle('dark', isDark.value)
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
})

function toggle() {
  isDark.value = !isDark.value
}

export function useTheme() {
  return { isDark, toggle }
}