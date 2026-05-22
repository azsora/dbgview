<script setup lang="ts">
import { computed, ref, onUnmounted, watch, onMounted } from 'vue';
import { tabStore } from '../stores/tabStore';
import { getTabType } from '../registry/tabTypeRegistry';
import { TIMEOUT } from '../constants';
import type { TabConfigItem } from '../types/tab';
import SelectControl from './panel/SelectControl.vue';
import InputControl from './panel/InputControl.vue';
import SwitchControl from './panel/SwitchControl.vue';
import SliderControl from './panel/SliderControl.vue';
import ConnectionStatus from './panel/ConnectionStatus.vue';
import { serialStore } from '../stores/serialStore';

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

// 是否为串口类型
const isSerialTab = computed(() => tabStore.activeTab.value?.type === 'serial');

// 刷新端口列表
async function refreshPorts() {
  if (!isSerialTab.value) return;

  const ports = await serialStore.listPorts();
  const portItem = configItems.value.find((item) => item.key === 'port');
  if (portItem && portItem.options) {
    portItem.options = ports.map((p) => ({ label: p, value: p }));
    // 如果当前选中的端口不在列表中，清空选择
    const currentPort = activeConfig.value.port;
    if (currentPort && !ports.includes(currentPort)) {
      updateConfig('port', '');
    }
  }
}

onMounted(() => {
  refreshPorts();
});

// 监听 Tab 切换，刷新端口
watch(
  () => tabStore.activeTab.value?.id,
  () => {
    refreshPorts();
  }
);

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
    <div class="panel-content">
      <template v-for="item in configItems" :key="item.key">
        <component
          v-if="renderControl(item)"
          :is="renderControl(item)!.component"
          v-bind="renderControl(item)!.props"
          v-on="renderControl(item)!.on"
        />
      </template>
      <ConnectionStatus v-if="isSerialTab" />
    </div>
  </div>
</template>

<style scoped>
.panel-container {
  width: 220px;
  background: var(--bg-tertiary);
  border-right: 1px solid var(--border-color);
  padding: 12px;
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

.panel-content {
  /* 内容区滚动 */
}

/* 钉住时保持边框 */
.panel-container.panel-pinned {
  border-right: 1px solid var(--border-color);
}
</style>
