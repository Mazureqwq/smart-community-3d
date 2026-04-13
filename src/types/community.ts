// GeoJSON 类型定义
export interface GeoJSONFeature {
  type: "Feature";
  properties: BuildingProperties;
  geometry: {
    type: "Polygon" | "MultiPolygon";
    coordinates: number[][][] | number[][][][];
  };
}

export interface GeoJSONData {
  type: "FeatureCollection";
  features: GeoJSONFeature[];
}

// 建筑属性
export interface BuildingProperties {
  id?: string;
  name: string;
  type: "residential" | "commercial" | "facility" | "road" | "green";
  height: number;
  levels?: number;
  color: string;
  address?: string;
  // 智慧数据
  powerUsage?: number; // 用电量
  occupancy?: number; // 入住率
  parkingSpaces?: number; // 停车位数
}

// 模拟IoT数据
export interface BuildingIoTData {
  buildingId: string;
  powerUsage: number;
  waterUsage: number;
  temperature: number;
  humidity: number;
  occupancy: number;
  parkingAvailable: number;
  lastUpdate: Date;
}

// 标签数据
export interface LabelData {
  id: string;
  text: string;
  position: [number, number, number];
  color?: string;
  fontSize?: number;
  buildingId?: string;
}

// 场景配置
export interface SceneConfig {
  showLabels: boolean;
  showGrid: boolean;
  showAxes: boolean;
  ambientLightIntensity: number;
  directionalLightIntensity: number;
  isNightMode: boolean;
  buildingOpacity: number;
  autoRotate: boolean;
  view: "top" | "front" | "side" | "default";
}

// 相机状态
export interface CameraState {
  position: [number, number, number];
  target: [number, number, number];
  zoom: number;
}
