<template>
  <div class="scale left tech-panel z-999">
    <div class="panel">
      <!-- ===== 上：核心信息 ===== -->
      <div class="header">
        <div class="title">{{ data.name }}</div>

        <div class="status-row">
          <el-tag :type="statusType" size="small" effect="dark">
            {{ data.status }}
          </el-tag>
          <span class="area">{{ data.area }}</span>
        </div>

        <!-- 人流 -->
        <div class="crowd">
          <span>当前人流</span>
          <b>{{ data.crowd }}</b>
        </div>
      </div>

      <div class="flex flex-col gap-10px">
        <div class="block-title">人流趋势</div>
        <Echarts :options="lineOptions" width="100%" height="100px" />
      </div>
      <div class="body mt-16px">
        <div class="flex-1">
          <div class="block-title">容纳人数</div>
          <Echarts :options="liquidOptions1" width="100%" height="200px" />
        </div>
        <div class="flex-1">
          <div class="block-title">设备状态</div>
          <Echarts :options="liquidOptions2" width="100%" height="200px" />
        </div>
      </div>

      <!-- ===== 下 ===== -->
      <div>
        <div class="block-title">监控数据</div>
        <div class="body">
          <!-- 左 -->
          <div class="left">
            <div class="row">
              <span>排队时间</span>
              <b class="highlight">{{ data.waitTime }} min</b>
            </div>
            <div class="row">
              <span>容量</span>
              <b>{{ data.capacity }}</b>
            </div>
            <div class="row">
              <span>开放时间</span>
              <b>{{ data.openTime }}</b>
            </div>
          </div>
          <!-- 中 -->
          <div class="right">
            <div class="monitor">
              <span>设备状态</span>
              <b :class="deviceClass">{{ data.deviceStatus }}</b>
            </div>
            <div class="monitor">
              <span>设备数量</span>
              <b>{{ data.deviceCount }}</b>
            </div>
            <div class="monitor">
              <span>温度</span>
              <b>{{ data.temperature }}°C</b>
            </div>
          </div>
          <!-- 右 -->
          <div class="right">
            <div class="monitor">
              <span>设备数量</span>
              <b>{{ data.deviceCount }}</b>
            </div>

            <div class="monitor">
              <span>湿度</span>
              <b>{{ data.humidity }}%</b>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { Echarts } from "../echarts";
import * as echarts from "echarts";

const props = defineProps({
  data: {
    type: Object,
    default: () => ({
      id: "D-101",
      name: "飞跃地平线",
      area: "探险岛",
      status: "拥挤",

      crowd: 296,
      waitTime: 75,
      capacity: 400,
      openTime: "09:00-21:00",

      deviceStatus: "正常",
      deviceCount: 42,

      temperature: 28,
      humidity: 60,

      alarm: false,
      riskLevel: "中",
    }),
  },
});

const statusType = computed(() => {
  if (props.data.status === "拥挤") return "warning";
  if (props.data.status === "停运") return "danger";
  if (props.data.status === "维护") return "info";
  return "success";
});

const usagePercent = computed(() => {
  return Math.min(
    Number((props.data.crowd / props.data.capacity).toFixed(2)),
    1,
  );
});
const usageColor = (data: number) => {
  return data > 0.8
    ? ["#F5222D", "#FF7875"]
    : data > 0.6
      ? ["#FAAD14", "#FFDD70"]
      : ["#1890FF", "#1EE7E7"];
};

const deviceClass = computed(() => {
  return props.data.deviceStatus === "正常" ? "safe" : "danger";
});

const riskClass = computed(() => {
  if (props.data.riskLevel === "高") return "danger";
  if (props.data.riskLevel === "中") return "warning";
  return "safe";
});

