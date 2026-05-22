use serial::{SerialPort, SystemPort};
use std::sync::{Arc, Mutex};
use std::io::{Read, Write};

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

#[derive(Clone, Debug, Copy)]
pub enum DataBits {
    Five,
    Six,
    Seven,
    Eight,
}

#[derive(Clone, Debug, Copy)]
pub enum StopBits {
    One,
    OnePointFive,
    Two,
}

#[derive(Clone, Debug, Copy)]
pub enum Parity {
    None,
    Odd,
    Even,
    Mark,
    Space,
}

#[derive(Clone, Debug, Copy)]
pub enum FlowControl {
    None,
    RtsCts,
    XonXoff,
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
    port: Option<SystemPort>,
    status: SerialStatus,
    config: Option<SerialConfig>,
}

impl SerialManager {
    pub fn new() -> Self {
        Self {
            port: None,
            status: SerialStatus::Disconnected,
            config: None,
        }
    }

    pub fn list_ports() -> Vec<String> {
        serial::available_ports()
            .unwrap_or_default()
            .iter()
            .map(|p| p.port_name.clone())
            .collect()
    }

    pub fn open(&mut self, config: SerialConfig) -> Result<(), String> {
        let port_name = config.port.clone();
        self.status = SerialStatus::Connecting;

        let mut port = serial::open(&port_name).map_err(|e| format!("打开端口失败: {}", e))?;

        // 配置串口参数
        port.reconfigure(&|settings| {
            settings.set_baud_rate(serial::Baud9600)?;
            Ok(())
        })
        .map_err(|e| format!("配置端口失败: {}", e))?;

        port.set_timeout(std::time::Duration::from_millis(100))
            .map_err(|e| format!("设置超时失败: {}", e))?;

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
