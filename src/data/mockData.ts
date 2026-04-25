import type { BuildingIoTData } from "../types/community";

// 模拟实时IoT数据生成器
export function generateIoTData(): BuildingIoTData[] {
  const now = new Date();

  return [
    {
      buildingId: "way/404362685",
      powerUsage: 2840 + Math.random() * 200,
      waterUsage: 156 + Math.random() * 20,
      temperature: 22 + Math.random() * 3,
      humidity: 55 + Math.random() * 10,
      occupancy: 92,
      parkingAvailable: Math.floor(23 + Math.random() * 10),
      lastUpdate: now,
    },
    {
      buildingId: "way/405016993",
      powerUsage: 3650 + Math.random() * 300,
      waterUsage: 198 + Math.random() * 25,
      temperature: 21.5 + Math.random() * 3,
      humidity: 58 + Math.random() * 10,
      occupancy: 88,
      parkingAvailable: Math.floor(31 + Math.random() * 15),
      lastUpdate: now,
    },
    {
      buildingId: "way/483555684",
      powerUsage: 8900 + Math.random() * 500,
      waterUsage: 420 + Math.random() * 50,
      temperature: 23 + Math.random() * 2,
      humidity: 50 + Math.random() * 8,
      occupancy: 95,
      parkingAvailable: Math.floor(87 + Math.random() * 30),
      lastUpdate: now,
    },
    {
      buildingId: "way/487101884",
      powerUsage: 1250 + Math.random() * 100,
      waterUsage: 78 + Math.random() * 10,
      temperature: 22.5 + Math.random() * 2,
      humidity: 52 + Math.random() * 8,
      occupancy: 100,
      parkingAvailable: Math.floor(12 + Math.random() * 5),
      lastUpdate: now,
    },
  ];
}

// 社区统计数据
export interface CommunityStats {
  totalPowerUsage: number;
  totalWaterUsage: number;
  avgOccupancy: number;
  totalParkingAvailable: number;
  buildingCount: number;
}

export function calculateStats(iotData: BuildingIoTData[]): CommunityStats {
  return {
    totalPowerUsage: iotData.reduce((sum, d) => sum + d.powerUsage, 0),
    totalWaterUsage: iotData.reduce((sum, d) => sum + d.waterUsage, 0),
    avgOccupancy:
      iotData.reduce((sum, d) => sum + d.occupancy, 0) / iotData.length,
    totalParkingAvailable: iotData.reduce(
      (sum, d) => sum + (d.parkingAvailable || 0),
      0,
    ),
    buildingCount: iotData.length,
  };
}
