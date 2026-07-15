<script setup lang="ts">
defineProps<{
  text: string;
}>();
</script>

<template>
  <n-divider style="font-size: 11px; color: var(--text-muted); margin: 16px 0 8px;">
    {{ text }}
  </n-divider>
</template>

<style scoped>
:deep(.n-divider) {
  font-size: 11px;
  color: var(--text-muted);
}
</style>
