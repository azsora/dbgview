<script setup lang="ts">
import { watch } from 'vue';

const props = defineProps<{
  message: string;
  visible: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

// 监听 visible 变化，3秒后自动关闭
watch(() => props.visible, (newVal) => {
  if (newVal) {
    setTimeout(() => {
      emit('close');
    }, 3000);
  }
});
</script>

<template>
  <Transition name="toast">
    <div v-if="visible" class="toast-container" @click="emit('close')">
      <div class="toast-content">
        {{ message }}
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.toast-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.toast-content {
  padding: 16px 32px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  color: var(--text-primary);
  font-size: 14px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

/* 渐隐过渡效果 */
.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.3s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
}

.toast-enter-from .toast-content,
.toast-leave-to .toast-content {
  transform: scale(0.9);
}

.toast-enter-to .toast-content,
.toast-leave-from .toast-content {
  transform: scale(1);
}
</style>