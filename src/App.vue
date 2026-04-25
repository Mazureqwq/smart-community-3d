<!-- src/App.vue -->
<template>
  <div class="app">
    <!-- 3D画布 -->
    <SceneCanvas
      ref="sceneCanvasRef"
      :selected-id="selectedBuildingId"
      @building-click="handleBuildingClick"
      @scene-ready="handleSceneReady" />

    <!-- 数据面板 -->
    <StatsPanel
      class="scale left-bottom z-999"
      :selected-id="selectedBuildingId"
      @select-building="handleSelectBuilding"
      @data-update="handleDataUpdate" />

    <!-- 控制面板 -->
    <ControlPanel class="scale right-top z-999" @reset="handleReset" />

    <!-- 顶部状态栏 -->
    <div class="top-bar">
      <div class="app-title scale left">
        <span class="card5-text">智慧园区 3D 可视化平台</span>
      </div>
      <div class="status-info scale right">
        <span class="status-item">🟢 在线</span>
        <span class="status-item">📡 数据更新中</span>
        <span class="status-item">📊 FPS: {{ fps }}</span>
      </div>
    </div>

    <!-- 操作提示 -->
    <div class="hint scale bottom z-9999999999999">
      <span>🖱️ 鼠标拖动旋转 | 滚轮缩放 | 左键平移</span>
      <span>👆 点击建筑查看详情</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, provide } from "vue";
import { useSceneStore } from "./stores/model/useSceneStore"; // 引入 Store
import SceneCanvas from "./components/SceneCanvas.vue";
import StatsPanel from "./components/StatsPanel.vue";
import ControlPanel from "./components/ControlPanel.vue";
// import BuildingInfo from "./components/BuildingInfo.vue";
import type { BuildingProperties, BuildingIoTData } from "./types/community";

// 初始化 Store
const sceneStore = useSceneStore();
sceneStore.filterDataSource();
// 组件引用
const sceneCanvasRef = ref<InstanceType<typeof SceneCanvas> | null>(null);

// 状态 (仅保留与场景控制无关的状态)
const fps = ref(60);
const selectedBuildingId = ref<string | null>(null);
const selectedBuilding = ref<BuildingProperties | null>(null);
const iotDataMap = ref<Map<string, BuildingIoTData>>(new Map());
const currentBuildingIoTData = ref<BuildingIoTData | null>(null);

// 场景就绪
function handleSceneReady(): void {
  console.log("Scene ready");
}

// 处理建筑点击
function handleBuildingClick(
  buildingId: string,
  properties: BuildingProperties,
): void {
  selectedBuildingId.value = buildingId;
  selectedBuilding.value = properties;
  currentBuildingIoTData.value = iotDataMap.value.get(buildingId) || null;
}

// 处理选择建筑
function handleSelectBuilding(buildingId: string): void {
  selectedBuildingId.value = buildingId;
  console.log("Building clicked:", buildingId);

  // 通过场景组件高亮
  // sceneCanvasRef.value?.highlightBuilding(buildingId);
}

// 关闭建筑信息
function closeBuildingInfo(): void {
  selectedBuildingId.value = null;
  selectedBuilding.value = null;
  currentBuildingIoTData.value = null;
}

// 处理数据更新
function handleDataUpdate(data: BuildingIoTData[]): void {
  data.forEach((item) => {
    iotDataMap.value.set(item.buildingId, item);
  });

  // 更新当前选中建筑的数据
  if (selectedBuildingId.value) {
    currentBuildingIoTData.value =
      iotDataMap.value.get(selectedBuildingId.value) || null;
  }
}

// 设置视角
// function handleSetView(view: string): void {
//   console.log("Set view:", view);
//   // 可以在这里调用场景组件的方法
// }

// 重置
function handleReset(): void {
  sceneStore.reset(); // 调用 Store 的重置方法
  closeBuildingInfo();
}

// 提供全局状态 (如果需要其他组件访问，可以提供 store 实例或具体状态)
provide("sceneStore", sceneStore);
</script>

<style scoped>
/* ... 原有样式保持不变 ... */
.app {
  width: 100vw;
  height: 100vh;
  position: relative;
  overflow: hidden;
}

.top-bar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: linear-gradient(
    180deg,
    rgba(10, 20, 40, 0.9) 0%,
    transparent 100%
  );
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
  z-index: 50;
  pointer-events: none;
}

.app-title {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #fff;
  font-size: 20px;
  font-weight: bold;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
}

.title-icon {
  font-size: 28px;
}

.status-info {
  display: flex;
  gap: 20px;
}

.status-item {
  color: #00f2ff;
  font-size: 14px;
  padding: 6px 14px;
  background: rgba(0, 242, 255, 0.1);
  border-radius: 20px;
  border: 1px solid rgba(0, 242, 255, 0.3);
  pointer-events: auto;
}

.hint {
  position: absolute;
  bottom: 20px;
  right: 20%;
  color: rgba(255, 255, 255, 0.7);
  font-size: 13px;
  background: rgba(0, 0, 0, 0.3);
  padding: 8px 16px;
  border-radius: 20px;
  backdrop-filter: blur(5px);
  z-index: 50;
  display: flex;
  gap: 20px;
}
.card-5 {
  position: relative;
  background: rgba(10, 20, 40, 0.85);
  border-radius: 12px;
  padding: 20px;
  overflow: hidden;
}
.card-5::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #1890ff33, transparent);
}
.card5-text {
  position: relative;
  z-index: 2;
  font-size: 30px;
  color: #fff;
  font-weight: bold;
}
</style>
