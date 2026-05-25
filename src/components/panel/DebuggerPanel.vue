<script setup lang="ts">
import { computed, ref } from 'vue';
import { tabStore } from '../../stores/tabStore';
import { serialStore } from '../../stores/serialStore';
import SelectControl from './SelectControl.vue';
import FlowControlButtons from './FlowControlButtons.vue';

const activeConfig = computed(() => tabStore.activeTab.value?.config ?? {});

// 连接类型选项
const connectionTypeOptions = [
  { label: '串口', value: 'serial' },
  { label: '调试器', value: 'debugger' },
  { label: 'BLE', value: 'ble' },
  { label: 'TCP/UDP', value: 'tcp-udp' },
];

// 端口列表（串口用）
const portOptions = computed(() => {
  return serialStore.state.portList?.map((p) => ({ label: p, value: p })) ?? [];
});

const isPortRefreshing = ref(false);

// 当前连接类型
const currentConnectionType = computed(() => {
  return activeConfig.value.connectionType || 'serial';
});

// 波特率选项
const baudRateOptions = [
  { label: '9600', value: 9600 },
  { label: '19200', value: 19200 },
  { label: '38400', value: 38400 },
  { label: '57600', value: 57600 },
  { label: '115200', value: 115200 },
  { label: '230400', value: 230400 },
  { label: '460800', value: 460800 },
  { label: '921600', value: 921600 },
];

// 数据位选项
const dataBitsOptions = [
  { label: '5', value: 5 },
  { label: '6', value: 6 },
  { label: '7', value: 7 },
  { label: '8', value: 8 },
];

// 停止位选项
const stopBitsOptions = [
  { label: '1', value: 1 },
  { label: '1.5', value: 1.5 },
  { label: '2', value: 2 },
];

// 校验位选项
const parityOptions = [
  { label: 'None', value: 'None' },
  { label: 'Odd', value: 'Odd' },
  { label: 'Even', value: 'Even' },
  { label: 'Mark', value: 'Mark' },
  { label: 'Space', value: 'Space' },
];

// 协议选项
const protocolOptions = [
  { label: 'TCP', value: 'TCP' },
  { label: 'UDP', value: 'UDP' },
];

// 芯片型号选项
const chipModelOptions = [
  { label: 'STM32F103', value: 'stm32f103' },
  { label: 'STM32F407', value: 'stm32f407' },
  { label: 'STM32F429', value: 'stm32f429' },
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
  } finally {
    isPortRefreshing.value = false;
  }
}

function handleConnectionTypeChange(value: string | number) {
  updateConfig('connectionType', String(value));
}

const isConnected = computed(() => serialStore.isConnected.value);
const isConnecting = computed(() => serialStore.isConnecting.value);

