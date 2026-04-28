import {
  ref,
  onMounted,
  onUnmounted,
  type Ref,
  markRaw,
  shallowRef,
} from "vue";
import * as THREE from "three";
import { CSS2DRenderer } from "three/examples/jsm/renderers/CSS2DRenderer";
import {
  createAmbientLight,
  createDirectionalLight,
  createPointLight,
} from "../utils/threeHelpers";
import { useSceneStore } from "../stores";
import { storeToRefs } from "pinia";
import { createMapEngineControls } from "../utils/MapControls";
import { createRoamingController } from "../utils/roamingController";
import { createInteractionController } from "../utils/interactionController";

export function useScene(containerRef: Ref<HTMLElement | null>) {
  // ===== 核心对象 =====
  const scene = shallowRef<THREE.Scene | null>(null);
  const camera = shallowRef<THREE.PerspectiveCamera | null>(null);
  const renderer = shallowRef<THREE.WebGLRenderer | null>(null);
  const labelRenderer = shallowRef<CSS2DRenderer | null>(null);
  let mapEngine: ReturnType<typeof createMapEngineControls> | null = null;
  const ambientLight = shallowRef<THREE.AmbientLight | null>(null);
  const directionalLight = shallowRef<THREE.DirectionalLight | null>(null);

  const isReady = ref(false);
  const fps = ref(0);

  const sceneStore = useSceneStore();
  const { config } = storeToRefs(sceneStore);

  let animationId: number | null = null;
  let lastTime = 0;
  let frameCount = 0;

  let focusTarget: THREE.Vector3 | null = null;

  let startTarget = new THREE.Vector3();
  let startDistance = 0;
  let endDistance = 0;

  let roaming: ReturnType<typeof createRoamingController> | null = null;

  let focusT = 0; // 0~1

  // ✅ 地图范围（关键）
  let mapBounds: THREE.Box3 | null = null;

  let interaction: ReturnType<typeof createInteractionController> | null = null;

  // ===== 初始化 =====
  function initScene(): void {
    if (!containerRef.value) return;

    const newScene = markRaw(new THREE.Scene());
    newScene.background = new THREE.Color(0x0a1628);
    scene.value = newScene;

    const newCamera = markRaw(
      new THREE.PerspectiveCamera(
        45,
        containerRef.value.clientWidth / containerRef.value.clientHeight,
        1,
        1000000,
      ),
    );

    newCamera.position.set(80, 120, 120);
    newCamera.lookAt(0, 0, 0);
    camera.value = newCamera;

    const newRenderer = markRaw(
      new THREE.WebGLRenderer({
        antialias: true,
        logarithmicDepthBuffer: true,
      }),
    );

    newRenderer.setSize(
      containerRef.value.clientWidth,
      containerRef.value.clientHeight,
    );
    newRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    newRenderer.shadowMap.enabled = true;
    containerRef.value.appendChild(newRenderer.domElement);
    renderer.value = newRenderer;

    const newLabelRenderer = markRaw(new CSS2DRenderer());
    newLabelRenderer.setSize(
      containerRef.value.clientWidth,
      containerRef.value.clientHeight,
    );
    newLabelRenderer.domElement.style.position = "absolute";
    newLabelRenderer.domElement.style.top = "0";
    newLabelRenderer.domElement.style.zIndex = "1";
    newLabelRenderer.domElement.style.pointerEvents = "none";
    containerRef.value.appendChild(newLabelRenderer.domElement);
    labelRenderer.value = newLabelRenderer;

    mapEngine = createMapEngineControls(newCamera, newRenderer.domElement);

    initLights();
    addGround();
    isReady.value = true;

    roaming = createRoamingController({
      getCamera: () => camera.value,
      getControls: () => mapEngine?.controls,
      getBuildings: () => config.value.buildings,
    });

    roaming.bindUserControlBreak();
  }

  // ===== 光照 =====
  function initLights(): void {
    if (!scene.value) return;

    const ambient = markRaw(createAmbientLight(0x404060, 1));
    scene.value.add(ambient);
    ambientLight.value = ambient;

    const directional = markRaw(createDirectionalLight(0xfff5d1, 1));
    scene.value.add(directional);
    directionalLight.value = directional;

    scene.value.add(
      createPointLight(0x4466ff, 0.4, new THREE.Vector3(-30, 40, 30)),
    );
    scene.value.add(
      createPointLight(0xff9966, 0.3, new THREE.Vector3(40, 30, -30)),
    );
  }

  // ===== 地面 =====
  let ground: THREE.Mesh | null = null;

  function addGround(): void {
    const geometry = new THREE.PlaneGeometry(1900, 1500);

    const material = new THREE.MeshStandardMaterial({
      color: 0x001f25,
      roughness: 0.95,
      metalness: 0.05,
      side: THREE.DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1,
    });

    ground = new THREE.Mesh(geometry, material);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.1;
    ground.receiveShadow = true;

    scene.value?.add(ground);
  }

  // ===== 添加对象 =====
  function addToScene(...objects: THREE.Object3D[]) {
    objects.forEach((obj) => {
      scene.value?.add(markRaw(obj));

      // ✅ 自动识别地图 boundingBox
      if (obj.userData?.boundingBox) {
        mapBounds = obj.userData.boundingBox;
        const center = new THREE.Vector3();
        mapBounds.getCenter(center);
      }

      // ✅ 收集建筑对象
      if (obj.userData?.type === "building" || obj.name.includes("building")) {
        // buildings.value.push(obj);
        config.value.buildings = [...config.value.buildings, obj];
      }
    });
  }
  // function focusOn(targetObj: THREE.Object3D) {
  //   if (!camera.value || !mapEngine) return;

  //   const cam = camera.value;
  //   const controls = mapEngine.controls;

  //   const center = new THREE.Vector3();
  //   new THREE.Box3().setFromObject(targetObj).getCenter(center);

  //   // ⭐ 当前状态
  //   startTarget.copy(controls.target);
  //   startDistance = cam.position.distanceTo(controls.target);

  //   // ⭐ 目标距离（根据包围盒算一个更近的距离）
  //   const size = new THREE.Vector3();
  //   new THREE.Box3().setFromObject(targetObj).getSize(size);
  //   const maxDim = Math.max(size.x, size.y, size.z);

  //   const fov = (cam.fov * Math.PI) / 180;
  //   const fitDist = maxDim / (2 * Math.tan(fov / 2));

  //   endDistance = Math.max(fitDist * 1.2, 30); // 下限避免贴脸

  //   focusTarget = center;
  //   focusT = 0;
  // }

  // ===== 动画 =====
  function animate(): void {
    if (!scene.value || !camera.value || !renderer.value) return;

    animationId = requestAnimationFrame(animate);

    const time = performance.now();
    scene.value?.traverse((obj: any) => {
      if (obj.isMesh && obj.material?.userData?.shader) {
        obj.material.userData.shader.uniforms.u_time.value += 0.02;
      }
    });

    if (focusTarget && camera.value && mapEngine) {
      const cam = camera.value;
      const controls = mapEngine.controls;

      // ⭐ 进度
      focusT += 0.04; // 控制速度（0.02慢，0.06快）
      let t = focusT;

      if (t >= 1) {
        t = 1;
      }

      // ⭐ easeInOut
      const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

      // ===== 1. 插值 target（转视角）
      controls.target.lerpVectors(startTarget, focusTarget, ease);

      // ===== 2. 插值距离（拉近）
      const dist = THREE.MathUtils.lerp(startDistance, endDistance, ease);

      // 当前方向（从 target 指向相机）
      const dir = new THREE.Vector3()
        .subVectors(cam.position, controls.target)
        .normalize();

      // 重新计算相机位置（围绕 target 收缩）
      cam.position.copy(controls.target.clone().add(dir.multiplyScalar(dist)));

      if (t === 1) {
        focusTarget = null;
      }
    }
    roaming?.update(0, !!focusTarget);

    mapEngine?.update();
    renderer.value.render(scene.value, camera.value);
    labelRenderer.value?.render(scene.value, camera.value);

    interaction?.update(0.016);

    // 更新 FPS
    frameCount++;
    if (time - lastTime >= 1000) {
      fps.value = frameCount;
      frameCount = 0;
      lastTime = time;
    }
  }

  // ===== ✅ 地图范围限制（核心）=====
  if (camera.value && mapBounds) {
    const cam = camera.value;

    const dir = new THREE.Vector3();
    cam.getWorldDirection(dir);

    const distance = 100;
    const target = cam.position.clone().add(dir.multiplyScalar(distance));

    const margin = 200;

    const minX = mapBounds.min.x - margin;
    const maxX = mapBounds.max.x + margin;
    const minZ = mapBounds.min.z - margin;
    const maxZ = mapBounds.max.z + margin;

    target.x = THREE.MathUtils.clamp(target.x, minX, maxX);
    target.z = THREE.MathUtils.clamp(target.z, minZ, maxZ);

    const offset = cam.position.clone().sub(target);
    cam.position.copy(target.clone().add(offset));
  }

  function startAnimation() {
    lastTime = performance.now();
    animate();
  }

  function stopAnimation() {
    if (animationId) cancelAnimationFrame(animationId);
  }

  function handleResize(): void {
    if (!containerRef.value || !camera.value || !renderer.value) return;

    const w = containerRef.value.clientWidth;
    const h = containerRef.value.clientHeight;

    camera.value.aspect = w / h;
    camera.value.updateProjectionMatrix();

    renderer.value.setSize(w, h);
    labelRenderer.value?.setSize(w, h);
  }

  function dispose() {
    stopAnimation();

    renderer.value?.dispose();
    renderer.value?.domElement.remove();
    labelRenderer.value?.domElement.remove();

    scene.value = null;
    camera.value = null;
    renderer.value = null;
    labelRenderer.value = null;
  }

  onMounted(() => {
    initScene();

    interaction = createInteractionController({
      getScene: () => scene.value,
      getCamera: () => camera.value,
      getRendererDom: () => renderer.value?.domElement,
      getControls: () => mapEngine?.controls,
      getBuildings: () => config.value.buildings,
    });

    interaction.bind();
    startAnimation();
    window.addEventListener("resize", handleResize);
  });

  onUnmounted(() => {
    window.removeEventListener("resize", handleResize);
    dispose();
  });

  return {
    scene,
    camera,
    renderer,
    labelRenderer,
    isReady,
    fps,
    addToScene,
    // focusOn,
  };
}
