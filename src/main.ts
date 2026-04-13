import { createApp } from "vue";
import App from "./App.vue";
import "./style.css";
import { setupStore } from "./stores";

function setScale() {
  const scale = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
  document.documentElement.style.setProperty("--scale", scale.toString());
}

setScale();
window.addEventListener("resize", setScale);

// 创建实例
const setupAll = async () => {
  const app = createApp(App);

  setupStore(app);

  app.mount("#app");
};
setupAll();
