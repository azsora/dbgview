<script setup lang="ts">
import { computed, ref, onUnmounted, watch } from 'vue';
import { tabStore } from '../stores/tabStore';
import { getTabType } from '../registry/tabTypeRegistry';
import { TIMEOUT } from '../constants';
import type { TabConfigItem } from '../types/tab';
import SelectControl from './panel/SelectControl.vue';
import InputControl from './panel/InputControl.vue';
import SwitchControl from './panel/SwitchControl.vue';
import SliderControl from './panel/SliderControl.vue';

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

const activeConfig = computed(() => tabStore.activeTab.value?.config ?? {});

const emit = defineEmits<{
  (e: 'pinned', value: boolean): void;
  (e: 'visibleChange', value: boolean): void;
}>();

function updateConfig(key: string, value: any) {
  const activeTab = tabStore.activeTab.value;
  if (!activeTab) return;

  tabStore.updateTabConfig(activeTab.id, { [key]: value });
}

const configItems = computed(() => {
  const activeTab = tabStore.activeTab.value;
  if (!activeTab) return [];

  const tabType = getTabType(activeTab.type);
  return tabType?.configItems ?? [];
});

function renderControl(item: TabConfigItem) {
  const value = activeConfig.value[item.key] ?? item.defaultValue;

  switch (item.type) {
    case 'select':
      return {
        component: SelectControl,
        props: {
          label: item.label,
          value,
          options: item.options ?? [],
        },
        on: { update: (v: any) => updateConfig(item.key, v) },
      };
    case 'input':
      return {
        component: InputControl,
        props: {
          label: item.label,
          value,
        },
        on: { update: (v: any) => updateConfig(item.key, v) },
      };
    case 'switch':
      return {
        component: SwitchControl,
        props: {
          label: item.label,
          value,
        },
        on: { update: (v: any) => updateConfig(item.key, v) },
      };
    case 'slider':
      return {
        component: SliderControl,
        props: {
          label: item.label,
          value,
          min: item.min,
          max: item.max,
        },
        on: { update: (v: any) => updateConfig(item.key, v) },
      };
    default:
      return null;
  }
}

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
      <button
        class="pin-btn"
        :class="{ 'pin-active': isPinned }"
        @click="togglePin"
        :title="isPinned ? '取消钉住' : '钉住面板'"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
          <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z"/>
        </svg>
      </button>
    </div>
    <div class="right-panel-content">
      <template v-for="item in configItems" :key="item.key">
        <component
          v-if="renderControl(item)"
          :is="renderControl(item)!.component"
          v-bind="renderControl(item)!.props"
          v-on="renderControl(item)!.on"
        />
      </template>
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
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s, background 0.2s;
}

.pin-btn:hover {
  color: var(--text-primary);
  background: var(--bg-hover);
}

.pin-btn.pin-active {
  color: var(--color-primary);
}

.right-panel-content {
  /* 内容区滚动 */
}

/* 钉住时保持边框 */
.right-panel-container.right-panel-pinned {
  border-left: 1px solid var(--border-color);
}
</style>
