<script setup lang="ts">
import { message } from '../../main';

// 导出 showToast 方法供外部调用
// 使用 Naive UI 全局离散 API（createDiscreteApi），与原 ElMessage 调用风格一致
const showToast = (text: string, type: 'success' | 'warning' | 'error' | 'info' = 'error', duration = 3000) => {
  message.create(text, { type, duration });
};

// 暴露给外部使用
defineExpose({
  showToast,
});
</script>

<template>
  <!-- 不再需要本地模板，Naive UI message 会在全局离散容器中渲染 -->
</template>