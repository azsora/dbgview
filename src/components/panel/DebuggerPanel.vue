<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import { tabStore } from '../../stores/tabStore';
import { debuggerStore } from '../../stores/debuggerStore';
import SelectControl from './SelectControl.vue';

const startTime = performance.now();
onMounted(() => {
  console.log('DebuggerPanel mounted:', performance.now() - startTime, 'ms');
});

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

function handleDebuggerVisibleChange(visible: boolean) {
  if (visible) {
    refreshDebuggers();
  }
}

// 芯片相关状态
const chipSearchLoading = ref(false);
const chipOptions = ref<{ label: string; value: string }[]>([]);
const allChipOptions = ref<{ label: string; value: string }[]>([]);

// 加载初始芯片列表
async function loadChipOptions() {
  if (allChipOptions.value.length > 0) return;
  try {
    chipSearchLoading.value = true;
    const chips = await debuggerStore.listChips();
    allChipOptions.value = chips.map(c => ({ label: c.name, value: c.name }));
    chipOptions.value = allChipOptions.value;
  } catch (e) {
    console.error('Failed to load chip options:', e);
  } finally {
    chipSearchLoading.value = false;
  }
}

// 芯片选择改变
function handleChipChange(value: string | number | null) {
  updateConfig('chipModel', value == null ? '' : String(value));
}

// 芯片下拉打开
function handleChipVisibleChange(visible: boolean) {
  if (visible) {
    loadChipOptions();
  }
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
        @visible-change="handleDebuggerVisibleChange"
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
      <div class="control select-control">
        <label class="control-label">目标芯片</label>
        <n-select
          :value="activeConfig.chipModel || ''"
          class="control-select"
          placeholder="请选择"
          :options="chipOptions"
          :filterable="true"
          :loading="chipSearchLoading"
          :virtual-scroll="true"
          :consistent-menu-width="true"
          @update:value="handleChipChange"
          @update:show="handleChipVisibleChange"
        />
      </div>
    </div>


    <!-- 连接/断开按钮 -->
    <div class="control-row">
      <n-button
        :type="buttonType"
        :disabled="isConnecting || !activeConfig.debuggerId"
        class="toggle-btn"
        @click="handleToggle"
      >
        {{ buttonText }}
      </n-button>
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
  min-width: 55px;
  font-size: var(--font-size);
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