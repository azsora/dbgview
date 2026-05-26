use probe_rs;
fn main() {
    // 尝试找到列出所有芯片的方法
    println!("Available in probe_rs:");
    println!("  Target: {:?}", std::any::type_name::<probe_rs::Target>());
}
