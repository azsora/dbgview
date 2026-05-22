use crate::serial::{DataBits, FlowControl, Parity, SerialConfig, SerialManager, StopBits};
use std::sync::Mutex;
use tauri::State;

pub struct SerialState(pub Mutex<SerialManager>);

#[tauri::command]
pub fn serial_list_ports() -> Result<Vec<String>, String> {
    Ok(SerialManager::list_ports())
}

#[tauri::command]
pub fn serial_open(
    state: State<SerialState>,
    port: String,
    baud_rate: u32,
    data_bits: u8,
    stop_bits: f32,
    parity: String,
    flow_control: String,
) -> Result<(), String> {
    let mut manager = state.0.lock().map_err(|e| e.to_string())?;

    let config = SerialConfig {
        port,
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

    manager.open(config)
}

#[tauri::command]
pub fn serial_close(state: State<SerialState>) -> Result<(), String> {
    let mut manager = state.0.lock().map_err(|e| e.to_string())?;
    manager.close()
}

#[tauri::command]
pub fn serial_write(state: State<SerialState>, data: Vec<u8>) -> Result<usize, String> {
    let mut manager = state.0.lock().map_err(|e| e.to_string())?;
    manager.write(&data)
}

#[tauri::command]
pub fn serial_read(state: State<SerialState>) -> Result<Vec<u8>, String> {
    let mut manager = state.0.lock().map_err(|e| e.to_string())?;
    manager.read()
}

#[tauri::command]
pub fn serial_is_open(state: State<SerialState>) -> Result<bool, String> {
    let manager = state.0.lock().map_err(|e| e.to_string())?;
    Ok(manager.is_open())
}
