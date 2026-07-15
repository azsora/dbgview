import { createApp } from "vue";
import naive from "naive-ui";
import { createDiscreteApi } from "naive-ui";
import App from "./App.vue";
import "./registry/panelComponents"; // 注册面板组件
import "./registry/contentComponents"; // 注册内容组件

const app = createApp(App);
app.use(naive);
app.mount("#app");

/**
 * 全局离散 API：替代 Element Plus 的 ElMessage
 * - 调用方式：message.success("...") / message.error("...") / message.warning("...") / message.info("...")
 * - 必须在 app.mount 之后创建以确保 DOM 容器就绪
 */
export const { message, notification, dialog, loadingBar } = createDiscreteApi([
  "message",
  "notification",
  "dialog",
  "loadingBar",
]);
