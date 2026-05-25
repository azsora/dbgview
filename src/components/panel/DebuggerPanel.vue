<script setup lang="ts">
import { computed, ref } from 'vue';
import { tabStore } from '../../stores/tabStore';
import { debuggerStore } from '../../stores/debuggerStore';
import SelectControl from './SelectControl.vue';
import InputControl from './InputControl.vue';

const activeConfig = computed(() => tabStore.activeTab.value?.config ?? {});


// 调试器列表选项
const debuggerOptions = computed(() => {
  return debuggerStore.state.debuggerList?.map(d => ({
    label: d.name || d.target,
    value: d.id,
  })) ?? [];
});

const isDebuggerRefreshing = ref(false);

function updateConfig(key: string, value: any) {
  const activeTab = tabStore.activeTab.value;
  if (!activeTab) return;
  tabStore.updateTabConfig(activeTab.id, { [key]: value });
}

// 刷新调试器列表
async function refreshDebuggers() {
  if (isDebuggerRefreshing.value) return;
  isDebuggerRefreshing.value = true;
  try {
    await debuggerStore.listDebuggers();
  } finally {
    isDebuggerRefreshing.value = false;
  }
}

function handleDebuggerDropdownOpen() {
  // 仅在下拉框未展开时扫描
  const selectEl = document.querySelector('.debugger-panel .control-input') as HTMLSelectElement;
  if (selectEl && selectEl === document.activeElement) return;
  refreshDebuggers();
}

const isConnected = computed(() => debuggerStore.isConnected.value);
const isConnecting = computed(() => debuggerStore.isConnecting.value);


// 调试器选择改变
function handleDebuggerChange(value: string | number) {
  updateConfig('debuggerId', String(value));
}

// 调试接口选项
const interfaceOptions = [
  { label: 'JTAG', value: 'jtag' },
  { label: 'SWD', value: 'swd' },
];

// 调试接口改变
function handleInterfaceChange(value: string | number) {
  updateConfig('debugInterface', String(value));
}

// 速度KHz选项
const speedOptions = [
  { label: '100', value: 100 },
  { label: '200', value: 200 },
  { label: '500', value: 500 },
  { label: '1000', value: 1000 },
  { label: '2000', value: 2000 },
  { label: '4000', value: 4000 },
];

const isCustomSpeedMode = ref(false);

// 速度KHz改变
function handleSpeedChange(value: string | number) {
  updateConfig('speedKHz', Number(value));
}

// 自定义速度输入
function handleCustomSpeedInput(value: string | number) {
  const num = parseInt(String(value));
  if (!isNaN(num) && num > 0) {
    updateConfig('speedKHz', num);
  }
}

// 速度下拉框双击切换到输入模式
function handleSpeedDblClick() {
  isCustomSpeedMode.value = true;
}

// 输入框双击切换到下拉模式
function handleCustomSpeedDblClick() {
  isCustomSpeedMode.value = false;
}


async function handleToggle() {
  const config = tabStore.activeTab.value?.config;
  if (!config?.debuggerId) return;

  if (isConnected.value || isConnecting.value) {
    await debuggerStore.disconnect();
  } else {
    await debuggerStore.connect({
      debuggerId: config.debuggerId,
    });
  }
}

const buttonText = computed(() => {
  if (isConnected.value) return '断开';
  if (isConnecting.value) return '连接中...';
  return '连接';
});

const buttonClass = computed(() => {
  return isConnected.value ? 'btn-close' : 'btn-open';
});
</script>

<template>
  <div class="debugger-panel">

    <!-- 调试器选择 -->
    <div class="control-row">
      <SelectControl
        label="调试器"
        :value="activeConfig.debuggerId || ''"
        :options="debuggerOptions"
        @update="handleDebuggerChange"
        @focus="handleDebuggerDropdownOpen"
      />
    </div>

    <!-- 调试接口 -->
    <div class="control-row">
      <SelectControl
        label="接口"
        :value="activeConfig.debugInterface || 'swd'"
        :options="interfaceOptions"
        @update="handleInterfaceChange"
      />
    </div>

    <!-- 速度KHz -->
    <div class="control-row" v-if="!isCustomSpeedMode">
      <SelectControl
        label="速度KHz"
        :value="activeConfig.speedKHz || 1000"
        :options="speedOptions"
        @update="handleSpeedChange"
        @dblclick="handleSpeedDblClick"
      />
    </div>
    <div class="control-row" v-else>
      <InputControl
        label="速度KHz"
        :value="activeConfig.speedKHz"
        @update="handleCustomSpeedInput"
        @dblclick="handleCustomSpeedDblClick"
      />
    </div>


    <!-- 连接/断开按钮 -->
    <div class="control-row">
      <button
        class="toggle-btn"
        :class="buttonClass"
        :disabled="isConnecting || !activeConfig.debuggerId"
        @click="handleToggle"
      >
        {{ buttonText }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.debugger-panel {
  display: flex;
  flex-direction: column;
}

.control-row {
  margin-bottom: 5px;
}

.toggle-btn {
  width: 100%;
  padding: 8px 16px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background: var(--bg-primary);
  color: var(--text-secondary);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.toggle-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.toggle-btn:hover:not(:disabled) {
  border-color: var(--accent-color);
}

.toggle-btn.btn-close {
  background: var(--accent-color);
  border-color: var(--accent-color);
  color: white;
}

.debugger-panel :deep(.select-control) {
  display: flex;
  align-items: center;
  margin-bottom: 0;
}

.debugger-panel :deep(.control-label) {
  min-width: 50px;
  margin-bottom: 0;
  margin-right: 5px;
}

.debugger-panel :deep(.control-input) {
  flex: 1;
}

.placeholder {
  padding: 20px;
  text-align: center;
  color: var(--text-muted);
  font-size: 13px;
}
</style>