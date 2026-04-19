import { computed, markRaw, shallowRef } from "vue";
import * as THREE from "three";
import type {
  GeoJSONData,
  BuildingProperties,
  LabelData,
} from "../types/community";
import {
  createBuildingMaterial,
  computeGeoCenter,
  createProjector,
} from "../utils/threeHelpers";
import { useSceneStore } from "../stores";
import { storeToRefs } from "pinia";

export interface BuildingMesh extends THREE.Mesh {
  userData: BuildingProperties & {
    isBuilding: true;
    originalHeight: number;
  };
}
export interface RiverMesh extends THREE.Mesh {
  userData: {
    isRiver: true;
    type: string;
    width: number;
    time: number;
  };
}
export interface RoadMesh extends THREE.Mesh {
  userData: {
    isRoad: true;
    type: string;
    width: number;
  };
}

// const EARTH_SCALE = 111000;

export function useBuilding() {
  const sceneStore = useSceneStore();
  const { config } = storeToRefs(sceneStore);
  const buildings = computed({
    get() {
      return config.value.buildings;
    },
    set(val) {
      sceneStore.config.buildings = val;
    },
  });
  const roadLists = shallowRef<RoadMesh[]>([]);
  const riverLists = shallowRef<RiverMesh[]>([]);
  const buildingGroup = shallowRef<THREE.Group | null>(null);

  // function computeGeoCenter(features: any[]): [number, number] {
  //   let sumX = 0;
  //   let sumY = 0;
  //   let count = 0;

  //   features.forEach((f) => {
  //     if (f.geometry.type !== "Polygon") return;
  //     const coords = f.geometry.coordinates[0];
  //     coords.forEach(([lng, lat]) => {
  //       sumX += lng;
  //       sumY += lat;
  //       count++;
  //     });
  //   });

  //   return [sumX / count, sumY / count];
  // }

  // function createProjector(center: [number, number], scale = 1) {
  //   const cosLat = Math.cos((center[1] * Math.PI) / 180);

  //   return (lng: number, lat: number): [number, number] => {
  //     const x = (lng - center[0]) * EARTH_SCALE * cosLat * scale;
  //     const y = (lat - center[1]) * EARTH_SCALE * scale;
  //     return [x, y];
  //   };
  // }

  function generateFromGeoJSON(
    geojson: GeoJSONData,
    opacity: number = 1,
    scale: number = 0.4,
  ): THREE.Group {
    const group = markRaw(new THREE.Group());
    buildingGroup.value = group;

    const buildingList: BuildingMesh[] = [];
    const roadList: RoadMesh[] = [];
    const riverList: RiverMesh[] = [];

    const center = computeGeoCenter(geojson.features);
    const project = createProjector(center, scale);

    const box = new THREE.Box3();

    geojson.features.forEach((feature) => {
      const { properties, geometry } = feature;

      if (geometry.type === "Polygon") {
        const projected = geometry.coordinates[0].map(([lng, lat]) => {
          const [x, y] = project(lng, lat);
          return [x, y];
        });

        const mesh = createBuildingFromPolygon(projected, properties, opacity);
        if (mesh) {
          buildingList.push(mesh);
          group.add(mesh);
          box.expandByObject(mesh);
        }
      } else if (geometry.type === "LineString") {
        if (properties?.waterway) {
          const c = geometry.coordinates.map(([lng, lat]) => project(lng, lat));
          const m = createRiverMesh(c, properties.waterway, 6);
          if (m) {
            riverList.push(m);
            group.add(m);
            box.expandByObject(m);
          }
        } else {
          const c = geometry.coordinates.map(([lng, lat]) => project(lng, lat));
          const m = createRoadMesh(c, properties.highway, 1);
          if (m) {
            roadList.push(m);
            group.add(m);
            box.expandByObject(m);
          }
        }
      }
    });

    buildings.value = buildingList;
    roadLists.value = roadList;
    riverLists.value = riverList;
    group.userData.boundingBox = box;

    return group;
  }

  /**
   * ⭐ 新增：高度渐变
   */
  function applyHeightGradient(geometry: THREE.BufferGeometry) {
    geometry.computeBoundingBox();

    const box = geometry.boundingBox!;
    const minY = box.min.y;
    const maxY = box.max.y;
    const height = maxY - minY || 1;

    const pos = geometry.attributes.position;
    const colors = [];

    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      const t = (y - minY) / height;

      const top = new THREE.Color(0x4fd1ff);
      const bottom = new THREE.Color(0x0a1a2a);

      const color = bottom.clone().lerp(top, t);
      colors.push(color.r, color.g, color.b);
    }

    geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  }

  function createBuildingFromPolygon(
    coords: number[][],
    properties: BuildingProperties,
    opacity: number = 1,
  ): BuildingMesh | null {
    if (coords.length < 3) return null;

    const shape = new THREE.Shape();

    coords.forEach(([x, y], index) => {
      if (index === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    });

    shape.closePath();

    const height = properties.height * 0.15;

    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: height,
      bevelEnabled: false,
    });

    geometry.rotateX(-Math.PI / 2);

    // ⭐ 渐变
    applyHeightGradient(geometry);

    const material = createBuildingMaterial(
      opacity,
      opacity < 1 ? "#222222" : "#111111",
    ) as THREE.MeshStandardMaterial;

    // ⭐ 开启顶点颜色
    material.vertexColors = true;

    // ⭐ 修复你原来的写法
    material.metalness = 0.6;
    material.roughness = 0.4;
    material.emissive.set(0x0a3a66);
    material.emissiveIntensity = 0.3;

    material.onBeforeCompile = (shader) => {
      shader.uniforms.u_time = { value: 0 };
      shader.uniforms.u_scanColor = { value: new THREE.Color(0x00d4ff) };
      shader.uniforms.u_scanCenter = { value: new THREE.Vector3(0, 0, 0) };
      shader.uniforms.u_opacity = { value: 0.6 };
      shader.vertexShader = shader.vertexShader
        .replace(
          "#include <common>",
          `
    #include <common>
    varying vec3 vWorldPosition;
    `,
        )
        .replace(
          "#include <worldpos_vertex>",
          `
    #include <worldpos_vertex>
    vWorldPosition = worldPosition.xyz;
    `,
        );

      shader.fragmentShader = shader.fragmentShader
        .replace(
          "#include <common>",
          `
    #include <common>
    uniform float u_time;
    uniform vec3 u_scanColor;
    uniform vec3 u_scanCenter;
    varying vec3 vWorldPosition;
    uniform float u_opacity;
    `,
        )
        .replace(
          "#include <dithering_fragment>",
          `
     float dist = distance(vWorldPosition.xz, u_scanCenter.xz);

float maxRadius = 1000.0; // 扫描最大范围
float cycle = 3.0;        // ⭐ 周期（秒）

float progress = mod(u_time, cycle) / cycle;
float r = progress * maxRadius;

float ring =
  smoothstep(r - 40.0, r, dist) -
  smoothstep(r, r + 80.0, dist);

float trailFade = exp(-(r - dist) * 0.01);
trailFade *= step(dist, r);
gl_FragColor.rgb += u_scanColor * trailFade * 0.5;
    #include <dithering_fragment>
    `,
        );

      material.userData.shader = shader;
    };

    const mesh = markRaw(new THREE.Mesh(geometry, material)) as BuildingMesh;

    mesh.frustumCulled = false;
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    mesh.userData = {
      ...properties,
      isBuilding: true,
      originalHeight: properties.height,
    };

    addEdgesToMesh(mesh);

    return mesh;
  }

  function createRoadMesh(
    coords: number[][],
    type: string,
    width: number,
  ): RoadMesh | null {
    if (coords.length < 2) return null;

    const points = coords.map(([x, y]) => new THREE.Vector3(x, 0.05, y));
    const curve = new THREE.CatmullRomCurve3(points, false);

    const geometry = new THREE.TubeGeometry(
      curve,
      Math.max(10, coords.length),
      width,
      4,
      false,
    );

    geometry.scale(1, 0.01, -1);

    const material = new THREE.MeshStandardMaterial({
      color: 0x2b3f5a, // 提亮一点（关键）
      roughness: 0.8,
      metalness: 0.2,

      // ⭐ 加一点自发光，否则暗场景直接黑
      emissive: 0x0a2a4a,
      emissiveIntensity: 0.65,
    });

    const mesh = markRaw(new THREE.Mesh(geometry, material)) as RoadMesh;
    return mesh;
  }

  function createRiverMesh(
    coords: number[][],
    type: string,
    width: number,
  ): RiverMesh | null {
    if (coords.length < 2) return null;

    const points = coords.map(([x, y]) => new THREE.Vector3(x, 0.02, y));
    const curve = new THREE.CatmullRomCurve3(points, false);

    const geometry = new THREE.TubeGeometry(
      curve,
      Math.max(10, coords.length),
      width,
      4,
      false,
    );

    geometry.scale(1, 0.01, -1);

    const material = new THREE.MeshStandardMaterial({
      color: 0x1ea7ff,
      emissive: 0x0a4fff,
      emissiveIntensity: 0.4,
    });

    const mesh = markRaw(new THREE.Mesh(geometry, material)) as RiverMesh;
    return mesh;
  }

  function addEdgesToMesh(mesh: THREE.Mesh): void {
    const edges = new THREE.EdgesGeometry(mesh.geometry);
    const line = new THREE.LineSegments(
      edges,
      new THREE.LineBasicMaterial({
        color: 0x00d4ff,
        transparent: true,
        opacity: 0.15,
      }),
    );
    mesh.add(line);
  }

  function generateLabelData(): LabelData[] {
    return buildings.value.map((building) => {
      const { name } = building.userData;

      const box = new THREE.Box3().setFromObject(building);
      const center = new THREE.Vector3();
      box.getCenter(center);

      center.y += 2;

      return {
        id: `label-${building.userData.id || building.id}`,
        text: name,
        position: [center.x, center.y, center.z],
        color: "#ffffff",
        fontSize: 16,
        buildingId: building.userData.id,
      };
    });
  }

  return {
    buildings,
    buildingGroup,
    generateFromGeoJSON,
    generateLabelData,
  };
}
