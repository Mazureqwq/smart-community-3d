<!-- src/components/ControlPanel.vue -->
<template>
  <div class="control-panel-container">
    <div
      class="control-panel"
      :style="{
        width: isExpanded ? '260px' : '40px',
        height: isExpanded ? '130px' : '100px',
      }">
      <div class="control-expand" v-if="showContent">
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
              <input type="checkbox" v-model="sceneStore.config.isRoaming" />
              漫游
            </label>
          </div>
        </div>
      </div>
      <div class="control-foldUp" v-else>场景控制</div>
    </div>
    <div class="btn" @click="handlePanel">
      <div v-if="isExpanded">▶</div>
      <div v-else>◀</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useSceneStore } from "../stores/model/useSceneStore";

const sceneStore = useSceneStore();
const isExpanded = ref(true);
// 控制内容显示（等动画结束后切换）
const showContent = ref(true);

const emit = defineEmits<{
  (e: "set-view", view: string): void;
  (e: "reset"): void;
}>();

const handlePanel = () => {
  // 切换前先隐藏内容
  if (isExpanded.value) {
    isExpanded.value = !isExpanded.value;
    // 等过渡动画时间（300ms），再切换状态 + 显示内容
    setTimeout(() => {
      showContent.value = !showContent.value;
    }, 250); // 必须和你的 transition 时间一致
  } else {
    showContent.value = !showContent.value;
    // 等过渡动画时间（300ms），再切换状态 + 显示内容
    isExpanded.value = !isExpanded.value;
  }
};
</script>

<style scoped lang="less">
.control-panel-container {
  position: absolute;
  top: 60px;
  right: 20px;
}
.control-panel {
  background: rgba(10, 20, 40, 0.85);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  border: 1px solid rgba(0, 242, 255, 0.3);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  color: #fff;
  z-index: 100;
  transition: all 0.3s ease;
  overflow: hidden;
}

.control-foldUp {
  color: #00f2ff;
  font-size: 16px;
  writing-mode: vertical-rl;
  /* 文字方向正过来 */
  text-orientation: upright;
  letter-spacing: 4px;
  width: 40px;
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px 0;
}
.control-expand {
  width: 260px;
  height: 130px;
  padding: 16px;
}
.btn {
  background: rgba(10, 20, 40, 0.85);
  font-size: 10px;
  position: absolute;
  left: 0;
  top: 50%;
  transform: translate(-100%, -50%);
  border: 1px solid rgba(0, 242, 255, 0.3);
  border-right: none;
  padding: 10px 4px;
  border-radius: 4px 0 0 4px;
  cursor: pointer;
  color: #00f2ff;
}

.control-group {
  margin-bottom: 20px;
}

.control-group h4 {
  font-size: 16px;
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
