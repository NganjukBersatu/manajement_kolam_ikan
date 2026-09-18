import { ref } from 'vue'

const dialogState = ref({
  isOpen: false,
  type: 'success', // 'success' | 'error' | 'warning' | 'confirm' | 'delete'
  title: '',
  message: '',
  confirmText: 'Oke',
  cancelText: 'Batal',
  resolve: null
})

export function useDialog() {
  function show(options) {
    return new Promise((resolve) => {
      dialogState.value = {
        isOpen: true,
        type: options.type || 'info',
        title: options.title || (options.type === 'error' ? 'Gagal!' : options.type === 'success' ? 'Berhasil!' : 'Perhatian'),
        message: typeof options === 'string' ? options : (options.message || ''),
        confirmText: options.confirmText || (options.type === 'confirm' || options.type === 'delete' ? 'Ya, Lanjutkan' : 'Oke'),
        cancelText: options.cancelText || 'Batal',
        resolve
      }
    })
  }

  function success(message, title = 'Berhasil!') {
    return show({ type: 'success', title, message, confirmText: 'Oke' })
  }

  function error(message, title = 'Gagal!') {
    return show({ type: 'error', title, message, confirmText: 'Tutup' })
  }

  function warning(message, title = 'Perhatian') {
    return show({ type: 'warning', title, message, confirmText: 'Mengerti' })
  }

  function confirm({ title = 'Konfirmasi', message, confirmText = 'Ya, Lanjutkan', cancelText = 'Batal', isDelete = false }) {
    return show({
      type: isDelete ? 'delete' : 'confirm',
      title,
      message,
      confirmText,
      cancelText
    })
  }

  function handleConfirm() {
    if (dialogState.value.resolve) {
      dialogState.value.resolve(true)
    }
    dialogState.value.isOpen = false
  }

  function handleCancel() {
    if (dialogState.value.resolve) {
      dialogState.value.resolve(false)
    }
    dialogState.value.isOpen = false
  }

  return {
    dialogState,
    show,
    success,
    error,
    warning,
    confirm,
    handleConfirm,
    handleCancel
  }
}
