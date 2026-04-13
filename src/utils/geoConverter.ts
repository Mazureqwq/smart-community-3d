import { geoMercator } from "d3-geo";

export interface Point2D {
  x: number;
  y: number;
}

export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export class GeoConverter {
  private projection: ReturnType<typeof geoMercator>;
  private center: [number, number];
  private scale: number;

  constructor(
    center: [number, number] = [116.392, 39.912],
    scale: number = 100000,
  ) {
    this.center = center;
    this.scale = scale;
    this.projection = geoMercator().center(center).scale(scale);
  }

  /**
   * 经纬度转平面坐标
   */
  lngLatToXY(lng: number, lat: number): Point2D {
    const coords = this.projection([lng, lat]);
    return {
      x: coords?.[0] ?? 0,
      y: coords?.[1] ?? 0,
    };
  }

  /**
   * 经纬度转三维坐标（y轴朝上）
   */
  lngLatToXYZ(lng: number, lat: number, height: number = 0): Point3D {
    const { x, y } = this.lngLatToXY(lng, lat);
    return { x, y: height, z: y };
  }

  /**
   * 获取中心点偏移量（用于相对定位）
   */
  getRelativeOffset(lng: number, lat: number): Point2D {
    const centerXY = this.lngLatToXY(this.center[0], this.center[1]);
    const targetXY = this.lngLatToXY(lng, lat);
    return {
      x: targetXY.x - centerXY.x,
      y: targetXY.y - centerXY.y,
    };
  }

  /**
   * 更新投影参数
   */
  updateProjection(center: [number, number], scale: number): void {
    this.center = center;
    this.scale = scale;
    this.projection = geoMercator().center(center).scale(scale);
  }

  /**
   * 获取投影函数（用于外部调用）
   */
  getProjection(): (coords: [number, number]) => [number, number] | null {
    return this.projection;
  }
}

// 导出单例
export const geoConverter = new GeoConverter();
