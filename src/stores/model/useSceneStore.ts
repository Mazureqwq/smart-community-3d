// src/stores/useSceneStore.ts
import { defineStore } from "pinia";
import { ref, reactive } from "vue";
import type { SceneConfig } from "../../types/community";

export const useSceneStore = defineStore("scene", () => {
  // 场景配置状态
  const config = reactive<SceneConfig>({
    showLabels: true,
    showGrid: true,
    showAxes: false,
    ambientLightIntensity: 0.0,
    directionalLightIntensity: 0.0,
    isNightMode: false,
    buildingOpacity: 1,
    autoRotate: true,
    view: "default",
  });

  // Actions
  function updateConfig(newConfig: Partial<SceneConfig>) {
    Object.assign(config, newConfig);
  }

  function toggleAutoRotate() {
    config.autoRotate = !config.autoRotate;
  }

  function setAutoRotate(value: boolean) {
    config.autoRotate = value;
  }

  function reset() {
    // 重置为默认值
    config.showLabels = true;
    config.showGrid = true;
    config.showAxes = false;
    config.ambientLightIntensity = 0.6;
    config.directionalLightIntensity = 1.2;
    config.isNightMode = false;
    config.buildingOpacity = 1;
    config.autoRotate = true;
    config.view = "default";
  }

  return {
    config,
    updateConfig,
    toggleAutoRotate,
    setAutoRotate,
    reset,
  };
});
