<script setup lang="ts">
import { computed } from 'vue';
import { ElMessage } from 'element-plus';

/*
 * 信号线控制组件
 * - 硬件流控复选框：勾选=RTS/CTS 硬件流控模式；未勾选=手动信号线控制
 * - DTR/RTS：输出信号，手动模式下可点击控制电平
 * - DSR/CTS：输入信号，只读状态显示（由父组件轮询后传入）
 */
const props = defineProps<{
  hardwareFlowControl: boolean;
  dtr: boolean;
  rts: boolean;
  cts: boolean;
  dsr: boolean;
  connected: boolean;
}>();

const emit = defineEmits<{
  (e: 'updateHardwareFlowControl', v: boolean): void;
  (e: 'updateDtr', v: boolean): void;
  (e: 'updateRts', v: boolean): void;
}>();

// 仅硬件流控开启时禁用 DTR/RTS（RTS 被 RTS/CTS 自动接管）；
// 未连接时允许预配置电平，连接后由 handleToggle 下发初始值
const signalDisabled = computed(() => props.hardwareFlowControl);

/**
 * 硬件流控复选框变更处理
 * 直接下发更新，并弹出自动消除的消息提示告知用户流控状态变更
 */
function handleFlowControlChange(v: boolean | string | number) {
  const next = !!v;
  emit('updateHardwareFlowControl', next);
  // 自动消除提示：开启时说明手动控制禁用，关闭时说明恢复手动控制
  const effect = next
    ? '已开启硬件流控（RTS/CTS），DTR/RTS 手动控制已禁用，重新打开串口后生效'
    : '已关闭硬件流控，恢复 DTR/RTS 手动控制，重新打开串口后生效';
  ElMessage({
    message: effect,
    type: next ? 'success' : 'info',
    duration: 3000,
  });
}

function toggleDtr() {
  if (signalDisabled.value) return;
  emit('updateDtr', !props.dtr);
}

function toggleRts() {
  if (signalDisabled.value) return;
  emit('updateRts', !props.rts);
}
</script>

<template>
  <div class="flow-control">
    <el-checkbox
      :model-value="hardwareFlowControl"
      size="small"
      @change="handleFlowControlChange"
    />
    <el-button-group class="signal-group">
      <!-- DSR/CTS 输入信号：只读状态显示 -->
      <el-button
        size="small"
        :type="dsr ? 'success' : 'info'"
        :class="['signal-btn', { 'signal-on': dsr }]"
        disabled
      >
        DSR
      </el-button>
      <el-button
        size="small"
        :type="cts ? 'success' : 'info'"
        :class="['signal-btn', { 'signal-on': cts }]"
        disabled
      >
        CTS
      </el-button>
      <!-- DTR/RTS 输出信号：手动模式下可控制 -->
      <el-button
        size="small"
        :type="dtr ? 'primary' : 'default'"
        :disabled="signalDisabled"
        :class="['signal-btn', { 'signal-on': dtr }]"
        @click="toggleDtr"
      >
        DTR
      </el-button>
      <el-button
        size="small"
        :type="rts ? 'primary' : 'default'"
        :disabled="signalDisabled"
        :class="['signal-btn', { 'signal-on': rts }]"
        @click="toggleRts"
      >
        RTS
      </el-button>
    </el-button-group>
  </div>
</template>

<style scoped>
.flow-control {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 5px;
}

.signal-group {
  flex: 1;
  display: flex;
}

.signal-btn {
  flex: 1;
}

/* 信号线高电平加重显示 */
.signal-on {
  font-weight: bold;
}
</style>
