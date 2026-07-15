<script setup lang="ts">
import { computed, ref, watch, onUnmounted } from 'vue';
import { open } from '@tauri-apps/plugin-dialog';
import { tabStore } from '../../stores/tabStore';
import { serialStore } from '../../stores/serialStore';
import SelectControl from './SelectControl.vue';
import AutocompleteControl from './AutocompleteControl.vue';
import FlowControlButtons from './FlowControlButtons.vue';
import { useBaudRateOptions } from '../../composables/useBaudRateOptions';

const activeConfig = computed(() => tabStore.activeTab.value?.config ?? {});

const portOptions = computed(() => {
  // 动态获取端口列表
  return serialStore.state.portList?.map((p) => ({ label: p, value: p })) ?? [];
});

// 端口列表是否正在刷新
const isPortRefreshing = ref(false);

// 波特率选项（预设 + 自定义持久化）
const { options: baudRateOptions, addCustomBaudRate } = useBaudRateOptions();

// 静态下拉项（波特率已由 useBaudRateOptions 接管，此处仅保留值域固定的配置项）
// 注：停止位 1.5、校验位 Mark/Space 因 serialport 底层不支持，已移除
const selectItems = [
  { key: 'port', label: '端口', options: [] },
  { key: 'dataBits', label: '数据位', options: [
    { label: '5', value: 5 },
    { label: '6', value: 6 },
    { label: '7', value: 7 },
    { label: '8', value: 8 },
  ]},
  { key: 'stopBits', label: '停止位', options: [
    { label: '1', value: 1 },
    { label: '2', value: 2 },
  ]},
  { key: 'parity', label: '校验位', options: [
    { label: 'None', value: 'None' },
    { label: 'Odd', value: 'Odd' },
    { label: 'Even', value: 'Even' },
  ]},
];

function updateConfig(key: string, value: any) {
  const activeTab = tabStore.activeTab.value;
  if (!activeTab) return;
  tabStore.updateTabConfig(activeTab.id, { [key]: value });
}

/**
 * 波特率更新：写入配置，并将自定义值加入持久化列表
 */
function handleBaudRateUpdate(v: string | number) {
  const num = v === '' ? 0 : Number(v);
  updateConfig('baudRate', num);
  if (num > 0) {
    addCustomBaudRate(num);
  }
}

// 信号线输入状态（DSR/CTS，连接后轮询读取）
const ctsState = ref(false);
const dsrState = ref(false);
let signalPollTimer: number | null = null;

async function pollSignalLines() {
  if (!isConnected.value) return;
  ctsState.value = await serialStore.readCts();
  dsrState.value = await serialStore.readDsr();
}

function startSignalPolling() {
  stopSignalPolling();
  pollSignalLines();
  signalPollTimer = window.setInterval(pollSignalLines, 500);
}

function stopSignalPolling() {
  if (signalPollTimer !== null) {
    clearInterval(signalPollTimer);
    signalPollTimer = null;
  }
}

/**
 * DTR 信号线更新：写入配置并实时下发（仅手动模式）
 */
async function handleDtrUpdate(v: boolean) {
  updateConfig('dtr', v);
  if (isConnected.value && !activeConfig.value.hardwareFlowControl) {
    await serialStore.setDtr(v);
  }
}

/**
 * RTS 信号线更新：写入配置并实时下发（仅手动模式）
 */
async function handleRtsUpdate(v: boolean) {
  updateConfig('rts', v);
  if (isConnected.value && !activeConfig.value.hardwareFlowControl) {
    await serialStore.setRts(v);
  }
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
  // 波特率为空时阻止打开
  if (!config.baudRate) return;

  if (isConnected.value || isConnecting.value) {
    await serialStore.closePort();
  } else {
    // flow_control 由硬件流控复选框决定：勾选=RTS/CTS 硬件流控，未勾选=None
    await serialStore.openPort({
      port: config.port,
      baud_rate: config.baudRate,
      data_bits: config.dataBits,
      stop_bits: config.stopBits,
      parity: config.parity,
      flow_control: config.hardwareFlowControl ? 'RTS/CTS' : 'None',
    });
    // 手动模式下，打开成功后下发初始 DTR/RTS 电平
    if (isConnected.value && !config.hardwareFlowControl) {
      await serialStore.setDtr(!!config.dtr);
      await serialStore.setRts(!!config.rts);
    }
  }
}

// 连接状态变化时启停信号线轮询
watch(isConnected, (v) => {
  if (v) startSignalPolling();
  else stopSignalPolling();
});

onUnmounted(() => stopSignalPolling());

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

    <!-- 波特率（支持下拉选择与手动输入） -->
    <div class="control-row">
      <AutocompleteControl
        label="波特率"
        :value="activeConfig.baudRate || 115200"
        :options="baudRateOptions"
        :number-only="true"
        placeholder="选择或输入"
        @update="(v) => handleBaudRateUpdate(v)"
      />
    </div>

    <!-- 数据位 -->
    <div class="control-row">
      <SelectControl
        label="数据位"
        :value="activeConfig.dataBits || 8"
        :options="selectItems[1].options"
        @update="(v) => updateConfig('dataBits', v)"
      />
    </div>

    <!-- 停止位 -->
    <div class="control-row">
      <SelectControl
        label="停止位"
        :value="activeConfig.stopBits || 1"
        :options="selectItems[2].options"
        @update="(v) => updateConfig('stopBits', v)"
      />
    </div>

    <!-- 校验位 -->
    <div class="control-row">
      <SelectControl
        label="校验位"
        :value="activeConfig.parity || 'None'"
        :options="selectItems[3].options"
        @update="(v) => updateConfig('parity', v)"
      />
    </div>

    <!-- 信号线/流控控制 -->
    <div class="control-row">
      <FlowControlButtons
        :hardware-flow-control="!!activeConfig.hardwareFlowControl"
        :dtr="!!activeConfig.dtr"
        :rts="!!activeConfig.rts"
        :cts="ctsState"
        :dsr="dsrState"
        :connected="isConnected"
        @update-hardware-flow-control="(v) => updateConfig('hardwareFlowControl', v)"
        @update-dtr="(v) => handleDtrUpdate(v)"
        @update-rts="(v) => handleRtsUpdate(v)"
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

/* 覆盖 SelectControl/AutocompleteControl 的样式使其单行排列 */
.serial-panel :deep(.select-control),
.serial-panel :deep(.autocomplete-control) {
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

/* 仅扩展配置区的脚本输入框显示 pointer 光标，避免误伤波特率可输入框 */
.expand-section :deep(.el-input) {
  cursor: pointer;
}
</style>
