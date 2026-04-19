import * as THREE from "three";
import { MapControls } from "three/examples/jsm/controls/MapControls";

export function createMapEngineControls(
  camera: THREE.PerspectiveCamera,
  dom: HTMLElement,
) {
  const controls = new MapControls(camera, dom);

  // ===== 基础参数 =====
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;

  controls.enablePan = true;
  controls.panSpeed = 1.2;

  controls.enableZoom = false; // ❗禁用默认缩放
  controls.enableRotate = true;

  controls.maxPolarAngle = Math.PI / 2.1;
  controls.minPolarAngle = Math.PI / 6;

  controls.target.set(0, 0, 0);

  // ===== 惯性（预留）=====
  let velocity = new THREE.Vector2();
  let isDragging = false;

  dom.addEventListener("pointerdown", () => {
    isDragging = true;
    velocity.set(0, 0);
  });

  dom.addEventListener("pointerup", () => {
    isDragging = false;
  });

  dom.addEventListener("pointermove", (e) => {
    if (!isDragging) return;
    velocity.set(e.movementX, e.movementY);
  });

  // ===== ✅ 地图级滚轮缩放（核心替换）=====
  dom.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();

      // 1️⃣ 鼠标归一化
      const rect = dom.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1,
      );

      // 2️⃣ 射线找地面点
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, camera);

      const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      const hitPoint = new THREE.Vector3();

      if (!raycaster.ray.intersectPlane(plane, hitPoint)) return;

      // 3️⃣ 当前相机 offset
      const offset = new THREE.Vector3().subVectors(
        camera.position,
        controls.target,
      );

      const distance = offset.length();

      // 4️⃣ 指数缩放（关键）
      const scale = Math.pow(0.95, -e.deltaY * 0.1);

      const newDistance = THREE.MathUtils.clamp(distance * scale, 10, 3000);

      offset.setLength(newDistance);

      // 5️⃣ 🔥 核心：target 向鼠标点偏移
      const newTarget = new THREE.Vector3().lerpVectors(
        hitPoint,
        controls.target,
        scale,
      );

      // 6️⃣ 新相机位置
      const newPosition = new THREE.Vector3().addVectors(newTarget, offset);

      // 7️⃣ 平滑（关键：地图感）
      controls.target.lerp(newTarget, 0.3);
      camera.position.lerp(newPosition, 0.3);

      controls.update();
    },
    { passive: false },
  );

  // ===== 每帧更新 =====
  function update() {
    // 惯性（可开）
    // if (!isDragging) {
    //   velocity.multiplyScalar(0.92);
    //   if (velocity.length() > 0.01) {
    //     controls.target.x -= velocity.x * 0.05;
    //     controls.target.z += velocity.y * 0.05;
    //   }
    // }

    // 根据距离动态调整平移速度（地图核心）
    const dist = camera.position.distanceTo(controls.target);
    controls.panSpeed = THREE.MathUtils.clamp(dist / 100, 0.5, 3);

    controls.update();
  }

  return {
    controls,
    update,
  };
}
