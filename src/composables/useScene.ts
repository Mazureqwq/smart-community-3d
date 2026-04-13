import {
  ref,
  onMounted,
  onUnmounted,
  type Ref,
  markRaw,
  shallowRef,
} from "vue";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { CSS2DRenderer } from "three/examples/jsm/renderers/CSS2DRenderer";
import type { SceneConfig } from "../types/community";
import {
  createGrid,
  createAxesHelper,
  createAmbientLight,
  createDirectionalLight,
  createPointLight,
} from "../utils/threeHelpers";

export function useScene(containerRef: Ref<HTMLElement | null>) {
  // 核心对象
  // 核心对象 - 使用 shallowRef 避免深度响应式
  const scene = shallowRef<THREE.Scene | null>(null);
  const camera = shallowRef<THREE.PerspectiveCamera | null>(null);
  const renderer = shallowRef<THREE.WebGLRenderer | null>(null);
  const labelRenderer = shallowRef<CSS2DRenderer | null>(null);
  const controls = shallowRef<OrbitControls | null>(null);

  // 光源引用
  const ambientLight = shallowRef<THREE.AmbientLight | null>(null);
  const directionalLight = shallowRef<THREE.DirectionalLight | null>(null);

  // 普通状态可以用 ref
  const isReady = ref(false);
  const fps = ref(0);

  // 场景配置
  const config = ref<SceneConfig>({
    showLabels: true,
    showGrid: true,
    showAxes: false,
    ambientLightIntensity: 0.6,
    directionalLightIntensity: 1.2,
    isNightMode: false,
    buildingOpacity: 1,
  });

  // 动画循环ID
  let animationId: number | null = null;
  let lastTime = 0;
  let frameCount = 0;

  /**
   * 初始化场景
   */
  function initScene(): void {
    if (!containerRef.value) return;

    // 创建场景 - 使用 markRaw 防止被代理
    const newScene = markRaw(new THREE.Scene());
    newScene.background = new THREE.Color(0x0a1628);
    scene.value = newScene;

    // 创建相机
    const newCamera = markRaw(
      new THREE.PerspectiveCamera(
        45,
        containerRef.value.clientWidth / containerRef.value.clientHeight,
        0.1,
        1000,
      ),
    );
    newCamera.position.set(80, 60, 100);
    newCamera.lookAt(0, 0, 0);
    camera.value = newCamera;

    // 创建WebGL渲染器
    const newRenderer = markRaw(
      new THREE.WebGLRenderer({ antialias: true, alpha: false }),
    );
    newRenderer.setSize(
      containerRef.value.clientWidth,
      containerRef.value.clientHeight,
    );
    newRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    newRenderer.shadowMap.enabled = true;
    newRenderer.shadowMap.type = THREE.PCFSoftShadowMap;
    containerRef.value.appendChild(newRenderer.domElement);
    renderer.value = newRenderer;

    // 创建CSS2渲染器
    const newLabelRenderer = markRaw(new CSS2DRenderer());
    newLabelRenderer.setSize(
      containerRef.value.clientWidth,
      containerRef.value.clientHeight,
    );
    newLabelRenderer.domElement.style.position = "absolute";
    newLabelRenderer.domElement.style.top = "0";
    newLabelRenderer.domElement.style.left = "0";
    newLabelRenderer.domElement.style.pointerEvents = "none";
    containerRef.value.appendChild(newLabelRenderer.domElement);
    labelRenderer.value = newLabelRenderer;

    // 创建轨道控制器
    if (newCamera && newRenderer) {
      const newControls = markRaw(
        new OrbitControls(newCamera, newRenderer.domElement),
      );
      newControls.enableDamping = true;
      newControls.dampingFactor = 0.05;
      newControls.autoRotate = true;
      newControls.autoRotateSpeed = 0.5;
      newControls.enableZoom = true;
      newControls.maxPolarAngle = Math.PI / 2.2;
      newControls.target.set(0, 10, 0);
      controls.value = newControls;
    }

    // 添加基础光照
    initLights();

    // 添加辅助元素
    if (config.value.showGrid && scene.value) {
      scene.value.add(markRaw(createGrid(400, 40)));
    }
    if (config.value.showAxes && scene.value) {
      scene.value.add(markRaw(createAxesHelper(100)));
    }

    isReady.value = true;
  }

  /**
   * 初始化光照
   */
  function initLights(): void {
    if (!scene.value) return;

    const ambient = markRaw(
      createAmbientLight(0x404060, config.value.ambientLightIntensity),
    );
    scene.value.add(ambient);
    ambientLight.value = ambient;

    const directional = markRaw(
      createDirectionalLight(0xfff5d1, config.value.directionalLightIntensity),
    );
    scene.value.add(directional);
    directionalLight.value = directional;

    const fillLight1 = markRaw(
      createPointLight(0x4466ff, 0.4, new THREE.Vector3(-30, 40, 30)),
    );
    const fillLight2 = markRaw(
      createPointLight(0xff9966, 0.3, new THREE.Vector3(40, 30, -30)),
    );
    scene.value.add(fillLight1);
    scene.value.add(fillLight2);
  }

  /**
   * 切换日夜模式
   */
  function toggleNightMode(): void {
    const currentScene = scene.value;
    const currentAmbient = ambientLight.value;
    const currentDirectional = directionalLight.value;

    if (!currentScene || !currentAmbient || !currentDirectional) return;

    config.value.isNightMode = !config.value.isNightMode;

    if (config.value.isNightMode) {
      currentScene.background = new THREE.Color(0x0a0a1a);
      currentAmbient.intensity = 0.2;
      currentAmbient.color.setHex(0x335588);
      currentDirectional.intensity = 0.3;
      currentDirectional.color.setHex(0xaaccff);
    } else {
      currentScene.background = new THREE.Color(0x0a1628);
      currentAmbient.intensity = config.value.ambientLightIntensity;
      currentAmbient.color.setHex(0x404060);
      currentDirectional.intensity = config.value.directionalLightIntensity;
      currentDirectional.color.setHex(0xfff5d1);
    }
  }

  /**
   * 添加物体到场景
   */
  function addToScene(...objects: THREE.Object3D[]): void {
    const currentScene = scene.value;
    if (!currentScene) return;

    objects.forEach((obj) => {
      currentScene.add(markRaw(obj));
    });
  }

  /**
   * 从场景移除物体
   */
  function removeFromScene(...objects: THREE.Object3D[]): void {
    const currentScene = scene.value;
    if (!currentScene) return;
    objects.forEach((obj) => currentScene.remove(obj));
  }

  /**
   * 动画循环
   */
  function animate(): void {
    const currentScene = scene.value;
    const currentCamera = camera.value;
    const currentRenderer = renderer.value;
    const currentLabelRenderer = labelRenderer.value;
    const currentControls = controls.value;

    if (
      !currentScene ||
      !currentCamera ||
      !currentRenderer ||
      !currentLabelRenderer ||
      !currentControls
    ) {
      return;
    }

    animationId = requestAnimationFrame(animate);

    // FPS计算
    frameCount++;
    const now = performance.now();
    if (now - lastTime >= 1000) {
      fps.value = frameCount;
      frameCount = 0;
      lastTime = now;
    }

    currentControls.update();

    currentRenderer.render(currentScene, currentCamera);
    currentLabelRenderer.render(currentScene, currentCamera);
  }

  /**
   * 开始动画
   */
  function startAnimation(): void {
    if (animationId) cancelAnimationFrame(animationId);
    lastTime = performance.now();
    animate();
  }

  /**
   * 停止动画
   */
  function stopAnimation(): void {
    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
  }

  /**
   * 处理窗口大小变化
   */
  function handleResize(): void {
    if (
      !containerRef.value ||
      !camera.value ||
      !renderer.value ||
      !labelRenderer.value
    )
      return;

    const width = containerRef.value.clientWidth;
    const height = containerRef.value.clientHeight;

    camera.value.aspect = width / height;
    camera.value.updateProjectionMatrix();

    renderer.value.setSize(width, height);
    labelRenderer.value.setSize(width, height);
  }

  /**
   * 聚焦到指定位置
   */
  function focusOn(target: THREE.Vector3, distance: number = 30): void {
    if (!camera.value || !controls.value) return;

    const direction = new THREE.Vector3()
      .subVectors(camera.value.position, controls.value.target)
      .normalize();
    const newPosition = new THREE.Vector3()
      .copy(target)
      .add(direction.multiplyScalar(distance));

    camera.value.position.copy(newPosition);
    controls.value.target.copy(target);
    controls.value.update();
  }

  /**
   * 销毁场景
   */
  function dispose(): void {
    stopAnimation();

    if (renderer.value) {
      renderer.value.dispose();
      renderer.value.domElement.remove();
    }
    if (labelRenderer.value) {
      labelRenderer.value.domElement.remove();
    }

    scene.value = null;
    camera.value = null;
    renderer.value = null;
    labelRenderer.value = null;
    controls.value = null;
  }

  onMounted(() => {
    initScene();
    startAnimation();
    window.addEventListener("resize", handleResize);
  });

  onUnmounted(() => {
    window.removeEventListener("resize", handleResize);
    dispose();
  });

  return {
    // 核心对象
    scene,
    camera,
    renderer,
    labelRenderer,
    controls,
    // 状态
    isReady,
    config,
    fps,
    // 方法
    addToScene,
    removeFromScene,
    toggleNightMode,
    focusOn,
    handleResize,
  };
}
