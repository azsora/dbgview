<script setup lang="ts">
import { ref, watch, computed } from 'vue';

/*
 * 通用可输入下拉控件（基于 Naive UI n-auto-complete）
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

// 输入框当前值（n-auto-complete 需字符串形式）
const inputValue = ref(String(props.value ?? ''));

// 同步外部 value 变化到内部输入框（避免双向覆盖）
watch(() => props.value, (v) => {
  const str = String(v ?? '');
  if (str !== inputValue.value) {
    inputValue.value = str;
  }
});

/**
 * n-auto-complete 的渲染函数：根据当前输入 query 返回下拉项
 * - 空 query：返回全部
 * - 非空：按 value 前缀过滤
 */
const suggestionRender = computed(() => (query: string) => {
  const q = (query ?? '').trim();
  const items = props.options.map((o) => ({ label: String(o.value), value: String(o.value) }));
  if (!q) return items;
  return items.filter((it) => it.value.startsWith(q));
});

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
function handleSelect(value: string | number) {
  const v = String(value);
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
    <n-auto-complete
      v-model:value="inputValue"
      class="control-autocomplete"
      :options="suggestionRender"
      :placeholder="placeholder"
      :clearable="true"
      :on-select="handleSelect"
      @update:value="handleInput"
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
</style>
