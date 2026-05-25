import { reactive, computed } from 'vue';
import { invoke } from '@tauri-apps/api/core';
import { eventBus } from '../eventBus';

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface SerialTabState {
  connectionStatus: ConnectionStatus;
  errorMessage?: string;
  receiveBuffer: string;     // 展示用的格式化字符串
  receiveLines: {            // 原始数据行
    timestamp: string;
    data: number[];          // 原始字节数组
    isTx: boolean;           // 是否为发送数据
  }[];
  receiveMode: 'HEX' | 'ASCII';
  sendMode: 'HEX' | 'ASCII';
  autoScroll: boolean;
  timestampEnabled: boolean;
  workMode: 'standard' | 'terminal';
  sendHistory: string[];
  portList: string[];
  txBytes: number;     // 发送字节总数
  rxBytes: number;     // 接收字节总数
  currentRxBytes: number;  // 当前帧字节数
  sendInput: string;    // 发送输入框内容
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
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Failed to save serial state:', e);
  }
}

const defaultState: SerialTabState = {
  connectionStatus: 'disconnected',
  errorMessage: undefined,
  receiveBuffer: '',
  receiveLines: [],
  receiveMode: 'HEX',
  sendMode: 'HEX',
  autoScroll: true,
  timestampEnabled: true,
  workMode: 'standard',
  sendHistory: [],
  portList: [],
  txBytes: 0,
  rxBytes: 0,
  currentRxBytes: 0,
  sendInput: '',
  ...loadState(),
};

const state = reactive<SerialTabState>(defaultState);

// 端口关闭标志，用于阻止关闭后继续读取
let portClosingFlag = false;

export function isPortClosing() {
  return portClosingFlag;
}

