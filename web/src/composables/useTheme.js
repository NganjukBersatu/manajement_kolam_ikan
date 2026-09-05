import { ref } from 'vue'

const isDark = ref(false)

export function useTheme() {
  const toggle = () => {
    isDark.value = !isDark.value

    if (isDark.value) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  return {
    isDark,
    toggle
  }
}