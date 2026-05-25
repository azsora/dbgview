<script setup lang="ts">
// 调试器助手内容区
</script>

<template>
  <div class="debugger-content">
    <!-- 调试器内容显示区域（后续扩展） -->
    <div class="placeholder">
      <svg class="placeholder-icon" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20 18c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2H0v2h24v-2h-4zM4 6h16v10H4V6z"/>
      </svg>
      <div class="placeholder-text">调试器功能开发中...</div>
    </div>
  </div>
</template>

<style scoped>
.debugger-content {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.placeholder {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: var(--text-muted);
}

.placeholder-icon {
  width: 48px;
  height: 48px;
  opacity: 0.3;
}

.placeholder-text {
  font-size: 14px;
}
</style>