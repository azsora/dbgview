import { reactive } from 'vue';

export type ConnectionType = 'serial' | 'debugger' | 'ble' | 'tcp-udp';

export interface DebuggerTabState {
  connectionType: ConnectionType;
  serialConfig: {
    port: string;
    baudRate: number;
    dataBits: number;
    stopBits: number;
    parity: string;
    flowControl: string;
  };
  debuggerConfig: {
    chipModel: string;
    connectionAddress: string;
    enabled: boolean;
    sampleThreshold: number;
  };
  bleConfig: Record<string, never>;
  tcpUdpConfig: {
    ip: string;
    port: string;
    protocol: 'TCP' | 'UDP';
  };
}

const defaultState: DebuggerTabState = {
  connectionType: 'serial',
  serialConfig: {
    port: '',
    baudRate: 115200,
    dataBits: 8,
    stopBits: 1,
    parity: 'None',
    flowControl: 'None',
  },
  debuggerConfig: {
    chipModel: 'stm32f103',
    connectionAddress: '192.168.1.100',
    enabled: true,
    sampleThreshold: 50,
  },
  bleConfig: {},
  tcpUdpConfig: {
    ip: '192.168.1.100',
    port: '8080',
    protocol: 'TCP',
  },
};

const state = reactive<DebuggerTabState>(defaultState);

export function setConnectionType(type: ConnectionType) {
  state.connectionType = type;
}

export function updateSerialConfig(config: Partial<DebuggerTabState['serialConfig']>) {
  Object.assign(state.serialConfig, config);
}

export function updateDebuggerConfig(config: Partial<DebuggerTabState['debuggerConfig']>) {
  Object.assign(state.debuggerConfig, config);
}

export function updateTcpUdpConfig(config: Partial<DebuggerTabState['tcpUdpConfig']>) {
  Object.assign(state.tcpUdpConfig, config);
}

export const debuggerStore = {
  state,
  setConnectionType,
  updateSerialConfig,
  updateDebuggerConfig,
  updateTcpUdpConfig,
};