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
  sessionActive: boolean;
}

// 调试器状态
const state = reactive<DebuggerState>({
  connectionStatus: 'disconnected',
  errorMessage: undefined,
  debuggerList: [],
  chipList: [],
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

// 获取支持的芯片列表
async function listChips(): Promise<ChipInfo[]> {
  try {
    const list = await invoke<ChipInfo[]>('debugger_list_chips');
    state.chipList = list;
    return list;
  } catch (e) {
    console.error('Failed to list chips:', e);
    state.chipList = [];
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
  connect,
  disconnect,
  readDebugData,
};