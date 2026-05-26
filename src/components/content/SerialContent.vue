<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { listen } from '@tauri-apps/api/event';
import { serialStore } from '../../stores/serialStore';

const receiveArea = ref<HTMLElement | null>(null);
const autoScroll = ref(true);  // 自动滚动，默认开启

let unlisten: (() => void) | null = null;

// 接收区是否有数据
const hasData = computed(() => {
  return serialStore.state.receiveBuffer && serialStore.state.receiveBuffer.length > 0;
});

const isStandardMode = computed(() => serialStore.state.workMode === 'standard');
const isTerminalMode = computed(() => serialStore.state.workMode === 'terminal');
const isConnected = computed(() => serialStore.isConnected.value);

// 事件处理函数引用（用于移除监听）
function onSerialData(payload: number[]) {
  if (serialStore.isPortClosing()) return;
  const bytes = payload;
  if (bytes.length === 0) return;
  const str = bytesToString(bytes);
  serialStore.appendReceive(str, bytes);
}

onMounted(async () => {
  // 监听 Tauri 串口数据事件
  unlisten = await listen<number[]>('serial-data', (event) => {
    onSerialData(event.payload);
  });
});

onUnmounted(() => {
  if (unlisten) {
    unlisten();
  }
});

// 自动滚动：当 receiveBuffer 更新且滚动条在底部时自动滚动
watch(() => serialStore.state.receiveBuffer, () => {
  if (autoScroll.value && receiveArea.value) {
    nextTick(() => {
      if (receiveArea.value) {
        receiveArea.value.scrollTop = receiveArea.value.scrollHeight;
      }
    });
  }
});

// 辅助函数：字节转显示字符串
function bytesToString(bytes: number[]): string {
  const hex = bytes.map(b => b.toString(16).padStart(2, '0')).join(' ');
  const ascii = bytes.map(b => b >= 32 && b < 127 ? String.fromCharCode(b) : '.').join('');
  return `${hex} |${ascii}|`;
}

// 检测用户是否手动滚动，如果向上滚动则关闭自动滚动
function handleScroll() {
  if (!receiveArea.value) return;
  const { scrollTop, scrollHeight, clientHeight } = receiveArea.value;
  // 如果滚动条不在底部（超过 100px 的容忍范围），关闭自动滚动
  if (scrollHeight - scrollTop - clientHeight > 100) {
    autoScroll.value = false;
  }
}

// 恢复自动滚动（滚动到底部）
function restoreAutoScroll() {
  autoScroll.value = true;
  nextTick(() => {
    if (receiveArea.value) {
      receiveArea.value.scrollTop = receiveArea.value.scrollHeight;
    }
  });
}

async function handleSend() {
  const input = serialStore.state.sendInput;
  if (!input.trim()) return;
  await serialStore.sendData(input);
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleSend();
  }
}

function clearDisplay() {
  serialStore.clearReceive();
  serialStore.resetCounters();
  autoScroll.value = true;
}

function toggleTimestamp() {
  serialStore.toggleTimestamp();
}

function toggleMode() {
  serialStore.setWorkMode(isStandardMode.value ? 'terminal' : 'standard');
}
</script>

