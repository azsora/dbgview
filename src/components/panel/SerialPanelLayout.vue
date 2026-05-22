<script setup lang="ts">
import { computed, onMounted, watch } from 'vue';
import { tabStore } from '../../stores/tabStore';
import { serialStore } from '../../stores/serialStore';
import SelectControl from './SelectControl.vue';
import FlowControlButtons from './FlowControlButtons.vue';
import ConnectionStatus from './ConnectionStatus.vue';

const activeConfig = computed(() => tabStore.activeTab.value?.config ?? {});

const portOptions = computed(() => {
  // 动态获取端口列表
  return serialStore.state.portList?.map((p) => ({ label: p, value: p })) ?? [];
});

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
  const ports = await serialStore.listPorts();
  serialStore.state.portList = ports;
  // 如果当前选中的端口不在列表中，清空选择
  const currentPort = activeConfig.value.port;
  if (currentPort && !ports.includes(currentPort)) {
    updateConfig('port', '');
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

    <!-- 流控按钮 -->
    <div class="control-row">
      <FlowControlButtons
        :value="activeConfig.flowControl || ''"
        @update="(v) => updateConfig('flowControl', v)"
      />
    </div>

    <!-- 连接状态 -->
    <ConnectionStatus />
  </div>
</template>

<style scoped>
.serial-panel {
  display: flex;
  flex-direction: column;
}

.control-row {
  margin-bottom: 12px;
}

/* 覆盖 SelectControl 的样式使其单行排列 */
.serial-panel :deep(.select-control) {
  display: flex;
  align-items: center;
  margin-bottom: 0;
}

.serial-panel :deep(.control-label) {
  min-width: 48px;
  margin-bottom: 0;
  margin-right: 8px;
}

.serial-panel :deep(.control-input) {
  flex: 1;
}
</style>
