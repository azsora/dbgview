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
import SerialPanelLayout from './panel/SerialPanelLayout.vue';
import DebuggerPanel from './panel/DebuggerPanel.vue';

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

// 是否为串口助手类型
const isSerialTab = computed(() => tabStore.activeTab.value?.type === 'serial-assistant');

// 是否为调试助手类型
const isDebuggerTab = computed(() => tabStore.activeTab.value?.type === 'debugger-assistant');

// 缓存 renderControl 结果，避免重复计算
const renderedControls = computed(() => {
  const items = configItems.value;
  const controls: { key: string; control: ReturnType<typeof renderControl> }[] = new Array(items.length);
  for (let i = 0; i < items.length; i++) {
    controls[i] = { key: items[i].key, control: renderControl(items[i]) };
  }
  return controls;
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
    <div class="panel-content">
      <!-- 串口类型使用专用布局 -->
      <SerialPanelLayout v-if="isSerialTab" />
      <!-- 调试助手类型使用专用布局 -->
      <DebuggerPanel v-else-if="isDebuggerTab" />
      <!-- 其他类型使用通用 configItems 渲染 -->
      <template v-else v-for="rc in renderedControls" :key="rc.key">
        <component
          v-if="rc.control"
          :is="rc.control.component"
          v-bind="rc.control.props"
          v-on="rc.control.on"
        />
      </template>
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

:deep(.el-icon) {
  font-size: 14px;
}
.panel-container.panel-pinned {
  border-right: 1px solid var(--border-color);
}
</style>
