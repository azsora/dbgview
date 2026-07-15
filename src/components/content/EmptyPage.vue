<script setup lang="ts">
</script>

<template>
  <div class="empty-page">
    <n-empty description="暂无打开的标签页" size="large">
      <template #icon>
        <span class="custom-icon">📭</span>
      </template>
      <template #extra>
        <span class="empty-hint">点击右上角 "+" 按钮新建标签</span>
      </template>
    </n-empty>
  </div>
</template>

<style scoped>
.empty-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.custom-icon {
  font-size: 48px;
}

.empty-text {
  font-size: 16px;
  color: var(--text-muted);
}

.empty-hint {
  font-size: 13px;
  color: var(--text-muted);
  margin-top: 8px;
}
</style>
