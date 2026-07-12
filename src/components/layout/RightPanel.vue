<script setup lang="ts">
import { computed, ref, watch, onUnmounted } from 'vue';
import { TIMEOUT } from '../../constants';

const props = defineProps<{
  visible?: boolean;
  initialPinned?: boolean;
}>();

const isPinned = ref(props.initialPinned ?? false);
let hideTimer: ReturnType<typeof setTimeout> | null = null;

// 监听外部传入的 initialPinned 变化
watch(() => props.initialPinned, (newVal) => {
  if (newVal !== undefined) {
    isPinned.value = newVal;
  }
});

const isVisible = computed(() => props.visible ?? false);

const emit = defineEmits<{
  (e: 'pinned', value: boolean): void;
  (e: 'visibleChange', value: boolean): void;
}>();

function handleMouseLeave() {
  if (isPinned.value) return;
  if (hideTimer) {
    clearTimeout(hideTimer);
  }
  hideTimer = setTimeout(() => {
    hideTimer = null;
    emit('visibleChange', false);
  }, TIMEOUT.PANEL_HIDE_DELAY);
}

function handleMouseEnter() {
  if (hideTimer) {
    clearTimeout(hideTimer);
    hideTimer = null;
  }
  emit('visibleChange', true);
}

function togglePin() {
  isPinned.value = !isPinned.value;
  emit('pinned', isPinned.value);
  if (isPinned.value) {
    emit('visibleChange', true);
  }
}

onUnmounted(() => {
  if (hideTimer) {
    clearTimeout(hideTimer);
  }
});
</script>

<template>
  <div
    class="right-panel-container"
    :class="{
      'right-panel-hidden': !isVisible && !isPinned,
      'right-panel-pinned': isPinned,
    }"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <div class="right-panel-header">
      <span>属性面板</span>
      <el-button
        class="pin-btn"
        :type="isPinned ? 'primary' : 'default'"
        size="small"
        text
        @click="togglePin"
        :title="isPinned ? '取消钉住' : '钉住面板'"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" :fill="isPinned ? 'var(--accent-color)' : 'var(--text-muted)'">
          <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z"/>
        </svg>
      </el-button>
    </div>
    <div class="right-panel-content">
      <!-- 待后续补充 -->
    </div>
  </div>
</template>

<style scoped>
.right-panel-container {
  width: 220px;
  background: var(--bg-tertiary);
  border-left: 1px solid var(--border-color);
  padding: 12px;
  overflow-y: auto;
  transition: width 0.3s ease, padding 0.3s ease, transform 0.3s ease;
  flex-shrink: 0;
}

.right-panel-container.right-panel-hidden {
  width: 0;
  padding: 0;
  overflow: hidden;
  border-left: none;
}

.right-panel-header {
  font-size: 11px;
  color: var(--text-muted);
  text-transform: uppercase;
  margin-bottom: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pin-btn {
  padding: 4px;
}

:deep(.el-icon) {
  font-size: 14px;
}
.right-panel-container.right-panel-pinned {
  border-left: 1px solid var(--border-color);
}
</style>