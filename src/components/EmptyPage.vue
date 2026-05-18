<script setup lang="ts">
</script>

<template>
  <div class="empty-page">
    <div class="empty-icon">📭</div>
    <div class="empty-text">暂无打开的标签页</div>
    <div class="empty-hint">点击右上角 "+" 按钮新建标签</div>
  </div>
</template>

<style scoped>
.empty-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-text {
  font-size: 16px;
  margin-bottom: 8px;
}

.empty-hint {
  font-size: 13px;
}
</style>
