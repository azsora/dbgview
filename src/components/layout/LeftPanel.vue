<script setup lang="ts">
import { computed, ref, onUnmounted, watch } from 'vue';
import { tabStore } from '../../stores/tabStore';
import { getTabType } from '../../registry/tabTypeRegistry';
import { getPanel } from '../../registry/panelRegistry';
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

// 根据激活标签页类型获取面板组件
const panelComponent = computed(() => {
  const start = performance.now();
  const activeTab = tabStore.activeTab.value;
  if (!activeTab) return null;

  const tabType = getTabType(activeTab.type);
  if (!tabType?.panelComponent) return null;

  const component = getPanel(tabType.panelComponent);
  console.log('LeftPanel panelComponent resolved:', activeTab.type, performance.now() - start, 'ms');
  return component;
});
</script>

<template>
  <div
    class="panel-container"
    :class="{
      'panel-hidden': !isVisible && !isPinned,
      'panel-pinned': isPinned,
    }"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <div class="panel-header">
      <span>配置面板</span>
      <n-button
        class="pin-btn"
        :type="isPinned ? 'primary' : 'tertiary'"
        size="small"
        text
        @click="togglePin"
        :title="isPinned ? '取消钉住' : '钉住面板'"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" :fill="isPinned ? 'var(--accent-color)' : 'var(--text-muted)'">
          <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z"/>
        </svg>
      </n-button>
    </div>
    <div class="panel-content">
      <component
        v-if="panelComponent"
        :is="panelComponent"
      />
    </div>
  </div>
</template>

<style scoped>
.panel-container {
  width: 240px;
  background: var(--bg-tertiary);
  border-right: 1px solid var(--border-color);
  padding: 5px;
  overflow-y: auto;
  transition: width 0.3s ease, padding 0.3s ease, transform 0.3s ease;
  flex-shrink: 0;
}

.panel-container.panel-hidden {
  width: 0;
  padding: 0;
  overflow: hidden;
  border-right: none;
}

.panel-header {
  font-size: 11px;
  color: var(--text-muted);
  text-transform: uppercase;
  margin-bottom: 5px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pin-btn {
  padding: 4px;
}

.panel-container.panel-pinned {
  border-right: 1px solid var(--border-color);
}
</style>