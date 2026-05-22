use serialport::SerialPort;
use std::io::{Read, Write};

// 重新导出 serialport 的类型以便其他模块使用
pub use serialport::{DataBits, FlowControl, Parity, StopBits};

// 串口配置结构
#[derive(Clone, Debug)]
pub struct SerialConfig {
    pub port: String,
    pub baud_rate: u32,
    pub data_bits: DataBits,
    pub stop_bits: StopBits,
    pub parity: Parity,
    pub flow_control: FlowControl,
}

// 串口状态
#[derive(Clone, Debug)]
pub enum SerialStatus {
    Disconnected,
    Connecting,
    Connected,
    Error(String),
}

// 串口管理器
pub struct SerialManager {
    port: Option<BoxSerialPort>,
    status: SerialStatus,
    config: Option<SerialConfig>,
}

// 使用 Box 包装 serialport::SerialPort 以实现 trait 对象
type BoxSerialPort = Box<dyn SerialPort>;

impl SerialManager {
    pub fn new() -> Self {
        Self {
            port: None,
            status: SerialStatus::Disconnected,
            config: None,
        }
    }

    pub fn list_ports() -> Vec<String> {
        // 使用 serialport 库的 available_ports() 枚举所有可用端口
        match serialport::available_ports() {
            Ok(ports) => ports.into_iter().map(|p| p.port_name).collect(),
            Err(_) => Vec::new(),
        }
    }

    pub fn open(&mut self, config: SerialConfig) -> Result<(), String> {
        let port_name = config.port.clone();
        self.status = SerialStatus::Connecting;

        // 使用 serialport 库打开端口
        let port = serialport::new(&port_name, config.baud_rate)
            .data_bits(config.data_bits)
            .stop_bits(config.stop_bits)
            .parity(config.parity)
            .flow_control(config.flow_control)
            .timeout(std::time::Duration::from_millis(100))
            .open()
            .map_err(|e| format!("打开端口失败: {}", e))?;

        self.port = Some(port);
        self.config = Some(config);
        self.status = SerialStatus::Connected;
        Ok(())
    }

    pub fn close(&mut self) -> Result<(), String> {
        self.port = None;
        self.config = None;
        self.status = SerialStatus::Disconnected;
        Ok(())
    }

    pub fn write(&mut self, data: &[u8]) -> Result<usize, String> {
        match &mut self.port {
            Some(port) => port.write(data).map_err(|e| format!("写入失败: {}", e)),
            None => Err("端口未打开".to_string()),
        }
    }

    pub fn read(&mut self) -> Result<Vec<u8>, String> {
        match &mut self.port {
            Some(port) => {
                let mut buf = vec![0u8; 1024];
                match port.read(&mut buf) {
                    Ok(n) => Ok(buf[..n].to_vec()),
                    Err(ref e) if e.kind() == std::io::ErrorKind::TimedOut => Ok(vec![]),
                    Err(e) => Err(format!("读取失败: {}", e)),
                }
            }
            None => Err("端口未打开".to_string()),
        }
    }

    pub fn is_open(&self) -> bool {
        self.port.is_some()
    }

    pub fn get_status(&self) -> &SerialStatus {
        &self.status
    }
}