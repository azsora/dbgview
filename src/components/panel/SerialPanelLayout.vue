<script setup lang="ts">
import { computed, ref } from 'vue';
import { open } from '@tauri-apps/plugin-dialog';
import { tabStore } from '../../stores/tabStore';
import { serialStore } from '../../stores/serialStore';
import SelectControl from './SelectControl.vue';
import FlowControlButtons from './FlowControlButtons.vue';

const activeConfig = computed(() => tabStore.activeTab.value?.config ?? {});

const portOptions = computed(() => {
  // 动态获取端口列表
  return serialStore.state.portList?.map((p) => ({ label: p, value: p })) ?? [];
});

// 端口列表是否正在刷新
const isPortRefreshing = ref(false);

const selectItems = [
  { key: 'port', label: '端口', options: [] },
  { key: 'baudRate', label: '波特率', options: [
    { label: '9600', value: 9600 },
    { label: '19200', value: 19200 },
    { label: '38400', value: 38400 },
    { label: '57600', value: 57600 },
    { label: '115200', value: 115200 },
    { label: '230400', value: 230400 },
    { label: '460800', value: 460800 },
    { label: '921600', value: 921600 },
  ]},
  { key: 'dataBits', label: '数据位', options: [
    { label: '5', value: 5 },
    { label: '6', value: 6 },
    { label: '7', value: 7 },
    { label: '8', value: 8 },
  ]},
  { key: 'stopBits', label: '停止位', options: [
    { label: '1', value: 1 },
    { label: '1.5', value: 1.5 },
    { label: '2', value: 2 },
  ]},
  { key: 'parity', label: '校验位', options: [
    { label: 'None', value: 'None' },
    { label: 'Odd', value: 'Odd' },
    { label: 'Even', value: 'Even' },
    { label: 'Mark', value: 'Mark' },
    { label: 'Space', value: 'Space' },
  ]},
];

function updateConfig(key: string, value: any) {
  const activeTab = tabStore.activeTab.value;
  if (!activeTab) return;
  tabStore.updateTabConfig(activeTab.id, { [key]: value });
}

async function refreshPorts() {
  if (isPortRefreshing.value) return;
  isPortRefreshing.value = true;
  try {
    const ports = await serialStore.listPorts();
    serialStore.state.portList = ports;
    // 如果当前选中的端口不在列表中，清空选择
    const currentPort = activeConfig.value.port;
    if (currentPort && !ports.includes(currentPort)) {
      updateConfig('port', '');
    }
  } finally {
    isPortRefreshing.value = false;
  }
}

// 下拉框展开时刷新端口
function handlePortVisibleChange(visible: boolean) {
  if (visible) {
    refreshPorts();
  }
}

const isConnected = computed(() => serialStore.isConnected.value);
const isConnecting = computed(() => serialStore.isConnecting.value);

async function handleToggle() {
  const config = tabStore.activeTab.value?.config;
  if (!config?.port) return;

  if (isConnected.value || isConnecting.value) {
    await serialStore.closePort();
  } else {
    await serialStore.openPort({
      port: config.port,
      baud_rate: config.baudRate,
      data_bits: config.dataBits,
      stop_bits: config.stopBits,
      parity: config.parity,
      flow_control: config.flowControl,
    });
  }
}

// 选择脚本文件
async function selectScriptFile(type: 'receive' | 'send') {
  const selected = await open({
    multiple: false,
    filters: [{
      name: 'Script',
      extensions: ['lua', 'lua5', 'py', 'python', 'js', 'ts', 'sh', 'bash']
    }]
  });
  if (selected) {
    const key = type === 'receive' ? 'receiveScript' : 'sendScript';
    updateConfig(key, selected);
  }
}

const buttonText = computed(() => {
  if (isConnected.value) return '关闭';
  if (isConnecting.value) return '打开中...';
  return '打开';
});

const buttonType = computed(() => {
  return isConnected.value ? 'danger' : 'primary';
});
</script>

<template>
  <div class="serial-panel">
    <!-- 端口 -->
    <div class="control-row">
      <SelectControl
        label="端口"
        :value="activeConfig.port || ''"
        :options="portOptions"
        @update="(v) => updateConfig('port', v)"
        @visible-change="handlePortVisibleChange"
      />
    </div>

    <!-- 波特率 -->
    <div class="control-row">
      <SelectControl
        label="波特率"
        :value="activeConfig.baudRate || 115200"
        :options="selectItems[1].options"
        @update="(v) => updateConfig('baudRate', v)"
      />
    </div>

    <!-- 数据位 -->
    <div class="control-row">
      <SelectControl
        label="数据位"
        :value="activeConfig.dataBits || 8"
        :options="selectItems[2].options"
        @update="(v) => updateConfig('dataBits', v)"
      />
    </div>

    <!-- 停止位 -->
    <div class="control-row">
      <SelectControl
        label="停止位"
        :value="activeConfig.stopBits || 1"
        :options="selectItems[3].options"
        @update="(v) => updateConfig('stopBits', v)"
      />
    </div>

    <!-- 校验位 -->
    <div class="control-row">
      <SelectControl
        label="校验位"
        :value="activeConfig.parity || 'None'"
        :options="selectItems[4].options"
        @update="(v) => updateConfig('parity', v)"
      />
    </div>

    <!-- 流控按钮（任意时刻可选，便于连接前预设） -->
    <div class="control-row">
      <FlowControlButtons
        :value="activeConfig.flowControl || ''"
        @update="(v) => updateConfig('flowControl', v)"
      />
    </div>

    <!-- 打开/关闭按钮 -->
    <div class="control-row">
      <el-button
        :type="buttonType"
        :disabled="isConnecting || !activeConfig.port"
        class="toggle-btn"
        @click="handleToggle"
      >
        {{ buttonText }}
      </el-button>
    </div>

    <!-- 扩展配置 -->
    <div class="expand-section">
      <div class="section-title">扩展配置</div>

      <!-- 接收设置 -->
      <div class="expand-row">
        <label class="expand-label">接收脚本</label>
        <el-input
          :model-value="activeConfig.receiveScript || ''"
          placeholder="选择脚本文件..."
          readonly
          @click="selectScriptFile('receive')"
        />
      </div>

      <!-- 发送设置 -->
      <div class="expand-row">
        <label class="expand-label">发送脚本</label>
        <el-input
          :model-value="activeConfig.sendScript || ''"
          placeholder="选择脚本文件..."
          readonly
          @click="selectScriptFile('send')"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.serial-panel {
  display: flex;
  flex-direction: column;
}

.control-row {
  margin-bottom: 5px;
}

.toggle-btn {
  width: 100%;
}

/* 覆盖 SelectControl 的样式使其单行排列 */
.serial-panel :deep(.select-control) {
  display: flex;
  align-items: center;
  margin-bottom: 0;
}

.serial-panel :deep(.control-label) {
  min-width: 55px;
  margin-bottom: 0;
  margin-right: 5px;
}

.serial-panel :deep(.control-input) {
  flex: 1;
}

/* 扩展配置区域 */
.expand-section {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--border-color);
}

.section-title {
  font-size: 12px;
  color: var(--text-muted);
  margin-bottom: 8px;
}

.expand-row {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.expand-label {
  min-width: 56px;
  font-size: 12px;
  color: var(--text-secondary);
  margin-right: 8px;
  flex-shrink: 0;
}

:deep(.el-input) {
  cursor: pointer;
}
</style>
