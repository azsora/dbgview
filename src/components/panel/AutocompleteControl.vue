<script setup lang="ts">
import { ref, watch } from 'vue';

/*
 * 通用可输入下拉控件（基于 Element Plus el-autocomplete）
 * - 保留下拉建议选择，同时支持手动输入
 * - numberOnly 模式下过滤非数字字符并去除前导零
 */
const props = withDefaults(defineProps<{
  label: string;
  value: string | number;
  options: { label: string; value: string | number }[];
  numberOnly?: boolean;
  placeholder?: string;
}>(), {
  numberOnly: false,
  placeholder: '请选择或输入',
});

const emit = defineEmits<{
  (e: 'update', value: string | number): void;
  (e: 'focus'): void;
}>();

// 输入框当前值（el-autocomplete 需字符串形式）
const inputValue = ref(String(props.value ?? ''));

// 同步外部 value 变化到内部输入框（避免双向覆盖）
watch(() => props.value, (v) => {
  const str = String(v ?? '');
  if (str !== inputValue.value) {
    inputValue.value = str;
  }
});

/**
 * 获取下拉建议列表
 * 空查询返回全部，非空按前缀过滤
 */
function fetchSuggestions(query: string, cb: (items: { value: string }[]) => void) {
  const q = (query ?? '').trim();
  const items = props.options.map((o) => ({ value: String(o.value) }));
  if (!q) {
    cb(items);
    return;
  }
  cb(items.filter((it) => it.value.startsWith(q)));
}

/**
 * 处理输入事件
 * numberOnly 时过滤非数字并去前导零，emit 数值或空字符串
 */
function handleInput(val: string) {
  let cleaned = val;
  if (props.numberOnly) {
    cleaned = cleaned.replace(/[^\d]/g, '');
    if (cleaned.length > 1) {
      cleaned = cleaned.replace(/^0+/, '');
    }
  }
  if (cleaned !== inputValue.value) {
    inputValue.value = cleaned;
  }
  if (props.numberOnly) {
    emit('update', cleaned ? Number(cleaned) : '');
  } else {
    emit('update', cleaned);
  }
}

/**
 * 选中建议项时触发
 */
function handleSelect(item: { value: string }) {
  const v = item.value;
  inputValue.value = v;
  if (props.numberOnly) {
    emit('update', v ? Number(v) : '');
  } else {
    emit('update', v);
  }
}

function handleFocus() {
  emit('focus');
}
</script>

<template>
  <div class="control autocomplete-control">
    <label class="control-label">{{ label }}</label>
    <el-autocomplete
      v-model="inputValue"
      class="control-autocomplete"
      :fetch-suggestions="fetchSuggestions"
      :placeholder="placeholder"
      value-key="value"
      clearable
      @input="handleInput"
      @select="handleSelect"
      @focus="handleFocus"
    />
  </div>
</template>

<style scoped>
.control {
  margin-bottom: 5px;
  display: flex;
  align-items: center;
}

.control-label {
  min-width: 50px;
  font-size: var(--font-size);
  color: var(--text-primary);
  margin-right: 5px;
  flex-shrink: 0;
}

.control-autocomplete {
  flex: 1;
  min-width: 0;
  width: 100%;
}

/* 确保 el-autocomplete 内部输入框撑满 */
.control-autocomplete :deep(.el-input) {
  width: 100%;
}
</style>
