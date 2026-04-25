import * as THREE from "three";
import { useSceneStore } from "../stores";
import { storeToRefs } from "pinia";
import { computed, onUnmounted, watch } from "vue";

type RoamingOptions = {
  getCamera: () => THREE.PerspectiveCamera | null;
  getControls: () => any;
  getBuildings: () => THREE.Object3D[];
};

enum RoamState {
  IDLE,
  RAISING,
  ORBITING,
}

export function createRoamingController(options: RoamingOptions) {
  const { getCamera, getControls, getBuildings } = options;

  const sceneStore = useSceneStore();
  const { config } = storeToRefs(sceneStore);

  const isRoaming = computed({
    get: () => config.value.isRoaming,
    set: (val) => (sceneStore.config.isRoaming = val),
  });

  let state = RoamState.IDLE;

  const center = new THREE.Vector3();
  const orbitCenter = new THREE.Vector3();

  let angle = 0;
  const ORBIT_RADIUS = 350;
  const HEIGHT = 200;
  const ORBIT_SPEED = 0.0007;

  let raiseT = 0;

  const tempBox = new THREE.Box3();
  const unionBox = new THREE.Box3();
  const targetPos = new THREE.Vector3();
  const dir = new THREE.Vector3();

  let inited = false; // ✅ 防止未初始化就运行

  // ===== 计算建筑中心（带日志）
  function computeBuildingsCenter() {
    const buildings = getBuildings();

    if (!buildings || buildings.length === 0) {
      console.warn("[Roaming] 没有建筑数据");
      return false;
    }

    unionBox.makeEmpty();

    let validCount = 0;

    for (const obj of buildings) {
      if (!obj) continue;

      tempBox.setFromObject(obj);

      if (!tempBox.isEmpty()) {
        unionBox.union(tempBox);
        validCount++;
      }
    }

    if (validCount === 0) {
      console.warn("[Roaming] 建筑 boundingBox 无效");
      return false;
    }

    unionBox.getCenter(center);

    orbitCenter.copy(center);
    orbitCenter.y += HEIGHT;

    console.log("[Roaming] center:", center);

    inited = true;
    return true;
  }

  function start() {
    const cam = getCamera();
    const controls = getControls();

    if (!cam || !controls) return;

    const ok = computeBuildingsCenter();
    if (!ok) return;

    const dist = cam.position.distanceTo(center);

    if (dist < ORBIT_RADIUS) {
      state = RoamState.RAISING;
      raiseT = 0;
      return;
    }

    state = RoamState.ORBITING;
  }

  function stop() {
    state = RoamState.IDLE;
    isRoaming.value = false;
    inited = false;
  }

  function updateRaising(cam: THREE.PerspectiveCamera) {
    raiseT += 0.02;

    let t = raiseT;
    if (t > 1) t = 1;

    const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

    const currentDist = cam.position.distanceTo(center);

    const dist = THREE.MathUtils.lerp(currentDist, ORBIT_RADIUS, ease);

    dir.subVectors(cam.position, center).normalize();

    cam.position.copy(center).add(dir.multiplyScalar(dist));

    cam.lookAt(center);

    if (t === 1) {
      state = RoamState.ORBITING;
    }
  }

  function updateOrbiting(cam: THREE.PerspectiveCamera, controls: any) {
    angle += ORBIT_SPEED;

    const x = orbitCenter.x + ORBIT_RADIUS * Math.cos(angle);
    const z = orbitCenter.z + ORBIT_RADIUS * Math.sin(angle);
    const y = orbitCenter.y;

    targetPos.set(x, y, z);

    cam.position.copy(targetPos);
    cam.lookAt(center);

    controls.target.copy(center);
  }

  function update(delta: number, isFocusing: boolean) {
    const cam = getCamera();
    const controls = getControls();

    if (!cam || !controls) return;
    if (!isRoaming.value || isFocusing) return;

    // ✅ 如果还没初始化，尝试初始化（关键修复）
    if (!inited) {
      const ok = computeBuildingsCenter();
      if (!ok) return;
      state = RoamState.ORBITING;
    }

    if (state === RoamState.RAISING) {
      updateRaising(cam);
      return;
    }

    if (state === RoamState.ORBITING) {
      updateOrbiting(cam, controls);
    }
  }

  const unwatch = watch(
    () => config.value.isRoaming,
    (val) => {
      if (val) {
        console.log("[Roaming] start");
        start();
      } else {
        console.log("[Roaming] stop");
        stop();
      }
    },
  );

  function bindUserControlBreak() {
    const controls = getControls();
    if (!controls) return;

    controls.addEventListener("start", () => {
      stop();
    });
  }

  onUnmounted(() => unwatch());

  return {
    update,
    bindUserControlBreak,
  };
}
