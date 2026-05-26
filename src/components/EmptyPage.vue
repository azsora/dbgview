<script setup lang="ts">
</script>

<template>
  <div class="empty-page">
    <el-empty description="暂无打开的标签页" :image-size="100">
      <template #image>
        <span class="custom-icon">📭</span>
      </template>
      <template #description>
        <span class="empty-text">暂无打开的标签页</span>
      </template>
      <span class="empty-hint">点击右上角 "+" 按钮新建标签</span>
    </el-empty>
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
