// src/stores/useSceneStore.ts
import { defineStore } from "pinia";
import type { SceneConfig } from "../../types/community";
import { normalizeFeature, buildNameMap } from "../../utils/threeHelpers";

export const useSceneStore = defineStore("scene", {
  // 1. 状态（必须是函数，返回对象）
  state: (): {
    config: SceneConfig;
  } => ({
    config: {
      showLabels: true,
      geojson: null,
      mapping: null,
      isRoaming: true,
      buildings: [], // 存储所有建筑对象
    },
  }),

  getters: {
    getGeoJson(): SceneConfig["geojson"] {
      return this.config.geojson;
    },
    getMapping(): SceneConfig["mapping"] {
      return this.config.mapping;
    },
  },

  actions: {
    // 更新配置
    updateConfig(newConfig: Partial<SceneConfig>) {
      Object.assign(this.config, newConfig);
    },

    // 筛选数据源（异步）
    async filterDataSource() {
      const response = await fetch("/src/data/desin.geojson");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const communityData = await response.json();
      communityData.features = communityData.features.map(normalizeFeature);

      const mapping = buildNameMap(communityData);
      this.config.geojson = communityData;
      this.config.mapping = mapping;
    },

    // 重置为默认值
    reset() {
      this.config.showLabels = false;
      this.config.isRoaming = false;
    },
  },
});
export default useSceneStore;
