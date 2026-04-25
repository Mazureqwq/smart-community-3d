<template>
  <div class="stats-panel-container">
    {{ console.log(buildingNames) }}
    <div
      class="stats-panel"
      :style="{
        width: isExpanded ? '400px' : '40px',
        height: isExpanded ? '378px' : '156px',
      }">
      <div v-if="showContent" class="stats-expand">
        <div class="panel-header">
          <span class="panel-title">📊 社区运营数据</span>
          <span class="update-time">{{ updateTime }}</span>
        </div>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon">🏢</div>
            <div class="stat-content">
              <div class="stat-label">建筑总数</div>
              <div class="stat-value">{{ stats.buildingCount }}</div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon">⚡</div>
            <div class="stat-content">
              <div class="stat-label">总用电量</div>
              <div class="stat-value">
                {{ formatNumber(stats.totalPowerUsage) }} kWh
              </div>
              <div class="stat-trend" :class="trend.power">
                {{ trend.power > 0 ? "↑" : "↓" }} {{ Math.abs(trend.power) }}%
              </div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">💧</div>
            <div class="stat-content">
              <div class="stat-label">总用水量</div>
              <div class="stat-value">
                {{ formatNumber(stats.totalWaterUsage) }} m³
              </div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">👥</div>
            <div class="stat-content">
              <div class="stat-label">平均入住率</div>
              <div class="stat-value">{{ stats.avgOccupancy.toFixed(1) }}%</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">🅿️</div>
            <div class="stat-content">
              <div class="stat-label">剩余车位</div>
              <div class="stat-value">{{ stats.totalParkingAvailable }}</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">🌡️</div>
            <div class="stat-content">
              <div class="stat-label">平均温度</div>
              <div class="stat-value">{{ avgTemperature.toFixed(1) }}°C</div>
            </div>
          </div>
        </div>
        <!-- 建筑列表 -->
        <div class="building-list">
          <div class="list-header">建筑详情</div>
          <div
            v-for="building in buildingData"
            :key="building.buildingId"
            class="building-item"
            :class="{ active: selectedId === building.buildingId }"
            @click="$emit('select-building', building.buildingId)">
            <div class="building-name">
              {{ getBuildingName(building.buildingId) }}
            </div>
            <div class="building-stats">
              <span>⚡ {{ formatNumber(building.powerUsage) }}</span>
              <span>👥 {{ building.occupancy }}%</span>
            </div>
          </div>
        </div>
      </div>
      <div class="stats-foldUp" v-else>社区运营数据</div>
    </div>
    <div class="btn" @click="handlePanel">
      <div v-if="!isExpanded">▶</div>
      <div v-else>◀</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import {
  generateIoTData,
  calculateStats,
  type CommunityStats,
} from "../data/mockData";
import type { BuildingIoTData } from "../types/community";
import { useSceneStore } from "../stores";

const props = defineProps<{
  selectedId?: string | null;
}>();

const emit = defineEmits<{
  (e: "select-building", id: string): void;
  (e: "data-update", data: BuildingIoTData[]): void;
}>();
const isExpanded = ref(true);
// 控制内容显示（等动画结束后切换）
const showContent = ref(true);

// 数据状态
const iotData = ref<BuildingIoTData[]>([]);
const updateTime = ref("");
const trend = ref({ power: 2.5, water: -1.2 });
const sceneStore = useSceneStore();

// 计算统计数据
const stats = computed<CommunityStats>(() => calculateStats(iotData.value));

// 建筑数据列表
const buildingData = computed(() => iotData.value);

// 平均温度
const avgTemperature = computed(() => {
  if (iotData.value.length === 0) return 0;
  return (
    iotData.value.reduce((sum, d) => sum + d.temperature, 0) /
    iotData.value.length
  );
});

const handlePanel = () => {
  // 切换前先隐藏内容
  if (isExpanded.value) {
    isExpanded.value = !isExpanded.value;
    // 等过渡动画时间（300ms），再切换状态 + 显示内容
    setTimeout(() => {
      showContent.value = !showContent.value;
    }, 300); // 必须和你的 transition 时间一致
  } else {
    showContent.value = !showContent.value;
    // 等过渡动画时间（300ms），再切换状态 + 显示内容
    isExpanded.value = !isExpanded.value;
  }
};

// 建筑名称映射
const buildingNames = computed(() => sceneStore.getMapping);

// const buildingNames = computed(() => {
//   const names: Record<string, string> = {};
//   console.log("buildingData", buildingData);
//   buildingData.value.forEach((b) => {
//     names[b.buildingId] = b.name;
//   });
//   return names;
// });

function getBuildingName(id: string): string {
  return buildingNames.value?.[id] || id;
}

function formatNumber(num: number): string {
  return num.toLocaleString();
}

function updateData(): void {
  iotData.value = generateIoTData();
  updateTime.value = new Date().toLocaleTimeString("zh-CN");
  emit("data-update", iotData.value);
}

let updateInterval: number;

onMounted(() => {
  updateData();
  updateInterval = window.setInterval(updateData, 5000);
});

onUnmounted(() => {
  clearInterval(updateInterval);
});
</script>

<style scoped>
.stats-panel-container {
  position: absolute;
  bottom: 20px;
  left: 20px;
}
.stats-panel {
  /* width: 360px; */
  background: rgba(10, 20, 40, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  border: 1px solid rgba(0, 242, 255, 0.3);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  color: #fff;
  z-index: 100;
  transition: all 0.3s ease;
  overflow: hidden;
}
.stats-foldUp {
  color: #00f2ff;
  font-size: 16px;
  writing-mode: vertical-rl;
  /* 文字方向正过来 */
  text-orientation: upright;
  letter-spacing: 4px;
  width: 40px;
  height: 156px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px 0;
}
.stats-expand {
  width: 400px;
  height: 378px;
  padding: 16px;
}
.btn {
  background: rgba(10, 20, 40, 0.85);
  font-size: 10px;
  position: absolute;
  right: 0;
  top: 50%;
  transform: translate(100%, -50%);
  border: 1px solid rgba(0, 242, 255, 0.3);
  border-left: none;
  padding: 10px 4px;
  border-radius: 0 4px 4px 0;
  cursor: pointer;
  color: #00f2ff;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(0, 242, 255, 0.2);
}

.panel-title {
  font-size: 16px;
  font-weight: bold;
  color: #00f2ff;
}

.update-time {
  font-size: 12px;
  color: #8899aa;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 16px;
}

.stat-card {
  background: rgba(20, 40, 70, 0.6);
  border-radius: 10px;
  padding: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.stat-icon {
  font-size: 20px;
}

.stat-content {
  flex: 1;
}

.stat-label {
  font-size: 10px;
  color: #8899aa;
}

.stat-value {
  font-size: 14px;
  font-weight: bold;
  color: #ffd700;
}

.stat-trend {
  font-size: 10px;
}

.stat-trend.up {
  color: #ff6b6b;
}

.stat-trend.down {
  color: #51cf66;
}

.building-list {
  margin-top: 12px;
}

.list-header {
  font-size: 13px;
  color: #8899aa;
  margin-bottom: 8px;
}

.building-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 10px;
  background: rgba(30, 50, 80, 0.5);
  border-radius: 8px;
  margin-bottom: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.building-item:hover {
  background: rgba(0, 242, 255, 0.2);
}

.building-item.active {
  background: rgba(0, 242, 255, 0.3);
  border: 1px solid #00f2ff;
}

.building-name {
  font-size: 13px;
}

.building-stats {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #ffd700;
}
</style>
