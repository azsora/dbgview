import { reactive, computed } from 'vue';
import { invoke } from '@tauri-apps/api/core';
import { eventBus } from '../eventBus';

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface SerialTabState {
  connectionStatus: ConnectionStatus;
  errorMessage?: string;
  receiveBuffer: string;
  receiveMode: 'HEX' | 'ASCII';
  sendMode: 'HEX' | 'ASCII';
  autoScroll: boolean;
  timestampEnabled: boolean;
  workMode: 'standard' | 'terminal';
  sendHistory: string[];
}

const STORAGE_KEY = 'serialState';

function loadState(): Partial<SerialTabState> {
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

function saveState(state: SerialTabState) {
  try {
    const { receiveBuffer, ...persistable } = state;
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(persistable));
  } catch (e) {
    console.warn('Failed to save serial state:', e);
  }
}

const defaultState: SerialTabState = {
  connectionStatus: 'disconnected',
  errorMessage: undefined,
  receiveBuffer: '',
  receiveMode: 'HEX',
  sendMode: 'HEX',
  autoScroll: true,
  timestampEnabled: true,
  workMode: 'standard',
  sendHistory: [],
  ...loadState(),
};

const state = reactive<SerialTabState>(defaultState);

// 自动保存（排除 receiveBuffer）
let saveTimer: ReturnType<typeof setTimeout> | null = null;
function scheduleSave() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => saveState(state), 500);
}

// 计算属性
const isConnected = computed(() => state.connectionStatus === 'connected');
const isConnecting = computed(() => state.connectionStatus === 'connecting');

// 串口操作
async function listPorts(): Promise<string[]> {
  try {
    return await invoke<string[]>('serial_list_ports');
  } catch (e) {
    console.error('Failed to list ports:', e);
    return [];
  }
}

async function openPort(config: {
  port: string;
  baud_rate: number;
  data_bits: number;
  stop_bits: number;
  parity: string;
  flow_control: string;
}) {
  state.connectionStatus = 'connecting';
  state.errorMessage = undefined;

  try {
    await invoke('serial_open', {
      port: config.port,
      baudRate: config.baud_rate,
      dataBits: config.data_bits,
      stopBits: config.stop_bits,
      parity: config.parity,
      flowControl: config.flow_control,
    });
    state.connectionStatus = 'connected';
    eventBus.emit('serial-connected', { port: config.port });
  } catch (e) {
    state.connectionStatus = 'error';
    state.errorMessage = String(e);
    eventBus.emit('serial-error', { error: String(e) });
  }
}

async function closePort() {
  try {
    await invoke('serial_close');
    state.connectionStatus = 'disconnected';
    eventBus.emit('serial-disconnected', {});
  } catch (e) {
    state.errorMessage = String(e);
  }
}

async function sendData(data: string): Promise<boolean> {
  if (!isConnected.value) return false;

  try {
    let bytes: number[];
    if (state.sendMode === 'HEX') {
      bytes = hexToBytes(data);
    } else {
      bytes = stringToBytes(data);
    }

    await invoke('serial_write', { data: bytes });

    // 添加到历史
    if (state.sendHistory.length >= 10) {
      state.sendHistory.shift();
    }
    state.sendHistory.push(data);

    scheduleSave();
    return true;
  } catch (e) {
    state.errorMessage = `发送失败: ${e}`;
    return false;
  }
}

async function readData(): Promise<string> {
  try {
    const bytes: number[] = await invoke('serial_read');
    if (bytes.length === 0) return '';
    return bytesToString(bytes);
  } catch {
    return '';
  }
}

function appendReceive(data: string) {
  const timestamp = state.timestampEnabled ? `[${formatTime(new Date())}] ` : '';
  state.receiveBuffer += timestamp + data + '\n';
}

function clearReceive() {
  state.receiveBuffer = '';
}

function setReceiveMode(mode: 'HEX' | 'ASCII') {
  state.receiveMode = mode;
  scheduleSave();
}

function setSendMode(mode: 'HEX' | 'ASCII') {
  state.sendMode = mode;
  scheduleSave();
}

function setWorkMode(mode: 'standard' | 'terminal') {
  state.workMode = mode;
  scheduleSave();
}

function toggleTimestamp() {
  state.timestampEnabled = !state.timestampEnabled;
  scheduleSave();
}

function toggleAutoScroll() {
  state.autoScroll = !state.autoScroll;
  scheduleSave();
}

// 辅助函数
function hexToBytes(hex: string): number[] {
  const cleaned = hex.replace(/\s/g, '');
  const bytes: number[] = [];
  for (let i = 0; i < cleaned.length; i += 2) {
    bytes.push(parseInt(cleaned.substr(i, 2), 16));
  }
  return bytes;
}

function bytesToString(bytes: number[]): string {
  const hex = bytes.map(b => b.toString(16).padStart(2, '0')).join(' ');
  const ascii = bytes.map(b => b >= 32 && b < 127 ? String.fromCharCode(b) : '.').join('');
  return `${hex} |${ascii}|`;
}

function stringToBytes(str: string): number[] {
  return Array.from(str).map(c => c.charCodeAt(0));
}

function formatTime(date: Date): string {
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}.${date.getMilliseconds().toString().padStart(3, '0')}`;
}

export const serialStore = {
  state,
  isConnected,
  isConnecting,
  listPorts,
  openPort,
  closePort,
  sendData,
  readData,
  appendReceive,
  clearReceive,
  setReceiveMode,
  setSendMode,
  setWorkMode,
  toggleTimestamp,
  toggleAutoScroll,
};
