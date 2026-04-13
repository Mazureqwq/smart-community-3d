<template>
  <div v-if="building" class="building-info">
    <div class="info-header">
      <h3>{{ building.name }}</h3>
      <button class="close-btn" @click="$emit('close')">✕</button>
    </div>

    <div class="info-content">
      <div class="info-row">
        <span class="label">类型</span>
        <span class="value">{{ typeText }}</span>
      </div>
      <div class="info-row">
        <span class="label">层数</span>
        <span class="value">{{ building.levels || "--" }} 层</span>
      </div>
      <div class="info-row">
        <span class="label">高度</span>
        <span class="value">{{ building.height }} 米</span>
      </div>
      <div class="info-row">
        <span class="label">地址</span>
        <span class="value">{{ building.address || "--" }}</span>
      </div>
    </div>

    <div v-if="iotData" class="iot-section">
      <h4>📡 实时数据</h4>
      <div class="info-row">
        <span class="label">用电量</span>
        <span class="value highlight"
          >{{ formatNumber(iotData.powerUsage) }} kWh</span
        >
      </div>
      <div class="info-row">
        <span class="label">用水量</span>
        <span class="value">{{ formatNumber(iotData.waterUsage) }} m³</span>
      </div>
      <div class="info-row">
        <span class="label">温度</span>
        <span class="value">{{ iotData.temperature.toFixed(1) }}°C</span>
      </div>
      <div class="info-row">
        <span class="label">湿度</span>
        <span class="value">{{ iotData.humidity.toFixed(1) }}%</span>
      </div>
      <div class="info-row">
        <span class="label">入住率</span>
        <span class="value">{{ iotData.occupancy }}%</span>
      </div>
      <div class="info-row">
        <span class="label">剩余车位</span>
        <span class="value">{{ iotData.parkingAvailable || "--" }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { BuildingProperties, BuildingIoTData } from "../types/community";

const props = defineProps<{
  building: BuildingProperties | null;
  iotData: BuildingIoTData | null;
}>();

defineEmits<{
  (e: "close"): void;
}>();

const typeText = computed(() => {
  const typeMap: Record<string, string> = {
    residential: "🏢 住宅",
    commercial: "🏬 商业",
    facility: "🏛️ 公共设施",
    road: "🛣️ 道路",
    green: "🌳 绿化",
  };
  return props.building
    ? typeMap[props.building.type] || props.building.type
    : "";
});

function formatNumber(num: number): string {
  return num.toLocaleString();
}
</script>

<style scoped>
.building-info {
  position: absolute;
  top: 60px;
  left: 20px;
  width: 300px;
  background: rgba(10, 20, 40, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  border: 1px solid rgba(0, 242, 255, 0.4);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  color: #fff;
  z-index: 150;
  overflow: hidden;
}

.info-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: linear-gradient(90deg, rgba(0, 242, 255, 0.2), transparent);
  border-bottom: 1px solid rgba(0, 242, 255, 0.3);
}

.info-header h3 {
  font-size: 18px;
  color: #00f2ff;
  margin: 0;
}

.close-btn {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: #fff;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.close-btn:hover {
  background: rgba(255, 100, 100, 0.5);
}

.info-content {
  padding: 16px 20px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.info-row:last-child {
  border-bottom: none;
}

.label {
  color: #8899aa;
  font-size: 13px;
}

.value {
  color: #fff;
  font-size: 14px;
  font-weight: 500;
}

.value.highlight {
  color: #ffd700;
}

.iot-section {
  padding: 0 20px 16px;
}

.iot-section h4 {
  font-size: 14px;
  color: #00f2ff;
  margin-bottom: 12px;
}
</style>
