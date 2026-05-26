<script setup lang="ts">
defineProps<{
  text: string;
}>();
</script>

<template>
  <el-divider border-style="dashed">{{ text }}</el-divider>
</template>

<style scoped>
:deep(.el-divider) {
  margin: 16px 0 8px;
  font-size: 11px;
  color: var(--text-muted);
}
</style>