const lineOptions = ref({
  tooltip: {
    trigger: "axis",
  },
  // legend: {
  //   data: ["Email", "Union Ads", "Video Ads", "Direct", "Search Engine"],
  // },
  grid: {
    left: "1%",
    right: "4%",
    bottom: "5%",
    top: "8%",
    containLabel: true,
  },
  // toolbox: {
  //   feature: {
  //     saveAsImage: {},
  //   },
  // },
  xAxis: {
    type: "category",
    boundaryGap: false,
    data: [
      "9:00",
      "10:00",
      "11:00",
      "12:00",
      "13:00",
      "14:00",
      "15:00",
      "16:00",
      "17:00",
      "18:00",
      "19:00",
      "20:00",
      "21:00",
    ],
  },
  yAxis: {
    type: "value",
  },
  series: [
    {
      name: "人数",
      type: "line",
      symbol: "none",
      smooth: true,
      stack: "Total",
      data: [120, 132, 101, 230, 210, 180, 296],
      areaStyle: {
        // 下方渐变填充
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: "rgba(24, 144, 255, 0.35)" },
          { offset: 1, color: "rgba(24, 144, 255, 0)" },
        ]),
      },
    },
  ],
});
const liquidOptions1 = ref({
  title: [
    {
      text: "296人",
      x: "center",
      y: "65%",
      textStyle: {
        fontSize: 16,
        color: "#fff",
      },
    },
    {
      text: "已容纳人数",
      x: "center",
      y: "75%",
      textStyle: {
        fontSize: 14,
        color: "#fff",
      },
    },
  ],
  series: [
    {
      type: "liquidFill",
      radius: "80%",
      center: ["50%", "50%"],
      color: [
        {
          type: "linear",
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            {
              offset: 0,
              color: usageColor(props.data.crowd / props.data.capacity)[1],
            },
            {
              offset: 1,
              color: usageColor(props.data.crowd / props.data.capacity)[0],
            },
          ],
          globalCoord: false,
        },
      ],
      data: [usagePercent.value, usagePercent.value], // data个数代表波浪数
      backgroundStyle: {
        borderWidth: 1,
        color: "rgba(117, 205, 255, 0.25)",
      },
      label: {
        normal: {
          textStyle: {
            fontSize: 24,
            fontWeight: "bold",
            color: "#000",
          },
        },
      },
      outline: {
        borderDistance: 0,
        itemStyle: {
          borderWidth: 4,
          borderColor: "transparent",
        },
      },
    },
  ],
});
const liquidOptions2 = ref({
  title: [
    {
      text: "35台",
      x: "center",
      y: "60%",
      textStyle: {
        fontSize: 16,
        color: "#ffffff",
      },
    },
    {
      text: "正在游玩设备",
      x: "center",
      y: "70%",
      textStyle: {
        fontSize: 14,
        color: "#ffffff",
      },
    },
  ],
  series: [
    {
      type: "liquidFill",
      radius: "80%",
      center: ["50%", "50%"],
      color: [
        {
          type: "linear",
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            {
              offset: 0,
              color: usageColor(0.78)[1],
            },
            {
              offset: 1,
              color: usageColor(0.78)[0],
            },
          ],
          globalCoord: false,
        },
      ],
      data: [0.78, 0.78], // data个数代表波浪数
      backgroundStyle: {
        borderWidth: 1,
        color: "rgba(117, 205, 255, 0.25)",
      },
      label: {
        normal: {
          textStyle: {
            fontSize: 24,
            fontWeight: "bold",
            color: "#ffffff",
          },
        },
      },
      outline: {
        borderDistance: 0,
        itemStyle: {
          borderWidth: 4,
          borderColor: "transparent",
        },
      },
    },
  ],
});
</script>

<style scoped>
.tech-panel {
  width: 600px;
  pointer-events: auto;
}

.panel {
  background: rgba(8, 20, 35, 0.9);
  border: 1px solid rgba(80, 166, 245, 0.4);
  border-radius: 8px;
  padding: 16px;
  color: #d6eaff;

  box-shadow:
    0 0 15px rgba(80, 166, 245, 0.3),
    inset 0 0 10px rgba(80, 166, 245, 0.1);
}

/* ===== 上 ===== */
.header {
  border-bottom: 1px solid rgba(80, 166, 245, 0.2);
  margin-bottom: 8px;
}

.title {
  color: #50a6f5;
  font-weight: bold;
  font-size: 14px;
}

.status-row {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  margin: 6px 0;
}

.area {
  color: #7fbfff;
}

/* 人流 */
.crowd {
  font-size: 12px;
  display: flex;
  flex-direction: row;
  align-items: center;
}

.crowd b {
  color: #50f5d1;
  font-size: 16px;
}

/* ===== 下 ===== */
.body {
  display: flex;
  gap: 20px;
}

.left,
.right {
  flex: 1;
  font-size: 12px;
}

.block-title {
  font-size: 14px;
  color: #50a6f5;
  border-left: 2px solid #50a6f5;
  padding-left: 4px;
}

.row,
.monitor {
  display: flex;
  justify-content: space-between;
  margin: 8px 0;
}

.highlight {
  color: #50f5d1;
}

.safe {
  color: #50f5d1;
}

.warning {
  color: #ffaa33;
}

.danger {
  color: #ff5a5a;
}
</style>
