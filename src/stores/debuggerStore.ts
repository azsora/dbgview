import { reactive, computed } from 'vue';
import { invoke } from '@tauri-apps/api/core';
import { eventBus } from '../eventBus';

export interface ChipInfo {
  name: string;
  part_number?: number;
}

export interface DebuggerInfo {
  id: string;
  name: string;
  target: string;
  chipModel?: string;
}

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface DebuggerState {
  connectionStatus: ConnectionStatus;
  errorMessage?: string;
  debuggerList: DebuggerInfo[];
  chipList: ChipInfo[];
  chipListLoaded: boolean;  // 芯片列表是否已加载
  chipListLoading: boolean; // 芯片列表是否正在加载
  sessionActive: boolean;
}

// 调试器状态
const state = reactive<DebuggerState>({
  connectionStatus: 'disconnected',
  errorMessage: undefined,
  debuggerList: [],
  chipList: [],
  chipListLoaded: false,
  chipListLoading: false,
  sessionActive: false,
});

// 计算属性
const isConnected = computed(() => state.connectionStatus === 'connected');
const isConnecting = computed(() => state.connectionStatus === 'connecting');

// 使用 probe-rs 扫描调试器
async function listDebuggers(): Promise<DebuggerInfo[]> {
  try {
    const list = await invoke<DebuggerInfo[]>('debugger_list_probes');
    state.debuggerList = list;
    return list;
  } catch (e) {
    console.error('Failed to list debuggers:', e);
    state.debuggerList = [];
    return [];
  }
}

// 获取支持的芯片列表（带缓存，忽略重复调用）
async function listChips(): Promise<ChipInfo[]> {
  // 已有数据或正在加载中，直接返回
  if (state.chipListLoaded || state.chipListLoading) {
    return state.chipList;
  }

  state.chipListLoading = true;
  console.time('listChips');
  try {
    // 直接获取完整列表（后端已缓存）
    const list = await invoke<ChipInfo[]>('debugger_list_chips');
    console.timeEnd('listChips');
    state.chipList = list;
    state.chipListLoaded = true;
    return list;
  } catch (e) {
    console.timeEnd('listChips');
    console.error('Failed to list chips:', e);
    state.chipList = [];
    return [];
  } finally {
    state.chipListLoading = false;
  }
}

// 搜索芯片（远程过滤）
async function searchChips(keyword: string): Promise<ChipInfo[]> {
  try {
    // 获取完整列表进行过滤（已缓存，不会重复加载）
    const allChips = await listChips();
    if (!keyword) return allChips;
    const query = keyword.toLowerCase();
    return allChips.filter(c => c.name.toLowerCase().includes(query));
  } catch (e) {
    console.error('Failed to search chips:', e);
    return [];
  }
}

// 连接到调试器
async function connect(config: {
  debuggerId: string;
  chipModel?: string;
  enabled?: boolean;
  sampleThreshold?: number;
}): Promise<void> {
  state.connectionStatus = 'connecting';
  state.errorMessage = undefined;

  try {
    await invoke('debugger_connect', {
      debuggerId: config.debuggerId,
      chipModel: config.chipModel,
    });
    state.connectionStatus = 'connected';
    state.sessionActive = config.enabled ?? false;
    eventBus.emit('debugger-connected', { debuggerId: config.debuggerId });
  } catch (e) {
    state.connectionStatus = 'error';
    state.errorMessage = String(e);
    eventBus.emit('debugger-error', { error: String(e) });
  }
}

// 断开调试器连接
async function disconnect(): Promise<void> {
  try {
    await invoke('debugger_disconnect');
    state.connectionStatus = 'disconnected';
    state.sessionActive = false;
    eventBus.emit('debugger-disconnected', {});
  } catch (e) {
    state.errorMessage = String(e);
  }
}

// 读取调试数据
async function readDebugData(): Promise<number[]> {
  try {
    return await invoke<number[]>('debugger_read');
  } catch {
    return [];
  }
}

export const debuggerStore = {
  state,
  isConnected,
  isConnecting,
  listDebuggers,
  listChips,
  searchChips,
  connect,
  disconnect,
  readDebugData,
};