<template>
  <div class="serial-content">
    <!-- 数据接收显示区 -->
    <div
      ref="receiveArea"
      class="receive-area"
      :class="{ 'empty': !hasData }"
      @scroll="handleScroll"
    >
      <pre v-if="hasData" v-html="serialStore.state.receiveBuffer"></pre>
      <div v-else class="empty-state">
        <svg class="empty-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M15 7h-2v2h2V7zm0 4h-2v2h2v-2zm4-4h-2v2h2V7zm0 4h-2v2h2v-2zM3 3h18v18H3V3zm2 2v14h14V5H5z"/>
        </svg>
        <span>无数据</span>
      </div>
    </div>

    <!-- 控制栏 -->
    <div class="control-bar">
      <!-- 时间戳按钮 -->
      <button
        class="ctrl-btn"
        :class="{ active: serialStore.state.timestampEnabled }"
        @click="toggleTimestamp"
        title="时间戳"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
          <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
        </svg>
      </button>

      <!-- 模式切换按钮 -->
      <button
        class="ctrl-btn mode-btn"
        :class="{ active: isTerminalMode }"
        @click="toggleMode"
        title="终端模式"
      >
        >_
      </button>

      <!-- 接收区 HEX/ASCII 切换 -->
      <button
        class="ctrl-btn hex-btn"
        :class="{ active: serialStore.state.receiveMode === 'HEX' }"
        @click="serialStore.setReceiveMode(serialStore.state.receiveMode === 'HEX' ? 'ASCII' : 'HEX')"
        title="接收区显示模式"
      >
        HEX↑
      </button>

      <!-- 发送区 HEX/ASCII 切换 -->
      <button
        class="ctrl-btn hex-btn"
        :class="{ active: serialStore.state.sendMode === 'HEX' }"
        @click="serialStore.setSendMode(serialStore.state.sendMode === 'HEX' ? 'ASCII' : 'HEX')"
        title="发送区显示模式"
      >
        HEX↓
      </button>

      <!-- 清除按钮 -->
      <button
        class="ctrl-btn clear-btn"
        @click="clearDisplay"
        title="清除"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
          <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM8 9h8v10H8V9zm7.5-5l-1-1h-5l-1 1H5v2h14V4h-3.5z"/>
        </svg>
      </button>

      <!-- 自动滚动提示（已内置，隐藏） -->
      <span v-if="!autoScroll" class="auto-scroll-hint" @click="restoreAutoScroll">
        滚动到底部
      </span>
    </div>

    <!-- 发送区（标准模式） -->
    <div v-if="isStandardMode" class="send-area">
      <textarea
        :value="serialStore.state.sendInput"
        class="send-input"
        placeholder="输入发送内容..."
        rows="1"
        @input="serialStore.setSendInput(($event.target as HTMLTextAreaElement).value)"
        @keydown="handleKeydown"
      ></textarea>
      <button
        class="send-btn"
        :disabled="!isConnected"
        @click="handleSend"
      >
        发送
      </button>
    </div>
  </div>
</template>

<style scoped>
.serial-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg-secondary);
}

.receive-area {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  font-family: monospace;
  font-size: 13px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-all;
}

/* Tx 蓝色，Rx 黑色 */
.receive-area :deep(.tx-color) {
  color: #3b82f6;
}

.receive-area :deep(.rx-color) {
  color: var(--text-primary);
}

.receive-area.empty {
  display: flex;
  align-items: center;
  justify-content: center;
}

.receive-area pre {
  margin: 0;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: var(--text-muted);
}

.empty-icon {
  width: 48px;
  height: 48px;
  opacity: 0.3;
}

.send-area {
  display: flex;
  gap: 8px;
  padding: 8px 12px;
  border-top: 1px solid var(--border-color);
  background: var(--bg-tertiary);
}

.send-input {
  flex: 1;
  min-height: 24px;
  max-height: 72px;
  padding: 4px 8px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-family: monospace;
  font-size: 13px;
  resize: none;
  overflow-y: auto;
  field-sizing: content;
}

.send-input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.send-btn {
  padding: 4px 16px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background: var(--bg-primary);
  color: var(--text-secondary);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.send-btn:hover:not(:disabled) {
  border-color: var(--accent-color);
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.control-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-top: 1px solid var(--border-color);
  background: var(--bg-tertiary);
  font-size: 13px;
}

.ctrl-btn {
  padding: 6px 8px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background: var(--bg-primary);
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.ctrl-btn:hover {
  border-color: var(--accent-color);
}

.ctrl-btn.active {
  background: var(--accent-color);
  border-color: var(--accent-color);
  color: white;
}

.mode-select {
  padding: 4px 8px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 12px;
}

.mode-btn {
  font-family: monospace;
  font-size: 14px;
  font-weight: bold;
  padding: 6px 10px;
}

.hex-btn {
  font-family: monospace;
  font-size: 13px;
  padding: 6px 10px;
  min-width: 52px;
}
</style>
