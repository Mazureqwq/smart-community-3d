import { App } from "vue";
import { useSceneStore } from "./model/useSceneStore";
import piniaPluginPersistedstate from "pinia-plugin-persistedstate";
import { createPinia } from "pinia";

// 创建Pinia实例
const store = createPinia();

// 注册持久化插件
store.use(piniaPluginPersistedstate);
export const setupStore = (app: App<Element>) => {
  app.use(store);
};
export { store };

export { useSceneStore };
