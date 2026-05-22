<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { serialStore } from '../../stores/serialStore';

const receiveArea = ref<HTMLElement | null>(null);
const sendInput = ref('');

// 轮询读取数据
let readTimer: ReturnType<typeof setInterval> | null = null;

// 接收区是否有数据
const hasData = computed(() => {
  return serialStore.state.receiveBuffer && serialStore.state.receiveBuffer.length > 0;
});

const isStandardMode = computed(() => serialStore.state.workMode === 'standard');
const isConnected = computed(() => serialStore.isConnected.value);

onMounted(() => {
  if (isConnected.value) {
    startReading();
  }
});

onUnmounted(() => {
  stopReading();
});

watch(isConnected, (connected) => {
  if (connected) {
    startReading();
  } else {
    stopReading();
  }
});

// 自动滚动
watch(() => serialStore.state.receiveBuffer, () => {
  if (serialStore.state.autoScroll) {
    nextTick(() => {
      if (receiveArea.value) {
        receiveArea.value.scrollTop = receiveArea.value.scrollHeight;
      }
    });
  }
});

function startReading() {
  if (readTimer) return;
  readTimer = setInterval(async () => {
    if (!serialStore.isConnected.value) return;
    const data = await serialStore.readData();
    if (data) {
      serialStore.appendReceive(data);
    }
  }, 100);
}

function stopReading() {
  if (readTimer) {
    clearInterval(readTimer);
    readTimer = null;
  }
}

async function handleSend() {
  if (!sendInput.value.trim()) return;
  await serialStore.sendData(sendInput.value);
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleSend();
  }
}

function clearDisplay() {
  serialStore.clearReceive();
}
</script>

<template>
  <div class="serial-content">
    <!-- 数据接收显示区 -->
    <div
      ref="receiveArea"
      class="receive-area"
      :class="{ 'empty': !hasData }"
    >
      <pre v-if="hasData" v-text="serialStore.state.receiveBuffer"></pre>
      <div v-else class="empty-state">
        <svg class="empty-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14l-5-5 1.41-1.41L12 14.17l7.59-7.59L21 8l-9 9z"/>
        </svg>
        <span>无数据</span>
      </div>
    </div>

    <!-- 发送区（标准模式） -->
    <div v-if="isStandardMode" class="send-area">
      <textarea
        v-model="sendInput"
        class="send-input"
        placeholder="输入发送内容..."
        rows="1"
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

    <!-- 控制栏 -->
    <div class="control-bar">
      <label class="control-item">
        <input
          type="checkbox"
          :checked="serialStore.state.timestampEnabled"
          @change="serialStore.toggleTimestamp()"
        />
        <span>时间戳</span>
      </label>

      <div class="control-item">
        <span class="mode-label">模式:</span>
        <select
          :value="serialStore.state.workMode"
          @change="serialStore.setWorkMode(($event.target as HTMLSelectElement).value as 'standard' | 'terminal')"
        >
          <option value="standard">标准发送</option>
          <option value="terminal">终端模式</option>
        </select>
      </div>

      <label class="control-item">
        <input
          type="checkbox"
          :checked="serialStore.state.autoScroll"
          @change="serialStore.toggleAutoScroll()"
        />
        <span>自动滚动</span>
      </label>

      <div class="control-item">
        <span class="mode-label">显示:</span>
        <select
          :value="serialStore.state.receiveMode"
          @change="serialStore.setReceiveMode(($event.target as HTMLSelectElement).value as 'HEX' | 'ASCII')"
        >
          <option value="HEX">HEX</option>
          <option value="ASCII">ASCII</option>
        </select>
      </div>

      <button class="clear-btn" @click="clearDisplay">清除</button>
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
  gap: 16px;
  padding: 8px 12px;
  border-top: 1px solid var(--border-color);
  background: var(--bg-tertiary);
  font-size: 13px;
}

.control-item {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
}

.control-item input[type="checkbox"] {
  cursor: pointer;
}

.control-item select {
  padding: 2px 4px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background: var(--bg-primary);
  color: var(--text-primary);
}

.mode-label {
  color: var(--text-muted);
}

.clear-btn {
  margin-left: auto;
  padding: 4px 12px;
  background: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  cursor: pointer;
}

.clear-btn:hover {
  background: var(--bg-hover);
}
</style>
