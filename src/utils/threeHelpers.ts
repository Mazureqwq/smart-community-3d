import * as THREE from "three";

/**
 * 创建地面网格
 */
export function createGrid(
  size: number = 500,
  divisions: number = 50,
): THREE.GridHelper {
  const grid = new THREE.GridHelper(size, divisions, 0x00f2ff, 0x334466);
  grid.position.y = -0.01;
  return grid;
}

/**
 * 创建坐标轴辅助（调试用）
 */
export function createAxesHelper(size: number = 100): THREE.AxesHelper {
  return new THREE.AxesHelper(size);
}

/**
 * 创建环境光
 */
export function createAmbientLight(
  color: number = 0x404060,
  intensity: number = 0.6,
): THREE.AmbientLight {
  return new THREE.AmbientLight(color, intensity);
}

/**
 * 创建主光源（模拟太阳）
 */
export function createDirectionalLight(
  color: number = 0xfff5d1,
  intensity: number = 1.2,
  position: THREE.Vector3 = new THREE.Vector3(50, 100, 50),
): THREE.DirectionalLight {
  const light = new THREE.DirectionalLight(color, intensity);
  light.position.copy(position);
  light.castShadow = true;
  light.receiveShadow = true;

  // 阴影配置
  light.shadow.mapSize.width = 2048;
  light.shadow.mapSize.height = 2048;
  light.shadow.camera.near = 0.5;
  light.shadow.camera.far = 200;
  light.shadow.camera.left = -50;
  light.shadow.camera.right = 50;
  light.shadow.camera.top = 50;
  light.shadow.camera.bottom = -50;
  light.shadow.bias = -0.0001;

  return light;
}

/**
 * 创建点光源（补光）
 */
export function createPointLight(
  color: number = 0x4466ff,
  intensity: number = 0.5,
  position: THREE.Vector3 = new THREE.Vector3(-20, 30, 20),
): THREE.PointLight {
  const light = new THREE.PointLight(color, intensity);
  light.position.copy(position);
  return light;
}

/**
 * 创建CSS2D标签
 */
export function createCSS2DLabel(
  text: string,
  color: string = "#ffffff",
  fontSize: string = "14px",
  bgColor: string = "rgba(0,0,0,0.7)",
): HTMLDivElement {
  const div = document.createElement("div");
  div.textContent = text;
  div.style.color = color;
  div.style.fontSize = fontSize;
  div.style.fontWeight = "bold";
  div.style.fontFamily = "Microsoft YaHei, sans-serif";
  div.style.padding = "4px 12px";
  div.style.borderRadius = "4px";
  div.style.background = bgColor;
  div.style.border = `1px solid ${color}`;
  div.style.boxShadow = "0 2px 10px rgba(0,0,0,0.3)";
  div.style.pointerEvents = "none";
  div.style.whiteSpace = "nowrap";
  div.style.textShadow = "1px 1px 2px rgba(0,0,0,0.5)";
  return div;
}

/**
 * 创建建筑材质
 */
export function createBuildingMaterial(
  color: string,
  opacity: number = 1,
  emissive: string = "#111111",
): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: color,
    emissive: new THREE.Color(emissive),
    roughness: 0.5,
    metalness: 0.1,
    transparent: opacity < 1,
    opacity: opacity,
    side: THREE.DoubleSide,
  });
}

/**
 * 计算边界框
 */
export function computeBoundingBox(meshes: THREE.Mesh[]): THREE.Box3 {
  const box = new THREE.Box3();
  meshes.forEach((mesh) => {
    mesh.updateMatrixWorld();
    box.expandByObject(mesh);
  });
  return box;
}
