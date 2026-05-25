// src/registry/tabTypeRegistry.ts
import type { TabTypeDefinition } from '../types/tab';

// 内置配置项模板
export const configItemTemplates = {
  // 芯片型号选择
  chipModel: {
    key: 'chipModel',
    label: '芯片型号',
    type: 'select' as const,
    options: [
      { label: 'STM32F103', value: 'stm32f103' },
      { label: 'STM32F407', value: 'stm32f407' },
      { label: 'STM32F429', value: 'stm32f429' },
    ],
    defaultValue: 'stm32f103',
  },
  // 连接地址
  connectionAddress: {
    key: 'connectionAddress',
    label: '连接地址',
    type: 'input' as const,
    defaultValue: '192.168.1.100',
  },
  // 使能开关
  enableSwitch: {
    key: 'enabled',
    label: '使能调试',
    type: 'switch' as const,
    defaultValue: true,
  },
  // 采样阈值
  sampleThreshold: {
    key: 'sampleThreshold',
    label: '采样阈值',
    type: 'slider' as const,
    min: 0,
    max: 100,
    defaultValue: 50,
  },
};

// 串口配置项模板
export const serialConfigTemplates = {
  port: {
    key: 'port',
    label: '端口',
    type: 'select' as const,
    options: [] as { label: string; value: string }[],
    defaultValue: '',
  },
  baudRate: {
    key: 'baudRate',
    label: '波特率',
    type: 'select' as const,
    options: [
      { label: '9600', value: 9600 },
      { label: '19200', value: 19200 },
      { label: '38400', value: 38400 },
      { label: '57600', value: 57600 },
      { label: '115200', value: 115200 },
      { label: '230400', value: 230400 },
      { label: '460800', value: 460800 },
      { label: '921600', value: 921600 },
    ],
    defaultValue: 115200,
  },
  dataBits: {
    key: 'dataBits',
    label: '数据位',
    type: 'select' as const,
    options: [
      { label: '5', value: 5 },
      { label: '6', value: 6 },
      { label: '7', value: 7 },
      { label: '8', value: 8 },
    ],
    defaultValue: 8,
  },
  stopBits: {
    key: 'stopBits',
    label: '停止位',
    type: 'select' as const,
    options: [
      { label: '1', value: 1 },
      { label: '1.5', value: 1.5 },
      { label: '2', value: 2 },
    ],
    defaultValue: 1,
  },
  parity: {
    key: 'parity',
    label: '校验位',
    type: 'select' as const,
    options: [
      { label: 'None', value: 'None' },
      { label: 'Odd', value: 'Odd' },
      { label: 'Even', value: 'Even' },
      { label: 'Mark', value: 'Mark' },
      { label: 'Space', value: 'Space' },
    ],
    defaultValue: 'None',
  },
  flowControl: {
    key: 'flowControl',
    label: '流控',
    type: 'select' as const,
    options: [
      { label: 'None', value: 'None' },
      { label: 'RTS/CTS', value: 'RTS/CTS' },
      { label: 'XON/XOFF', value: 'XON/XOFF' },
    ],
    defaultValue: 'None',
  },
};

// TCP/UDP 配置模板
export const tcpUdpConfigTemplates = {
  ip: {
    key: 'ip',
    label: 'IP 地址',
    type: 'input' as const,
    defaultValue: '192.168.1.100',
  },
  port: {
    key: 'port',
    label: '端口',
    type: 'input' as const,
    defaultValue: '8080',
  },
  protocol: {
    key: 'protocol',
    label: '协议',
    type: 'select' as const,
    options: [
      { label: 'TCP', value: 'TCP' },
      { label: 'UDP', value: 'UDP' },
    ],
    defaultValue: 'TCP',
  },
};

// 内置 Tab 类型定义
const builtinTypes: TabTypeDefinition[] = [
  // 串口助手
  {
    type: 'serial-assistant',
    title: '串口助手',
    icon: '📎',
    configItems: [
      serialConfigTemplates.port,
      serialConfigTemplates.baudRate,
      serialConfigTemplates.dataBits,
      serialConfigTemplates.stopBits,
      serialConfigTemplates.parity,
      serialConfigTemplates.flowControl,
    ],
    panelComponent: 'SerialPanel',
    contentComponent: 'SerialContent',
    leftPanelPinned: true,
    rightPanelPinned: false,
  },
  // 调试器助手
  {
    type: 'debugger-assistant',
    title: '调试器助手',
    icon: '🔧',
    configItems: [
      configItemTemplates.chipModel,
      configItemTemplates.connectionAddress,
      configItemTemplates.enableSwitch,
      configItemTemplates.sampleThreshold,
    ],
    panelComponent: 'DebuggerPanel',
    contentComponent: 'DebuggerContent',
    leftPanelPinned: true,
    rightPanelPinned: false,
  },
  // BLE 助手
  {
    type: 'ble-assistant',
    title: 'BLE助手',
    icon: '📱',
    configItems: [],
    panelComponent: 'BlePanel',
    contentComponent: 'BleContent',
    leftPanelPinned: true,
    rightPanelPinned: false,
  },
  // TCP 助手
  {
    type: 'tcp-assistant',
    title: 'TCP助手',
    icon: '🌐',
    configItems: [
      tcpUdpConfigTemplates.ip,
      tcpUdpConfigTemplates.port,
      tcpUdpConfigTemplates.protocol,
    ],
    panelComponent: 'TcpPanel',
    contentComponent: 'TcpContent',
    leftPanelPinned: true,
    rightPanelPinned: false,
  },
];

// 注册表
const registry = new Map<string, TabTypeDefinition>();

// 初始化注册表
function init() {
  builtinTypes.forEach(type => {
    registry.set(type.type, type);
  });
}

init();

export function registerTabType(definition: TabTypeDefinition) {
  registry.set(definition.type, definition);
}

export function getTabType(type: string): TabTypeDefinition | undefined {
  return registry.get(type);
}

export function getAllTabTypes(): TabTypeDefinition[] {
  return Array.from(registry.values());
}

export function generateTabTitle(type: string): string {
  const definition = getTabType(type);
  if (!definition) return type;

  // 检查已有标题
  // 标题生成逻辑在 tabStore 中处理
  return definition.title;
}