// 页面卸载前保存状态
window.addEventListener('beforeunload', () => {
  saveState(state);
});

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
  portClosingFlag = true;
  try {
    await invoke('serial_close');
    state.connectionStatus = 'disconnected';
    eventBus.emit('serial-disconnected', {});
  } catch (e) {
    state.errorMessage = String(e);
  } finally {
    // 延迟清除关闭标志，确保读取循环已停止
    setTimeout(() => { portClosingFlag = false; }, 300);
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

    // 累加发送字节数
    state.txBytes += bytes.length;

    // 添加到历史
    if (state.sendHistory.length >= 10) {
      state.sendHistory.shift();
    }
    state.sendHistory.push(data);

    // 显示发送数据
    appendSend(data, bytes);

    saveState(state);
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

function formatLine(timestamp: string, data: number[], isTx: boolean, mode: 'HEX' | 'ASCII'): string {
  const hexStr = data.map(b => b.toString(16).padStart(2, '0')).join(' ');
  const asciiStr = data.map(b => b >= 32 && b < 127 ? String.fromCharCode(b) : '.').join('');
  const prefix = timestamp + (isTx ? 'Tx-> ' : 'Rx-> ');

  if (mode === 'HEX') {
    return `${prefix}${hexStr}`;
  } else {
    return `${prefix}${asciiStr}`;
  }
}

// 追加单行到显示缓冲区（不重建全文）
function appendToBuffer(formattedLine: string) {
  if (state.receiveBuffer) {
    state.receiveBuffer += '\n' + formattedLine;
  } else {
    state.receiveBuffer = formattedLine;
  }
}

function appendReceive(data: string, rxData?: number[]) {
  const timestamp = state.timestampEnabled ? `[${formatTime(new Date())}] ` : '';
  // rxData 是原始字节数组，直接使用；否则从 data 解析
  const bytes = rxData ?? parseReceivedData(data);
  state.receiveLines.push({
    timestamp,
    data: bytes,
    isTx: false,
  });
  // 限制最大行数，避免内存问题
  if (state.receiveLines.length > 1000) {
    state.receiveLines.shift();
    // 移除首行后也要从显示缓冲区移除
    const firstNewline = state.receiveBuffer.indexOf('\n');
    state.receiveBuffer = firstNewline >= 0 ? state.receiveBuffer.slice(firstNewline + 1) : '';
  }
  // 格式化并追加新行到显示缓冲区
  appendToBuffer(formatLine(timestamp, bytes, false, state.receiveMode));
  // 累加接收字节数
  if (rxData) {
    state.currentRxBytes = rxData.length;
    state.rxBytes += rxData.length;
  }
}

function appendSend(_data: string, txData: number[]) {
  const timestamp = state.timestampEnabled ? `[${formatTime(new Date())}] ` : '';
  state.receiveLines.push({
    timestamp,
    data: txData,
    isTx: true,
  });
  // 限制最大行数
  if (state.receiveLines.length > 1000) {
    state.receiveLines.shift();
    const firstNewline = state.receiveBuffer.indexOf('\n');
    state.receiveBuffer = firstNewline >= 0 ? state.receiveBuffer.slice(firstNewline + 1) : '';
  }
  // 格式化并追加新行到显示缓冲区
  appendToBuffer(formatLine(timestamp, txData, true, state.sendMode));
}

function clearReceive() {
  state.receiveBuffer = '';
  state.receiveLines = [];
  state.currentRxBytes = 0;
  state.txBytes = 0;
  state.rxBytes = 0;
}

function resetCounters() {
  state.txBytes = 0;
  state.rxBytes = 0;
  state.currentRxBytes = 0;
}

function resetTxCounter() {
  state.txBytes = 0;
}

function resetRxCounter() {
  state.rxBytes = 0;
  state.currentRxBytes = 0;
}

function setReceiveMode(mode: 'HEX' | 'ASCII') {
  state.receiveMode = mode;
  saveState(state);
}

function setSendMode(mode: 'HEX' | 'ASCII') {
  // 切换到 HEX 模式时，将当前输入内容转换为 HEX 格式
  if (mode === 'HEX' && state.sendMode !== 'HEX') {
    const bytes = stringToBytes(state.sendInput);
    state.sendInput = bytes.map(b => b.toString(16).padStart(2, '0')).join(' ');
  }
  // 切换到 ASCII 模式时，尝试将 HEX 内容转回 ASCII
  else if (mode === 'ASCII' && state.sendMode !== 'ASCII') {
    const bytes = hexToBytes(state.sendInput);
    state.sendInput = bytes.map(b => b >= 32 && b < 127 ? String.fromCharCode(b) : '.').join('');
  }
  state.sendMode = mode;
  saveState(state);
}

function setWorkMode(mode: 'standard' | 'terminal') {
  state.workMode = mode;
  saveState(state);
}

function toggleTimestamp() {
  state.timestampEnabled = !state.timestampEnabled;
  saveState(state);
}

function toggleAutoScroll() {
  state.autoScroll = !state.autoScroll;
  saveState(state);
}

function setSendInput(value: string) {
  state.sendInput = value;
  saveState(state);
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

// 从接收到的字符串解析出字节数组
function parseReceivedData(data: string): number[] {
  // 格式为: "hex |ascii|" 或纯 hex
  const hexMatch = data.match(/^([0-9a-fA-F\s]+)\s*\|(.*)\|$/);
  if (hexMatch) {
    // 解析 hex 部分
    const hexStr = hexMatch[1].replace(/\s/g, '');
    const bytes: number[] = [];
    for (let i = 0; i < hexStr.length; i += 2) {
      const byte = parseInt(hexStr.substr(i, 2), 16);
      if (!isNaN(byte)) bytes.push(byte);
    }
    return bytes;
  }
  // 尝试直接解析为 hex 字符串
  const cleaned = data.replace(/\s/g, '');
  if (/^[0-9a-fA-F]+$/.test(cleaned) && cleaned.length % 2 === 0) {
    const bytes: number[] = [];
    for (let i = 0; i < cleaned.length; i += 2) {
      bytes.push(parseInt(cleaned.substr(i, 2), 16));
    }
    return bytes;
  }
  // 否则按 ASCII 解析
  return Array.from(data).map(c => c.charCodeAt(0));
}

function formatTime(date: Date): string {
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}.${date.getMilliseconds().toString().padStart(3, '0')}`;
}

export const serialStore = {
  state,
  isConnected,
  isConnecting,
  isPortClosing,
  listPorts,
  openPort,
  closePort,
  sendData,
  readData,
  appendReceive,
  appendSend,
  clearReceive,
  setReceiveMode,
  setSendMode,
  setWorkMode,
  toggleTimestamp,
  toggleAutoScroll,
  resetCounters,
  resetTxCounter,
  resetRxCounter,
  setSendInput,
};
