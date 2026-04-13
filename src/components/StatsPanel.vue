<template>
  <div class="stats-panel">
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
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import {
  generateIoTData,
  calculateStats,
  type CommunityStats,
} from "../data/mockData";
import type { BuildingIoTData } from "../types/community";

const props = defineProps<{
  selectedId?: string | null;
}>();

const emit = defineEmits<{
  (e: "select-building", id: string): void;
  (e: "data-update", data: BuildingIoTData[]): void;
}>();

// 数据状态
const iotData = ref<BuildingIoTData[]>([]);
const updateTime = ref("");
const trend = ref({ power: 2.5, water: -1.2 });

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

// 建筑名称映射
const buildingNames: Record<string, string> = {
  "bld-001": "1号楼 · 云栖阁",
  "bld-002": "2号楼 · 揽月轩",
  "bld-003": "商业中心",
  "bld-004": "服务中心",
};

function getBuildingName(id: string): string {
  return buildingNames[id] || id;
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
.stats-panel {
  position: absolute;
  bottom: 20px;
  left: 20px;
  width: 360px;
  background: rgba(10, 20, 40, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  border: 1px solid rgba(0, 242, 255, 0.3);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  color: #fff;
  padding: 16px;
  z-index: 100;
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
