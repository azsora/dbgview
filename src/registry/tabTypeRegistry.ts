// src/registry/tabTypeRegistry.ts
import type { TabTypeDefinition, TabConfigItem } from '../types/tab';

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

// 内置 Tab 类型定义
const builtinTypes: TabTypeDefinition[] = [
  {
    type: 'debugger',
    title: '调试器',
    configItems: [
      configItemTemplates.chipModel,
      configItemTemplates.connectionAddress,
      configItemTemplates.enableSwitch,
    ],
    panelComponent: 'DebuggerPanel',
    contentComponent: 'DebuggerContent',
  },
  {
    type: 'memory',
    title: '内存查看',
    configItems: [
      configItemTemplates.connectionAddress,
      {
        key: 'memoryAddress',
        label: '内存地址',
        type: 'input',
        defaultValue: '0x20000000',
      },
      {
        key: 'memorySize',
        label: '显示大小',
        type: 'select',
        options: [
          { label: '16 字节', value: 16 },
          { label: '32 字节', value: 32 },
          { label: '64 字节', value: 64 },
        ],
        defaultValue: 32,
      },
    ],
    panelComponent: 'MemoryPanel',
    contentComponent: 'MemoryContent',
  },
  {
    type: 'register',
    title: '寄存器',
    configItems: [
      configItemTemplates.enableSwitch,
      configItemTemplates.sampleThreshold,
    ],
    panelComponent: 'RegisterPanel',
    contentComponent: 'RegisterContent',
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