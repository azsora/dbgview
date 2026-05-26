import { createApp } from "vue";
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import App from "./App.vue";
import "./registry/panelComponents"; // 注册面板组件
import "./registry/contentComponents"; // 注册内容组件

const app = createApp(App);
app.use(ElementPlus);
app.mount("#app");
