import { markRaw, ref, shallowRef, type Ref } from "vue";
import * as THREE from "three";
import type {
  GeoJSONData,
  BuildingProperties,
  LabelData,
} from "../types/community";
import { geoConverter } from "../utils/geoConverter";
import { createBuildingMaterial } from "../utils/threeHelpers";

export interface BuildingMesh extends THREE.Mesh {
  userData: BuildingProperties & {
    isBuilding: true;
    originalHeight: number;
  };
}

export function useBuilding() {
  const buildings = shallowRef<BuildingMesh[]>([]);
  const buildingGroup = shallowRef<THREE.Group | null>(null);

  /**
   * 从GeoJSON生成建筑
   */
  function generateFromGeoJSON(
    geojson: GeoJSONData,
    opacity: number = 1,
  ): THREE.Group {
    const group = markRaw(new THREE.Group());
    buildingGroup.value = group;

    const buildingList: BuildingMesh[] = [];

    geojson.features.forEach((feature) => {
      const { properties, geometry } = feature;

      if (geometry.type !== "Polygon") return;

      const mesh = createBuildingFromPolygon(
        geometry.coordinates[0],
        properties,
        opacity,
      );

      if (mesh) {
        buildingList.push(mesh as BuildingMesh);
        group.add(mesh);
      }
    });

    buildings.value = buildingList;
    return group;
  }

  /**
   * 从多边形创建建筑
   */
  function createBuildingFromPolygon(
    coords: number[][],
    properties: BuildingProperties,
    opacity: number = 1,
  ): THREE.Mesh | null {
    if (coords.length < 3) return null;

    // 创建形状
    const shape = new THREE.Shape();

    coords.forEach((coord, index) => {
      const { x, y } = geoConverter.getRelativeOffset(coord[0], coord[1]);

      if (index === 0) {
        shape.moveTo(x, y);
      } else {
        shape.lineTo(x, y);
      }
    });

    // 闭合形状
    const first = geoConverter.getRelativeOffset(coords[0][0], coords[0][1]);
    shape.lineTo(first.x, first.y);

    // 挤压设置
    const extrudeSettings: THREE.ExtrudeGeometryOptions = {
      steps: 1,
      depth: properties.height * 0.15,
      bevelEnabled: true,
      bevelThickness: 0.3,
      bevelSize: 0.3,
      bevelOffset: 0,
      bevelSegments: 2,
    };

    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);

    // 计算居中偏移
    geometry.center();
    geometry.translate(0, properties.height * 0.075, 0);

    // 创建材质
    const material = createBuildingMaterial(
      properties.color,
      opacity,
      opacity < 1 ? "#222222" : "#111111",
    );

    const mesh = markRaw(new THREE.Mesh(geometry, material)) as BuildingMesh;
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    // 存储元数据
    mesh.userData = {
      ...properties,
      isBuilding: true,
      originalHeight: properties.height,
    };

    // 添加边框效果
    addEdgesToMesh(mesh, properties.color);

    return mesh;
  }

  /**
   * 为建筑添加边框线
   */
  function addEdgesToMesh(mesh: THREE.Mesh, color: string): void {
    const edges = new THREE.EdgesGeometry(mesh.geometry);
    const line = markRaw(
      new THREE.LineSegments(
        edges,
        new THREE.LineBasicMaterial({ color: 0x000000 }),
      ),
    );
    mesh.add(line);
  }

  /**
   * 生成建筑标签数据
   */
  function generateLabelData(): LabelData[] {
    const labels: LabelData[] = [];

    buildings.value.forEach((building) => {
      const { name, color, height } = building.userData;

      // 计算标签位置（建筑顶部中心）
      const box = new THREE.Box3().setFromObject(building);
      const center = new THREE.Vector3();
      box.getCenter(center);
      center.y = height * 0.15 + 2; // 在建筑顶部上方

      labels.push({
        id: `label-${building.userData.id || building.id}`,
        text: name,
        position: [center.x, center.y, center.z],
        color: color,
        fontSize: 16,
        buildingId: building.userData.id,
      });
    });

    return labels;
  }

  /**
   * 高亮指定建筑
   */
  function highlightBuilding(buildingId: string): void {
    buildings.value.forEach((building) => {
      const material = building.material as THREE.MeshStandardMaterial;
      if (building.userData.id === buildingId) {
        material.emissive.setHex(0x444444);
        material.emissiveIntensity = 0.8;
      } else {
        material.emissive.setHex(0x111111);
        material.emissiveIntensity = 0.2;
      }
    });
  }

  /**
   * 取消所有高亮
   */
  function clearHighlight(): void {
    buildings.value.forEach((building) => {
      const material = building.material as THREE.MeshStandardMaterial;
      material.emissive.setHex(0x111111);
      material.emissiveIntensity = 0.2;
    });
  }

  /**
   * 更新建筑透明度
   */
  function updateOpacity(opacity: number): void {
    buildings.value.forEach((building) => {
      const material = building.material as THREE.MeshStandardMaterial;
      material.opacity = opacity;
      material.transparent = opacity < 1;
    });
  }

  /**
   * 获取建筑总数
   */
  function getBuildingCount(): number {
    return buildings.value.length;
  }

  /**
   * 根据ID获取建筑
   */
  function getBuildingById(id: string): BuildingMesh | undefined {
    return buildings.value.find((b) => b.userData.id === id);
  }

  return {
    buildings,
    buildingGroup,
    generateFromGeoJSON,
    generateLabelData,
    highlightBuilding,
    clearHighlight,
    updateOpacity,
    getBuildingCount,
    getBuildingById,
  };
}
