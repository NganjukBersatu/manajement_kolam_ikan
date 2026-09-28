<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'

const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  options: { type: Array, default: () => [] }, // [{ value, label }]
  placeholder: { type: String, default: 'Pilih' },
  up: { type: Boolean, default: false }, // buka ke atas
  compact: { type: Boolean, default: false }, // ukuran kecil
  disabled: { type: Boolean, default: false }
})
const emit = defineEmits(['update:modelValue'])

const open = ref(false)
const root = ref(null)
const listRef = ref(null)
const activeIndex = ref(-1)

const selected = computed(() => props.options.find((o) => o.value === props.modelValue))

function toggle() {
  if (props.disabled) return
  open.value ? close() : openList()
}

function openList() {
  open.value = true
  activeIndex.value = Math.max(0, props.options.findIndex((o) => o.value === props.modelValue))
}

function close() {
  open.value = false
}

function pilih(opt) {
  emit('update:modelValue', opt.value)
  close()
}

function onKeydown(e) {
  if (props.disabled || !props.options.length) return

  if (!open.value) {
    if (['ArrowDown', 'Enter', ' '].includes(e.key)) {
      e.preventDefault()
      openList()
    }
    return
  }

  if (e.key === 'ArrowDown') {
    e.preventDefault()
    activeIndex.value = (activeIndex.value + 1) % props.options.length
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    activeIndex.value = (activeIndex.value - 1 + props.options.length) % props.options.length
  } else if (e.key === 'Enter') {
    e.preventDefault()
    if (props.options[activeIndex.value]) pilih(props.options[activeIndex.value])
  } else if (e.key === 'Escape') {
    close()
  }

  nextTick(() => {
    listRef.value?.children[activeIndex.value]?.scrollIntoView({ block: 'nearest' })
  })
}

function onClickOutside(e) {
  if (root.value && !root.value.contains(e.target)) close()
}

onMounted(() => document.addEventListener('mousedown', onClickOutside))
onUnmounted(() => document.removeEventListener('mousedown', onClickOutside))
</script>

<template>
  <div ref="root" class="relative" @keydown="onKeydown">
    <!-- Tombol -->
    <button
      type="button"
      @click="toggle"
      aria-haspopup="listbox"
      :aria-expanded="open"
      :disabled="disabled"
      class="w-full flex items-center justify-between rounded-lg border bg-white dark:bg-ink-900 text-left transition focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
      :class="[
        compact ? 'px-2.5 py-1 text-[13px] gap-1.5' : 'px-3 py-2.5 text-[13.5px] gap-2',
        open
          ? 'border-brand-500 ring-2 ring-brand-500/20'
          : 'border-ink-100 dark:border-ink-500 hover:border-brand-500/60'
      ]"
    >
      <span class="truncate" :class="selected ? 'text-ink-900 dark:text-white' : 'text-ink-400'">
        {{ selected?.label ?? placeholder }}
      </span>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="shrink-0 text-ink-400 transition-transform duration-200"
        :class="{ 'rotate-180 text-brand-500': open }"
      >
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </button>

    <!-- Daftar pilihan -->
    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <ul
        v-if="open"
        ref="listRef"
        role="listbox"
        class="absolute left-0 z-30 w-full min-w-[6rem] max-h-64 overflow-y-auto rounded-xl border border-ink-100 dark:border-ink-500 bg-white dark:bg-ink-800 p-1.5 shadow-xl"
        :class="up ? 'bottom-full mb-2 origin-bottom' : 'top-full mt-2 origin-top'"
      >
        <li
          v-for="(opt, i) in options"
          :key="opt.value"
          role="option"
          :aria-selected="opt.value === modelValue"
          @click="pilih(opt)"
          @mouseenter="activeIndex = i"
          class="flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-[13.5px] cursor-pointer transition-colors"
          :class="[
            opt.value === modelValue
              ? 'bg-brand-500/10 text-brand-600 font-semibold dark:text-brand-400'
              : 'text-ink-700 dark:text-ink-200',
            activeIndex === i && opt.value !== modelValue ? 'bg-ink-50 dark:bg-ink-700' : ''
          ]"
        >
          <span class="truncate">{{ opt.label }}</span>
          <svg
            v-if="opt.value === modelValue"
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="3"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="shrink-0"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </li>
      </ul>
    </Transition>
  </div>
</template>