use crate::serial::{DataBits, FlowControl, Parity, SerialConfig, SerialManager, StopBits};
use log::{info, error};
use std::sync::Mutex;
use tauri::State;

pub struct SerialState(pub Mutex<SerialManager>);

#[tauri::command]
pub fn serial_list_ports() -> Result<Vec<String>, String> {
    info!("[命令] serial_list_ports 被调用");
    let result = SerialManager::list_ports();
    info!("[命令] serial_list_ports 返回: {:?}", result);
    Ok(result)
}

#[tauri::command]
pub fn serial_open(
    state: State<SerialState>,
    app_handle: tauri::AppHandle,
    port: String,
    baud_rate: u32,
    data_bits: u8,
    stop_bits: f32,
    parity: String,
    flow_control: String,
) -> Result<(), String> {
    info!("[命令] serial_open 被调用: port={}, baud_rate={}, data_bits={}, stop_bits={}, parity={}, flow_control={}",
          port, baud_rate, data_bits, stop_bits, parity, flow_control);

    let mut manager = state.0.lock().map_err(|e| {
        error!("[命令] 获取串口管理器锁失败: {}", e);
        e.to_string()
    })?;

    let config = SerialConfig {
        port: port.clone(),
        baud_rate,
        data_bits: match data_bits {
            5 => DataBits::Five,
            6 => DataBits::Six,
            7 => DataBits::Seven,
            _ => DataBits::Eight,
        },
        stop_bits: match stop_bits {
            1.0 => StopBits::One,
            2.0 => StopBits::Two,
            _ => StopBits::One,
        },
        parity: match parity.as_str() {
            "Odd" => Parity::Odd,
            "Even" => Parity::Even,
            _ => Parity::None,
        },
        flow_control: match flow_control.as_str() {
            "RTS/CTS" => FlowControl::Hardware,
            "XON/XOFF" => FlowControl::Software,
            _ => FlowControl::None,
        },
    };

    let result = manager.open(config);
    match &result {
        Ok(_) => info!("[命令] serial_open 成功: port={}", port),
        Err(e) => info!("[命令] serial_open 失败: port={}, error={}", port, e),
    }

    // 启动后台读取线程
    if result.is_ok() {
        if let Err(e) = manager.start_read_thread(app_handle) {
            error!("[命令] 启动读取线程失败: {}", e);
        }
    }

    result
}

#[tauri::command]
pub fn serial_close(state: State<SerialState>) -> Result<(), String> {
    info!("[命令] serial_close 被调用");
    let mut manager = state.0.lock().map_err(|e| {
        error!("[命令] 获取串口管理器锁失败: {}", e);
        e.to_string()
    })?;
    let result = manager.close();
    match &result {
        Ok(_) => info!("[命令] serial_close 成功"),
        Err(e) => info!("[命令] serial_close 失败: error={}", e),
    }
    result
}

#[tauri::command]
pub fn serial_write(state: State<SerialState>, data: Vec<u8>) -> Result<usize, String> {
  let mut manager = state.0.lock().map_err(|e| {
    error!("[命令] 获取串口管理器锁失败: {}", e);
    e.to_string()
  })?;
  manager.write(&data)
}

#[tauri::command]
pub fn serial_is_open(state: State<SerialState>) -> Result<bool, String> {
    info!("[命令] serial_is_open 被调用");
    let manager = state.0.lock().map_err(|e| {
        error!("[命令] 获取串口管理器锁失败: {}", e);
        e.to_string()
    })?;
    let is_open = manager.is_open();
    info!("[命令] serial_is_open 返回: {}", is_open);
    Ok(is_open)
}

#[tauri::command]
pub fn serial_set_dtr(state: State<SerialState>, dtr: bool) -> Result<(), String> {
    info!("[命令] serial_set_dtr 被调用: dtr={}", dtr);
    let mut manager = state.0.lock().map_err(|e| {
        error!("[命令] 获取串口管理器锁失败: {}", e);
        e.to_string()
    })?;
    manager.set_dtr(dtr)
}

#[tauri::command]
pub fn serial_set_rts(state: State<SerialState>, rts: bool) -> Result<(), String> {
    info!("[命令] serial_set_rts 被调用: rts={}", rts);
    let mut manager = state.0.lock().map_err(|e| {
        error!("[命令] 获取串口管理器锁失败: {}", e);
        e.to_string()
    })?;
    manager.set_rts(rts)
}

#[tauri::command]
pub fn serial_read_cts(state: State<SerialState>) -> Result<bool, String> {
    let mut manager = state.0.lock().map_err(|e| {
        error!("[命令] 获取串口管理器锁失败: {}", e);
        e.to_string()
    })?;
    manager.read_cts()
}

#[tauri::command]
pub fn serial_read_dsr(state: State<SerialState>) -> Result<bool, String> {
    let mut manager = state.0.lock().map_err(|e| {
        error!("[命令] 获取串口管理器锁失败: {}", e);
        e.to_string()
    })?;
    manager.read_dsr()
}