<script setup lang="ts">
import { computed, ref } from 'vue';
import { tabStore } from '../../stores/tabStore';
import { debuggerStore } from '../../stores/debuggerStore';
import SelectControl from './SelectControl.vue';

const activeConfig = computed(() => tabStore.activeTab.value?.config ?? {});


// 调试器列表选项
const debuggerOptions = computed(() => {
  return debuggerStore.state.debuggerList?.map(d => ({
    label: d.name || d.target,
    value: d.id,
  })) ?? [];
});

const isDebuggerRefreshing = ref(false);
// 芯片列表加载中
const isChipRefreshing = ref(false);

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
  if (isDebuggerRefreshing.value) return;
  refreshDebuggers();
}

// 芯片列表选项
const chipOptions = computed(() => {
  return debuggerStore.state.chipList?.map(c => ({
    label: c.name,
    value: c.name,
  })) ?? [];
});

// 刷新芯片列表
async function refreshChips() {
  if (isChipRefreshing.value) return;
  isChipRefreshing.value = true;
  try {
    await debuggerStore.listChips();
  } finally {
    isChipRefreshing.value = false;
  }
}

// 芯片下拉框打开时刷新
function handleChipDropdownOpen() {
  if (isChipRefreshing.value) return;
  refreshChips();
}

// 芯片选择改变
function handleChipChange(value: string | number) {
  updateConfig('chipModel', String(value));
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

// 速度KHz改变
function handleSpeedChange(value: string | number) {
  updateConfig('speedKHz', Number(value));
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

const buttonType = computed(() => {
  return isConnected.value ? 'danger' : 'primary';
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
    <div class="control-row">
      <SelectControl
        label="速度KHz"
        :value="activeConfig.speedKHz || 1000"
        :options="speedOptions"
        @update="handleSpeedChange"
      />
    </div>

    <!-- 目标芯片 -->
    <div class="control-row">
      <SelectControl
        label="目标芯片"
        :value="activeConfig.chipModel || ''"
        :options="chipOptions"
        @update="handleChipChange"
        @focus="handleChipDropdownOpen"
      />
    </div>


    <!-- 连接/断开按钮 -->
    <div class="control-row">
      <el-button
        :type="buttonType"
        :disabled="isConnecting || !activeConfig.debuggerId"
        class="toggle-btn"
        @click="handleToggle"
      >
        {{ buttonText }}
      </el-button>
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