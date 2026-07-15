import { computed, ref } from 'vue';

/*
 * 波特率选项管理 composable
 * - 预设列表 + 自定义值（localStorage 持久化，跨会话保留）
 * - 模块级 ref：多个串口 Tab 共享同一份自定义列表
 */

// 预设波特率列表（与原静态选项一致）
export const BAUD_RATE_PRESETS = [
  9600, 19200, 38400, 57600, 115200, 230400, 460800, 921600,
];

const STORAGE_KEY = 'customBaudRates';

/**
 * 从 localStorage 读取自定义波特率列表
 */
function loadCustom(): number[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    // 仅保留正整数，过滤异常数据
    return arr.filter((v) => typeof v === 'number' && Number.isInteger(v) && v > 0);
  } catch {
    return [];
  }
}

/**
 * 写入自定义波特率列表
 */
function saveCustom(list: number[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn('Failed to save custom baud rates:', e);
  }
}

// 自定义波特率列表（模块级，跨组件共享）
const customRates = ref<number[]>(loadCustom());

/**
 * 提供波特率下拉选项与自定义值添加方法
 */
export function useBaudRateOptions() {
  // 合并预设与自定义，去重并按数值升序
  const options = computed(() => {
    const all = Array.from(new Set([...BAUD_RATE_PRESETS, ...customRates.value]));
    all.sort((a, b) => a - b);
    return all.map((v) => ({ label: String(v), value: v }));
  });

  /**
   * 添加自定义波特率
   * 仅当为正整数且不在预设中时持久化
   */
  function addCustomBaudRate(rate: number) {
    if (typeof rate !== 'number' || !Number.isInteger(rate) || rate <= 0) return;
    if (BAUD_RATE_PRESETS.includes(rate)) return;
    if (customRates.value.includes(rate)) return;
    customRates.value = [...customRates.value, rate];
    saveCustom(customRates.value);
  }

  return { options, addCustomBaudRate };
}
