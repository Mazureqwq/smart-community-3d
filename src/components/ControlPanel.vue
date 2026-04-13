<!-- src/components/ControlPanel.vue -->
<template>
  <div class="control-panel">
    <div class="control-group">
      <h4>🌍 场景控制</h4>

      <div class="control-item">
        <label>
          <input type="checkbox" v-model="sceneStore.config.showLabels" />
          显示建筑标签
        </label>
      </div>

      <div class="control-item">
        <label>
          <input type="checkbox" v-model="sceneStore.config.showGrid" />
          显示网格
        </label>
      </div>

      <div class="control-item">
        <label>
          <input type="checkbox" v-model="sceneStore.config.autoRotate" />
          自动旋转
        </label>
      </div>

      <div class="control-item">
        <div
          :style="{
            color: '#fff',
          }">
          {{ sceneStore.config }}
        </div>
        <label>
          <input type="checkbox" v-model="sceneStore.config.isNightMode" />
          🌙 夜景模式
        </label>
      </div>
    </div>

    <div class="control-group">
      <h4>🎨 视觉效果</h4>

      <div class="control-item slider-item">
        <label>建筑透明度</label>
        <input
          type="range"
          v-model.number="sceneStore.config.buildingOpacity"
          min="0.3"
          max="1"
          step="0.05" />
        <span class="slider-value"
          >{{ (sceneStore.config.buildingOpacity * 100).toFixed(0) }}%</span
        >
      </div>

      <div class="control-item slider-item">
        <label>环境光强度</label>
        <input
          type="range"
          v-model.number="sceneStore.config.ambientLightIntensity"
          min="0.1"
          max="1.5"
          step="0.1" />
        <span class="slider-value">{{
          sceneStore.config.ambientLightIntensity.toFixed(1)
        }}</span>
      </div>
    </div>

    <div class="control-group">
      <h4>📷 视角</h4>

      <div class="view-buttons">
        <button :class="isActive('top') && 'active'" @click="setView('top')">
          顶视图
        </button>
        <button
          :class="isActive('front') && 'active'"
          @click="setView('front')">
          前视图
        </button>
        <button :class="isActive('side') && 'active'" @click="setView('side')">
          侧视图
        </button>
        <button
          :class="isActive('default') && 'active'"
          @click="setView('default')">
          默认
        </button>
      </div>
    </div>

    <div class="control-footer">
      <button class="reset-btn" @click="resetAll">重置所有</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useSceneStore } from "../stores/model/useSceneStore";

const isActive = (view: string) => {
  return sceneStore.config.view == view;
};

const sceneStore = useSceneStore();

function setView(view: "default" | "top" | "front" | "side"): void {
  // 这里可以 emit 事件给父组件，或者直接在 store 中处理视角逻辑
  // 为了保持与原有逻辑一致，我们仍然 emit 事件，但不再处理 config 更新
  emit("set-view", view);
  sceneStore.config.view = view;
}

function resetAll(): void {
  emit("reset");
}

const emit = defineEmits<{
  (e: "set-view", view: string): void;
  (e: "reset"): void;
}>();
</script>

<style scoped>
/* ... 原有样式保持不变 ... */
.control-panel {
  position: absolute;
  top: 60px;
  right: 20px;
  width: 260px;
  background: rgba(10, 20, 40, 0.85);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  border: 1px solid rgba(0, 242, 255, 0.3);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  color: #fff;
  padding: 16px;
  z-index: 100;
}

.control-group {
  margin-bottom: 20px;
}

.control-group h4 {
  font-size: 13px;
  color: #00f2ff;
  margin-bottom: 12px;
  border-bottom: 1px solid rgba(0, 242, 255, 0.2);
  padding-bottom: 6px;
}

.control-item {
  margin-bottom: 10px;
  font-size: 13px;
}

.control-item label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.control-item input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: #00f2ff;
}

.slider-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.slider-item label {
  font-size: 12px;
  color: #ccc;
}

.slider-item input[type="range"] {
  width: 100%;
  height: 4px;
  background: #334466;
  border-radius: 2px;
  -webkit-appearance: none;
  appearance: none;
}

.slider-item input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 14px;
  height: 14px;
  background: #00f2ff;
  border-radius: 50%;
  cursor: pointer;
}

.slider-value {
  font-size: 11px;
  color: #ffd700;
  text-align: right;
}

.view-buttons {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.view-buttons button {
  padding: 8px;
  background: rgba(30, 50, 80, 0.8);
  border: 1px solid rgba(0, 242, 255, 0.2);
  border-radius: 6px;
  color: #fff;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.view-buttons .active,
button:hover {
  background: rgba(0, 242, 255, 0.3);
  border-color: #00f2ff;
}

.control-footer {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid rgba(0, 242, 255, 0.2);
}

.reset-btn {
  width: 100%;
  padding: 10px;
  background: rgba(255, 100, 100, 0.2);
  border: 1px solid rgba(255, 100, 100, 0.4);
  border-radius: 6px;
  color: #ff9999;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.reset-btn:hover {
  background: rgba(255, 100, 100, 0.4);
  color: #fff;
}
</style>
