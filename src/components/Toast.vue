<script setup lang="ts">
import { ElMessage } from 'element-plus';

// 导出 showToast 方法供外部调用
const showToast = (message: string, type: 'success' | 'warning' | 'error' | 'info' = 'error', duration = 3000) => {
  ElMessage({
    message,
    type,
    duration,
  });
};

// 暴露给外部使用
defineExpose({
  showToast,
});
</script>

<template>
  <!-- 不再需要本地模板，ElMessage 会自动渲染 -->
</template>