async function handleToggle() {
  const config = tabStore.activeTab.value?.config;
  if (!config) return;

  const connType = config.connectionType;

  if (connType === 'serial') {
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
  // TODO: 其他连接类型的打开/关闭逻辑
}

function handlePortDropdownOpen() {
  if (!isPortRefreshing.value) {
    refreshPorts();
  }
}

const buttonText = computed(() => {
  if (currentConnectionType.value !== 'serial') {
    return '连接';
  }
  if (isConnected.value) return '关闭';
  if (isConnecting.value) return '打开中...';
  return '打开';
});

const buttonClass = computed(() => {
  if (currentConnectionType.value !== 'serial' && isConnected.value) {
    return 'btn-close';
  }
  return isConnected.value ? 'btn-close' : 'btn-open';
});
</script>

<template>
  <div class="debugger-panel">
    <!-- 连接类型下拉 -->
    <div class="control-row">
      <SelectControl
        label="连接类型"
        :value="currentConnectionType"
        :options="connectionTypeOptions"
        @update="handleConnectionTypeChange"
      />
    </div>

    <!-- 串口配置 -->
    <template v-if="currentConnectionType === 'serial'">
      <div class="control-row">
        <SelectControl
          label="端口"
          :value="activeConfig.port || ''"
          :options="portOptions"
          @update="(v) => updateConfig('port', v)"
          @focus="handlePortDropdownOpen"
        />
      </div>
      <div class="control-row">
        <SelectControl
          label="波特率"
          :value="activeConfig.baudRate || 115200"
          :options="baudRateOptions"
          @update="(v) => updateConfig('baudRate', v)"
        />
      </div>
      <div class="control-row">
        <SelectControl
          label="数据位"
          :value="activeConfig.dataBits || 8"
          :options="dataBitsOptions"
          @update="(v) => updateConfig('dataBits', v)"
        />
      </div>
      <div class="control-row">
        <SelectControl
          label="停止位"
          :value="activeConfig.stopBits || 1"
          :options="stopBitsOptions"
          @update="(v) => updateConfig('stopBits', v)"
        />
      </div>
      <div class="control-row">
        <SelectControl
          label="校验位"
          :value="activeConfig.parity || 'None'"
          :options="parityOptions"
          @update="(v) => updateConfig('parity', v)"
        />
      </div>
      <div class="control-row">
        <FlowControlButtons
          :value="activeConfig.flowControl || ''"
          :disabled="!isConnected"
          @update="(v) => updateConfig('flowControl', v)"
        />
      </div>
    </template>

    <!-- 调试器配置 -->
    <template v-if="currentConnectionType === 'debugger'">
      <div class="control-row">
        <SelectControl
          label="芯片型号"
          :value="activeConfig.chipModel || 'stm32f103'"
          :options="chipModelOptions"
          @update="(v) => updateConfig('chipModel', v)"
        />
      </div>
      <div class="control-row">
        <SelectControl
          label="连接地址"
          :value="activeConfig.connectionAddress || ''"
          :options="[]"
          @update="(v) => updateConfig('connectionAddress', v)"
        />
      </div>
      <div class="control-row switch-row">
        <label class="switch-label">使能调试</label>
        <input
          type="checkbox"
          class="switch-input"
          :checked="activeConfig.enabled !== false"
          @change="(e) => updateConfig('enabled', (e.target as HTMLInputElement).checked)"
        />
      </div>
      <div class="control-row">
        <label class="slider-label">
          采样阈值: {{ activeConfig.sampleThreshold || 50 }}
        </label>
        <input
          type="range"
          class="slider-input"
          min="0"
          max="100"
          :value="activeConfig.sampleThreshold || 50"
          @input="(e) => updateConfig('sampleThreshold', parseInt((e.target as HTMLInputElement).value))"
        />
      </div>
    </template>

    <!-- BLE 配置（预留） -->
    <template v-if="currentConnectionType === 'ble'">
      <div class="control-row placeholder">
        <span>BLE 功能开发中...</span>
      </div>
    </template>

    <!-- TCP/UDP 配置 -->
    <template v-if="currentConnectionType === 'tcp-udp'">
      <div class="control-row">
        <SelectControl
          label="IP 地址"
          :value="activeConfig.ip || '192.168.1.100'"
          :options="[]"
          @update="(v) => updateConfig('ip', v)"
        />
      </div>
      <div class="control-row">
        <SelectControl
          label="端口"
          :value="activeConfig.port || '8080'"
          :options="[]"
          @update="(v) => updateConfig('port', v)"
        />
      </div>
      <div class="control-row">
        <SelectControl
          label="协议"
          :value="activeConfig.protocol || 'TCP'"
          :options="protocolOptions"
          @update="(v) => updateConfig('protocol', v)"
        />
      </div>
    </template>

    <!-- 打开/关闭按钮 -->
    <div class="control-row">
      <button
        class="toggle-btn"
        :class="buttonClass"
        :disabled="isConnecting"
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
  min-width: 48px;
  margin-bottom: 0;
  margin-right: 8px;
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

.switch-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.switch-label {
  min-width: 56px;
  font-size: 12px;
  color: var(--text-secondary);
}

.switch-input {
  width: 40px;
  height: 20px;
  cursor: pointer;
}

.slider-label {
  display: block;
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.slider-input {
  width: 100%;
  cursor: pointer;
}
</style>