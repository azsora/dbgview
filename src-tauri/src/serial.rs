use log::{info, warn, error};
use serialport::SerialPort;
use std::io::{Read, Write};
use std::sync::{Arc, Mutex, mpsc};
use std::thread;
use std::time::Duration;
use tauri::{AppHandle, Emitter};

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
    port: Option<Arc<Mutex<Option<Box<dyn SerialPort>>>>>,
    status: SerialStatus,
    config: Option<SerialConfig>,
    read_thread_tx: Option<mpsc::Sender<()>>,
}

impl SerialManager {
    pub fn new() -> Self {
        Self {
            port: None,
            status: SerialStatus::Disconnected,
            config: None,
            read_thread_tx: None,
        }
    }

    pub fn list_ports() -> Vec<String> {
        info!("[串口] 开始扫描可用串口...");
        match serialport::available_ports() {
            Ok(ports) => {
                let count = ports.len();
                let port_names: Vec<String> = ports.into_iter().map(|p| p.port_name).collect();
                info!("[串口] 扫描完成，发现 {} 个可用端口: {:?}", count, port_names);
                port_names
            }
            Err(e) => {
                error!("[串口] 扫描端口失败: {}", e);
                Vec::new()
            }
        }
    }

    pub fn open(&mut self, config: SerialConfig) -> Result<(), String> {
        let port_name = config.port.clone();
        info!("[串口] 正在打开端口: {}, 波特率: {}", port_name, config.baud_rate);
        self.status = SerialStatus::Connecting;

        let port = serialport::new(&port_name, config.baud_rate)
            .data_bits(config.data_bits)
            .stop_bits(config.stop_bits)
            .parity(config.parity)
            .flow_control(config.flow_control)
            .timeout(Duration::from_millis(10))
            .open()
            .map_err(|e| {
                error!("[串口] 打开端口 {} 失败: {}", port_name, e);
                format!("打开端口失败: {}", e)
            })?;

        self.port = Some(Arc::new(Mutex::new(Some(port))));
        self.config = Some(config);
        self.status = SerialStatus::Connected;
        info!("[串口] 端口 {} 已成功打开", port_name);
        Ok(())
    }

    pub fn close(&mut self) -> Result<(), String> {
        let port_name = self.config.as_ref().map(|c| c.port.clone()).unwrap_or_default();
        info!("[串口] 正在关闭端口: {}", port_name);

        // 停止读取线程
        if let Some(tx) = self.read_thread_tx.take() {
            let _ = tx.send(());
        }

        self.port = None;
        self.config = None;
        self.status = SerialStatus::Disconnected;
        info!("[串口] 端口 {} 已关闭", port_name);
        Ok(())
    }

    pub fn write(&mut self, data: &[u8]) -> Result<usize, String> {
        match &self.port {
            Some(port_arc) => {
                let mut port_guard = port_arc.lock().map_err(|e| e.to_string())?;
                match &mut *port_guard {
                    Some(port) => port.write(data).map_err(|e| {
                        error!("[串口] 写入数据失败: {}", e);
                        format!("写入失败: {}", e)
                    }),
                    None => {
                        warn!("[串口] 写入失败：端口未打开");
                        Err("端口未打开".to_string())
                    }
                }
            }
            None => {
                warn!("[串口] 写入失败：端口未打开");
                Err("端口未打开".to_string())
            }
        }
    }

    pub fn is_open(&self) -> bool {
        self.port.is_some()
    }

    pub fn get_status(&self) -> &SerialStatus {
        &self.status
    }

    /// 启动后台读取线程，数据通过 Tauri 事件推送
    pub fn start_read_thread(&mut self, app_handle: AppHandle) -> Result<(), String> {
        if self.port.is_none() {
            return Err("端口未打开".to_string());
        }

        let (stop_tx, stop_rx): (mpsc::Sender<()>, mpsc::Receiver<()>) = mpsc::channel();
        self.read_thread_tx = Some(stop_tx);

        let port_arc = self.port.as_ref().unwrap().clone();

        thread::spawn(move || {
            let mut buf = [0u8; 256];
            info!("[串口] 读取线程启动");

            loop {
                // 检查停止信号
                if stop_rx.try_recv().is_ok() {
                    info!("[串口] 读取线程收到停止信号");
                    break;
                }

                let mut port_guard = match port_arc.lock() {
                    Ok(g) => g,
                    Err(_) => break,
                };

                let port = match &mut *port_guard {
                    Some(p) => p,
                    None => break,
                };

                match port.read(&mut buf) {
                    Ok(n) if n > 0 => {
                        let data = buf[..n].to_vec();
                        // 通过 Tauri 事件发送到前端
                        if let Err(e) = app_handle.emit("serial-data", data) {
                            warn!("[串口] 发送事件失败: {}", e);
                        }
                    }
                    Ok(_) => {
                        thread::sleep(Duration::from_millis(10));
                    }
                    Err(ref e) if e.kind() == std::io::ErrorKind::TimedOut => {
                        thread::sleep(Duration::from_millis(10));
                    }
                    Err(e) => {
                        error!("[串口] 读取错误: {}", e);
                        break;
                    }
                }
            }
            info!("[串口] 读取线程退出");
        });

        Ok(())
    }
}